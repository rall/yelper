import { Component, OnInit, Input, ChangeDetectorRef, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject, Observable, from, combineLatest, BehaviorSubject, merge, zip, fromEvent } from 'rxjs';
import { GoogleMap, GoogleMapsEvent, ILatLng, CameraPosition, GoogleMapOptions, MarkerOptions, Marker, VisibleRegion } from '@ionic-native/google-maps/ngx';
import { switchMap, share, mapTo, shareReplay, switchMapTo, pluck, map, toArray, withLatestFrom, sample, every, startWith, debounceTime, concatAll, mergeMap, pairwise, concatMap, filter, tap, distinctUntilChanged } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { eventHandler, filterTrue, filterFalse, filterPresent, debug, selectIn, filterEmpty } from 'src/app/helpers/rxjs-helpers';
import { Business } from 'src/app/interfaces/business';
import { MapUIEvent } from 'src/app/interfaces/map-ui-event';
import { MapCreatorService } from './services/map-creator.service';
import { MarkerService } from './services/marker.service';
import { SearchService } from 'src/app/services/search.service';

function radiusLimit(limit: number) {
  return function(radius:number):number {
    return radius > limit ? limit : radius;
  }
}

// https://gis.stackexchange.com/a/127949
function positionToMetersPerPx(position:CameraPosition<ILatLng>):number {
  const lat = position.target.lat;
  return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, position.zoom);
}

@Component({
  selector: 'bf-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})

export class GoogleMapComponent implements OnInit, AfterViewInit {
  @ViewChild("redo", { read: ElementRef }) ouputSubjectButton:ElementRef;
  
  @Input() pageReadySubject: Subject<boolean>;
  @Input() allowRedo$: Observable<boolean>;
  @Input() clicks$:Observable<MapUIEvent>;
  @Input() pad$:Observable<number>;

  redoSearchSubject: Subject<boolean> = new Subject();
  @Output() redoSearch$:Observable<boolean> = this.redoSearchSubject.asObservable();

  mapClickSubject: Subject<MapUIEvent> = new Subject();
  @Output() clickTracker$:Observable<MapUIEvent> = this.mapClickSubject.asObservable();
  
  googleMapReady$:Observable<GoogleMap>;
  platformDimension$: Observable<number>;

  setBoundsSubject:Subject<boolean> = new Subject();
  clearMapSubject:Subject<boolean> = new Subject();

  markersContained$:BehaviorSubject<boolean>= new BehaviorSubject(true);
  disableRedoButton$:Observable<boolean>;

  constructor(
    private platform: Platform,
    private mapCreator: MapCreatorService,
    private changeDetectorRef: ChangeDetectorRef,
    private _el: ElementRef<HTMLElement>,
    private markerService:MarkerService,
    private searchService:SearchService,
  ) {
    this.platformDimension$ = from(this.platform.ready()).pipe(
      filter(readysource => readysource === "cordova"),
      mapTo(Math.min(this.platform.height(), this.platform.width())),
      shareReplay(1),
    );
    this.searchService.results$.subscribe(this.markerService.businessesSubject);
  }

  ngAfterViewInit() {
    fromEvent(this.ouputSubjectButton.nativeElement, "click").pipe(
      mapTo(true),
    ).subscribe(this.redoSearchSubject);

    this.mapCreator.createMap(this.pageReadySubject);
  }

  ngOnInit() {
    this.mapCreator.prepare(this._el);

    this.disableRedoButton$ = this.allowRedo$.pipe(
      startWith(false),
      map(redo => !redo),
    );

    merge(this.markersContained$, this.disableRedoButton$).pipe(
      debounceTime(100),
      mapTo(this.changeDetectorRef),
    ).subscribe(ref => ref.detectChanges());

    const mapCleared$:Observable<boolean> = this.searchService.results$.pipe(
      switchMapTo(this.mapCreator.googleMapReady$),
      switchMap(googleMap => googleMap.clear()),
      mapTo(true),
    );

    zip(this.searchService.results$, mapCleared$).pipe(
      map(([results]) => results),
      filterEmpty(),
      mapTo(true),
    ).subscribe(this.markersContained$);

    const markerArray$:Observable<Marker[]> = zip(this.markerService.markerOpts$, mapCleared$).pipe(
      map(([opts]) => opts),
      withLatestFrom(this.mapCreator.googleMapReady$),
      switchMap(([opts, mapObject]) => from(opts).pipe(
        map(opts => mapObject.addMarkerSync(opts)),
        toArray(),
      )),
      shareReplay(1),
    );

    const markerClicks$:Observable<[ILatLng, Marker]> = markerArray$.pipe(
      concatAll(),
      mergeMap(marker => eventHandler(marker, GoogleMapsEvent.MARKER_CLICK)),
      share(),
    )
    
    const mapClick$ = this.mapCreator.googleMapReady$.pipe(
      switchMap(googleMap => eventHandler(googleMap, GoogleMapsEvent.MAP_CLICK)),
      mapTo(-1),
      share(),
    );

    merge(
      markerClicks$.pipe(
        map(([_, marker]) => marker),
        withLatestFrom(markerArray$),
        map(([marker, ary]) => ary.indexOf(marker))
      ),
      mapClick$
    ).pipe(
      map(index => <MapUIEvent>{event: "mapclick", index: index})
    ).subscribe(this.mapClickSubject);

    /* set  bounds */

    const markersLatlngs$ = this.markerService.markerOpts$.pipe(
      switchMap(opts => from(opts).pipe(
        pluck("position"),
        toArray(),
      )),
      shareReplay(1),
    );

    const mapPositionOpts$ = markersLatlngs$.pipe(
      filterPresent(),
      map(latlngArray => <CameraPosition<ILatLng[]>>{ target: latlngArray }),
      map(cameraPosition => <GoogleMapOptions>{ camera: cameraPosition }),
    );


    /* track current and previous markers to identify by displaying info window */

    const identifyPair$:Observable<number[]> = this.clicks$.pipe(
      filter<MapUIEvent>(event => event.event === "click"),
      map(evt => evt.index),
      debounceTime(200),
      startWith(-1),
      pairwise(),
      share(),
    );

    identifyPair$.pipe(
      filter(([previous, current]) => previous !== current),
      map(([previous]) => previous),
      selectIn(markerArray$),
      filterTrue<Marker>(),
      filter(marker => marker.isInfoWindowShown()),
    ).subscribe(marker => marker.hideInfoWindow());

    identifyPair$.pipe(
      map(([_, current]) => current),
      selectIn(markerArray$),
      filterTrue<Marker>(),
      filter(marker => !marker.isInfoWindowShown()),
    ).subscribe(marker => marker.showInfoWindow());

    /* show current markers by zooming to location */


    this.clicks$.pipe(
      filter<MapUIEvent>(event => event.event === "doubleclick"),
      map(evt => evt.index),
      selectIn(markerArray$),
      filterTrue<Marker>(),
      map(marker => [ marker.getMap(), marker.getPosition()]),
      switchMap(([mapObject, position]:[GoogleMap, ILatLng]) => mapObject.animateCamera(<CameraPosition<ILatLng>>{ target: position, zoom: 19, duration: 200 })),
    ).subscribe();



    /* update camera position after each camera move event */

    const cameraMove$:Observable<CameraPosition<ILatLng>> = this.mapCreator.googleMapReady$.pipe(
      switchMap(googleMap => eventHandler(googleMap, GoogleMapsEvent.CAMERA_MOVE_END)),
      map(([position]) => position),
      share(),
    );

    combineLatest(mapPositionOpts$, cameraMove$).pipe(
      map(([opts]) => opts),
      sample(this.setBoundsSubject),
      withLatestFrom(this.mapCreator.googleMapReady$),
    ).subscribe(
      ([cameraPosition, googleMap]) => googleMap.setOptions(cameraPosition)
    );

    function markersInRegion([markers, visibleRegion]:[Marker[], VisibleRegion]) {
      return from(markers).pipe(
        map(marker => marker.getPosition()),
        every(latlng => visibleRegion.contains(latlng)),
      );     
    };

    const visibleRegion$ = this.mapCreator.googleMapReady$.pipe(
      map(googleMap => googleMap.getVisibleRegion()),
    );

    merge(cameraMove$, markerArray$).pipe(
      switchMapTo(
        combineLatest(markerArray$, visibleRegion$)
      ),
      switchMap(markersInRegion),
      startWith(true),
    ).subscribe(this.markersContained$);
  
  
    /* update approximate search radius in meters from current camera position */

    cameraMove$.pipe(
      map(positionToMetersPerPx),
      withLatestFrom(this.platformDimension$),
      map(([scale, pixels]:[number, number]) => scale * pixels),
      map(diameter => Math.round(diameter/2)),
      map(radiusLimit(40_000)),
    ).subscribe(this.searchService.radiusSubject);

    /* update latlng from current camera position */

    cameraMove$.pipe(
      pluck("target"),
    ).subscribe(this.searchService.latlngSubject);

    /* Set the map bottom padding to make room for the slides */

    this.pad$.pipe(
      distinctUntilChanged(),
      map(pad => [0, pad, 0]),
      withLatestFrom(this.mapCreator.googleMapReady$),
    ).subscribe(([pad, googlemap]) => googlemap.setPadding(0, ...pad));
  }

}
