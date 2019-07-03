import { Component, OnInit, Input } from '@angular/core';
import { Subject, fromEventPattern, Observable, from } from 'rxjs';
import { GoogleMaps, GoogleMap, GoogleMapsEvent } from '@ionic-native/google-maps/ngx';
import { switchMap, share, mapTo, take, shareReplay, filter, switchMapTo } from 'rxjs/operators';
import googleMapOptions from './google-map.options';
import { Platform } from '@ionic/angular';
import { mapToEventStream } from 'src/app/modules/rxjs-helpers';
import { SearchService } from 'src/app/services/search.service';


// https://gis.stackexchange.com/a/81390
function zoomLevelToScale(level:number):number {
  return 591657550.5 / Math.pow(2, level - 1);
}

function pixelsToMeters([scale, pixels]:[number, number]):number {
  const screenInches = pixels / 96;
  const screenMeters = screenInches * 0.0254;
  return screenMeters * scale;
}

function apiRadiusLimit(radius:number):number {
  return radius > 40000 ? 40000 : radius;
}

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})

export class GoogleMapComponent implements OnInit {
  @Input() pageReadySubject: Subject<boolean>;

  map$:Observable<GoogleMap>;
  googleMapReady$:Observable<GoogleMap>;
  setBoundsSubject:Subject<boolean> = new Subject();

  constructor(
    private platform: Platform,
    private searchService: SearchService,
  ) {
    const platformReady$ = from(this.platform.ready());

    this.map$ = platformReady$.pipe(
      mapTo(GoogleMaps.create(googleMapOptions)),
      take(1),
      shareReplay(1),
    );
    
    const readyEvent$ = this.map$.pipe(
      map(mapObject => eventHandler(mapObject, GoogleMapsEvent.MAP_READY)),
    );

    this.googleMapReady$ = this.map$.pipe(
      sample(readyEvent$),
      shareReplay(1),
    );

    this.googleMapReady$.subscribe(mapObject => mapObject.setOptions(googleMapOptions));
  }

  ngOnInit() {
    const showMap$ = this.pageReadySubject.pipe(
      filter(Boolean),
      switchMapTo(this.map$),
      share(),
    );

    showMap$.subscribe(mapObject => mapObject.setVisible(true));

    showMap$.subscribe(mapObject => mapObject.setDiv('map-canvas'));

    const hideMap$ = this.pageReadySubject.pipe(
      filter(show => !show),
      switchMapTo(this.map$),
      share(),
    );

    hideMap$.subscribe(mapObject => mapObject.setDiv());

    hideMap$.subscribe(mapObject => mapObject.setVisible(false));

    const search$ = this.googleMapReady$.pipe(
      switchMapTo(this.searchService.searchSubject),
    );

    const businesses$ = search$.pipe(
      pluck("businesses"),
      startWith([]),
      share(),
    );
    /* update camera position after each camera move event */

    const cameraMove$:Observable<CameraPosition<ILatLng>> = this.map$.pipe(
      mapToEventStream<[CameraPosition<ILatLng>, any]>(GoogleMapsEvent.CAMERA_MOVE_END),
      map(([position]) => position),
      share(),
    );

    /* update approximate search radius in meters from current camera position */

    cameraMove$.pipe(
      pluck("zoom"),
      distinctUntilChanged(),
      filter<number>(Boolean),
      map(zoomLevelToScale),
      withLatestFrom(this.platformDimension$),
      map(pixelsToMeters),
      map(Math.round),
      map(apiRadiusLimit),
    ).subscribe(this.searchService.radiusSubject);

    /* update latlng from current camera position */

    cameraMove$.pipe(
      pluck("target"),
    ).subscribe(this.searchService.latlngSubject);
    
  }
}
