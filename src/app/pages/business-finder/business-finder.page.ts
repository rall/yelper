import { Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterContentChecked } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { map, distinctUntilChanged, mapTo, startWith, switchMap } from 'rxjs/operators';
import { ILatLng } from '@ionic-native/google-maps/ngx';
import { filterTrue, debug } from 'src/app/helpers/rxjs-helpers';
import { MapUIEvent } from 'src/app/interfaces/map-ui-event';
import { ToastController } from '@ionic/angular';
import { SearchError } from 'src/app/interfaces/search-data';

@Component({
  selector: 'app-business-finder-page',
  templateUrl: 'business-finder.page.html',
  styleUrls: ['business-finder.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessFinderPage implements OnInit, AfterContentChecked {
  readySubject: Subject<boolean> = new Subject();
  noResults$: Observable<boolean>;
  allowRedo$: Observable<boolean>;

  radiusSubject: Subject<number> = new Subject();
  latlngSubject: Subject<ILatLng> = new Subject();

  private offsetSubject: Subject<number> = new Subject();
  offset$:Observable<number> = this.offsetSubject.asObservable();

  private clickTrackerSubject:Subject<MapUIEvent> = new Subject();
  clickTracker$:Observable<MapUIEvent> = this.clickTrackerSubject.asObservable();

  offsetHeightSubject:Subject<number> = new Subject;
  offsetHeight$ = this.offsetHeightSubject.pipe(
    distinctUntilChanged(),
  )

  constructor(
    public searchService: SearchService,
    private element:ElementRef,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.noResults$ = this.searchService.results$.pipe(
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

    this.searchService.error$.pipe(
      switchMap(this.errorToast.bind(this)),
    ).subscribe(toast => toast.present());
  }

  ngAfterContentChecked() {
    this.offsetHeightSubject.next(this.element.nativeElement.offsetHeight);
  }

  onRedoSearch(val:boolean) {
    this.searchService.triggerSubject.next(val)
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

  onClick(event:MapUIEvent) {
    this.clickTrackerSubject.next(event);
  }

  private errorToast(error:SearchError) {
    return this.toastController.create({
      header: error.title,
      message: error.message,
      duration: 2000,
      position: "top",
    });
  }
}
