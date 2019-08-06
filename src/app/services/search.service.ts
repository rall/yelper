import { Injectable } from '@angular/core';
import { Subject, combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, switchMap, map, sample, pluck, filter, mapTo, withLatestFrom, share, shareReplay } from 'rxjs/operators';
import { YelpService } from '../api/yelp.service';
import { ILatLng, Spherical } from '@ionic-native/google-maps/ngx';
import { SearchData } from '../interfaces/search-data';
import { debug, filterTrue } from '../helpers/rxjs-helpers';
import { latLngToCoordinates, coordinatesToLatLng } from '../helpers/geo-helpers';

function coordinatesEquality(a: Coordinates, b: Coordinates) {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  triggerSubject: Subject<boolean> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();
  termSubject: Subject<string> = new Subject();
  radiusSubject: Subject<number> = new Subject();
  redoReadySubject: Subject<boolean> = new Subject();
  
  private searchSubject: Subject<SearchData> = new Subject();
  
  results$ = this.searchSubject.pipe(
    pluck("businesses"),
    shareReplay(1),
  );

  error$ = this.searchSubject.pipe(
    pluck("error"),
    filterTrue(),
  );

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
      sample(this.triggerSubject),
      switchMap(getBusinesses),
    ).subscribe(this.searchSubject);

    // the latlng from last search taken from the search data object
    const currentLatLng$ = this.searchSubject.pipe(
      pluck("region", "center"),
      filterTrue(),
      map(coordinatesToLatLng),
    );

    const latLngDelta$ = combineLatest(currentLatLng$, this.latlngSubject).pipe(
      map(([a,b]) => Spherical.computeDistanceBetween(a, b)),
    );

    // the radius at the time of the last search
    const currentRadius$ = radius$.pipe(
      sample(this.triggerSubject),
    );

    const radiusDelta$ = combineLatest(currentRadius$, radius$).pipe(
      map(([a, b]) => Math.abs(a - b)),
    );

    merge(latLngDelta$, radiusDelta$).pipe(
      withLatestFrom(currentRadius$),
      filter(([delta, currentRadius]) => delta > (currentRadius / 2)),
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
