import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
//////////////////////////////////////////////////
@Injectable({providedIn:'root'})
//////////////////////////////////////////////////
export class ElectronService{
  ipcRenderer:typeof ipcRenderer;
  webFrame:typeof webFrame;
  childProcess:typeof childProcess;
  fs:typeof fs;
//////////////////////////////////////////////////
  constructor(){
    if(this.isElectron){
      this.ipcRenderer=window.require('electron').ipcRenderer;
      this.webFrame=window.require('electron').webFrame;
      this.fs=window.require('fs');
      this.childProcess=window.require('child_process');
      this.childProcess.exec('node -v',(error,stdout,stderr)=>{
        if(error){console.error('[core|services|electron] - (ERROR): '+error.message);return};
        if(stderr){console.error('[core|services|electron] - (STDERR): '+stderr);return};
        console.log('[core|services|electron] - (STDOUT) Node Version: '+stdout);
      });
    }
  }
//////////////////////////////////////////////////
  get isElectron():boolean{return!!(window&&window.process&&window.process.type)}
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
}
