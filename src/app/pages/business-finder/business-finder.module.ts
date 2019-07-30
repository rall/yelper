import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BusinessFinderPage } from './business-finder.page';
import { SearchComponent } from './components/search/search.component';
import { BusinessComponent } from './components/business/business.component';
import { GoogleMapModule } from './components/google-map/google-map.module';
import { ListComponent } from './components/list/list.component';
import { AttributeMutationsModule } from './services/attribute-mutations.module';
import { IonicRatingModule } from 'ionic4-rating';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: BusinessFinderPage }]),
    GoogleMapModule,
    AttributeMutationsModule,
    IonicRatingModule
  ],
  declarations: [
    BusinessFinderPage,
    SearchComponent,
    BusinessComponent,
    ListComponent,
  ]
})
export class BusinessFinderPageModule {}
