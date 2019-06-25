import { Component } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-google-map',
  templateUrl: 'google-map.page.html',
  styleUrls: ['google-map.page.scss']
})
export class GoogleMapPage {
  readySubject: Subject<boolean> = new Subject();

  constructor() {}

  ionViewDidEnter() {
    this.readySubject.next(true);
    this.readySubject.complete();
  }
}
