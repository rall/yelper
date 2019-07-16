import { Component, OnInit, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Business } from 'src/app/interfaces/business';
import { IonSlides } from '@ionic/angular';
import { mapTo, switchMap, distinctUntilChanged, share, filter, map } from 'rxjs/operators';
import { debug } from 'src/app/helpers/rxjs-helpers';

@Component({
  selector: 'app-slides',
  templateUrl: './slides.component.html',
  styleUrls: ['./slides.component.scss'],
})
export class SlidesComponent implements OnInit, AfterViewInit {
  @ViewChild(IonSlides) slides: IonSlides;
  @Input() results$: Observable<Business[]>;
  @Input() index: BehaviorSubject<number>;

  private newSlideSubject:Subject<boolean> = new Subject();
  private showSlidesSubject:BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor() {
    console.log('creating slides component')
  }

  ngOnInit() {
    this.showSlidesSubject.pipe(
      map(show => show ? "100%" : undefined),
      debug('show slides'),
    ).subscribe()
  }

  ngAfterViewInit() {
    console.log('idx in component hook', this.index);
    this.newSlideSubject.pipe(
      mapTo(this.slides),
      switchMap(slides => slides.getActiveIndex()),
      debug('slide active idx'),
    ).subscribe(this.index);



    const distinctIndex$ = this.index.pipe(
      distinctUntilChanged(),
      share(),
    );

    const deselected$ = distinctIndex$.pipe(
      filter(index => index === -1),
      share(),
    );
    
    const selected$ = distinctIndex$.pipe(
      filter(index => index > -1),
      share(),
    );
    
    deselected$.pipe(mapTo(false)).subscribe(this.showSlidesSubject);
    selected$.pipe(mapTo(true)).subscribe(this.showSlidesSubject);
    selected$.subscribe(idx => this.slides.slideTo(idx, 200, false)); 
  }


  private slideTap(business: Business) {
    console.info(business, "clicked");
  }

  private slideDidChange():void {
    this.newSlideSubject.next(true);
  }
}



// this.googleMap.currentIndex$.pipe(
//   filter(index => index === -1),
//   takeUntil(exit$),
//   mapTo('100%'),
// ).subscribe(this.showSlides$);

// this.googleMap.currentIndex$.pipe(
//   filter(index => index > -1),
//   takeUntil(exit$),
//   mapTo(undefined),
// ).subscribe(this.showSlides$);

// const setSlide = (index:number) => this.slides.slideTo(index, 500, false);

// const setSlideFunction = () => {
//   this.googleMap.currentIndex$.pipe(
//     takeUntil(exit$),
//     filter(index => index > -1),
//   ).subscribe(setSlide);

//   this.showSlides$.subscribe(value => {
//     this.slides.setElementStyle('top', value);
//     this.slides.resize();
//   });