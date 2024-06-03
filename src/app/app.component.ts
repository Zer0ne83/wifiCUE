import {Component,OnInit,AfterViewInit,ChangeDetectorRef} from '@angular/core';
import {ElectronService} from './core/services';
import {EventsService} from './events.service';
//////////////////////////////////////////////////
@Component({selector:'app-root',templateUrl:'./app.component.html',styleUrls:['./app.component.scss']})
//////////////////////////////////////////////////
export class AppComponent implements OnInit,AfterViewInit{
//////////////////////////////////////////////////
  cCons=(fn:string,txt:string)=>{console.log('[app|'+fn+'] - '+txt)};
//////////////////////////////////////////////////
  constructor(
    private electronService:ElectronService,
    private evServ:EventsService,
    private changeDet:ChangeDetectorRef
  ){};
//////////////////////////////////////////////////
  ngOnInit():void{
    this.cCons('ngOnInit','()...');
    this.evServ.subscribe('pokeDOM',()=>{
      this.changeDet.detectChanges();
    })
  }
//------------------------------------------------
  ngAfterViewInit():void{
    this.cCons('ngAfterViewInit','()...');
  }
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
}
