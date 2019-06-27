import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { from, Observable } from 'rxjs';
import { pluck, map } from 'rxjs/operators';
import { SearchData } from '../interfaces/search-data';

@Injectable({
  providedIn: 'root'
})
export class YelpService {
  static hostName:string = "api.yelp.com";
  static baseUrl:string = `https://${YelpService.hostName}/v3/`;
  static apiKey:string = "";

  constructor(
    private http: HTTP
  ) {
    this.http.setHeader('api.yelp.com', 'Authorization', `Bearer ${YelpService.apiKey}`);
  }

  getBusinesses([term, coordinates, radius]:[string, Coordinates, number]):Observable<SearchData> {
    const params = {
      name: term,
      radius: String(radius),
      ...coordinates
    };
    return from(this.http.get(`${YelpService.baseUrl}businesses/search`, params, undefined)).pipe(
      pluck('data'),
      map<string, SearchData>(response => JSON.parse(response)),
      // catchError(),
    );
  }
}
