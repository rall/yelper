import { Injectable } from '@angular/core';
import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, switchMap, map, pluck, concatAll, debounceTime } from 'rxjs/operators';
import { YelpService } from '../api/yelp.service';
import { ILatLng } from '@ionic-native/google-maps/ngx';
import { Coordinates } from '../interfaces/coordinates';
import { SearchData } from '../interfaces/search-data';
import { debug } from '../modules/rxjs-helpers';

function latLngToCoordinates(latlng:ILatLng):Coordinates {
  return <Coordinates>{
      latitude: String(latlng.lat),
      longitude: String(latlng.lng)
  }
}

function coordinatesEquality(a: Coordinates, b: Coordinates) {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

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
      debounceTime(1000),
      switchMap(getBusinesses),
      debug('search'),
    ).subscribe(this.searchSubject);
  }
}
