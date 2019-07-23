import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessFinderPage } from './business-finder.page';

describe('GoogleMapPage', () => {
  let component: BusinessFinderPage;
  let fixture: ComponentFixture<BusinessFinderPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BusinessFinderPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessFinderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
