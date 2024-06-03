import{NgModule,CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA}from '@angular/core';
import{CommonModule}from '@angular/common';
import{MoreRoutingModule}from './more-routing.module';
import{MoreComponent}from './more.component';
import{SharedModule}from '../shared/shared.module';
//-------------------------------------------------------
import {IonicModule} from '@ionic/angular';
import {EventsService} from '../events.service';
/////////////////////////////////////////////////////////
@NgModule({
  schemas:[CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA],
  declarations:[MoreComponent],
  imports:[CommonModule,SharedModule,MoreRoutingModule,IonicModule.forRoot({scrollPadding:false,scrollAssist:true})],
  providers:[EventsService]
})
export class MoreModule{}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
