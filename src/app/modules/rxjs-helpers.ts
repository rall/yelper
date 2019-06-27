import { tap } from 'rxjs/operators';

export function debug<T>(message) {
    return tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'));
}
