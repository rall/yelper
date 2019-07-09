import { Injectable } from '@angular/core';
import { Subject, combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, switchMap, map, sample, pluck, filter, mapTo, withLatestFrom } from 'rxjs/operators';
import { YelpService } from '../api/yelp.service';
import { ILatLng, Spherical } from '@ionic-native/google-maps/ngx';
import { SearchData } from '../interfaces/search-data';
import { debug } from '../modules/rxjs-helpers';
import { latLngToCoordinates, coordinatesToLatLng, coordinatesEquality } from '../modules/geo-helpers';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  triggerSubject: Subject<boolean> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();
  termSubject: Subject<string> = new Subject();
  radiusSubject: Subject<number> = new Subject();
  searchSubject: Subject<SearchData> = new Subject();
  redoReadySubject: Subject<boolean> = new Subject();

  constructor(
    private yelp:YelpService,
  ) {
    const term$ = this.termSubject.pipe(
      distinctUntilChanged(),
    ),

    latlng$ = this.latlngSubject.pipe(
      map(latLngToCoordinates),
      distinctUntilChanged(coordinatesEquality),
    ),

    radius$ = this.radiusSubject.pipe(
      distinctUntilChanged(),
    );

    const getBusinesses = this.yelp.getBusinesses.bind(this.yelp);

    combineLatest(term$, latlng$, radius$).pipe(
      debug('params'),
      sample(this.triggerSubject),
      switchMap(getBusinesses),
      debug('search'),
    ).subscribe(this.searchSubject);

    const currentLatLng$ = this.searchSubject.pipe(
      pluck("region", "center"),
      map(coordinatesToLatLng),
    );

    const latLngDelta$ = combineLatest(currentLatLng$, this.latlngSubject).pipe(
      map(([a,b]) => Spherical.computeDistanceBetween(a, b)),
    );

    const currentRadius$ = radius$.pipe(
      sample(this.searchSubject),
    );

    const radiusDelta$ = combineLatest(currentRadius$, radius$).pipe(
      map(([a, b]) => Math.abs(a - b)),
    );

    const lastRadius$:Observable<number> = radius$.pipe(
      sample(this.triggerSubject),
    );

    merge(latLngDelta$, radiusDelta$).pipe(
      withLatestFrom(lastRadius$),
      filter(([delta, lastRadius]) => delta > (lastRadius / 2)),
      mapTo(true),
    ).subscribe(this.redoReadySubject);

    combineLatest(latLngDelta$, radiusDelta$).pipe(
      filter(([a, b]) => a== 0 && b == 0),
      mapTo(false),
    ).subscribe(this.redoReadySubject);

    this.searchSubject.pipe(
      mapTo(false),
    ).subscribe(this.redoReadySubject);
  }
}
