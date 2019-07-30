import { ClickEvent } from 'src/app/interfaces/click-event';
import { Observable } from 'rxjs';
import { buffer, throttleTime, filter, map } from 'rxjs/operators';

export function clicksToDoubleclicks() {
    return (clickObs$: Observable<ClickEvent>): Observable<ClickEvent> => {
        return clickObs$.pipe(
            filter(evt => evt.event === "click"),
            buffer(clickObs$.
                pipe(
                  throttleTime(250)
                )
              ),
            filter<ClickEvent[]>(ary => ary.length > 1),
            filter(([a, b]) => a.index === b.index),
            map(([event]) => <ClickEvent>{ event: "doubleclick", index: event.index })
        );
    }
}
