import { Injectable, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { concatAll, pluck } from 'rxjs/operators';
import { AttributeMutationsModule } from './attribute-mutations.module';
import { debug } from 'src/app/helpers/rxjs-helpers';

@Injectable({
    providedIn: AttributeMutationsModule
})

export class AttributeMutationsService {
    constructor() {
    }

    create(element: ElementRef, attribute: string) {
        const mutationSubject = new Subject();
        const mutationObserver = new MutationObserver((mutations: MutationRecord[]) => mutationSubject.next(mutations));

        mutationObserver.observe(element.nativeElement, <MutationObserverInit>{
            attributes: true,
            characterData: true
        });
        
        return mutationSubject.pipe(
            concatAll(),
            pluck<MutationRecord, number>("target", attribute),
        );
    }
}