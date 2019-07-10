import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Business } from '../../interfaces/business';
import { SearchService } from '../../services/search.service';
import { pluck } from 'rxjs/operators';
import { ILatLng } from '@ionic-native/google-maps/ngx';

@Component({
  selector: 'app-google-map-page',
  templateUrl: 'google-map.page.html',
  styleUrls: ['google-map.page.scss'],
})
export class GoogleMapPage implements OnInit {
  readySubject: Subject<boolean> = new Subject();
  results$: Observable<Business[]>;
  allowRedo$: Observable<boolean>;

  radiusSubject: Subject<number> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();
  indexSubject: Subject<number> = new Subject();

  constructor(
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    this.results$ = this.searchService.searchSubject.pipe(
      pluck("businesses"),
    );
    this.allowRedo$ = this.searchService.redoReadySubject.asObservable();
    this.radiusSubject.subscribe(this.searchService.radiusSubject);
    this.latlngSubject.subscribe(this.searchService.latlngSubject);
  }

  ionViewDidEnter() {
    this.readySubject.next(true);
  }

  ionViewWillLeave() {
    this.readySubject.next(false);
  }

  onRedoSearch(arg) {
    this.searchService.triggerSubject.next(true);
  }
}
