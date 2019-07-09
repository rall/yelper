import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Business } from '../interfaces/business';
import { SearchService } from '../services/search.service';
import { pluck } from 'rxjs/operators';

@Component({
  selector: 'app-google-map-page',
  templateUrl: 'google-map.page.html',
  styleUrls: ['google-map.page.scss'],
})
export class GoogleMapPage implements OnInit {
  readySubject: Subject<boolean> = new Subject();
  results$:Observable<Business[]>;

  constructor(
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    this.results$ = this.searchService.searchSubject.pipe(
      pluck("businesses"),
    )
  }

  ionViewDidEnter() {
    this.readySubject.next(true);
  }

  ionViewWillLeave() {
    this.readySubject.next(false);
  }
}
