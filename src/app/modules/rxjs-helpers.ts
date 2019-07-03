import { Observable, fromEventPattern, of } from 'rxjs';
import { tap, withLatestFrom, switchMap } from 'rxjs/operators';

export function debug<T>(message) {
    return tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'));
}

interface EventTarget {
    addEventListener: Function;
    removeEventListener: Function;
}

export function eventHandler<T extends EventTarget>(target: T, type:string): Observable<any> {
    const add = handler => target.addEventListener(type).subscribe(handler);
    const remove = handler => target.removeEventListener(handler);
    return fromEventPattern(add, remove);
}
  
export function mapToEventStream<U>(event:string) {
    return <T extends EventTarget>(observable$: Observable<T>): Observable<U> => {
        return observable$.pipe(
            switchMap(source => eventHandler(source, event)),
        );
    }
};
