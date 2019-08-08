import { Injectable } from '@angular/core';

import { GoogleMapServicesModule } from './google-map-services.module';
import { Observable, timer } from 'rxjs';
import { exhaustMap, takeUntil, pluck, pairwise, filter, map, mergeMap, reduce, throttleTime } from 'rxjs/operators';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: GoogleMapServicesModule
})
export class GestureService {
    private swipeZone: number;
    readonly swipeTime = 500;

    constructor(private platform: Platform) {
        this.swipeZone = Math.abs(this.platform.height() / 3);
    }


    public dragY(touchstart$:Observable<TouchEvent>, touchmove$:Observable<TouchEvent>, touchend$:Observable<TouchEvent>):Observable<number> {
        return touchstart$.pipe(
            exhaustMap(() => touchmove$
                .pipe(
                    takeUntil(touchend$),
                    pluck<TouchEvent, number>("touches", "0", "pageY"),
                    pairwise(),
                    filter(([previous, current]) => Boolean(current && previous)),
                    map(([previous, current]) => current - previous),
                )
            ),
        )
    }

}