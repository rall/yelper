import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BusinessFinderPage } from './business-finder.page';
import { SearchComponent } from './components/search/search.component';
import { BusinessComponent } from './components/business/business.component';
import { SlidesComponent } from './components/slides/slides.component';
import { GoogleMapModule } from './components/google-map/google-map.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: BusinessFinderPage }]),
    GoogleMapModule,
  ],
  declarations: [
    BusinessFinderPage,
    SearchComponent,
    BusinessComponent,
    SlidesComponent,
  ]
})
export class BusinessFinderPageModule {}
