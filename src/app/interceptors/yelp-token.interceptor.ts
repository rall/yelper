import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class YelpTokenInterceptor implements HttpInterceptor {
  static apiKey:string = "" 

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const modified = request.clone({ 
      setHeaders: { "Authorization": `Bearer ${YelpTokenInterceptor.apiKey}` } 
    });
  
    return next.handle(modified);
  }
}
