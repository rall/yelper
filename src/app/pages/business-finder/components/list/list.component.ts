import { Component, OnInit, Input, HostBinding, ViewChild, ElementRef, Output, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { Observable, fromEvent, Subject, combineLatest } from 'rxjs';
import { Business } from 'src/app/interfaces/business';
import { pluck, withLatestFrom, map, pairwise, filter, share, takeUntil, exhaustMap, shareReplay, startWith, tap, throttleTime, buffer } from 'rxjs/operators';
import { AttributeMutationsService } from '../../services/attribute-mutations.service';
import { IonItem } from '@ionic/angular';
import { selectIn, filterTrue } from 'src/app/helpers/rxjs-helpers';
import { MapUIEvent } from 'src/app/interfaces/click-event';
import { clicksToDoubleclicks } from './rxjs.helpers';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'bf-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  @Input() containerHeight$:Observable<number>;
  @Input() clicks$:Observable<MapUIEvent>;

  heightSubject:Subject<number> = new Subject();
  @Output() height$:Observable<number> = this.heightSubject.asObservable();

  identifyIndexSubject:Subject<number> = new Subject();
  @Output() identifyIndex$:Observable<number> = this.identifyIndexSubject.asObservable();
  
  clickTrackerSubject:Subject<MapUIEvent> = new Subject();
  @Output() clickTracker$:Observable<MapUIEvent> = this.clickTrackerSubject.asObservable();
  
  @HostBinding("style.height.px") height: number;
  @HostBinding("style.top.px") top: number;

  itemsQueryListSubject:Subject<QueryList<ElementRef>> = new Subject();
  
  @ViewChild("draghandle") handle: ElementRef;

  private _items: QueryList<ElementRef>;

  @ViewChildren(IonItem, { read: ElementRef })
  public set items(value: QueryList<ElementRef>) {
    this.itemsQueryListSubject.next(value);
    this._items = value;
  }
  public get items():QueryList<ElementRef> {
    return this._items;
  }

  viewCheckedSubject:Subject<boolean> = new Subject();

  constructor(
    private _element:ElementRef,
    private mutations: AttributeMutationsService,
    private renderer: Renderer2,
    private searchService: SearchService,
  ) { }
  
  ngOnInit() {
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
          pluck<TouchEvent, number>("touches", "0", "pageY"),
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
    
    // TODO does a scheduler here improve animation smoothness
    boundedTop$.pipe(
      // throttleTime(0, asapScheduler),
    ).subscribe(top => this.top = top);

    combineLatest(boundedTop$, this.containerHeight$).pipe(
      map(([top, containerHeight]) => containerHeight - top)
    ).subscribe(this.heightSubject);
    
    this.heightSubject.subscribe(height => this.height = height);

    const itemsArray$ = this.itemsQueryListSubject.pipe(
      map(ql => ql.toArray()),
    );

    const selectedElementSubject: Subject<ElementRef> = new Subject

    // map clicks

    this.clicks$.pipe(
      filter<MapUIEvent>(event => event.event === "mapclick"),
      map(evt => evt.index),
      selectIn(itemsArray$),
      filter<ElementRef>(elementRef => Boolean(elementRef && elementRef.nativeElement)),
      tap<ElementRef>(elementRef => elementRef.nativeElement.scrollIntoView())
    ).subscribe(selectedElementSubject);


    // list clicks

    this.clicks$.pipe(
      filter<MapUIEvent>(event => event.event === "click"),
      map(evt => evt.index),
      selectIn(itemsArray$),
      filter<ElementRef>(elementRef => Boolean(elementRef && elementRef.nativeElement)),
    ).subscribe(selectedElementSubject);

    const selectedPair$ = selectedElementSubject.pipe(
      startWith(undefined),
      pairwise(),
      share(),
    );
    
    selectedPair$.pipe(
      map(([previous]) => previous),
      filterTrue(),
    ).subscribe(element => this.renderer.removeClass(element.nativeElement, "selected"));

    selectedPair$.pipe(
      map(([_, current]) => current),
    ).subscribe(element => this.renderer.addClass(element.nativeElement, "selected"));


    // simulate double clicks
    this.clickTrackerSubject.pipe(
      clicksToDoubleclicks()
    ).subscribe(this.clickTrackerSubject);
  }

  private onItemClick(evt, index: number) {
    this.clickTrackerSubject.next({ event: evt.type, index: index })
  }

  private reduceImage(url: string):string {
    return url.replace(/o\.jpg$/, "60s.jpg")
  }
}
