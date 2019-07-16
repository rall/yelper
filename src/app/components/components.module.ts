import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapComponent } from './google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { SearchComponent } from './search/search.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BusinessComponent } from './business/business.component';
import { SlidesComponent } from './slides/slides.component';

@NgModule({
  declarations: [
    GoogleMapComponent,
    SearchComponent,
    BusinessComponent,
    SlidesComponent,
  ],
  imports: [
    CommonModule,
    IonicModule.forRoot(),
    ReactiveFormsModule,
  ],
  exports: [
    GoogleMapComponent,
    SearchComponent,
    BusinessComponent,
    SlidesComponent,
  ]
})
export class ComponentsModule { }
