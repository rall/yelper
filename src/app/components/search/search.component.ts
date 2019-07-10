import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SearchService } from 'src/app/services/search.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})

export class SearchComponent implements OnInit {
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

    term$.pipe(
      distinctUntilChanged(),
    ).subscribe(this.search.termSubject);
  }

  onSubmit() {
    this.search.triggerSubject.next(true);
  }
}
