import { Injectable } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, switchMap, map, sample } from 'rxjs/operators';
import { YelpService } from '../api/yelp.service';
import { ILatLng } from '@ionic-native/google-maps/ngx';
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
  }
}
