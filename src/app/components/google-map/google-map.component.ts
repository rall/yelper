import { Component, OnInit, Input } from '@angular/core';
import { Subject, Observable, from, forkJoin } from 'rxjs';
import { GoogleMaps, GoogleMap } from '@ionic-native/google-maps/ngx';
import { map, tap, share, mapTo, take } from 'rxjs/operators';
import googleMapOptions from './google-map.options';
import { Platform } from '@ionic/angular';

export function debug<T>(message) {
  return tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'));
}

@Component({
  selector: 'google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})

export class GoogleMapComponent implements OnInit {
  @Input() pageReadySubject: Subject<boolean>;

  map$:Observable<GoogleMap>;

  constructor(
    private platform: Platform,
  ) {
    this.map$ = from(this.platform.ready()).pipe(
      mapTo(GoogleMaps.create(googleMapOptions)),
      take(1),
    );
  }

  ngOnInit() {
    const showMap$ = forkJoin(this.map$, this.pageReadySubject).pipe(
      map(([mapObject]:[GoogleMap, boolean]) => mapObject),
      share(),
    );
    showMap$.subscribe(mapObject => mapObject.setDiv('map-canvas'));
    showMap$.subscribe(mapObject => mapObject.setVisible(true));
  }
}
