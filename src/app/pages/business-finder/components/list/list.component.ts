import { Component, OnInit, Input, HostBinding, ViewChild, ElementRef, Output, ViewChildren, QueryList, AfterViewChecked, Renderer2 } from '@angular/core';
import { Observable, fromEvent, Subject, combineLatest } from 'rxjs';
import { Business } from 'src/app/interfaces/business';
import { pluck, withLatestFrom, map, pairwise, filter, share, takeUntil, exhaustMap, shareReplay, startWith, distinctUntilChanged, tap } from 'rxjs/operators';
import { AttributeMutationsService } from '../../services/attribute-mutations.service';
import { IonItem } from '@ionic/angular';
import { debug, selectIn } from 'src/app/helpers/rxjs-helpers';

@Component({
  selector: 'bf-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  @Input() results$:Observable<Business[]>;
  @Input() containerHeight$:Observable<number>;
  @Input() selectedIndex$:Observable<number>;

  heightSubject:Subject<number> = new Subject();
  @Output() height$:Observable<number> = this.heightSubject.asObservable();

  identifyIndexSubject:Subject<number> = new Subject();
  @Output() identifyIndex$:Observable<number> = this.identifyIndexSubject.asObservable();
  
  showIndexSubject:Subject<number> = new Subject();
  @Output() showIndex$:Observable<number> = this.showIndexSubject.asObservable();
  
  @HostBinding("style.height.px") height: number;
  @HostBinding("style.top.px") top: number;

  itemsQueryListSubject:Subject<QueryList<ElementRef>> = new Subject();
  itemSelectedFromListSubject:Subject<number> = new Subject();

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

    const itemsArray$ = this.itemsQueryListSubject.pipe(
      map(ql => ql.toArray()),
    );

    const selectedElementSubject: Subject<ElementRef> = new Subject

    this.selectedIndex$.pipe(
      selectIn(itemsArray$),
      tap<ElementRef>(elementRef => elementRef.nativeElement.scrollIntoView())
    ).subscribe(selectedElementSubject);

    this.itemSelectedFromListSubject.pipe(
      selectIn(itemsArray$),
    ).subscribe(selectedElementSubject);

    selectedElementSubject.pipe(
      pairwise(),
    ).subscribe(
      ([previous, current]) => {
        this.renderer.addClass(current.nativeElement, "selected");
        this.renderer.removeClass(previous.nativeElement, "selected");
      }
    );
  }

  ngAfterViewChecked() {
    this.items;
  }

  private onItemClick(index: number) {
    console.log(index);
    this.itemSelectedFromListSubject.next(index);
    // this.showIndexSubject.next(index);
  }

  private onItemTouchstart(index: number) {
    this.identifyIndexSubject.next(index);
  }
}
