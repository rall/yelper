import { Injectable } from '@angular/core';
import { GoogleMapServicesModule } from './google-map-services.module';
import { Subject, Observable, zip, from } from 'rxjs';
import { Business } from 'src/app/interfaces/business';
import { share, pluck, toArray, map, takeUntil, switchMap } from 'rxjs/operators';
import { MarkerOptions } from '@ionic-native/google-maps/ngx';
import { debug } from 'src/app/helpers/rxjs-helpers';
import { coordinatesToLatLng, latlngToMarkerOpts } from '../../../../../helpers/geo-helpers';

function businessesToMarkerOpts(businesses):Observable<MarkerOptions[]> {
    const business$ = from(businesses).pipe(
        share()
    );

    const latlngOpts$ = business$.pipe(
        pluck("coordinates"),
        map(coordinatesToLatLng),
        map(latlngToMarkerOpts),
    );

    const names$ = business$.pipe(
        pluck("name"),
        map(name => ` ${name}`)
    );

    const category$ = business$.pipe(
        pluck<Business, any[]>("categories"),
        map(categories => categories.map(cat => cat.title).join(", "))
    );

    return zip(latlngOpts$, names$, category$).pipe(
        map(([opts, title, category]) => <MarkerOptions>{ ...opts, title: title, snippet: category }),
        toArray(),
    )
}


@Injectable({
    providedIn: GoogleMapServicesModule
})
export class MarkerService {
    private destroySubject:Subject<undefined> = new Subject();
    public businessesSubject: Subject<Business[]> = new Subject();

    public markerOpts$: Observable<MarkerOptions[]> = this.businessesSubject.pipe(
        switchMap(businessesToMarkerOpts),
        takeUntil(this.destroySubject),
    );

    constructor() {
    }

    public destroy() {
        this.destroySubject.next();
        this.destroySubject.complete();
    }
}