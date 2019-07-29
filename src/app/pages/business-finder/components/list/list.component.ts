import { Component, OnInit, Input, HostBinding, ViewChild, ElementRef, AfterViewInit, Output, ContentChild } from '@angular/core';
import { Observable, fromEvent, Subject, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { Business } from 'src/app/interfaces/business';
import { debug } from 'src/app/helpers/rxjs-helpers';
import { pluck, withLatestFrom, map, concatAll, pairwise, filter, share, switchMapTo, takeUntil, exhaustMap, shareReplay, startWith, take } from 'rxjs/operators';
import { AttributeMutationsService } from '../../services/attribute-mutations.service';

@Component({
  selector: 'bf-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  @Input() results$:Observable<Business[]>;
  @Input() containerHeight$:Observable<number>;

  heightSubject:Subject<number> = new Subject();
  @Output() height$:Observable<number> = this.heightSubject.asObservable();

  @HostBinding("style.height.px") height: number;
  @HostBinding("style.top.px") top: number;

  @ViewChild("draghandle", { read: ElementRef }) handle: ElementRef;

  constructor(
    private _element:ElementRef,
    private mutations: AttributeMutationsService
  ) { }
  
  ngOnInit() {
    // TODO use UI scheduler

    const containerHeight$ = this.containerHeight$.pipe(
      shareReplay(1),
    );

    const topMutation$ = this.mutations.create(this._element, "offsetTop").pipe(
      shareReplay(1),
    );

    const handleHeight$ = this.mutations.create(this.handle, "offsetHeight").pipe(
      startWith(this.handle.nativeElement.offsetHeight),
      shareReplay(1),
    );

    const touchmoveEvents$:Observable<TouchEvent> = fromEvent<TouchEvent>(this.handle.nativeElement, "touchmove").pipe(
      share(),
    );

    const touchstartEvents$:Observable<TouchEvent> = fromEvent<TouchEvent>(this.handle.nativeElement, "touchstart").pipe(
      share(),
    );

    const touchendEvents$:Observable<TouchEvent> = fromEvent<TouchEvent>(this.handle.nativeElement, "touchend").pipe(
      share(),
    );

    const topSubject:Subject<number> = new Subject();

    combineLatest(topMutation$, touchstartEvents$).pipe(
      map(([top]) => top),
    ).subscribe(topSubject);

    touchmoveEvents$.subscribe(evt => evt.preventDefault());

    touchstartEvents$.pipe(
      exhaustMap(() => touchmoveEvents$
        .pipe(
          takeUntil(touchendEvents$),
          pluck<TouchEvent, number>("pageY"),
          pairwise(),
          filter(([previous, current]) => Boolean(current && previous)),
          map(([previous, current]) => current - previous),
          withLatestFrom(topMutation$),
          map(([delta, top]) => top + delta),
        )
      ),
    ).subscribe(topSubject);

    const topBound$ = containerHeight$.pipe(
      map(height => height / 2)
    );

    const bottomBound$ = combineLatest(containerHeight$, handleHeight$).pipe(
      map(([container, handle]) => container - handle)
    );

    const boundedTop$ = topSubject.pipe(
      withLatestFrom(topBound$, bottomBound$),
      filter(([top, topBound, bottomBound]) => top > topBound && top < bottomBound),
      map(([top]) => top),
      share(),
    );
    
    boundedTop$.subscribe(top => this.top = top);

    combineLatest(boundedTop$, this.containerHeight$).pipe(
      map(([top, containerHeight]) => containerHeight - top)
    ).subscribe(this.heightSubject);
    
    this.heightSubject.subscribe(height => this.height = height);
  }

  private itemTap(business: Business) {
    console.info(business, "clicked");
  }
}
