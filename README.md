# A demo of the Cordova Native Google Maps plugin, controlled with RxJS observables

This demo uses the Yelp public API

To run this, you'll need API keys for [Yelp Fusion](https://www.yelp.com/developers/documentation/v3/get_started) and the (Google Maps SDK)[https://console.developers.google.com/]. The Yelp API key lives in `src/app/api/yelp.service.ts`. Google Maps SDK keys go in `config.xml`

To get around the Yelp API's CORS settings, this demo uses the Cordova "Advanced HTTP plugin"