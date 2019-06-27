import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SearchService } from 'src/app/services/search.service';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { mapToLatestFrom } from 'src/app/modules/rxjs-helpers';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})

export class SearchComponent implements OnInit {
  private submitSubject: Subject<boolean> = new Subject();

  searchForm = this.formBuilder.group({
    term: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
    private search: SearchService
  ) {
  }

  ngOnInit() {
    const term$:Observable<string> = this.searchForm.get("term").valueChanges;

    this.submitSubject.pipe(
      mapToLatestFrom(term$),
      distinctUntilChanged(),
    ).subscribe(this.search.termSubject);
  }

  onSubmit() {
    this.submitSubject.next(true);
  }
}
