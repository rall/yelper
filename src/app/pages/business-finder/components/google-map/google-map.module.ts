import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapComponent } from './google-map.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [
    GoogleMapComponent
  ],
  imports: [
    IonicModule.forRoot(),
    CommonModule
  ],
  exports: [
    GoogleMapComponent
  ]
})
export class GoogleMapModule { }
