import { Observable, fromEventPattern } from 'rxjs';
import { tap, switchMap, filter, map, mapTo, withLatestFrom } from 'rxjs/operators';

export function debug<T>(message:any) {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'))
        );
    }
}

interface EventTarget {
    addEventListener: Function;
    removeEventListener: Function;
}

export function eventHandler<T extends EventTarget, U>(target: T, type:string, returnTarget: boolean = false): Observable<any> {
    const add = handler => target.addEventListener(type).subscribe(handler);
    const remove = handler => target.removeEventListener(handler);
    return fromEventPattern(add, remove).pipe(
        map(payload => returnTarget ? target : payload)
    );
}

interface Collection {
    length: number;
}

export function filterEmpty<T extends Collection>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(collection => collection.length === 0)
        );
    }
}

export function filterPresent<T extends Collection>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(collection => collection.length > 0)
        );
    }
}

export function filterTrue<T>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(Boolean),
        );
    }
}

export function filterFalse<T>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(val => !val),
        );
    }
}

export function selectIn<T, U>(collection$: Observable<T>) {
    return (observable$: Observable<string|number>) => {
        return observable$.pipe(
            withLatestFrom(collection$),
            map<[string | number, T], U>(([prop, collection]) => collection[prop]),
        );
    }
}
