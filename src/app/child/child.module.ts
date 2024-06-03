import{NgModule,CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA}from '@angular/core';
import{CommonModule}from '@angular/common';
import{ChildRoutingModule}from './child-routing.module';
import{ChildComponent}from './child.component';
import{SharedModule}from '../shared/shared.module';
//-------------------------------------------------------
import {IonicModule} from '@ionic/angular';
import {EventsService} from '../events.service';
/////////////////////////////////////////////////////////
@NgModule({
  schemas:[CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA],
  declarations:[ChildComponent],
  imports:[CommonModule,SharedModule,ChildRoutingModule,IonicModule.forRoot({scrollPadding:false,scrollAssist:true})],
  providers:[EventsService]
})
export class ChildModule{}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
