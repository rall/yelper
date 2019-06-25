import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleMapPage } from './google-map.page';

describe('GoogleMapPage', () => {
  let component: GoogleMapPage;
  let fixture: ComponentFixture<GoogleMapPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GoogleMapPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
