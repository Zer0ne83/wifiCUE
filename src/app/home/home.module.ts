import{NgModule,CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA}from '@angular/core';
import{CommonModule}from '@angular/common';
import{HomeRoutingModule}from './home-routing.module';
import{HomeComponent}from './home.component';
import{SharedModule}from '../shared/shared.module';
//-------------------------------------------------------
import {IonicModule} from '@ionic/angular';
import {EventsService} from '../events.service';
import { ColorSketchModule } from 'ngx-color/sketch';
import { InputPopoverComponent } from '../input/input.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
/////////////////////////////////////////////////////////
@NgModule({
  schemas:[CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA],
  declarations:[HomeComponent,InputPopoverComponent],
  imports:[CommonModule,SharedModule,HomeRoutingModule,IonicModule.forRoot({scrollPadding:false,scrollAssist:true}),ColorSketchModule,NgCircleProgressModule.forRoot({
    backgroundGradient: false,
    backgroundColor: 'transparent',
    backgroundGradientStopColor: 'transparent',
    backgroundOpacity: 0,
    backgroundStroke: '#060606',
    backgroundStrokeWidth: 0,
    backgroundPadding: 0,
    radius: 24,
    space: 0,
    maxPercent: 100,
    unitsColor: 'transparent',
    outerStrokeWidth: 4,
    outerStrokeColor: '#cccccc',
    outerStrokeGradientStopColor: 'aaaaaa',
    innerStrokeColor: '#060606',
    innerStrokeWidth: 0,
    animation:false,
    animationDuration: 250,
    showTitle:false,
    showZeroOuterStroke:true,
    showUnits:false,
    showImage:false,
    class:'hwi-circ',
    showSubtitle: false,
    showBackground: false
  })],
  providers:[EventsService]
})
export class HomeModule{}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
