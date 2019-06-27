import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapComponent } from './google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { SearchComponent } from './search/search.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    GoogleMapComponent,
    SearchComponent
  ],
  imports: [
    CommonModule,
    IonicModule.forRoot(),
    ReactiveFormsModule,
  ],
  exports: [
    GoogleMapComponent,
    SearchComponent
  ]
})
export class ComponentsModule { }
