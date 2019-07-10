import { ILatLng, MarkerOptions, CameraPosition } from '@ionic-native/google-maps/ngx';

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
  
export function apiRadiusLimit(radius:number):number {
    return radius > 40000 ? 40000 : radius;
}

// https://gis.stackexchange.com/a/127949
export function positionToMetersPerPx(position:CameraPosition<ILatLng>):number {
    const lat = position.target.lat;
    return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, position.zoom);
}
