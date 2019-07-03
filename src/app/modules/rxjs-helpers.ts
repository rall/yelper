import { Observable, fromEventPattern, of } from 'rxjs';
import { tap, withLatestFrom, switchMap } from 'rxjs/operators';

export function debug<T>(message) {
    return tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'));
}

interface EventTarget {
    addEventListener: Function;
    removeEventListener: Function;
}

export function mapToEventStream(event:string) {
    return <T extends EventTarget>(observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            switchMap((target:T, index?: number) => {
                const add = handler => target.addEventListener(event).subscribe(handler);
                const remove = handler => target.removeEventListener(handler);
                return fromEventPattern<T>(add, remove);
            }),
        );
    }
};
