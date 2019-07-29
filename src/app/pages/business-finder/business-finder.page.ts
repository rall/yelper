import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, AfterContentChecked } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { Business } from '../../interfaces/business';
import { SearchService } from '../../services/search.service';
import { pluck, map, share, distinctUntilChanged, mapTo, startWith } from 'rxjs/operators';
import { ILatLng } from '@ionic-native/google-maps/ngx';
import { filterTrue } from 'src/app/helpers/rxjs-helpers';

@Component({
  selector: 'app-business-finder-page',
  templateUrl: 'business-finder.page.html',
  styleUrls: ['business-finder.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessFinderPage implements OnInit, AfterContentChecked {
  @ViewChild("listresults", { read: ElementRef }) listResults: ElementRef;

  readySubject: Subject<boolean> = new Subject();
  results$: Observable<Business[]>;
  noResults$: Observable<boolean>;
  allowRedo$: Observable<boolean>;
  
  radiusSubject: Subject<number> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();

  private offsetSubject: Subject<number> = new Subject();
  offset$:Observable<number> = this.offsetSubject.asObservable();
  
  private indexSubject: BehaviorSubject<number> = new BehaviorSubject(-1);
  index$: Observable<number> = this.indexSubject.asObservable();

  identifyIndexSubject:Subject<number> = new Subject();
  showIndexSubject:Subject<number> = new Subject();

  offsetHeightSubject:Subject<number> = new Subject;
  offsetHeight$ = this.offsetHeightSubject.pipe(
    distinctUntilChanged(),
  )

  constructor(
    private searchService: SearchService,
    private element:ElementRef,
  ) {}

  ngOnInit() {
    this.results$ = this.searchService.searchSubject.pipe(
      pluck("businesses"),
      share(),
    );

    this.noResults$ = this.results$.pipe(
      map(results => results.length === 0),
      startWith(true),
    );

    this.noResults$.pipe(
      filterTrue(),
      mapTo(0),
    ).subscribe(this.offsetSubject)

    this.allowRedo$ = this.searchService.redoReadySubject.asObservable();
    this.radiusSubject.subscribe(this.searchService.radiusSubject);
    this.latlngSubject.subscribe(this.searchService.latlngSubject);
  }

  ngAfterContentChecked() {
    this.offsetHeightSubject.next(this.element.nativeElement.offsetHeight);
  }

  onRedoSearch(val:boolean) {
    this.searchService.triggerSubject.next(val)
  }

  onMarkerClick(idx:number) {
    console.log('marker click', idx);
    this.indexSubject.next(idx);
  }

  ionViewWillEnter() {
    this.readySubject.next(true);
  }

  ionViewDidLeave() {
    this.readySubject.next(false);
  }

  onHeightChange(height: number) {
    this.offsetSubject.next(height);
  }

  onIdentifyIndex(index: number) {
    this.identifyIndexSubject.next(index);
    console.log("identify", index);
  }

  onShowIndex(index:number) {
    this.showIndexSubject.next(index);
    console.log("show", index);
  }
}
