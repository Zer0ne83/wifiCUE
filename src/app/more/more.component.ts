/* eslint-disable no-trailing-spaces */
import {Component,OnInit,ChangeDetectorRef,ViewChild,ElementRef} from '@angular/core';
import {EventsService} from '../events.service';
import {ipcRenderer} from 'electron';
import {DomSanitizer,SafeResourceUrl} from '@angular/platform-browser';
import * as _ from 'lodash';
import { access, stat, readFile, writeFile, mkdir, unlink, readdir, rmdir, rm, appendFile } from 'fs/promises';
import { WCWinSizePos, WCMWStatHead, WCMWStatusBar,WCYTDLGetSrResult, WCYTDLGetTermResult, WCYTDLTermsInfo, WCYTDLGetVidResult, WCYTDLGetCapResult, WCYTDLVidsInfo, WCYTDLCapsInfo, WCYTDLDBInfo, WCYTDLCapRowObj, WCYTDLDBStats, WCYTDLSRItem, WCYTDLSRCounts, WCSHeadScreenBtn, WCSHeadScreenBtns, WCYTDLDLBatch, WCYTDLData, WCYTDLSelCounts, WCYTDLFinItem, WCYTDLBatchProg, WCYTDLFinSession, WCYTDLFinBatch, WCYTDLMDCounts, baseMDSubsList, WCYTDLMDBaseSub, WCYTDLMDLast6Item, WCYTDLGVHistResult, WCYTDLMDSub, WCYTDLGetPlResult, WCYTDLMDKodiPLDay, WCYTDLMDPLItem, WCYTDLMissing, WCYTDLMDDLItemProg, ytdlMDUploads, WCADBPushItem, WCMDDLCMDProg, WCKodiPlyrInfo, WCWifingAreaToggles, WCWifingDumpDevs, WCWifingDumpAPDevs, wifingMyMacs, WCWifingSaveData, defWifingSaveData, WCWifingDumpStarted, WCWifingDumpCLDevs, WCWifingMOPairs, WCYTDLMDBCMDMon, WCYTDLMDBMonMatch } from '../../appTypes';
import { YTDLService } from '../ytdl/ytdl.service';
import * as ytsr from 'ytsr';
const path=require('path');
import * as xml2js from 'xml2js';
import { youtube_v3 } from 'googleapis';
import { ItemReorderEventDetail } from '@ionic/angular';
import * as ytdl from 'ytdl-core';
//////////////////////////////////////////////////
@Component({selector:'app-more',templateUrl:'./more.component.html',styleUrls:['./more.component.scss']})
export class MoreComponent implements OnInit{
//////////////////////////////////////////////////
@ViewChild('ytdlSearchInput') ytdlSearchInput:ElementRef<HTMLInputElement>;
@ViewChild('ytapiInput') ytapiInput:ElementRef<HTMLInputElement>;
@ViewChild('ytapiOKBtn') ytapiOKBtn:ElementRef<HTMLButtonElement>;
//////////////////////////////////////////////////
mwDataReady:boolean=false;
mWin:WCWinSizePos|null=null;
mTitle:string='';
cmIsOpen:boolean=false;
sHeader:WCMWStatHead|null=null;
sHCtrl2S:any={play:['ok','running'],pause:['warn','paused'],stop:['err','stopped']};
sHeadScreenBtns:WCSHeadScreenBtns={
  ytdl:[
    {screen:'mydaily',isDefault:false,state:false,ico:'assets/ytdl-mydaily-ico.png',altico:'assets/ytdl-mydaily-ico.png',hasCtrl:true,ctrlFns:{play:{fn:'ytdlMyDailyStart',state:false},pause:{fn:'ytdlMyDailyPause',state:false},stop:{fn:'ytdlMyDailyStop',state:true}}},
    {screen:'scrape',isDefault:false,state:false,ico:'assets/wc-ytdl-scrape-ico.png',altico:'assets/wc-ytdl-scrape-ico-close.png',hasCtrl:true,ctrlFns:{play:{fn:'ytdlScrapeStart',state:false},pause:{fn:'ytdlScrapePause',state:false},stop:{fn:'ytdlScrapeStop',state:true}}},
    {screen:'search',isDefault:true,state:true,ico:'assets/ytdl-searchdb-icon.png',altico:'assets/ytdl-searchdb-icon-close.png',hasCtrl:false},
    {screen:'download',isDefault:false,state:false,ico:'assets/ytdl-header-dl-ico.png',altico:'assets/ytdl-header-dl-ico-close.png',hasCtrl:true,ctrlFns:{play:{fn:'ytdlDownloadStart',state:false},pause:{fn:'ytdlDownloadPause',state:false},stop:{fn:'ytdlDownloadStop',state:true}}},
    {screen:'fn4',isDefault:false,state:false,ico:'assets/twt-trigger-gentype-ico.png',altico:'assets/twt-trigger-gentype-ico-close.png',hasCtrl:false}
  ],
  wifing:[
    {screen:'routers',isDefault:true,state:true,ico:'assets/wc-wifing-header-stations-ico.png',altico:'assets/wc-wifing-header-stations-ico.png',hasCtrl:true,ctrlFns:{play:{fn:'wifingDumpStart',state:false},pause:{fn:'wifingDumpPause',state:false},stop:{fn:'wifingDumpStop',state:true}}},
    {screen:'deauths',isDefault:false,state:false,ico:'assets/wc-wifing-header-deauths-ico.png',altico:'assets/wc-wifing-header-deauths-ico.png',hasCtrl:false},
    {screen:'handshakes',isDefault:false,state:false,ico:'assets/wc-wifing-header-handshakes-ico.png',altico:'assets/wc-wifing-header-handshakes-ico.png',hasCtrl:false},
    {screen:'cracks',isDefault:false,state:false,ico:'assets/wc-wifing-header-cracks-ico.png',altico:'assets/wc-wifing-header-cracks-ico.png',hasCtrl:false},
  ]
};
sBarTO:any=null;
sBar:WCMWStatusBar={type:null,msg:null};
//-------------------------------------------------
// WIFING
//------------------------------------------------
wifingData:WCWifingSaveData=defWifingSaveData;
//------------
wifingListeners:string[]=['wifingDumpNGInProg','wifingDumpNGData','wifingDumpTimer'];
wifingMonModeLoading:any={wlan0:false,wlan1:false};
wifingMonModeOn:any={wlan0:false,wlan1:false};
wifingOUIDBLoading:boolean=false;
wifingOUIDBStatus:string='none';
wifingDumpNGInProg:boolean=false;
wifingDumpNGTimerIndic:'time'|'dump'|'wait'='wait';
wifingDumpNGTimerINT:any=null;
wifingDumpNGTimerTime:number=0;
wifingDumpDataReady=false;
wifingDumpNGStarted:WCWifingDumpStarted={date:null,uts:null,ago:null};
wifingRoutersSelFound:number=0;
wifingClientsSelFound:number=0;
wifingMOPairs:WCWifingMOPairs={};
wifingDumpData:WCWifingDumpDevs={justRouters:[],clientRouters:[],allClients:[],assClients:[],unassClients:[]};
wifingJustRouters:any[]=[];
wifingJustClients:any[]=[];
wifingRoutersParamInputOpen:boolean=false;
wifingRInputOldValue:number=0;
wifingRInputNewValue:number=0;
wifingRInputOKDisabled:boolean=false;
wifingRInputPName:string='';
//------------------------------------------------
// YTDL
//------------------------------------------------
ytdlMDBIsConn:boolean=false;
ytdlMDBDocsCount:number=0;
ytdlMDBCMDMon:WCYTDLMDBCMDMon={showing:false,type:null,event:null};
ytdlMDBCMDMonDur:any={int:null,started:null,elapsed:''};
ytdlMDBCMDBarTO:any=null;
ytdlMDBMonMatches:WCYTDLMDBMonMatch[]=[];
ytdlMDBTopBarTime:string='';
//-------
ytdlMSQLRunning:boolean=false;
ytdlIsScrape:boolean=false;
ytdlData:WCYTDLData={scrapeItems:[],searchItems:[],selectedItems:[],dlBatches:[],finSessions:[],myDaily:{mySubs:[],myDls:[],myKodi:{playlists:[],logs:[]},myHistory:[]}};
ytdlTermsInfo:WCYTDLTermsInfo={state:'stopped',counts:{min:10,max:100,actual:{ytt:0,twt:0,rnd:0,ttl:0}},prog:0,dur:''};
ytdlVidsInfo:WCYTDLVidsInfo={state:'stopped',term:'',counts:{actual:0,target:0},prog:0,dur:''};
ytdlVidSteps:any={search:false,info:false};
ytdlCapsInfo:WCYTDLCapsInfo={state:'stopped',term:'',counts:{actual:0,target:0,words:0},prog:0,dur:''};
ytdlCapSteps:any={ctrack:false,caption:false,words:0};
ytdlDBInfo:WCYTDLDBInfo={state:'stopped',term:'',counts:{actual:0,target:0},prog:0,dur:''};
ytdlDBSteps:any={convert:false,add:false};
ytdlDBItemCount:number=0;
ytdlDBStats:WCYTDLDBStats={ping:{ms:0,str:''},diskSize:{mb:0,str:''},ttlCaps:0,ttlWords:0,ttlDur:{s:0,str:''},capsPerMin:0};
ytdlStatsChange:boolean=false;
ytdlStagesTTime:number=0;
ytdlPerMins:any[]=[];
ytdlItemSkip:boolean=false;
ytdlListeners:string[]=['getTermsStatus'];
wcYTDLCapsDir:string='C:\\myYTDLData\\caps';
wcYTDLInfoDir:string='C:\\myYTDLData\\info';
ytdlSRCounts:WCYTDLSRCounts={hits:0,caps:0,time:{db:0,post:0,ttl:{no:0,str:'0s'}}};
ytdlSearchStage:'idle'|'inprog'|'finished'|'error'='idle';
ytdlSTOK:boolean=false;
ytdlHideZeroHits:boolean=true;
ytdlZeroHits:number=0;
sSIP:number=0;
ytdlSelectedCounts:WCYTDLSelCounts={hits:0,caps:0,dur:{no:0,str:'0s'}};
ytdlBatchProg:WCYTDLBatchProg={batches:{c:0,t:0,p:0},items:{c:0,t:0,p:0},matches:{c:0,t:0,p:0},file:0};
ytdlMDDLDirs:any={inprog:'C:\\myYTDLData\\mydaily\\dls\\inprog',finished:'C:\\myYTDLData\\mydaily\\dls\\finished'};
ytdlMDHistPath:string='C:\\myYTDLData\\mydaily\\whistory\\ytAllHistoryMini.json';
ytdlMDSavedLast6Path:string='C:\\myYTDLData\\mydaily\\whistory\\ytSavedLast6.json';
ytdlMDKodiRawLogPath:string='C:\\myYTDLData\\mydaily\\kodilogs\\kodi.log';
ytdlMDKodiYTPlayLogPath:string='C:\\myYTDLData\\mydaily\\kodilogs\\ytPlayLog.json';
ytdlYTAPIInputShowing:boolean=false;
ytdlMyDailySection:string='subs';
ytdlMDCounts:WCYTDLMDCounts={
  subs:{c:0,t:0,p:0,star:0,sleep:0,updated:{d:null,str:'-'}},
  dls:{c:0,t:0,p:0,size:{bytes:0,str:''},time:{e:'',r:''}},
  plists:{c:0,ttlVids:0,ttlDur:{secs:0,str:''}}
};
mdHistoryMode:'a'|'m'|'w'|'d'='a';
mdHistModeList:WCYTDLMDLast6Item[]=[];
ytdlBasicHist:any[]=[];
mdHistModeListReady:boolean=true;
ytdlKodiPlyrHistItem:WCYTDLMDLast6Item|null;
ytdlKodiPlayItemInProg:boolean=false;
ytdlMDSubsUpdateInProg:boolean=false;
ytdlNewSubVidsArr:any[]=[];
ytdlNewSubVidsCount:number=0;
ytdlSubsReorderActive:boolean=false;
ytdlUpdateSubIndex:number=-1;
//-------
ytdlMDPLUpdateInProg:boolean=false;
ytdlProgressPerc:number=0;
ytdlPLUpdateINT:any=null;
//--------
tempNo:boolean=true;
forceUpdate:boolean=true;
//---------
ytdlMDVideoDLsList:WCYTDLMDPLItem[]=[];
ytdlMDVIDIsDL:string='';
ytdlMDDLsInProgress:boolean=false;
ytdlMDDLsFinished:boolean=false;
ytdlMDDLItemCounts:WCYTDLMDDLItemProg={d:{no:0,str:''},t:{no:0,str:''},p:{no:0,str:''},e:{no:0,str:''},r:{no:0,str:''}};
ytdlUpdPLsEveryMins:number=60;
ytdlMDUpdKodiInProg:boolean=false;
ytdlHeadUpdCycleInfo:any={lastChecked:{uts:0,str:'-'},nextCheck:{secs:0,str:'-'}};
ytdlHeadUpdLastChange:number=0;
ytdlHistDragDropShowing:boolean=false;
ytdlDDProcessing:boolean=false;
//----------
ytdlMDUPriorSect:string|null=null;
ytdlMDUShowing:boolean=false;
ytdlMDUWinOut:boolean=false;
ytdlMDUploads:ytdlMDUploads={
  kodi:{inProg:false,status:[]},
  conv:{inProg:false,list:[],prog:{itemProg:{p:0,s:'0%'},listProg:{c:0,t:0,p:0,s:'0%'}}},
  phone:{inProg:false,list:[],prog:{itemProg:{p:0,s:'0%'},listProg:{c:0,t:0,p:0,s:'0%'}}}
};
notifyNewMDList:WCYTDLMDPLItem[]|null=null;
//////////////////////////////////////////////////
  constructor(
    private changeDet:ChangeDetectorRef,
    private evServ:EventsService,
    private sanitizer:DomSanitizer,
    private ytdlServ:YTDLService
  ){}
//////////////////////////////////////////////////
  async doTest(){console.log('TEST TEST TEST');await ipcRenderer.invoke('sendTest',[this.ytdlData.myDaily.myKodi.playlists[0].star])};
//////////////////////////////////////////////////
// LIFECYCLE FUNCTIONS
//////////////////////////////////////////////////
  ngOnInit():void{this.preInit()}
//------------------------------------------------
  async preInit(){
    this.cCons('preInit','()...');
    ipcRenderer.on('moreWIsReady',async(e:any,args:any[])=>{
      this.mTitle=args[0];this.pDOM();
      ipcRenderer.send('showMoreWin',[this.mTitle]);
      const snapsRes:WCWinSizePos|false=await ipcRenderer.invoke('getMoreSnaps',[this.mTitle]);
      if(snapsRes){this.mWin=snapsRes};
      const sDRes:any=await ipcRenderer.invoke('read'+this.mTitle.toUpperCase()+'Data');
      if(sDRes&&typeof sDRes==='object'&&!_.isEmpty(sDRes)){this[this.mTitle+'Data']=sDRes};
      await this[this.mTitle+'Init']();
      await this.doW(0.25);
      const defScreenI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.isDefault);
      if(defScreenI!==-1){this.sHeadScreenBtns[this.mTitle][defScreenI].state=true}else{this.sHeadScreenBtns[this.mTitle][0].state=true};
      this.mwDataReady=true;
      this.doSBar('show',{type:'ok',msg:this.mTitle.toUpperCase()+' Module Loaded'});
      this.pDOM();
      this.addRemoveListeners('add');
      /////////////////////////
      if(this.mTitle==='ytdl'){await this.ytdlGetPooCubeSubs(this.ytdlData.myDaily.mySubs)};
      ////////////////////////
    });
    ipcRenderer.on('cmIsOpen',(e:any,args:any[])=>{this.cmIsOpen=args[0]});
  }
//-------------------------------------------------
  doShowCtrlBtns():boolean{
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    if(asI===-1){return false}else{return this.sHeadScreenBtns[this.mTitle][asI].hasCtrl};
  }
//-------------------------------------------------
  doHeaderCtrlBtn(ctrlStr:string){
    this.cCons('doHeaderCtrlBtn','('+ctrlStr+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    if(asI!==-1){
      if(ctrlStr==='play'&&this.sHeadScreenBtns[this.mTitle][asI].ctrlFns.pause.state===true){
        this.sHeadScreenBtns[this.mTitle][asI].ctrlFns.pause.state=false;
        if(this.mTitle==='wifing'&&(this.getActScrn('routers'))){this.wifingDumpStart()};
      }else{
        const fnStr:string=this.sHeadScreenBtns[this.mTitle][asI].ctrlFns[ctrlStr].fn;
        this[fnStr]('Ctrl');
      }
    }
  }
//-------------------------------------------------
  doHeaderScreenBtn(bI:number){
    this.cCons('doHeaderScreenBtn','('+String(bI)+')...');
    let jC:boolean=false;
    if(this.sHeadScreenBtns[this.mTitle][bI].state){this.sHeadScreenBtns[this.mTitle][bI].state=false;jC=true}else{this.sHeadScreenBtns[this.mTitle][bI].state=true;for(let hsbi=0;hsbi<this.sHeadScreenBtns[this.mTitle].length;hsbi++){if(hsbi!==bI){this.sHeadScreenBtns[this.mTitle][hsbi].state=false}}};
    if(!jC){
      const sB:WCSHeadScreenBtn=this.sHeadScreenBtns[this.mTitle][bI];
      if(sB.hasCtrl&&sB.hasOwnProperty('ctrlFns')&&!_.isEmpty(sB.ctrlFns)){
        let actCtrlKey:string|null=null;
        for(const[k,v] of Object.entries(sB.ctrlFns)){if(v.state){actCtrlKey=k}};
        if(!actCtrlKey){this.sHeadScreenBtns[this.mTitle][bI].ctrlFns.stop.state=true;actCtrlKey='stop'};
        const k2SArr:string[]=this.sHCtrl2S[actCtrlKey];
        this.sHeader={status:k2SArr[0],text:k2SArr[1]};
        this.pDOM();
      }
    }
    this.doSBar('show',{type:(jC?'error':'ok'),msg:(jC?'Closed ':'Opened ')+this.capd(this.sHeadScreenBtns[this.mTitle][bI].screen)+' Screen'});
    this.pDOM();
  };
//-------------------------------------------------
  getCtrlBtnState(btnStr:string):boolean{
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    if(asI!==-1){return this.sHeadScreenBtns[this.mTitle][asI].ctrlFns[btnStr].state}else{return false};
  }
//-------------------------------------------------
  getActScrn(screenStr:string):boolean{
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.screen===screenStr);
    return this.sHeadScreenBtns[this.mTitle][asI].state;
  }
//////////////////////////////////////////////////
  doSBar(showHide:'show'|'hide',status?:WCMWStatusBar){
    this.cCons('doSBar','('+showHide+','+(status?status.type+'|'+status.msg:'null')+')...');
    if(this.sBarTO!==null){clearTimeout(this.sBarTO)};
    if(showHide==='show'){this.sBar=status;this.sBarTO=setTimeout(()=>{this.doSBar('hide')},3500)}
    else{this.sBar={type:null,msg:null};this.sBarTO=null;this.pDOM()};
    this.pDOM();
  }
//////////////////////////////////////////////////
  async killMoreWin(){
    this.cCons('killMoreWin','('+this.mTitle+')...');
    await this.addRemoveListeners('remove');
    ipcRenderer.send('killMoreWin',[this.mTitle]);
  };
//////////////////////////////////////////////////
  async doSaveData():Promise<boolean>{
    const ipcSaveKeyStr:string='write'+this.mTitle.toUpperCase()+'Data';
    const saveData:any=this[this.mTitle+'Data'];
    const sdRes:boolean=await ipcRenderer.invoke(ipcSaveKeyStr,[saveData]);
    if(sdRes){this.doSBar('show',{type:'info',msg:'Updated/Saved '+this.mTitle.toUpperCase()+' Data - OK'})}
    else{this.doSBar('show',{type:'error',msg:'Failed to Save '+this.mTitle.toUpperCase()+' Data (Error)'})};
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
  async exists(path:string):Promise<boolean>{try{await access(path);return Promise.resolve(true)}catch{return Promise.resolve(false)}};
  async statSize(path:string):Promise<any>{try{const sRes:any=await stat(path);return Promise.resolve({r:true,d:sRes.size})}catch(e){console.log(e);return Promise.resolve({r:false,d:0})}};
  async isJSON(data:any):Promise<boolean>{if(typeof data!=='string'){return Promise.resolve(false)};try{const result=JSON.parse(data);const type=Object.prototype.toString.call(result);return Promise.resolve(type==='[object Object]'||type==='[object Array]')}catch(err){return Promise.resolve(false)}};
//------------------------------------------------
  async cCons(fn:string,msg:any){
    const tStr:string=this.evServ.strFormat(new Date(),'HH:mm:ss.SS');
    let m:string=tStr+' - [MORE|'+this.mTitle.toUpperCase()+'|'+fn+'] (Log): ';
    if(typeof msg==='string'){console.log(m+msg)}
    else{console.log(m);console.log(msg)}
  };
//------------------------------------------------
  pDOM(skip?:string){this.changeDet.detectChanges()};
//------------------------------------------------
  doW(s:number):Promise<boolean>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
//------------------------------------------------
  sanitizeURL(url:string):SafeResourceUrl{return (this.sanitizer.bypassSecurityTrustResourceUrl(url))};
//------------------------------------------------
  capd(s:string):string{return s.charAt(0).toUpperCase()+s.slice(1)};
//------------------------------------------------
  cvtBytes(bs:number):string{
    const sizes:string[]=['Bytes','KB','MB','GB','TB'];
    if(bs===0){return 'N/A'};
    const i:number=(Math.floor(Math.log(bs)/Math.log(1024)));
    if(i===0){return bs+' '+sizes[i]};
    return (bs/Math.pow(1024,i)).toFixed(1)+sizes[i]
  };
//------------------------------------------------
  s2T(secs:number):string{let fStr:string='',tH:string|null,tM:string|null,tS:string|null,hours:number=Math.floor(secs/3600),mins:number=0;if(hours>=1){tH=String(hours);secs=secs-(hours*3600)}else{tH=null};mins=Math.floor(secs/60);if(mins>=1){tM=String(mins);secs=secs-(mins*60)}else{tM=null};if(secs<1){tS=null}else{tS=String(secs)};(tH&&tM&&tM.length===1)?tM='0'+tM:void 0;(tS&&tS.length===1)?tS='0'+tS:void 0;if(tH){fStr+=tH;tM=':'+tM};if(tM){fStr+=tM;tS=':'+tS}else{fStr+='00:'};if(tS){fStr+=tS};if(fStr.includes(':null')){const rX:RegExp=/:null/gi;fStr=fStr.replace(rX,':00')};if(fStr===''){fStr='-'};if(fStr===':00'){fStr='-'};return fStr};
  t2NT(rD:string):string{let fD:string=rD.replace(/[^a-zA-Z0-9:\s,]/g,'');if(!fD.endsWith(' AM')&&!fD.endsWith(' PM')){fD=fD.replace('AM AWST',' AM');fD=fD.replace('PM AWST',' PM')};const d2NT:string=(this.evServ.strFormat((this.evServ.str2D(fD,'MMM d, yyyy, h:mm:ss a')),'dd/MM/yy HH:mm'));return d2NT};
//------------------------------------------------
  openExplorer(path:string){console.log(path);ipcRenderer.send('openExplorerPath',[path])};
  deleteFile(path:string){console.log('delete file')};
  previewFile(path:string){console.log('preview file')};
//------------------------------------------------
  addRemoveListeners(addRemove:string):Promise<boolean>{
    this.cCons('addRemoveListeners','('+addRemove+')...');
    if(addRemove==='add'){
      // GLOBAL ----
      ipcRenderer.on('mwQuickSave',async()=>{await this.doSaveData();ipcRenderer.send('mwQuickSaveDone')})
      // YTDL ------
      if(this.mTitle==='ytdl'){
        ipcRenderer.on('mdKodiUploadStatus',(e:any,args:any[])=>{
          switch(args[0]){
            case 'start':
              if(!this.ytdlMDUShowing){this.ytdlMDUShowing=true;this.pDOM()};
              if(this.ytdlMyDailySection!=='dls'){this.ytdlMDUPriorSect=this.ytdlMyDailySection;this.toggleMyDailySection('dls')};
              this.ytdlMDUploads.kodi.inProg=true;
              this.ytdlMDUploads.kodi.status=[];
              this.pDOM();
              break;
            case 'prog':this.ytdlMDUploads.kodi.status=args[1];this.pDOM();break;
            case 'finish':
              this.ytdlMDUploads.kodi.inProg=false;
              this.pDOM();
              const fadeLoop=setInterval(async()=>{
                if(!this.ytdlMDUploads.kodi.inProg&&!this.ytdlMDUploads.conv.inProg&&!this.ytdlMDUploads.phone.inProg){
                  clearInterval(fadeLoop);
                  setTimeout(async()=>{
                    this.ytdlMDUWinOut=true;this.pDOM();
                    await this.doW(0.5);
                    if(this.ytdlMDUPriorSect===null||this.ytdlMDUPriorSect==='dls'){this.ytdlMDUPriorSect='plists'};
                    this.clearMDUploadsTab();
                  },5000);
                };
              },500);
              break;
            default:this.cCons('IPCListener|mdKodiUploadStatus','WARNING: Unknown Event ('+args[0]+')');
          };
        });
        //-------------
      };
      // WIFING ----
      if(this.mTitle==='wifing'){
        ipcRenderer.on('wifingDumpTimer',async(e:any,args:any[])=>{
          if(this.wifingDumpNGTimerINT!==null){clearInterval(this.wifingDumpNGTimerINT);this.wifingDumpNGTimerINT=null};
          this.wifingDumpNGTimerTime=6;
          this.wifingDumpNGTimerINT=setInterval(()=>{this.wifingDumpNGTimerTime--;if(this.wifingDumpNGTimerTime<1){clearInterval(this.wifingDumpNGTimerINT);this.wifingDumpNGTimerINT=null;this.wifingDumpNGTimerIndic='wait'};this.pDOM()},1000);
          this.wifingDumpNGTimerIndic='dump';this.pDOM();
          await this.doW(1);
          this.wifingDumpNGTimerIndic='time';this.pDOM();
        });
        ipcRenderer.on('wifingDumpNGInProg',(e:any,args:any[])=>{
          this.cCons('IPCRenderer|ON','wifingDumpNGInProg: '+String(args[0]).toUpperCase());
          this.wifingDumpNGInProg=args[0];
          this.pDOM();
        });
        ipcRenderer.on('wifingDumpNGData',(e:any,args:any[])=>{
          this.wifingDumpData=args[0];
          this.processNGDump(args[0]);
        });
      };
      //------------
    }else{const modListenKey:string=this.mTitle+'Listeners',listenArr:string[]=this[modListenKey];for(let li=0;li<listenArr.length;li++){ipcRenderer.removeAllListeners(listenArr[li])};return Promise.resolve(true)}
  }
///////////////////////////////////////////////////
///// WIFING MODULE
///////////////////////////////////////////////////
  async wifingInit():Promise<boolean>{
    this.cCons('wifingInit','()...');
    this.sHeader={status:'warn',text:'stopped'};
    this.doSBar('show',{type:'info',msg:'Initating WIFING...'});
    return Promise.resolve(true);
  };
//------------------------------------------------
  async wifingBoolToggle(wifingArea:string,boolName:string){
    this.wifingData[wifingArea].optBools[boolName]?this.wifingData[wifingArea].optBools[boolName]=false:this.wifingData[wifingArea].optBools[boolName]=true;this.pDOM();
    if(this.wifingJustRouters.length>0&&this.wifingData.routers.selectedRouters.length>0){
      const existRArr:any[]=this.wifingJustRouters;
      this.wifingJustRouters=[];
      const booledArr:any[]=await this.applyDeviceBools('routers',existRArr,'sel2Top');
      this.wifingJustRouters=booledArr;
    };
    if(this.wifingJustClients.length>0&&this.wifingData.routers.selectedClients.length>0){
      const existCArr:any[]=this.wifingJustClients;
      this.wifingJustClients=[];
      const booledArr:any[]=await this.applyDeviceBools('clients',existCArr,'sel2Top');
      this.wifingJustRouters=booledArr;
    };
    this.pDOM();
    this.doSaveData();
    this.doSBar('show',{type:'info',msg:this.capd(boolName)+' Bool: '+(this.wifingData[wifingArea].optBools[boolName]?'ON':'OFF')});
  }
//------------------------------------------------
  async wifingAreaFnToggle(toggleName:string){
    this.cCons('wifingAreaFnToggle','('+toggleName+')...');
    const wifingArea:string=this.sHeadScreenBtns[this.mTitle].filter((b:WCSHeadScreenBtn)=>b.state)[0].screen;
    this.wifingData[wifingArea].fnBtns[toggleName].active?this.wifingData[wifingArea].fnBtns[toggleName].active=false:this.wifingData[wifingArea].fnBtns[toggleName].active=true;
    this.doSaveData();
    this.pDOM();
    if(wifingArea==='routers'&&(this.wifingJustRouters.length>0||this.wifingJustClients.length>0)&&this.wifingData[wifingArea].fnBtns[toggleName].active){
      let oldRArr:WCWifingDumpAPDevs[]=this.wifingJustRouters,oldCArr:WCWifingDumpCLDevs[]=this.wifingJustClients;
      let newRArr:WCWifingDumpAPDevs[]=await this.applyDeviceFilter('routers',oldRArr,toggleName),newCArr:WCWifingDumpCLDevs[]=await this.applyDeviceFilter('clients',oldCArr,toggleName);
      this.wifingJustRouters=[];
      const didRChange:boolean=(!_.isEqual(oldRArr,newRArr));
      if(didRChange){this.wifingJustRouters=newRArr}else{this.wifingJustRouters=oldRArr};
      this.wifingJustClients=[];
      const didCChange:boolean=(!_.isEqual(oldCArr,newCArr));
      if(didCChange){this.wifingJustClients=newCArr}else{this.wifingJustClients=oldCArr};
      this.pDOM();
    };
    this.doSBar('show',{type:(this.wifingData[wifingArea].fnBtns[toggleName].active?'ok':'error'),msg:'AP Filter ('+toggleName+') - '+(this.wifingData[wifingArea].fnBtns[toggleName].active?'ON':'OFF')});
  }
//------------------------------------------------
  wifingDumpSectVizToggle(area:string){
    this.cCons('wifingDumpSecVizToggle','('+area+')...');
    this.wifingData.routers.vizTogs[area]==='max'?this.wifingData.routers.vizTogs[area]='min':this.wifingData.routers.vizTogs[area]='max';
    this.doSaveData();
    this.pDOM();
    this.doSBar('show',{type:'info',msg:(this.capd(this.wifingData.routers.vizTogs[area]))+' '+(this.capd(area))+' (Dump-ng)'});
  }
//------------------------------------------------
  async wifingUpdateOUIDB():Promise<boolean>{
    this.wifingOUIDBLoading=true;
    this.pDOM();
    const newOUIDBStatus:string=await ipcRenderer.invoke('updateOUIDBStatus');
    this.wifingOUIDBLoading=false;
    this.wifingOUIDBStatus=newOUIDBStatus;
    this.pDOM();
    return Promise.resolve(true);
  }
//------------------------------------------------
  async wifingToggleMonMode(ss:string,iFace:string):Promise<boolean>{
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    if(iFace==='all'){for(const iF of Object.keys(this.wifingMonModeLoading)){this.wifingMonModeLoading[iF]=true}}else{this.wifingMonModeLoading[iFace]=true};this.pDOM();
    const togMMRes:{r:boolean,d:any}=await ipcRenderer.invoke('toggleMonMode',[ss,iFace]);
    if(iFace==='all'){for(const iF of Object.keys(this.wifingMonModeLoading)){this.wifingMonModeLoading[iF]=false}}else{this.wifingMonModeLoading[iFace]=false};this.pDOM();
    this.wifingMonModeOn=togMMRes.d;
    this.pDOM();
    if(ss==='start'){
      if(!togMMRes.d.wlan0&&!togMMRes.d.wlan1){
        this.sHeadScreenBtns.wifing[asI].ctrlFns.play.state=false;
        this.sHeadScreenBtns.wifing[asI].ctrlFns.stop.state=true;
        ipcRenderer.send('toggleDumpNG',['stop']);
        this.wifingDumpNGStarted={date:null,uts:null,ago:null};
        this.sHeader={status:'err',text:'stopped'};
        this.doSBar('show',{type:'error',msg:'0/2 MonModes Enabled'});
        return Promise.resolve(false);
      }else if(togMMRes.d.wlan0&&togMMRes.d.wlan1){this.doSBar('show',{type:'ok',msg:'2/2 MonModes Enabled'})}
      else{this.doSBar('show',{type:'info',msg:'1/2 MonModes Enabled ('+(togMMRes.d.wlan0?'wlan0':'wlan1')+')'})};
    }else{
      if(togMMRes.d.wlan0&&togMMRes.d.wlan1){this.doSBar('show',{type:'error',msg:'0/2 MonModes Disabled'});return Promise.resolve(false)}
      else if(!togMMRes.d.wlan0&&!togMMRes.d.wlan1){this.doSBar('show',{type:'ok',msg:'2/2 MonModes Disabled'})}
      else{this.doSBar('show',{type:'info',msg:'1/2 MonModes Disabled ('+(!togMMRes.d.wlan0?'wlan0':'wlan1')+')'})};
    }
  }
//------------------------------------------------
  async wifingDumpStart(source?:string){
    this.cCons('wifingDumpStart','('+(source?source:'init')+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.wifing[asI].ctrlFns.play.state=true;
    this.sHeadScreenBtns.wifing[asI].ctrlFns.stop.state=false;
    this.sHeader={status:'ok',text:'running'};
    if(!this.wifingMonModeOn.wlan0||!this.wifingMonModeOn.wlan1){await this.wifingToggleMonMode('start','all')};
    if(this.wifingOUIDBStatus!=='new'){await this.wifingUpdateOUIDB()};
    if(this.sHeadScreenBtns.wifing[asI].ctrlFns.pause.state){
      await ipcRenderer.invoke('toggleDumpNGPaused',[false]);
      this.sHeadScreenBtns.wifing[asI].ctrlFns.pause.state=false;
      this.doSBar('show',{type:'ok',msg:'Dump-ng UNPAUSED'});
    }else{
      ipcRenderer.send('toggleDumpNG',['start']);
      await ipcRenderer.invoke('toggleDumpNGPaused',[false]);
      this.doSBar('show',{type:'ok',msg:'Dump-ng STARTED'});
    };
    const sD:Date=new Date();
    this.wifingDumpNGStarted={date:sD,uts:(this.evServ.gUT(sD)),ago:null};
    this.pDOM();
  }
//------------------------------------------------
  ssidOK(ssid:string):boolean{if(ssid&&ssid.length>0&&!ssid.startsWith('<length')){return true}else{return false}};
//------------------------------------------------
  async wifingDumpPause(source?:string){
    this.cCons('wifingDumpPause','('+(source?source:'Ctrl')+')...');
    await ipcRenderer.invoke('toggleDumpNGPaused',[true]);
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.wifing[asI].ctrlFns.pause.state=true;
    this.sHeader={status:'warn',text:'paused'};
    this.doSBar('show',{type:'info',msg:'Dump-ng PAUSED'});
    this.pDOM();
  }
//------------------------------------------------
  async wifingDumpStop(source?:string){
    this.cCons('wifingDumpStop','('+(source?source:'Ctrl')+')...');
    ipcRenderer.send('toggleDumpNG',['stop']);
    this.wifingDumpNGStarted={date:null,uts:null,ago:null};
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.wifing[asI].ctrlFns.play.state=false;
    this.sHeadScreenBtns.wifing[asI].ctrlFns.stop.state=true;
    if(this.sHeadScreenBtns.wifing[asI].ctrlFns.pause.state){
      this.sHeadScreenBtns.wifing[asI].ctrlFns.pause.state=false;
      await ipcRenderer.invoke('toggleDumpNGPaused',[false]);
    };
    this.sHeader={status:'err',text:'stopped'};
    this.doSBar('show',{type:'error',msg:'Dump-ng STOPPED'});
    this.pDOM();
  }
//------------------------------------------------
  wifingToggleMOPairInfo(e:any,mac:string){
    e.preventDefault();e.stopPropagation();
    if(this.wifingMOPairs.hasOwnProperty(mac)){
      if(!this.wifingMOPairs[mac]||this.wifingMOPairs[mac]===null){this.wifingMOPairs[mac]['showing']=false}
      else{
        if(this.wifingMOPairs[mac].hasOwnProperty('showing')){
          if(this.wifingMOPairs[mac].showing===true){this.wifingMOPairs[mac].showing=false}
          else{this.wifingMOPairs[mac].showing=true};
        }else{this.wifingMOPairs[mac]['showing']=true};
      };
    };
    this.pDOM();
  }
//------------------------------------------------
  async toggleSelectRouter(rObj:WCWifingDumpAPDevs){
    const existRI:number=this.wifingData.routers.selectedRouters.findIndex((rO:WCWifingDumpAPDevs)=>rO.id===rObj.id&&rO.mac===rObj.mac);
    if(existRI===-1){this.wifingData.routers.selectedRouters.push(rObj);this.pDOM()}
    else{this.wifingData.routers.selectedRouters.splice(existRI,1);this.pDOM()};
    if(this.wifingData.routers.optBools.sel2Top){
      const existArr:any[]=this.wifingJustRouters;
      this.wifingJustRouters=[];
      const booledArr:any[]=await this.applyDeviceBools('routers',existArr,'sel2Top');
      this.wifingJustRouters=booledArr;
    };
    this.pDOM();
    this.doSaveData();
  }
//-------------------------------------------------
  routerIsSel(rObj:WCWifingDumpAPDevs):boolean{if(this.wifingData.routers.selectedRouters.findIndex((rO:WCWifingDumpAPDevs)=>rO.id===rObj.id&&rO.mac===rObj.mac)!==-1){return true}else{return false}}
//-------------------------------------------------
  async toggleSelectClient(clObj:WCWifingDumpCLDevs){
    const existClI:number=this.wifingData.routers.selectedClients.findIndex((clO:WCWifingDumpCLDevs)=>clO.mac===clObj.mac);
    if(existClI===-1){this.wifingData.routers.selectedClients.push(clObj);this.pDOM()}
    else{this.wifingData.routers.selectedClients.splice(existClI,1);this.pDOM()};
    if(this.wifingData.routers.optBools.sel2Top){
      const existArr:any[]=this.wifingJustClients;
      this.wifingJustClients=[];
      const booledArr:any[]=await this.applyDeviceBools('clients',existArr,'sel2Top');
      this.wifingJustClients=booledArr;
    };
    this.pDOM();
    this.doSaveData();
  }
//-------------------------------------------------
  clientIsSel(clObj:WCWifingDumpCLDevs):boolean{if(this.wifingData.routers.selectedClients.findIndex((clO:WCWifingDumpCLDevs)=>clO.mac===clObj.mac)!==-1){return true}else{return false}}
//-------------------------------------------------
  tenMax(s:string):string{return s.slice(0,10)};
//-------------------------------------------------
  mac2ID(s:string):string{const colRX:RegExp=/:/g;return s.replace(colRX,'').slice(0,10)};
//-------------------------------------------------
  xChars(s:string):string{return s.slice(0,2)};
//-------------------------------------------------
  chanNo(n:number):string{if(n<10){return '0'+String(n)}else{return String(n)}};
//-------------------------------------------------
  tx2Perc(tx:number):number{
    if(tx===-1){return -1}
    else if(tx<-1&&tx>=-30){return 1}
    else if(tx<-30&&tx>=-35){return 0.9}
    else if(tx<-35&&tx>=-40){return 0.8}
    else if(tx<-40&&tx>=-45){return 0.7}
    else if(tx<-45&&tx>=-50){return 0.6}
    else if(tx<-50&&tx>=-55){return 0.5}
    else if(tx<-55&&tx>=-60){return 0.4}
    else if(tx<-60&&tx>=-65){return 0.3}
    else if(tx<-65&&tx>=-70){return 0.2}
    else if(tx<-70&&tx>=-75){return 0.1}
    else if(tx<-75){return 0}
  };
//-------------------------------------------------
  bcDaNo(n:number):string{if(n<100){return String(n)}else if(n>=100){return (n/1000).toFixed(1)+'k'}}
//-------------------------------------------------
  privStr(s:string):string{
    if(s.trim().includes(' ')){s=s.split(' ')[0]};
    if(s.includes('WPA')){return s.replace('WPA','W')}
    else if(s.includes('WEP')){return 'WE'}
  };
//-------------------------------------------------
  ciphStr(s:string):string{
    if(s.trim().includes(' ')){s=s.split(' ')[0]};
    if(s==='CCMP'){return 'CC'}
    else if(s==='WRAP'){return 'WR'}
    else if(s==='TKIP'){return 'TK'}
    else if(s==='WEP'){return 'W0'}
    else if(s==='WEP40'){return 'W4'}
    else if(s==='WEP104'){return 'W1'}
  };
//-------------------------------------------------
  authStr(s:string):string{return s.charAt(0)+s.charAt(1)}
//-------------------------------------------------
  clIsAssoc(mac:string):boolean{if(this.wifingDumpData.assClients.findIndex((cO:WCWifingDumpCLDevs)=>cO.mac===mac)!==-1){return true}else{return false}}
//-------------------------------------------------
  async processNGDump(dd:WCWifingDumpDevs){
    const oldJRArr:WCWifingDumpAPDevs[]=this.wifingJustRouters;
    const oldJCArr:WCWifingDumpCLDevs[]=this.wifingJustClients;
    let newJRArr:WCWifingDumpAPDevs[]=dd.justRouters;
    let newJCArr:WCWifingDumpCLDevs[]=dd.allClients;
    // Unique Items
    newJRArr=_.uniqBy(newJRArr,((rO:WCWifingDumpAPDevs)=>rO.mac));
    newJCArr=_.uniqBy(newJCArr,((cO:WCWifingDumpCLDevs)=>cO.mac));
    // Filters
    if(this.wifingData.routers.fnBtns.unknownOnly.active){
      newJRArr=await this.applyDeviceFilter('routers',newJRArr,'unknownOnly');
      newJCArr=await this.applyDeviceFilter('clients',newJCArr,'unknownOnly');
    };
    if(this.wifingData.routers.fnBtns.activeOnly.active){
      newJRArr=await this.applyDeviceFilter('routers',newJRArr,'activeOnly');
      newJCArr=await this.applyDeviceFilter('clients',newJCArr,'activeOnly');
    };
    if(this.wifingData.routers.fnBtns.recentOnly.active){
      newJRArr=await this.applyDeviceFilter('routers',newJRArr,'recentOnly');
      newJCArr=await this.applyDeviceFilter('clients',newJCArr,'recentOnly');
    };
    if(this.wifingData.routers.fnBtns.clientsOnly.active){
      newJRArr=await this.applyDeviceFilter('routers',newJRArr,'clientsOnly');
      newJCArr=await this.applyDeviceFilter('clients',newJCArr,'clientsOnly');
    };
    if(this.wifingData.routers.fnBtns.strongsigOnly.active){
      newJRArr=await this.applyDeviceFilter('routers',newJRArr,'strongsigOnly');
      newJCArr=await this.applyDeviceFilter('clients',newJCArr,'strongsigOnly');
    };
    // Opt Bools
    if(this.wifingData.routers.optBools.sel2Top){
      newJRArr=await this.applyDeviceBools('routers',newJRArr,'sel2Top');
      newJCArr=await this.applyDeviceBools('clients',newJCArr,'sel2Top');
    };
    //-----------
    this.wifingJustRouters=[];
    this.wifingJustClients=[];
    let missMOMacs:string[]=[];
    const didRChange:boolean=(!_.isEqual(oldJRArr,newJRArr));
    if(didRChange){
      this.wifingJustRouters=newJRArr;
      for(let nri=0;nri<newJRArr.length;nri++){
        if(newJRArr[nri].mac&&newJRArr[nri].mac.length>0&&newJRArr[nri].mac!=='-'&&!this.wifingMOPairs.hasOwnProperty(newJRArr[nri].mac)){missMOMacs.push(newJRArr[nri].mac)};
      };
    }else{this.wifingJustRouters=oldJRArr};
    const didCChange:boolean=(!_.isEqual(oldJCArr,newJCArr));
    if(didCChange){
      this.wifingJustClients=newJCArr;
      for(let nci=0;nci<newJCArr.length;nci++){
        if(newJCArr[nci].mac&&newJCArr[nci].mac.length>0&&newJCArr[nci].mac!=='-'&&!this.wifingMOPairs.hasOwnProperty(newJCArr[nci].mac)){missMOMacs.push(newJCArr[nci].mac)};
      };
    }else{this.wifingJustClients=oldJCArr};
    if(missMOMacs.length>0){
      const matchMOMacsRes:WCWifingMOPairs|false=await ipcRenderer.invoke('matchMAC2OUI',[missMOMacs]);
      if(matchMOMacsRes!==false){for(const[k,v] of Object.entries(matchMOMacsRes)){this.wifingMOPairs[k]=v}};
    };
    const nowUTS:number=this.evServ.gUT(new Date()),agoSecs:number=(nowUTS-this.wifingDumpNGStarted.uts);
    this.wifingDumpNGStarted.ago=(this.s2T(agoSecs));
    if(this.wifingJustRouters.length>0&&this.wifingData.routers.selectedRouters.length>0){let foundRCount:number=0;for(let fsri=0;fsri<this.wifingData.routers.selectedRouters.length;fsri++){if(this.wifingJustRouters.findIndex((rO:any)=>rO.mac===this.wifingData.routers.selectedRouters[fsri].mac)!==-1){foundRCount++}};this.wifingRoutersSelFound=foundRCount};
    if(this.wifingJustClients.length>0&&this.wifingData.routers.selectedClients.length>0){let foundCCount:number=0;for(let fsci=0;fsci<this.wifingData.routers.selectedClients.length;fsci++){if(this.wifingJustClients.findIndex((cO:any)=>cO.mac===this.wifingData.routers.selectedClients[fsci].mac)!==-1){foundCCount++}};this.wifingClientsSelFound=foundCCount};
    this.pDOM();
  }
//-------------------------------------------------
  applyDeviceBools(arrType:string,existArr:any[],boolName:string):Promise<any[]>{
    let booledArr:any[]=[];
    switch(boolName){
      case 'sel2Top':
        if(arrType==='routers'){
          if(this.wifingData.routers.selectedRouters.length>0){
            const selRMacs:string[]=this.wifingData.routers.selectedRouters.map((r:WCWifingDumpAPDevs)=>(r.mac));
            let rIsSel:any[]=[],rNotSel:any[]=[];
            for(let rsi=0;rsi<existArr.length;rsi++){if(selRMacs.includes(existArr[rsi].mac)){rIsSel.push(existArr[rsi])}else{rNotSel.push(existArr[rsi])}};
            if(rIsSel.length>0){booledArr=rIsSel.concat(rNotSel)}else{booledArr=rNotSel};
          }else{booledArr=existArr};
        }else{
          if(this.wifingData.routers.selectedClients.length>0){
            const selCMacs:string[]=this.wifingData.routers.selectedClients.map((c:WCWifingDumpCLDevs)=>(c.mac));
            let cIsSel:any[]=[],cNotSel:any[]=[];
            for(let csi=0;csi<existArr.length;csi++){if(selCMacs.includes(existArr[csi].mac)){cIsSel.push(existArr[csi])}else{cNotSel.push(existArr[csi])}};
            if(cIsSel.length>0){booledArr=cIsSel.concat(cNotSel)}else{booledArr=cNotSel};
          }else{booledArr=existArr}
        };
        break;
      default:booledArr=existArr;
    };
    return Promise.resolve(booledArr);
  }
//-------------------------------------------------
  applyDeviceFilter(arrType:string,existArr:any[],filter:string):Promise<any[]>{
    let filteredArr:any[]=[];
    switch(filter){
      case 'unknownOnly':
        if(arrType==='routers'){filteredArr=existArr.filter((rO:any)=>!wifingMyMacs.includes(rO.mac)&&!rO.id.toLowerCase().includes('zer0'))}
        else{filteredArr=existArr.filter((cO:any)=>!wifingMyMacs.includes(cO.mac))};
        break;
      case 'activeOnly':
        const aOP:number=this.wifingData.routers.fnBtns.activeOnly.param;
        if(arrType==='routers'){filteredArr=existArr.filter((rO:any)=>rO.data>=aOP||rO.bcs>=aOP)}
        else{filteredArr=existArr.filter((cO:any)=>cO.data>=aOP)};
        break;
      case 'recentOnly':
        const rOP:number=this.wifingData.routers.fnBtns.recentOnly.param;
        if(arrType==='routers'){filteredArr=existArr.filter((rO:any)=>(this.evServ.lessThanXMinsAgo(rO.last,rOP)))}
        else{filteredArr=existArr.filter((cO:any)=>(this.evServ.lessThanXMinsAgo(cO.last,rOP)))};
        break;
      case 'clientsOnly':
        const cOP:number=this.wifingData.routers.fnBtns.clientsOnly.param;
        if(arrType==='routers'){filteredArr=existArr.filter((rO:any)=>rO.clients.length>=cOP)}
        else{filteredArr=existArr};
        break;
      case 'strongsigOnly':
        const ssOP:number=this.wifingData.routers.fnBtns.strongsigOnly.param;
        if(arrType==='routers'){filteredArr=existArr.filter((rO:any)=>rO.tx>=ssOP&&rO.tx!==-1&&rO.tx!==0)}
        else{filteredArr=existArr.filter((cO:any)=>cO.tx>=ssOP&&cO.tx!==-1&&cO.tx!==0)};
        break;
      default:return Promise.resolve(existArr);
    };
    return Promise.resolve(filteredArr);
  }
//------------------------------------------------
  wifingDumpClearSection(section:string){
    const capdStr:string=this.capd(section),capdArrName:string='wifingJust'+capdStr;
    this[capdArrName]=[];
    this.pDOM();
    this.doSBar('show',{type:'info',msg:this.capd(section)+' List Cleared'});
  }
//------------------------------------------------
  wifingRParamInput(type:string,v:any){
    const checkV=(s:string):boolean=>{if(typeof Number(s)==='number'&&Number(s)>=0&&this.wifingRInputOldValue!==Number(s)){return true}else{return false}}
    switch(type){
      case 'show':
        v.e.preventDefault();
        this.wifingRInputPName=v.name;
        this.wifingRInputOldValue=this.wifingData.routers.fnBtns[v.name].param;
        this.wifingRParamInput('input',this.wifingRInputOldValue);
        this.wifingRoutersParamInputOpen=true;
        break;
      case 'hide':
        this.wifingRoutersParamInputOpen=false;
        this.wifingRInputOldValue=0;
        this.wifingRInputNewValue=0;
        this.wifingRInputOKDisabled=false;
        this.wifingRInputPName='';
        break;
      case 'input':if((checkV(v))){this.wifingRInputNewValue=Number(v);this.wifingRInputOKDisabled=false}else{this.wifingRInputOKDisabled=true};break;
      case 'ok':
        this.wifingData.routers.fnBtns[this.wifingRInputPName].param=this.wifingRInputNewValue;
        this.doSaveData();
        this.wifingRParamInput('hide',null);
        break;
      case 'cancel':
        this.wifingRParamInput('hide',null);
        break;
      default:return;
    };
    this.pDOM();
  }
//////////////////////////////////////////////////
///// YTDL MODULE
//////////////////////////////////////////////////
  async ytdlMyDailyStart(source:string){
    this.cCons('ytdlMyDailyStart','('+source+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.play.state=true;
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.stop.state=false;
    if(this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state){this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state=false};
    this.sHeader={status:'ok',text:'running'};
    this.sBar={type:'ok',msg:'MyDaily Cycle STARTED (by '+this.capd(source)+')'};
    this.pDOM();
    await this.initKodiPLData();
  }
//------------------------------------------------
  async ytdlMyDailyPause(source?:string){
    this.cCons('ytdlMyDailyPause','('+(source?source:'')+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state=true;this.pDOM();
    this.sHeader={status:'warn',text:'paused'};
    this.doSBar('show',{type:'info',msg:'MyDaily Cycle PAUSED (by Ctrl)'});
  }
//------------------------------------------------
  async ytdlMyDailyStop(source:string){
    this.cCons('ytdlMyDailyStop','('+source+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.play.state=false;
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.stop.state=true;
    if(this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state){this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state=false};
    this.doSBar('show',{type:'error',msg:'MyDaily Cycle STOPPED (by '+this.capd(source)+')'});
    this.pDOM();
    if(this.ytdlPLUpdateINT!==null){clearInterval(this.ytdlPLUpdateINT);this.ytdlPLUpdateINT=null}
  }
//-------------------------------------------------
  async toggleHistDragDrop(){
    this.cCons('toggleHistDragDrop','()...');
    const dropZone:HTMLDivElement=document.getElementById('mdhdz') as HTMLDivElement;
    if(!this.ytdlHistDragDropShowing){
      this.ytdlHistDragDropShowing=true;
      this.pDOM();
      await this.doW(0.25);
      dropZone.addEventListener('drop',async(e)=>{
        e.preventDefault();e.stopPropagation();
        if(!this.ytdlDDProcessing){
          this.ytdlDDProcessing=true;
          this.pDOM();
          this.cCons('ytdlHistDragDrop','Received File: '+e.dataTransfer.files[0].path);
          let newHist:any=await ipcRenderer.invoke('readHistoryDrop',[e.dataTransfer.files[0].path]);
          this.cCons('rawList',newHist);
          if(newHist.length>0){
            let newHistList:any[]=[];
            const nowUTS:number=this.evServ.gUT(new Date());
            const threeMUTSCut:number=nowUTS-7884864;
            for(let ri=0;ri<newHist.length;ri++){
              let hOVT:string=newHist[ri].vTitle.replace(/quot /g,'');
              if(hOVT.length===0){hOVT='-'};
              let hOVU:string=newHist[ri].vUrl;
              if(hOVU.length===0){hOVU='https://youtube.com'};
              const hOStr:string=newHist[ri].date;
              if(hOStr.length===17){
                const hODate:Date=this.evServ.str2D(newHist[ri].date,'dd/MM/yy HH:mm:ss');
                const hOUTS:number=this.evServ.gUT(hODate);
                if(hOUTS>threeMUTSCut){
                  const hDObj:any={d:hODate,u:hOUTS,s:hOStr};
                  newHistList.push({vTitle:hOVT,vUrl:hOVU,date:hDObj});
                };
              };
            };
            this.cCons('procList',newHistList);
            if(newHistList.length>0&&!_.isEqual(newHistList,this.ytdlData.myDaily.myHistory)){
              this.ytdlData.myDaily.myHistory=newHistList;
              this.doSaveData();
              await this.toggleMDHistoryMode(null,true);
            };
          };
          this.ytdlDDProcessing=false;
          this.pDOM();
          await this.doW(1);
          if(this.ytdlHistDragDropShowing){this.ytdlHistDragDropShowing=false;this.pDOM()}
        }else{this.cCons('ytdlHistDD','Skipped - Already Processing')};
      });
      dropZone.addEventListener('dragover',(e)=>{e.preventDefault();e.stopPropagation()});
    }else{
      this.ytdlHistDragDropShowing=false;
      this.pDOM();
    }
  }
///////////////////////////////////////////////////
  ytdlCountSubs(subsArr:WCYTDLMDSub[]):Promise<boolean>{
    this.ytdlMDCounts.subs={c:0,t:0,p:0,star:0,sleep:0,updated:{d:null,str:'...'}};
    if(subsArr.length===0){this.ytdlMDCounts.subs.updated.str='-';this.pDOM();return Promise.resolve(true)}
    else{
      let latestUpdateUTS:number=0;
      for(let si=0;si<subsArr.length;si++){
        const s:WCYTDLMDSub=subsArr[si];
        this.ytdlMDCounts.subs.t++;
        if(s.lastUpdated&&this.evServ.isVD(new Date(s.lastUpdated))){const lUUTS:number=this.evServ.gUT(new Date(s.lastUpdated));if(lUUTS>latestUpdateUTS){latestUpdateUTS=lUUTS}};
        if(s.isSleep){this.ytdlMDCounts.subs.sleep++};
        if(s.isStar){this.ytdlMDCounts.subs.star++};
      };
      if(latestUpdateUTS>0){
        const ut2D:Date=this.evServ.dUT(latestUpdateUTS);
        this.ytdlMDCounts.subs.updated.d=ut2D;
        let lUStr:string=this.evServ.tAgo(this.ytdlMDCounts.subs.updated.d);
        if(lUStr==='0h'){lUStr='<1h'};
        this.ytdlMDCounts.subs.updated.str=lUStr;
      }else{this.ytdlMDCounts.subs.updated.str='-'};
      return Promise.resolve(true);
    }
  }
//---------------------------------------------------
  async ytdlGetPooCubeSubs(subsData:WCYTDLMDSub[],forceRefresh?:boolean):Promise<boolean>{
    this.cCons('ytdlGetPooCubeSubs','()...');
    if(!this.ytdlMDSubsUpdateInProg){
      this.ytdlMDSubsUpdateInProg=true;
      let prevSect:string=this.ytdlMyDailySection;
      if(prevSect!=='subs'){this.toggleMyDailySection('subs')};
      this.ytdlMDCounts.subs={c:0,t:0,p:0,star:0,sleep:0,updated:{d:null,str:'-'}};
      let doFresh:boolean=true;
      if(subsData&&forceRefresh){await this.ytdlCountSubs(subsData);if(this.ytdlMDCounts.subs.updated.str==='<1h'){for(let pi=0;pi<100;pi++){this.ytdlMDCounts.subs.p+=0.01};doFresh=false}else{doFresh=true}};
      if(doFresh){
        this.evServ.subscribe('getSubsProg',(perc:number)=>{
          if(perc>=1){this.ytdlMDCounts.subs.p=1;this.evServ.destroy('getSubsProg')}
          else{this.ytdlMDCounts.subs.p=perc};
        });
        let gSubsRes:youtube_v3.Schema$Subscription[]|false=await this.ytdlServ.ytapiGetMySubs();
        const lUD:Date=new Date();
        if(gSubsRes!==false){
          let newSubsArr:any[]=[];
          if(gSubsRes.length>0){
            for(let si=0;si<gSubsRes.length;si++){
              this.ytdlMDCounts.subs.t=(si+1);
              const newExistI:number=newSubsArr.findIndex((sObj:WCYTDLMDSub)=>sObj.sub.id===gSubsRes[si].id);
              if(newExistI===-1){
                let freshSub:WCYTDLMDSub={sub:gSubsRes[si],isStar:false,isSleep:false,selected:false,lastUpdated:lUD};
                const savedExist:number=this.ytdlData.myDaily.mySubs.findIndex((sObj:WCYTDLMDSub)=>sObj.sub.id===gSubsRes[si].id);
                if(savedExist!==-1){
                  freshSub.isStar=this.ytdlData.myDaily.mySubs[savedExist].isStar;
                  freshSub.isSleep=this.ytdlData.myDaily.mySubs[savedExist].isSleep;
                  freshSub.selected=(this.ytdlData.myDaily.mySubs[savedExist].hasOwnProperty('selected')?this.ytdlData.myDaily.mySubs[savedExist].selected:false);
                };
                newSubsArr.push(freshSub);
              };
            };
          };
          let ssBoth:WCYTDLMDSub[]=[],ssOne:WCYTDLMDSub[]=[],ors:WCYTDLMDSub[]=[];
          for(let ssi=0;ssi<newSubsArr.length;ssi++){
            const s:WCYTDLMDSub=newSubsArr[ssi];
            if(s.isSleep&&s.isStar){ssBoth.push(s)}
            else if((s.isStar&&!s.isSleep||!s.isStar&&s.isSleep)){ssOne.push(s)}
            else{ors.push(s)};
          };
          const sortdSubs:WCYTDLMDSub[]=ssBoth.concat(ssOne,ors);
          this.ytdlData.myDaily.mySubs=sortdSubs;
        };
        await this.ytdlCountSubs(this.ytdlData.myDaily.mySubs);
        this.ytdlMDCounts.subs.updated.d=lUD;
        let lUStr:string=this.evServ.tAgo(this.ytdlMDCounts.subs.updated.d);
        if(lUStr==='0h'){lUStr='<1h'};
        this.ytdlMDCounts.subs.updated.str=lUStr;
        this.doSaveData();
        this.ytdlMDSubsUpdateInProg=false;
        if(prevSect!=='subs'){this.toggleMyDailySection(prevSect)};
        return Promise.resolve(true);
      }else{
        this.ytdlMDSubsUpdateInProg=false;
        if(prevSect!=='subs'){this.toggleMyDailySection(prevSect)};
        return Promise.resolve(true);
      }
    }else{this.cCons('ytdlGetPooCubeSubs','Skipping - Already In Progress');return Promise.resolve(false)};
  }
//////////////////////////////////////////////////
  ytdlCountLists():Promise<boolean>{
    this.cCons('ytdlCountLists','()...');
    let nC:any={c:0,ttlVids:0,ttlDur:{secs:0,str:'0:00'}};
    for(let pli=0;pli<this.ytdlData.myDaily.myKodi.playlists.length;pli++){
      nC.c++;
      nC.ttlVids+=this.ytdlData.myDaily.myKodi.playlists[pli].all.length;
      for(let vi=0;vi<this.ytdlData.myDaily.myKodi.playlists[pli].all.length;vi++){
        nC.ttlDur.secs+=this.ytdlData.myDaily.myKodi.playlists[pli].all[vi].dur;
      };
    };
    if(nC.ttlDur.secs>0){nC.ttlDur.str=this.s2T(nC.ttlDur.secs)}else{nC.ttlDur.str='0:00'};
    if(!_.isEqual(nC,this.ytdlMDCounts.plists)){this.ytdlMDCounts.plists=nC};
    return Promise.resolve(true);
  }
//---------------------------------------------------
  async initKodiPLData():Promise<boolean>{
    this.cCons('initKodiPLData','()...');
    if(this.ytdlData.myDaily.myKodi.playlists.length>0){
      const tdDStr:string=this.evServ.todayPLStr();
      const tdPLI:number=this.ytdlData.myDaily.myKodi.playlists.findIndex(plO=>plO.date===tdDStr);
      if(tdPLI!==-1){
        if(this.ytdlData.myDaily.myKodi.playlists[tdPLI].hasOwnProperty('lastChecked')){
          const nowUTS:number=this.evServ.gUT(new Date());
          const actualLCUTS:number=this.evServ.gUT(new Date(this.ytdlData.myDaily.myKodi.playlists[tdPLI].lastChecked));
          const schedLCUTS:number=nowUTS-(this.ytdlUpdPLsEveryMins*60);
          if(actualLCUTS<schedLCUTS){
            this.cCons('initKodiPLData','[lastCheck] ('+this.evServ.dUT(actualLCUTS)+') [ > ] '+String(this.ytdlUpdPLsEveryMins)+'m [schedCheck] ('+this.evServ.dUT(schedLCUTS)+') => UPDATING...');
            await this.doUpdateYTDLPLData();
            return Promise.resolve(true);
          }else{
            const actualSecsAgo:number=(nowUTS-actualLCUTS);
            const lcLimitSecs:number=(this.ytdlUpdPLsEveryMins*60);
            const triggerInSecs:number=lcLimitSecs-actualSecsAgo;
            this.cCons('initKodiPLData','[lastCheck] ('+this.evServ.dUT(actualLCUTS)+') [ < ] '+String(this.ytdlUpdPLsEveryMins)+'m ('+String(Math.round(actualSecsAgo/60))+'m) [schedCheck] ('+this.evServ.dUT(schedLCUTS)+') => SCHEDULE UPDATE (in '+String(Math.round((triggerInSecs/60)))+'m)');
            await this.ytdlCountLists();
            const actualLCDate:Date=this.evServ.dUT(actualLCUTS);
            const actualLCStr:string=this.evServ.just24Time(actualLCDate);
            this.ytdlHeadUpdCycleInfo={lastChecked:{uts:actualLCUTS,str:actualLCStr},nextCheck:{secs:triggerInSecs,str:(this.s2T(triggerInSecs))}};
            this.pDOM();
            this.ytdlPLUpdateINT=setInterval(()=>{
              if(!this.sHeadScreenBtns.ytdl.filter((s:any)=>s.screen==='mydaily')[0].ctrlFns.pause.state){this.ytdlHeadUpdCycleInfo.nextCheck.secs--};
              if(this.ytdlHeadUpdCycleInfo.nextCheck.secs<1){
                clearInterval(this.ytdlPLUpdateINT);
                this.ytdlPLUpdateINT=null;
                this.ytdlHeadUpdCycleInfo.nextCheck.str='now';
                this.pDOM();
                this.doUpdateYTDLPLData();
              }else{this.ytdlHeadUpdCycleInfo.nextCheck.str=this.s2T(this.ytdlHeadUpdCycleInfo.nextCheck.secs);this.pDOM()}
            },1000);
            return Promise.resolve(true);
          };
        }else{await this.doUpdateYTDLPLData();return Promise.resolve(true)};
      }else{await this.doUpdateYTDLPLData();return Promise.resolve(true)};
    }else{await this.doUpdateYTDLPLData();return Promise.resolve(true)};
  }
//---------------------------------------------------
  nextCheckIco():string{const sRem:number=this.ytdlHeadUpdCycleInfo.nextCheck.secs;if(sRem<1200){return 'high'}else if(sRem>=1200&&sRem<=2400){return 'medium'}else if(sRem>2400){return 'low'}}
//---------------------------------------------------
  async doUpdateYTDLPLData():Promise<boolean>{
    this.cCons('doUpdateYTDLPLData','()...');
    if(!this.ytdlMDPLUpdateInProg){
      this.ytdlMDPLUpdateInProg=true;
      let prevSect:string=this.ytdlMyDailySection;
      if(prevSect!=='plists'){this.toggleMyDailySection('plists')};
      if(this.ytdlPLUpdateINT!==null){clearInterval(this.ytdlPLUpdateINT);this.ytdlPLUpdateINT=null};
      if(this.ytdlData.myDaily.mySubs.length>0){
        const ulPListen=this.evServ.subscribe('uploadPLDataProg',(perc:number)=>{this.ytdlProgressPerc=Math.round(perc*100);this.pDOM();if(perc===1){this.evServ.destroy('uploadPLDataProg');ulPListen.unsubscribe()}});
        const todayPLStr:string=this.evServ.todayPLStr();
        let todayPLObj:WCYTDLMDKodiPLDay={date:todayPLStr,all:[],sleep:[],star:[],ors:[],selected:false};
        const existVPLIndex:number=this.ytdlData.myDaily.myKodi.playlists.findIndex((plO:any)=>plO.date===todayPLStr);
        if(existVPLIndex!==-1){todayPLObj=this.ytdlData.myDaily.myKodi.playlists[existVPLIndex]};
        const b4UpdAllArr:WCYTDLMDPLItem[]=todayPLObj.all;
        const csuRes:{updPL:WCYTDLMDKodiPLDay,didChange:boolean}=await this.ytdlServ.getUploadPLData(todayPLObj,this.ytdlData.myDaily.mySubs);
        if(csuRes.updPL.all.length>0){
          const oldIdsArr:string[]=b4UpdAllArr.map((oI)=>(oI.vId));
          const updIdsArr:string[]=csuRes.updPL.all.map((nI)=>(nI.vId));
          const newIdsArr:string[]=updIdsArr.filter((id:string)=>!oldIdsArr.includes(id));
          let newObjsArr:WCYTDLMDPLItem[]=[];for(let ni=0;ni<newIdsArr.length;ni++){newObjsArr.push(csuRes.updPL.all.filter((o)=>o.vId===newIdsArr[ni])[0])};
          if(newObjsArr.length>0){this.notifyNewMDList=newObjsArr}else{this.notifyNewMDList=null};
        };
        if(csuRes.didChange){
          if(existVPLIndex!==-1){
            this.ytdlData.myDaily.myKodi.playlists[existVPLIndex]=csuRes.updPL;
            this.ytdlData.myDaily.myKodi.playlists[existVPLIndex].lastChecked=new Date();
          }else{
            this.ytdlData.myDaily.myKodi.playlists.unshift(csuRes.updPL);
            this.ytdlData.myDaily.myKodi.playlists[0].lastChecked=new Date()
          };
        };
      };
      //------------
      let okPLDates:string[]=[],okPLDirs:string[]=[];
      const lclMDPLDir:string='C:\\myYTDLData\\mydaily\\kodipls',lclDirList:string[]=await readdir(lclMDPLDir);
      const nowDate:Date=new Date();
      const delOldPLDir=async(dirP:string):Promise<boolean>=>{if((await this.exists(dirP))){await rm(dirP,{recursive:true,force:true});return Promise.resolve(true)}else{return Promise.resolve(true)}};
      const tdDateStr:string=this.evServ.strFormat(nowDate,'dd/MM/yy'),tdDirStr:string=tdDateStr.replace(/\//g,'');
      okPLDates.push(tdDateStr);okPLDirs.push(tdDirStr);
      const tdSub1Date:Date=this.evServ.subDs(nowDate,1),tdSub1DateStr:string=this.evServ.strFormat(tdSub1Date,'dd/MM/yy'),tdS1DirStr:string=tdSub1DateStr.replace(/\//g,'');
      okPLDates.push(tdSub1DateStr);okPLDirs.push(tdS1DirStr);
      const tdSub2Date:Date=this.evServ.subDs(nowDate,2),tdSub2DateStr:string=this.evServ.strFormat(tdSub2Date,'dd/MM/yy'),tdS2DirStr:string=tdSub2DateStr.replace(/\//g,'');
      okPLDates.push(tdSub2DateStr);okPLDirs.push(tdS2DirStr);
      const tdSub3Date:Date=this.evServ.subDs(nowDate,3),tdSub3DateStr:string=this.evServ.strFormat(tdSub3Date,'dd/MM/yy'),tdS3DirStr:string=tdSub3DateStr.replace(/\//g,'');
      okPLDates.push(tdSub3DateStr);okPLDirs.push(tdS3DirStr);
      if(lclDirList&&lclDirList.length>0){for(let lci=0;lci<lclDirList.length;lci++){const lclDirName:string=lclDirList[lci],lclDirPath:string=path.join(lclMDPLDir,lclDirName);if(!okPLDirs.includes(lclDirName)){await delOldPLDir(lclDirPath)}}};
      this.ytdlData.myDaily.myKodi.playlists=this.ytdlData.myDaily.myKodi.playlists.filter((plO:WCYTDLMDKodiPLDay)=>okPLDates.includes(plO.date));
      //------------
      this.doSaveData();
      await this.ytdlCountLists();
      if(this.ytdlPLUpdateINT!==null){clearInterval(this.ytdlPLUpdateINT);this.ytdlPLUpdateINT=null};
      const justCheckedDate=new Date();
      const justCheckedUTS=this.evServ.gUT(justCheckedDate);
      const justCheckedStr:string=this.evServ.just24Time(justCheckedDate);
      this.ytdlHeadUpdCycleInfo={lastChecked:{uts:justCheckedUTS,str:justCheckedStr},nextCheck:{secs:(this.ytdlUpdPLsEveryMins*60),str:(this.s2T((this.ytdlUpdPLsEveryMins*60)))}};
      this.pDOM();
      this.ytdlPLUpdateINT=setInterval(()=>{
        this.ytdlHeadUpdCycleInfo.nextCheck.secs--;
        if(this.ytdlHeadUpdCycleInfo.nextCheck.secs<1){
          clearInterval(this.ytdlPLUpdateINT);
          this.ytdlPLUpdateINT=null;
          this.ytdlHeadUpdCycleInfo.nextCheck.str='now';
          this.pDOM();
          this.doUpdateYTDLPLData();
        }else{this.ytdlHeadUpdCycleInfo.nextCheck.str=this.s2T(this.ytdlHeadUpdCycleInfo.nextCheck.secs);this.pDOM()}
      },1000);
      if(prevSect!=='plists'){this.toggleMyDailySection(prevSect)};
      this.doDownUpPLVids();this.ytdlMDPLUpdateInProg=false;return Promise.resolve(true);
    }else{this.cCons('doUpdateYTDLPLData','Skipping - Already In Progress');return Promise.resolve(true)};
  }
//////////////////////////////////////////////////
  async doDownUpPLVids():Promise<boolean>{
    //WCMDDLCMDProg
    this.cCons('doDownUpPLVids','()...');
    if(!this.ytdlMDDLsInProgress){
      this.ytdlMDDLsInProgress=true;
      const cBs=(b:number):string=>{const sA:string[]=['b','kb','mb','gb'];if(b===0){return '-'};const i:number=(Math.floor(Math.log(b)/Math.log(1024)));if(i===0){return b+sA[i]};return (b/Math.pow(1024,i)).toFixed(1)+sA[i]};
      const cSs=(s:number):string=>{return (this.s2T(Math.round(s)))};
      const vIsOK=async(plVO:WCYTDLMDPLItem):Promise<boolean>=>{
        const vEx:boolean=await this.exists(plVO.vPath);
        if(vEx){
          const vSz:{r:boolean,d:any}=await this.statSize(plVO.vPath);
          if(vSz.r&&vSz.d>0){return Promise.resolve(true)}
          else{
            try{await unlink(plVO.vPath);return Promise.resolve(false)}
            catch(e){return Promise.resolve(false)}
          }
        }else{return Promise.resolve(false)}
      };
      //----------
      let totalTime:any={e:0,r:0};
      let doDLVids:WCYTDLMDPLItem[]=[];
      //----------
      const dayPLIndex:number=this.ytdlData.myDaily.myKodi.playlists.findIndex((plO:any)=>plO.date===(this.evServ.todayPLStr()));
      if(dayPLIndex!==-1&&this.ytdlData.myDaily.myKodi.playlists[dayPLIndex].all.length>0){
        for(let plvi=0;plvi<this.ytdlData.myDaily.myKodi.playlists[dayPLIndex].all.length;plvi++){
          const plO=this.ytdlData.myDaily.myKodi.playlists[dayPLIndex].all[plvi];
          if((plO.plCats.includes('star')||plO.plCats.includes('sleep'))){
            const checkVRes:boolean=await vIsOK(plO);
            if(!checkVRes){doDLVids.push(plO)};
          };
        };
        if(doDLVids.length>0){
          //----------
          let prevSect:string=this.ytdlMyDailySection;
          if(prevSect!=='dls'){this.toggleMyDailySection('dls')};
          //----------
          for(let ddi=0;ddi<doDLVids.length;ddi++){doDLVids[ddi]['dlDone']=false};
          this.ytdlMDVideoDLsList=doDLVids;
          this.ytdlMDCounts.dls={c:0,t:this.ytdlMDVideoDLsList.length,p:0,size:{bytes:0,str:''},time:{e:'',r:''}};
          const cmdDLProgListener=(e:any,args:any[])=>{
            const pO:WCMDDLCMDProg=args[0];
            this.ytdlMDDLItemCounts={d:{no:pO.dl.no,str:pO.dl.str},t:{no:pO.ttl.no,str:pO.ttl.str},p:{no:pO.perc.no,str:pO.perc.str.replace('%','')},e:{no:pO.ela.no,str:pO.ela.str},r:{no:pO.eta.no,str:pO.eta.str}};this.pDOM();
          };
          ipcRenderer.on('ytdlMDDLVideoProg',cmdDLProgListener);
          for(let vi=0;vi<this.ytdlMDVideoDLsList.length;vi++){
            this.ytdlMDVIDIsDL=this.ytdlMDVideoDLsList[vi].vId;
            this.ytdlMDDLItemCounts={d:{no:0,str:''},t:{no:0,str:''},p:{no:0,str:''},e:{no:0,str:''},r:{no:0,str:''}};
            const dlRes:boolean=await ipcRenderer.invoke('ytdlMDDLVideo',[this.ytdlMDVIDIsDL]);
            if(dlRes){
              const plAllVIndex:number=this.ytdlData.myDaily.myKodi.playlists[dayPLIndex].all.findIndex(plO=>plO.vId===this.ytdlMDVIDIsDL);
              if(plAllVIndex!==-1){this.ytdlData.myDaily.myKodi.playlists[dayPLIndex].all[plAllVIndex]['dlDone']=true};
              this.ytdlMDVideoDLsList[vi].dlDone=true;
              this.doSaveData();
            };
            this.ytdlMDCounts.dls.c++;
            let niceP:number=Math.floor((this.ytdlMDCounts.dls.c/this.ytdlMDCounts.dls.t)*100);
            this.ytdlMDCounts.dls.p=niceP;
            this.ytdlMDCounts.dls.size.bytes+=this.ytdlMDDLItemCounts.t.no;
            this.ytdlMDCounts.dls.size.str=cBs(this.ytdlMDCounts.dls.size.bytes);
            totalTime.e+=this.ytdlMDDLItemCounts.e.no;
            this.ytdlMDCounts.dls.time.e=cSs(totalTime.e);
            this.pDOM();
          };
          this.ytdlMDVIDIsDL='';
          this.ytdlMDDLsFinished=true;
          ipcRenderer.removeListener('ytdlMDDLVideoProg',cmdDLProgListener)
          this.pDOM();
          await this.doW(1.5);
          this.ytdlMDDLItemCounts={d:{no:0,str:''},t:{no:0,str:''},p:{no:0,str:''},e:{no:0,str:''},r:{no:0,str:''}};
          this.ytdlMDCounts.dls={c:0,t:0,p:0,size:{bytes:0,str:''},time:{e:'',r:''}};
          this.ytdlMDVideoDLsList=[];
          await this.doW(.5);
          if(prevSect!=='dls'){this.toggleMyDailySection(prevSect)};
          this.ytdlMDDLsFinished=false;
          this.doSaveData();this.addUpdateMDKodiPlaylist();this.ytdlMDDLsInProgress=false;
          //----------
          return Promise.resolve(true);
        }else{this.doSaveData();this.addUpdateMDKodiPlaylist();this.ytdlMDDLsInProgress=false;this.cCons('doDownUpPLVids','No Missing Vids to DL');return Promise.resolve(true)};
      }else{this.doSaveData();this.addUpdateMDKodiPlaylist();this.ytdlMDDLsInProgress=false;this.cCons('doDownUpPLVids','No DayPL Found');return Promise.resolve(false)};
    }else{this.cCons('doDownUpPLVids','Skipped - Already In Progress');return Promise.resolve(false)};
  }
//////////////////////////////////////////////////
  async addUpdateMDKodiPlaylist(){
    this.cCons('addUpdateMDKodiPlaylist','()...');
    if(!this.ytdlMDUpdKodiInProg){
      const dayPLIndex:number=this.ytdlData.myDaily.myKodi.playlists.findIndex((plO:any)=>plO.date===(this.evServ.todayPLStr()));
      const todayPL:WCYTDLMDKodiPLDay=this.ytdlData.myDaily.myKodi.playlists[dayPLIndex];
      ipcRenderer.send('addUpdateMDKodiPL',[todayPL,this.notifyNewMDList]);
      if(this.notifyNewMDList===null){this.ytdlHeadUpdLastChange=0}else{this.ytdlHeadUpdLastChange=this.notifyNewMDList.length};
      this.notifyNewMDList=null;
    }else{this.cCons('addUpdateMDKodiPlaylist','Skipped - Already In Progress')}
  }
/////////////////////////////////////////////////
  isTodayPL(plObject:WCYTDLMDKodiPLDay):boolean{
    const todayStr:string=this.evServ.todayPLStr();
    if(plObject.date===todayStr){return true}else{return false}
  }
/////////////////////////////////////////////////
  async doMDSleepPhoneUpload():Promise<boolean>{
    this.cCons('doMDSleepPhoneUpload','()...');
    await ipcRenderer.invoke('quickMDPhoneUpload');
    return Promise.resolve(true);
  }
/////////////////////////////////////////////////
  async doMDSleepPhonePlay():Promise<boolean>{
    this.cCons('doMDSleepPhonePlay','()...');
    ipcRenderer.send('doPhoneCMD',['pop']);
    await this.doW(0.5);
    ipcRenderer.send('doPhoneCMD',['dim']);
    await this.doW(0.5);
    ipcRenderer.send('doPhoneCMD',['play']);
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
  ytdlMDUPhoneName():string{const fObj:WCADBPushItem=this.ytdlMDUploads.phone.list[this.ytdlMDUploads.phone.prog.listProg.c-1],fN:string=path.basename(fObj.localPath),niceBytes:string=this.cvtBytes(fObj.ttlBytes);return fN+' ('+niceBytes+')'}
//-------------------------------------------------
  ytdlMDUConvName():string{const fObj:WCYTDLMDPLItem=this.ytdlMDUploads.conv.list[this.ytdlMDUploads.conv.prog.listProg.c-1],fN:string=path.basename(fObj.vPath).replace('.mp4','');return fN+' .MP4 ➔ .MP3'};
//-------------------------------------------------
  clearMDUploadsTab(){
    this.cCons('clearDMUploadsTab','()...');
    const clsObj:any={kodi:{inProg:false,status:[]},conv:{inProg:false,list:[],prog:{itemProg:{p:0,s:'0%'},listProg:{c:0,t:0,p:0,s:'0%'}}},phone:{inProg:false,list:[],prog:{itemProg:{p:0,s:'0%'},listProg:{c:0,t:0,p:0,s:'0%'}}}};
    if(!_.isEqual(this.ytdlMDUploads,clsObj)){this.ytdlMDUploads=clsObj};
    if(this.ytdlMDUShowing){this.ytdlMDUShowing=false};
    if(this.ytdlMDUPriorSect!==null&&this.ytdlMyDailySection!==this.ytdlMDUPriorSect){this.toggleMyDailySection(this.ytdlMDUPriorSect)};
    this.ytdlMDUPriorSect=null;
    this.pDOM();
  }
//-------------------------------------------------
  async ytdlInit():Promise<boolean>{
    this.cCons('ytdlInit','()...');
    this.evServ.subscribe('ytapiShowCodeInput',()=>{this.ytdlYTAPIInputPop(null,'show',null)});
    this.evServ.subscribe('ytapiExtWebURL',(url:string)=>{ipcRenderer.send('openExtWebURL',[url])});
    ipcRenderer.on('ytKodiVidPlay',async(e:any,args:any[])=>{console.log(args[0])});
    ipcRenderer.on('mwKodiPlyrStart',async(e:any,args:any[])=>{
      const doAddV=(data:WCKodiPlyrInfo):boolean=>{if(data&&data.hasOwnProperty('item')&&data.item&&typeof data.item==='object'&&data.item.hasOwnProperty('title')&&data.item.title&&data.item.title.trim().length>0&&data.hasOwnProperty('pos')&&data.pos&&typeof data.pos==='object'&&data.pos.hasOwnProperty('total')&&data.pos.total&&data.pos.total>0){const testTitle:string=data.item.title.trim(),existHistV:number=this.ytdlData.myDaily.myHistory.findIndex((hO:WCYTDLMDLast6Item)=>hO.vTitle===testTitle);if(existHistV===-1){return true}else{return false}}else{return false}}
      //-----------
      const kPlyrData:WCKodiPlyrInfo=args[0].plyr;
      console.log(kPlyrData);
      if((doAddV(kPlyrData))){
        if(this.ytdlKodiPlayItemInProg){this.cCons('IPC|RECEIVED-[ytKodiPlyrStart]','(SKIPPED): ytdlKodiPlayItemInProg = TRUE');return}
        else{this.ytdlKodiPlayItemInProg=true};
        this.cCons('IPC|RECEIVED-[ytKodiPlyrStart]','(STARTED): '+args[0].plyr.item.title);
        const vidDate:Date=new Date();
        let vidUrl:string='file://';if(kPlyrData.item.title.startsWith('video_')){vidUrl=kPlyrData.item.title.replace('video_','https://www.youtube.com/watch?v=')};
        let newKYTItem:WCYTDLMDLast6Item={vUrl:vidUrl,vTitle:kPlyrData.item.title,date:{d:vidDate,u:(this.evServ.gUT(vidDate)),s:(this.evServ.strFormat(vidDate,'dd/MM/yy HH:mm:ss'))},dur:{secs:kPlyrData.pos.total,str:(this.s2T(kPlyrData.pos.total))},src:'kodi'};
        this.ytdlData.myDaily.myHistory.push(newKYTItem);
        this.doSaveData();
        await this.toggleMDHistoryMode(null,true);
        this.cCons('IPC|RECEIVED-[ytKodiPlyrStart]','(ADDED): Video to Watch History');console.log(newKYTItem);
      }else{this.cCons('IPC|RECEIVED-[ytKodiPlyrStart]','(SKIPPED): Video Lacks Title/Dur OR Already in History List')}
    });
    ipcRenderer.on('mwKodiPlyrStop',async(e:any,args:any[])=>{this.cCons('IPC|RECEIVED-[ytKodiPlyrStop]','(STOPPED)');this.ytdlKodiPlayItemInProg=false;this.pDOM()});
    //------------
    this.sHeader={status:'warn',text:'stopped'};
    this.ytdlMSQLRunning=await this.ytdlServ.startStopMySql('start');
    if(this.ytdlMSQLRunning){
      const getDBICRes:number|false=await this.ytdlServ.getTTLDBCapsCount();if(getDBICRes!==false){this.ytdlDBItemCount=getDBICRes;this.ytdlDBStats.ttlCaps=getDBICRes};
      const getDBDSRes:{mb:number,str:string}|false=await this.ytdlServ.getTTLDBByteSize();if(getDBDSRes!==false){this.ytdlDBStats.diskSize=getDBDSRes};
      const getDBPRes:{ms:number,str:string}|false=await this.ytdlServ.getDBPing();if(getDBPRes!==false){this.ytdlDBStats.ping=getDBPRes};
      this.pDOM();
    };
    //-------
    const mongoDBInitRes=await ipcRenderer.invoke('initMDB');
    if(!mongoDBInitRes){this.ytdlMDBIsConn=false;this.pDOM()}
    else{
      this.ytdlMDBIsConn=true;
      this.ytdlMDBDocsCount=mongoDBInitRes;
      ipcRenderer.on('mdbCMDMonEvent',(e:any,args:any[])=>{
        this.ytdlMDBCMDMon.type=args[0];
        if(args.length>1&&args[1]){this.ytdlMDBCMDMon.event=args[1]}else{this.ytdlMDBCMDMon.event=null};
        if(!this.ytdlMDBCMDMon.showing){this.ytdlMDBCMDMon.showing=true};
        this.pDOM();
        if(this.ytdlMDBCMDMon.type==='started'){
          this.ytdlMDBCMDMonDur.started=this.evServ.gUT(new Date());
          if(this.ytdlMDBCMDMonDur.int!==null){clearInterval(this.ytdlMDBCMDMonDur.int);this.ytdlMDBCMDMonDur.int=null};
          if(this.ytdlMDBCMDBarTO!==null){clearTimeout(this.ytdlMDBCMDBarTO);this.ytdlMDBCMDBarTO=null};
          this.ytdlMDBCMDMonDur.int=setInterval(()=>{
            const nowUTS:number=this.evServ.gUT(new Date());
            const secDiff:number=nowUTS-this.ytdlMDBCMDMonDur.started;
            if(secDiff>0){this.ytdlMDBCMDMonDur.elapsed=(this.s2T(secDiff))};
            this.pDOM();
          },1000);
          this.pDOM();
        }else{
          clearInterval(this.ytdlMDBCMDMonDur.int);this.pDOM();
          this.ytdlMDBCMDBarTO=setTimeout(()=>{
            this.ytdlMDBCMDBarTO=null;
            this.ytdlMDBCMDMon={showing:false,type:null,event:null};
            this.ytdlMDBCMDMonDur={int:null,started:null,elapsed:''};
            this.pDOM();
          },5000);
        };
        this.pDOM();
      });
      this.pDOM();
      await ipcRenderer.invoke('doMDBQuery',['ping',{ping:1}]);
    };
    //-------
    await this.toggleMDHistoryMode(null,true);
    // Saved Data Counts
    if(this.ytdlData.scrapeItems.length>0){for(let yi=0;yi<this.ytdlData.scrapeItems.length;yi++){this.ytdlTermsInfo.counts.actual.ttl++;this.ytdlTermsInfo.counts.actual[this.ytdlData.scrapeItems[yi].t.type]++};this.pDOM()};
    if(this.ytdlData.searchItems.length>0){
      let srCounts:WCYTDLSRCounts={hits:0,caps:this.ytdlData.searchItems.length,time:{db:0,post:0,ttl:{no:0,str:'0s'}}};
      for(let hi=0;hi<this.ytdlData.searchItems.length;hi++){srCounts.hits+=this.ytdlData.searchItems[hi].matches.length};
      this.ytdlZeroHits=this.ytdlData.searchItems.filter((ri:WCYTDLSRItem)=>ri.matches.length===0).length;
      this.ytdlSRCounts=srCounts;
      this.ytdlSearchStage='finished';
      this.pDOM()
    };
    if(this.ytdlData.selectedItems.length>0){
      let selCs:any={hits:0,caps:this.ytdlData.selectedItems.length,dur:{no:0,str:''}};
      for(let i=0;i<this.ytdlData.selectedItems.length;i++){
        selCs.hits+=this.ytdlData.selectedItems[i].matches.length;
        let combDur:number=0;
        if(this.ytdlData.selectedItems[i].matches.length>0){
          for(let di=0;di<this.ytdlData.selectedItems[i].matches.length;di++){combDur+=this.ytdlData.selectedItems[i].matches[di].transTime.dur};
        };
        selCs.dur.no+=combDur;
      };
      if(Math.round(selCs.dur.no)<60){selCs.dur.str=String(Math.round(selCs.dur.no))+'s'}
      else{selCs.dur.str=this.evServ.secsToMSS(Math.round(selCs.dur.no))};
      this.ytdlSelectedCounts=selCs;
      this.pDOM();
    };
    if(this.ytdlData.dlBatches.length>0){
      this.ytdlBatchProg.batches.t=this.ytdlData.dlBatches.length;
      for(let b=0;b<this.ytdlData.dlBatches.length;b++){const tB:WCYTDLDLBatch=this.ytdlData.dlBatches[b];this.ytdlBatchProg.items.t+=tB.items.length;for(let bi=0;bi<tB.items.length;bi++){const tBI:WCYTDLSRItem=tB.items[bi];this.ytdlBatchProg.matches.t+=tBI.matches.length}};
      this.pDOM();
    };
    this.pDOM();
    return Promise.resolve(true);
  }
//------------------------------------------------
  openExtMDHistVideo(vUrl:string){ipcRenderer.send('openExtWebURL',[vUrl])};
//------------------------------------------------
  async toggleMDHistoryMode(mode:'a'|'m'|'w'|'d'|null,justRefresh?:boolean):Promise<boolean>{
    this.cCons('toggleMDHistoryMode','('+String(mode)+','+(justRefresh?String(justRefresh):'_')+')...');
    const recon=async(newMode?:'a'|'m'|'w'|'d'):Promise<boolean>=>{
      this.mdHistModeListReady=false;
      await this.doW(0.25);
      const nowUTS:number=this.evServ.gUT(new Date());
      if(newMode){this.mdHistoryMode=newMode};
      let nML:WCYTDLMDLast6Item[]=this.ytdlData.myDaily.myHistory;
      if(this.mdHistoryMode==='m'){
        const UTSCut:number=nowUTS-(86400*28);
        nML=nML.filter(hO=>hO.date.u>UTSCut)
      }else if(this.mdHistoryMode==='w'){
        const UTSCut:number=nowUTS-(86400*7);
        nML=nML.filter(hO=>hO.date.u>UTSCut);
      }else if(this.mdHistoryMode==='d'){
        const UTSCut:number=nowUTS-86400;
        nML=nML.filter(hO=>hO.date.u>UTSCut);
      };
      // Remove Dupes (time/title)
      nML=_.uniqBy(nML,((hO:WCYTDLMDLast6Item)=>hO.date.u));
      nML=_.uniqBy(nML,((hO:WCYTDLMDLast6Item)=>hO.vTitle));
      // Get Missing Durs
      let nMLDs:WCYTDLMDLast6Item[]=[];
      for(let hi=0;hi<nML.length;hi++){
        if(nML[hi].hasOwnProperty('dur')&&!_.isEmpty(nML[hi].dur)&&nML[hi].dur.hasOwnProperty('secs')&&nML[hi].dur.secs&&nML[hi].dur.secs>0&&nML[hi].dur.hasOwnProperty('str')&&nML[hi].dur.str&&nML[hi].dur.str.length>0&&nML[hi].dur.str!=='-'){nMLDs.push(nML[hi])}
        else{
          if(nML[hi].vUrl&&nML[hi].vUrl.length>0){
            if(nML[hi].vUrl.startsWith('C:')){
              const getLclDur:{secs:number,str:string}|false=await ipcRenderer.invoke('localGetDurOnly',[nML[hi].vUrl]);
              if(getLclDur!==false){nML[hi]['dur']=getLclDur;nMLDs.push(nML[hi])};
            }else if(nML[hi].vUrl.startsWith('http://www.youtube.com/')||nML[hi].vUrl.startsWith('https://www.youtube.com/')){
              const getYTDur:number=await ipcRenderer.invoke('ytdlGetDurOnly',[nML[hi].vUrl]);
              if(getYTDur>0){nML[hi]['dur']={secs:Math.round(getYTDur),str:(this.s2T((Math.round(getYTDur))))};nMLDs.push(nML[hi])};
            }
          }
        }
      };
      // Sort Items (by time)
      nMLDs=_.orderBy(nML,'date.u','desc');
      this.mdHistModeList=nMLDs;
      await this.doW(0.25);
      this.mdHistModeListReady=true;
      this.pDOM();
      return Promise.resolve(true);
    };
    if(this.mdHistModeListReady){
      if(justRefresh&&justRefresh===true){await recon();return Promise.resolve(true)}
      else{if(mode!==this.mdHistoryMode){this.mdHistoryMode=mode;await recon(mode);return Promise.resolve(true)}};
    }else{this.cCons('toggleMDHistoryMode','Skipped - Already in Progress');return Promise.resolve(true)};
  };
//------------------------------------------------
  toggleMyDailySection(mdSection:string){this.ytdlMyDailySection=mdSection;this.pDOM()};
//------------------------------------------------
  ytdlToggleHideZeroHits(){
    this.cCons('ytdToggleHideZeroHits','()...');
    if(this.ytdlHideZeroHits){this.ytdlHideZeroHits=false}else{this.ytdlHideZeroHits=true};this.pDOM();
    this.doSBar('show',{type:(this.ytdlHideZeroHits?'ok':'error'),msg:'YTDL Show All '+(this.ytdlHideZeroHits?'ON':'OFF')});
  }
//------------------------------------------------
  ytdlSelectAllNone(allNone:string){
    this.cCons('ytdlSelectAllNone','()...');
    if(allNone==='all'){
      let all:WCYTDLSRItem[]=this.ytdlData.searchItems;
      if(this.ytdlHideZeroHits){all=all.filter((sr:WCYTDLSRItem)=>sr.matches.length>0)};
      this.ytdlData.selectedItems=all;
      let nCs:any={hits:0,caps:this.ytdlData.selectedItems.length,dur:{no:0,str:''}};
      for(let i=0;i<this.ytdlData.selectedItems.length;i++){
        nCs.hits+=this.ytdlData.selectedItems[i].matches.length;
        let combDur:number=0;for(let di=0;di<this.ytdlData.selectedItems[i].matches.length;di++){combDur+=this.ytdlData.selectedItems[i].matches[di].transTime.dur};
        nCs.dur.no+=combDur;
      };
      if(Math.round(nCs.dur.no)<60){nCs.dur.str=String(Math.round(nCs.dur.no))+'s'}
      else{nCs.dur.str=this.evServ.secsToMSS(Math.round(nCs.dur.no))};
      this.ytdlSelectedCounts=nCs;
      this.pDOM();
    }else{
      this.ytdlData.selectedItems=[];
      this.ytdlSelectedCounts={hits:0,caps:0,dur:{no:0,str:''}};
      this.pDOM();
    };
    this.doSaveData();
  }
//------------------------------------------------
  ytdlDownloadStart(){
    this.cCons('ytdlDownloadStart','()...');
    this.ytdlDLBatches(false);
  }
//------------------------------------------------
  ytdlDownloadPause(){
    this.cCons('ytdlDownloadPause','()...');
  }
//------------------------------------------------
  ytdlDownloadStop(){
    this.cCons('ytdlDownloadStop','()...');
  }
//------------------------------------------------
  async ytdlDLBatches(isResume:boolean,sessionId?:string):Promise<boolean>{
    this.cCons('ytdlDLBatches','()...');
    if(this.ytdlData.dlBatches.length>0){
      const dlDir:string='C:\\myYTDLData\\dls';
      const tDate:Date=new Date();
      let fSIndex:number|null=null,fSId:string|null=null;
      if(isResume&&sessionId&&(await this.exists(path.join(dlDir,sessionId)))){
        fSId=sessionId;
        fSIndex=this.ytdlData.finSessions.findIndex((s:WCYTDLFinSession)=>s.sessionId===sessionId);
        this.ytdlData.finSessions[fSIndex].time={date:tDate,str:(this.evServ.dNice(tDate))};
      }else{
        fSId=(this.evServ.gUT(tDate)).toString();
        this.ytdlData.finSessions.push({sessionId:fSId,sessionPath:path.join(dlDir,'/'+fSId),time:{date:tDate,str:(this.evServ.dNice(tDate))},batches:[]});
        fSIndex=this.ytdlData.finSessions.findIndex((s:WCYTDLFinSession)=>s.sessionId===fSId);
      };
      this.ytdlBatchProg={batches:{c:0,t:0,p:0},items:{c:0,t:0,p:0},matches:{c:0,t:0,p:0},file:0};
      this.ytdlBatchProg.batches.t=this.ytdlData.dlBatches.length;
      for(let b=0;b<this.ytdlData.dlBatches.length;b++){const tB:WCYTDLDLBatch=this.ytdlData.dlBatches[b];this.ytdlBatchProg.items.t+=tB.items.length;for(let bi=0;bi<tB.items.length;bi++){const tBI:WCYTDLSRItem=tB.items[bi];this.ytdlBatchProg.matches.t+=tBI.matches.length}};
      const biCSub=this.evServ.subscribe('dlItemProg',()=>{this.ytdlBatchProg.items.c++;this.ytdlBatchProg.items.p=(this.ytdlBatchProg.items.c/this.ytdlBatchProg.items.t);this.pDOM()});
      const bimCSub=this.evServ.subscribe('dlMatchProg',()=>{this.ytdlBatchProg.matches.c++;this.ytdlBatchProg.matches.p=(this.ytdlBatchProg.matches.c/this.ytdlBatchProg.matches.t);this.pDOM()});
      const filePSub=this.evServ.subscribe('dlFileProg',(perc:number)=>{this.ytdlBatchProg.file=perc;this.pDOM()});
      //-----------
      for(let bi=0;bi<this.ytdlData.dlBatches.length;bi++){
        const tBI:WCYTDLDLBatch=this.ytdlData.dlBatches[bi];
        const dlBatchRes:WCYTDLFinItem[]|false=await this.ytdlServ.dlBatch(tBI,fSId,bi);
        if(dlBatchRes!==false){
          if(this.ytdlData.finSessions[fSIndex].batches.length>0){
            const existBI:number=this.ytdlData.finSessions[fSIndex].batches.findIndex((bi:WCYTDLFinBatch)=>bi.batchPath===path.join(dlDir,'/'+fSId+'/B'+String(bi)));
            if(existBI!==-1){this.ytdlData.finSessions[fSIndex].batches[existBI]={batchId:'B'+String(bi),batchPath:path.join(dlDir,'/'+fSId+'/B'+String(bi)),term:tBI.term,items:dlBatchRes}}
            else{this.ytdlData.finSessions[fSIndex].batches.push({batchId:'B'+String(bi),batchPath:path.join(dlDir,'/'+fSId+'/B'+String(bi)),term:tBI.term,items:dlBatchRes})};
          };
        };
        this.ytdlBatchProg.batches.c++;this.ytdlBatchProg.batches.p=(this.ytdlBatchProg.batches.c/this.ytdlBatchProg.batches.t);this.pDOM();
      };
      this.doSaveData();
      biCSub.unsubscribe();bimCSub.unsubscribe();filePSub.unsubscribe();
      this.evServ.destroy('dlItemProg');this.evServ.destroy('dlMatchProg');this.evServ.destroy('dlFileProg');
      return Promise.resolve(true);
    }else{this.cCons('ytdlDLBatches','ERROR: No Items in dlBatches List');return Promise.resolve(false)};
  }
//------------------------------------------------
  finishClsBatches(){
    this.cCons('finishClsBatches','()...');
    if(this.ytdlData.dlBatches.length>0){this.ytdlData.dlBatches=[];this.ytdlBatchProg={batches:{c:0,t:0,p:0},items:{c:0,t:0,p:0},matches:{c:0,t:0,p:0},file:0};this.pDOM();this.doSaveData()}
  }
//------------------------------------------------
  resumeFinSession(sId:string){
    this.cCons('resumeFinSession','('+sId+')...');
    this.ytdlDLBatches(true,sId);
  }
//------------------------------------------------
  async delFinSessionData(session:WCYTDLFinSession):Promise<boolean>{
    if((await this.exists(session.sessionPath))){try{await rm(session.sessionPath,{recursive:true,force:true})}catch(e){console.log(e);return Promise.resolve(false)}};
    const existFSI:number=this.ytdlData.finSessions.findIndex((fs:WCYTDLFinSession)=>fs.sessionId===session.sessionId);
    if(existFSI!==-1){this.ytdlData.finSessions=this.ytdlData.finSessions.filter((fs:WCYTDLFinSession)=>fs.sessionId!==session.sessionId);this.doSaveData()};
    if(!(await this.exists(session.sessionPath))&&this.ytdlData.finSessions.findIndex((fs:WCYTDLFinSession)=>fs.sessionId===session.sessionId)===-1){return Promise.resolve(true)}
    else{return Promise.resolve(false)};
  }
//------------------------------------------------
  ytdlSRIsSelected(id:string){if(this.ytdlData.selectedItems.findIndex((sr:WCYTDLSRItem)=>sr.vId===id)!==-1){return true}else{return false}};
//------------------------------------------------
  ytdlSelectSRItem(srMatch:WCYTDLSRItem){
    let AoR:'a'|'r'|null=null;if(this.ytdlData.selectedItems.length>0){this.ytdlData.selectedItems.findIndex((si:WCYTDLSRItem)=>si.vId===srMatch.vId)!==-1?AoR='r':AoR='a'}else{AoR='a'};
    if(AoR==='a'){
      this.ytdlData.selectedItems.push(srMatch);
      this.ytdlSelectedCounts.caps++;
      this.ytdlSelectedCounts.hits+=srMatch.matches.length;
      let combDur:number=0;for(let di=0;di<srMatch.matches.length;di++){combDur+=srMatch.matches[di].transTime.dur};
      this.ytdlSelectedCounts.dur.no+=combDur;
      if(Math.round(this.ytdlSelectedCounts.dur.no)<60){this.ytdlSelectedCounts.dur.str=String(Math.round(this.ytdlSelectedCounts.dur.no))+'s'}
      else{this.ytdlSelectedCounts.dur.str=this.evServ.secsToMSS(Math.round(this.ytdlSelectedCounts.dur.no))};
    }else{
      this.ytdlData.selectedItems=this.ytdlData.selectedItems.filter((si:WCYTDLSRItem)=>si.vId!==srMatch.vId);
      this.ytdlSelectedCounts.caps--;
      this.ytdlSelectedCounts.hits-=srMatch.matches.length;
      let combDur:number=0;for(let di=0;di<srMatch.matches.length;di++){combDur+=srMatch.matches[di].transTime.dur};
      this.ytdlSelectedCounts.dur.no-=combDur;
      if(Math.round(this.ytdlSelectedCounts.dur.no)<60){this.ytdlSelectedCounts.dur.str=String(Math.round(this.ytdlSelectedCounts.dur.no))+'s'}
      else{this.ytdlSelectedCounts.dur.str=this.evServ.secsToMSS(Math.round(this.ytdlSelectedCounts.dur.no))};
    };
    this.doSaveData();
    this.pDOM();
  }
//------------------------------------------------
  ytdlSendBatchToDL(){
    this.cCons('ytdlSendBatch2DL','()...');
    if(this.ytdlData.selectedItems.length>0){
      const sTerm:string=(this.ytdlData.selectedItems[0].matches[0].transText.arr[this.ytdlData.selectedItems[0].matches[0].transText.b]).trim().toLowerCase();
      this.ytdlData.dlBatches.push({term:sTerm,items:this.ytdlData.selectedItems});
      this.ytdlData.selectedItems=[];
      this.pDOM();
      this.doSaveData();
    }
  }
//------------------------------------------------
  async ytdlSearchInputFn(action:string,event:any,value:string){
    const inputNE:HTMLInputElement=this.ytdlSearchInput.nativeElement as HTMLInputElement;
    const isOK=()=>{if(inputNE.value.trim().length>0){this.ytdlSTOK=true}else{this.ytdlSTOK=false};this.pDOM()};
    switch(action){
      case 'kd':
        const eKey:any=event.key;
        if(eKey==='Enter'||eKey==='Escape'){
          event.preventDefault();
          if(event.defaultPrevented){
            if(eKey==='Escape'){if(inputNE.focus){if(inputNE.value.length>0){inputNE.value=''}else{inputNE.blur()}}}
            else if(eKey==='Enter'){
              isOK();
              let cmdStr:string=value.trim();
              if(inputNE.focus&&cmdStr.length>0){this.ytdlSearchInputFn('go',event,cmdStr)};
            };
          };
        };
        break;
      case 'click':if(inputNE.value.trim().length>0){inputNE.focus();inputNE.select()};isOK();break;
      case 'ku':isOK();break;
      case 'f':isOK();break;
      case 'cls':
        this.ytdlSearchStage='idle';
        this.ytdlMDBMonMatches=[];
        this.ytdlData.searchItems=[];
        this.ytdlMDBTopBarTime='';
        this.ytdlSRCounts={hits:0,caps:0,time:{db:0,post:0,ttl:{no:0,str:''}}};
        inputNE.value='';isOK();
        break;
      case 'go':
        let dbST:Date|null=new Date(),dbTT:number=0,postST:Date|null=null,postTT:number=0;
        this.evServ.subscribe('srDBProg',()=>{postST=new Date();dbTT=this.evServ.ttlDurS(dbST);this.sSIP=2;this.evServ.destroy('srDBProg')});
        this.ytdlData.searchItems=[];
        this.ytdlSRCounts={hits:0,caps:0,time:{db:0,post:0,ttl:{no:0,str:''}}};
        this.sSIP=1;
        this.ytdlSearchStage='inprog';
        this.pDOM();
        // mdbFullTextSearch //
        let mdbQST:number=this.evServ.gUT(new Date()),mdbQINT:any=null;
        this.ytdlMDBCMDMon.showing=true;this.pDOM();
        this.ytdlMDBTopBarTime='';
        if(mdbQINT!==null){clearInterval(mdbQINT);mdbQINT=null};
        mdbQINT=setInterval(()=>{
          const nowUTS:number=this.evServ.gUT(new Date());
          const secDiff:number=nowUTS-mdbQST;
          if(secDiff>0){this.ytdlMDBTopBarTime=(this.s2T(secDiff));this.pDOM()};
        },1000);
        const mmUniq=async(nm:WCYTDLMDBMonMatch):Promise<boolean>=>{const existI:number=this.ytdlMDBMonMatches.findIndex((mm:WCYTDLMDBMonMatch)=>mm.db_id===nm.db_id);if(existI===-1){return Promise.resolve(true)}else{return Promise.resolve(false)}};
        let matchDocsListener:Electron.IpcRenderer=ipcRenderer.on('ftsExactResultData',async(e:any,args:any[])=>{if((await mmUniq(args[0]))){this.ytdlMDBMonMatches.push(args[0]);this.pDOM()}});
        const ftsExactRes:{r:boolean,d:any}=await ipcRenderer.invoke('doMDBQuery',['ftsExact',(value.trim())]);
        matchDocsListener.removeAllListeners('ftsExactResultData');
        if(ftsExactRes.r&&ftsExactRes.d.length>0){
          for(let mmi=0;mmi<ftsExactRes.d.length;mmi++){if((await mmUniq(ftsExactRes.d[mmi]))){this.ytdlMDBMonMatches.push(ftsExactRes.d[mmi])}};
          let nMMArr:WCYTDLMDBMonMatch[]=this.ytdlMDBMonMatches;
          this.ytdlMDBMonMatches=[];
          nMMArr=_.orderBy(nMMArr,'db_id','desc');
          nMMArr=_.uniqBy(nMMArr,((mmO:WCYTDLMDBMonMatch)=>mmO.vid_id));
          this.ytdlMDBMonMatches=nMMArr;
          this.pDOM();
        };
        //this.ytdlSearchStage='finished';
        // msqlGetMatchItem //
       /*
        const findRes:WCYTDLSRItem[]|false=await this.ytdlServ.findCapStr(value.trim());
        if(findRes===false){this.ytdlSearchStage='error'}
        else{
          let srCounts:WCYTDLSRCounts={hits:0,caps:0,time:{db:dbTT,post:postTT,ttl:{no:Math.round(dbTT+postTT),str:(Math.round(dbTT+postTT)<60?String(Math.round(dbTT+postTT))+'s':(this.evServ.secsToMSS((Math.round(dbTT+postTT)))))}}};
          if(findRes.length>0){srCounts.caps=findRes.length;for(let hi=0;hi<findRes.length;hi++){srCounts.hits+=findRes[hi].matches.length}};
          this.ytdlZeroHits=findRes.filter((ri:WCYTDLSRItem)=>ri.matches.length===0).length;
          this.ytdlData.searchItems=findRes;
          this.ytdlSRCounts=srCounts;
          this.ytdlSearchStage='finished';
          this.pDOM();
        };
        await this.doW(0.25);
        postTT=this.evServ.ttlDurS(postST); */
        break;
    };
  }
//------------------------------------------------
  async ytdlScrapeStep(){
    this.cCons('ytdlStep','()...');
    // Terms -------------
    await this.ifPausedFn(null);
    if(this.ytdlIsScrape){
      const gTerms:string=await this.ytdlGetTerms();
      if(gTerms==='ok'){this.doSBar('show',{type:'ok',msg:'Added '+String(this.ytdlTermsInfo.counts.actual.ttl)+' Terms'});await this.doW(1)}
      else if(gTerms==='stopped'){this.ytdlTermsInfo.state='stopped';return}
      else if(gTerms==='error'){this.ytdlTermsInfo.state='error';await this.ytdlScrapeStop('error')};
    };
    // Vids -------------
    await this.ifPausedFn(null);
    if(this.ytdlIsScrape){
      const gVids:string=await this.ytdlGetVids();
      if(gVids==='ok'){
        if(!this.ytdlItemSkip){this.doSBar('show',{type:'ok',msg:'Added '+String(this.ytdlVidsInfo.counts.actual)+' Vids'});await this.doW(1)}
        else{this.doSBar('show',{type:'error',msg:'NIL Results - Skipping Item'})}}
      else if(gVids==='stopped'){this.ytdlVidsInfo.state='stopped';return}
      else if(gVids==='error'){this.ytdlVidsInfo.state='error';await this.ytdlScrapeStop('error')};
    };
    // Caps -------------
    await this.ifPausedFn(null);
    if(this.ytdlIsScrape&&!this.ytdlItemSkip){
      const gCaps:string=await this.ytdlGetCaps();
      if(gCaps==='ok'){this.doSBar('show',{type:'ok',msg:'Added '+String(this.ytdlCapsInfo.counts.actual)+' Caps'});await this.doW(1)}
      else if(gCaps==='stopped'){this.ytdlCapsInfo.state='stopped';return}
      else if(gCaps==='error'){this.ytdlCapsInfo.state='error';await this.ytdlScrapeStop('error')};
    };
    // DB ---------------
    await this.ifPausedFn(null);
    if(this.ytdlIsScrape&&!this.ytdlItemSkip){
      const updDB:string=await this.ytdlUpdateDB();
      if(updDB==='ok'){this.doSBar('show',{type:'ok',msg:'Added '+String(this.ytdlCapsInfo.counts.actual)+' DB Items'});await this.doW(1)}
      else if(updDB==='stopped'){this.ytdlDBInfo.state='stopped';return}
      else if(updDB==='error'){this.ytdlDBInfo.state='error';await this.ytdlScrapeStop('error')};
    };
    // UPDATE PER MIN ---
    await this.ifPausedFn(null);
    if(!this.ytdlItemSkip){
      if(this.ytdlStagesTTime>0&&this.ytdlData.scrapeItems[0].d.length>0){
        this.ytdlPerMins.push({time:this.ytdlStagesTTime,caps:this.ytdlData.scrapeItems[0].d.length});
        const avgCPM:number=((_.sumBy(this.ytdlPerMins,'caps'))/((_.sumBy(this.ytdlPerMins,'time'))/60));
        this.ytdlDBStats.capsPerMin=avgCPM;
        this.pDOM();
      }
      if(this.ytdlMSQLRunning){
      const getDBICRes:number|false=await this.ytdlServ.getTTLDBCapsCount();if(getDBICRes!==false){this.ytdlDBItemCount=getDBICRes;this.ytdlDBStats.ttlCaps=getDBICRes};
      const getDBDSRes:{mb:number,str:string}|false=await this.ytdlServ.getTTLDBByteSize();if(getDBDSRes!==false){this.ytdlDBStats.diskSize=getDBDSRes};
      const getDBPRes:{ms:number,str:string}|false=await this.ytdlServ.getDBPing();if(getDBPRes!==false){this.ytdlDBStats.ping=getDBPRes};
      this.pDOM();
      };
      this.ytdlStatsChange=true;this.pDOM();
      setTimeout(()=>{this.ytdlStatsChange=false;this.pDOM()},2500);
    };
    this.ytdlStagesTTime=0;
    // REM Item[0] Files/Objs/Save
    if((await this.exists(this.wcYTDLInfoDir))){
      const infDirList:string[]=await readdir(this.wcYTDLInfoDir,{encoding:'utf-8'});
      if(infDirList.length>0){for(let idi=0;idi<infDirList.length;idi++){await unlink((path.join(this.wcYTDLInfoDir,infDirList[idi])))}};
    };
    if((await this.exists(this.wcYTDLCapsDir))){
      const capsDirList:string[]=await readdir(this.wcYTDLCapsDir,{encoding:'utf-8'});
      if(capsDirList.length>0){for(let cdi=0;cdi<capsDirList.length;cdi++){await unlink(path.join(this.wcYTDLCapsDir,capsDirList[cdi]))}};
    };
    this.ytdlData.scrapeItems=this.ytdlData.scrapeItems.slice(1,this.ytdlData.scrapeItems.length);this.pDOM();
    this.ytdlVidsInfo.counts={actual:0,target:0};this.ytdlVidsInfo.term='';
    this.ytdlVidSteps={search:false,info:false};
    this.ytdlCapsInfo.counts={actual:0,target:0,words:0};this.ytdlCapsInfo.term='';
    this.ytdlCapSteps={ctrack:false,caption:false,words:0};
    this.ytdlDBInfo.counts={actual:0,target:0};this.ytdlDBInfo.term='';
    this.ytdlDBSteps={convert:false,add:false};
    this.pDOM();
    await this.doSaveData();
    await this.doW(1);
    // REPEAT
    await this.ifPausedFn(null);
    if(this.ytdlIsScrape){
      if(this.ytdlItemSkip){this.ytdlItemSkip=false};
      this.ytdlScrapeStep();
    }
  }
//------------------------------------------------
  async ytdlScrapeStart(source:string){
    this.cCons('ytdlStart','('+source+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.play.state=true;
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.stop.state=false;
    this.ytdlIsScrape=true;
    this.ytdlTermsInfo.state='idle';this.ytdlVidsInfo.state='idle';this.ytdlCapsInfo.state='idle';this.ytdlDBInfo.state='idle';
    this.sHeader={status:'ok',text:'running'};
    this.sBar={type:'ok',msg:'Scrape Cycle STARTED (by '+this.capd(source)+')'};
    this.pDOM();
    this.ytdlScrapeStep();
  }
//------------------------------------------------
  async ytdlScrapePause(source?:string){
    this.cCons('ytdlScrapePause','()...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state=true;this.pDOM();asI
    this.ytdlTermsInfo.state='paused';this.ytdlVidsInfo.state='paused';this.ytdlCapsInfo.state='paused';this.ytdlDBInfo.state='paused';
    this.sHeader={status:'warn',text:'paused'};
    this.doSBar('show',{type:'info',msg:'Scrape Cycle PAUSED (by Ctrl)'});
  }
//------------------------------------------------
  async ifPausedFn(stage:string|null):Promise<boolean>{
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    return new Promise((resolve)=>{
      if(!this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state){resolve(true)}
      else{
        setInterval(()=>{
          if(!this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state){
            const iSArr:string[]=['terms','vids','caps','db'];for(let isi=0;isi<iSArr.length;isi++){this['ytdl'+this.capd(iSArr[isi])+'Info'].state='idle'};
            if(stage){this['ytdl'+this.capd(stage)+'Info'].state='inprog'};
            this.pDOM();
            resolve(true);
          }else{this.pDOM()}
        },1000)};
    });
  }
//------------------------------------------------
  async ytdlScrapeStop(source:string){
    this.cCons('ytdlStop','('+source+')...');
    const asI:number=this.sHeadScreenBtns[this.mTitle].findIndex((b:WCSHeadScreenBtn)=>b.state);
    this.ytdlIsScrape=false;
    this.sHeadScreenBtns.ytdl[asI].ctrlFns.play.state=false;
    if(this.sHeadScreenBtns.ytdl[asI].ctrlFns.pause.state){this.sHeadScreenBtns.ytdl[0].ctrlFns.pause.state=false};
    const infArr:string[]=['Terms','Vids','Caps','DB'];
    let eSrc:string='';
    if(source==='error'){
      for(let ei=0;ei<infArr.length;ei++){
        if(this['ytdl'+infArr[ei]+'Info'].state==='error'){eSrc=infArr[ei].toLowerCase()}
        else{this['ytdl'+infArr[ei]+'Info'].state='stopped'};
      };
    };
    this.ytdlTermsInfo.state='stopped';this.ytdlVidsInfo.state='stopped';this.ytdlCapsInfo.state='stopped';this.ytdlDBInfo.state='stopped';
    this.sHeader={status:'err',text:(source!=='error'?'stopped':'error - '+eSrc)};
    this.doSBar('show',{type:'error',msg:'Scrape Cycle STOPPED (by '+this.capd(source)+')'});
    this.pDOM();
  }
//------------------------------------------------
  async ytdlGetTerms():Promise<string>{
    this.cCons('ytdlGetTerms','()...');
    this.ytdlTermsInfo.counts.actual={ytt:0,twt:0,rnd:0,ttl:0};
    this.ytdlTermsInfo.prog=0;
    this.ytdlTermsInfo.state='inprog';
    this.pDOM();
    const sT:Date=new Date();
    // Check Existing Items
    if(this.ytdlData.scrapeItems.length>0){
      this.ytdlTermsInfo.counts.actual.ttl=this.ytdlData.scrapeItems.length;
      for(let yi=0;yi<this.ytdlData.scrapeItems.length;yi++){
        this.ytdlTermsInfo.counts.actual[this.ytdlData.scrapeItems[yi].t.type]++;
        this.ytdlTermsInfo.prog+=((yi+1)/this.ytdlTermsInfo.counts.actual.ttl);
        this.pDOM();
      };
      const ttlS:number=this.evServ.ttlDurS(sT);
      this.ytdlStagesTTime+=ttlS;
      if(ttlS<60){this.ytdlTermsInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlTermsInfo.dur=this.evServ.secsToMSS(ttlS)};
      this.cCons('ytdlGetTerms','TTLDur: '+this.ytdlTermsInfo.dur);
      this.ytdlTermsInfo.state='idle';this.pDOM();
      return Promise.resolve('ok');
    }else{
    // Get New Items
      this.ytdlData.scrapeItems=[];
      const gtRes:WCYTDLGetTermResult[]=await ipcRenderer.invoke('getYTDLTerms');
      if(gtRes&&gtRes.length>0){
        this.ytdlTermsInfo.counts.actual.ttl=gtRes.length;
        for(let ti=0;ti<gtRes.length;ti++){
          if(gtRes[ti].type==='ytt'&&typeof gtRes[ti].item!=='string'){this.ytdlData.scrapeItems.push({t:{type:'ytt',item:'YouTube Trends'},v:gtRes[ti].item,c:[],d:[]})}
          else{this.ytdlData.scrapeItems.push({t:{type:gtRes[ti].type,item:gtRes[ti].item},v:[],c:[],d:[]})};
          this.ytdlTermsInfo.counts.actual[gtRes[ti].type]++;
          this.ytdlTermsInfo.prog+=((ti+1)/this.ytdlTermsInfo.counts.actual.ttl);
          this.pDOM();
        };
        const ttlS:number=this.evServ.ttlDurS(sT);
        this.ytdlStagesTTime+=ttlS;
        if(ttlS<60){this.ytdlTermsInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlTermsInfo.dur=this.evServ.secsToMSS(ttlS)};
        this.cCons('ytdlGetTerms','TTLDur: '+this.ytdlTermsInfo.dur);
        await this.doSaveData();
        this.ytdlTermsInfo.state='idle';this.pDOM();
        return Promise.resolve('ok');
      }else{return Promise.resolve('error')};
    };
  };
//------------------------------------------------
  async ytdlGetVids():Promise<string>{
    this.cCons('ytdlGetVids','()...');
    const doSkip=async():Promise<boolean>=>{this.ytdlVidsInfo.state='error';this.ytdlVidsInfo.prog=1;this.ytdlVidsInfo.term='NO RESULTS';this.pDOM();this.ytdlItemSkip=true;await this.doW(2);this.ytdlVidsInfo.state='idle';this.ytdlVidsInfo.prog=0;this.ytdlVidsInfo.term='';this.pDOM();await this.doW(1);return Promise.resolve(true)};
    const gotInf=async(vId:string):Promise<boolean>=>{const gIR:boolean=await this.ytdlServ.gotInfFile(vId);return Promise.resolve(gIR)};
    const dlInf=async(vId:string):Promise<boolean>=>{const dlIR:boolean=await this.ytdlServ.dlInfo(vId);return Promise.resolve(dlIR)};
    //------------
    this.ytdlVidsInfo.state='inprog';
    this.ytdlVidsInfo.term=this.ytdlData.scrapeItems[0].t.item;
    if(this.ytdlData.scrapeItems[0].t.type==='ytt'){this.ytdlVidsInfo.counts.target=this.ytdlData.scrapeItems[0].v.length}else{this.ytdlVidsInfo.counts.target=200};
    this.ytdlVidsInfo.counts.actual=0;
    this.ytdlVidsInfo.prog=0;
    this.ytdlVidSteps={search:false,info:false};
    this.pDOM();
    const sT:Date=new Date();
    // Check Existing Items
    if(this.ytdlData.scrapeItems[0].v.length>0){
      this.ytdlVidSteps.search=true;this.pDOM();
      this.ytdlVidsInfo.counts.target=this.ytdlData.scrapeItems[0].v.length;
      let failVIds:string[]=[],didRem:boolean=false;
      for(let vi=0;vi<this.ytdlData.scrapeItems[0].v.length;vi++){
        this.ytdlVidSteps.info=false;this.pDOM();
        const tVID:string=this.ytdlData.scrapeItems[0].v[vi].id;
        if(!(await gotInf(tVID))){if(!(await dlInf(tVID))){failVIds.push(tVID);didRem=true}else{this.ytdlVidsInfo.counts.actual++;this.ytdlVidSteps.info=true}}
        else{this.ytdlVidsInfo.counts.actual++;this.ytdlVidSteps.info=true};
        this.ytdlVidsInfo.prog=((vi+1)/this.ytdlData.scrapeItems[0].v.length);
        await this.ifPausedFn('vids');
        if(!this.ytdlIsScrape){return Promise.resolve('stopped')};
        this.pDOM();
      };
      if(didRem){for(let ri=0;ri<failVIds.length;ri++){this.ytdlData.scrapeItems[0].v=this.ytdlData.scrapeItems[0].v.filter(vO=>vO.id!==failVIds[ri])};this.pDOM();await this.doSaveData()};
    // Get New Items
    }else{
      this.ytdlVidsInfo.state='indet';this.pDOM();
      const srRes:WCYTDLGetSrResult|false=await this.ytdlServ.getSR(this.ytdlData.scrapeItems[0].t.item);
      if(srRes!==false){
        this.ytdlVidSteps.search=true;
        this.ytdlVidsInfo.state='inprog';
        this.ytdlVidsInfo.counts.target=srRes.items.length;
        this.pDOM();
        const srVItems:ytsr.Video[]=srRes.items;
        for(let sri=0;sri<srVItems.length;sri++){
          this.ytdlVidSteps.info=false;this.pDOM();
          const srV:ytsr.Video=srVItems[sri];
          const hasA:boolean=(srV.hasOwnProperty('author'));
          const vidResObj:WCYTDLGetVidResult={id:srV.id,title:srV.title,url:srV.url,channel:{id:(hasA?srV.author.channelID:'-'),name:(hasA?srV.author.name:'-'),url:(hasA?srV.author.url:'-')}};
          const dlInfoRes:boolean=await dlInf(srV.id);
          if(dlInfoRes){
            this.ytdlData.scrapeItems[0].v.push(vidResObj);
            this.ytdlVidSteps.info=true;
            this.ytdlVidsInfo.counts.actual++;
            this.ytdlVidsInfo.prog=((sri+1)/srVItems.length);
            await this.ifPausedFn('vids');
            if(!this.ytdlIsScrape){return Promise.resolve('stopped')};
            this.pDOM();
          };
        };
      }else{await doSkip();return Promise.resolve('ok')};
    };
    const ttlS:number=this.evServ.ttlDurS(sT);
    this.ytdlStagesTTime+=ttlS;
    if(ttlS<60){this.ytdlVidsInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlVidsInfo.dur=this.evServ.secsToMSS(ttlS)};
    this.cCons('ytdlGetVids','TTLDur: '+this.ytdlVidsInfo.dur);
    await this.doSaveData();
    this.ytdlVidsInfo.state='idle';
    this.pDOM();
    if(this.ytdlData.scrapeItems[0].v.length>0){return Promise.resolve('ok')}
    else{await doSkip();return Promise.resolve('ok')};
  };
//------------------------------------------------
  async ytdlGetCaps():Promise<string>{
    this.cCons('ytdlGetCaps','()...');
    const gotInf=async(vId:string):Promise<boolean>=>{const gIR:boolean=await this.ytdlServ.gotInfFile(vId);return Promise.resolve(gIR)};
    const dlInf=async(vId:string):Promise<boolean>=>{const dlIR:boolean=await this.ytdlServ.dlInfo(vId);return Promise.resolve(dlIR)};
    const gotCap=async(vId:string):Promise<number|false>=>{const p:string=path.join(this.wcYTDLCapsDir,vId+'.xml');if(!(await this.exists(p))){return Promise.resolve(false)};const s:any=await this.statSize(p);if(!s.r||s.d<1){return Promise.resolve(false)};try{const r:any=await readFile(p,{encoding:'utf-8'}),wArr:string[]=r.trim().split(/\s+/);if(wArr[0]!=='<?xml'||wArr.length<1){return Promise.resolve(false)}else{return Promise.resolve(wArr.length)}}catch(e){return Promise.resolve(false)}};
    const dlCap=async(vId:string,ctUrl:string):Promise<number|false>=>{return Promise.resolve((await this.ytdlServ.dlCaps(vId,ctUrl)))};
    const getCTUrl=async(vId:string):Promise<string|false>=>{const ctR:string|false=await this.ytdlServ.getCapTrack(vId);return Promise.resolve(ctR)};
    const delAll=async(id:string):Promise<boolean>=>{this.ytdlData.scrapeItems[0].v=this.ytdlData.scrapeItems[0].v.filter(vO=>vO.id!==id);this.ytdlData.scrapeItems[0].c=this.ytdlData.scrapeItems[0].c.filter(cO=>cO.vId!==id);const ip:string=path.join(this.wcYTDLInfoDir,id+'.json');if((await this.exists(ip))){await unlink(ip)};const cp:string=path.join(this.wcYTDLCapsDir,id+'.xml');if((await this.exists(cp))){await unlink(cp)};return Promise.resolve(true)};
    //----------
    this.ytdlCapSteps={ctrack:false,caption:false,words:0};
    this.ytdlCapsInfo.counts.target=this.ytdlData.scrapeItems[0].v.length;
    this.ytdlCapsInfo.counts.actual=0;
    this.ytdlCapsInfo.prog=0;
    this.ytdlCapsInfo.state='inprog';
    this.pDOM();
    const sT:Date=new Date();
    let remIds:string[]=[];
    //----------
    if(this.ytdlData.scrapeItems[0].v.length>0){
      for(let ci=0;ci<this.ytdlData.scrapeItems[0].v.length;ci++){
        this.ytdlCapsInfo.term=this.ytdlData.scrapeItems[0].v[ci].id;
        this.ytdlCapSteps.ctrack=false;
        this.ytdlCapSteps.caption=false;
        this.pDOM();
        const vcId:string=this.ytdlData.scrapeItems[0].v[ci].id;
        const existCI:number=this.ytdlData.scrapeItems[0].c.findIndex(cO=>cO.vId===this.ytdlData.scrapeItems[0].v[ci].id);
        let cGotI:boolean=await gotInf(vcId),cGotC:number|false=await gotCap(vcId);
        if(cGotI!==false&&cGotC!==false&&existCI!==-1){this.ytdlCapSteps.ctrack=true;this.ytdlCapSteps.caption=true;this.ytdlCapSteps.words+=cGotC;this.ytdlCapsInfo.counts.actual++;this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);this.pDOM()}
        else{
          let gI:boolean=await gotInf(vcId);
          if(!gI){gI=await dlInf(vcId)}
          if(!gI){this.ytdlCapSteps.ctrack=false;this.ytdlCapSteps.caption=false;this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);this.pDOM();remIds.push(vcId)}
          else{
            const gU:string|false=await getCTUrl(vcId);
            if(gU===false){this.ytdlCapSteps.ctrack=false;this.ytdlCapSteps.caption=false;this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);this.pDOM();remIds.push(vcId)}
            else{
              this.ytdlCapSteps.ctrack=true;this.pDOM();
              const dC:number|false=await dlCap(vcId,gU);
              if(dC===false){this.ytdlCapSteps.caption=false;this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);this.pDOM();remIds.push(vcId)}
              else{
                const gC:number|false=await gotCap(vcId);
                if(gC===false){this.ytdlCapSteps.caption=false;this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);this.pDOM();remIds.push(vcId)}
                else{
                  this.ytdlCapSteps.caption=true;this.pDOM();
                  const nCapObj:WCYTDLGetCapResult={vId:vcId,words:gC}
                  if(existCI!==-1){this.ytdlData.scrapeItems[0].c[existCI]=nCapObj}else{this.ytdlData.scrapeItems[0].c.push(nCapObj)};
                  this.ytdlCapSteps.words+=gC;
                  this.ytdlCapsInfo.counts.actual++;
                  this.ytdlCapsInfo.prog=((ci+1)/this.ytdlData.scrapeItems[0].v.length);
                  this.pDOM();
                };
              };
            };
          };
        };
        await this.ifPausedFn('caps');
        if(!this.ytdlIsScrape){return Promise.resolve('stopped')};
      };
      if(remIds.length>0){for(let ri=0;ri<remIds.length;ri++){await delAll(remIds[ri])};this.ytdlCapsInfo.counts.target=this.ytdlData.scrapeItems[0].v.length;this.pDOM();await this.doSaveData()};
      const ttlS:number=this.evServ.ttlDurS(sT);
      this.ytdlStagesTTime+=ttlS;
      if(ttlS<60){this.ytdlCapsInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlCapsInfo.dur=this.evServ.secsToMSS(ttlS)};
      this.cCons('ytdlGetCaps','TTLDur: '+this.ytdlCapsInfo.dur);
      await this.doSaveData();
      this.ytdlCapsInfo.term='FINISHED';
      this.ytdlCapsInfo.state='idle';
      this.pDOM();
      if(this.ytdlData.scrapeItems[0].c.length>0){return Promise.resolve('ok')}
      else{return Promise.resolve('error')};
    }else{
      const ttlS:number=this.evServ.ttlDurS(sT);
      if(ttlS<60){this.ytdlCapsInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlCapsInfo.dur=this.evServ.secsToMSS(ttlS)};
      this.cCons('ytdlGetCaps','TTLDur: '+this.ytdlCapsInfo.dur);
      return Promise.resolve('error')
    }
  }
//------------------------------------------------
  async ytdlUpdateDB():Promise<string>{
    this.cCons('ytdlUpdateDB','()...');
    const delAll=async(id:string):Promise<boolean>=>{this.ytdlData.scrapeItems[0].v=this.ytdlData.scrapeItems[0].v.filter(vO=>vO.id!==id);this.ytdlData.scrapeItems[0].c=this.ytdlData.scrapeItems[0].c.filter(cO=>cO.vId!==id);const ip:string=path.join(this.wcYTDLInfoDir,id+'.json');if((await this.exists(ip))){await unlink(ip)};const cp:string=path.join(this.wcYTDLCapsDir,id+'.xml');if((await this.exists(cp))){await unlink(cp)};return Promise.resolve(true)};
    const readXML=async(xmlPath:string):Promise<string|false>=>{
      if(!(await this.exists(xmlPath))){return Promise.resolve(false)};
      const s:any=await this.statSize(xmlPath);
      if(!s.r||s.d<1){return Promise.resolve(false)};
      try{const xmlData:string=await readFile(xmlPath,{encoding:'utf-8'});return Promise.resolve(xmlData)}
      catch(e){return Promise.resolve(false)}
    };
    const parseXML=async(xml:string):Promise<{obj:any,str:string}|false>=>{
      try{
        const tagNamePS=():string=>{return 'transcript'},attrValuePS=(aValue:string):number=>{return parseFloat(aValue)},fixGrammar=(value:string):string=>{return value.replace(/&#39;/gi,'\'')};
        const jsonParseOpts:xml2js.ParserOptions={attrkey:'time',charkey:'text',explicitRoot:false,tagNameProcessors:[tagNamePS],attrValueProcessors:[attrValuePS],valueProcessors:[fixGrammar]};
        const xml2JSONParser:xml2js.Parser=new xml2js.Parser(jsonParseOpts);
        const jsonObj:any=await xml2JSONParser.parseStringPromise(xml);
        const jsonStr:any=JSON.stringify(jsonObj);
        if((await this.isJSON(jsonStr))){return Promise.resolve({obj:jsonObj,str:jsonStr})}
        else{return Promise.resolve(false)};
      }catch(e){return Promise.resolve(false)};
    };
    const addItem2DB=async(item:WCYTDLCapRowObj):Promise<number|false>=>{
      const hasDBC:number|false=await this.ytdlServ.hasCapInDB(item.video_id);
      if(hasDBC!==false){return Promise.resolve(hasDBC)}
      else{const insDBRes:number|false=await this.ytdlServ.addCap2DB(item);return Promise.resolve(insDBRes)};
    }
    //---------
    const getDBICRes:number|false=await this.ytdlServ.getTTLDBCapsCount();
    if(getDBICRes!==false){this.ytdlDBItemCount=getDBICRes};
    this.ytdlDBSteps={convert:false,add:false};
    this.ytdlDBInfo.counts.target=this.ytdlData.scrapeItems[0].c.length;
    this.ytdlDBInfo.counts.actual=0;
    this.ytdlDBInfo.prog=0;
    this.ytdlDBInfo.state='inprog';
    this.pDOM();
    //----------
    if(this.ytdlData.scrapeItems[0].c.length>0){
      const sT:Date=new Date();let remIds:string[]=[];
      for(let dbi=0;dbi<this.ytdlData.scrapeItems[0].c.length;dbi++){
        this.ytdlDBSteps={convert:false,add:false};
        this.ytdlDBInfo.term=this.ytdlData.scrapeItems[0].c[dbi].vId;
        this.pDOM();
        const dvId:string=this.ytdlData.scrapeItems[0].c[dbi].vId;
        const existDBI:number=this.ytdlData.scrapeItems[0].d.findIndex(dO=>dO.vId===dvId);
        if(existDBI!==-1&&this.ytdlData.scrapeItems[0].d[existDBI].dbId>0){this.ytdlDBSteps.convert=true;this.ytdlDBSteps.add=true;this.ytdlDBItemCount++;this.ytdlDBInfo.counts.actual++;this.ytdlDBInfo.prog=((dbi+1)/this.ytdlData.scrapeItems[0].c.length);this.pDOM()}
        else{
          const dbCPath:string=path.join(this.wcYTDLCapsDir,dvId+'.xml');
          const xmlDataRes:string|false=await readXML(dbCPath);
          if(xmlDataRes===false){this.ytdlDBSteps.convert=false;this.ytdlDBSteps.add=false;this.ytdlDBInfo.prog=((dbi+1)/this.ytdlData.scrapeItems[0].c.length);remIds.push(dvId);this.pDOM()}
          else{
            const cvtRes:{obj:any,str:string}|false=await parseXML(xmlDataRes);
            if(cvtRes===false){this.ytdlDBSteps.convert=false;this.ytdlDBSteps.add=false;this.ytdlDBInfo.prog=((dbi+1)/this.ytdlData.scrapeItems[0].c.length);remIds.push(dvId);this.pDOM()}
            else{
              this.ytdlDBSteps.convert=true;this.pDOM();
              const add2DBRes:number|false=await addItem2DB({video_id:dvId,caps_data:cvtRes.str});
              if(add2DBRes===false){this.ytdlDBSteps.add=false;this.ytdlDBInfo.prog=((dbi+1)/this.ytdlData.scrapeItems[0].c.length);remIds.push(dvId);this.pDOM()}
              else{
                this.ytdlDBItemCount++;
                this.ytdlDBSteps.add=true;this.pDOM();
                this.ytdlData.scrapeItems[0].d.push({vId:dvId,dbId:add2DBRes});
                this.ytdlDBInfo.counts.actual++;
                this.ytdlDBInfo.prog=((dbi+1)/this.ytdlData.scrapeItems[0].c.length);
                this.pDOM();
              };
            };
          };
        };
        await this.ifPausedFn('db');
        if(!this.ytdlIsScrape){return Promise.resolve('stopped')};
      };
      if(remIds.length>0){for(let ri=0;ri<remIds.length;ri++){await delAll(remIds[ri])};this.ytdlCapsInfo.counts.target=this.ytdlData.scrapeItems[0].v.length;this.pDOM();await this.doSaveData()};
      const ttlS:number=this.evServ.ttlDurS(sT);
      this.ytdlStagesTTime+=ttlS;
      if(ttlS<60){this.ytdlDBInfo.dur=ttlS.toFixed(2)+'s'}else{this.ytdlDBInfo.dur=this.evServ.secsToMSS(ttlS)};
      this.cCons('ytdlUpdDB','TTLDur: '+this.ytdlDBInfo.dur);
      await this.doSaveData();
      this.ytdlDBInfo.term='FINISHED';
      this.ytdlDBInfo.state='idle';
      this.pDOM();
      if(this.ytdlData.scrapeItems[0].d.length>0){return Promise.resolve('ok')}
      else{return Promise.resolve('error')};
    }else{return Promise.resolve('error')};
  }
//------------------------------------------------
  ytdlUpdatePCSubCounts(){
    if(this.ytdlData.myDaily.mySubs.length>0){
      this.ytdlMDCounts.subs.t=this.ytdlData.myDaily.mySubs.length}
    else{const bSubsArr:WCYTDLMDBaseSub[]=baseMDSubsList;this.ytdlMDCounts.subs.t=bSubsArr.length};
    this.ytdlMDCounts.subs.updated.str='-';
  }
//------------------------------------------------
  ytdlReorderSubs(event:CustomEvent<ItemReorderEventDetail>){
    if(this.ytdlSubsReorderActive){
      let dragdSub=this.ytdlData.myDaily.mySubs.splice(event.detail.from,1)[0];
      this.ytdlData.myDaily.mySubs.splice(event.detail.to,0,dragdSub);
      event.detail.complete();
      this.doSaveData();
    }
  }
//------------------------------------------------
  ytdlToggleReorder(){this.ytdlSubsReorderActive?this.ytdlSubsReorderActive=false:this.ytdlSubsReorderActive=true;this.pDOM()}
//------------------------------------------------
  ytdlGetSubThumb(subObj:WCYTDLMDSub):SafeResourceUrl{
    const rawThumb:string=subObj.sub.snippet.thumbnails.high.url;
    return (this.sanitizer.bypassSecurityTrustResourceUrl(rawThumb));
  };
//------------------------------------------------
  ytdlToggleSubPty(pty:string,subObj:WCYTDLMDSub,subIndex:number){this.cCons('ytdlToggleSubOpt','('+pty+',subObj,'+String(subIndex)+')...');!subObj.hasOwnProperty(pty)||subObj[pty]===false?this.ytdlData.myDaily.mySubs[subIndex][pty]=true:this.ytdlData.myDaily.mySubs[subIndex][pty]=false;this.pDOM();this.doSaveData()};
//------------------------------------------------
  ytdlTogglePLPty(pty:string,plObj:WCYTDLMDKodiPLDay,plIndex:number){this.cCons('ytdlTogglePLOpt','('+pty+',plObj,'+String(plIndex)+')...');!plObj.hasOwnProperty(pty)||plObj[pty]===false?this.ytdlData.myDaily.myKodi.playlists[plIndex][pty]=true:this.ytdlData.myDaily.myKodi.playlists[plIndex][pty]=false;this.pDOM();this.doSaveData()};
//------------------------------------------------
  ytdlGetPLDurStr(plArr:WCYTDLMDPLItem[]):string{
    let plTTLS:number=0;
    for(let pli=0;pli<plArr.length;pli++){plTTLS+=plArr[pli].dur};
    if(plTTLS>0){return this.s2T(plTTLS)}else{'0'};
  }
//------------------------------------------------
  async ytdlYTAPIInputPop(ev:any,action:string,data?:any){
    const wUR=()=>{return new Promise(async(resolve)=>{const wLoop=setInterval(()=>{if(this.ytapiOKBtn&&this.ytapiOKBtn.nativeElement&&this.ytapiInput&&this.ytapiInput.nativeElement){clearInterval(wLoop);resolve(true)}},100)})};
    if(action==='show'){if(!this.ytdlYTAPIInputShowing){await wUR();this.ytdlYTAPIInputShowing=true;this.pDOM();await this.doW(0.25);this.ytapiInput.nativeElement.value=''}}
    else if(action==='cancel'){if(this.ytdlYTAPIInputShowing){await wUR();this.ytapiInput.nativeElement.value='';this.ytdlYTAPIInputShowing=false;this.pDOM()}}
    else if(action==='ok'){if(this.ytdlYTAPIInputShowing){if(data&&typeof data==='string'&&data.trim().length>0){const c:string=data.trim();this.evServ.publish('ytapiInputCode',c);await wUR();this.ytapiInput.nativeElement.value='';this.ytdlYTAPIInputShowing=false;this.pDOM()}}}
    else if(action==='kd'){if(ev.key==='Enter'||ev.key==='Escape'){ev.preventDefault();if(ev.defaultPrevented){if(ev.key==='Escape'){this.ytdlYTAPIInputPop(null,'cancel',data)}else{this.ytdlYTAPIInputPop(null,'ok',data)}}}}
    else if(action==='poke'){await wUR();this.ytapiOKBtn.nativeElement.disabled=(data.trim().length<1);this.pDOM()};
  }
//------------------------------------------------
  ytdlFN2(){console.log('FN 2')}
  ytdlFN3(){console.log('FN 3')}
  ytdlFN4(){console.log('FN 4')}
//////////////////////////////////////////////////
}
