import { Component, OnInit, Input } from '@angular/core';
import { Subject, Observable, from, combineLatest, BehaviorSubject, merge, zip } from 'rxjs';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, ILatLng, CameraPosition, GoogleMapOptions, MarkerOptions, Marker, VisibleRegion } from '@ionic-native/google-maps/ngx';
import { switchMap, share, mapTo, take, shareReplay, switchMapTo, pluck, map, toArray, withLatestFrom, distinctUntilChanged, sample, every, startWith } from 'rxjs/operators';
import googleMapOptions from './google-map.options';
import { Platform } from '@ionic/angular';
import { SearchService } from 'src/app/services/search.service';
import { mapToEventStream, eventHandler, filterTrue, filterFalse, filterPresent } from 'src/app/modules/rxjs-helpers';
import { Business } from 'src/app/interfaces/business';
import { coordinatesToLatLng, latlngToMarkerOpts, zoomLevelToScale, pixelsToMeters, apiRadiusLimit } from 'src/app/modules/geo-helpers';

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})

export class GoogleMapComponent implements OnInit {
  @Input() pageReadySubject: Subject<boolean>;
  @Input() results$:Observable<Business[]>;

  googleMap$:Observable<GoogleMap>;
  googleMapReady$:Observable<GoogleMap>;
  platformDimension$: Observable<number>;

  setBoundsSubject:Subject<boolean> = new Subject();
  clearMapSubject:Subject<boolean> = new Subject();
  markersContained$:BehaviorSubject<boolean>= new BehaviorSubject(true);

  constructor(
    private platform: Platform,
    private searchService: SearchService,
  ) {
    const platformReady$ = from(this.platform.ready());

    this.googleMap$ = platformReady$.pipe(
      mapTo(GoogleMaps.create(googleMapOptions)),
      take(1),
      shareReplay(1),
    );

    this.platformDimension$ = platformReady$.pipe(
      mapTo(Math.min(this.platform.height(), this.platform.width())),
      shareReplay(1),
    );
    
    const readyEvent$ = this.googleMap$.pipe(
      map(mapObject => eventHandler(mapObject, GoogleMapsEvent.MAP_READY)),
    );

    this.googleMapReady$ = this.googleMap$.pipe(
      sample(readyEvent$),
      shareReplay(1),
    );

    this.googleMapReady$.subscribe(mapObject => mapObject.setOptions(googleMapOptions));
  }

  ngOnInit() {
    const showMap$ = this.pageReadySubject.pipe(
      filterTrue(),
      switchMapTo(this.googleMap$),
      share(),
    );

    showMap$.subscribe(mapObject => mapObject.setVisible(true));

    showMap$.subscribe(mapObject => mapObject.setDiv('map-canvas'));

    const hideMap$ = this.pageReadySubject.pipe(
      filterFalse(),
      switchMapTo(this.googleMap$),
      share(),
    );

    hideMap$.subscribe(mapObject => mapObject.setDiv());

    hideMap$.subscribe(mapObject => mapObject.setVisible(false));


    const mapCleared$:Observable<boolean> = this.results$.pipe(
      switchMapTo(this.googleMapReady$),
      switchMap(map => map.clear()),
      mapTo(true),
    );

    const businesses$:Observable<Business[]> = zip(this.results$, mapCleared$).pipe(
      map(([results]) => results),
      shareReplay(1),
    );

    function businessesToMarkerOpts(businesses) {
      const latlngOpts$ = from(businesses).pipe(
        pluck("coordinates"),
        map(coordinatesToLatLng),
        map(latlngToMarkerOpts),
      );

      const names$ = from(businesses).pipe(
        pluck("name"),
        map(name => ` ${name}`)
      );

      return zip(latlngOpts$, names$).pipe(
        map(([opts, title]) => <MarkerOptions>{...opts, title: title, disableAutoPan: true}),
        toArray(),
      )
    }

    const markerOptArray$ = businesses$.pipe(
      switchMap(businessesToMarkerOpts),
    );

    const markerArray$ = markerOptArray$.pipe(
      withLatestFrom(this.googleMap$),
      switchMap(([opts, mapObject]) => from(opts).pipe(
        map(opts => mapObject.addMarkerSync(opts)),
        toArray(),
      )),
      shareReplay(1),
    );

    /* set  bounds */

    const markersLatlngs$ = markerOptArray$.pipe(
      switchMap(opts => from(opts).pipe(
        pluck("position"),
        toArray(),
      )),
    );

    const mapPositionOpts$ = this.setBoundsSubject.pipe(
      switchMapTo(markersLatlngs$),
      filterPresent(),
      map(latlngArray => <CameraPosition<ILatLng[]>>{ target: latlngArray }),
      map(cameraPosition => <GoogleMapOptions>{ camera: cameraPosition }),
      share(),
    );

    /* update camera position after each camera move event */

    const cameraMove$:Observable<CameraPosition<ILatLng>> = this.googleMap$.pipe(
      mapToEventStream<[CameraPosition<ILatLng>, any]>(GoogleMapsEvent.CAMERA_MOVE_END),
      map(([position]) => position),
      share(),
    );

    combineLatest(this.googleMapReady$, mapPositionOpts$).pipe(
      sample(this.setBoundsSubject),
    ).subscribe(
      ([googleMap, cameraPosition]) => googleMap.setOptions(cameraPosition)
    );

    function markersInRegion([markers, visibleRegion]:[Marker[], VisibleRegion]) {
      return from(markers).pipe(
        map(marker => marker.getPosition()),
        every(latlng => visibleRegion.contains(latlng)),
      );     
    };

    const visibleRegion$ = this.googleMapReady$.pipe(
      map(googleMap => googleMap.getVisibleRegion()),
    );

    merge(cameraMove$, markerArray$).pipe(
      switchMapTo(
        combineLatest(markerArray$, visibleRegion$)
      ),
      switchMap(markersInRegion),
      startWith(true),
    ).subscribe(this.markersContained$);
    
    businesses$.pipe(
      pluck("length"),
      filterFalse(),
      mapTo(true),
    ).subscribe(this.markersContained$);

    /* update approximate search radius in meters from current camera position */

    cameraMove$.pipe(
      pluck("zoom"),
      distinctUntilChanged(),
      filterTrue(),
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
