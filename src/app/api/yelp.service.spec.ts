import { TestBed } from '@angular/core/testing';

import { YelpService } from './yelp.service';

describe('YelpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: YelpService = TestBed.get(YelpService);
    expect(service).toBeTruthy();
  });
});
