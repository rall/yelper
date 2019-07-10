import { ILatLng, MarkerOptions } from '@ionic-native/google-maps/ngx';

export function latLngToCoordinates(latlng:ILatLng):Coordinates {
    return <Coordinates>{
        latitude: latlng.lat,
        longitude: latlng.lng
    }
}

export function coordinatesToLatLng(coordinates:Coordinates):ILatLng {
    return <ILatLng>{
        lat: coordinates.latitude,
        lng: coordinates.longitude
    }
}
  
export function latlngToMarkerOpts(latlng:ILatLng):MarkerOptions {
    return  <MarkerOptions>{
      position: latlng,
    }
}

export function coordinatesEquality(a: Coordinates, b: Coordinates) {
    return a.latitude === b.latitude && a.longitude === b.longitude;
}
  
// https://gis.stackexchange.com/a/81390
export function zoomLevelToScale(level:number):number {
    return 591657550.5 / Math.pow(2, level - 1);
}
  
export function pixelsToMeters([scale, pixels]:[number, number]):number {
    const screenInches = pixels / 96;
    const screenMeters = screenInches * 0.0254;
    return screenMeters * scale;
}
  
export function apiRadiusLimit(radius:number):number {
    return radius > 40000 ? 40000 : radius;
}
