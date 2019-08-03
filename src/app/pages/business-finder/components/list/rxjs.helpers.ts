import { MapUIEvent } from 'src/app/interfaces/map-ui-event';
import { Observable } from 'rxjs';
import { buffer, throttleTime, filter, map } from 'rxjs/operators';

export function clicksToDoubleclicks() {
    return (clickObs$: Observable<MapUIEvent>): Observable<MapUIEvent> => {
        return clickObs$.pipe(
            filter(evt => evt.event === "click"),
            buffer(clickObs$.
                pipe(
                  throttleTime(250)
                )
              ),
            filter<MapUIEvent[]>(ary => ary.length > 1),
            filter(([a, b]) => a.index === b.index),
            map(([event]) => <MapUIEvent>{ event: "doubleclick", index: event.index })
        );
    }
}
