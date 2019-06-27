import { Component, OnInit, Input } from '@angular/core';
import { Subject, fromEventPattern, Observable, from, forkJoin } from 'rxjs';
import { GoogleMaps, GoogleMap, GoogleMapsEvent } from '@ionic-native/google-maps/ngx';
import { switchMap, map, tap, share, mapTo, pluck, take, shareReplay } from 'rxjs/operators';
import googleMapOptions from './google-map.options';
import { Platform } from '@ionic/angular';

function handleMapEvent(target: GoogleMap, type: string): Observable<any> {
  const add = handler => target.addEventListener(type).subscribe(handler);
  const remove = handler => target.removeEventListener(handler);
  return fromEventPattern(add, remove);
}

@Component({
  selector: 'google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})

export class GoogleMapComponent implements OnInit {
  @Input() pageReadySubject: Subject<boolean>;

  map$:Observable<GoogleMap>;
  mapReady$:Observable<boolean>;

  constructor(
    private platform: Platform,
  ) {
    this.map$ = from(this.platform.ready()).pipe(
      mapTo(GoogleMaps.create(googleMapOptions)),
      take(1),
      shareReplay(1),
    );
    
    const mapReadyEvent$ = this.map$.pipe(
      switchMap(mapObject => handleMapEvent(mapObject, GoogleMapsEvent.MAP_READY)),
      mapTo(true),
      shareReplay(1),
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
