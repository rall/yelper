import { Component, OnInit } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { Business } from '../../interfaces/business';
import { SearchService } from '../../services/search.service';
import { pluck } from 'rxjs/operators';
import { ILatLng } from '@ionic-native/google-maps/ngx';

@Component({
  selector: 'app-business-finder-page',
  templateUrl: 'business-finder.page.html',
  styleUrls: ['business-finder.page.scss'],
})
export class BusinessFinderPage implements OnInit {

  readySubject: Subject<boolean> = new Subject();
  results$: Observable<Business[]>;
  allowRedo$: Observable<boolean>;

  radiusSubject: Subject<number> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();
  indexSubject: BehaviorSubject<number> = new BehaviorSubject(-1);

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

  onRedoSearch(val:boolean) {
    this.searchService.triggerSubject.next(val)
  }

  ionViewDidEnter() {
    this.readySubject.next(true);
  }

  ionViewWillLeave() {
    this.readySubject.next(false);
  }
}
