import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapComponent } from './google-map/google-map.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [
    GoogleMapComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    GoogleMapComponent
  ]
})
export class ComponentsModule { }
