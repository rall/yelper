import { Injectable, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { from, Observable, combineLatest, scheduled, animationFrameScheduler, Subject, merge } from 'rxjs';
import { filter, mapTo, switchMap, shareReplay, map, tap, switchMapTo, takeUntil } from 'rxjs/operators';
import { GoogleMaps, GoogleMapsEvent } from '@ionic-native/google-maps/ngx';
import { eventHandler } from 'src/app/helpers/rxjs-helpers';
import googleMapOptions from './google-map.options';
import { GoogleMapServicesModule } from './google-map-services.module';

function randomId():string {
    return `google-map-${Math.random().toString(36).slice(2)}`;
}

@Injectable({
    providedIn: GoogleMapServicesModule
})
export class MapCreatorService {
    private destroySubject:Subject<undefined> = new Subject();

    private platformReady$ = from(this.platform.ready()).pipe(
        filter(readysource => readysource === "cordova")
    );

    public googleMapReady$ = this.platformReady$.pipe(
        mapTo(GoogleMaps.create({})),
        switchMap(mapObject => eventHandler(mapObject, GoogleMapsEvent.MAP_READY, true)),
        shareReplay(1),
      );

    private domId:string = `google-map-${Math.random().toString(36).slice(2)}`;
  
    constructor(private platform: Platform) {
    }

    public prepare(element:ElementRef<HTMLElement>) {
        element.nativeElement.setAttribute("id", this.domId);
    }

    public createMap(show$:Observable<boolean>) {
        const showMap$ = combineLatest(this.googleMapReady$, show$).pipe(
            shareReplay(1),  
        );
      
        const setDiv$ = scheduled(showMap$, animationFrameScheduler).pipe(
            switchMapTo(showMap$),
            tap(([mapObject, visible]) => mapObject.setDiv(visible ? this.domId : undefined))
        );
          
        const setVis$ = showMap$.pipe(tap(([mapObject, visible]) => mapObject.setVisible(visible)));

        const setOpts$ = this.googleMapReady$.pipe(
            tap(mapObject => mapObject.setOptions(googleMapOptions)),
        );

        merge(setDiv$, setVis$, setOpts$).pipe(
            takeUntil(this.destroySubject),
        ).subscribe();
    }

    public destroy() {
        this.destroySubject.next();
        this.destroySubject.complete();
    }
}
