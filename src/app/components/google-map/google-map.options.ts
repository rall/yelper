import { GoogleMapControlOptions, GoogleMapGestureOptions, GoogleMapPreferenceOptions, GoogleMapOptions } from '@ionic-native/google-maps';

const googleMapOptions:GoogleMapOptions = {
    backgroundColor: "white",
    controls: <GoogleMapControlOptions> {
      compass: true,
      myLocationButton: true,
      myLocation: true,
      zoom: true,
      indoorPicker: true
    },
    gestures: <GoogleMapGestureOptions> {
      scroll: true,
      tilt: true,
      rotate: true,
      zoom: true
    },
    preferences: <GoogleMapPreferenceOptions> {
      building: true
    },
    styles: []
  }

export default googleMapOptions;
