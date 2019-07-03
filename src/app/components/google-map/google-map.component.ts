import { Component, OnInit, Input } from '@angular/core';
import { Subject, Observable, from, combineLatest, of, BehaviorSubject } from 'rxjs';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, ILatLng, CameraPosition, GoogleMapOptions } from '@ionic-native/google-maps/ngx';
import { switchMap, share, mapTo, take, shareReplay, filter, switchMapTo, pluck, concatAll, map, toArray, withLatestFrom, distinctUntilChanged, startWith, sample, takeUntil, repeatWhen } from 'rxjs/operators';
import googleMapOptions from './google-map.options';
import { Platform } from '@ionic/angular';
import { SearchService } from 'src/app/services/search.service';
import { mapToEventStream, debug, eventHandler } from 'src/app/modules/rxjs-helpers';
import { Coordinates } from 'src/app/interfaces/coordinates'

function coordinatesToLatLng(coordinates:Coordinates):ILatLng {
  return <ILatLng>{
      lat: Number(coordinates.latitude),
      lng: Number(coordinates.longitude)
  }
}


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
  platformDimension$: Observable<number>;

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

    this.platformDimension$ = platformReady$.pipe(
      mapTo(Math.min(this.platform.height(), this.platform.width())),
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
    
    const latLngBounds$ = businesses$.pipe(
      switchMap(businesses => of(businesses).pipe(
        take(1),
        concatAll(),
        pluck("coordinates"),
        map(coordinatesToLatLng),
        toArray(),
      )),
    );

    /* freeze subject to prevent new searches when map move event is triggered by a bounds redraw */

    const freezeSubject:BehaviorSubject<boolean> = new BehaviorSubject(false);

    /* set  bounds */
    const mapPositionOpts$ = latLngBounds$.pipe(
      sample(this.setBoundsSubject),
      filter(latlngArray => latlngArray.length > 0),
      map(latlngArray => <CameraPosition<ILatLng[]>>{ target: latlngArray }),
      map(cameraPosition => <GoogleMapOptions>{ camera: cameraPosition }),
      share(),
    );

    combineLatest(this.googleMapReady$, mapPositionOpts$).pipe(
      mapTo(true),
    ).subscribe(freezeSubject);

    /* update camera position after each camera move event */

    const cameraMove$:Observable<CameraPosition<ILatLng>> = this.map$.pipe(
      mapToEventStream<[CameraPosition<ILatLng>, any]>(GoogleMapsEvent.CAMERA_MOVE_END),
      map(([position]) => position),
      share(),
    );

    
    combineLatest(this.googleMapReady$, mapPositionOpts$).pipe(
      switchMapTo(
        cameraMove$.pipe(
          take(1),
        )
      ),
      mapTo(false),
      debug('unfreeze'),
    ).subscribe(freezeSubject);

    combineLatest(this.googleMapReady$, mapPositionOpts$).subscribe(
      ([googleMap, cameraPosition]) => googleMap.setOptions(cameraPosition)
    );


    const freeze$ = freezeSubject.pipe(
      filter(Boolean),
    );

    const unfreeze$ = freezeSubject.pipe(
      filter(freeze => !freeze),
    );
    
    /* update approximate search radius in meters from current camera position */

    cameraMove$.pipe(
      takeUntil(freeze$),
      repeatWhen(() => unfreeze$),
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
      takeUntil(freeze$),
      repeatWhen(() => unfreeze$),
      pluck("target"),
    ).subscribe(this.searchService.latlngSubject);
  }
}
