import {BrowserModule} from '@angular/platform-browser';
import {NgModule,NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule,HttpClient} from '@angular/common/http';
import {CoreModule} from './core/core.module';
import {SharedModule} from './shared/shared.module';
import {AppRoutingModule} from './app-routing.module';
import {TranslateModule,TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgCircleProgressModule} from 'ng-circle-progress';
//------------------------------------------------
import {IonicModule} from '@ionic/angular';
//------------------------------------------------
import {EventsService} from './events.service';
import {YTDLService} from './ytdl/ytdl.service';
//------------------------------------------------
import {HomeModule} from './home/home.module';
import {ChildModule} from './child/child.module';
import {MoreModule} from './more/more.module';
//------------------------------------------------
import {AppComponent} from './app.component';
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>  new TranslateHttpLoader(http, './assets/i18n/', '.json');
//////////////////////////////////////////////////
@NgModule({
  declarations:[AppComponent],
  schemas:[NO_ERRORS_SCHEMA],
  imports:[
    BrowserModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    MoreModule,
    ChildModule,
    AppRoutingModule,
    IonicModule.forRoot({scrollPadding:false,scrollAssist:true}),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgCircleProgressModule.forRoot({
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
    })
  ],
  providers:[EventsService,YTDLService],
  bootstrap:[AppComponent]
})
export class AppModule{}
