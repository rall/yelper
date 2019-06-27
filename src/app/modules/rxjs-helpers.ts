import { Observable } from 'rxjs';
import { tap, withLatestFrom } from 'rxjs/operators';

export function debug<T>(message) {
    return tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'));
}

export function mapToLatestFrom<T>(observable$:Observable<T>) {
    return <U>(sourceObservable$: Observable<U>): Observable<T> => {
        return sourceObservable$.pipe(
            withLatestFrom(observable$, ((_, term) => term)),
        );
    }
}
