import { Injectable } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ILatLng } from '../interfaces/lat-lng';
import { YelpService } from '../api/yelp.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  latlng: Subject<ILatLng> = new Subject();
  term: Subject<string> = new Subject();
  radius: Subject<number> = new Subject();

  constructor(
    private yelp:YelpService,
  ) {
    const term$ = this.term.pipe(
      distinctUntilChanged(),
    ),
    latlng$ = this.latlng.pipe(
      distinctUntilChanged(),
    ),
    radius$ = this.radius.pipe(
      distinctUntilChanged(),
    );

    combineLatest(term$, latlng$, radius$).pipe(
      switchMap(this.yelp.getBusinesses.bind(this.yelp))
    );


  }
}
