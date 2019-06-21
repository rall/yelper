import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParamsOptions, HttpParams } from '@angular/common/http/src/params';

@Injectable({
  providedIn: 'root'
})
export class YelpService {
  baseUrl:string = "https://api.yelp.com/v3/";

  constructor(
    private http: HttpClient
  ) { }


  getBusinesses(term:string, latlng:{ latitude:string, longitude:string }, radius:string) {
    const params = new HttpParams().
      set('name', term).
      set('latitude', latlng.latitude).
      set('longitude', latlng.longitude).
      set('radius', radius);
 
    return this.http.get("businesses/search", { params: params })
  }
}
