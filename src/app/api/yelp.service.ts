import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { from, Observable, of } from 'rxjs';
import { pluck, map, filter, catchError } from 'rxjs/operators';
import { SearchData, SearchError } from '../interfaces/search-data';
import { Platform } from '@ionic/angular';

function errorMessage(code:number) {
  let message:string;
  switch(code) {
    case 400: {
      message = "Bad request";
      break;
    }
    default: {
      message = "Something went wrong!";
    }
  }
  return message;
}

function errorObject(error):Observable<SearchData> {
  const searchError = <SearchError>{
    title: 'Server Error',
    message: errorMessage(error.status)
  };
  return of({
    businesses: [],
    total: 0,
    error: searchError
  });
}


@Injectable({
  providedIn: 'root'
})
export class YelpService {
  static hostName:string = "api.yelp.com";
  static baseUrl:string = `https://${YelpService.hostName}/v3/`;
  static apiKey:string = "";

  constructor(
    private http: HTTP,
    private platform: Platform
  ) {
    from(this.platform.ready()).pipe(
      filter(readySource => readySource === "cordova"),
    ).subscribe(() => 
      this.http.setHeader('api.yelp.com', 'Authorization', `Bearer ${YelpService.apiKey}`)
    );
  }

  private stringify(coordinates: Coordinates):{latitude: string, longitude: string} {
    return {
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude)
    };
  }

  getBusinesses([term, coordinates, radius]:[string, Coordinates, number]):Observable<SearchData> {
    const params = {
      name: term,
      radius: String(radius),
      ...this.stringify(coordinates)
    };

    return from(this.http.get(`${YelpService.baseUrl}businesses/search`, params, undefined)).pipe(
      pluck('data'),
      map<string, SearchData>(response => JSON.parse(response)),
      catchError(errorObject),
    );
  }
}
