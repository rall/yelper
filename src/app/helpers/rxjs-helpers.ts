import { Observable, fromEventPattern } from 'rxjs';
import { tap, switchMap, filter } from 'rxjs/operators';

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

export function eventHandler<T extends EventTarget>(target: T, eventName:string): Observable<any> {
    const add = handler => target.addEventListener(eventName).subscribe(handler);
    const remove = handler => target.removeEventListener(handler);
    return fromEventPattern(add, remove);
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

