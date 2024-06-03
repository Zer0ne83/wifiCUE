import { NetworkInfo, NetClients, WCCUESetDeviceLEDSeq, WCCUEDeviceLEDColors, RGBColor, RGBWColor, WCActiveWLEDS,FooterNetStatus, CUEDevicesRaw, CUETreeDevice, defWCData, SDKStatus, WCData, WCCUESetDeviceLED, CUETreeGroup, WCMBox, KVolMute, WCMWOpen, CUEDeviceRaw, WCMDSensor, WLEDAllClientCols, defCamAudio, WCWebcamAudio, RPIInfo, defRPII, HWIInfo, defSIInfo, SIInfo, defDebI, DebInfo, PhoneDSInfo, defPDSI } from './../../appTypes';
import {Component,OnInit,AfterViewInit,ChangeDetectorRef,ViewChild,ElementRef} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {InputPopoverComponent} from '../input/input.component';
import {EventsService} from '../events.service';
import {ipcRenderer} from 'electron';
import {WLEDClientConfig, WLEDClientContext, WLEDClientEffects, WLEDClientInfo, WLEDClientPalettes, WLEDClientPresets, WLEDClientState } from 'wled-client';
import * as _ from 'lodash';
import { RGBA } from 'ngx-color';
import { WCPirAudio } from '../../../app/appTypes';
const FastAverageColor = require('fast-average-color').FastAverageColor;
//////////////////////////////////////////////////
@Component({selector:'app-home',templateUrl:'./home.component.html',styleUrls:['./home.component.scss']})
//////////////////////////////////////////////////
export class HomeComponent implements OnInit,AfterViewInit{
//////////////////////////////////////////////////
  @ViewChild('homeWrap') homeWrap:ElementRef<HTMLDivElement>;
  @ViewChild('timedFnsRecurringChimeInterval') timedFnsRecurringChimeInterval:ElementRef<HTMLInputElement>;
  @ViewChild('aSleepWakeSleepInput') aSleepWakeSleepInput:ElementRef<HTMLInputElement>;
  @ViewChild('aSleepWakeWakeInput') aSleepWakeWakeInput:ElementRef<HTMLInputElement>;
  @ViewChild('sshotImage') sshotImage:ElementRef<HTMLImageElement>;
  @ViewChild('wcMainLogo') wcMainLogo:ElementRef<HTMLImageElement>;
  @ViewChild('wcMainLogoWrap') wcMainLogoWrap:ElementRef<HTMLImageElement>;
  @ViewChild('diffyVidWrap') diffyVidWrap:ElementRef<HTMLDivElement>;
  @ViewChild('capCanvas') capCanvas:ElementRef<HTMLCanvasElement>;
  @ViewChild('gridCanvas') gridCanvas:ElementRef<HTMLCanvasElement>;
  @ViewChild('diffCanvas') diffCanvas:ElementRef<HTMLCanvasElement>;
  @ViewChild('motCanvas') motCanvas:ElementRef<HTMLCanvasElement>;
  @ViewChild('diffyVideo') diffyVideo:ElementRef<HTMLVideoElement>;
  @ViewChild('diffyImg') diffyImg:ElementRef<HTMLImageElement>;
  @ViewChild('kodiUserInput') kodiUserInput:ElementRef<HTMLInputElement>;
  @ViewChild('kodiPassInput') kodiPassInput:ElementRef<HTMLInputElement>;
  @ViewChild('kodiOKBtn') kodiOKBtn:ElementRef<HTMLButtonElement>;
  @ViewChild('kodiClBtn') kodiClBtn:ElementRef<HTMLButtonElement>;
  @ViewChild('wcKnobDiv') wcKnobDiv:ElementRef<HTMLDivElement>;
//////////////////////////////////////////////////
  winSet:any={trans:false};
//------------------
  wcIPCListenersDone:boolean=false;
  wcData:WCData|null=defWCData;
  doSaveInProg:boolean=false;
//------------------
  wledTreeReady:boolean=false;
  wledDTLFXOverride:boolean=false;
  wledTree:any[]=[];
  wledSyncGroupsOn:boolean=true;
  wledStates:any={};
  wledRSSIs:any={};
  wledGrpLeaders:string[]=['Zer0WLED1','Zer0WLED4','Zer0WLED6','Zer0WLED10'];
  wledGrpMembers:{[key:string]:string[]}={
  1:['Zer0WLED1','Zer0WLED2','Zer0WLED3'],
  2:['Zer0WLED4','Zer0WLED5'],
  3:['Zer0WLED6','Zer0WLED7','Zer0WLED8','Zer0WLED9'],
  4:['Zer0WLED10','Zer0WLEDMatrix']
};
//------------------
  navOnline:boolean|null=null;
  navOLListen:boolean=false;
  footerNetStatus:FooterNetStatus|null=null;
  netInfo:NetworkInfo|null=null;
  sdkStatus:SDKStatus|null=null;
  sbiMsg:string='';
  sbiShowing:boolean=false;
  sbiTO:any=null;
  sbiMI:boolean=false;
  grantsList:any|null=null;
  banList:string[]=[];
  netClientsTime:string='';
  netClientsRefreshing:boolean=false;
  netClientsNewTime:boolean=false;
//------------------
  cueDevicesRaw:CUEDevicesRaw|null=null;
  cueTreeReady:boolean=false;
  defSetDevList:WCCUESetDeviceLED[]=[];
  isS:boolean=false;
  defColor:RGBA={r:255,g:255,b:0,a:255};
//------------------
  debouncedSaveData=_.debounce(()=>this.bouncedSaveData(),500,{});
  debouncedSliderRestart=_.debounce((o:string,v:number)=>this.bouncedSliderRestart(o,v),500,{});
  throttledDLoop=_.throttle(()=>this.dCamUpdateMain(),1000);
//------------------
  networkMode:boolean=false;
  settingsMode:boolean=false;
  rChimeRunning:boolean=false;
  rChimeInterval:any;
  aSleepWakeRunning:boolean=false;
  aSleepWakeInterval:any;
  aSleepWakeSleepTime:string|null=null;
  aSleepWakeWakeTime:string|null=null;
  aSleepWakeSleepTimeISOStr:any;
  aSleepWakeWakeTimeISOStr:any;
//-----------------
  camPlugged:boolean=false;
  camReady:boolean=false;
  dCamViewShowing:boolean=false;
  dCamOpenWasManual:boolean=false;
  dCamExpandOnMotion:boolean=true;
  dCamLayers:any={video:true,motion:true};
  dCamMotion:any={isMotion:false,x:0,y:0,a:'l'};
  dCamId:string|null=null;
  dStream:MediaStream|null=null;
  dInitDone:boolean=false;
  dLoopOn:boolean=false;
  dCanDiff:boolean=false;
  dVid:HTMLVideoElement|null=null;
  pixDiff:number=32;
	sThresh:number=16;
  diffFrame:any;
  diffFrameId:any;
  moveTO:NodeJS.Timeout|null=null;
  dAvgPos:any={x:0,y:0,t:0};
  dAvgPosHist:any[]=[];
  dCOP:'p'|'c'|'u'|null='u';
  dMotionPathTO:any=null;
  dMotionPathTimes:any={st:null,et:null,tt:null};
  dMotionSCount:number=0;
//----------
  capCanv:HTMLCanvasElement|null=null;
  capCtx:CanvasRenderingContext2D|null=null;
//----------
  diffCanv:HTMLCanvasElement|null=null;
  diffCtx:CanvasRenderingContext2D|null=null;
  //----------
  motCanv:HTMLCanvasElement|null=null;
  motCtx:CanvasRenderingContext2D|null=null;
  //----------
  gridCanv:HTMLCanvasElement|null=null;
  gridCtx:CanvasRenderingContext2D|null=null;
  //----------
  noteOldCol:RGBA;
  noteInProg:boolean=false;
  //----------
  meOnce:boolean=false;
  //----------
  hasKodi:boolean|null=null;
  kodiIsRunning:boolean=false;
  kodiAuthValid:boolean=true;
  kodiUPInputShowing:boolean=false;
  kodiUPInitUP:{u:string,p:string}|null=null;
  kodiHasAuth:boolean=false;
  kodiTestingAuth:boolean=false;
  kodiTestStatus:any={stage:<'inprog'|'result'>'inprog',msg:<string[]>[]};
  kodiCloseInt:any;
  kodiProgOn:boolean=false;
  kodiPlyr:any={item:null,status:'stopped',pos:{total:0,time:0,perc:0}};
  kodiTimeStr:string='00:00:00';
  kodiVolMute:KVolMute={muted:false,volume:50};
  kodiPlayingInfo:any[]=[];
  kodiInfoPos:any={top:0,left:0,x:0,y:0};
  kodiInfoMD:boolean=false;
  kodiInfoDiv:any;
  kodiInfoWrap:any;
  kodiInfoIsScroll:boolean=false;
  kodiInfoScrollIINT:any;
  kodiScrollDir:string='up';
  kFrame:boolean=false;
  kFrameId:any;
  kodiMaxScroll:number=0;
  kodiScrollCount:number=0;
  kodiSeekLine:any={mouseIn:false,left:0,posV:'',outX:0,outW:0};
  kodiPlyrBarType:string='determinate';
  kodiQCIsShowing:boolean=false;
  KQCInAni:boolean=false;
  //-------------------
  twtAuthInProg:boolean|null=null;
  twtChildWShowing:boolean=false;
  //-------------------
  moreWinsOpen:WCMWOpen[]=[];
  fC:number=0;
  //-------------------
  pirCountMaxTimeS:any={1:3,2:6,3:6};
  pirAudio:WCPirAudio={1:{audio:null,playing:false},2:{audio:null,playing:false},3:{audio:null,playing:false}};
  webcamAudio:WCPirAudio={1:{audio:null,playing:false},2:{audio:null,playing:false},3:{audio:null,playing:false}};
  mdSensors:WCMDSensor[]=[
    {pirNo:1,ico:'assets/wc-motion-detect-sensor1-ico.png',online:{state:false,to:null},motion:{state:false,to:null},members:[4,5]},
    {pirNo:2,ico:'assets/wc-motion-detect-sensor2-ico.png',online:{state:false,to:null},motion:{state:false,to:null},members:[1]},
    {pirNo:3,ico:'assets/wc-motion-detect-sensor3-ico.png',online:{state:false,to:null},motion:{state:false,to:null},members:[1,2,3,4,5]}
  ];
  pirWLEDIndexes:any=null;
  pirMotionData:any={
    1:{ctrl:false,ctrlTOS:0,count:0,countTOS:0},
    2:{ctrl:false,ctrlTOS:0,count:0,countTOS:0},
    3:{ctrl:false,ctrlTOS:0,count:0,countTOS:0}
  }
//---------------------
appHasFocus:boolean=true;
kbBri:number=0;
wbcmAudio:WCWebcamAudio=defCamAudio;
knobFnIsOn:boolean=false;
//---------------------
rpiInfo:RPIInfo=defRPII;
debInfo:DebInfo=defDebI;
rpiOnline:boolean=false;
debOnline:boolean=false;
hwInfo:HWIInfo|null=null;
siInfo:SIInfo=defSIInfo;
phDSInfo:PhoneDSInfo=defPDSI;
phRedmiOnline:boolean=false;
//----------------------
customKPListenerOn:boolean=false;
//////////////////////////////////////////////////
  constructor(
    private changeDet:ChangeDetectorRef,
    private modalCtrl:ModalController,
    private evServ:EventsService
  ){}
//////////////////////////////////////////////////
// LIFECYCLE FUNCTIONS
//////////////////////////////////////////////////
  ngOnInit():void{this.initIPCListeners()}
//------------------------------------------------
  ngAfterViewInit():void{this.doInits()};
//------------------------------------------------
  ngOnDestroy():void{this.onOffLineListener('remove')};
//////////////////////////////////////////////////
// IPC LISTENERS
//////////////////////////////////////////////////
  initIPCListeners(){
    // Delayed WLED Init/DTLFX On
    ipcRenderer.on('dtlfxDidStartStop',async(e:any,args:any[])=>{
      if(args[0]==='started'){this.wledDTLFXOverride=true;this.pDOM()}
      else{
        if(args[1]===true){
          if(args[2]==='error'){this.wledDTLFXOverride=true;this.pDOM()}
          else{
            this.wledTree=args[2];
            for(let wi=0;wi<this.wledTree.length;wi++){
              let segCheck:boolean[]=[];
              for(let si=0;si<this.wledTree[wi].state.segments.length;si++){segCheck.push(true)};
              this.wledStates[this.wledTree[wi].info.name]=segCheck;
            };
            await this.doW(0.25);
            this.wledDTLFXOverride=false;
            this.wledTreeReady=true;
            this.pDOM();
          }
        }else{this.wledDTLFXOverride=false;this.pDOM()}
      }
    });
    // PhoneDSInfo
    ipcRenderer.on('phRedmiOnlineData',(e:any,args:any[])=>{if(!_.isEqual(this.phRedmiOnline,args[0])){this.phRedmiOnline=args[0];this.pDOM()}});
    ipcRenderer.on('phoneDSInfoData',(e:any,args:any[])=>{if(!_.isEqual(this.phDSInfo,args[0])){this.phDSInfo=args[0];this.pDOM()}});
    // HWInfo Listener
    ipcRenderer.on('SINetStats',(e:any,args:any[])=>{if(!_.isEqual(this.siInfo.netStats,args[0])){this.siInfo.netStats=args[0];this.pDOM()}});
    ipcRenderer.on('SIInfo',(e:any,args:any[])=>{if(!_.isEqual(this.siInfo,args[0])){this.siInfo=args[0];this.pDOM()}});
    ipcRenderer.on('HWInfo',(e:any,args:any[])=>{if(!_.isEqual(this.hwInfo,args[0])){this.hwInfo=args[0];this.pDOM()}});
    // RPI Liseners
    ipcRenderer.on('rpiInfo',(e:any,args:any[])=>{this.rpiInfo=args[0];if(!this.rpiOnline){this.rpiOnline=true};this.pDOM()});
    ipcRenderer.on('debInfo',(e:any,args:any[])=>{this.debInfo=args[0];if(!this.debOnline){this.debOnline=true};this.pDOM()});
    // MotionDetect Listeners --->
    ipcRenderer.on('setPIRWLEDIndexes',(e:any,args:any[])=>{this.pirWLEDIndexes=args[0]});
    ipcRenderer.on('homePIRCountMaxTimeS',(e:any,args:any[])=>{this.pirCountMaxTimeS=args[0]});
    ipcRenderer.on('motionDetectData',async(e:any,args:any[])=>{
      if(this.pirWLEDIndexes===null){const getPWIRes:any=await ipcRenderer.invoke('getPIRWLEDIndexes');if(!_.isEmpty(getPWIRes)){this.pirWLEDIndexes=getPWIRes}};
      if(this.wcData.pirStates.power){
        if(args[0]==='status'){
          if(!this.mdSensors[(args[1]-1)].online.state){this.mdSensors[(args[1]-1)].online.state=true;this.pDOM()};
          if(this.mdSensors[(args[1]-1)].online.to!==null){clearTimeout(this.mdSensors[(args[1]-1)].online.to);this.mdSensors[(args[1]-1)].online.to=null};
          this.mdSensors[(args[1]-1)].online.to=setTimeout(()=>{this.mdSensors[(args[1]-1)].online.state=false;this.mdSensors[(args[1]-1)].online.to=null;this.pDOM()},70000);
        }else if(args[0]==='motion'){
          if(!this.mdSensors[(args[1]-1)].motion.state){
            this.mdSensors[(args[1]-1)].motion.state=true;this.pDOM();
            if(this.wcData.pirStates.sound){
              if(this.pirAudio[args[1]].audio===null){
                this.pirAudio[args[1]].audio=new Audio();
                this.pirAudio[args[1]].audio.src=`assets/${'md'+String(args[1])+'.wav'}`;
                this.pirAudio[args[1]].audio.load();
                this.pirAudio[args[1]].audio.addEventListener('play',()=>{this.pirAudio[args[1]].playing=true});
                this.pirAudio[args[1]].audio.addEventListener('ended',()=>{this.pirAudio[args[1]].playing=false});
                this.pirAudio[args[1]].audio.addEventListener('pause',()=>{this.pirAudio[args[1]].playing=false});
              }else{if(this.pirAudio[args[1]].playing){this.pirAudio[args[1]].audio.pause();this.pirAudio[args[1]].audio.currentTime=0}};
              if(!this.pirMotionData[args[1]].ctrl&&this.dCamMotion.isMotion){this.pirAudio[args[1]].audio.play()};
            };
          };
          if(this.mdSensors[(args[1]-1)].motion.to!==null){clearTimeout(this.mdSensors[(args[1]-1)].motion.to);this.mdSensors[(args[1]-1)].motion.to=null};
          this.mdSensors[(args[1]-1)].motion.to=setTimeout(()=>{this.mdSensors[(args[1]-1)].motion.state=false;this.mdSensors[(args[1]-1)].motion.to=null;this.pDOM()},6000);
        };
        this.pDOM();
      }
    });
    ipcRenderer.on('motionCtrlData',async(e:any,args:any[])=>{
      const anyCtrlB4:boolean=this.anyPirCtrl();
      for(const[k,v]of Object.entries(args[1])){if(this.pirMotionData[args[0]][k]!==v){this.pirMotionData[args[0]][k]=v;this.pDOM()}};
      const anyCtrlAfter:boolean=this.anyPirCtrl();
      if(anyCtrlAfter!==anyCtrlB4){
        if(anyCtrlAfter&&!this.dLoopOn){this.prDiffy('r')}
        else if(!anyCtrlAfter&&this.dLoopOn){this.prDiffy('p')}
      }
    });
    ipcRenderer.on('motionTriggerData',async(e:any,args:any[])=>{for(const[k,v]of Object.entries(args[1])){if(this.pirMotionData[args[0]][k]!==v){this.pirMotionData[args[0]][k]=v;this.pDOM()}}});
    // More/YTDL Listeners --->
    ipcRenderer.on('moreWShowing',(e:any,args:any[])=>{
      const existMW:number=this.moreWinsOpen.findIndex(mw=>mw.name===args[0]);if(existMW===-1){this.moreWinsOpen.push({name:args[0],open:args[1]})}else{this.moreWinsOpen[existMW].open=args[1]};this.pDOM()});
    // Twitch Listeners --->
    ipcRenderer.on('twtChildWShowing',(e:any,args:any[])=>{this.twtChildWShowing=args[0]});
    ipcRenderer.on('updateTWTData',(e:any,args:any[])=>{if(!_.isEqual(this.wcData.twtSaveData,args[0])){this.wcData.twtSaveData=args[0]};this.doSaveData()});
    // Kodi Listeners --->
    ipcRenderer.on('kodiIsRunning',async(e:any,args:any[])=>{
      this.kodiIsRunning=args[0];
      if(!this.rpiOnline&&args[0]===true){this.rpiOnline=true};
      this.pDOM();
      if(args[0]===false&&this.kodiQCIsShowing){this.KQCInAni=false;await this.doW(0.3);this.kodiQCIsShowing=false;this.pDOM()};
    });
    ipcRenderer.on('kodiPlyrUpdate',async(e:any,args:any[])=>{
      if(!_.isEqual(this.kodiPlyr,args[0].plyr)){
        this.kodiPlyr=args[0].plyr;
        if(this.kodiPlyr.item!==null){
          let kPI:any[]=[];
          for(const[k,v]of Object.entries(this.kodiPlyr.item)){
            if(k.toString()!=='type'&&v&&v!==0&&v!==-1&&(typeof v==='string'||typeof v==='number')){
              kPI.push({l:k.charAt(0),v:v.toString().toLowerCase().trim()})
            }
          };
          this.kodiPlayingInfo=kPI
        }else{this.kodiPlayingInfo=[]};
        if(this.kodiPlyrBarType==='indeterminate'){
          this.kodiPlyrBarType='determinate';
          this.kodiSeekLine.mouseIn=false;
          this.pDOM()
        };
        this.kodiTimeStr=new Date(this.kodiPlyr.pos.time*1000).toISOString().slice(11,19)
      };
      if(!_.isEqual(this.kodiVolMute,args[0].vm)){this.kodiVolMute=args[0].vm;this.pDOM()};
      if(this.kodiPlyr.status!=='stopped'){this.kodiProgOn=true;this.pDOM();await this.doW(1);await this.kodiScroll('start')}
      else{if(this.kodiProgOn){await this.doW(1);await this.kodiScroll('stop')};this.kodiProgOn=false;this.pDOM()};
      this.pDOM()
    });
    ipcRenderer.on('kodiPlyrPosUpdate',(e:any,args:any[])=>{if(this.kodiPlyrBarType==='indeterminate'){this.kodiPlyrBarType='determinate';this.kodiSeekLine.mouseIn=false};this.kodiPlyr.pos=args[0];this.kodiTimeStr=new Date(this.kodiPlyr.pos.time*1000).toISOString().slice(11,19);this.pDOM()});
    // ICUE Listeners --->
    ipcRenderer.on('cueSDKStatus',(e:any,args:any[])=>{this.sdkStatus=args[0]});
    ipcRenderer.on('forceCUESetDefList',()=>{this.genSetDefDevList()});
    ipcRenderer.on('svrUpdateCUEColors',(e:any,args:any[])=>{const nCs:WCCUEDeviceLEDColors[]=args[0];for(let tgI=0;tgI<this.wcData.tree.length;tgI++){for(let tdI=0;tdI<this.wcData.tree[tgI].dtDevices.length;tdI++){if(this.wcData.treeStates[this.wcData.tree[tgI].dtDevices[tdI].info.id]){const mI:number=nCs.findIndex(o=>o.id===this.wcData.tree[tgI].dtDevices[tdI].info.id);if(mI!==-1){this.wcData.tree[tgI].dtDevices[tdI].colors=nCs[mI].colors}}}};this.pDOM()});
    ipcRenderer.on('startNoteICUE',async(e:any,args:any[])=>{this.noteInProg=true;const hlC:any={whatsapp:[37,211,102,0],gmail:[199,22,16,0],sms:[0,87,203,0]},nC:any[]=hlC[args[0]];this.noteOldCol=await this.getMajorityColor();const setArr:WCCUESetDeviceLED[]=await this.genColorSetArr({r:nC[0],g:nC[1],b:nC[2],a:255});await this.genSetLEDs(setArr)});
    ipcRenderer.on('stopNoteICUE',async(e:any,args:any[])=>{const restArr:WCCUESetDeviceLED[]=await this.genColorSetArr(this.noteOldCol);await this.genSetLEDs(restArr);this.noteInProg=false});
    // WLED Listeners --->
    ipcRenderer.on('wledRSSI',(e:any,args:any[])=>{
      let wRObjsArr:any[]=[];Array.isArray(args[0])?wRObjsArr=args[0]:wRObjsArr.push(args[0]);
      for(let wri=0;wri<wRObjsArr.length;wri++){this.wledRSSIs[wRObjsArr[wri].n]=wRObjsArr[wri].v};
      this.pDOM();
    });
    ipcRenderer.on('wledGroupsSync',(e:any,args:any[])=>{if(this.wledSyncGroupsOn!==args[0]){this.wledSyncGroupsOn=args[0];this.pDOM()}});
    ipcRenderer.on('svrUpdateWLEDColors',(e:any,args:any[])=>{
      if(this.wledTreeReady){
        const allWCCols:WLEDAllClientCols=args[0];
        for(let wi=0;wi<this.wledTree.length;wi++){
          const wcName:string=this.wledTree[wi].info.name;
          if(allWCCols.hasOwnProperty(wcName)){
            const thisSegColArr:(RGBColor|RGBWColor)[]=allWCCols[wcName];
            for(let si=0;si<thisSegColArr.length;si++){
              this.wledTree[wi].state.segments[si].colors=thisSegColArr[si]
            }
          }
        };
        this.pDOM();
      }
    });
    ipcRenderer.on('wledEventUpdateState',(e:any,args:any[])=>{
      if(this.wledTreeReady){
        const wcIndex:number=args[0].i,nStateObj:WLEDClientState=args[0].s;
        if(!_.isEqual(this.wledTree[wcIndex].state,nStateObj)){
          this.wledTree[wcIndex].state=nStateObj;
          this.pDOM();
          this.wcData.wledBrightness[wcIndex]=nStateObj.brightness;
          this.doSaveData();
        };
      }
    });
    // General Listeners --->
    ipcRenderer.on('invokeAwaitFn',async(e:any,args:any[])=>{let hasData:boolean;args.length>1&&args[1]?hasData=true:hasData=false;if(hasData){await this[args[0]](args[1]);this.sendAwaitFnDone(args[0])}else{await this[args[0]]();this.sendAwaitFnDone(args[0])}});
    ipcRenderer.on('sendAvailCons',(e:any,args:any[])=>{this.availCons(args[0],args[1])});
    ipcRenderer.on('winChanged',(e:any,args:any[])=>{this.wcData.wcWinSizePos=args[0];this.homeWrap.nativeElement.click()});
    ipcRenderer.on('doInvokeToggleWCListen',async()=>{await this.doInvokeToggleWCListen()});
    ipcRenderer.on('doInvokeRefreshNetClients',async()=>{await this.doRefreshNetClients()});
    ipcRenderer.on('newSS',async(e:any,args:any[])=>{if(this.wcData.syncStates.sshotSync){const fac=new FastAverageColor();fac.getColorAsync(args[0]).then(async(fC:any)=>{const v:number[]=fC.value;await this.genClientSetColor({r:v[0],g:v[1],b:v[2],a:255},false)}).catch((e:any)=>{console.log(e)})}});
    // Client Action Listeners --->
    ipcRenderer.on('clientChangeSettings',(e:any,args:any[])=>{this.settingsOpt(args[0],args[1],args[2])});
    ipcRenderer.on('animSShotToggle',async(e:any,args:any[])=>{await this.sshotSyncAnim(args[0],args[1])});
    ipcRenderer.on('deviceSelectUpdate',(e:any,args:any[])=>{this.wcData.treeStates=args[0].icue;this.wledStates=args[0].wled;this.doRefreshAll()});
    ipcRenderer.on('clientDoWakeSleep',async(e:any,args:any[])=>{if(args[0]==='sleep'){this.doASleep()}else{this.doAWake(false)}});
    ipcRenderer.on('clientDoAllWhite',async(e:any,args:any[])=>{await this.stopSyncs();this.setAllWhiteLights()});
    ipcRenderer.on('clientWLEDFnChange',async(e:any,args:any[])=>{ipcRenderer.send('wledFnChange',[args[0]])});
    ipcRenderer.on('clientDoChime',(e:any,args:any[])=>{this.doChime(-1)});
    ipcRenderer.on('clientSetColor',async(e:any,args:any[])=>{if(this.wcData.isSleep){if(args[1]){this.wcData.lastColor=args[0];this.doSaveData()}}else{await this.stopSyncs();this.genClientSetColor(args[0],args[1])}});
    ipcRenderer.on('clientRandomDark',async(e:any,args:[])=>{const rCN=():number=>Math.floor(Math.random()*(255-1+1)+1);let rgbArr:number[]=[rCN(),rCN(),rCN()];while(rgbArr.some((c:number)=>c>100)){rgbArr=rgbArr.map((c:number)=>((c-1)<64?64:(c-1)))};const rCUESet:WCCUESetDeviceLED[]=await this.genColorSetArr({r:rgbArr[0],g:rgbArr[1],b:rgbArr[2],a:255});const rWLEDCol:RGBA={r:rgbArr[0],g:rgbArr[1],b:rgbArr[2],a:0};await this.genSetLEDs(rCUESet);await this.doSetWLEDColor(rWLEDCol,0);ipcRenderer.send('doUpdColors')});
    // Tray Action Listeners --->
    ipcRenderer.on('traySync2Audio',async(e:any,args:any[])=>{
      // Toggle DTLFX Here...
    });
    ipcRenderer.on('traySleepWakeNow',(e:any,args:any[])=>{if(args[0]==='sleep'){this.doASleep()}else{this.doAWake(false)}});
    ipcRenderer.on('trayGoSettings',()=>{if(!this.settingsMode){if(this.networkMode){this.networkMode=false};this.settingsMode=true;this.pDOM()}});
    ipcRenderer.on('traySetColor',async()=>{const doSetPop=async()=>{await this.stopSyncs();this.genTraySetColor()};if(this.wcData.isSleep){const popRes:boolean=await this.doAWake(true);if(popRes){doSetPop()}}else{doSetPop()}});
    ipcRenderer.on('traySetAllWhiteLight',async()=>{const doSetAWL=async()=>{await this.stopSyncs();this.setAllWhiteLights()};if(this.wcData.isSleep){const wakeRes:boolean=await this.doAWake(true);if(wakeRes){doSetAWL()}}else{doSetAWL()}});
    // App Focus
    ipcRenderer.on('appHasFocus',(e:any,args:any[])=>{this.appHasFocus=args[0]})
    this.wcIPCListenersDone=true;
  };
//////////////////////////////////////////////////
  getSINetAdapter():string{if(this.siInfo.netStats&&this.siInfo.netStats.length>0&&this.siInfo.netStats[0]&&this.siInfo.netStats[0].hasOwnProperty('iface')&&this.siInfo.netStats[0].iface&&this.siInfo.netStats[0].iface.trim().length>0){if(this.siInfo.netStats[0].iface.includes('Ethernet')){return 'Ethernet'}else{return 'Wifi'}}else{return 'NK'}}
  //-------------------------------------------------
  getRXTXTtl(b:number):{n:string,s:string}{
    const sizes:string[]=['b','kb','mb','gb','tb'];
    if(b===0){return {n:'-',s:''}};
    const i:number=(Math.floor(Math.log(b)/Math.log(1024)));
    if(i===0){return {n:b.toFixed(0),s:sizes[i]}};
    return {n:(b/Math.pow(1024,i)).toFixed(0),s:sizes[i]};
  }
//------------------------------------------------
  remPerc(p:string):string{return p.replace('%','')}
//-------------------------------------------------
  rpiTemp2Perc(temp:number):number{if(temp===-100){return -100}else{return (temp/100)}};
//-------------------------------------------------
  refreshSIDisks(){
    this.cCons('refreshSIDisks','()...');
    ipcRenderer.send('fetchSIInfo');
  }
//-------------------------------------------------
  getCircBarCol(t:number):string{
    if(t<50){return '#20c997ad'}
    else if(t>=50&&t<65){return '#ffc800ad'}
    else if(t>=65&&t<80){return '#ff6a00ad'}
    else if(t>80){return '#fa5252ad'}
    else{return '#aaaaaa'};
  }
//-------------------------------------------------
  rpiTX2Perc(tx:number):number{
    if(tx===-100){return -100}
    else{
      if(tx>=-30){return 1}
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
    }
  }
//-------------------------------------------------
  async custKeyPadListener(){
    let ckpHandler:any;
    //------------
    if(this.customKPListenerOn===false){
      ckpHandler=(e:any)=>{
        console.log(e);
        if((e.key==='+'||e.key==='_')&&e.key.ctrlKey&&e.key.altKey&&e.key.metaKey){
          e.preventDefault();
          if(e.defaultPrevented){
            if(e.key==='+'){ipcRenderer.send('kbKnobAdjust',['brightness','inc'])}else{ipcRenderer.send('kbKnobAdjust',['brightness','dec'])};
          }
        }
      };
      document.addEventListener('keydown',ckpHandler);
      this.customKPListenerOn=true;
      ipcRenderer.on('quickKillKeyPadListener',()=>{if(this.customKPListenerOn===true){document.removeEventListener('keydown',ckpHandler);this.customKPListenerOn=false}});
    }
  }
//-------------------------------------------------
  async toggleKnobFn(e){
    const handler=(event:any)=>{
      if(this.appHasFocus){
        const eKey:any=event.key;
        if(eKey==='ArrowUp'||eKey==='ArrowDown'||'ArrowLeft'){
          event.preventDefault();
          if(event.defaultPrevented){
            if(eKey==='ArrowUp'||eKey==='ArrowDown'){
              if(eKey==='ArrowUp'){ipcRenderer.send('kbKnobAdjust',['brightness','inc'])}else{ipcRenderer.send('kbKnobAdjust',['brightness','dec'])};
            }else if(eKey==='ArrowLeft'){ipcRenderer.send('kbKnobAdjust',['onOff'])}
          }
        }
      }
    };
    this.cCons('toggleKnobFn','()...');
    e.preventDefault();
    if(!this.knobFnIsOn){
      this.knobFnIsOn=true;this.pDOM();
      document.addEventListener('keydown',handler);
    }else{
      document.removeEventListener('keydown',handler);
      this.knobFnIsOn=false;this.pDOM();
    };
  }
//////////////////////////////////////////////////
// INIT FUNCTIONS
//////////////////////////////////////////////////
  awaitListeners():Promise<true>{return new Promise((resolve)=>{const aL=setInterval(()=>{if(this.wcIPCListenersDone){clearInterval(aL);resolve(true)}},100)})}
//------------------------------------------------
  async doInits(){
    await this.awaitListeners();
    if(!this.navOLListen){this.onOffLineListener('add')};
    this.doInvokeGetNetworkInfo(false);
    this.doInvokeListGrantClients();
    this.doInvokeListBanClients();
    this.netClientsTime=this.evServ.strFormat(new Date(),'d MMM @ h:mmaaa');this.pDOM();
    await this.doInvokeGetData();
    const skipWLEDInitRes:boolean=await ipcRenderer.invoke('isDelayedWLEDInit');
    if(skipWLEDInitRes){this.wledDTLFXOverride=true;this.wledTree=[];this.wledTreeReady=true;this.pDOM()}
    else{await this.fetchWLEDData()};
    this.doSaveData();
    if(this.sdkStatus===null){this.sdkStatus=await ipcRenderer.invoke('getCUESDKStatus')};
    if(this.sdkStatus.session.code===6&&this.sdkStatus.error.code===0){await this.doInvokeGetDevices()};
    // Check Kodi
    const kodiAuthRes:{r:boolean,d:any}=await ipcRenderer.invoke('needsKodiUPAuth');
    if(kodiAuthRes.r){this.hasKodi=true;this.kodiUPPop('show',kodiAuthRes.d)}else{this.hasKodi=kodiAuthRes.d.hasKodi};
    // Check Pir Sensors
    let pirOnlineObj:any={1:false,2:false,3:false};
    if(this.wcData.pirStates.power){for(let pi=0;pi<this.mdSensors.length;pi++){pirOnlineObj[this.mdSensors[pi].pirNo]=this.mdSensors[pi].online.state}};
    ipcRenderer.send('pirsInit',[this.wcData.pirStates.power,pirOnlineObj]);
    if(!this.camPlugged){await this.checkCam()};
    if(this.camPlugged&&this.wcData.pirStates.power){this.toggleDiffy(true)};
    this.pDOM();
    //------------------------
    this.doSaveData();
    //------------------------
    setTimeout(()=>{ipcRenderer.send('homeInitsDone')},3000);
  }
//////////////////////////////////////////////////
// REFRESH/STATES/APPDATA FUNCTIONS
//////////////////////////////////////////////////
  async doInvokeGetData():Promise<boolean>{
    this.cCons('doInvokeGetData','()...');
    let savedData:WCData=await ipcRenderer.invoke('handleGetData');
    for(const[k,v]of Object.entries(defWCData)){if(!savedData.hasOwnProperty(k)){savedData[k]=v}};
    this.wcData=savedData;
    if(this.wcData.settings.timedFunctions.recurringChime.isOn){await this.recurringChimeLoop('start')};
    this.aSleepWakeSleepTime=(this.evServ.strFormat((this.evServ.str2D(this.wcData.settings.timedFunctions.autoSleepWake.sleep,'h:mma')),'HH:mm'));
    this.aSleepWakeWakeTime=(this.evServ.strFormat((this.evServ.str2D(this.wcData.settings.timedFunctions.autoSleepWake.wake,'h:mma')),'HH:mm'));
    if(this.wcData.isSleep){this.wcData.isSleep=false};
    if(this.wcData.settings.timedFunctions.autoSleepWake.isOn){await this.autoSleepWakeLoop('start')};
    if(!this.wcData.lastColor||!(this.isVRGBA(this.wcData.lastColor))){this.wcData.lastColor={r:255,g:255,b:255,a:255}};
    this.doSaveData();
    return Promise.resolve(true);
  };
//------------------------------------------------
  async doInvokeGetNetworkInfo(doRefresh:boolean):Promise<boolean>{
    const netInfoRes:NetworkInfo=await ipcRenderer.invoke('handleGetNetworkInfo',[doRefresh]);
    this.netInfo=netInfoRes;
    this.doFooterNetStatus();
    if(this.netInfo.info.ip4Conn!=='LocalNetwork'&&this.netInfo.info.ip4Conn!=='Internet'){
      ipcRenderer.send('setOverlayIco',['wc-window-notif-disconnected.png','No Network Connection']);
      ipcRenderer.invoke('sendSockServerData',['serverTerminated',true]);
    };
    for(let nci=0;nci<this.netInfo.clients.length;nci++){
      const nc:NetClients=this.netInfo.clients[nci];
      if(nc.ip==='192.168.0.18'){this.rpiOnline=true};
      if(nc.ip.startsWith('192.168.0.20')){
        const pirNo:number=Number(nc.ip.charAt((nc.ip.length-1)));
        if(this.wcData.pirStates.power){
          if(!this.mdSensors[(pirNo-1)].online.state){
            this.mdSensors[(pirNo-1)].online.state=true;this.pDOM();
            if(this.mdSensors[(pirNo-1)].online.to!==null){clearTimeout(this.mdSensors[(pirNo-1)].online.to);this.mdSensors[(pirNo-1)].online.to=null};
            this.mdSensors[(pirNo-1)].online.to=setTimeout(()=>{this.mdSensors[(pirNo-1)].online.state=false;this.pDOM()},70000);
          }
        }
      }
    };
    this.pDOM();
    return Promise.resolve(true)
  };
//------------------------------------------------
  async doInvokeListGrantClients():Promise<boolean>{const getGrantClsObj:any|false=await ipcRenderer.invoke('listGrantClients');if(getGrantClsObj!==false){this.grantsList=getGrantClsObj}else{this.grantsList={}};this.pDOM();return Promise.resolve(true)};
//------------------------------------------------
  async doInvokeListBanClients():Promise<boolean>{const getBanClsArr:string[]|false=await ipcRenderer.invoke('listBanClients');if(getBanClsArr){this.banList=getBanClsArr}else{this.banList=[]};this.pDOM();return Promise.resolve(true)}
//------------------------------------------------
  async doInvokeToggleWCListen(){const toggleRes:boolean=await ipcRenderer.invoke('handleToggleWCListen');this.wcData.isListen=toggleRes;this.pDOM();this.doSaveData()};
//------------------------------------------------
  async doRefreshAll():Promise<boolean>{this.cCons('doRefreshAll','()...');await this.doW(.5);await this.doInvokeGetDevices();return Promise.resolve(true)};
//------------------------------------------------
  async doInvokeGetDevices():Promise<boolean>{
    this.cCons('doInvokeGetDevices','()...');
    this.cueDevicesRaw=await ipcRenderer.invoke('handleGetDevices');
    if(!this.cueTreeReady){this.cueTreeReady=true};
    let newCT:CUETreeGroup[]=[];
    let newCTP:any={};
    for(let rdi=0;rdi<this.cueDevicesRaw.devices.length;rdi++){
      const rawDevice:CUEDeviceRaw=this.cueDevicesRaw.devices[rdi];
      const existTreeIndex:number=newCT.findIndex((tObj:CUETreeGroup)=>tObj.dtNo===rawDevice.info.type);
      if(existTreeIndex===-1){
        newCT.push({
          dtNo:rawDevice.info.type,
          dtName:(await this.devTypeE2S(rawDevice.info.type)),
          dtIcon:(await this.devTypeIcos(rawDevice.info.type)),
          dtCount:1,
          dtDevices:[rawDevice]})
        }else{newCT[existTreeIndex].dtCount++;newCT[existTreeIndex].dtDevices.push(rawDevice)};
    };
    newCT=_.orderBy(newCT,['dtNo'],['asc']);
    for(let gI=0;gI<newCT.length;gI++){
      const ctGroup:CUETreeGroup=newCT[gI]
      for(let dI=0;dI<ctGroup.dtDevices.length;dI++){
        const ctDevice:CUETreeDevice=ctGroup.dtDevices[dI];
        ctDevice.pos=_.orderBy(ctDevice.pos,['id','asc']);
        ctDevice.colors=_.orderBy(ctDevice.colors,['id','asc']);
        if(this.wcData.treeStates.hasOwnProperty(ctDevice.info.id)){newCTP[ctDevice.info.id]=this.wcData.treeStates[ctDevice.info.id]}
        else{newCTP[ctDevice.info.id]={checked:true,vis:true}};
      };
    };
    this.wcData.tree=newCT;
    this.wcData.treeStates=newCTP;
    await this.genSetDefDevList();
    await this.doUpdCtrlData();
    this.cueTreeReady=false;this.pDOM();this.cueTreeReady=true;this.pDOM();
    this.doSaveData();
    return Promise.resolve(true);
  }
//------------------------------------------------
  async fetchWLEDData():Promise<boolean>{
    this.cCons('fetchWLEDData','()...');
    const ledsR:WCActiveWLEDS[]=await ipcRenderer.invoke('getWLEDS');
    this.wledTree=ledsR;
    for(let wi=0;wi<this.wledTree.length;wi++){
      let segCheck:boolean[]=[];
      for(let si=0;si<this.wledTree[wi].state.segments.length;si++){segCheck.push(true)};
      this.wledStates[this.wledTree[wi].info.name]=segCheck;
    };
    await this.doW(0.25);
    this.wledTreeReady=true;
    return Promise.resolve(true);
  }
//------------------------------------------------
  isWLEDMatrix(wledName:string):boolean{
    const matchLD:any=this.wledTree.filter((w:any)=>w.info.name===wledName)[0];
    if(matchLD.info.leds.hasOwnProperty('matrix')&&!_.isEmpty(matchLD.info.leds.matrix)){return true}
    else{return false};
  }
//------------------------------------------------
  getWLEDGrpNo(wledName:string):number{
    let grpNo:number=0;for(const [k,v] of Object.entries(this.wledGrpMembers)){if(v.includes(wledName)){grpNo=Number(k);break}};
    return grpNo;
  }
//------------------------------------------------
  isWLEDGroupLeader(wledName:string):boolean{
    const isGL:boolean=(this.wledGrpLeaders.includes(wledName));
    return isGL;
  }
//------------------------------------------------
  wledBPerc(wledIndex:number):string{return String(Math.round((this.wledTree[wledIndex].state.brightness/255)*100))+'%'};
//------------------------------------------------
  getAllWLEDLEDCount():number{if(this.wledTree&&this.wledTree.length>0){let count:number=0;for(let wi=0;wi<this.wledTree.length;wi++){count+=this.wledTree[wi].info.leds.count};return count}else{return 0}}
//------------------------------------------------
  getTTLICUELedCount():number{if(this.wcData.tree&&this.wcData.tree.length>0){let count:number=0;for(let dgi=0;dgi<this.wcData.tree.length;dgi++){for(let dii=0;dii<this.wcData.tree[dgi].dtDevices.length;dii++){count+=this.wcData.tree[dgi].dtDevices[dii].info.ledCount}};return count}else{return 0}}
//------------------------------------------------
  getTTLPirsCount():number{return this.mdSensors.length}
//------------------------------------------------
  wledBrightness(v:any,wledIndex:number,wledName:string){
    let bVal:number;typeof v==='number'?bVal=v:bVal=v.detail.value;
    ipcRenderer.send('serverAdjustWLEDBright',[bVal,this.wledSyncGroupsOn,wledIndex,wledName]);
  }
 //-----------------------------------------------
  doPutty2RC(ip:string){this.cCons('doPutty2RC','('+ip+')...');ipcRenderer.send('putty2RC',[ip])}
//------------------------------------------------
  async ccIndivDevice(cat:'icue'|'wled',type:'group'|'indiv',devID:string,e?:any){
    this.cCons('ccIndivDevice','('+cat+','+type+','+devID+',$e?)...');
    if(e){e.preventDefault()};
    if(this.wcData.syncStates.audioSync){this.cCons('ccIndivDevice','SKIPPED - Audio Sync Running');return};
    //------------
    const getPopCol=async(initCol:RGBA):Promise<RGBA|RGBColor|RGBWColor|false>=>{
      const sCPop:HTMLIonModalElement=await this.modalCtrl.create({component:InputPopoverComponent,componentProps:{id:'setnewcolorinput',type:'color',initColor:initCol},showBackdrop:true,backdropDismiss:false,cssClass:'wc-color-popover-class',animated:true,mode:'md',keyboardClose:false,id:'setnewcolorinput'});
      let resColObj:RGBA|RGBColor|RGBWColor|false;
      await sCPop.present();
      const sCPopRes:any=await sCPop.onDidDismiss();
      if(sCPopRes.role!=='cancel'){
        if(cat==='icue'){resColObj={r:sCPopRes.data.r,g:sCPopRes.data.g,b:sCPopRes.data.b,a:255}}
        else{
          if(sCPopRes.data.r===255&&sCPopRes.data.g===255&&sCPopRes.data.b===255){resColObj=[0,0,0,255]}
          else{resColObj=[sCPopRes.data.r,sCPopRes.data.g,sCPopRes.data.b,0]}
        }
      };
      return Promise.resolve(resColObj);
    }
    //-------------
    let initPopCol:RGBA={r:255,g:255,b:0,a:1},icMC:RGBA,mName:string=devID;
    if(cat==='icue'){
      if(type==='group'){icMC=await this.getMajorityColor()}else if(type==='indiv'){icMC=await this.getICUEDevMajCol(devID)}else{return};
      if(icMC.r===0&&icMC.g===0&&icMC.b===0){initPopCol={r:255,g:255,b:0,a:1}}else{initPopCol={r:icMC.r,g:icMC.g,b:icMC.b,a:1}};
    }else if(cat==='wled'){
      if(type==='group'&&this.wledSyncGroupsOn){devID==='Zer0WLED1'||devID==='Zer0WLED2'||devID==='Zer0WLED3'?mName='Zer0WLED1':mName='Zer0WLED4'};
      const mCA:RGBColor|RGBWColor=this.wledTree.filter((wd:any)=>wd.info.name===mName)[0].state.segments[0].colors[0];
      initPopCol={r:mCA[0],g:mCA[1],b:mCA[2],a:1};
    }else{return};
    const newDevColObj:any=await getPopCol(initPopCol);
    if(newDevColObj!==false){
      if(cat==='icue'){
        let newDL:WCCUESetDeviceLED[]=[],defSDL:WCCUESetDeviceLED[]=this.defSetDevList;if(type==='indiv'){defSDL=this.defSetDevList.filter((sd)=>sd.id===devID)};
        for(let i=0;i<defSDL.length;i++){newDL.push({id:defSDL[i].id,colors:defSDL[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:newDevColObj.r,g:newDevColObj.g,b:newDevColObj.b,a:255}})})};
        await this.genSetLEDs(newDL);
        await this.doW(0.25);
        ipcRenderer.send('doUpdColors');
      }else{ipcRenderer.send('wledCCIndivDevice',[mName,newDevColObj,type])}
    }else{this.cCons('ccIndivDevice','Cancelled')}
  }
//------------------------------------------------
  async doUpdCtrlData():Promise<boolean>{await ipcRenderer.invoke('doUpdCtrlData',[this.wcData]);return Promise.resolve(true)};
//------------------------------------------------
  isWLEDDevice(netClient:NetClients):boolean{const ledDeviceIPs:string[]=this.wledTree.map(wd=>wd&&wd.info.ip);if(ledDeviceIPs.includes(netClient.ip)){return true}else{return false}};
//-------------------------------------------------
  isMSensorDevice(netClient:NetClients):boolean{if(netClient.ip.startsWith('192.168.0.20')){return true}else{return false}};
///////////////////////////////////////////////////
// OTHER WINDOWS
///////////////////////////////////////////////////
  async toggleShowTwitch(){
    this.cCons('toggleShowTwitch','()...');
    if(!this.twtChildWShowing){
      const twtStatusRes:{auth:boolean,chat:boolean}=await ipcRenderer.invoke('homeGetTwtStatus');
      if(!twtStatusRes.auth){this.twtAuthInProg=true;this.pDOM();if(!(await ipcRenderer.invoke('initTwt'))){this.twtAuthInProg=false;this.cCons('toggleShowTwitch','ERROR: Failed to Init Twitch Auth');return};this.twtAuthInProg=false;this.pDOM()};
      if(!twtStatusRes.chat){this.twtAuthInProg=true;this.pDOM();if(!(await ipcRenderer.invoke('initTwtChat',[null]))){this.twtAuthInProg=false;this.cCons('toggleShowTwitch','ERROR: Failed to Init Twitch Chat');return};this.twtAuthInProg=false;this.pDOM()};
      ipcRenderer.send('createChildWindow',['twitch']);
    }else{ipcRenderer.send('killChildWindow')}
  }
//-------------------------------------------------------------
  mwIsOpen(name:string):boolean{
    const existMI:number=this.moreWinsOpen.findIndex(m=>m.name===name);
    if(existMI!==-1){return true}else{return false}
  }
//-------------------------------------------------------------
  openMoreWin(module:string){
    this.cCons('openMoreWin','('+module+')...');
    const existMI:number=this.moreWinsOpen.findIndex(m=>m.name===module);
    if(existMI===-1||!this.moreWinsOpen[existMI].open){ipcRenderer.send('createMoreWin',[module])}
    else{ipcRenderer.send('killMoreWin',[module])};
  }
//////////////////////////////////////////////////
// CORE COLOR FUNCTIONS
//////////////////////////////////////////////////
  async genSetDefDevList():Promise<boolean>{
    let newSetDefDevList:WCCUESetDeviceLED[]=[];
    for(let ctGI=0;ctGI<this.wcData.tree.length;ctGI++){
      const ctGroup:CUETreeGroup=this.wcData.tree[ctGI];
      for(let ctDI=0;ctDI<ctGroup.dtDevices.length;ctDI++){
        const ctDevice:CUETreeDevice=ctGroup.dtDevices[ctDI];
        if(this.wcData.treeStates[ctDevice.info.id]){
          let newCTDeviceLEDColors:WCCUESetDeviceLED={id:ctDevice.info.id,colors:ctDevice.colors};
          newSetDefDevList.push(newCTDeviceLEDColors);
        };
      };
    };
    this.defSetDevList=newSetDefDevList;
    ipcRenderer.send('setCUEDefDevList',[this.defSetDevList]);
    return Promise.resolve(true);
  }
//------------------------------------------------
  async genColorSetArr(color:RGBA):Promise<WCCUESetDeviceLED[]>{
    let newDL:WCCUESetDeviceLED[]=[];
    for(let i=0;i<this.defSetDevList.length;i++){newDL.push({id:this.defSetDevList[i].id,colors:this.defSetDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:color.r,g:color.g,b:color.b,a:255}})})};
    return Promise.resolve(newDL);
  }
//------------------------------------------------
  async genSetLEDs(set:WCCUESetDeviceLED[]):Promise<boolean>{
    for(let scI=0;scI<set.length;scI++){ipcRenderer.send('setLED',[set[scI].id,set[scI].colors])};
    return Promise.resolve(true);
  };
//------------------------------------------------
  async genSetLEDSequence(setDevSeq:WCCUESetDeviceLEDSeq[]):Promise<boolean>{
    this.cCons('localSetLEDSequence','WCCUESetDeviceLEDSeq[]...');
    for(let seqI=0;seqI<setDevSeq.length;seqI++){
      for(let setI=0;setI<setDevSeq[seqI].set.length;setI++){
        ipcRenderer.send('setLED',[setDevSeq[seqI].set[setI].id,setDevSeq[seqI].set[setI].colors])
      };
      await this.doW(setDevSeq[seqI].time)
    };
    return Promise.resolve(true);
  }
//------------------------------------------------
  async genClientSetColor(c:RGBA,doRefresh:boolean):Promise<boolean>{
    const cSCSet:WCCUESetDeviceLED[]=await this.genColorSetArr(c);
    let wledTransTime:number=0;
    if(this.wcData.syncStates.sshotSync){wledTransTime=(2500/this.wcData.settings.syncAnimations.sshotSyncTime)/100};
    await ipcRenderer.invoke('wledSetColor',[[c.r,c.g,c.b,0],wledTransTime]);
    await this.genSetLEDs(cSCSet);
    ipcRenderer.send('doUpdColors');
    if(doRefresh){
      this.pDOM();
      this.wcData.lastColor=c;
      this.doSaveData();
      await this.doRefreshAll();
      this.pDOM();
    };
    return Promise.resolve(true);
  }
//------------------------------------------------
  async doSetWLEDColor(color:RGBA,transTime?:number):Promise<boolean>{
    this.cCons('doSetWLEDColor','(color:RGBA|string)...');
    const t:number=(transTime&&transTime>0?transTime:0);
    let c:RGBWColor|string=[color.r,color.g,color.b,0];
    if(color.r===255&&color.g===255&&color.b===255){c='white'};
    await ipcRenderer.invoke('wledSetColor',[c,t]);
    return Promise.resolve(true);
  }
//------------------------------------------------
  async genTraySetColor():Promise<boolean>{
    this.cCons('genClientSetColor','()...');
    let initCol:RGBA;
    const majCol:RGBA=await this.getMajorityColor();
    if(majCol.r===0&&majCol.g===0&&majCol.b===0){initCol={r:255,g:255,b:0,a:1}}else{initCol={r:majCol.r,g:majCol.g,b:majCol.b,a:1}};
    const sCPop:HTMLIonModalElement=await this.modalCtrl.create({component:InputPopoverComponent,componentProps:{id:'setnewcolorinput',type:'color',initColor:initCol},showBackdrop:true,backdropDismiss:false,cssClass:'wc-color-popover-class',animated:true,mode:'md',keyboardClose:false,id:'setnewcolorinput'});
    await sCPop.present();
    const sCPopRes:any=await sCPop.onDidDismiss();
    if(sCPopRes.role!=='cancel'){
      const newCol:RGBA={r:sCPopRes.data.r,g:sCPopRes.data.g,b:sCPopRes.data.b,a:255};
      const newICUEColSet:WCCUESetDeviceLED[]=await this.genColorSetArr(newCol);
      await this.genSetLEDs(newICUEColSet);
      await this.doSetWLEDColor(newCol,0);
      await this.doW(.5);
      ipcRenderer.send('doUpdColors');
      this.wcData.lastColor=newCol;
      this.doSaveData();
      return Promise.resolve(true);
    }else{return Promise.resolve(false)};
  }
//////////////////////////////////////////////////
// RECURRING CHIME FUNCTIONS
//////////////////////////////////////////////////
  recurringChimeLoop(action:'start'|'stop'):Promise<boolean>{
    this.cCons('recurringChimeLoop','('+action+')...');
    if(action==='start'){
      if(!this.rChimeRunning){
        this.rChimeInterval=setInterval(async()=>{
          let setInt:string=(await this.getRChimeSetInt()).trim(),nowM:string=(await this.evServ.nowMinsOnly()).trim();
          if(setInt==='60'&&nowM==='0'){await this.doChime(Number(nowM))}
          else if(setInt==='30'&&(nowM==='0'||nowM==='30')){await this.doChime(Number(nowM))}
          else if(setInt==='15'&&(nowM==='0'||nowM==='15'||nowM==='30'||nowM==='45')){await this.doChime(Number(nowM))};
        },60000);
        this.rChimeRunning=true;
        return Promise.resolve(true);
      }else{return Promise.resolve(false)};
    }else{
      if(this.rChimeRunning){clearInterval(this.rChimeInterval);this.rChimeRunning=false;return Promise.resolve(true)}
      else{return Promise.resolve(false)};
    };
  }
//------------------------------------------------
  async doChime(nM:number):Promise<boolean>{
    this.cCons('doChime','()...');
    if(!this.wcData.isSleep&&!this.wcData.syncStates.audioSync&&!this.wcData.syncStates.sshotSync&&!this.noteInProg){
      let nowM:number;nM===-1?nowM=Number((await this.evServ.nowMinsOnly()).trim()):nowM=nM;
      const mC:RGBA=await this.getMajorityColor();this.wcData.lastColor=mC;this.doSaveData();
      await this.chimeLEDSeq(nowM);
      const cLCSet:WCCUESetDeviceLED[]=await this.genColorSetArr(this.wcData.lastColor);await this.genSetLEDs(cLCSet);
      return Promise.resolve(true);
    }else{return Promise.resolve(true)};
  }
//------------------------------------------------
  async chimeLEDSeq(nowM:number):Promise<boolean>{
    this.cCons('chimeLEDAnim','('+String(nowM)+')...');
    const blankSet:WCCUESetDeviceLED[]=await this.genColorSetArr({r:0,g:0,b:0,a:255}),chimeSet:WCCUESetDeviceLED[]=await this.genColorSetArr({r:255,g:255,b:0,a:255});
    let chimesNo:number=0;
    if(nowM!==0&&nowM!==15&&nowM!==30&&nowM!==45){chimesNo=4}
    else{nowM===0?chimesNo=4:chimesNo=nowM/15};
    let chimeSeq:WCCUESetDeviceLEDSeq[]=[];
    for(let cI=0;cI<chimesNo;cI++){chimeSeq.push({set:blankSet,time:0.1});chimeSeq.push({set:chimeSet,time:0.1})};
    this.genSetLEDSequence(chimeSeq);
    const csRes:boolean=await ipcRenderer.invoke('wledDoChimeStart',[chimesNo]);
    if(!csRes){return Promise.resolve(false)}
    else{
      await this.doW((chimesNo*0.7));
      await ipcRenderer.invoke('wledDoChimeStop');
      return Promise.resolve(true);
    }
  }
//////////////////////////////////////////////////
// AUTO WAKE/SLEEP FUNCTIONS
//////////////////////////////////////////////////
  autoSleepWakeLoop(action:'start'|'stop'):Promise<boolean>{
    this.cCons('autoSleepWakeLoop','('+action+')...');
    if(action==='start'){
      if(!this.aSleepWakeRunning){
        this.aSleepWakeInterval=setInterval(async()=>{
          let setSleepStr:string=await this.getASleepTime(),setWakeStr:string=await this.getAWakeTime(),nowTimeStr:string=this.evServ.strFormat(new Date(),'h:mma');
          if(setSleepStr===nowTimeStr){await this.doASleep()};
          if(setWakeStr===nowTimeStr){await this.doAWake(false)};
        },60000);
        this.aSleepWakeRunning=true;
        return Promise.resolve(true);
      }else{return Promise.resolve(false)};
    }else{
      if(this.aSleepWakeRunning){clearInterval(this.aSleepWakeInterval);this.aSleepWakeRunning=false;return Promise.resolve(true)}
      else{return Promise.resolve(false)};
    };
  };
//------------------------------------------------
  async doASleep():Promise<boolean>{
    this.cCons('doASleep','()...');
    if(!this.wcData.isSleep){
      if(this.wcData.syncStates.audioSync){
        // Stop DTLFX Here...
      };
      if(this.wcData.syncStates.sshotSync){await this.sshotSyncAnim('stop','server')};
      const mC:RGBA=await this.getMajorityColor();this.wcData.lastColor=mC;this.doSaveData();
      ipcRenderer.invoke('wledDoSleep');
      await this.doSleepLEDSeq();
      this.wcData.isSleep=true;
      ipcRenderer.send('updateIsSleeping',[true,this.wcData.settings.timedFunctions.autoSleepWake.wake]);
      this.pDOM();
      ipcRenderer.send('doUpdColors');
      ipcRenderer.send('doPhoneCMD',['dim']);
      await this.doW(1.5);
      await this.doSaveData();
      this.doUpdCtrlData();
      return Promise.resolve(true);
    }else{return Promise.resolve(true)};
  }
//------------------------------------------------
  async doSleepLEDSeq():Promise<boolean>{
    let sleepSeq:WCCUESetDeviceLEDSeq[]=[],rV:number=255;
    for(let ri=0;ri<10;ri++){let colSet=[];ri===9?colSet=await this.genColorSetArr({r:0,g:0,b:0,a:255}):colSet=await this.genColorSetArr({r:rV-=25,g:0,b:0,a:255});sleepSeq.push({set:colSet,time:0.075})};
    await this.genSetLEDSequence(sleepSeq);
    const cLCSet:WCCUESetDeviceLED[]=await this.genColorSetArr({r:0,g:0,b:0,a:255});
    await this.genSetLEDs(cLCSet);
    return Promise.resolve(true);
  }
//------------------------------------------------
  async doAWake(withConfirm:boolean):Promise<boolean>{
    this.cCons('doAWake','()...');
    const confRes=async():Promise<boolean>=>{const isConfRes:boolean=await ipcRenderer.invoke('doConfirmWake',[this.wcData.settings.timedFunctions.autoSleepWake.wake]);if(isConfRes){return Promise.resolve(true)}else{return Promise.resolve(false)}};
    if(this.wcData.isSleep){
      if(withConfirm){const cRes:boolean=await confRes();if(!cRes){return Promise.resolve(false)}};
      this.wcData.isSleep=false;
      ipcRenderer.invoke('wledDoWake');
      await this.doWakeLEDSeq();
      ipcRenderer.send('updateIsSleeping',[false]);
      this.pDOM();
      ipcRenderer.send('doUpdColors');
      ipcRenderer.send('doPhoneCMD',['bright']);
      await this.doW(1.5);
      await this.doSaveData();
      this.doUpdCtrlData();
      return Promise.resolve(true);
    }else{return Promise.resolve(true)};
  }
//------------------------------------------------
  async doWakeLEDSeq():Promise<boolean>{
    let wakeSeq:WCCUESetDeviceLEDSeq[]=[],gV:number=0;
    for(let gi=0;gi<10;gi++){let colSet=[];gi===9?colSet=await this.genColorSetArr({r:0,g:255,b:0,a:255}):colSet=await this.genColorSetArr({r:0,g:gV+=25,b:0,a:255});wakeSeq.push({set:colSet,time:0.075})};
    await this.genSetLEDSequence(wakeSeq);
    const restCSet:WCCUESetDeviceLED[]=await this.genColorSetArr(this.wcData.lastColor);
    await this.genSetLEDs(restCSet);
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
// SYNC FUNCTIONS
//////////////////////////////////////////////////
  async startSyncPrep(syncName:string):Promise<boolean>{
    await this.stopSyncs();
    this.wcData.syncStates[syncName]=true;
    this.isS=true;
    await ipcRenderer.invoke('syncStateChange',[syncName,true]);
    const mC:RGBA=await this.getMajorityColor();
    this.wcData.lastColor=mC;
    this.doSaveData();
    return Promise.resolve(true);
  }
//------------------------------------------------
  async endSyncColRestore(syncName:string):Promise<boolean>{
    clearInterval(this[syncName+'Int']);
    this.wcData.syncStates[syncName]=false;
    await ipcRenderer.invoke('syncStateChange',[syncName,false]);
    this.isS=false;
    const restColSetRes:WCCUESetDeviceLED[]=await this.genColorSetArr(this.wcData.lastColor);
    await this.genSetLEDs(restColSetRes);
    ipcRenderer.send('doUpdColors');
    await this.doSaveData();
    await this.doW(1);
    return Promise.resolve(true);
  }
//------------------------------------------------
  async sshotSyncAnim(action:'start'|'stop',from?:'client'|'server'):Promise<boolean>{
    this.cCons('sshotSync','(from:'+from+',action:'+action+')...');
    const checkManWake=async():Promise<boolean>=>{if(!this.wcData.isSleep){return Promise.resolve(true)}else{return Promise.resolve((await this.doAWake(true)))}};
    if(from&&from==='server'&&action==='start'){const checWakeRes:boolean=await checkManWake();if(!checWakeRes){return Promise.resolve(false)}};
    if(this.wcData.isSleep){return Promise.resolve(true)}
    else{
      if(action==='start'){
        if(this.wcData.syncStates.audioSync||this.wcData.syncStates.sshotSync){await this.stopSyncs()};
        const mC:RGBA=await this.getMajorityColor();
        this.wcData.lastColor=mC;
        this.doSaveData();
        this.wcData.syncStates.sshotSync=true;
        this.isS=true;
        await ipcRenderer.invoke('syncStateChange',['sshotSync',true]);
        await ipcRenderer.invoke('doSShotPolling',['start',(2500/this.wcData.settings.syncAnimations.sshotSyncTime)]);
        this.pDOM();
        return Promise.resolve(true);
      }else{
        this.wcData.syncStates.sshotSync=false;
        this.isS=false;
        await ipcRenderer.invoke('syncStateChange',['sshotSync',false]);
        await ipcRenderer.invoke('doSShotPolling',['stop']);
        const restColSetRes:WCCUESetDeviceLED[]=await this.genColorSetArr(this.wcData.lastColor);
        await this.genSetLEDs(restColSetRes);
        await this.doW(.5);
        ipcRenderer.send('doUpdColors');
        return Promise.resolve(true);
      };
    };
  };
//////////////////////////////////////////////////
// SETTINGS FUNCTIONS
//////////////////////////////////////////////////
  async settingsOpt(cat:string,opt:string,value:any){
    this.cCons('settingsOpt',cat+','+opt+','+String(value));
    switch(cat){
      case 'ctrlReqs':
        switch(opt){
          case 'autoResponderOnOff':
            if(value){this.wcData.settings.controlRequests.autoResponder.isOn=true;this.wcData.settings.controlRequests.autoResponder.response='grant'}
            else{this.wcData.settings.controlRequests.autoResponder.isOn=false;this.wcData.settings.controlRequests.autoResponder.response=null};
            break;
          case 'autoResponderRespond':this.wcData.settings.controlRequests.autoResponder.response=value;break;
          case 'timeout':this.wcData.settings.controlRequests.timeout=value;break;
        };
      case 'timedFns':
        switch(opt){
          case 'recurringChimeOnOff':
            this.wcData.settings.timedFunctions.recurringChime.isOn=value;
            if(value){await this.recurringChimeLoop('start')}else{await this.recurringChimeLoop('stop')};
            break;
          case 'recurringChimeInterval':
            this.wcData.settings.timedFunctions.recurringChime.interval=value;
            this.pDOM();break;
          case 'recurringChimeIntervalWheel':
            const wEV:any=value.e,wV:number=Number(value.v);
            wEV.preventDefault();
            if(wEV.defaultPrevented){
              let dir:string='';if(wEV.deltaY===100){dir='dec'}else{dir='inc'};
              let newWV:number=wV;
              if(dir==='inc'){newWV+=15}else{newWV-=15};
              if(newWV>=60){newWV=60};
              if(newWV===45){dir==='inc'?newWV=60:newWV=30};
              if(newWV<=15){newWV=15};
              this.timedFnsRecurringChimeInterval.nativeElement.value=newWV.toString();
            };
            break;
          case 'recurringChimeIntervalKeyUp':
            const kEV:any=value.e,kV:number=Number(value.v);
            kEV.preventDefault();
            if(kEV.defaultPrevented){
              let newKV:number=kV;
              if(newKV>=60){newKV=60};
              if(newKV<60&&newKV>=45){newKV=60};
              if(newKV<45&&newKV>=30){newKV=30};
              if(newKV<30&&newKV>=15){newKV=15};
              if(newKV<15){newKV=15};
              this.timedFnsRecurringChimeInterval.nativeElement.value=newKV.toString();
            };
            break;
          case 'autoSleepWakeOnOff':
            this.wcData.settings.timedFunctions.autoSleepWake.isOn=value;
            if(value){await this.autoSleepWakeLoop('start')}else{await this.autoSleepWakeLoop('stop')};
            break;
          case 'autoSleepWakeTimeSleep':
            if(this.aSleepWakeSleepInput.nativeElement.value!==value){this.aSleepWakeSleepInput.nativeElement.value=value};
            const aSWTS:string=this.evServ.strFormat((this.evServ.str2D(value,'HH:mm')),'h:mma');
            this.wcData.settings.timedFunctions.autoSleepWake.sleep=aSWTS;
            break;
          case 'autoSleepWakeTimeWake':
            if(this.aSleepWakeWakeInput.nativeElement.value!==value){this.aSleepWakeWakeInput.nativeElement.value=value};
            const aSWTW:string=this.evServ.strFormat((this.evServ.str2D(value,'HH:mm')),'h:mma');
            this.wcData.settings.timedFunctions.autoSleepWake.wake=aSWTW;
            break;
        };
      break;
      case 'syncAnims':
        this.wcData.settings.syncAnimations[opt]=value;
        this.doSaveData();
        if((this.isSync())){this.debouncedSliderRestart(opt,value)};
        break;
    };
    await this.doRefreshAll();
    this.pDOM();
    ipcRenderer.send('updateClientSettings',[this.wcData.settings]);
    this.doSaveData();
  }
//------------------------------------------------
  async toggleWLEDSegChecked(name:string,segIndex:number){
    this.cCons('toggleWLEDSegChecked','('+name+','+String(segIndex)+')...');
    this.wledStates[name][segIndex]?this.wledStates[name][segIndex]=false:this.wledStates[name][segIndex]=true;
    ipcRenderer.send('updateClientDeviceSelect',[{icue:this.wcData.treeStates,wled:this.wledStates}]);
    await this.doRefreshAll();
    this.pDOM();
    this.doSaveData();
  }
//------------------------------------------------
  toggleWLEDUDPSync(){
    this.cCons('toggleWLEDUDPSync','()...');
    ipcRenderer.send('wledToggleSync');
  }
//------------------------------------------------
  wledColStyle(c:RGBColor|RGBWColor):string{
    if(_.isEqual(c,[0,0,0,255])){return 'rgba(255,255,255,1)'}
    else{return 'rgba('+String(c[0])+','+c[1]+','+c[2]+',1)'};
  };
//------------------------------------------------
  lfxGradColStyle(c:number[]):string{return 'rgba('+String(c[0])+','+c[1]+','+c[2]+',1)'};
//------------------------------------------------
  async toggleCTDeviceState(type:'vis'|'checked',devId:string){
    this.cCons('toggleCTDeviceState','('+type+','+devId+')...');
    if(this.wcData.treeStates.hasOwnProperty(devId)){
      if(this.wcData.treeStates[devId].hasOwnProperty(type)){
        if(this.wcData.treeStates[devId][type]){this.wcData.treeStates[devId][type]=false}
        else{this.wcData.treeStates[devId][type]=true};
      }else{this.wcData.treeStates[devId][type]=true};
    }else{this.wcData.treeStates[devId]=true};
    ipcRenderer.send('updateClientDeviceSelect',[{icue:this.wcData.treeStates,wled:this.wledStates}]);
    if(type==='checked'){await this.doRefreshAll()};
    this.pDOM();
    this.doSaveData();
  }
///////////////////////////////////////////////////
// KODI FUNCTIONS
//////////////////////////////////////////////////
  async toggleKodiQCPop(){
    this.cCons('toggleKodiQCPop','()...');
    if(!this.kodiIsRunning){ipcRenderer.send('kodiQCFn',['startkodi',null])}
    else{
      if(this.kodiQCIsShowing){this.KQCInAni=false;await this.doW(0.3);this.kodiQCIsShowing=false}else{this.KQCInAni=true;await this.doW(0.3);this.kodiQCIsShowing=true};this.pDOM();
    }
  }
//------------------------------------------------
  ocsZer0ServReboot(){ipcRenderer.send('ocs0ServReboot')}
//------------------------------------------------
  kodiQCFn(cmd:string,data?:any){
    this.cCons('kodiQCFn','('+cmd+','+(data?data:'')+')...');
    ipcRenderer.send('kodiQCFn',[cmd,data]);
  }
//------------------------------------------------
  kodiSeekSel(action:string,e:any,data?:any){
    this.cCons('kodiSeekSel','('+action+',data)...');
    switch(action){
      case 'me':
        this.kodiSeekLine.mouseIn=true;
        if(this.kodiSeekLine.outX===0){this.kodiSeekLine.outX=document.getElementById('kprogwrap').getBoundingClientRect().left};
        if(this.kodiSeekLine.outW===0){this.kodiSeekLine.outW=document.getElementById('kprogwrap').clientWidth};
        this.pDOM();
        break;
      case 'mm':
        if(this.kodiPlyrBarType!=='indeterminate'){
          let cursX:number=e.clientX-this.kodiSeekLine.outX;
          if(cursX<0){cursX=0};
          if(cursX>this.kodiSeekLine.outW){cursX=this.kodiSeekLine.outW};
          this.kodiSeekLine.left=cursX;
          const seekSecs:number=(this.kodiPlyr.pos.total*(cursX/this.kodiSeekLine.outW));
          this.kodiSeekLine.posV=new Date(seekSecs*1000).toISOString().slice(11,19);
          this.pDOM();
        };
        break;
      case 'ml':
        if(this.kodiPlyrBarType!=='indeterminate'){this.kodiSeekLine.mouseIn=false};
        break;
      case 'click':
        if(this.kodiPlyrBarType!=='indeterminate'){
          this.kodiPlyrBarType='indeterminate';
          const seek2Perc:number=Number(((this.kodiSeekLine.left/this.kodiSeekLine.outW)*100).toFixed(1));
          ipcRenderer.send('doKodiPlyrSeek',[seek2Perc]);
          this.pDOM();
        };
        break;
    };
  }
//-------------------------------------------------------------
  async kodiScrollStep(){
    if(!this.kFrame){window.cancelAnimationFrame(this.kFrameId)}
    else{
      this.kodiScrollCount++;
      if(this.kodiScrollCount%3===0){
        const kiDiv=document.getElementById('kodi-info-container');
        const kiWrap=document.getElementById('kodi-info-wrap');
        if(kiWrap.offsetWidth<kiDiv.offsetWidth){this.kodiScroll('stop')}
        else{
          if(this.kodiMaxScroll===0){this.kodiMaxScroll=kiWrap.offsetWidth-kiDiv.offsetWidth};
          let nowLeft:number=kiDiv.scrollLeft;
          if(((nowLeft+1)>this.kodiMaxScroll)||((nowLeft-1)<0)){this.kodiScrollDir==='up'?this.kodiScrollDir='back':this.kodiScrollDir='up'};
          let newLeft:number=0;
          if(this.kodiScrollDir==='up'){newLeft=(nowLeft+1)}else{newLeft=(nowLeft-1)};
          kiDiv.scrollLeft=newLeft;
        };
      };
      this.kFrameId=window.requestAnimationFrame(()=>this.kodiScrollStep());
    };
  }
//------------------------------------------------
  async kodiScroll(action:string):Promise<boolean>{
    if(!this.kodiInfoMD){
      if(action==='start'){if(!this.kodiInfoIsScroll){if(this.kodiScrollCount!==0){this.kodiScrollCount=0};this.kodiInfoIsScroll=true;if(!this.kFrame){this.kFrame=true};await this.doW(1);this.kodiScrollStep();return Promise.resolve(true)};
      }else{if(this.kodiInfoIsScroll){this.kFrame=false;this.kodiInfoIsScroll=false;this.kodiMaxScroll=0;this.kodiScrollCount=0;return Promise.resolve(true)}};
    };
  }
//------------------------------------------------
  async kodiInfoHandler(e:any){
    if(this.kodiInfoIsScroll){await this.kodiScroll('stop')};
    this.kodiInfoMD=true;
    this.kodiInfoDiv=document.getElementById('kodi-info-container');
    const mMove=(e:any)=>{const mx=e.clientX-this.kodiInfoPos.x;this.kodiInfoDiv.scrollLeft=this.kodiInfoPos.left-mx};
    const mUp=(e:any)=>{this.kodiInfoMD=false;document.removeEventListener('mousemove',mMove);document.removeEventListener('mouseup',mUp);this.kodiInfoDiv.style.cursor='grab';this.kodiInfoDiv.style.removeProperty('user-select')};
    this.kodiInfoPos={left:this.kodiInfoDiv.scrollLeft,top:this.kodiInfoDiv.scrollTop,x:e.clientX,y:e.clientY};
    this.kodiInfoDiv.style.cursor='grabbing';
    this.kodiInfoDiv.style.userSelect='none'
    document.addEventListener('mousemove',mMove);
    document.addEventListener('mouseup',mUp);
  }
//------------------------------------------------
  async kodiAction(action:string){ipcRenderer.send('kodiPlayerAction',[action])};
//------------------------------------------------
  async kodiUPPop(action:string,data?:any){
    if(action==='show'){
      this.kodiTestStatus={stage:<'inprog'|'result'>'inprog',msg:<string[]>[]};
      this.kodiTestingAuth=false;
      this.kodiUPInputShowing=true;this.pDOM();await this.doW(0.5);
      this.kodiHasAuth=data.auth;
      if(data.auth&&data.hasOwnProperty('up')){this.kodiUserInput.nativeElement.value=data.up.u;this.kodiPassInput.nativeElement.value=data.up.p;this.kodiUPInitUP=data}
      else{this.kodiUserInput.nativeElement.value='';this.kodiPassInput.nativeElement.value='';this.kodiUPInitUP=data};
    }else if(action==='result'){
      if(data==='cancel'){
        this.kodiUserInput.nativeElement.value='';this.kodiPassInput.nativeElement.value='';this.kodiUPInitUP=null;
        this.kodiUPInputShowing=false;
      }else{
        const clB=this.kodiClBtn.nativeElement;
        const credsChanged:boolean=(!_.isEqual(data,this.kodiUPInitUP));
        if(credsChanged){
          let nKA:any=data;if(!nKA.auth&&data.up.u.trim().length<1&&data.up.p.trim().length<1){delete nKA.up};
          this.kodiTestingAuth=true;
          const newKAHRes:{r:boolean,d?:any}=await ipcRenderer.invoke('updateKodiAH',[data]);
          this.kodiTestStatus={stage:'result',msg:newKAHRes.d};
          if(this.kodiTestStatus.msg[0]==='ok'){
            this.kodiAuthValid=true;
            clB.textContent='Close (3)';let cDNo:number=2;
            this.kodiCloseInt=setInterval(()=>{if(cDNo===0){this.kodiUPPop('close')}else{clB.textContent='Close ('+String(cDNo)+')';cDNo--}},1000);
          };
        }else{this.kodiUserInput.nativeElement.value='';this.kodiPassInput.nativeElement.value='';this.kodiUPInitUP=null;this.kodiUPInputShowing=false};
      };
    }else if(action==='toggle'){this.kodiHasAuth?this.kodiHasAuth=false:this.kodiHasAuth=true;this.pDOM()}
    else if(action==='close'){
      const clB=this.kodiClBtn.nativeElement;
      if(this.kodiCloseInt){clearInterval(this.kodiCloseInt)};
      clB.textContent='Close';
      this.kodiUserInput.nativeElement.value='';this.kodiPassInput.nativeElement.value='';this.kodiUPInitUP=null;
      this.kodiUPInputShowing=false;
    }else if(action==='tryagain'){
      this.kodiAuthValid=false;
      this.kodiUserInput.nativeElement.value='';this.kodiPassInput.nativeElement.value='';
      this.kodiTestingAuth=false;
      this.kodiTestStatus={stage:<'inprog'|'result'>'inprog',msg:<string[]>[]};
    }else if(action==='poke'){
      const uI=this.kodiUserInput.nativeElement,pI=this.kodiPassInput.nativeElement,okB=this.kodiOKBtn.nativeElement;
      if(this.kodiHasAuth){if(uI.value.length<1||pI.value.length<1){okB.disabled=true}else{okB.disabled=false};this.pDOM()};
    };
  }
//////////////////////////////////////////////////
// PIR SENSOR FUNCTIONS
//////////////////////////////////////////////////
  killPIRMotion(pirNo:number){
    this.cCons('killPIRMotion','('+String(pirNo)+')...');
    ipcRenderer.send('killPIRMotion',[pirNo]);
  }
//------------------------------------------------
  pirToggles(type:string){
    this.cCons('pirToggles','('+type+')...');
    this.wcData.pirStates[type]?this.wcData.pirStates[type]=false:this.wcData.pirStates[type]=true;this.pDOM();
    this.doSaveData();
    if(type==='power'){
      ipcRenderer.send('pirsOn',[this.wcData.pirStates.power]);
      if(!this.wcData.pirStates.power){
        for(let pi=0;pi<this.mdSensors.length;pi++){
          if(this.mdSensors[pi].online.to!==null){clearTimeout(this.mdSensors[pi].online.to);this.mdSensors[pi].online.to=null};
          if(this.mdSensors[pi].motion.to!==null){clearTimeout(this.mdSensors[pi].motion.to);this.mdSensors[pi].motion.to=null};
          this.mdSensors[pi].online.state=false;
          this.mdSensors[pi].motion.state=false;
          this.pDOM();
        }
      }else{
        for(let pi=0;pi<this.mdSensors.length;pi++){
          this.mdSensors[pi].online.state=true;
          this.mdSensors[pi].online.to=setTimeout(()=>{this.mdSensors[pi].online.state=false;this.mdSensors[pi].online.to=null;this.pDOM()},70000);
          this.pDOM();
        }
      }
    }
  }
///////////////////////////////////////////////////
// WEBCAM MOTION FUNCTIONS
///////////////////////////////////////////////////
  anyPirCtrl():boolean{return Object.values(this.pirMotionData).map((p:any)=>(p.ctrl)).some((b:boolean)=>b===true)};
//-------------------------------------------------
  playWCA(t:string,v:string){
    if(!t||!v){return};
    if(this.wcData.pirStates.sound){
      if(this.wbcmAudio[t][v].audio===null){
        this.wbcmAudio[t][v].audio=new Audio();
        this.wbcmAudio[t][v].audio.src=this.wbcmAudio[t][v].path;
        this.wbcmAudio[t][v].audio.load();
        this.wbcmAudio[t][v].audio.addEventListener('play',()=>{this.wbcmAudio[t][v].playing=true});
        this.wbcmAudio[t][v].audio.addEventListener('ended',()=>{this.wbcmAudio[t][v].playing=false});
        this.wbcmAudio[t][v].audio.addEventListener('pause',()=>{this.wbcmAudio[t][v].playing=false});
      }else{if(this.wbcmAudio[t][v].playing){this.wbcmAudio[t][v].audio.pause();this.wbcmAudio[t][v].audio.currentTime=0}};
      if(this.wcData.pirStates.sound&&(this.anyPirCtrl())){this.wbcmAudio[t][v].audio.play()};
    };
  }
//-------------------------------------------------
  async checkCam():Promise<boolean>{
    this.cCons('checkCam','()...');
    const listDevs:any=await navigator.mediaDevices.enumerateDevices(),matchCam:any[]=listDevs.filter(o=>o.label.includes('USB Video Device'));
    if(matchCam.length>0){this.camPlugged=true;this.pDOM();return Promise.resolve(true)}else{this.camPlugged=false;this.pDOM();return Promise.resolve(false)};
  }
//------------------------------------------------
  hideShowCamView(layer?:string){
    if(!layer){
      if(this.dCamViewShowing){this.dCamViewShowing=false}else{this.dCamViewShowing=true;this.dCamOpenWasManual=true}
    }else{this.dCamLayers[layer]?this.dCamLayers[layer]=false:this.dCamLayers[layer]=true};
  }
//------------------------------------------------
  toggleCamExpandOnMotion(e:MouseEvent){e.preventDefault();if(e.defaultPrevented){this.dCamExpandOnMotion?this.dCamExpandOnMotion=false:this.dCamExpandOnMotion=true;this.pDOM()}}
//------------------------------------------------
  prDiffy(action:'p'|'r'){
    this.cCons('prDiffy','('+action+')...');
    if(action==='p'){
      if(this.dLoopOn){this.diffStop()}
      else{this.cCons('prDiffy','SKIPPED: Already Paused')}
    }else if(action==='r'){
      if(!this.dLoopOn){this.diffStart()}
      else{this.cCons('prDiffy','SKIPPED: Already Running')}
    }else{this.cCons('prDiffy','ERROR: Unknown Action: "'+action+'"')}
  };
//------------------------------------------------
  async toggleDiffy(isInit?:boolean){
    this.cCons('togDiffy','()...');
    const doOn=async():Promise<boolean>=>{
      if(!this.dInitDone){await this.initDiffy()};
      this.dVid.play();
      this.diffStart();
      if(isInit){
        setTimeout(async()=>{
          this.doCamStill();
          await this.doW(1);
          this.camReady=true;
          setTimeout(()=>{if(this.dLoopOn&&!this.dCamMotion.isMotion){this.diffStop()}},15000);
        },2000);
      };
      return Promise.resolve(true);
    };
    const doOff=async():Promise<boolean>=>{
      this.doCamStill();
      if(this.moveTO!==null){clearTimeout(this.moveTO)};
      if(!this.dVid.paused){this.dVid.pause()};
      this.dStream.getTracks().forEach((track)=>{if(track.readyState==='live'){track.stop()}});
      this.diffStop();
      this.dCamViewShowing=false;
      this.dCamMotion.isMotion=false;
      this.dCamMotion.x=null;
      this.dCamMotion.y=null;
      this.pDOM();
      this.dCanDiff=false;
      this.dInitDone=false;
      this.camReady=false;
      return Promise.resolve(true);
    };
    if(!this.dLoopOn){await doOn()}else{await doOff()};
  }
//------------------------------------------------
  diffStart(){if(!this.diffFrame){this.diffFrame=true};this.dLoopOn=true;this.diffStep()}
//-------------------------------------------------------------
  diffStop(){this.diffFrame=false;this.dLoopOn=false}
//-------------------------------------------------------------
  async diffStep(){
    if(!this.diffFrame){window.cancelAnimationFrame(this.diffFrameId)}
    else{
      this.diffyCap();
      this.diffFrameId=window.requestAnimationFrame(()=>this.diffStep());
      this.throttledDLoop();
    }
  }
//-------------------------------------------------------------
  dCamUpdateMain(){ipcRenderer.send('webcamMotion',[this.dCamMotion.isMotion]);this.dCamMotion.isMotion?this.dMotionSCount++:this.dMotionSCount=0}
//-------------------------------------------------------------
  processDiff(diffImageData:ImageData):Promise<any> {
    let rgba:Uint8ClampedArray=diffImageData.data,score:number=0,motionBox;
    for(let i=0;i<rgba.length;i+=4){
      let pixelDiff=rgba[i]*0.3+rgba[i+1]*0.6+rgba[i+2]*0.1,normalized=Math.min(255,pixelDiff*(255/this.pixDiff));
      rgba[i]=255;rgba[i+1]=normalized;rgba[i+2]=0;
      if(pixelDiff>=this.pixDiff){
        score++;
        let coords=this.calculateCoordinates(i/4);
        motionBox=this.calculateMotionBox(motionBox,coords.x,coords.y);
      }else{rgba[i+3]=0};
    };
    return Promise.resolve({score:score,motionBox:motionBox});
  }
//------------------------------------------------
  calculateCoordinates(pixelIndex:number){return{x:pixelIndex%240,y:Math.floor(pixelIndex/240)}}
  calculateMotionBox(currentMotionBox:any,x:number,y:number){
    let motionBox=currentMotionBox||{x:{min:x,max:x},y:{min:y,max:y}};
    motionBox.x.min=Math.min(motionBox.x.min,x);
    motionBox.x.max=Math.max(motionBox.x.max,x);
    motionBox.y.min=Math.min(motionBox.y.min,y);
    motionBox.y.max=Math.max(motionBox.y.max,y);
    return motionBox;
  };
  getCaptureUrl(captureImageData:any){this.capCtx.putImageData(captureImageData,0,0);return this.capCanv.toDataURL()}
//------------------------------------------------
  async doCamStill(){
    this.dCamMotion.isMotion=false;
    this.dMotionPathTimes.et=new Date().getTime();
    this.dMotionPathTimes.tt=this.dMotionPathTimes.et-this.dMotionPathTimes.st;
    this.dMotionPathTimes.st=null;
    this.doCamGrid(this.dAvgPosHist);
    this.calcCOP();
    this.calcArea(false);
    this.pDOM();
    if(!this.moveTO&&this.dCamMotion.isMotion){this.dCamMotion.isMotion=false};
    if(this.dCamExpandOnMotion&&this.dCamViewShowing&&!this.dCamOpenWasManual){this.dCamViewShowing=false;this.pDOM()};
  }
//------------------------------------------------
  calcCOP(){
    let newDC:'p'|'c'|'u'|null=null;
    if(this.dAvgPosHist.length>10&&this.dMotionSCount>6){const avgH:number=this.dAvgPosHist.reduce((a,e)=>(a+e.y),0)/this.dAvgPosHist.length;if(avgH>120){newDC='c'}else{newDC='p'}}else{newDC='u'};if(this.dCOP!==newDC){this.dCOP=newDC;this.pDOM();this.playWCA('dcop',this.dCOP)};
  }
//------------------------------------------------
  calcArea(inProg?:boolean){
    let newDCA:string|null=this.dCamMotion.a;
    if(this.dAvgPosHist.length>10&&this.dMotionSCount>6){
      const lPosObj:any=this.dAvgPosHist[this.dAvgPosHist.length-1];
      if(lPosObj&&lPosObj.hasOwnProperty('x')&&lPosObj.x){
        if(lPosObj.x<40){newDCA='l'}
        else if(lPosObj.x>=40&&lPosObj<=180){newDCA='k'}
        else if(lPosObj.x>180){
          if(lPosObj.x<220){newDCA='t'}
          else{newDCA='b'}
        }
      }
    };
    if(this.dCamMotion.a!==newDCA){this.dCamMotion.a=newDCA;this.pDOM();this.playWCA('dca',this.dCamMotion.a)};
    if(!inProg){this.dAvgPosHist=[]};
  }
//------------------------------------------------
  async doCamMove(box:WCMBox){
    if(this.moveTO){clearTimeout(this.moveTO);this.moveTO=null};
    this.moveTO=setTimeout(()=>{this.doCamStill();this.moveTO=null},3000);
    this.dCamMotion.isMotion=true;
    if(this.dMotionPathTimes.st===null){this.dMotionPathTimes.st=new Date().getTime()};
    this.dCamMotion.x=box.x;
    this.dCamMotion.y=box.y;
    let avgX:number=Math.round(((box.x.min+box.x.max)/2));if(avgX<0){avgX=0};if(avgX>240){avgX=240};
    let avgY:number=Math.round(((box.y.min+box.y.max)/2));if(avgY<0){avgY=0};if(avgY>180){avgY=180};
    if(!_.isEqual(this.dAvgPos,{x:0,y:0,t:0})){this.dAvgPosHist.push(this.dAvgPos)};
    this.dAvgPos={x:avgX,y:avgY,t:(this.dMotionPathTimes.st-new Date().getTime())};
    this.calcCOP();
    this.calcArea(true);
    this.doCamGrid();
    if(this.dCamExpandOnMotion&&!this.dCamViewShowing){this.dCamViewShowing=true;this.dCamOpenWasManual=false;this.pDOM()};
  }
//------------------------------------------------
  doCamGrid(path?:any[]){
    this.gridCtx.clearRect(0,0,this.gridCanv.width,this.gridCanv.height);
    const gcSpacing:number=20,gcColor:string='#767676',gcOpacity:number=0.48,gcLabelColor:string='#fff',gcLabelFontSize:string='8px';
    this.gridCtx.strokeStyle=gcColor;
    this.gridCtx.globalAlpha=gcOpacity;
    this.gridCtx.font=`${gcLabelFontSize} sans-serif`;
    this.gridCtx.fillStyle=gcLabelColor;
    for(let vi=0;vi<=this.gridCanv.width;vi+=gcSpacing){
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(vi,0);
      this.gridCtx.lineTo(vi,this.gridCanv.height);
      this.gridCtx.stroke();
      if(vi>0){
        if(this.dCanDiff&&this.dCamMotion.isMotion&&this.dAvgPos.hasOwnProperty('x')&&this.dAvgPos.x&&this.dAvgPos.hasOwnProperty('y')&&this.dAvgPos.y&&this.dAvgPos.x>0&&this.dAvgPos.x<240&&this.dAvgPos.x===vi){
          this.gridCtx.fillStyle='#ffc800';
          this.gridCtx.globalAlpha=1;
          this.gridCtx.font='10px sans-serif';
          this.gridCtx.fillText(String(this.dAvgPos.x),this.dAvgPos.x+2,10);
          this.gridCtx.globalAlpha=gcOpacity;
          this.gridCtx.font=`${gcLabelFontSize} sans-serif`;
          this.gridCtx.fillStyle=gcLabelColor;
        }else{this.gridCtx.fillText(String(vi),vi+2,9)}
      };
    };
    for(let hi=0;hi<=this.gridCanv.height;hi+=gcSpacing){
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0,hi);
      this.gridCtx.lineTo(this.gridCanv.width,hi);
      this.gridCtx.stroke();
      if(hi>0){
        if(this.dCanDiff&&this.dCamMotion.isMotion&&this.dAvgPos.hasOwnProperty('x')&&this.dAvgPos.x&&this.dAvgPos.hasOwnProperty('y')&&this.dAvgPos.y&&this.dAvgPos.y>0&&this.dAvgPos.y<180&&this.dAvgPos.y===hi){
          this.gridCtx.fillStyle='#ffc800';
          this.gridCtx.globalAlpha=1;
          this.gridCtx.font='10px sans-serif';
          this.gridCtx.fillText(String(this.dAvgPos.y),1,this.dAvgPos.y-3);
          this.gridCtx.globalAlpha=gcOpacity;
          this.gridCtx.font=`${gcLabelFontSize} sans-serif`;
          this.gridCtx.fillStyle=gcLabelColor;
        }else{this.gridCtx.fillText(String(hi),1,hi-2)}
      };
    };
    if(this.dCanDiff&&this.dCamMotion.isMotion&&this.dAvgPos.hasOwnProperty('x')&&this.dAvgPos.x&&this.dAvgPos.hasOwnProperty('y')&&this.dAvgPos.y&&(this.dAvgPos.x>0||this.dAvgPos.y>0)){
      this.gridCtx.strokeStyle='#ffc800ad';
      this.gridCtx.fillStyle='#ffc800';
      this.gridCtx.globalAlpha=1;
      this.gridCtx.font='10px sans-serif';
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0,this.dAvgPos.y);
      this.gridCtx.lineTo(this.gridCanv.width,this.dAvgPos.y);
      this.gridCtx.stroke();
      if(this.dAvgPos.y>0&&this.dAvgPos.y<180&&this.dAvgPos.y%20!==0){this.gridCtx.fillText(String(this.dAvgPos.y),1,this.dAvgPos.y-2)};
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(this.dAvgPos.x,0);
      this.gridCtx.lineTo(this.dAvgPos.x,this.gridCanv.height);
      this.gridCtx.stroke();
      if(this.dAvgPos.x>0&&this.dAvgPos.x<240&&this.dAvgPos.x%20!==0){this.gridCtx.fillText(String(this.dAvgPos.x),this.dAvgPos.x+2,9)};
    };
    if(path&&path.length>2&&path[0].hasOwnProperty('x')&&path[0].x&&path[0].hasOwnProperty('y')&&path[0].y){
      this.gridCtx.globalAlpha=1;
      this.gridCtx.strokeStyle='red';
      this.gridCtx.lineWidth=1;
      this.gridCtx.fillStyle='white';
      this.gridCtx.font='10px sans-serif';
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(path[0].x,path[0].y);
      for(let coi=1;coi<path.length;coi++){this.gridCtx.lineTo(path[coi].x,path[coi].y)};this.gridCtx.stroke();
      let prevXYT:any={};
      for(let coi=0;coi<path.length;coi++){
        if(coi===0){this.gridCtx.fillText(String(coi),path[coi].x,path[coi].y);prevXYT=path[coi]}
        else{if(Math.abs(path[coi].x-prevXYT.x)>=12||Math.abs(path[coi].y-prevXYT.y)>=12){this.gridCtx.fillText(String(coi),path[coi].x,path[coi].y);prevXYT=path[coi]}}
      };
      this.gridCtx.fillStyle='#0072ff';
      let niceTT:string=(this.dMotionPathTimes.tt/1000).toFixed(2)+'s';
      this.gridCtx.fillText('TT: '+niceTT,(this.gridCanv.width/2)-20,this.gridCanv.height-10);
    }
  }
//------------------------------------------------
  async diffyCap(){
    this.capCtx.drawImage(this.dVid,0,0,240,180);
    this.diffCtx.globalCompositeOperation='difference';
    this.diffCtx.drawImage(this.dVid,0,0,240,180);
    let diffImgData:ImageData=this.diffCtx.getImageData(0,0,240,180);
    if(this.dCanDiff){
      let diff=await this.processDiff(diffImgData);
      this.motCtx.fillStyle='#00000000';
      this.motCtx.putImageData(diffImgData,0,0);
      if(diff.motionBox){
        this.motCtx.strokeStyle='#ff0000';
        this.motCtx.strokeRect(diff.motionBox.x.min+0.5,diff.motionBox.y.min+0.5,diff.motionBox.x.max-diff.motionBox.x.min,diff.motionBox.y.max-diff.motionBox.y.min);
        if(diff.score>=this.sThresh){this.doCamMove(diff.motionBox)};
      };
    };
    this.diffCtx.globalCompositeOperation='source-over';
    this.diffCtx.drawImage(this.dVid,0,0,240,180);
    this.dCanDiff=true;
  }
//------------------------------------------------
  async initDiffy(){
    this.cCons('initDiffy','()...');
    this.dCamId=(await navigator.mediaDevices.enumerateDevices()).filter(o=>o.label.includes('USB Video Device'))[0].deviceId;
    this.dStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:240,height:180,deviceId:this.dCamId}});
    this.dVid=this.diffyVideo.nativeElement;this.dVid.srcObject=this.dStream;
    this.capCanv=this.capCanvas.nativeElement;this.capCanv.width=240;this.capCanv.height=180;this.capCtx=this.capCanv.getContext('2d',{willReadFrequently:true});
    this.diffCanv=this.diffCanvas.nativeElement;this.diffCanv.width=240;this.diffCanv.height=180;this.diffCtx=this.diffCanv.getContext('2d',{willReadFrequently:true});
    this.motCanv=this.motCanvas.nativeElement;this.motCanv.width=240;this.motCanv.height=180;this.motCtx=this.motCanv.getContext('2d',{willReadFrequently:true});
    this.gridCanv=this.gridCanvas.nativeElement;this.gridCanv.width=240;this.gridCanv.height=180;this.gridCtx=this.gridCanv.getContext('2d',{willReadFrequently:true});
    this.doCamGrid();
    this.dInitDone=true;
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////
  async setAllWhiteLights(){
    let set:WCCUESetDeviceLED[]=[];
    for(let i=0;i<this.defSetDevList.length;i++){set.push({id:this.defSetDevList[i].id,colors:this.defSetDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:255,g:205,b:160,a:255}})})};
    await ipcRenderer.invoke('setAllWhiteLights',[set]);
    await this.doW(1);
    ipcRenderer.send('doUpdColors');
  };
//------------------------------------------------
  async doRefreshWLED(type:string):Promise<WLEDClientConfig|WLEDClientContext|WLEDClientEffects|WLEDClientInfo|WLEDClientPalettes|WLEDClientPresets|WLEDClientState|false>{
    this.cCons('doRefresWLED','('+type+')...');
    const refRes:any=await ipcRenderer.invoke('refreshWLED',[type]);
    return Promise.resolve(refRes);
  }
//------------------------------------------------
  isVRGBA(v:any):boolean{
    const reqPs:string[]=['r','g','b','a'];
    let hasPs:boolean[]=[];for(let pI=0;pI<reqPs.length;pI++){hasPs.push(v.hasOwnProperty(reqPs[pI]))};
    const hasAllPs:boolean=hasPs.every(b=>b),isBlank:boolean=(_.isEqual(v,{r:0,g:0,b:0,a:255})||_.isEqual(v,{r:0,g:0,b:0,a:0})||_.isEqual(v,{r:0,g:0,b:0,a:1}));
    if(hasAllPs&&!isBlank){return true}else{return false};
  };
//------------------------------------------------
  async doTest(){
    this.cCons('doTest','Test');
    await ipcRenderer.invoke('sendTest');
  };
//------------------------------------------------
  toggleSBIMI(){if(this.sbiMI){this.sbiMI=false;this.sbiTO=setTimeout(()=>{this.sbiShowing=false;this.sbiTO=null},2500)}else{this.sbiMI=true;clearTimeout(this.sbiTO);this.sbiTO=null;this.sbiShowing=true}};
//------------------------------------------------
  async cCons(fn:string,msg:any){
    const tStr:string=this.evServ.strFormat(new Date(),'HH:mm:ss.SS');
    let m:string=tStr+' - [HOME|'+fn+'] (Log): ';
    if(typeof msg==='string'){
      console.log(m+msg);
      if(this.sbiShowing){clearTimeout(this.sbiTO);this.sbiTO=null};
      this.sbiMsg=msg;
      if(!this.sbiShowing){this.sbiShowing=true;await this.doW(.25)};
      this.sbiTO=setTimeout(()=>{this.sbiShowing=false;this.sbiTO=null},5000);
    }else{console.log(m);console.log(msg)}};
//------------------------------------------------
  availCons(fn:string,msg:any){
    const tStr:string=this.evServ.strFormat(new Date(),'HH:mm:ss.SS');
    let m:string=tStr+' - [MAIN->HOME|'+fn+'] (Log): ';
    if(typeof msg==='string'){console.log(m+msg)}
    else{console.log(m);console.log(msg)}
  };
//------------------------------------------------
  pDOM(skip?:string){if(!skip){this.homeWrap.nativeElement.click()};this.changeDet.detectChanges()};
//------------------------------------------------
  doW(s:number):Promise<boolean>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
//------------------------------------------------
  sendAwaitFnDone(fnName:string){ipcRenderer.send('sendAwaitFnDone',[fnName])};
//------------------------------------------------
  capd(s:string):string{return s.charAt(0).toUpperCase()+s.slice(1)};
//-------------------------------------------------
  gRandC():RGBA{const rC=():number=>{return Math.floor(Math.random()*256)};const rRGBA=():RGBA=>{return {r:rC(),g:rC(),b:rC(),a:255}};return rRGBA()};
//-------------------------------------------------
  async bouncedSaveData():Promise<boolean>{if((await ipcRenderer.invoke('handleWriteData',[this.wcData]))){return Promise.resolve(true)}else{return Promise.resolve(false)}};
//------------------------------------------------
  async bouncedSliderRestart(o:string,v:number):Promise<boolean>{const fnStr:string=o.replace('Time','Anim');await this[fnStr]('stop');await this[fnStr]('start');return Promise.resolve(true)};
//------------------------------------------------
  async forceBlur(natStr:string):Promise<boolean>{
    const hasNE=(ele:any):boolean=>{if(ele){return true}else{return false}},neActive=(ele:any):boolean=>{if(document.activeElement===ele){return true}else{return false}},didBlur=():Promise<boolean>=>{return new Promise(async(resolve)=>{const nE:any=this[natStr].nativeElement,doBlurLoop=setInterval(()=>{if((hasNE(nE))){if((neActive(nE))){nE.blur()}else{clearInterval(doBlurLoop);resolve(true)}}},1000)})};await didBlur();return Promise.resolve(true);
  };
//------------------------------------------------
  async doSaveData():Promise<boolean>{
    if(!this.doSaveInProg){
      this.doSaveInProg=true;
      this.cCons('doSaveData','SAVING DATA...');
      await this.debouncedSaveData();
      this.doSaveInProg=false;
      return Promise.resolve(true)
    }else{return Promise.resolve(true)}
  };
//------------------------------------------------
  onOffLineListener(action:'add'|'remove'):Promise<boolean>{
    const updateOLStatus=async()=>{if(this.navOnline!==navigator.onLine){this.navOnline=navigator.onLine;this.netInfo=null;this.footerNetStatus=null;await this.doInvokeGetNetworkInfo(true)}};
    if(action==='add'){this.navOnline=navigator.onLine;window.addEventListener('offline',updateOLStatus);window.addEventListener('online',updateOLStatus);this.navOLListen=true}
    else{window.removeEventListener('offline',updateOLStatus);window.removeEventListener('online',updateOLStatus);this.navOLListen=false};
    return Promise.resolve(true);
  };
//------------------------------------------------
  doFooterNetStatus():Promise<boolean>{
    if(this.netInfo){
      console.log(this.netInfo);
      let newFootStat:FooterNetStatus={error:this.netInfo.info.error,ico:'assets/wc-home-footer-nonetwork-ico.png',label:'N/A'};
      if(this.netInfo.info.active){
        this.netInfo.info.type.includes('Ethernet')?newFootStat.ico='assets/wc-home-footer-wired-ico.png':newFootStat.ico='assets/wc-home-footer-wifi-ico.png';
        newFootStat.label=(this.netInfo.info.name==='Network'?'Zer0ne':this.netInfo.info.name);
      };
      this.footerNetStatus=newFootStat
    }else{this.footerNetStatus=null};
    this.pDOM();
    return Promise.resolve(true)
  };
//------------------------------------------------
  gChanDevName(n:number):string{const cDN:string[]=['Unknown','HD Fan','SP Fan','LL Fan','ML Fan','Strip','DAP','Pump','QL Fan','Water Block', '8-Led Fan'];return cDN[n]};
//------------------------------------------------
  gColStyle(o:any):string{return 'rgb('+String(o.r)+','+String(o.g)+','+String(o.b)+')'};
//------------------------------------------------
  async devTypeE2S(n:number):Promise<string>{let gs:string=await ipcRenderer.invoke('dType2Str',[n]);let s:string=gs.replace('CDT_',''),d:string='';for(let ci=0;ci<s.length;ci++){/[A-Z\W]/.test(s[ci])?d+=' '+s[ci]:d+=s[ci]};return Promise.resolve(d)};
//------------------------------------------------
  async devTypeIcos(n:number):Promise<string>{
    let gs:string=await ipcRenderer.invoke('dType2Str',[n]);
    let s:string=gs.replace('CDT_','');
    const dtIcosObj:any={Uknown:'assets/wc-device-group-unknown-ico.png',Mouse:'assets/wc-device-group-mouse-ico.png',Keyboard:'assets/wc-device-group-keyboard-ico.png',Headset:'assets/wc-device-group-headset-ico.png',Mousemat:'assets/wc-device-group-mousemat-ico.png',HeadsetStand:'assets/wc-device-group-headsetstand-ico.png',LedController:'assets/wc-device-group-commander-ico.png',LightingNode:'assets/wc-device-group-lightingnode-ico.png',MemoryModule:'assets/wc-device-group-memory-ico.png',Cooler:'assets/wc-device-group-cooler-ico.png',Motherboard:'assets/wc-device-group-motherboard-ico.png',GraphicsCard:'assets/wc-device-group-gpu-ico.png'};
    return Promise.resolve(dtIcosObj[s]);
  };
//------------------------------------------------
  wledTypeIcos(arch:string):string{if(arch.toLowerCase().includes('esp')){return 'assets/wc-device-group-esp8266-ico.png'}else{return 'assets/wc-device-group-rpi-ico.png'}};
//------------------------------------------------
  async doInvokeSDKErrAlert(){
    let title:string='CUE SDK Status: ';this.sdkStatus.session.code===6&&this.sdkStatus.error.code===0?title+='OK':title+='Error';
    let stat:string='• 𝗦𝗧𝗔𝗧𝗨𝗦: ';this.sdkStatus.session.code===6&&this.sdkStatus.error.code===0?stat+='OK - No Errors (Code 0)':stat+='Error - '+this.sdkStatus.error.msg+' (Code '+this.sdkStatus.error.code.toString()+')';
    let vers:string='\n• 𝗔𝗣𝗜/𝗩𝗘𝗥: ';this.sdkStatus.versions?vers+='Client '+String(this.sdkStatus.versions.clientVersion)+', Server '+String(this.sdkStatus.versions.serverVersion)+', Host '+String(this.sdkStatus.versions.serverHostVersion):vers+='Unknown';
    await ipcRenderer.invoke('doAlert',[(this.sdkStatus.session.code===6&&this.sdkStatus.error.code===0?'info':'error'),title,stat+'\n• 𝗦𝗘𝗦𝗦: '+this.sdkStatus.session.msg+' ('+this.sdkStatus.session.str+')'+vers])
  };
//------------------------------------------------
  async gotoNetworkMode(){await this.doInvokeGetNetworkInfo(false);if(this.networkMode){this.networkMode=false}else{if(this.settingsMode){this.settingsMode=false};this.networkMode=true}};
//------------------------------------------------
  isAuthClient(mac:string):string|false{if(this.netInfo&&this.grantsList!==null){let match:string|false=false;for(const[k,v]of Object.entries(this.grantsList)){if(v['mac']===mac){match=k}};return match}else{return false}};
//------------------------------------------------
  async doRefreshNetClients():Promise<boolean>{
    this.netClientsRefreshing=true;this.pDOM();
    const freshClRes:NetClients[]|false=await ipcRenderer.invoke('refreshNetClients');
    if(freshClRes){this.netInfo.clients=freshClRes};
    await this.doInvokeGetNetworkInfo(true);
    await this.doInvokeListGrantClients();
    await this.doInvokeListBanClients();
    this.netClientsRefreshing=false;this.pDOM();
    this.netClientsNewTime=true;
    this.netClientsTime=this.evServ.strFormat(new Date(),'d MMM @ h:mmaaa');
    this.netClientsNewTime=false;
    this.pDOM();
    return Promise.resolve(true);
  };
//------------------------------------------------
checkAuthName(clObj:NetClients):string{const mId:string|false=this.isAuthClient(clObj.mac);if(mId){return this.grantsList[mId].label}else{return clObj.name}};
//------------------------------------------------
  checkAuthDate(clObj:NetClients):string{const mId:string|false=this.isAuthClient(clObj.mac);if(mId){return (this.evServ.strFormat(new Date(this.grantsList[mId].date),'d MMM @ h:mmaaa'))}else{return clObj.name}};
//------------------------------------------------
  async doDeAuthClient(nClient:NetClients):Promise<boolean>{
    let matchCId:string|null=null;for(const[k,v]of Object.entries(this.grantsList)){if(v['mac']===nClient.mac){matchCId=k}};
    if(matchCId!==null){const dARes:boolean=await ipcRenderer.invoke('deauthClient',[matchCId]);if(dARes){return Promise.resolve(true)}else{return Promise.resolve(false)}}
    else{return Promise.resolve(false)};
  };
//------------------------------------------------
  async doBanClient(nClient:NetClients):Promise<boolean>{await ipcRenderer.invoke('addBanClient',[nClient.mac]);return Promise.resolve(true)};
//------------------------------------------------
  isBanClient(mac:string):boolean{if(this.banList.includes(mac)){return true}else{return false}};
//------------------------------------------------
  async doUnbanClient(nClient:NetClients):Promise<boolean>{await ipcRenderer.invoke('removeBanClient',[nClient.mac]);return Promise.resolve(true)};
//------------------------------------------------
  doSendWinCtrlBtn(action:string){ipcRenderer.send('doWinCtrlBtn',[action])};
//------------------------------------------------
  doWinSetBtn(action:string){this.winSet.trans?this.winSet.trans=false:this.winSet.trans=true;this.pDOM()};
//------------------------------------------------
  doSetOverlayIco(icoFName:string,labelTxt:string){ipcRenderer.send('setOverlayIco',[icoFName,labelTxt])};
//------------------------------------------------
  async doQuickSaveData():Promise<boolean>{await ipcRenderer.invoke('handleWriteData',[this.wcData]);return Promise.resolve(true)};
//------------------------------------------------
  async doAboutZer0ne(){this.pDOM();setTimeout(async()=>{this.pDOM();await ipcRenderer.invoke('doAlert',['info','About wifiCUE','wifiCUE v.0.0.1 (2022)\nby Zer0ne.dev\nhttps://zer0ne.dev\n'])},250)};
//------------------------------------------------
  async toggleSettings(){if(this.networkMode){this.networkMode=false};this.settingsMode?this.settingsMode=false:this.settingsMode=true};
//------------------------------------------------
  async toggleNetwork(){if(this.settingsMode){this.settingsMode=false};this.networkMode?this.networkMode=false:this.networkMode=true};
//------------------------------------------------
  async stopSyncs():Promise<boolean>{
    if(this.wcData.syncStates.audioSync){
      // Stop DTLFX Here...
    };
    if(this.wcData.syncStates.sshotSync){await this.sshotSyncAnim('stop','server')};
    return Promise.resolve(true);
  };
//------------------------------------------------
  cvtBytes(bs:number):string{
    const sizes:string[]=['Bytes','KB','MB','GB','TB'];
    if(bs===0){return 'N/A'};
    const i:number=(Math.floor(Math.log(bs)/Math.log(1024)));
    if(i===0){return bs+' '+sizes[i]};
    return (bs/Math.pow(1024,i)).toFixed(1)+sizes[i]
  };
//------------------------------------------------
  isSync():boolean{if(this.wcData.syncStates.audioSync||this.wcData.syncStates.sshotSync){return true}else{return false}};
//------------------------------------------------
  getRChimeSetInt():Promise<string>{return Promise.resolve(String(this.wcData.settings.timedFunctions.recurringChime.interval))};
//------------------------------------------------
  getASleepTime():Promise<string>{return Promise.resolve(this.wcData.settings.timedFunctions.autoSleepWake.sleep)};
//------------------------------------------------
  getAWakeTime():Promise<string>{return Promise.resolve(this.wcData.settings.timedFunctions.autoSleepWake.wake)};
//------------------------------------------------
  setASleepTime():Promise<Date|null>{const sT:Date=this.evServ.parseStr(this.wcData.settings.timedFunctions.autoSleepWake.sleep,'h:mma');return Promise.resolve(sT)};
//------------------------------------------------
  setAWakeTime():Promise<Date|null>{const wT:Date=this.evServ.parseStr(this.wcData.settings.timedFunctions.autoSleepWake.wake,'h:mma');return Promise.resolve(wT)};
//------------------------------------------------
  getFreshAnimTime(animValStr:string):number{return this.wcData.settings.syncAnimations[animValStr]};
  //------------------------------------------------
  async getMajorityColor():Promise<RGBA>{
    let selColors:any[]=[];
    for(let gi=0;gi<this.wcData.tree.length;gi++){const tG:CUETreeGroup=this.wcData.tree[gi];
      for(let di=0;di<tG.dtDevices.length;di++){const tD:CUETreeDevice=tG.dtDevices[di];
        if(this.wcData.treeStates.hasOwnProperty(tD.info.id)&&this.wcData.treeStates[tD.info.id]){const tC:any[]=tD.colors;
          if(selColors.length>0){selColors=selColors.concat(tC)}else{selColors=tC};
        };
      };
    };
    const rArr:number[]=_.map(selColors,'r'),rMost:number=Number(_.head(_(rArr).countBy().entries().maxBy(_.last)));
    const gArr:number[]=_.map(selColors,'g'),gMost:number=Number(_.head(_(gArr).countBy().entries().maxBy(_.last)));
    const bArr:number[]=_.map(selColors,'b'),bMost:number=Number(_.head(_(bArr).countBy().entries().maxBy(_.last)));
    return Promise.resolve({r:rMost,g:gMost,b:bMost,a:255});
  }
//-------------------------------------------------
  async getICUEDevMajCol(devID:string):Promise<RGBA>{
    let devColors:any[]=[];
    for(let gi=0;gi<this.wcData.tree.length;gi++){const tG:CUETreeGroup=this.wcData.tree[gi];
      for(let di=0;di<tG.dtDevices.length;di++){const tD:CUETreeDevice=tG.dtDevices[di];if(tD.info.id===devID){devColors=tD.colors}};
    };
    const rArr:number[]=_.map(devColors,'r'),rMost:number=Number(_.head(_(rArr).countBy().entries().maxBy(_.last)));
    const gArr:number[]=_.map(devColors,'g'),gMost:number=Number(_.head(_(gArr).countBy().entries().maxBy(_.last)));
    const bArr:number[]=_.map(devColors,'b'),bMost:number=Number(_.head(_(bArr).countBy().entries().maxBy(_.last)));
    return Promise.resolve({r:rMost,g:gMost,b:bMost,a:255});
  }
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
}
