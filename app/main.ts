import { CUEDevicesRaw, defWCData, NetInterface, NetClients, SDKStatus, SVRInfo, WCCClientDevice, WCCServerSnippet, WCGrantClient, WCData, NetworkInfo, WCBanClient, WCSyncStates, WCNotifToast, WCAuthClientInfo, WCCUEDeviceLEDColors, WCIOClient, WCIsIOClientResult, WCShowLEDPollTo, WCSAuthReqResponse, WCSResponse, RGBColor, RGBWColor, WCActiveWLEDS, WCCheckStat, WCMeDev, getWledNoteSegs, LFOnOffDevice, KActPlyr, KVolMute, twtAuthHTML, WCCUESetDeviceLED, WCMoreWin, WCWinSizePos, WCYTDLGetTermResult, WCYTDLData, getCUEErrorStatus, getCUESessionStatus, CUESS2Status, CUEDeviceRaw, CUEInfo, WCYTDLGetVidResult, WCYTDLMDPLItem, WCYTDLMDKodiPLDay, WCADBDeviceObj,KodiUplItem, WCMDDLCMDProg, WLEDAllClientCols, HWIInfo, SIInfo, defSIInfo, DebInfo, PhoneDSInfo, WCKodiPlyrInfo, WCMoreWinDeets, WCPrevMWData, WCWifingDumpDevs, WCWifingDumpAPDevs, WCWifingDumpCLDevs, WCWifingSaveData, defWifingSaveData, WCWifingMOPairs, WCWifingOUIObj, RPIInfo, WCNetDevs } from './appTypes';
import { app, BrowserWindow, screen, Size, BrowserWindowConstructorOptions, Menu, ipcMain, Tray, dialog, globalShortcut, MessageBoxOptions, nativeImage, NativeImage, Notification, MenuItem, shell, session } from 'electron';
import { access, stat, readFile, writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { format, fromUnixTime, getTime, getUnixTime, isValid, parse, subDays } from 'date-fns';
import { Server, Socket } from 'socket.io';
import { createHttpTerminator } from 'http-terminator';
import Bonjour from 'bonjour-service';
import { WLEDClient,WLEDClientSegment,WLEDClientState} from 'wled-client';
import * as contextMenu from 'electron-context-menu';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as sdk from 'cue-sdk';
import * as find from 'local-devices';
import * as http from 'http';
import * as crypto from 'crypto';
import axios,{AxiosRequestConfig, AxiosResponse} from 'axios';
import {WebSocket} from 'ws';
import {execFile,spawn} from 'child_process';
import {ColorTranslator} from 'colortranslator';
import * as https from 'https';
import * as url from 'url';
import * as childProcess from 'child_process';
import { randomST } from '../src/appTypes';
import { exec } from 'child_process';
import * as si from 'systeminformation';
import * as mdb from 'mongodb';
import * as mqtt from 'mqtt';
//////////////////////////////////////////////////
// GLOBAL VARS
//////////////////////////////////////////////////
let termAppInProg:boolean=false;
let noteLightsInProg:boolean=false;
let chimeLightsInProg:boolean=false;
let devNSDInt:any;
let devNSDActive:boolean=false;
let lastNDs:WCNetDevs[]=[];
let meD:WCMeDev={ip:'192.168.0.69',mac:'a44bd5c9eb60'};
let hwiINT:any;
let rssiINT:any;
// WLED ------------------------------------------
let wledIPs:string[]=[
  '192.168.0.101', // } --- GROUP 1
  '192.168.0.102', // }
  '192.168.0.103', // }
  '192.168.0.104', // } --- GROUP 2
  '192.168.0.105', // }
  '192.168.0.106', // } --- GROUP 3
  '192.168.0.107', // }
  '192.168.0.108', // }
  '192.168.0.109', // }
  '192.168.0.110', // } --- Group 4
  '192.168.0.131'  // }
];
let wledGrpLeads:string[]=['Zer0WLED1','Zer0WLED4','Zer0WLED6','Zer0WLED10'];
let wledGrpMembrs:{[key:string]:string[]}={
  1:['Zer0WLED1','Zer0WLED2','Zer0WLED3'],
  2:['Zer0WLED4','Zer0WLED5'],
  3:['Zer0WLED6','Zer0WLED7','Zer0WLED8','Zer0WLED9'],
  4:['Zer0WLED10','Zer0WLEDMatrix']
};
let ws2815WLEDIPs:string[]=[
  '192.168.0.106',
  '192.168.0.107',
  '192.168.0.108',
  '192.168.0.109',
  '192.168.0.131'
];
let sk6812WLEDIPs:string[]=[
  '192.168.0.101',
  '192.168.0.102',
  '192.168.0.103',
  '192.168.0.104',
  '192.168.0.105',
  '192.168.0.110'
];
let z1bESP32IPs:any={
  touch:{
    left:'192.168.0.111', // c8:2e:18:16:d7:10 | HubPort 1 | COM12
    right:'192.168.0.112' // e4:65:b8:ae:21:30 | HubPort 5 | COM35
  },
  round:{
    left1:'192.168.0.113', // e8:6b:ea:d0:e8:c4 | HubPort 3 | COM33
    left2:'192.168.0.114', // c8:2e:18:16:bb:58 | HubPort 2 | COM34
    right1:'192.168.0.115', // e4:65:b8:77:66:04 | HubPort 6 | COM37
    right2:'192.168.0.116' // e4:65:b8:77:6f:04 | HubPort 7 | COM36
  }
};
let wleds:any[]=[];
let willDoDelayedWLEDInit:boolean=false;
let wledGroupSyncOn:boolean=true;
let dtlfxIsLive:boolean=false;
// SOCKET ----------------------------------------
let mSensorIPs:string[]=['192.168.0.201','192.168.0.202','192.168.0.203'];
// SOCKET ----------------------------------------
let io:Server;
let ioUp:boolean=false;
let ioClients:WCIOClient[]=[];
// MOTIONSRV -------------------------------------
let mdSVR:http.Server|null=null;
let mdSVRKill:any|null=null;
// MAIN INVOKE -----------------------------------
let awaitFnsInProg:string[]=[];
// ENVMODE ---------------------------------------
let wcMode:'dev'|'prod'='dev';
// NETWORK ---------------------------------------
let netInfo:NetworkInfo|null=null;
let netInterface:NetInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
let netClients:NetClients[]=[];
// WCSERVER --------------------------------------
let isListen:boolean|null=true;
let syncStates:WCSyncStates={audioSync:false,sshotSync:false};
let isSleep:boolean=false;
let lastWakeSleep:Date|null=null;
// WINDOW ----------------------------------------
let wcWindowOpts:BrowserWindowConstructorOptions={x:0,y:0,width:300,height:600,minWidth:280,minHeight:48,title:'wifiCUE',darkTheme:true,frame:false,transparent:true,icon:path.join(__dirname,'../dist/assets/icons/large-wcicon.png'),webPreferences:{nodeIntegration:true,nodeIntegrationInWorker:true,nodeIntegrationInSubFrames:true,webSecurity:false,allowRunningInsecureContent:true,webgl:true,plugins:true,backgroundThrottling:false,sandbox:false,contextIsolation:false,spellcheck:false,defaultFontFamily:{sansSerif:'Arial'},defaultFontSize:14}};
let wcWindow:BrowserWindow|null=null;
// DEVTOOLS --------------------------------------
let wcDevTools:BrowserWindow|null=null;
// CONTEXT MENU ----------------------------------
let cmOpts:object|null=null;
let childWCMIsOpen:boolean=false;
let cmContextStr:string='';
// TRAY ------------------------------------------
let wcTray:Tray|null=null;
let wcTrayUpdating:boolean=false;
let wcTrayContextMenu:Menu|null=null;
// CUE SDK ---------------------------------------
let cueSDKStatus:SDKStatus|null=null;
let ledPollInt:any;
let isPollingLED:boolean=false;
let showLEDPollTo:WCShowLEDPollTo={server:true,client:true};
let sshotPollInt:any;
let setCUEDefDevList:WCCUESetDeviceLED[]|null=null;
// PREFS/PROFILES/PATHS --------------------------
const wcSSFileDir:string=path.join(app.getPath('documents'),'wifiCUE');
const wcBFile:string=path.join(app.getPath('documents'),'wifiCUE/.bans');
const wcGFile:string=path.join(app.getPath('documents'),'wifiCUE/.grants');
const wcDataDirPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata');
const wcDataFilePath:string=path.join(wcDataDirPath,'wcdata.json');
let wcData:WCData|null=null;
let wcDataRWInProg:boolean=false;
let lastImgPath:string|null=null;
// XPSERVER --------------------------------------
let svrUUID:string|null=null;
let svrDidStart:Date;
let svrListening:boolean|null=null;
let svrSVR:http.Server|null=null;
let svrSVRKill:any|null=null;
let svrInfo:SVRInfo={ip:'127.0.0.1',port:6969};
let wcBonInst:Bonjour;
let wcBonSvr:any;
let wcBonIsUp:boolean=false;
// SHORTCUTS -------------------------------------
let scsActive:boolean=false;
// KODI ------------------------------------------
let hasKodi:boolean=false;
let kodiBURL:string;
let kodiAH:any;
let kodiOnlineINT:ReturnType<typeof setInterval>;
let promptKUPs:boolean=false;
let kodiServerIP:string='';
let kodiServiceRunning:boolean=false;
let kodiThemeOpts:any[]=[];
let lastKodiThemeCol:number[]=[];
let kodiPlyr:WCKodiPlyrInfo={item:null,status:'stopped',pos:{total:0,time:0,perc:0}};
let kodiActivePlyrs:KActPlyr[]=[];
let kodiVMInProg:boolean=false;
let kodiVolMute:KVolMute={muted:false,volume:50};
let kodiPosINT:any=null;
let kodiVolTO:any=null;
let kodiPosLooping:boolean=false;
let kodiWLEDState:string|null=null;
let kodiPrevMuteCols:any[]=[];
let kodiPrevVolCols:any[]=[];
// MORE WINS -------------------------------------
let moreWins:BrowserWindow[]=[];
let moreWinDeets:WCMoreWinDeets[]=[];
let moreDevTools:BrowserWindow[]=[];
let defMoreWinOpts:BrowserWindowConstructorOptions={x:0,y:0,width:300,height:240,minWidth:280,minHeight:48,title:'',darkTheme:true,frame:false,transparent:true,icon:path.join(__dirname,'../dist/assets/icons/large-wcicon.png'),resizable:true,webPreferences:{nodeIntegration:true,nodeIntegrationInWorker:true,nodeIntegrationInSubFrames:true,webSecurity:false,allowRunningInsecureContent:true,webgl:true,plugins:true,backgroundThrottling:false,sandbox:false,contextIsolation:false,spellcheck:false,defaultFontFamily:{sansSerif:'Arial'},defaultFontSize:14}};
let mwCMs:{name:string,index:number,opts:any,isOpen:boolean,ctx:string}[]=[];
// CHILD WINDOW ----------------------------------
let childW:BrowserWindow|null=null;
let childDevTools:any;
let childWindowOpts:BrowserWindowConstructorOptions={x:0,y:0,width:300,height:542,minWidth:280,minHeight:48,title:'Twitch',darkTheme:true,frame:false,transparent:true,icon:path.join(__dirname,'../dist/assets/icons/large-wcicon.png'),resizable:false,webPreferences:{nodeIntegration:true,nodeIntegrationInWorker:true,nodeIntegrationInSubFrames:true,webSecurity:false,allowRunningInsecureContent:true,webgl:true,plugins:true,backgroundThrottling:false,sandbox:false,contextIsolation:false,spellcheck:false,defaultFontFamily:{sansSerif:'Arial'},defaultFontSize:14}};
// TWITCH ----------------------------------------
let twtAuth:any={cbUrl:'http://localhost:3333',username:'zer0ne33',code:'',token:'',refresh:'',expires:0,client:'cdbusdlezzt8yiysbv39s2zik3fyd0',secret:'z1u5ccpp46i7ec3gavdb4k5snelr3a'};
let twtScopesEnc:string='user%3Aread%3Afollows+user%3Amanage%3Achat_color+user%3Aread%3Aemail+user%3Aread%3Asubscriptions+user%3Amanage%3Awhispers+user%3Aedit+chat%3Aread+chat%3Aedit+bits%3Aread+whispers%3Aread+whispers%3Aedit+channel%3Amoderate+channel%3Aread%3Aeditors+channel%3Aread%3Agoals+channel%3Aread%3Ahype_train+channel%3Aread%3Apolls+channel%3Aread%3Apredictions+channel%3Aread%3Aredemptions+channel%3Aread%3Asubscriptions';
const twtId:string='139738358';
let twtIsAuth:boolean=false;
let twtUser:any=null;
let twtFollowing:any[]=[];
let twtLives:null|any[]=null;
let twtLivesRefreshINT:any=null;
let twtWSC:any;
let twtEvWSC:any;
let twtEventsConn:boolean=false;
let twtEventsSession:any=null;
let twtChatConn:boolean=false;
let twtEvSubs:any[]=[];
let chatConn:any;
let eventsConn:any;
let twtDiscoHandlerOn:any;
let twtCommandListenerOn:any;
// FFMPEG ----------------------------------------
let ffPaths:any={ffmpeg:null,ffplay:null,ffprobe:null};
// FIND TUNE -------------------------------------
let ftMP3Path:string='C:\\ffmpeg\\recs\\a.mp3';
let ftRAWPath:string='C:\\ffmpeg\\recs\\a.raw';
let ftFFMPath:string='C:\\ffmpeg\\ffmpeg\\ffmpeg.exe';
let ftAPIUrl:string='https://shazam.p.rapidapi.com/songs/v2/detect';
let ftReqOpts:any={headers:{'Content-Type':'text/plain','X-RapidAPI-Key':'124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52','X-RapidAPI-Host':'shazam.p.rapidapi.com'}};
// FIND BPM --------------------------------------
let fbMP3Path:string='C:\\ffmpeg\\recs\\b.mp3';
let fbFFMPath:string='C:\\ffmpeg\\ffmpeg\\ffmpeg.exe';
let fbBPMExePath:string='C:\\ffmpeg\\recs\\bpm.exe';
let fbInProg:boolean=false;
let tempC:number=0;
// WIFING ------------------------------------------
let wingData:any=null;
// YTDL ------------------------------------------
let ytdlData:any=null;
let trendTwitterAPIUrl:string='https://twitter-pack.p.rapidapi.com/trend';
let trendTwitterReqOpts:any={headers:{'Content-Type':'text/plain','X-RapidAPI-Key':'124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52','X-RapidAPI-Host':'twitter-pack.p.rapidapi.com'},params:{woeid:23424977}};
let trendYTAPIUrl:string='https://youtube-trending.p.rapidapi.com/trending';
let trendYTReqOpts:any={headers:{'Content-Type':'text/plain','X-RapidAPI-Key':'124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52','X-RapidAPI-Host':'youtube-trending.p.rapidapi.com'},params:{country:'US'}};
// ADB CONNECT -----------------------------------
let adbTrackerInst:any;
let adbActiveDevs:WCADBDeviceObj[]=[];
// WLED SYNC GROUPS ------------------------------
const onUDPs:any={
  Zer0WLED1:{send:true,recv:true,sgrp:1,rgrp:1},
  Zer0WLED2:{send:false,recv:true,sgrp:0,rgrp:1},
  Zer0WLED3:{send:false,recv:true,sgrp:0,rgrp:1},
  Zer0WLED4:{send:true,recv:true,sgrp:2,rgrp:2},
  Zer0WLED5:{send:false,recv:true,sgrp:0,rgrp:2},
  Zer0WLED6:{send:true,recv:true,sgrp:3,rgrp:3},
  Zer0WLED7:{send:false,recv:true,sgrp:0,rgrp:3},
  Zer0WLED8:{send:false,recv:true,sgrp:0,rgrp:3},
  Zer0WLED9:{send:false,recv:true,sgrp:0,rgrp:3},
  Zer0WLED10:{send:true,recv:true,sgrp:4,rgrp:4},
  Zer0WLEDMatrix:{send:false,recv:true,sgrp:0,rgrp:4}
};
const offUDP:any={send:false,recv:false,sgrp:0,rgrp:0};
// PIR SENSORS/MOTION ----------------------------
let webcamMotion:boolean=false;
let pirWLEDIndexes:any={};
let pirsPower:boolean=true;
let pirsOnline:any={1:false,2:false,3:false};
const pir2WLEDMap={1:[4,5],2:[1],3:[1,2,3,4,5]};
const pir2WLEDMapSync={1:[4],2:[1],3:[1,4]};
const pirCtrlLastsS:any={1:60,2:10,3:3};
const pirMinCount:any={1:3,2:1,3:1};
const pirCountMaxTimeS:any={1:6,2:6,3:3};
let pirSTimes:any={1:0,2:0,3:0};
let pirTCounts:any={1:0,2:0,3:0};
let pirWLEDInProg:any={1:false,2:false,3:false};
let pirCountTO:any={1:null,2:null,3:null};
let pirCountSecsINT:any={1:{secs:pirCountMaxTimeS[1],int:null},2:{secs:pirCountMaxTimeS[2],int:null},3:{secs:pirCountMaxTimeS[3],int:null}};
let pirWLEDTO:any={1:null,2:null,3:null};
let pirWLEDSecsINT:any={1:{secs:pirCtrlLastsS[1],int:null},2:{secs:pirCtrlLastsS[2],int:null},3:{secs:pirCtrlLastsS[3],int:null}};
const getAddSecs=(pirNo:number):number=>{return pirWLEDSecsINT[pirNo].secs};
let pir3PrevColor:RGBColor|RGBWColor=[0,0,0,255];
let pir3PrevBri:number=204;
let pir2PrevColor:RGBColor|RGBWColor=[0,0,0,255];
let pir2PrevBri:number=204;
// Z1BOX VARIABLES --------------------------------
let z1bMQTTClient:mqtt.MqttClient|null=null;
let z1bMQTTOnline:boolean=false;
let z1bCurrentScreen:string|null=null;
let z1bConfigName:any=null;
const z1bSDataDir:string=path.join(app.getPath('documents'),'z1Box');
const z1bSDataFile:string=path.join(app.getPath('documents'),'z1Box/z1BoxSavedSettings.json');
let z1bSData:any=null;
let z1bIsOnline:boolean=false;
let z1bSVR:any;
let killZ1BSVR:any;
let z1bHWInfo:HWIInfo|false=false;
let z1bColor:number[]=[127,127,127];
let z1bFSInfo:si.Systeminformation.FsSizeData[]=[];
let z1bNETInfo:si.Systeminformation.NetworkStatsData[]=[];
let z1bWeatherObj:any|null=null;
let z1bAudioEVListen=false;
let z1bSRCVal:any = null;
let z1bVolVal:any = null;
let z1bMuteVal:any = null;
let z1TimeINT:any=null;
let z1WeatherINT:any=null;
let z1bSendVizInfo:boolean=false;
//////////////////////////////////////////////////
// UTILITY FNS
//////////////////////////////////////////////////
ipcMain.handle('getPIRMaxTOS',(e:any,args:any[]):Promise<number>=>{return Promise.resolve(pirCountMaxTimeS[args[0]])});
const mainEvCons=(evSource:'a'|'w'|'d',evName:string,evOb?:any)=>{let sTxt:string='';if(evSource==='a'){sTxt='App'}else if(evSource==='w'){sTxt='Window'}else{sTxt='DevTools'};const tStr:string=format(new Date(),'HH:mm:ss.SS');console.log(tStr+' - [MAIN|'+sTxt+'] (Event): '+evName.toUpperCase());if(evOb){console.dir(evOb,{depth:100})}};
//-------------------------------------------------
const anyPirInProg=():boolean=>{return Object.values(pirWLEDInProg).some((ip:boolean)=>(ip))};
//-------------------------------------------------
const availCons=async(fnName:string,msg:any)=>{
  if(termAppInProg){return};
  try{
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('sendAvailCons',[fnName,msg])}
    else{
      const tStr:string=format(new Date(),'HH:mm:ss.SS');
      let m:string=tStr+' - [MAIN|'+fnName+'] (Log): ';
      if(typeof msg==='string'){console.log(m+msg)}
      else{console.log(m);console.dir(msg,{depth:null})}
    }
  }catch(e){}
};
//-------------------------------------------------
const exists=async(path:string):Promise<boolean>=>{try{await access(path);return true}catch{return false}};
//-------------------------------------------------
const doW=async(s:number):Promise<boolean>=>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
//-------------------------------------------------
const capd=(s:string):string=>{return s.charAt(0).toUpperCase()+s.slice(1)};
//-------------------------------------------------
const statSize=async(path:string):Promise<{r:boolean,d:number}>=>{try{const sRes:any=await stat(path);if(sRes&&sRes.size>0){return Promise.resolve({r:true,d:sRes.size})}else{return Promise.resolve({r:false,d:0})}}catch(e){return Promise.resolve({r:false,d:0})}};
//-------------------------------------------------
const readDataFile=async():Promise<WCData|false>=>{try{const rR:string=await readFile(wcDataFilePath,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){wcData=JSON.parse(rR);availCons('readDataFile','Data File [READ] - OK');return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}};
//-------------------------------------------------
const writeDataFile=async(data:any):Promise<boolean>=>{let updData:any=data;updData.lastUpdate=getUnixTime(new Date());const updDataStr:string=JSON.stringify(data);try{await writeFile(wcDataFilePath,updDataStr,{encoding:'utf-8'});availCons('writeDataFile','Data File [WRITE] - OK');await readDataFile();return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
//-------------------------------------------------
const isNetEnabled=async():Promise<boolean>=>{if(!netInterface.error&&netInterface.active&&netInterface.name.trim().length>0&&netInterface.type.trim().length>0){return true}else{const gNIRes:NetworkInfo=await getNetInfo();if(gNIRes.info.name===''||gNIRes.info.type===''){return Promise.resolve(false)}else{return Promise.resolve(true)}}};
//-------------------------------------------------
const listenONOFFStr=():string=>{if(wcData.isListen===null){return 'Loading... (-)'}else{if(wcData.isListen===true){return 'Listening (ON)'}else{return 'Listening (OFF)'}}};
//-------------------------------------------------
const icoP=(p:string):string=>{const iP:string=path.join(__dirname,'../dist/'+p);return iP};
//-------------------------------------------------
const natIco=(pngFileName:string)=>{return (nativeImage.createFromPath((icoP('assets/'+pngFileName))))};
//-------------------------------------------------
const isVJ=(d:any):Promise<boolean>=>{try{JSON.parse(d);return Promise.resolve(true)}catch(e){return Promise.resolve(false)}};
//-------------------------------------------------
const isJSON=(data:any):Promise<boolean>=>{if(typeof data!=='string'){return Promise.resolve(false)};try{const result=JSON.parse(data);const type=Object.prototype.toString.call(result);return Promise.resolve(type==='[object Object]'||type==='[object Array]');}catch(err){return Promise.resolve(false)}};
//-------------------------------------------------
const s2T=(secs:number):string=>{let fStr:string='',tH:string|null,tM:string|null,tS:string|null,hours:number=Math.floor(secs/3600),mins:number=0;if(hours>=1){tH=String(hours);secs=secs-(hours*3600)}else{tH=null};mins=Math.floor(secs/60);if(mins>=1){tM=String(mins);secs=secs-(mins*60)}else{tM=null};if(secs<1){tS=null}else{tS=String(secs)};(tH&&tM&&tM.length===1)?tM='0'+tM:void 0;(tS&&tS.length===1)?tS='0'+tS:void 0;if(tH){fStr+=tH;tM=':'+tM};if(tM){fStr+=tM;tS=':'+tS}else{fStr+='00:'};if(tS){fStr+=tS};if(fStr.includes(':null')){const rX:RegExp=/:null/gi;fStr=fStr.replace(rX,':00')};if(fStr===''){fStr='-'};if(fStr===':00'){fStr='-'};return fStr};
//------------------------------------------------
async function reqDTLFX(method:'get'|'post',data:any):Promise<{r:boolean,d?:any}>{
  availCons('reqDTLFX','('+method+',data)...');
  try{
    let defReqOpts:AxiosRequestConfig={url:'http://192,168.0.3:9696',method:method,timeout:3000};
    if(method==='get'){defReqOpts['headers']={dtlfxtoken:'*******',dtlfxfrom:'wificue',wificue:data};defReqOpts['responseType']='json'}
    else{defReqOpts['headers']={dtlfxtoken:'*******',dtlfxfrom:'wificue',wificue:'post'};defReqOpts['data']=JSON.stringify(data);defReqOpts['responseType']='json'};
    const reqRes:AxiosResponse=await axios.request(defReqOpts);
    if(reqRes.status!==200){availCons('reqDTLFX','ERROR: '+reqRes.status)};
    return Promise.resolve(reqRes.data);
  }catch(e){return Promise.resolve({r:false,d:null})}
}
//------------------------------------------------
const invokeAwaitFn=(fnName:string,data?:any):Promise<boolean>=>{
  return new Promise((resolve)=>{
    if(!awaitFnsInProg.includes(fnName)){
      awaitFnsInProg.push(fnName);
      const awaitFnLoop=setInterval(()=>{
        if(!awaitFnsInProg.includes(fnName)){
          clearInterval(awaitFnLoop);
          resolve(true);
        };
      },250);
      let iAFParamsArr:any[]=[fnName];
      if(data){iAFParamsArr.push(data)};
      wcWindow.webContents.send('invokeAwaitFn',iAFParamsArr);
    }else{resolve(false)};
  });
};
//------------------------------------------------
ipcMain.on('openExtWebURL',(e:any,args:any[])=>{
  shell.openExternal(args[0])
});
//------------------------------------------------
async function awaitMWQuickSaves():Promise<boolean>{
  let qsResCount:number=0,mwTryCount:number=moreWinDeets.length,qsINT:any,qsTO:number=10,qsC:number=0;
  return new Promise((resolve)=>{
    qsINT=setInterval(()=>{qsC++;if(qsC<qsTO){if(qsResCount>=mwTryCount){console.log('awaitMWQuickSaves - FINISHED OK!');resolve(true)}}else{console.log('awaitMWQuickSaves - !TIMEOUT!');clearInterval(qsINT);resolve(false)}},200);
    ipcMain.on('mwQuickSaveDone',()=>{qsResCount++});
    for(let mwdi=0;mwdi<moreWinDeets.length;mwdi++){try{if(moreWins[mwdi]&&moreWins[mwdi].webContents){moreWins[mwdi].webContents.send('mwQuickSave')}}catch(e){qsResCount++}};
  });
}
//////////////////////////////////////////////////
// ELECTRON MAIN FUNCTION
//////////////////////////////////////////////////
try{
  app.disableHardwareAcceleration();
  app.once('ready',()=>{
    session.defaultSession.webRequest.onBeforeRequest({urls:['https://embed.twitch.tv/*channel=*']},(d,cb)=>{
      let redirectURL=d.url,params=new URLSearchParams(redirectURL.replace('https://embed.twitch.tv/',''));
      if(params.get('parent')!=''){cb({});return};
      params.set('parent','locahost');
      params.set('referrer','https://localhost/');
      redirectURL='https://embed.twitch.tv/?'+params.toString();
      cb({cancel:false,redirectURL});
    });
    session.defaultSession.webRequest.onHeadersReceived({urls:['https://www.twitch.tv/*','https://player.twitch.tv/*','https://embed.twitch.tv/*']},(d,cb)=>{
      let responseHeaders=d.responseHeaders;
      delete responseHeaders['Content-Security-Policy'];
      cb({cancel:false,responseHeaders});
    });
    initApp();
    scs(true);
  });
  if(process.platform==='win32'){app.on('ready',()=>{app.setAppUserModelId('dev.zer0ne.wificue')})};
  app.on('browser-window-focus',()=>{scs(true);checkRealVis();mainEvCons('a','browser-window-focus')});
  app.on('browser-window-blur',()=>{checkRealVis();mainEvCons('a','browser-window-blur')});
  app.on('web-contents-created',()=>{mainEvCons('a','web-contents-created')});
  app.on('window-all-closed',()=>{mainEvCons('a','window-all-closed');app.quit()});
  app.on('before-quit',async(e)=>{
    try{
      termAppInProg=true;
      e.preventDefault();
      await invokeAwaitFn('doQuickSaveData');
      const xConf:boolean=await closeConf();
      if(xConf){
        await awaitMWQuickSaves();
        if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('quickKillKeyPadListener')};
        if(io){io.emit('serverStatus',[{id:svrUUID,hostname:netInfo.info.pc,ip:svrInfo.ip,online:false,time:new Date()}])}
        app.exit();
      }else{return};
    }catch(e){e=e};
  });
  app.on('quit',()=>{return});
  app.on('will-quit',()=>{app.exit()});
}catch(e){availCons('baseInit','ERROR: '+e)};
//////////////////////////////////////////////////
// MAIN START/INIT FUNCTIONS
//////////////////////////////////////////////////
async function initApp(){
  // IMMEDIATE
  reqDTLFX('get','started');
  await initData();
  await getNetInfo();
  await initSocket();
  await initCUESDK();
  await initWLED();
  await z1bOnline();
  const kIRes:{kodi:boolean,auth:boolean}=await initKodiAPI();
  if(kIRes.kodi){hasKodi=true;if(!kIRes.auth){promptKUPs=true}else{startKodiService()}};
  if(!wcWindow){
    ipcMain.once('homeInitsDone',async()=>{delayedInits()});
    await initWindow();
  };
  if(!wcDevTools&&wcMode==='dev'){await initDevTools()};
  if(!wcTray){await initTray()};
  if(!cmOpts){await cmBuild();contextMenu(cmOpts)}else{contextMenu(cmOpts)};
}
//////////////////////////////////////////////////
  function delayedInits(){
    availCons('delayedInits','Running in 10s...');
    setTimeout(async()=>{
      // Z1BOX SERVER
      startZ1BoxListener();
      // NOTIFS & LOCATION FENCE
      startNotifListener();
      toggleDeviceNetStatDetect();
      // HWINFO
      startHWInfo();
      // MOTION SENSORS
      if(pirsPower){
        if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('homePIRCountMaxTimeS',[pirCountMaxTimeS])};
        if(pirsOnline[1]){
          let setWCIndexNames:any[]=[];
          setWCIndexNames.push({i:(wleds.findIndex((wc)=>wc.info.name==='Zer0WLED4')),n:'Zer0WLED4'});
          if(!wledGroupSyncOn){setWCIndexNames.push({i:(wleds.findIndex((wc)=>wc.info.name==='Zer0WLED5')),n:'Zer0WLED5'})};
          for(let swi=0;swi<setWCIndexNames.length;swi++){adjustWLEDBright(1,wledGroupSyncOn,setWCIndexNames[swi].i,setWCIndexNames[swi].n);await doW(0.5)};
        };
      };
      // ADB/PHONE
      const firstPC:boolean=await doPhoneConnect();
      if(firstPC){
        const phDSInfo:PhoneDSInfo=await getPhoneDSInfo();
        if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('phoneDSInfoData',[phDSInfo])};
      };
      doPhonePop();
      setInterval(async()=>{
        const isPhConn:boolean=await doPhoneConnect();
        if(isPhConn){
          const phDSInfo:PhoneDSInfo=await getPhoneDSInfo();
          if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('phoneDSInfoData',[phDSInfo])};
        };
      },120000);
      // Z1Box Data Sends
      await z1bOnline();
      if(z1bOnline){z1bWeather()};
      await initZ1BMQTT();
    },3500);
};
//////////////////////////////////////////////////
// MAIN CLOSE/EXIT FUNCTIONS
//////////////////////////////////////////////////
async function closeConf():Promise<boolean>{
  const doKillTwtSVR=async():Promise<boolean>=>{try{await killTwtSVR.terminate();twtSVR=null;killTwtSVR=null;return Promise.resolve(true)}catch(e){return Promise.resolve(false)}};
  const doKillNLSVR=async():Promise<boolean>=>{try{await killNoteListenSVR.terminate();noteListenSVR=null;killNoteListenSVR=null;return Promise.resolve(true)}catch(e){return Promise.resolve(false)}};
  const doQuitConf=async():Promise<boolean>=>{const doQuit:number=(await dialog.showMessageBox(BrowserWindow.getFocusedWindow(),{icon:natIco('wcicon.png'),title:'Exit wifiCUE?',message:'Exit/Close wifiCUE - Are you sure?',type:'question',buttons:['Cancel','Exit'],defaultId:0,cancelId:1})).response;if(doQuit===1){return Promise.resolve(false)}else{return Promise.resolve(true)}};
  //------------
  const quitConfRes:boolean=await doQuitConf();
  if(quitConfRes){return Promise.resolve(false)}
  else{
    scs(false);
    reqDTLFX('get','stopped');
    if(twtSVR){await doKillTwtSVR()};
    if(noteListenSVR){await doKillNLSVR()};
    if(svrSVR){await killSVR()};
    if(mdSVR){await killMDSVR()};
    if(z1bSVR){await killZ1BoxSVR()};
    if(wcBonInst){await killBon()};
    if(hwiINT){clearInterval(hwiINT)};
    if(rssiINT){clearInterval(rssiINT)};
    if(setCUEDefDevList.length>0){await killICUE()};
    return Promise.resolve(true);
  };
}
///////////////////////////////////////////////////
// NETWORK CONFIG FUNCTIONS
///////////////////////////////////////////////////
const getNetClients=async():Promise<NetClients[]|false>=>{
  const matchSubNet:string=netInterface.gateway.substring(0,netInterface.gateway.length-1);
  const exec=require('child_process').exec;
  const getMIs=async():Promise<NetClients[]|false>=>{
    return new Promise((resolve)=>{
      exec('powershell.exe -Command "arp -a"',(error:any,stdout:any,stderr:any)=>{
        let ipMacDevs:NetClients[]=[];
        if(error||stderr||!stdout){return Promise.resolve(false)}
        else{
          const rawLines:any[]=stdout.split('\n');
          if(rawLines.length>0){
            for(let i=0;i<rawLines.length;i++){
              const rL:string=rawLines[i].trim();
              if(rL.length>0&&!rL.includes('Interface: ')&&!rL.includes('Internet Address')){
                const dP:string[]=rL.trim().split(/\s+/);
                if(dP.length>0){
                  if(dP[0].includes(matchSubNet)){
                    ipMacDevs.push({name:'?',ip:dP[0],mac:dP[1]})
                  };
                };
              };
            };
            resolve(ipMacDevs);
          }else{resolve(false)};
        };
      });
    });
  };
  const gNMIPResRaw:NetClients[]|false=await getMIs();
  let gFindRes:find.IDevice[]=await find({skipNameResolution:false});
  if(gNMIPResRaw){
    const gNMIPRes:NetClients[]=_.uniqBy(gNMIPResRaw,'ip').filter(c=>c.ip.split('.')[3]!=='255');
    if(gFindRes&&gFindRes.length>0){
      for(let gFI=0;gFI<gFindRes.length;gFI++){
        const gFO:find.IDevice=gFindRes[gFI],gMIndex:number=gNMIPRes.findIndex((gMO:NetClients)=>gMO.ip===gFO.ip);
        if(gMIndex!==-1&&gFO.name.trim().length>0){gNMIPRes[gMIndex].name=gFO.name};
      };
      for(let gMI=0;gMI<gNMIPRes.length;gMI++){
        const dName:string=gNMIPRes[gMI].name;
        if(dName==='?'||dName.trim().length<1){
          if(gNMIPRes[gMI].ip.split('.')[3]==='1'){gNMIPRes[gMI].name='Network Router'}
          else{gNMIPRes[gMI].name='Device #'+String(gMI+1)}
        };
      };
      netClients=gNMIPRes;
      return Promise.resolve(gNMIPRes);
    }else{
      for(let gMI=0;gMI<gNMIPRes.length;gMI++){
        if(gNMIPRes[gMI].ip.split('.')[3]==='1'){gNMIPRes[gMI].name='Network Router'}
        else{gNMIPRes[gMI].name='Device #'+String(gMI+1)}
      };
      netClients=gNMIPRes;
      return Promise.resolve(gNMIPRes)
    };
  }else{
    if(gFindRes&&gFindRes.length>0){
      for(let gFI=0;gFI<gFindRes.length;gFI++){
        if(gFindRes[gFI].name.trim().length<1){
          if(gFindRes[gFI].ip.split('.')[3]==='1'){gFindRes[gFI].name='Network Router'}
          else{gFindRes[gFI].name='Device #'+String(gFI+1)}
        };
      };
      netClients=gFindRes;
      return Promise.resolve(gFindRes);
    }else{
      netClients=[];
      return Promise.resolve([])
    };
  };
};
//-------------------------------------------------
const getNetInfo=async():Promise<NetworkInfo>=>{
  const setNetInt=():Promise<boolean>=>{
    const exec=require('child_process').exec;
    return new Promise((resolve)=>{
      exec('powershell.exe -Command "(Get-WMIObject win32_computersystemproduct) | Select UUID"',(errorUUID:any,stdoutUUID:any,stderrUUID:any)=>{
        if(errorUUID){availCons('getNetInfo|setNetInt',String(errorUUID));availCons('getNetInfo|setNetInt',String(errorUUID));netInterface.error=true;resolve(false)}
        else{
          if(!stdoutUUID||stdoutUUID.trim().length===0){
            netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
            resolve(false);
          }else{
            let finalUUID:string='';
            const sOutUUID:any=stdoutUUID.split('\n').filter(l=>!l.includes('UUID')&&!l.includes('--')&&l.trim().length>0)[0].replace(/-/g,'').substring(0,16);
            if(sOutUUID&&sOutUUID.length===16){finalUUID=sOutUUID}else{finalUUID=crypto.randomBytes(20).toString('hex')};
            svrUUID=finalUUID;
            exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select Name"',(errorName:any,stdoutName:any,stderrName:any)=>{
              if(errorName){availCons('getNetInfo|setNetInt',String(errorName));availCons('getNetInfo|setNetInt',String(errorName));netInterface.error=true;resolve(false)}
              else{
                if(!stdoutName||stdoutName.trim().length===0){
                  netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                  resolve(false);
                }else{
                  const sOutOSName:string=stdoutName.split('|')[0].split('\n').filter(l=>!l.includes('Name')&&!l.includes('--')&&!l.includes('\r'))[0];
                  exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select Version"',(errorVer:any,stdoutVer:any,stderrVer:any)=>{
                    if(errorName){availCons('getNetInfo|setNetInt',String(errorVer));availCons('getNetInfo|setNetInt',String(errorVer));netInterface.error=true;resolve(false)}
                    else{
                      if(!stdoutVer||stdoutName.trim().length===0){
                        netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                        resolve(false);
                      }else{
                        const sOutOSVer:string=stdoutVer.trim().split('\n').filter(l=>!l.includes('Version')&&!l.includes('--')&&!l.includes('\r'))[0];
                        exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select OSArchitecture"',(errorArch:any,stdoutArch:any,stderrArch:any)=>{
                          if(errorName){availCons('getNetInfo|setNetInt',String(errorArch));availCons('getNetInfo|setNetInt',String(errorArch));netInterface.error=true;resolve(false)}
                          else{
                            if(!stdoutArch||stdoutName.trim().length===0){
                              netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                              resolve(false);
                            }else{
                              const sOutOSArch:string=stdoutArch.trim().split('\n').filter(l=>!l.includes('OSArchitecture')&&!l.includes('--')&&!l.includes('\r'))[0];
                              exec('powershell.exe -Command "hostname"',(error0:any,stdout0:any,stderr0:any)=>{
                                if(error0){availCons('getNetInfo|setNetInt',String(error0));availCons('getNetInfo|setNetInt',String(error0));netInterface.error=true;resolve(false)}
                                else{
                                  if(!stdout0||stdout0.trim().length===0){
                                    netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                                    resolve(false);
                                  }else{
                                    const sOut0Name:string=stdout0.trim();
                                    exec('powershell.exe -Command "Get-NetConnectionProfile"',(error1:any,stdout1:any,stderr:any)=>{
                                      if(error1){availCons('getNetInfo|setNetInt',String(error1));availCons('getNetInfo|setNetInt',String(error1));netInterface.error=true;resolve(false)}
                                      else{
                                        if(!stdout1||stdout1.trim().length===0){
                                          netInterface={error:false,active:false,pc:'',os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                                          resolve(false);
                                        }else{
                                          const sOut1Ls:string[]=stdout1.split('\n').filter((l:string)=>l.includes(' : ')&&!l.includes('DomainAuthenticationKind')).map((l:string)=>l.split(':')[1].trim());
                                          let newNInt:NetInterface={error:false,active:true,pc:sOut0Name,os:{name:sOutOSName,version:sOutOSVer,arch:sOutOSArch},name:sOut1Ls[0],type:sOut1Ls[1],index:Number(sOut1Ls[2]),category:sOut1Ls[3],ip4Conn:sOut1Ls[4],ip6Conn:sOut1Ls[5],ip:'',gateway:''};
                                          exec('powershell.exe -Command "Get-NetIPConfiguration -InterfaceIndex '+String(newNInt.index)+'"',(error2:any,stdout2:any,stderr:any)=>{
                                            if(error2){availCons('getNetInfo|setNetInt|IP',String(error2));availCons('getNetInfo|setNetInt|IP',String(error2));netInterface.error=true;resolve(false)}
                                            else{
                                              if(!stdout2||stdout2.trim().length===0||stdout2.includes('No MSFT_NetIPInterface')){
                                                netInterface={error:false,active:false,pc:sOut0Name,os:null,name:'',type:'',index:-1,category:'',ip4Conn:'',ip6Conn:'',ip:'',gateway:''};
                                                resolve(false)
                                              }else{
                                                const sOut2Ls:string[]=stdout2.split('\n').filter((l:string)=>l.includes(' : ')&&(l.includes('IPv4Address')||l.includes('IPv4DefaultGateway'))).map((l:string)=>l.split(':')[1].trim());
                                                if(sOut2Ls[0].length>0){newNInt.ip=sOut2Ls[0]}else{newNInt.ip=''};
                                                if(sOut2Ls[1].length>0){newNInt.gateway=sOut2Ls[1]}else{newNInt.gateway=''};
                                                netInterface=newNInt;
                                                resolve(true);
                                              };
                                            };
                                          });
                                        };
                                      };
                                    });
                                  };
                                };
                              });
                            };
                          };
                        });
                      };
                    };
                  });
                };
              };
            });
          };
        };
      });
    });
  };
  await setNetInt();
  if(netInterface.ip&&netInterface.ip.trim().length>0){svrInfo.ip=netInterface.ip};
  availCons('getNetInfo','Server IP (svrInfo.ip) set to '+svrInfo.ip);
  const gncRes:false|NetClients[]=await getNetClients();
  if(gncRes!==false&&gncRes.length>0){
    const foundIPs:string[]=gncRes.map((ncO:NetClients)=>ncO.ip);
    let wasFound:string[]=[];
    for(let wi=0;wi<wledIPs.length;wi++){if(foundIPs.includes(wledIPs[wi])){wasFound.push(wledIPs[wi])}};
    for(let si=0;si<mSensorIPs.length;si++){if(foundIPs.includes(mSensorIPs[si])){wasFound.push(mSensorIPs[si])}};
    if(wasFound.length<wledIPs.length){
      console.log('getNetInfo|!!!- Missing '+(wledIPs.length-wasFound.length)+' WLED Clients/Sensors - Pinging...');
      const missingIPs:string[]=wledIPs.filter((ipStr:string)=>!wasFound.includes(ipStr)).filter((ipStr:string)=>!wasFound.includes(ipStr));
      await doW(0.25);
      await pingMissingIPs(missingIPs);
      await doW(0.25);
      const xtraGNCsRes:NetClients[]|false=await getNetClients();
      if(xtraGNCsRes!==false&&xtraGNCsRes.length>gncRes.length){netClients=xtraGNCsRes}
    }
  };
  netInfo={info:netInterface,clients:netClients,isListen:isListen,zConf:{name:svrUUID,isUp:wcBonIsUp}};
  return Promise.resolve(netInfo);
};
//////////////////////////////////////////////////
// Z1BOX FUNCTIONS
//////////////////////////////////////////////////
async function initZ1BMQTT():Promise<boolean>{
  if(z1bMQTTClient && z1bMQTTOnline){return Promise.resolve(true)};
  if(z1bMQTTClient && z1bMQTTClient.connected && !z1bMQTTOnline){z1bMQTTOnline=true;return Promise.resolve(true)};
  z1bMQTTClient=mqtt.connect('mqtt://192.168.0.3');
  z1bMQTTClient.on('connect',()=>{
    z1bMQTTOnline=true;
    z1bMQTTClient.publish('z1boxwc','0,0,1');
    availCons('initZ1BMQTT','CONNECTED to Broker @ mqtt://192.168.0.3:1883');
    z1bMQTTClient.subscribe('z1box',(err)=>{
      if(!err){availCons('initZ1BMQTT','[SUBSCRIBE] to [z1box] - OK')}
      else{availCons('initZ1BMQTT','ERROR: [SUBSCRIBE] to [z1box] FAILED')}
    })
    z1bMQTTClient.subscribe('z1boxwc',(err)=>{
      if(!err){availCons('initZ1BMQTT','[SUBSCRIBE] to [z1boxwc] - OK')}
      else{availCons('initZ1BMQTT','ERROR: [SUBSCRIBE] to [z1boxwc] FAILED')}
    })
  })
  z1bMQTTClient.on('disconnect',()=>{
    z1bMQTTOnline=false;
    z1bMQTTClient.publish('z1boxwc','0,0,0');
    availCons('initZ1BMQTT','DISCONNECTED from Broker @ mqtt://192.168.0.3:1883');
  });
  z1bMQTTClient.on('message',(t:string,m:Buffer)=>{
    let d:number[]=mqttStr2NoArr(m.toString());
    availCons('z1bMQTT','[MESSAGE] @ '+t+' - '+m.toString());
    switch(t){
      case "z1box":
        break;
      case "z1boxwc":
        if(d[0]==0&&d[1]==0&&d[2]==-1){
          availCons('initZ1BMQTT','Sending ONLINE message to z1boxwc (touchRight)');
          z1bMQTTClient.publish('z1boxwc','0,0,1');
        }else{availCons('initZ1BMQTT','Ignoring OWN MSG');}
      break;
      default:availCons('initZ1BMQTT','Uknown/Unsubscribed Topic: "'+t+'"');
    }
  });
  return Promise.resolve(true);
}
//------------------------------------------------
function mqttStr2NoArr(str:string):number[]{return str.split(',').map((s:string)=>Number(s))}
//------------------------------------------------
async function createNewZ1BoxSDataFile(dirOnly?:boolean):Promise<{r:boolean,d:any}>{
  try{
    await mkdir(z1bSDataDir,{recursive:true});
    if(dirOnly&&dirOnly===true){return Promise.resolve({r:true,d:null})};
    let newSDObj:any={startScreen:'home',screenBright:127,lastUpdate:getUnixTime(new Date())};
    const writeNSDFRes:{r:boolean,d:any}=await writeZ1BoxSDataFile(newSDObj);
    if(writeNSDFRes.r){return Promise.resolve({r:true,d:null})}
    else{return Promise.resolve({r:false,d:'Failed to Write SDF JSON File'})};
  }catch{return Promise.resolve({r:false,d:'Failed to Create SDF Dir'})};
};
//------------------------------------------------
async function writeZ1BoxSDataFile(data:any):Promise<{r:boolean,d:any}>{
  if(!data){return Promise.resolve({r:false,d:'No Data Provided'})};
  if(!(await exists(z1bSDataDir))){
    const cNewSDDRes:{r:boolean,d:null}=await createNewZ1BoxSDataFile(true);
    if(!cNewSDDRes.r){return Promise.resolve({r:false,d:'Failed to Create SD Directory'})}
  };
  let updData:any=data;
  if(typeof updData==='string'){updData=JSON.parse(updData)};
  updData.lastUpdate=getUnixTime(new Date());
  const updDataStr:string=JSON.stringify(data);
  try{
    await writeFile(z1bSDataFile,updDataStr,{encoding:'utf-8'});
    availCons('writeZ1BoxSDataFile','Data File [WRITE] - OK');
    await readZ1BoxSDataFile();
    return Promise.resolve({r:true,d:null});
  }catch(e){e=e;return Promise.resolve({r:false,d:'Failed to Write SDF'})}
};
//------------------------------------------------
async function readZ1BoxSDataFile():Promise<{r:boolean,d:any}>{
  if(!(await exists(z1bSDataFile))){
    const cNewSDFRes:{r:boolean,d:any}=await createNewZ1BoxSDataFile();
    if(!cNewSDFRes){return Promise.resolve({r:false,d:'Failed to Create New SDF'})};
  };
  try{
    const rR:string=await readFile(z1bSDataFile,{encoding:'utf-8'});
    if(rR&&(await isJSON(rR))){
      z1bSData=JSON.parse(rR);
      availCons('readZ1BoxSDataFile','Data File [READ] - OK');
      return Promise.resolve({r:true,d:rR});
    }else{return Promise.resolve({r:false,d:'Failed to Parse SDF'})}
  }catch(e){e=e;return Promise.resolve({r:false,d:'Failed to Read SDF'})};
};
//------------------------------------------------
async function muteAudio(tf:boolean):Promise<boolean>{
  return new Promise((resolve)=>{
    let toggleStr:string='';tf?toggleStr='/Mute':toggleStr='/Unmute';
    const muteSpawn=require('child_process').spawn,muteProc=muteSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe',[toggleStr,'4- USB HIFI AUDIO']);
    muteProc.on('error',(e:any)=>{availCons('muteAudio|'+toggleStr.replace('/','')+'|FAIL',e);resolve(false)})
    muteProc.on('exit',(c)=>{availCons('muteAudio|'+toggleStr.replace('/','')+'|OK',c);resolve(true)});
  });
}
//------------------------------------------------
async function getMuted():Promise<0|1|false>{
  return new Promise((resolve)=>{
    let rawResData:string='';
    const ismSpawn=require('child_process').spawn,ismProc=ismSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe',['/Stdout','/GetMute','4- USB HIFI AUDIO\\Device\\Speakers\\Render']);
    ismProc.stdout.on('data',(data:any)=>{rawResData+=data.toString()});
    ismProc.on('error',(e:any)=>{availCons('getMuted|FAIL',e);resolve(false)});
    ismProc.on('exit',(c)=>{
      if(rawResData&&rawResData.length>0){
        let ismLinesArr:string[]=[];let ismResultNo:number|null=null;
        if(rawResData.includes('\r\n')){ismLinesArr=rawResData.split('\r\n')}
        else if(rawResData.includes('\n')){ismLinesArr=rawResData.split('\n')}
        else{ismLinesArr.push(rawResData)};
        for(let li=0;li<ismLinesArr.length;li++){if(ismLinesArr[li]&&ismLinesArr[li].trim().length>0&&(ismLinesArr[li].trim()==='0'||ismLinesArr[li].trim()==='1')){ismResultNo=Number(ismLinesArr[li].trim())}};
        if(ismResultNo===0||ismResultNo==1){resolve(ismResultNo)}
        else{resolve(false)};
      }else{availCons('getAudioSRC|NULL','No Audio SRC Data Returned');resolve(false)}
    });
  });
}
//------------------------------------------------
async function getAudioSRC():Promise<{status:string,title:string,artist:string}|false>{
  return new Promise((resolve)=>{
    let rawResData:string='',resObj:any={status:null,title:null,artist:null};
    const srcSpawn=require('child_process').spawn,srcProc=srcSpawn('powershell.exe',['C:\\Users\\owenl\\Desktop\\DopeUtils\\asrc.ps1']);
    srcProc.stdout.on('data',(data:any)=>{rawResData+=data.toString()});
    srcProc.on('error',(e:any)=>{availCons('getAudioSRC|FAIL',e);resolve(false)});
    srcProc.on('exit',(c)=>{
      if(rawResData&&rawResData.length>0){
        const rawResLines:string[]=rawResData.split('\r\n');
        let resLines:string[]=[];
        for(let rli=0;rli<rawResLines.length;rli++){if(rawResLines[rli]&&rawResLines[rli].trim().length>0){resLines.push(rawResLines[rli].trim())}};
        if(resLines.length>0){
          if(resLines[0].replace('status=','').trim().length>0){resObj.status=resLines[0].replace('status=','').trim()};
          if(resLines[1].replace('title=','').trim().length>0){resObj.title=resLines[1].replace('title=','').trim()};
          if(resLines[2].replace('artist=','').trim().length>0){resObj.artist=resLines[2].replace('artist=','').trim()};
          resolve(resObj);
        }else{resolve(resObj)}
      }else{resolve(resObj)}
    });
  });
}
//------------------------------------------------
async function getVolume():Promise<number|false>{
  return new Promise((resolve)=>{
    let vpResStr:string='';
    const vpSpawn=require('child_process').spawn,vpProc=vpSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe',['/Stdout','/GetPercent','4- USB HIFI AUDIO\\Device\\Speakers\\Render']);
    vpProc.stdout.on('data',(data:any)=>{
      if(data&&data.toString().trim().length>0){
        vpResStr+=data.toString().trim();
      }
    });
    vpProc.on('error',(e:any)=>{availCons('getVolumePerc|FAIL',e);resolve(false)});
    vpProc.on('exit',(c)=>{
      if(vpResStr&&vpResStr.length>0){
        const vpResNo:number=Math.round(Number(vpResStr));
        resolve(vpResNo);
      }else{resolve(false)};
    });
  });
}
//------------------------------------------------
async function z1bVolumeUpd(v:number):Promise<boolean>{
  availCons('z1bVolumeUpd',String(v));
  const r:boolean=await sendZ1BoxData('audiovol',String(v));
  return Promise.resolve(r);
};
//------------------------------------------------
async function z1bMuteUpd(muted:number):Promise<boolean>{
  const isMutedStr:string=(muted===0?'false':'true');
  availCons('z1bMuteUpd','MUTED: '+isMutedStr);
  const r:boolean=await sendZ1BoxData('audiomuted',isMutedStr);
  return Promise.resolve(r);
};
//------------------------------------------------
async function z1bSRCUpd(src:{status:any,title:any,artist:any}):Promise<boolean>{
  availCons('z1bSRCUpd','{status:'+(src.status===null?'NULL':src.status)+',title:'+(src.title===null?'NULL':src.title)+',artist:'+(src.artist===null?'NULL':src.artist));
  let newSRCStr:string=(src.status!==null?src.status+' | ':'')+(src.title!==null?src.title:'')+(src.artist!==null&&src.title!==null?' - ':'')+(src.artist!==null?src.artist:'');
  newSRCStr=truncSRCStr(newSRCStr);
  if(newSRCStr.length<1){newSRCStr='-'};
  const r:boolean=await sendZ1BoxData('audiosrc',newSRCStr);
  return Promise.resolve(r);
}
//------------------------------------------------
function truncSRCStr(info:string):string{if(info.length>36){return info.substring(0,36)+'...'};return info}
//------------------------------------------------
async function checkZ1BoxAudioInfo(alwaysSend:boolean){
  let vVal:any,mVal:any,sVal:any,vUpd:boolean=false,mUpd:boolean=false,sUpd:boolean=false,chgCount:number=0;
  vVal=await getVolume();
  if(vVal!==false){if(vVal!==z1bVolVal||alwaysSend){z1bVolVal=vVal;vUpd=true;chgCount++}};
  mVal=await getMuted();
  if(mVal!==false){if(mVal!==z1bMuteVal||alwaysSend){z1bMuteVal=mVal;mUpd=true;chgCount++}};
  sVal=await getAudioSRC();
  if(sVal!==false){if(!_.isEqual(sVal,z1bSRCVal)||alwaysSend){z1bSRCVal=sVal;sUpd=true;chgCount++}};
  if(vUpd||mUpd||sUpd){
    let cS:string=(alwaysSend?'+++ alwaysSend +++ ':'')+'['+String(chgCount)+'] Change'+(chgCount>1?'s':'')+' - ';
    if(vUpd){await z1bVolumeUpd(z1bVolVal);await doW(0.25);cS+='(!)'};
    cS+='Volume:'+String(z1bVolVal)+',';
    if(mUpd){await z1bMuteUpd(z1bMuteVal);await doW(0.25);cS+='(!)'};
    cS+='Muted:'+(z1bMuteVal===1?'true':'false')+',';
    if(sUpd){await z1bSRCUpd(z1bSRCVal);cS+='(!)'};
    let newSRCStr:string=(z1bSRCVal.status!==null?z1bSRCVal.status+' | ':'')+(z1bSRCVal.title!==null?z1bSRCVal.title:'')+(z1bSRCVal.artist!==null&&z1bSRCVal.title!==null?' - ':'')+(z1bSRCVal.artist!==null?z1bSRCVal.artist:'');
    newSRCStr=truncSRCStr(newSRCStr);
    if(newSRCStr.length<1){newSRCStr='-'};
    cS+='Source:'+newSRCStr;
    availCons('checkZ1BoxAudioInfo',cS);
  };
}
//------------------------------------------------
let checkAudioInfoINT:any=null;
async function z1bAudioEventsToggle(onOff:string):Promise<boolean>{
  if(onOff==='on'&&!z1bAudioEVListen){
    if(checkAudioInfoINT===null){
      checkAudioInfoINT=setInterval(async()=>{
        checkZ1BoxAudioInfo(false);
      },5000);
    };
    z1bAudioEVListen=true;
  };
  if(onOff==='off'&&z1bAudioEVListen){
    if(checkAudioInfoINT){clearInterval(checkAudioInfoINT);checkAudioInfoINT=null};
    z1bAudioEVListen=false;
  };
  return Promise.resolve(true);
}
//------------------------------------------------
function startZ1BoxListener(){
  availCons('startZ1BoxListener','()...');
  try{
    z1bSVR=http.createServer(async(req,res)=>{
      const reqIP4:string=req.socket.remoteAddress.replace('::ffff:','').trim();
      if(reqIP4.startsWith('192.168.0.')){
        if(req.method.toLocaleLowerCase()==='get'){
          availCons('Z1BoxListener|GET|Request',req.headers.z1box.toString());
          if(req.headers.hasOwnProperty('z1box')&&(req.headers.z1box.toString()==='home'||req.headers.z1box.toString()==='settings'||req.headers.z1box.toString()==='lights'||req.headers.z1box.toString()==='system'||req.headers.z1box.toString()==='music')){
            const navStr:string=req.headers.z1box.toString();
            if(z1bCurrentScreen!==navStr){
              z1bCurrentScreen=navStr;
              availCons('z1boxListener|NAV','Moved to '+navStr.toUpperCase());
              if(navStr==='music'){
                await z1bAudioEventsToggle('on');
                if(!dtlfxIsLive&&z1bConfigName!=='z1bonly'){doStartDTLFXEXE(true)};
              }else{await z1bAudioEventsToggle('off')};
              if(navStr==='home'){
                if(z1TimeINT===null){z1TimeINT=setInterval(()=>{if(z1bIsOnline){if(z1bCurrentScreen==='home'){sendZ1BoxData('time')}}else{z1bOnline()}},60000)};
                if(z1WeatherINT===null){z1WeatherINT=setInterval(()=>{if(z1bIsOnline){if(z1bCurrentScreen==='home'){z1bWeather()}}else{z1bOnline()}},900000)};
              }else{
                if(z1TimeINT!==null){clearInterval(z1TimeINT);z1TimeINT=null};
                if(z1WeatherINT!==null){clearInterval(z1WeatherINT);z1WeatherINT=null};
              }
            };
            res.writeHead(200,'OK',{'Content-Type':'text/html'});res.end('OK');
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='audioinfo'){
            checkZ1BoxAudioInfo(true);
            res.writeHead(200,'OK',{'Content-Type':'text/html'});res.end('OK');
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='audiounmute'){
            const amRes:boolean=await muteAudio(false);
            if(amRes){res.writeHead(200,'Mute',{'Content-Type':'application/json'});res.end('OK')}
            else{res.writeHead(400,'Mute',{'Content-Type':'application/json'});res.end('ERROR')}
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='audiomute'){
            const amRes:boolean=await muteAudio(true);
            if(amRes){res.writeHead(200,'Mute',{'Content-Type':'application/json'});res.end('OK')}
            else{res.writeHead(400,'Mute',{'Content-Type':'application/json'});res.end('ERROR')}
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='getsavedata'){
            let gsdRes:{r:boolean,d:any}={r:false,d:'Unknown Error'};
            if(z1bSData!==null){gsdRes={r:true,d:(JSON.stringify(z1bSData))}}
            else{gsdRes=await readZ1BoxSDataFile()};
            res.writeHead(200,'OK',{'Content-Type':'application/json'});
            res.end(JSON.stringify(gsdRes));
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='dosavedata'&&req.headers.hasOwnProperty('savedata')&&req.headers.savedata.toString().length>0&&req.headers.savedata.toString().includes(':')){
            availCons('z1bREQ|DOSAVEDATA','Received Save Data Request');
            let existSD:any=z1bSData;
            if(!existSD){
              const readRes:{r:boolean,d:any}=await readZ1BoxSDataFile();
              if(!readRes.r){res.writeHead(400,readRes.d,{'Content-Type':'text/html'});res.end()}
              else{existSD=JSON.parse(readRes.d)};
            };
            availCons('oldData',existSD);
            const sDPropsArr:string[]=req.headers.savedata.toString().split('=')[0].split(':');availCons('',sDPropsArr);
            const sDValue:any=req.headers.savedata.toString().split('=')[1];availCons('',sDValue);
            if(sDPropsArr.length>5){res.writeHead(400,'SD Prop Value Too Deep',{'Content-Type':'text/html'});res.end()}
            else{
              if(sDPropsArr.length===1){existSD[sDPropsArr[0]]=sDValue}
              else if(sDPropsArr.length===2){existSD[sDPropsArr[0]][sDPropsArr[1]]=sDValue}
              else if(sDPropsArr.length===3){existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]]=sDValue}
              else if(sDPropsArr.length===4){existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]][sDPropsArr[3]]=sDValue}
              else if(sDPropsArr.length===5){existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]][sDPropsArr[3]][sDPropsArr[4]]=sDValue}
              availCons('',existSD);
              res.writeHead(200,'OK',{'Content-Type':'text/html'});res.end();
            }
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='time'){
            sendZ1BoxData('time');
            res.writeHead(200,'OK',{'Content-Type':'text/html'});
            res.end();
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='color'){
            let z1boxcolorStr:string=String(z1bColor[0])+','+String(z1bColor[1])+','+String(z1bColor[2]);
            if(z1bMQTTOnline){z1bMQTTClient.publish('z1boxcolor',z1boxcolorStr)};
            //sendZ1BoxData('color',z1bColor);
            res.writeHead(200,'OK',{'Content-Type':'text/html'});
            res.end();
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='weather'){
            z1bWeather();
            res.writeHead(200,'OK',{'Content-Type':'text/html'});
            res.end();
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='online'){
            res.writeHead(200,'OK',{'Content-Type':'text/html'});
            res.end();
          }else if(req.headers.hasOwnProperty('z1box')&&req.headers.z1box.toString()==='systeminfo'){
            let hwinfoObj:any={};
            if(z1bHWInfo!==false){
              hwinfoObj={
                mb:{fan:Number(z1bHWInfo.mb.fan.v),temp:Number(z1bHWInfo.mb.temp.v)},
                cpu:{temp:Number(z1bHWInfo.cpu.temp.v),load:Number(z1bHWInfo.cpu.load.v)},
                gpu1:{fan:Number(z1bHWInfo.gpu1.fan.v),temp:Number(z1bHWInfo.gpu1.temp.v),load:Number(z1bHWInfo.gpu1.load.v)},
                gpu2:{temp:Number(z1bHWInfo.gpu2.temp.v),load:Number(z1bHWInfo.gpu2.load.v)},
                cfan1:Number(z1bHWInfo.cfans.v[0]),
                cfan2:Number(z1bHWInfo.cfans.v[1]),
                cfan3:Number(z1bHWInfo.cfans.v[2]),
                cfan4:Number(z1bHWInfo.cfans.v[3]),
                cfan5:Number(z1bHWInfo.cfans.v[4]),
                cfan6:Number(z1bHWInfo.cfans.v[5]),
                pump:{rpm:Number(z1bHWInfo.pump.rpm.v),temp:(z1bHWInfo.pump.hasOwnProperty('temp')&&z1bHWInfo.pump.temp&&z1bHWInfo.pump.temp.hasOwnProperty('v')&&z1bHWInfo.pump.temp.v?Number(z1bHWInfo.pump.temp.v):0)}
              }
            };
            res.setHeader('Content-Type','application/json');
            res.writeHead(200);
            console.log('HWINFO:');
            const hwRes:string=JSON.stringify(hwinfoObj);
            console.log(hwRes);
            res.end(hwRes);
          }else if(req.headers.z1box.toString()==='lights'){
            res.writeHead(200,'OK',{'Content-Type':'application/json'});
            res.end(JSON.stringify({r:false,d:null}));
          }
        }
      }
    }).listen(1313);
    killZ1BSVR=createHttpTerminator({gracefulTerminationTimeout:1000,server:z1bSVR});
    availCons('startZ1BoxListener','Z1BSVR Running @ http://localhost:1313');
  }catch(e){availCons('startZ1BoxListener','ERROR: '+e)}
};
//------------------------------------------------
async function z1bOnline():Promise<boolean>{
  try{
    const{status,data}=await axios.get('http://192.168.0.112',{timeout:3000});
    if(status===200&&data.toString()==='Zer0Box says Hurroz!'){
      z1bIsOnline=true;
      return Promise.resolve(true)
    }else{
      z1bIsOnline=false;
      return Promise.resolve(false)
    };
  }catch(e){e=e;return Promise.resolve(false)}
}
//------------------------------------------------
async function z1bWeather():Promise<boolean>{
  try{
    const{status,data}=await axios.get('http://reg.bom.gov.au/fwo/IDW60901/IDW60901.94614.json',{timeout:3000,responseType:'json',headers:{'Content-Type':'application/json'}});
    if(status===200&&data){
      const wProps:string[]=['apparent_t','air_temp','rel_hum','wind_dir','wind_spd_kmh'];
      const rO:any=data.observations.data[0];
      const nO:any={temp:Math.ceil(rO[wProps[1]]),feels:Math.ceil(rO[wProps[0]]),hum:Math.ceil(rO[wProps[2]]),wind_dir:rO[wProps[3]],wind_spd:Math.ceil(rO[wProps[4]])};
      z1bWeatherObj=nO;
      sendZ1BoxData('weather',z1bWeatherObj);
      return Promise.resolve(true);
    }else{return Promise.resolve(false)};
  }catch(e){e=e;return Promise.resolve(false)}
}
//------------------------------------------------
function color2RGB565(rgbArr:number[]):string{
  const hex:string=rgb2Hex(rgbArr);
  var r=parseInt("0x"+hex[1]+hex[2]),
  g=parseInt("0x"+hex[3]+hex[4]),
  b=parseInt("0x"+hex[5]+hex[6]),
  rgb565=(((r & 0xf8)<<8)+((g & 0xfc)<<3)+((b & 0xf8)>>3)).toString(16);
  while(rgb565.length<4){rgb565="0"+rgb565};
  return "0x"+rgb565.toUpperCase();
};
//------------------------------------------------
function rgb2Hex(rgbArr:number[]):string{return "#"+((1<<24)+(rgbArr[0]<<16)+(rgbArr[1]<<8)+rgbArr[2]).toString(16).slice(1)};
//------------------------------------------------
async function sendZ1BoxData(type:string,data?:any):Promise<boolean>{
  let z1bParam:any,z1bData:any,isInvalid:boolean=false;
  switch(type){
    case 'lfxonoff':z1bParam='z1LFXOnOff';z1bData=data;break;
    case 'audiosrc':z1bParam='z1AudioSRC';z1bData=data;break;
    case 'audiomuted':z1bParam='z1AudioMuted';z1bData=data;break;
    case 'audiovol':z1bParam='z1AudioVol';z1bData=data;break;
    case 'sleep':z1bParam='z1Sleep';z1bData=true;break;
    case 'wake':z1bParam='z1Wake';z1bData=true;break;
    case 'weather':if(!data){isInvalid=true}else{z1bParam='z1Weather';z1bData=Object.values(data).join(',')};break;
    case 'time':const nowDate:Date=new Date(),strTime:string=format(nowDate,'hh:mm');z1bParam='z1Time';z1bData=strTime;break;
    case 'color':if(!data){isInvalid=true}else{z1bParam='z1Color';z1bData=String(data[0])+','+String(data[1]+','+String(data[2]))};break;
    default:return Promise.resolve(true);
  };
  //------------
  let baseDStr:string='http://192.168.0.112/get?z1box=true&';
  if(isInvalid){return Promise.resolve(false)}
  else{
    if(typeof z1bData==='string'){z1bData=encodeURIComponent(z1bData);};
    baseDStr+=z1bParam+'='+z1bData;
    try{
      availCons('sendZ1BoxData|'+type,baseDStr);
      await axios.get(baseDStr);
      z1bIsOnline=true;
      return Promise.resolve(true);
    }catch(e){
      e=e;
      z1bIsOnline=false;
      return Promise.resolve(false);
    };
  }
}
//------------------------------------------------
async function pingMissingIPs(missIPs:string[]):Promise<boolean>{
  const exec=require('child_process').exec;
  const arpPing=async(ip:string):Promise<boolean>=>{return new Promise((resolve)=>{exec('powershell.exe -Command "ping '+ip+' -n 1"',async(e:any,stdo:any,stde:any)=>{await doW(0.5);exec('powershell.exe -Command "arp -a -N '+ip+'"',async(e:any,stdo:any,stde:any)=>{await doW(0.5);exec('powershell.exe -Command "ping '+ip+' -n 1"',async(e:any,stdo:any,stde:any)=>{await doW(0.5);resolve(true)})})})})};
  //------------
  for(let mi=0;mi<missIPs.length;mi++){
    await arpPing(missIPs[mi]);
    await doW(0.25)
  };
  return Promise.resolve(true);
}
//////////////////////////////////////////////////
// APP/MODULE FILESYSTEM FUNCTIONS
//////////////////////////////////////////////////
async function initData():Promise<boolean>{
  const mkPrefsDir=async():Promise<boolean>=>{try{await mkdir(wcDataDirPath,{recursive:true});return Promise.resolve(true)}catch{return Promise.resolve(false)}};
  const doInitFail=():Promise<boolean>=>{availCons('initData','ERROR: Failed to Init WC Prefs File');availCons('initData','ERROR: Failed to Init WC Prefs File');return Promise.resolve(true)};
  const doInitOK=():Promise<boolean>=>{availCons('initData','Init WC Prefs File - OK');availCons('initData','Init WC Prefs File - OK');return Promise.resolve(true)};
  if((!await exists(wcDataDirPath))){await mkPrefsDir();availCons('initData','Created Missing WC Prefs Dir - OK');availCons('initData','Created Missing WC Prefs Dir - OK')};
  if((!await exists(wcDataFilePath))||!(await statSize(wcDataFilePath)).r){
    availCons('initData','Missing WC Prefs File - Creating Default...');availCons('initData','Missing WC Prefs File - Creating Default...');
    await writeDataFile(defWCData);
    if(await exists(wcDataFilePath)&&(await statSize(wcDataFilePath)).r){
      const checkRead:WCData|false=await readDataFile();
      if(checkRead){await doInitOK();return Promise.resolve(true)}else{await doInitFail();return Promise.resolve(false)}
    }else{await doInitFail();return Promise.resolve(false)};
  }else{
    const checkRead:WCData|false=await readDataFile();
    if(checkRead){await doInitOK();return Promise.resolve(true)}else{await doInitFail();return Promise.resolve(false)};
  };
}
//////////////////////////////////////////////////
// WC WINDOW FUNCTIONS
//////////////////////////////////////////////////
async function initWindow():Promise<BrowserWindow>{
  const displaySize:Size=screen.getPrimaryDisplay().workAreaSize;
  if(!_.isEqual(wcData.wcWinSizePos.display,displaySize)){
    wcData.wcWinSizePos.display=displaySize;
    if(displaySize.width<300){wcData.wcWinSizePos.width=240}else{wcData.wcWinSizePos.width=300};
    if((displaySize.height/2)<48){wcData.wcWinSizePos.height=48}else{wcData.wcWinSizePos.height=displaySize.height/2};
    wcData.wcWinSizePos.x=(displaySize.width-wcData.wcWinSizePos.width)+6;
    wcData.wcWinSizePos.y=(displaySize.height-wcData.wcWinSizePos.height)+6;
    await writeDataFile(wcData);
  };
  wcWindowOpts.maxWidth=displaySize.width;
  wcWindowOpts.maxHeight=displaySize.height;
  wcWindowOpts.width=wcData.wcWinSizePos.width;
  wcWindowOpts.height=wcData.wcWinSizePos.height;
  wcWindowOpts.x=wcData.wcWinSizePos.x;
  wcWindowOpts.y=wcData.wcWinSizePos.y;
  wcWindow=new BrowserWindow(wcWindowOpts);
  let pathIndex='./index.html';
  if(fs.existsSync(path.join(__dirname,'../dist/index.html'))){pathIndex='../dist/index.html'};
  const url=new URL(path.join('file:',__dirname,pathIndex));
  wcWindow.loadURL(url.href);
  wcWindow.on('resized',async()=>{await winSizePosCalcs()});
  wcWindow.on('moved',async()=>{await winSizePosCalcs()});
  return Promise.resolve(wcWindow);
};
//--------------------------------------------------
const checkRealVis=()=>{setTimeout(()=>{wcWindow.isMinimized()||!wcWindow.isVisible()?showLEDPollTo.server=false:showLEDPollTo.server=true},500)};
//--------------------------------------------------
function winCtrl(action:string){
  if(!app||!wcWindow){return}else{
    if(action==='exit'){app.quit()}
    else if(action==='close'){wcWindow.hide()}
    else if(action==='min'){wcWindow.minimize()}
    else if(action==='show'){doWCFocusFn()}
  }
};
//-------------------------------------------------
function doWCFocusFn(sendEvStr?:string){if(wcWindow){wcWindow.show();wcWindow.moveTop();wcWindow.focus();if(sendEvStr){wcWindow.webContents.send(sendEvStr)}}};
//-------------------------------------------------
async function winSizePosCalcs():Promise<boolean>{
  const nS:number[]=wcWindow.getSize();
  let nP:number[]=wcWindow.getPosition();
  let fixPos:any={x:nP[0],y:nP[1]};
  wcData.wcWinSizePos.width=nS[0];
  wcData.wcWinSizePos.height=nS[1];
  const lLim:number=-6,rLim:number=(wcData.wcWinSizePos.display.width-wcData.wcWinSizePos.width)+6,tLim:number=-6,bLim:number=(wcData.wcWinSizePos.display.height-wcData.wcWinSizePos.height)+6;
  const lSnap:number=lLim+6,rSnap:number=rLim-6,tSnap:number=tLim-6,bSnap:number=bLim-6;
  if(fixPos.x<lLim){fixPos.x=lLim};
  if(fixPos.x>rLim){fixPos.x=rLim};
  if(fixPos.y<tLim||fixPos.y===0){fixPos.y=tLim};
  if(fixPos.y>bLim){fixPos.y=bLim};
  if(fixPos.x>lLim&&fixPos.x<lSnap){fixPos.x=lLim};
  if(fixPos.x<rLim&&fixPos.x>rSnap){fixPos.x=rLim};
  if(fixPos.y>tLim&&fixPos.y<tSnap){fixPos.y=tLim};
  if(fixPos.y<bLim&&fixPos.y>bSnap){fixPos.y=bLim};
  if(nP[0]!==fixPos.x||nP[1]!==fixPos.y){wcWindow.setPosition(fixPos.x,fixPos.y,true);nP=wcWindow.getPosition()};
  wcData.wcWinSizePos.x=nP[0];
  wcData.wcWinSizePos.y=nP[1];
  nP[0]===lLim?wcData.wcWinSizePos.snaps.left=true:wcData.wcWinSizePos.snaps.left=false;
  nP[0]===rLim?wcData.wcWinSizePos.snaps.right=true:wcData.wcWinSizePos.snaps.right=false;
  nP[1]===tLim?wcData.wcWinSizePos.snaps.top=true:wcData.wcWinSizePos.snaps.top=false;
  nP[1]===bLim?wcData.wcWinSizePos.snaps.bottom=true:wcData.wcWinSizePos.snaps.bottom=false;
  await writeDataFile(wcData);
  wcWindow.webContents.send('winChanged',[wcData.wcWinSizePos]);
  return Promise.resolve(true);
}
//--------------------------------------------------
async function initDevTools():Promise<BrowserWindow>{
  availCons('initDevTools','()...');
  wcDevTools=new BrowserWindow;
  wcWindow.webContents.setDevToolsWebContents(wcDevTools.webContents);
  wcWindow.webContents.openDevTools({mode:'detach',activate:false});
  wcWindow.webContents.once('did-finish-load',()=>{wcDevTools.setPosition(375,115,false);wcDevTools.setSize(1460,900,false);wcDevTools.show()});
  wcWindow.webContents.on('devtools-closed',async()=>{mainEvCons('d','devtools-closed');app.quit()});
  wcWindow.webContents.on('devtools-focused',()=>{mainEvCons('d','devtools-focused')});
  return Promise.resolve(wcDevTools);
};
////////////////////////////////////////////////////
// MORE WINDOW FUNCTIONS
////////////////////////////////////////////////////
const getMWBrwsr=async(n:string):Promise<number|false>=>{
  const mwDeetsIndex:number=moreWinDeets.findIndex((mwO:WCMoreWinDeets)=>mwO.name.toLowerCase()===n.toLowerCase());
  if(mwDeetsIndex===-1){availCons('getMWBrwsr','ERROR: Find Index of '+n+' in moreWinDeets === -1');return Promise.resolve(false)}
  else{
    if(moreWinDeets.length!==moreWins.length){availCons('getMWBrwsr','ERROR: moreWinDeets.length !== moreWins.length');return Promise.resolve(false)}
    else{availCons('getMWBrwsr','FOUND => '+moreWinDeets[mwDeetsIndex].name+' at INDEX '+String(mwDeetsIndex));return Promise.resolve(mwDeetsIndex)}
  }
};
//-------------------------------------------------
ipcMain.on('createMoreWin',async(e:any,args:any[])=>{
  availCons('IPCMAIN|createMoreWin','('+args[0]+')...');
  const cMWRes:boolean=await createMoreWin(args[0]);
  if(cMWRes){wcWindow.webContents.send('moreWShowing',[args[0],true])}else{wcWindow.webContents.send('moreWShowing',[args[0],false])};
});
//-------------------------------------------------
ipcMain.on('killMoreWin',async(e:any,args:any[])=>{
  const mwModName:string=args[0];
  availCons('killMoreWin','('+mwModName+')...');
  const mwBWI:number|false=await getMWBrwsr(mwModName);
  if(mwBWI===false){return}
  else{
    if(moreDevTools[mwBWI]){
      moreDevTools[mwBWI].close();
      moreDevTools.splice(mwBWI,1);
    };
    if(moreWins[mwBWI]){
      moreWins[mwBWI].close();
      moreWins.splice(mwBWI,1);
    };
    moreWinDeets.splice(mwBWI,1);
    wcWindow.webContents.send('moreWShowing',[mwModName,false]);
  }
});
//-------------------------------------------------
ipcMain.on('showMoreWin',async(e:any,args:any[])=>{
  const mwModName:string=args[0];
  availCons('showMoreWin','('+mwModName+')...');
  const mwBWI:number|false=await getMWBrwsr(mwModName);
  if(mwBWI===false){return}
  else{moreWins[mwBWI].show();moreWins[mwBWI].focus()}
});
//-------------------------------------------------
ipcMain.handle('getMoreSnaps',async(e:any,args:any[]):Promise<WCWinSizePos|false>=>{
  const mwModName:string=args[0];
  availCons('getMoreSnaps','('+mwModName+')...');
  const mwBWI:number|false=await getMWBrwsr(mwModName);
  if(mwBWI===false){return Promise.resolve(false)}
  else{return Promise.resolve(moreWinDeets[mwBWI].sizePos)}
});
//-------------------------------------------------
const getPrevMWData=async():Promise<WCPrevMWData>=>{
  let pW:WCPrevMWData={name:'',size:[],pos:[],snaps:{top:false,right:false,bottom:false,left:false}};
  if(moreWins.length>0){
    const lWI:number=(moreWins.length-1);
    pW.size=(moreWins[lWI].getSize());
    pW.pos=(moreWins[lWI].getPosition());
    if(moreWinDeets[lWI]){
      pW.name=moreWinDeets[lWI].name;
      pW.snaps=moreWinDeets[lWI].sizePos.snaps;
    };
  }else if(childW!==null){
    pW.name='child';
    pW.size=(childW.getSize());
    pW.pos=(childW.getPosition());
    pW.snaps=wcData.childWinSizePos.snaps
  }else{
    pW.name='main';
    pW.size=(wcWindow.getSize());
    pW.pos=(wcWindow.getPosition());
    pW.snaps=wcData.wcWinSizePos.snaps
  };
  return Promise.resolve(pW);
}
//-------------------------------------------------
async function createMoreWin(wName:string):Promise<boolean>{
  //-------------------------------
  if(!wcWindow){availCons('createMoreWin','ERROR: Main/Parent Window Does Not Exist');return Promise.resolve(false)};
  const mwBWI:number|false=await getMWBrwsr(wName);
  let newMWBWOpts:BrowserWindowConstructorOptions=defMoreWinOpts;
  if(mwBWI!==false){
    if(moreWins[mwBWI]){
      availCons('createMoreWin','WARNING: '+wName+' BrowserDeets AND BrowserWindow Already Exist - Showing/Focussing');
      moreWins[mwBWI].show();moreWins[mwBWI].focus();
      return Promise.resolve(false)
    }else{
      availCons('createMoreWin','WARNING: '+wName+' BrowserDeets Already Exists - Skip Create WCMoreWinDeets Object...');
      newMWBWOpts=moreWinDeets[mwBWI].opts;
    };
  }else{
    availCons('createMoreWin','Creating NEW WCMoreWinDeets Object for ('+wName+')...');
    const displaySize:Size=(screen.getPrimaryDisplay()).workAreaSize;
    const pW:WCPrevMWData=await getPrevMWData();
    let defMWData:WCMoreWin={name:wName,opts:null,sizePos:{display:displaySize,x:0,y:0,width:defMoreWinOpts.width,height:defMoreWinOpts.height,snaps:{top:false,right:false,bottom:false,left:false}}};
    let nPlace:string='';
    if(pW.snaps.right&&!pW.snaps.top){nPlace='top'}
    else if(pW.snaps.right&&pW.snaps.top){nPlace='left'}
    else if(pW.snaps.top&&!pW.snaps.right&&!pW.snaps.left||pW.snaps.top&&pW.snaps.right&&!pW.snaps.left){nPlace='left'}
    else if(pW.snaps.top&&pW.snaps.left){nPlace='bottom'};
    if(nPlace==='top'){
      const isCrn:boolean=(pW.pos[1]>96&&pW.pos[1]<600);
      if(isCrn){defMWData.sizePos.height=(pW.pos[1]+6);defMWData.sizePos.snaps.top=true;defMWData.sizePos.snaps.right=true;defMWData.sizePos.snaps.bottom=false;defMWData.sizePos.snaps.left=false}
      else{defMWData.sizePos.snaps.top=true;defMWData.sizePos.snaps.right=true;defMWData.sizePos.snaps.bottom=false;defMWData.sizePos.snaps.left=false};
      defMWData.sizePos.x=((displaySize.width-defMWData.sizePos.width)+6);
      defMWData.sizePos.y=(pW.pos[1]-defMWData.sizePos.height)+6;
    }else if(nPlace==='left'){
      const isCrn:boolean=(pW.pos[0]>96&&pW.pos[0]<600);
      if(isCrn){defMWData.sizePos.width=(pW.pos[0]+6);defMWData.sizePos.snaps.top=true;defMWData.sizePos.snaps.left=true;defMWData.sizePos.snaps.right=false;defMWData.sizePos.snaps.bottom=false}
      else{defMWData.sizePos.snaps.top=true;defMWData.sizePos.snaps.right=false;defMWData.sizePos.snaps.bottom=false;defMWData.sizePos.snaps.left=false};
      if(isCrn){defMWData.sizePos.x=-6}
      else{defMWData.sizePos.x=pW.pos[0]-defMWData.sizePos.width};
      defMWData.sizePos.y=0;
    }else if(nPlace==='bottom'){
      const isCrn:boolean=((displaySize.height-(pW.pos[1]+pW.size[1]))>96&&(displaySize.height-(pW.pos[1]+pW.size[1]))<600);
      if(isCrn){defMWData.sizePos.height=((displaySize.height-(pW.pos[1]+pW.size[1]))+6);defMWData.sizePos.snaps.top=false;defMWData.sizePos.snaps.right=false;defMWData.sizePos.snaps.bottom=true;defMWData.sizePos.snaps.left=true}else{defMWData.sizePos.snaps.top=false;defMWData.sizePos.snaps.right=false;defMWData.sizePos.snaps.bottom=false;defMWData.sizePos.snaps.left=true};
      defMWData.sizePos.x=-6;
      defMWData.sizePos.y=(displaySize.height-defMWData.sizePos.height);
    };
    //------
    defMWData.opts={x:defMWData.sizePos.x,y:defMWData.sizePos.y,width:defMWData.sizePos.width,height:defMWData.sizePos.height,minWidth:280,minHeight:48,title:defMWData.name,darkTheme:true,frame:false,transparent:true,icon:path.join(__dirname,'../dist/assets/icons/large-wcicon.png'),resizable:true,show:false,parent:wcWindow,webPreferences:{nodeIntegration:true,nodeIntegrationInWorker:true,nodeIntegrationInSubFrames:true,webSecurity:false,allowRunningInsecureContent:true,webgl:true,plugins:true,backgroundThrottling:false,sandbox:false,contextIsolation:false,spellcheck:false,defaultFontFamily:{sansSerif:'Arial'},defaultFontSize:14}};
    if(wName==='wifing'){defMWData.opts.resizable=true};
    if(wName==='ytdl'){
      defMWData.opts.x=3140;
      defMWData.opts.y=0;
      defMWData.opts.width=294;
      defMWData.opts.height=393;
      defMWData.opts.show=false;
    };
    //------
    newMWBWOpts=defMWData.opts;
    moreWinDeets.push(defMWData);
  }
  //-------------
  const newMW:BrowserWindow=new BrowserWindow(newMWBWOpts);
  let pathIndex='./index.html';
  if(fs.existsSync(path.join(__dirname,'../dist/index.html'))){pathIndex='../dist/index.html'};
  const url=new URL(path.join('file:',__dirname,pathIndex));
  const compUrl:any=url.href+'#/more';
  newMW.loadURL(compUrl);
  newMW.webContents.on('did-finish-load',()=>{
    moreWins.push(newMW);
    const mWinsI:number=moreWins.length-1;
    moreWins[mWinsI].webContents.send('moreWIsReady',[wName]);
    wcWindow.webContents.send('moreWShowing',[wName,true]);
    const mwDevTools:BrowserWindow=new BrowserWindow;
    moreDevTools.push(mwDevTools);
    moreWins[mWinsI].webContents.setDevToolsWebContents(moreDevTools[mWinsI].webContents);
    moreWins[mWinsI].webContents.openDevTools({mode:'detach',activate:false});
    moreDevTools[mWinsI].show();
    moreDevTools[mWinsI].setPosition(375,115,false);
    moreDevTools[mWinsI].setSize(1460,900,false);
    mwCMs=mwCMs.filter(cmO=>cmO.name!==wName);
    mwCMs.push({name:wName,index:mWinsI,opts:{},isOpen:false,ctx:''});
    const cmI:number=mwCMs.findIndex(c=>c.name===wName);
    moreWins[mWinsI].webContents.on('context-menu',()=>{mwCMs[cmI].isOpen=true;moreWins[mWinsI].webContents.send('cmIsOpen',[true])});
    ipcMain.on('mwCMIsOpen',(e:any,args:any[])=>{
      const cmI:number=mwCMs.findIndex(c=>c.name===args[0]);
      if(cmI!==-1){mwCMs[cmI].isOpen=args[1]};
    });
    ipcMain.on('mwCMContext',(e:any,args:any[])=>{
      const cmI:number=mwCMs.findIndex(c=>c.name===args[0]);
      if(cmI!==-1){mwCMs[cmI].ctx=args[1];cmBuild()};
    });
  });
  return Promise.resolve(true);
};
////////////////////////////////////////////////////
/// CHILD WINDOW FUNCTIONS
////////////////////////////////////////////////////
ipcMain.on('createChildWindow',(e:any,args:any[])=>{createChildWindow(args[0])});
//-------------------------------------------------
ipcMain.on('killChildWindow',(e:any,args:any[])=>{childW.webContents.closeDevTools();childW.close()});
//-------------------------------------------------
ipcMain.on('showChildWindow',async(e:any,args:any[])=>{childW.show();childW.focus();await childWSizePosCalcs()});
//-------------------------------------------------
async function createChildWindow(content:string):Promise<boolean>{
  if(childW===null){
    const displaySize:Size=screen.getPrimaryDisplay().workAreaSize;
    if(!_.isEqual(wcData.childWinSizePos.display,displaySize)){
      wcData.childWinSizePos.display=displaySize;
      if(displaySize.width<300){wcData.childWinSizePos.width=240}else{wcData.childWinSizePos.width=300};
      if((displaySize.height/2)<48){wcData.childWinSizePos.height=48}else{wcData.childWinSizePos.height=542};
      wcData.childWinSizePos.x=(displaySize.width-wcData.childWinSizePos.width)+6;
      wcData.childWinSizePos.y=(displaySize.height-(wcData.wcWinSizePos.height+wcData.childWinSizePos.height))+6;
      await writeDataFile(wcData);
    };
    childWindowOpts.maxWidth=displaySize.width;
    childWindowOpts.maxHeight=displaySize.height;
    childWindowOpts.width=wcData.childWinSizePos.width;
    childWindowOpts.height=wcData.childWinSizePos.height;
    childWindowOpts.x=wcData.childWinSizePos.x;
    childWindowOpts.y=(displaySize.height-(wcData.wcWinSizePos.height+wcData.childWinSizePos.height))+6;
    if(!wcWindow){return Promise.resolve(false)};
    childWindowOpts['show']=false;
    childWindowOpts['parent']=wcWindow;
    childW=new BrowserWindow(childWindowOpts);
    let pathIndex='./index.html';
    if(fs.existsSync(path.join(__dirname,'../dist/index.html'))){pathIndex='../dist/index.html'};
    const url=new URL(path.join('file:',__dirname,pathIndex));
    const compUrl:any=url.href+'#/child';
    childW.loadURL(compUrl);
    childW.on('resized',async()=>{await childWSizePosCalcs()});
    childW.on('moved',async()=>{await childWSizePosCalcs()});
    childW.webContents.on('did-finish-load',()=>{
      childW.webContents.send('childWIsReady',[content,twtUser]);
      wcWindow.webContents.send('twtChildWShowing',[true]);
      childDevTools=new BrowserWindow;
      childW.webContents.setDevToolsWebContents(childDevTools.webContents);
      childW.webContents.openDevTools({mode:'detach',activate:false});
      childDevTools.show();
      childDevTools.setPosition(375,115,false);
      childDevTools.setSize(1460,900,false);
      childW.webContents.on('context-menu',()=>{childWCMIsOpen=true;childW.webContents.send('cmIsOpen',[true])});
      ipcMain.on('cmIsOpen',(e:any,args:any[])=>{childWCMIsOpen=args[0]});
      ipcMain.on('cmContext',(e:any,args:any[])=>{cmContextStr=args[0];cmBuild()});
    });
    childW.on('closed',()=>{childW=null;wcWindow.webContents.send('twtChildWShowing',[false])});
    return Promise.resolve(true);
  }else{wcWindow.webContents.send('twtChildWShowing',[true]);return Promise.resolve(false)}
}
//-------------------------------------------------
ipcMain.on('toggleChildVidVis',(e:any,args:any[])=>{
  const[cW,cH]=childW.getSize();
  const [cX,cY]=childW.getPosition();
  if(args[0]==='hide'){childW.setBounds({height:(cH-162),y:(cY+162)},false)}
  else{childW.setBounds({height:(cH+162),y:(cY-162)},false)};
  const[acW,acH]=childW.getSize(),[acX,acY]=childW.getPosition();
})
//-------------------------------------------------
async function childWSizePosCalcs():Promise<boolean>{
  const nS:number[]=childW.getSize();
  let nP:number[]=childW.getPosition();
  let fixPos:any={x:nP[0],y:nP[1]};
  wcData.childWinSizePos.width=nS[0];
  wcData.childWinSizePos.height=nS[1];
  const lLim:number=-6,rLim:number=(wcData.childWinSizePos.display.width-wcData.childWinSizePos.width)+6,tLim:number=-6,bLim:number=(wcData.childWinSizePos.display.height-wcData.childWinSizePos.height)+6;
  const lSnap:number=lLim+6,rSnap:number=rLim-6,tSnap:number=tLim-6,bSnap:number=bLim-6;
  if(fixPos.x<lLim){fixPos.x=lLim};
  if(fixPos.x>rLim){fixPos.x=rLim};
  if(fixPos.y<tLim||fixPos.y===0){fixPos.y=tLim};
  if(fixPos.y>bLim){fixPos.y=bLim};
  if(fixPos.x>lLim&&fixPos.x<lSnap){fixPos.x=lLim};
  if(fixPos.x<rLim&&fixPos.x>rSnap){fixPos.x=rLim};
  if(fixPos.y>tLim&&fixPos.y<tSnap){fixPos.y=tLim};
  if(fixPos.y<bLim&&fixPos.y>bSnap){fixPos.y=bLim};
  if(nP[0]!==fixPos.x||nP[1]!==fixPos.y){childW.setPosition(fixPos.x,fixPos.y,true);nP=childW.getPosition()};
  wcData.childWinSizePos.x=nP[0];
  wcData.childWinSizePos.y=nP[1];
  nP[0]===lLim?wcData.childWinSizePos.snaps.left=true:wcData.childWinSizePos.snaps.left=false;
  nP[0]===rLim?wcData.childWinSizePos.snaps.right=true:wcData.childWinSizePos.snaps.right=false;
  nP[1]===tLim?wcData.childWinSizePos.snaps.top=true:wcData.childWinSizePos.snaps.top=false;
  nP[1]===bLim?wcData.childWinSizePos.snaps.bottom=true:wcData.childWinSizePos.snaps.bottom=false;
  await writeDataFile(wcData);
  childW.webContents.send('cWinSizePos',[wcData.childWinSizePos]);
  return Promise.resolve(true);
}
//////////////////////////////////////////////////
// CONTEXT MENU FUNCTIONS
//////////////////////////////////////////////////
const cmBuild=():Promise<boolean>=>{
  let baseCMOpts:any={showLookUpSelection:false,showSearchWithGoogle:false,showCopyImage:false,showCopyImageAddress:false,showSaveImage:false,showSaveImageAs:false,showSaveLinkAs:false,showInspectElement:false,showServices:false,
  prepend:(dA:any,ps:any,bW:any,e:any)=>
    [
      {label:'Greeting',visible:true,enabled:(isEn('chat')),icon:icoP('assets/cm-twt-greet-ico.png'),type:'normal',click:()=>{childW.webContents.send('cm',['greet'])}},
      {label:'RahRah!',visible:true,enabled:true,icon:icoP('assets/cm-twt-letsgo-ico.png'),type:'normal',click:()=>{childW.webContents.send('cm',['rahrah'])}}
    ]
  };
  cmOpts=baseCMOpts;
  return Promise.resolve(true);
};
//-------------------------------------------------
const isEn=(ctx:string):boolean=>{if(ctx===cmContextStr){return true}else{return false}};
//////////////////////////////////////////////////
// WC TRAY FUNCTIONS
//////////////////////////////////////////////////
async function initTray():Promise<Tray|false>{
  if(!wcTrayUpdating){
    wcTrayUpdating=true;
    let connMenuItem:MenuItem|any;
    //----- WLED
    let wledMenuItem:any={label:'WLED',visible:true,enabled:!syncStates.audioSync&&!dtlfxIsLive,icon:icoP('assets/wc-tray-wledfns-sub-ico.png'),type:'submenu',submenu:[]};
    let wledsFnMenu:any[]=[];
    if(wleds.length>0){
      if(wleds.length>1){
        for(let awi=0;awi<wleds.length;awi++){
          wledsFnMenu.push(
            {label:wleds[awi].info.name,visible:true,enabled:true,icon:icoP('assets/wc-tray-wledfns-sub-ico.png'),type:'submenu',submenu:[
              {label:'Effects',visible:true,enabled:true,icon:icoP('assets/wc-tray-wledeffects-ico.png'),type:'submenu',submenu:[]},
              {label:'Presets',visible:true,enabled:true,icon:icoP('assets/wc-tray-wledpresets-ico.png'),type:'submenu',submenu:[]}
            ]
          });
          let multiFXList:string[]=wleds[awi].effects;
          const multiFXNow:number=wleds[awi].state.segments[0].effectId;
          for(let mfxi=0;mfxi<multiFXList.length;mfxi++){
            wledsFnMenu[awi].submenu[0].submenu.push({label:multiFXList[mfxi],visible:true,enabled:true,type:'checkbox',checked:(mfxi===multiFXNow?true:false),click:()=>{wcWindow.webContents.send('clientWLEDFnChange',[{index:awi,type:'effects',id:mfxi}])}});
          };
          const multiPSList:string[]=Object.values(wleds[awi].presets).filter(p=>!_.isEmpty(p)&&p.hasOwnProperty('name')).map(p=>p['name']);
          const multiPSNow:number=wleds[awi].state.presetId;
          for(let pmi=0;pmi<multiPSList.length;pmi++){
            wledsFnMenu[awi].submenu[1].submenu.push({label:multiPSList[pmi],visible:true,enabled:true,type:'checkbox',checked:(pmi===multiPSNow?true:false),click:()=>{wcWindow.webContents.send('clientWLEDFnChange',[{index:awi,type:'presets',id:pmi}])}});
          };
        };
        wledMenuItem.submenu=wledsFnMenu;
      }else{
        wledMenuItem.submenu=[
          {label:'Effects',visible:true,enabled:true,icon:icoP('assets/wc-tray-wledeffects-ico.png'),type:'submenu',submenu:[]},
          {label:'Presets',visible:true,enabled:true,icon:icoP('assets/wc-tray-wledpresets-ico.png'),type:'submenu',submenu:[]}
        ];
        const singleFXList:string[]=wleds[0].effects;
        const singleFXNow:number=wleds[0].state.segments[0].effectId;
        for(let sfxi=0;sfxi<singleFXList.length;sfxi++){
          wledMenuItem.submenu[0].submenu.push({label:singleFXList[sfxi],visible:true,enabled:true,type:'checkbox',checked:(sfxi===singleFXNow?true:false),click:()=>{wcWindow.webContents.send('clientWLEDFnChange',[{index:0,type:'effects',id:sfxi}])}});
        };
        const singlePSList:string[]=Object.values(wleds[0].presets).filter(p=>!_.isEmpty(p)&&p.hasOwnProperty('name')).map(p=>p['name']);
        const singlePSNow:number=wleds[0].state.presetId;
        for(let psi=0;psi<singlePSList.length;psi++){
          wledMenuItem.submenu[1].submenu.push({label:singlePSList[psi],visible:true,enabled:true,type:'checkbox',checked:(psi===singlePSNow?true:false),click:()=>{wcWindow.webContents.send('clientWLEDFnChange',[{index:0,type:'presets',id:psi}])}});
        };
      };
    }else{wledMenuItem.enabled=false};
    //----------
    let sShotSyncIco:string,audioSyncIco:string;
    syncStates.audioSync?audioSyncIco=icoP('assets/wc-tray-sync2audio-ico-on.png'):audioSyncIco=icoP('assets/wc-tray-sync2audio-ico.png');
    syncStates.sshotSync?sShotSyncIco=icoP('assets/wc-tray-sshot-ico-on.png'):sShotSyncIco=icoP('assets/wc-tray-sshot-ico.png');
    if(!(isNetEnabled())){connMenuItem={label:'No Network',enabled:false,type:'normal',icon:icoP('assets/wc-tray-connected-false.png'),click:()=>{return}}}else{connMenuItem={label:'Connected: '+netInterface.name+' ('+netInterface.type+')',enabled:false,type:'normal',icon:icoP((netInterface.type==='Ethernet'?'assets/wc-tray-connstatus-wired-ico.png':'assets/wc-tray-connstatus-wifi-ico.png')),click:()=>{return}}};
    const isSleeping=()=>{return isSleep};
    if(wcTray){wcTray.destroy();wcTray=null};
    const trayIcoPath:string=path.join(__dirname,'../dist/assets/icons/large-wcicon.png');
    wcTray=new Tray(trayIcoPath);
    wcTrayContextMenu=Menu.buildFromTemplate([
      {type:'separator'},
      connMenuItem,
      {type:'separator'},
      {label:listenONOFFStr(),visible:(isNetEnabled()),enabled:true,type:'checkbox',checked:isListen,click:()=>{wcWindow.webContents.send('doInvokeToggleWCListen')}},
      {type:'separator'},
      {label:'Sleep Now',visible:true,enabled:!(isSleeping()),type:'normal',icon:icoP('assets/wc-tray-sleep-ico.png'),click:()=>{wcWindow.webContents.send('traySleepWakeNow',['sleep'])}},
      {label:'Wake Now',visible:true,enabled:(isSleeping()),type:'normal',icon:icoP('assets/wc-tray-wake-ico.png'),click:()=>{wcWindow.webContents.send('traySleepWakeNow',['wake'])}},
      {type:'separator'},
      {label:'All White Light',visible:true,enabled:true,type:'normal',icon:icoP('assets/wc-tray-allwhite-ico.png'),click:()=>{wcWindow.webContents.send('traySetAllWhiteLight')}},
      {label:'Set New Color',visible:true,enabled:true,type:'normal',icon:icoP('assets/mmdd-actions-setnewcolor-ico.png'),click:()=>{wcWindow.webContents.send('traySetColor')}},
      {type:'separator'},
      {label:'Screen Sync',visible:true,enabled:true,type:'normal',icon:sShotSyncIco,click:()=>{wcWindow.webContents.send('animSShotToggle',[(syncStates.sshotSync?'stop':'start'),'server'])}},
      {label:'Audio Sync',visible:true,enabled:true,type:'normal',icon:audioSyncIco,click:()=>{wcWindow.webContents.send('traySync2Audio',[(syncStates.audioSync?'stop':'start')])}},
      {type:'separator'},
      wledMenuItem,
      {type:'separator'},
      {label:'Open wifiCUE',visible:true,enabled:true,type:'normal',icon:icoP('assets/wc-tray-showapp-ico.png'),click:()=>{doWCFocusFn()}},
      {label:'Settings',visible:true,enabled:true,type:'normal',icon:icoP('assets/wc-tray-settings-ico.png'),click:async()=>{doWCFocusFn('trayGoSettings')}},
      {type:'separator'},
      {label:'Exit wifiCUE',visible:true,enabled:true,type:'normal',icon:icoP('assets/wc-tray-exit-ico.png'),click:()=>{app.quit()}},
    ]);
    wcTray.setToolTip('wifiCUE');
    wcTray.setContextMenu(wcTrayContextMenu);
    wcTrayUpdating=false;
    return Promise.resolve(wcTray);
  }else{
    availCons('initTray','SKIPPED - Tray Already Updating!');
    return Promise.resolve(false);
  };
};
//////////////////////////////////////////////////
// SHORTCUTS
//////////////////////////////////////////////////
const scs=(tf:boolean):void=>{if(tf){if(!scsActive){shortCutRegs('register')}}else{if(scsActive){shortCutRegs('unregister')}}}
const shortCutRegs=(action:string):void=>{
  if(action==='register'){
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('appHasFocus',[true])};
    globalShortcut.register('Ctrl+Shift+X',()=>{winCtrl('quit')});
    // Custom KP - KNOB 1 (Top) - Brightness/OnOff
    globalShortcut.register('numdiv',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      const ooJSON:string=JSON.stringify({tt:0,on:(setWCs[0].state.on?false:true)});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',ooJSON)};
    });
    globalShortcut.register('numdec',()=>{
      if(dtlfxIsLive){return};
      if(wleds&&wleds.length>0&&wleds[0].state.on){kbKnobAdjust('brightness','inc')};
    });
    globalShortcut.register('num0',()=>{
      if(dtlfxIsLive){return};
      if(wleds&&wleds.length>0&&wleds[0].state.on){kbKnobAdjust('brightness','dec')}
    });
    // Custom KP - KNOB 2 (Bottom) - FX Fwd|Back/Onff
    globalShortcut.register('nummult',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      const togFxJSON:string=JSON.stringify({tt:0,seg:[{fx:0}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',togFxJSON)};
    });
    globalShortcut.register('numadd',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let fwdFXId:number=(setWCs[0].state.segments[0].effectId+1);
      if(fwdFXId===setWCs[0].effects.length){fwdFXId=0};
      const fwdFxJSON:string=JSON.stringify({tt:0,seg:[{fx:fwdFXId}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',fwdFxJSON)};
    });
    globalShortcut.register('numsub',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let backFXId:number=(setWCs[0].state.segments[0].effectId-1);
      if(backFXId===0){backFXId=setWCs[0].effects.length};
      const backFxJSON:string=JSON.stringify({tt:0,seg:[{fx:backFXId}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',backFxJSON)};
    });
    // Custom KP - ROWS 1+2 (Top+Middle) - R1=W,R,G,B|R2=fxInt-,fxInt+,fxSpd-,fxSpd+
    globalShortcut.register('num1',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let wJSON:string;
      for(let wi=0;wi<setWCs.length;wi++){
        setWCs[wi].info.name==='Zer0WLED6'?wJSON=JSON.stringify({tt:0,seg:[{col:[[255,205,160]]}]}):wJSON=JSON.stringify({tt:0,seg:[{col:[[0,0,0,255]]}]});
        wledJSONReq(setWCs[wi].info.name,'post',wJSON);
      };
      let icWArr:WCCUESetDeviceLED[]=[];
      for(let i=0;i<setCUEDefDevList.length;i++){icWArr.push({id:setCUEDefDevList[i].id,colors:setCUEDefDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:255,g:205,b:160,a:255}})})};
      for(let i=0;i<icWArr.length;i++){sdk.CorsairSetLedColors(icWArr[i].id,icWArr[i].colors)};
    });
    globalShortcut.register('num2',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let wJSON:string;
      for(let wi=0;wi<setWCs.length;wi++){
        setWCs[wi].info.name==='Zer0WLED6'?wJSON=JSON.stringify({tt:0,seg:[{col:[[255,0,0,0]]}]}):wJSON=JSON.stringify({tt:0,seg:[{col:[[255,0,0]]}]});
        wledJSONReq(setWCs[wi].info.name,'post',wJSON)
      };
      let icRArr:WCCUESetDeviceLED[]=[];
      for(let i=0;i<setCUEDefDevList.length;i++){icRArr.push({id:setCUEDefDevList[i].id,colors:setCUEDefDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:255,g:0,b:0,a:255}})})};
      for(let i=0;i<icRArr.length;i++){sdk.CorsairSetLedColors(icRArr[i].id,icRArr[i].colors)};
    });
    globalShortcut.register('num3',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let wJSON:string;
      for(let wi=0;wi<setWCs.length;wi++){
        setWCs[wi].info.name==='Zer0WLED6'?wJSON=JSON.stringify({tt:0,seg:[{col:[[0,255,0,0]]}]}):wJSON=JSON.stringify({tt:0,seg:[{col:[[0,255,0]]}]});
        wledJSONReq(setWCs[wi].info.name,'post',wJSON);
      };
      let icGArr:WCCUESetDeviceLED[]=[];
      for(let i=0;i<setCUEDefDevList.length;i++){icGArr.push({id:setCUEDefDevList[i].id,colors:setCUEDefDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:0,g:255,b:0,a:255}})})};
      for(let i=0;i<icGArr.length;i++){sdk.CorsairSetLedColors(icGArr[i].id,icGArr[i].colors)};
    });
    globalShortcut.register('num4',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let wJSON:string;
      for(let wi=0;wi<setWCs.length;wi++){
        setWCs[wi].info.name==='Zer0WLED6'?wJSON=JSON.stringify({tt:0,seg:[{col:[[0,0,255,0]]}]}):wJSON=JSON.stringify({tt:0,seg:[{col:[[0,0,255]]}]});
        wledJSONReq(setWCs[wi].info.name,'post',wJSON);
      };
      let icBArr:WCCUESetDeviceLED[]=[];
      for(let i=0;i<setCUEDefDevList.length;i++){icBArr.push({id:setCUEDefDevList[i].id,colors:setCUEDefDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:0,g:0,b:255,a:255}})})};
      for(let i=0;i<icBArr.length;i++){sdk.CorsairSetLedColors(icBArr[i].id,icBArr[i].colors)};
    });
    //------------
    globalShortcut.register('num5',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let decIX:number=(wleds[0].state.segments[0].effectIntensity-51);
      if(decIX<0){decIX=0};
      const dixJSON:string=JSON.stringify({tt:0,seg:[{ix:decIX}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',dixJSON)};
    });
    globalShortcut.register('num6',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let incIX:number=(wleds[0].state.segments[0].effectIntensity+51);
      if(incIX>255){incIX=255};
      const iixJSON:string=JSON.stringify({tt:0,seg:[{ix:incIX}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',iixJSON)};
    });
    globalShortcut.register('num7',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let decSX:number=(wleds[0].state.segments[0].effectSpeed-51);
      if(decSX<0){decSX=0};
      const dsxJSON:string=JSON.stringify({tt:0,seg:[{sx:decSX}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',dsxJSON)};
    });
    globalShortcut.register('num8',()=>{
      if(dtlfxIsLive){return};
      let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let incSX:number=(wleds[0].state.segments[0].effectSpeed+51);
      if(incSX>255){incSX=255};
      const isxJSON:string=JSON.stringify({tt:0,seg:[{sx:incSX}]});
      for(let wi=0;wi<setWCs.length;wi++){wledJSONReq(setWCs[wi].info.name,'post',isxJSON)};
    });
    globalShortcut.register('PrintScreen',()=>{if(dtlfxIsLive){return}else{doStartDTLFXEXE(false)}});
    scsActive=true;
  }else{
    globalShortcut.unregisterAll();
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('appHasFocus',[false])};
    scsActive=false;
  };
};
//////////////////////////////////////////////////
async function doStartDTLFXEXE(fromZ1Box?:boolean){
  if(fromZ1Box&&fromZ1Box===true){z1bSendVizInfo=true}else{z1bSendVizInfo=false};
  const dtlfxExePath:string=path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfx.exe');
  exec(dtlfxExePath,async(error:any,stdout:any,stderr:any)=>{
    if(error||stderr){availCons('KeyPadSC|KEY9 > PrintScreen','ERROR');if(error){console.log(error)};if(stderr){console.log(stderr)}}
    else{availCons('KeyPadSC|KEY9 > PrintScreen','Opened DTLFX.exe')}
  });
}
//////////////////////////////////////////////////
// SERVER/CLIENT SOCKET.IO
//////////////////////////////////////////////////
async function initSocket():Promise<boolean>{
  availCons('initSocket','()...');
  if(svrSVR!==null||svrListening===true){await killSVR()};
  try{
    svrSVR=http.createServer();
    svrSVRKill=createHttpTerminator({gracefulTerminationTimeout:1000,server:svrSVR});
    io=new Server(svrSVR);
    //----------
    io.on('connection',(ioSocket:Socket)=>{
      availCons('[SOCKET.io|EVENT]','"connection"');
      //----------
      ioSocket.on('clientCtrlData',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientCtrlData"');if((await valGrantClient(args[0].i.id))){io.emit('serverCtrlDataResp',[{r:true,c:'ok',d:wcData}])}else{io.emit('serverCtrlDataResp',[{r:false,c:'noauth',d:null}])}});
      ioSocket.on('clientAudioSync',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientAudioSync"');
        if((await valGrantClient(args[0].i.id))){
          io.emit('serverAudioSyncResp',[{r:true,c:'ok',d:syncStates.audioSync}]);
        }else{io.emit('serverAudioSyncResp',[{r:false,c:'noauth',d:null}])};
      });
      ioSocket.on('clientRunLEDFXEXE',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientRunLEDFXEXE"');
        if((await valGrantClient(args[0].i.id))){
          // Integrate with DTLFX Here...
          io.emit('serverRunLEDFXEXEResp',[{r:false,c:'disabled',d:null}])
        };
      });
      ioSocket.on('clientLEDFXOnOff',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientLEDFXOnOff"');
        // Integrate with DTLFX Here...
        io.emit('serverLEDFXOnOffResp',[false]);
      });
      ioSocket.on('clientLEDFXSync',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientLEDFXSync"');
        let respD:any={r:false,c:'ok',d:null};
        if((await valGrantClient(args[0].i.id))){
         // Integrate with DTLFX Here...
        };
        io.emit('serverLEDFXSyncResp',[respD]);
      });
      ioSocket.on('clientWLEDData',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientWLEDData"');
        if((await valGrantClient(args[0].i.id))){
          let activeWLEDS:WCActiveWLEDS[]=[];
          for(let wi=0;wi<wleds.length;wi++){
            activeWLEDS.push({
              id:wi,ip:wledIPs[wi],
              config:wleds[wi].config,
              effects:wleds[wi].effects,
              palettes:wleds[wi].palettes,
              presets:wleds[wi].presets,
              info:wleds[wi].info,
              state:wleds[wi].state
            });
          };
          io.emit('serverWLEDDataResp',[{r:true,c:'ok',d:activeWLEDS}]);
        }else{io.emit('serverWLEDDataResp',[{r:false,c:'noauth',d:null}])};
      });
      //----------
      ioSocket.on('clientRefreshAll',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientRefreshAll"');if((await valGrantClient(args[0].i.id))){io.emit('serverRefreshAllResp',[{r:true,c:'ok',d:wcData}])}else{io.emit('serverRefreshAllResp',[{r:false,c:'noauth',d:null}])}});
      //----------
      ioSocket.on('clientPing',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientPing"');io.emit('serverPingResp',[{r:true,c:'ok',d:netInfo.info.ip}])});
      //----------
      ioSocket.on('clientGetHN',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientGetHN"');io.emit('serverGetHNResp',[{r:true,c:'ok',d:netInfo.info.pc}])});
      //----------
      ioSocket.on('clientIsAuth',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientIsAuth"');
        let cIARes:WCSResponse={r:true,c:'',d:null};
        const isBan:boolean=await cIsBanned(args[0].i.ip);
        if(isBan){cIARes.r=false,cIARes.c='banned'}
        else{const isARes:boolean=await valGrantClient(args[0].i.id);cIARes.c=String(isARes),cIARes.d=isARes};
        io.emit('serverIsAuthResp',[cIARes]);
      });
      //----------
      ioSocket.on('clientAuth',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientAuth"');
        let cReqResp:WCSAuthReqResponse={r:true,c:'error',d:null};
        if(!isListen){cReqResp.c='!listen'}
        else{
          const cDevInfo:WCCClientDevice=args[0].i,authAct:'doauth'|'deauth'=args[0].d;
          if(authAct==='doauth'){
            await readDataFile();
            if((await valGrantClient(cDevInfo.id))){cReqResp={r:true,c:'granted',d:wcData}}
            else{
              const aGOnRes:false|'grant'|'deny'=isAutoGrantOn();
              wcWindow.setOverlayIcon((nativeImage.createFromPath((icoP('assets/wcc-window-notif-req-ico.png')))),'New Control Request');
              let authRes:number=-1,wasTO:boolean;
              if(aGOnRes!==false){wasTO=false;if(aGOnRes==='grant'){authRes=2}else{authRes=0}}
              else{const{result,to}=await doGrantPop(cDevInfo);authRes=result;wasTO=to};
              switch(authRes){
                case 0:wasTO?cReqResp.c='timeout':cReqResp.c='denied';break;
                case 1:cReqResp.c='banned';await addBanClient((netClients.filter(ncO=>ncO.ip===cDevInfo.ip)[0].mac));break;
                case 2:(await addGrantClient(cDevInfo))?cReqResp={r:true,c:'granted',d:wcData}:cReqResp.c='error';break;
              };
              wcWindow.setOverlayIcon(null,'');
            };
          }else{
            if((await valGrantClient(cDevInfo.id))){
              const dARes:boolean=await remGrantClient(cDevInfo.id);
              if(dARes){cReqResp.c='deauth'};
            };
          };
        };
        io.emit('serverAuthResp',[cReqResp]);
        wcWindow.webContents.send('doInvokeGetNetworkInfo');
      });
      //----------
      ioSocket.on('clientStatus',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientStatus"');
        if(args[0].connected){
          let ioCI:number=-1;
          const isC:WCIsIOClientResult|false=isIOClient(args[0].id);
          if(!isC){
            ioClients.push({id:args[0].id,sid:args[0].sId,authInfo:(await aCID2Info(args[0].id)),didOnline:false,didOffline:false});
            ioCI=ioClients.findIndex(c=>c.id===args[0].id);
          }else{
            ioCI=isC.i;
            if(!isC.o){ioClients[isC.i].authInfo=(await aCID2Info(args[0].id))}
          };
          const CO:WCIOClient=ioClients[ioCI];
          availCons('',CO);
          if(CO.authInfo){
            availCons('',CO.authInfo);
            if(args[0].sId!==ioClients[ioCI].sid){
              ioClients[ioCI].sid=args[0].sId;
              ioClients[ioCI].didOnline=false;
              ioClients[ioCI].didOffline=false;
            };
            if(!ioClients[ioCI].didOnline){doIOClientNotif('on',ioCI,CO.authInfo)};
          }
        }else{
          const isC:WCIsIOClientResult|false=isIOClient(args[0].id);
          if(isC){
            if(isC.o.authInfo){
              if(args[0].sId!==ioClients[isC.i].sid){ioClients[isC.i].sid=args[0].sId;ioClients[isC.i].didOnline=false;ioClients[isC.i].didOffline=false};
              if(!ioClients[isC.i].didOffline){doIOClientNotif('off',isC.i,isC.o.authInfo)};
            };
            ioClients=ioClients.filter(c=>c.id===args[0].id);
          };
        };
        io.emit('serverStatus',[{id:svrUUID,hostname:netInfo.info.pc,ip:svrInfo.ip,online:true,time:new Date()}]);
      });
      //----------
      ioSocket.on('clientSnippet',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientSnippet"');
        let cSRes:WCSResponse={r:true,c:'',d:null};
        const cDevInfo:WCCClientDevice=args[0].i;
        if((await cIsBanned(cDevInfo.ip))){cSRes.r=false;cSRes.c='banned'}
        else{
          let info:WCCServerSnippet={
            sdk:getSDKVersInfo(),svrStart:svrDidStart,isListen:isListen,isSleep:isSleep,syncStates:syncStates,zcUp:wcBonIsUp,sIOUp:ioUp,
            cueCounts:{group:0,device:0,led:0},
            wledCounts:{device:0,led:0}
          };
          for(let wi=0;wi<wleds.length;wi++){info.wledCounts.device++;info.wledCounts.led+=wleds[wi].info.leds.count};
          if(wcData!==null){info.cueCounts.group=wcData.tree.length;for(let gi=0;gi<wcData.tree.length;gi++){info.cueCounts.device+=wcData.tree[gi].dtCount;for(let di=0;di<wcData.tree[gi].dtDevices.length;di++){info.cueCounts.led+=wcData.tree[gi].dtDevices[di].info.ledCount}}};
          cSRes.c='ok';cSRes.d=info;
        };
        io.emit('serverSnippetResp',[cSRes]);
      });
      //----------
      ioSocket.on('clientData',async(args:any[])=>{availCons('[SOCKET.io|EVENT]','"clientData"');
        const cDevInfo:WCCClientDevice=args[0].i,cDataType:string=args[0].d.type,cDataProps:any=args[0].d.props;
        if((await valGrantClient(cDevInfo.id))){
          switch(cDataType){
            case 'rebootWLED':for(let wi=0;wi<wleds.length;wi++){if(dtlfxIsLive){return};if(wleds[wi]){const wled:WLEDClient=wleds[0];await wled.toggle()}};break;
            case 'updSettings':wcWindow.webContents.send('clientChangeSettings',[cDataProps.cat,cDataProps.opt,cDataProps.value]);break;
            case 'changeColor':wcWindow.webContents.send('clientSetColor',[cDataProps.color,cDataProps.complete]);break;
            case 'deviceSelectUpdate':wcWindow.webContents.send('deviceSelectUpdate',[cDataProps]);break;
            case 'toggleWLEDUDPSync':doWLEDToggleSync();break;
            case 'manualSleepWake':wcWindow.webContents.send('clientDoWakeSleep',[cDataProps]);break;
            case 'manualChime':wcWindow.webContents.send('clientDoChime',[cDataProps]);break;
            case 'wledFnChange':wcWindow.webContents.send('clientWLEDFnChange',[cDataProps]);break;
            case 'ledfxChangeEffect':wcWindow.webContents.send('ledfxChangeEffect',[cDataProps]);break;
            case 'ledfxChangeGrad':break;
            case 'clearWLEDEP':
              const clearPreset=async(wClient:WLEDClient):Promise<boolean>=>{await wClient.setPreset(0);return Promise.resolve(true)};
              const clearEffect=async(wClient:WLEDClient):Promise<boolean>=>{
                let oldState:any=wClient.state;
                for(let s=0;s<oldState.segments.length;s++){oldState.segments[s].effectId=0};
                await wClient.updateState(oldState);
                return Promise.resolve(true);
              };
              //----------
              if(dtlfxIsLive){return};
              let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
              for(let wi=0;wi<setWCs.length;wi++){if(cDataProps==='preset'){await clearPreset(setWCs[wi]);await doW(0.25)}else{await clearEffect(setWCs[wi]);await doW(0.25)}};
              break;
            case 'wledBright':if(dtlfxIsLive){return};adjustWLEDBright(cDataProps[0],cDataProps[1],cDataProps[2],cDataProps[3]);break;
            case 'allWhite':wcWindow.webContents.send('clientDoAllWhite',[cDataProps]);break;
            case 'audioSyncToggle':
              if(syncStates.audioSync===cDataProps){io.emit('serverData',['audioSync',syncStates.audioSync])}
              else{wcWindow.webContents.send('audioSyncToggle',[cDataProps])};
              break;
            case 'sshotSyncToggle':
              if(syncStates.sshotSync===cDataProps){io.emit('serverData',['sshotSync',syncStates.sshotSync])}
              else{wcWindow.webContents.send('animSShotToggle',[(cDataProps)?'start':'stop','client'])};
              break;
            case 'randomDark':if(dtlfxIsLive){return};wcWindow.webContents.send('clientRandomDark');
            case 'appStateIsActive':showLEDPollTo.client=cDataProps;break;
            case 'getDataRequest':
              switch(cDataProps){
                case 'ctrlData':
                  io.emit('serverData',['ctrlData',wcData]);
                  break;
              };
              break;
            default:return;
          };
        };
      });
      //----------
      ioSocket.on('clientNotifToast',(args:any[])=>{
        availCons('[SOCKET.io|EVENT]','"clientNotifToast"');
        showLocalNotifcation(args[0]);
      });
      //----------
      ioSocket.on('disconnect',(id:string)=>{availCons('[SOCKET.io|EVENT]','"disconnect" - '+id);
        if(id){const isC:WCIsIOClientResult|false=isIOClient(id);if(isC){if(isC.o.authInfo&&!isC.o.didOffline){doIOClientNotif('off',isC.i,isC.o.authInfo)};ioClients=ioClients.filter(c=>c.id===id)}};
      });
    });
    //----------
    io.listen(6969);
    svrListening=true;
    svrDidStart=new Date();
    ioUp=true;
    io.emit('serverStatus',[{id:svrUUID,hostname:netInfo.info.pc,ip:svrInfo.ip,online:true,time:new Date()}]);
    availCons('initSocket','[OK] Listening @ '+svrInfo.ip+':'+svrInfo.port);
    initBon();
    return Promise.resolve(true);
  }catch(e){availCons('initSocket',e);ioUp=false;svrListening=false;return Promise.resolve(false)}
}
//------------------------------------------------
async function killZ1BoxSVR():Promise<boolean>{
  availCons('killZ1BoxSVR','()...');
  if(z1bSVR!==null){
    try{
      await killZ1BSVR.terminate();
      z1bSVR=null;
      killZ1BSVR=null;
      return Promise.resolve(true);
    }catch(e){return Promise.resolve(false)};
  }else{return Promise.resolve(true)};
}
//------------------------------------------------
async function killSVR():Promise<boolean>{
  availCons('killSVR','()...');
  if(svrSVR!==null||svrListening===true){
    try{
      await svrSVRKill.terminate();
      svrSVR=null;
      svrSVRKill=null;
      svrListening=false;
      return Promise.resolve(true);
    }catch(e){return Promise.resolve(false)};
  }else{return Promise.resolve(true)};
}
//------------------------------------------------
async function initBon():Promise<boolean>{
  availCons('initBon','()...');
  if(wcBonInst!==null||wcBonIsUp===true){await killBon()};
  wcBonInst=new Bonjour(null,()=>{availCons('initBon','ERROR Initializing zeroConf/Bonjour Service')});
  wcBonSvr=wcBonInst.publish({name:svrUUID+'|'+svrInfo.ip,type:'http',port:9696});
  wcBonIsUp=true;
  netInfo.zConf.isUp=wcBonIsUp;
  return Promise.resolve(true);
}
//------------------------------------------------
function killBon():Promise<boolean>{
  availCons('killBon','()...');
  return new Promise((resolve)=>{
    if(wcBonInst!==null){
      try{wcBonInst.unpublishAll(()=>{wcBonInst.destroy();netInfo.zConf.name=svrUUID;wcBonSvr=wcBonInst=null;wcBonIsUp=netInfo.zConf.isUp=false;resolve(true)})}
      catch(e){resolve(false)}
    }else{resolve(true)};
  });
};
//------------------------------------------------
const isIOClient=(id:string):WCIsIOClientResult|false=>{const existI:number=ioClients.findIndex(c=>c.id===id);if(existI===-1){return false}else{return {i:existI,o:ioClients[existI]}}};
//------------------------------------------------
const doIOClientNotif=(onOff:'on'|'off',cI:number,acI:WCAuthClientInfo,data?:string)=>{
  let lN:WCNotifToast={type:'client'+onOff+'line',title:(acI.label.trim().length>0&&acI.label.trim()!=='?'?acI.label.trim():'wifiCUE User')+' ➔ '+(onOff==='on'?'𝗢𝗡':'𝗢𝗙𝗙')+'𝗟𝗜𝗡𝗘',msg:'ɪᴘ: '+acI.ip,duration:3000};
  if(data){lN.msg+='\n'+data};
  showNotification(lN,'server');
  ioClients[cI]['did'+capd(onOff)+'line']=true;
};

//-------------------------------------------------
const cIsBanned=async(clIP:string):Promise<boolean>=>{let isBanned:boolean=false;const ip2MacI:number=netClients.findIndex(ncO=>ncO.ip===clIP);if(ip2MacI!==-1){isBanned=await isBanClient(netClients[ip2MacI].mac)};if(isBanned){return Promise.resolve(true)}else{return Promise.resolve(false)}};
//-------------------------------------------------
const addBanClient=async(mac:string):Promise<boolean>=>{
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const rBanF=async():Promise<string[]|false>=>{const bfExist:boolean=await exists(wcBFile),{r,d}=await statSize(wcBFile);if(!bfExist||d===0){return Promise.resolve([])}else{try{const rR:string=await readFile(wcBFile,{encoding:'utf-8'});if(rR&&(Array.isArray(JSON.parse(rR)))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const wBanF=async():Promise<boolean>=>{
    let existBArr:any=[];
    const getExistBData:any=await rBanF();
    if(getExistBData===false){
      availCons('addBanClient','[ERROR]: Failed to read ./bans file');
      return Promise.resolve(false);
    }else{
      existBArr=getExistBData;
      if(existBArr.includes(mac)){
        availCons('addBanClient','[SKIPPED]: ./bans file already includes '+mac);
        return Promise.resolve(true);
      }else{
        existBArr.push(mac);
        const updBStr:string=JSON.stringify(existBArr);
        try{
          await writeFile(wcBFile,updBStr,{encoding:'utf-8'});
          availCons('addBanClient','[ADDED]: '+mac+' written to ./bans file - OK');
          return Promise.resolve(true)
        }catch(e){
          availCons('addBanClient','[ERROR]: Failed to write '+mac+' to ./bans file');
          return Promise.resolve(false);
        }
      };
    };
  };
  const addRes:boolean=await wBanF();
  if(addRes){
    let grantDataRes:any=await rGrantsF();
    if(grantDataRes){
      let matchId:string|false=false;
      for(const[k,v]of Object.entries(grantDataRes)){if(v['mac']===mac){matchId=k}};
      if(matchId){
        availCons('addBanClient','[INFO]: ./grants DOES include banned mac - removing...');
        delete grantDataRes[matchId];
        const wGrantsF=async(updGrantsObj:any):Promise<boolean>=>{const updGStr:string=JSON.stringify(updGrantsObj);try{await writeFile(wcGFile,updGStr,{encoding:'utf-8'});return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
        const writeNewGrantsRes:boolean=await wGrantsF(grantDataRes);
        if(writeNewGrantsRes){
          availCons('addBanClient','[SUCCESS]: Successfully Written Updated ./grants Removing '+mac)
        }else{availCons('addBanClient','[ERROR]: Failed to write updated ./grants file removing '+mac)};
      }else{availCons('addBanClient','[OK]: ./grants did not include banned mac')};
    }else{availCons('addBanClient','[ERROR]: Failed to read ./grants to check for banned mac')};
    availCons('addBanClient','[+ADDED]: '+mac+' to ./bans');
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('doInvokeRefreshNetClients')};
    return Promise.resolve(true);
  }else{
    availCons('addBanClient','[ERROR] Writing '+mac+' to ./bans Failed');
    return Promise.resolve(false);
  };
};
//------------------------------------------------
const isBanClient=async(mac:string):Promise<boolean>=>{
  const rBanF=async():Promise<string[]|false>=>{const bfExist:boolean=await exists(wcBFile),{r,d}=await statSize(wcBFile);if(!bfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcBFile,{encoding:'utf-8'});if(rR&&(Array.isArray(JSON.parse(rR)))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const readBFileRes:string[]|false=await rBanF();
  if(readBFileRes===false||readBFileRes.length===0){return Promise.resolve(false)}
  else{
    if(readBFileRes.includes(mac)){availCons('isBanClient','[YES] - ./bans file includes '+mac);return Promise.resolve(true)}
    else{return Promise.resolve(false)};
  };
};
//------------------------------------------------
const removeBanClient=async(mac:string):Promise<boolean>=>{
  const rBanF=async():Promise<string[]|false>=>{try{const rR:string=await readFile(wcBFile,{encoding:'utf-8'});if(rR&&(Array.isArray(JSON.parse(rR)))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}};
  const wBanF=async(updBanArr:string[]):Promise<boolean>=>{const updBStr:string=JSON.stringify(updBanArr);try{await writeFile(wcBFile,updBStr,{encoding:'utf-8'});return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  const bfExist:boolean=await exists(wcBFile),{r,d}=await statSize(wcBFile);
  if(!bfExist||d===0){
    availCons('removeBanClient','[SKIPPED]: ./bans file !exist');
    return Promise.resolve(true);
  }else{
    const banFileDataRes:string[]|false=await rBanF();
    if(!banFileDataRes){
      availCons('removeBanClient','[ERROR]: Reading ./bans file Failed');
      return Promise.resolve(false);
    }else{
      let newBanFileData:string[]=banFileDataRes;
      if(!newBanFileData.includes(mac)){
        availCons('removeBanClient','[SKIPPED]: ./bans file !include mac');
        return Promise.resolve(true);
      }else{
        newBanFileData=newBanFileData.filter(m=>m!==mac);
        const writeGFRes:boolean=await wBanF(newBanFileData);
        if(writeGFRes){
          availCons('removeBanClient','[+REMOVED]: '+mac+' from ./bans');
          if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('doInvokeRefreshNetClients')};
          return Promise.resolve(true);
        }else{
          availCons('removeBanClient','[ERROR] Writing UPD ./bans file');
          return Promise.resolve(false);
        };
      };
    };
  };
};
//------------------------------------------------
const addGrantClient=async(cIO:WCCClientDevice):Promise<boolean>=>{
  const genSalt=(l:number)=>{return crypto.randomBytes(Math.ceil(l/2)).toString().slice(0,l)};
  const sha512=(p:string,s:string)=>{const h:crypto.Hmac=crypto.createHmac('sha512',s);h.update(p);const v:string=h.digest('hex');return {s:s,h:v}};
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const wGrantsF=async(nGC:WCGrantClient):Promise<boolean>=>{let existGObj:any={};const getExistGData:any=await rGrantsF();if(getExistGData!==false){existGObj=getExistGData};existGObj[cIO.id]=nGC;const updGStr:string=JSON.stringify(existGObj);try{await writeFile(wcGFile,updGStr,{encoding:'utf-8'});return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  const shPass=async():Promise<boolean>=>{
    const rPW:string=cIO.id;
    const nS:string=genSalt(16);
    const{s,h}:any=sha512(rPW,nS);
    let nGCO:WCGrantClient={date:new Date(),hash:h,salt:s,label:cIO.hostname,ip:cIO.ip,mac:''};
    if(netInfo&&netInfo.clients&&netInfo.clients.length>0){
      const hasClI:number=netInfo.clients.findIndex((ncO:NetClients)=>ncO.ip===cIO.ip);
      if(hasClI!==-1){nGCO.mac=netInfo.clients[hasClI].mac};
    };
    const writeNewGrantRes:boolean=await wGrantsF(nGCO);
    if(writeNewGrantRes){
      if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('doInvokeRefreshNetClients')};
      return Promise.resolve(true);
    }else{return Promise.resolve(false)};
  };
  const aGCResult:boolean=await shPass();
  return Promise.resolve(aGCResult);
};
//------------------------------------------------
const valGrantClient=async(cId:string):Promise<boolean>=>{
  const doValidate=(p:string,hashP:any,salt:any):boolean=>{let h:any=crypto.createHmac('sha512',salt);h.update(p);p=h.digest('hex');return p==hashP};
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const readGFileRes:any=await rGrantsF();
  if(readGFileRes!==false&&readGFileRes.hasOwnProperty(cId)){
    const gCl:WCGrantClient=readGFileRes[cId];
    const isValid:boolean=doValidate(cId,gCl.hash,gCl.salt);
    return Promise.resolve(isValid);
  }else{return Promise.resolve(false)};
};
//------------------------------------------------
const aCID2Info=async(id:string):Promise<WCAuthClientInfo|false>=>{
  try{
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(null)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const readGFileRes:any=await rGrantsF();
  if(readGFileRes!==false&&readGFileRes.hasOwnProperty(id)){const cI:any=readGFileRes[id];return Promise.resolve({label:cI.label,ip:cI.ip,mac:cI.mac})}
  else{return Promise.resolve(false)};
  }catch(e){return Promise.resolve(false)};
}
//------------------------------------------------
const remGrantClient=async(cId:string):Promise<boolean>=>{
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(null)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const wGrantsF=async(updGrantsObj:any):Promise<boolean>=>{const updGStr:string=JSON.stringify(updGrantsObj);try{await writeFile(wcGFile,updGStr,{encoding:'utf-8'});return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  let readGFileRes:any=await rGrantsF();
  if(readGFileRes===null){return Promise.resolve(true)}
  else{
    if(readGFileRes===false){return Promise.resolve(false)}
    else{
      if(readGFileRes.hasOwnProperty(cId)){
        delete readGFileRes[cId];
        const writeUpdGFileRes:boolean=await wGrantsF(readGFileRes);
        if(writeUpdGFileRes){
          if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('doInvokeRefreshNetClients')};
          return Promise.resolve(true);
        }else{return Promise.resolve(false)};
      }else{return Promise.resolve(true)};
    };
  };
};
//------------------------------------------------
const isAutoGrantOn=():'grant'|'deny'|false=>{if(wcData&&wcData.settings.controlRequests.autoResponder.isOn){return wcData.settings.controlRequests.autoResponder.response}else{return false}};
//------------------------------------------------
const getGrantTO=():number=>{let defTO:number=10;if(wcData&&wcData.settings.controlRequests.timeout!==defTO){defTO=wcData.settings.controlRequests.timeout};return defTO};
//------------------------------------------------
const doGrantPop=async(cInfo:WCCClientDevice):Promise<{result:number,to:boolean}>=>{
  let abortCtrl=new AbortController(),wasTO:boolean=false;
  const grantBoxOpts:MessageBoxOptions={title:'Remote Control Requested',message:'! CONTROL REQUEST !\n'+cInfo.hostname+' ('+cInfo.ip+')\n[DENY] or [GRANT] the Request?\n\nTime Limit: Ten Seconds (10s)',type:'question',buttons:['❌ DENY','💀 BAN','✅ GRANT'],defaultId:2,cancelId:0,signal:abortCtrl.signal};
  wcWindow.show();wcWindow.moveTop();wcWindow.focus();wcWindow.flashFrame(true);
  const getTO:number=getGrantTO();
  const respTO=setTimeout(()=>{wasTO=true;abortCtrl.abort()},(getTO*1000));
  const rNo:number=(await dialog.showMessageBox(wcWindow,grantBoxOpts)).response;
  clearTimeout(respTO);wcWindow.flashFrame(false);
  return Promise.resolve({result:rNo,to:wasTO});
};
//////////////////////////////////////////////////
// MISC IPC HANDLERS/LISTENERS
//////////////////////////////////////////////////
ipcMain.handle('getFFPaths',async(e:any,args:any[]):Promise<any>=>{
  if(!ffPaths.ffmpeg||!ffPaths.ffplay||!ffPaths.ffprobe){await initFFMPEG()};
  return Promise.resolve(ffPaths)
});
//------------------------------------------------
ipcMain.on('openExplorerPath',(e:any,args:any[])=>{shell.showItemInFolder(args[0].replace(/\//g,'\\'))});
//------------------------------------------------
ipcMain.handle('handleTWTGetData',async(e:any,args:any[]):Promise<WCData|false>=>{
  const readDataRes:WCData|false=await readDataFile();
  if(readDataRes){return Promise.resolve(readDataRes)}
  else{return Promise.resolve(false)};
});
//------------------------------------------------
ipcMain.handle('handleTWTWriteData',async(e:any,args:any[]):Promise<boolean>=>{
  const readDataRes:WCData|false=await readDataFile();
  if(readDataRes){
    let baseWCD:WCData=readDataRes;
    baseWCD.twtSaveData=args[0];
    const writeDataRes:boolean=await writeDataFile(baseWCD);
    if(writeDataRes){
      if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('updateTWTData',[args[0]])};
      return Promise.resolve(true);
    }else{return Promise.resolve(false)};
  }else{return Promise.resolve(false)};
});
//------------------------------------------------
ipcMain.handle('handleGetData',async(e:any,args:any[]):Promise<WCData|false>=>{
  if(!wcDataRWInProg){
    wcDataRWInProg=true;
    const readDataRes:WCData|false=await readDataFile();
    wcDataRWInProg=false;
    if(readDataRes){return Promise.resolve(readDataRes)}
    else{return Promise.resolve(false)};
  }else{return Promise.resolve(false)};
});
//------------------------------------------------
ipcMain.handle('handleWriteData',async(e:any,args:any[]):Promise<boolean>=>{
  if(!wcDataRWInProg){
    wcDataRWInProg=true;
    const writeDataRes:boolean=await writeDataFile(args[0]);
    wcDataRWInProg=false;
    if(writeDataRes){return Promise.resolve(true)}else{return Promise.resolve(false)};
  }else{return Promise.resolve(false)};
});
//------------------------------------------------
ipcMain.handle('handleGetNetworkInfo',async(e:any,args:any[]):Promise<NetworkInfo>=>{
  if(!netInfo||args[0]){await getNetInfo()};
  return Promise.resolve(netInfo);
});
//------------------------------------------------
ipcMain.handle('handleToggleWCListen',async(e:any,args:any[]):Promise<boolean>=>{
  if(isListen){
    await killBon();
    await killSVR();
    isListen=false;
    netInfo.isListen=false;
  }else{
    await initSocket();
    isListen=true;
    netInfo.isListen=true;
  };
  await initTray();
  if(ioClients&&ioClients.length>0){io.emit('serverData',['isListen',isListen])};
  return Promise.resolve(isListen);
});
//-------------------------------------
ipcMain.handle('doAlert',async(e:any,args:any[])=>{
  const doAlert=async(aType:string,aTitle:string,aMsg:string):Promise<boolean>=>{
    const errBoxOpts:MessageBoxOptions={message:aMsg,type:aType,buttons:['OK'],defaultId:0,title:aTitle};
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(),errBoxOpts);
    return Promise.resolve(true);
  }
  await doAlert(args[0],args[1],args[2]);
  return true;
});
//----------------------------------------------
ipcMain.handle('doConfirmWake',async(e:any,args:any[]):Promise<boolean>=>{
  const doPopBox=async():Promise<number>=>{
    let wakeBoxOpts:MessageBoxOptions={title:'Wake wifiCUE Early?',type:'question',icon:natIco('wc-asleepwake-wakepop-ico.png'),message:'Scheduled wake time is '+args[0]+'\nAre you sure you want to wake now?',buttons:['Cancel','Wake Now'],defaultId:1,cancelId:0};
    return (await dialog.showMessageBox(wcWindow,wakeBoxOpts)).response;
  };
  const wakeConfRes:number=await doPopBox();
  if(wakeConfRes===1){return Promise.resolve(true)}else{return Promise.resolve(false)};
});
//----------------------------------------------
ipcMain.handle('listGrantClients',async(e:any,args:any[]):Promise<any|false>=>{
  const rGrantsF=async():Promise<any>=>{const gfExist:boolean=await exists(wcGFile),{r,d}=await statSize(wcGFile);if(!gfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcGFile,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const gFileData:any=await rGrantsF();
  if(gFileData===false){return Promise.resolve(false)}
  else{return Promise.resolve(gFileData)};
});
//----------------------------------------------
ipcMain.handle('listBanClients',async(e:any,args:any[]):Promise<WCBanClient[]|false>=>{
  const rBanF=async():Promise<any>=>{const bfExist:boolean=await exists(wcBFile),{r,d}=await statSize(wcBFile);if(!bfExist||d===0){return Promise.resolve(false)}else{try{const rR:string=await readFile(wcBFile,{encoding:'utf-8'});if(rR&&(Array.isArray(JSON.parse(rR)))){return Promise.resolve(JSON.parse(rR))}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}}};
  const bFileData:any=await rBanF();
  if(!bFileData){return Promise.resolve([])}
  else{return Promise.resolve(bFileData)};
});
//----------------------------------------------
ipcMain.handle('addBanClient',async(e:any,args:any[]):Promise<boolean>=>{
  await addBanClient(args[0]);
  return Promise.resolve(true);
});
//----------------------------------------------
ipcMain.handle('removeBanClient',async(e:any,args:any[]):Promise<boolean>=>{
  await removeBanClient(args[0]);
  return Promise.resolve(true);
});
//----------------------------------------------
ipcMain.handle('deauthClient',async(e:any,args:any[]):Promise<boolean>=>{
  const remRes:boolean=await remGrantClient(args[0]);
  if(remRes){return Promise.resolve(true)}
  else{return Promise.resolve(false)};
});
//----------------------------------------------
ipcMain.handle('doUpdCtrlData',(e:any,args:any[]):Promise<boolean>=>{
  wcData=args[0];
  if(ioClients&&ioClients.length>0){io.emit('serverData',['ctrlData',args[0]])};
  availCons('ipcMAIN|doUpdCtrlData','[SOCKET.IO] Sending wcData > ctrlData to Client!');
  return Promise.resolve(true);
});
//----------------------------------------------
ipcMain.on('doWinCtrlBtn',async(e:any,args:any[])=>{availCons('doWinCtrlBtn','('+args[0]+')...');winCtrl(args[0])});
//----------------------------------------------
ipcMain.handle('refreshNetClients',async(e:any,args:any[]):Promise<NetClients[]|false>=>{
  const freshClientsRes:false|NetClients[]=await getNetClients();
  return Promise.resolve(freshClientsRes);
});
//----------------------------------------------
ipcMain.on('setWCWinHeight',async(e:any,args:any[])=>{
  availCons('IPCMain|setWCWinHeight','to: '+String(args[0])+' (W) x '+String(args[1])+' (H)');
  if(wcWindow&&wcWindow.webContents){
    wcWindow.setSize(args[0],args[1],true);
  };
});
//----------------------------------------------
ipcMain.on('setOverlayIco',(e:any,args:any[])=>{wcWindow.setOverlayIcon((nativeImage.createFromPath((icoP('assets/'+args[0])))),args[1])});
//----------------------------------------------
ipcMain.on('updateIsSleeping',async(e:any,args:any[])=>{
  doKodiSleepWake(args[0]);
  io.emit('serverData',['isSleep',args[0]]);
  if(args[0]){wcWindow.setOverlayIcon((nativeImage.createFromPath((icoP('assets/wcc-window-notif-issleeping-ico.png')))),'Sleeping (Wake @ '+args[1]+')')}
  else{wcWindow.setOverlayIcon(null,'')};
  isSleep=args[0];
  lastWakeSleep=new Date();
  initTray();
  await doW(1);
  updCUEColors();updWLEDColors()
});
//----------------------------------------------
ipcMain.on('updateClientSettings',(e:any,args:any[])=>{io.emit('serverData',['settings',args[0]])});
//----------------------------------------------
ipcMain.on('updateClientDeviceSelect',(e:any,args:any[])=>{io.emit('serverData',['deviceSelect',args[0]])});
//----------------------------------------------
ipcMain.on('sendAwaitFnDone',(e:any,args:any[])=>{
  if(awaitFnsInProg.includes(args[0])){awaitFnsInProg=awaitFnsInProg.filter(n=>n!==args[0])}
  else{availCons('sendAwaitFnDone','ERROR: '+args[0]+' not found in awaitFnsInProg list')};
});
//////////////////////////////////////////////////
// ELECTRON/NATIVE NOTIFICATION FUNCTIONS
//////////////////////////////////////////////////
ipcMain.on('sendShowToastNotif',(e:any,args:any[])=>{showNotification(args[0],args[1])});
//------------------------------------------------
function showClientNotfication(tN:WCNotifToast){io.emit('serverNotifToast',[tN])};
//------------------------------------------------
function showLocalNotifcation(tN:WCNotifToast){
  const tIcoKeys:any={ok:'wcc-status-green-led.png',warn:'wcc-status-yellow-led.png',client:'wcc-client-big-ico.png',server:'wcc-server-big-ico.png',clientonline:'wc-client-online-notif-ico.png',clientoffline:'wc-client-offline-notif-ico.png',kodi:'wc-kodi-icon.png'};
  const genNIco=(fName:string):NativeImage|null=>{return nativeImage.createFromPath((icoP('assets/'+fName)))};
  let lNOpts:Electron.NotificationConstructorOptions={title:tN.title,body:tN.msg,silent:true,icon:(genNIco('wcicon.png')),urgency:'normal',hasReply:false,timeoutType:'default'};
  if(tN.duration===null){lNOpts.timeoutType='never'};
  if(tN.type==='err'){lNOpts.silent=false;lNOpts.urgency='critical';lNOpts.icon=(genNIco('wcc-status-red-led.png'))}
  else{lNOpts.icon=(genNIco(tIcoKeys[tN.type]))};
  new Notification(lNOpts).show();
};
//------------------------------------------------
function showNotification(notif:WCNotifToast,showTo:'client'|'server'|'both'){
  if(showTo==='both'){
    showClientNotfication(notif);
    showLocalNotifcation(notif)
  }else if(showTo==='client'){showClientNotfication(notif)}
  else{showLocalNotifcation(notif)};
  if(kodiServiceRunning){
    if(notif.type==='clientonline'||notif.type==='clientoffline'){
      let clientName:string=notif.title.split(' ')[0].trim();
      if(clientName.includes('-')){clientName=clientName.split('-')[0]};
      sendKodiNote('wifiCUE','CONTROL via '+clientName);
    };
  };
}
//////////////////////////////////////////////////
// GENERAL COLOR FUNCTIONS
//////////////////////////////////////////////////
ipcMain.on('doUpdColors',async(e:any,args:any[])=>{updCUEColors();updWLEDColors()});
//------------------------------------------------
ipcMain.on('setLED',async(e:any,args:any[])=>{
  sdk.CorsairSetLedColors(args[0],args[1])
});
//------------------------------------------------
ipcMain.handle('setAllWhiteLights',async(e:any,args:any[]):Promise<any>=>{
  z1bColor=[255,255,255];
  //if(z1bIsOnline){sendZ1BoxData('color',[255,255,255])};
  if(z1bMQTTOnline){z1bMQTTClient.publish('z1boxcolor','255,255,255')};
  for(let scI=0;scI<args[0].length;scI++){sdk.CorsairSetLedColors(args[0][scI].id,args[0][scI].colors)};
  let setWCs:WLEDClient[]=wleds;
  if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
  let allWJSON:string;
  for(let wi=0;wi<setWCs.length;wi++){
    setWCs[wi].info.name==='Zer0WLED6'?allWJSON=JSON.stringify({tt:0,seg:[{col:[[255,205,160]]}]}):allWJSON=JSON.stringify({tt:0,seg:[{col:[[0,0,0,255]]}]});
    await wledJSONReq(setWCs[wi].info.name,'post',allWJSON);
  };
  return Promise.resolve(true);
});
//////////////////////////////////////////////////
// ICUE FUNCTIONS
//////////////////////////////////////////////////
async function initCUESDK():Promise<boolean>{
  await cueGetConnStatus();
  if(cueSDKStatus.session.code===0&&cueSDKStatus.error.code===69){return Promise.resolve(false)};
  if(cueSDKStatus.session.code===2){await doW(3)};
  if((cueSDKStatus.error.code===0||cueSDKStatus.error.code===1)&&cueSDKStatus.session.code!==6){
    sdk.CorsairConnect(async(sS:any)=>{
      cueSDKStatus=await CUESS2Status(cueSDKStatus,sS);
      if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('cueSDKStatus',[cueSDKStatus])};
    });
  }
  return Promise.resolve(true);
};
//-------------------------------------------------
const getSDKVersInfo=():string=>{let vers:string='';cueSDKStatus.versions?vers+=cueSDKStatus.versions.clientVersion+'/'+cueSDKStatus.versions.serverVersion:vers+='Unknown';return vers};
//-------------------------------------------------
ipcMain.on('setCUEDefDevList',(e:any,args:any[])=>{setCUEDefDevList=args[0]});
//-------------------------------------------------
async function killICUE():Promise<boolean>{
  return new Promise(async(resolve)=>{
    let newDL:WCCUESetDeviceLED[]=[];
    for(let i=0;i<setCUEDefDevList.length;i++){newDL.push({id:setCUEDefDevList[i].id,colors:setCUEDefDevList[i].colors.map((ledCO:any)=>{return {id:ledCO.id,r:255,g:255,b:255,a:255}})})};
    for(let i=0;i<newDL.length;i++){sdk.CorsairSetLedColors(newDL[i].id,newDL[i].colors)};
    sdk.CorsairDisconnect();
    resolve(true);
  });
}
//------------------------------------------------
ipcMain.handle('getCUESDKStatus',async(e:any,args:any[]):Promise<SDKStatus>=>{
  if(cueSDKStatus===null){await cueGetConnStatus()};
  return Promise.resolve(cueSDKStatus);
})
//------------------------------------------------
async function cueGetConnStatus():Promise<SDKStatus>{
  const strV=(vO:any):string=>{return String(vO.major)+'.'+String(vO.minor)+'.'+String(vO.patch)};
  const discoVs=(sVO:any,sVHO:any):boolean=>{if(Object.values(sVO).every((sV:any)=>Number(sV)===0)&&Object.values(sVHO).every((sVH:any)=>Number(sVH)===0)){return true}else{return false}};
  let resCodes:number[]=[-1,-1],vStrs:string[]=['0.0.0','0.0.0','0.0.0'];
  try{
    const{error,data}=await sdk.CorsairGetSessionDetails();
    if(Number(error)===0&&(discoVs(data.serverVersion,data.serverHostVersion))){resCodes=[1,0]}else{resCodes=[0,0]};
    vStrs=[strV(data.clientVersion),strV(data.serverVersion),strV(data.serverHostVersion)];
  }catch(e){resCodes=[0,69];console.log(e)};
  cueSDKStatus={session:(getCUESessionStatus(resCodes[0])),error:(getCUEErrorStatus(resCodes[1])),versions:{clientVersion:vStrs[0],serverVersion:vStrs[1],serverHostVersion:vStrs[2]}};
  return Promise.resolve(cueSDKStatus);
}
//------------------------------------------------
ipcMain.handle('dType2Str',(e:any,args:any[])=>{return sdk.CorsairDeviceTypeToString(args[0])});
//------------------------------------------------
ipcMain.handle('handleGetDevices',async(e:any,args:any[]):Promise<CUEDevicesRaw>=>{
  let newCDevs:CUEDevicesRaw={count:<number>0,devices:<CUEDeviceRaw[]>[]};
  const cGDRes:any=sdk.CorsairGetDevices({deviceTypeMask:sdk.CorsairDeviceType.CDT_All});
  if(Number(cGDRes.error)!==0){cueSDKStatus.error=getCUEErrorStatus(Number(cGDRes.error));if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('cueSDKStatus',[cueSDKStatus])};return Promise.resolve(newCDevs)};
  if(cGDRes.data.length<1){return Promise.resolve(newCDevs)};
  const devices:CUEInfo[]=cGDRes.data;
  for(let rdI=0;rdI<devices.length;rdI++){
    newCDevs.count++;
    let thisDev:any={info:devices[rdI],pos:[],colors:[]};
    const{data:ledPositions}=sdk.CorsairGetLedPositions(devices[rdI].id);
    thisDev.pos=ledPositions;
    let rdLEDBC:any[]=ledPositions.map((p:any)=>({id:p.id,r:0,g:0,b:0,a:0}));
    sdk.CorsairGetLedColors(devices[rdI].id,rdLEDBC);
    thisDev.colors=rdLEDBC;
    newCDevs.devices.push(thisDev);
  };
  return Promise.resolve(newCDevs);
});
//------------------------------------------------
async function updCUEColors(){
  if(setCUEDefDevList===null||setCUEDefDevList.length===0){await getCUEBlankDeviceLEDs()};
  let dCA:WCCUEDeviceLEDColors[]=setCUEDefDevList;
  for(let ncI=0;ncI<dCA.length;ncI++){sdk.CorsairGetLedColors(dCA[ncI].id,dCA[ncI].colors)};
  if(wcWindow.webContents){wcWindow.webContents.send('svrUpdateCUEColors',[dCA])};
  if(ioClients.length>0){io.emit('serverColorUpdate',[dCA,true])};
}
//------------------------------------------------
async function getCUEBlankDeviceLEDs():Promise<WCCUEDeviceLEDColors[]>{
  if(setCUEDefDevList===null||setCUEDefDevList.length===0){if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('forceCUESetDefList');await doW(1)}};
  if(setCUEDefDevList===null||setCUEDefDevList.length===0){return Promise.resolve([])}
  else{return Promise.resolve(setCUEDefDevList)}
}
//------------------------------------------------
let myAA:any[]=[];let myCA:any[]=[];let myCDirs:any[]=[];
const rcO=(lId:number):{id:number,r:number,g:number,b:number,a:number}=>{const rca:number[]=myCA[(Math.floor(Math.random()*myCA.length))];return {id:lId,r:rca[0],g:rca[1],b:rca[2],a:255}};
//------------------------------------------------
ipcMain.handle('prepICUEAudioSync',async(e:any,args:any[]):Promise<boolean>=>{
  myAA=[];myCDirs=[];myCA=args[0];
  if(setCUEDefDevList===null||setCUEDefDevList.length===0){await getCUEBlankDeviceLEDs()};
  for(let rdI=0;rdI<setCUEDefDevList.length;rdI++){
    const{error,data:dInf}=sdk.CorsairGetDeviceInfo(setCUEDefDevList[rdI].id);
    if(!error){
      const dObj:any={id:setCUEDefDevList[rdI].id,count:dInf.ledCount,channels:dInf.channelCount,leds:setCUEDefDevList[rdI].colors};
      myAA.push(dObj);myCDirs.push({c:0,d:'u'});
      sdk.CorsairRequestControl(setCUEDefDevList[rdI].id,sdk.CorsairAccessLevel.CAL_ExclusiveLightingControlAndKeyEventsListening);
    };
  };
  for(let ndi=0;ndi<myAA.length;ndi++){for(let li=0;li<myAA[ndi].leds.length;li++){myAA[ndi].leds[li]=rcO(myAA[ndi].leds[li].id)}};
  for(let sdi=0;sdi<myAA.length;sdi++){sdk.CorsairSetLedColors(myAA[sdi].id,myAA[sdi].leds)};
  return Promise.resolve(true);
});
//-------------------------------------------------
ipcMain.on('setICUEAudioSync',async(e:any,args:any[])=>{
  for(let pui=0;pui<myAA.length;pui++){
    if(myCDirs[pui].c<=myAA[pui].count/myAA[pui].channels){myCDirs[pui].c++}else{myCDirs[pui].c=0;myCDirs[pui].d==='u'?myCDirs[pui].d='d':myCDirs[pui].d='u'};
    let pLO:any={};
    for(let puli=0;puli<myAA[pui].leds.length;puli++){
      if(myCDirs[pui].d==='u'){
        if(puli===0){pLO=myAA[pui].leds[puli];myAA[pui].leds[puli]=rcO(myAA[pui].leds[puli].id)}
        else{const b4O:any=myAA[pui].leds[puli];pLO.id=myAA[pui].leds[puli].id;myAA[pui].leds[puli]={id:pLO.id,r:pLO.r,g:pLO.g,b:pLO.b,a:pLO.a};pLO=b4O};
      }else{
        if(puli===(myAA[pui].leds.length-1)){myAA[pui].leds[puli]=rcO(myAA[pui].leds[puli].id)}
        else{myAA[pui].leds[puli]={id:myAA[pui].leds[puli].id,r:myAA[pui].leds[(puli+1)].r,g:myAA[pui].leds[(puli+1)].g,b:myAA[pui].leds[(puli+1)].b,a:myAA[pui].leds[(puli+1)].a}};
      };
      sdk.CorsairSetLedColors(myAA[pui].id,myAA[pui].leds);
    };
  };
});
//////////////////////////////////////////////////
// WLED FUNCTIONS
//////////////////////////////////////////////////
async function killWLEDDupes():Promise<boolean>{
  const exec=require('child_process').exec;
  let kDTO:any;
  return new Promise((resolve)=>{
    const killP=async(id:number):Promise<boolean>=>{return new Promise((resolve)=>{exec('powershell.exe -Command "Stop-Process -Id '+String(id)+'"',(error:any,stdout:any,stderr:any)=>{if(error||stderr||!stdout){availCons('killWLEDDupes','ERROR: Failed to Kill Dupe WLED Process ('+String(id)+')');resolve(false)}else{availCons('killWLEDDupes','SUCCESS: Killed Dupe WLED Process ('+String(id)+')');resolve(true)}})})};
    kDTO=setTimeout(()=>{resolve(false)},3000);
    exec('powershell.exe -Command "Get-Process WLED | fl Id"',async(error:any,stdout:any,stderr:any)=>{
      if(error||stderr||!stdout){clearTimeout(kDTO);resolve(true)}
      else{
        let pIdsArr:number[]=[];
        const rLs:any[]=stdout.split('\n');
        for(let li=0;li<rLs.length;li++){if(rLs[li].trim().startsWith('Id')){pIdsArr.push(Number(rLs[li].trim().split(' : ')[1]))}};
        if(pIdsArr.length>1){const lastPId:number=Math.max(...pIdsArr);for(let pi=0;pi<pIdsArr.length;pi++){if(pIdsArr[pi]!==lastPId){await killP(pIdsArr[pi])}}};
        clearTimeout(kDTO);
        resolve(true);
      };
    });
  });
}
//------------------------------------------------
ipcMain.on('wledCCIndivDevice',(e:any,args:any[])=>{
  let wcName:string=args[0],newCol:RGBColor|RGBWColor=args[1],type:string=args[2],wledCCIObj:any={tt:5,seg:[{col:[newCol]}]};
  if(type==='indiv'&&wledGroupSyncOn){wledCCIObj['udpn']={nn:true}};
  const wledCCIJSON:string=JSON.stringify(wledCCIObj);
  wledJSONReq(wcName,'post',wledCCIJSON);
});
//------------------------------------------------
const wledJSONReq=async(stripName:string,method:'get'|'post',reqData:any,to?:number):Promise<{r:boolean,d:any}>=>{
  if(dtlfxIsLive){return Promise.resolve({r:false,d:null})};
  let stripBaseURL:string='http://192.168.0.10'+stripName.replace('Zer0WLED','')+'/json/';
  const reqBaseConfig:AxiosRequestConfig={timeout:(to?to:10000),responseType:'json',headers:{'Content-Type':'application/json'}};
  try{
    let wjReq:any;
    if(method==='get'){wjReq=await axios.get(stripBaseURL+reqData,reqBaseConfig)}
    else{
      let readyData:string=reqData;
      if(!(await isVJ(reqData))){
        if(typeof reqData==='string'){availCons('wledJSONReq','Invalid Post Data');return Promise.resolve({r:false,d:'Invalid Post Data'})}
        else{const rDJSON:string=JSON.stringify(reqData);if(!(await isVJ(rDJSON))){availCons('wledJSONReq','Invalid Post Data');return Promise.resolve({r:false,d:'Invalid Post Data'})}else{readyData=rDJSON}}
      };
      wjReq=await axios.post(stripBaseURL+'state',readyData,reqBaseConfig)
    };
    if(wjReq.status===200&&!_.isEmpty(wjReq.data)&&!wjReq.data.hasOwnProperty('error')){
      if(method==='get'){return Promise.resolve({r:true,d:wjReq.data})}
      else{return Promise.resolve({r:true,d:wjReq.data.success})}
    }else{let rO:any={r:false,d:null};if(wjReq.data&&wjReq.data.hasOwnProperty('error')){rO.d='Error Code '+String(wjReq.data.error)};return Promise.resolve(rO)}
  }catch(kErr){
    if(kErr.code==='ECONNREFUSED'){return Promise.resolve({r:false,d:'Error: Connection Refused'})}
    else if(kErr.code==='ECONNABORTED'){return Promise.resolve({r:false,d:'Timeout'})}
    else{
      if(kErr.hasOwnProperty('response')){return Promise.resolve({r:false,d:kErr.response.status.toString()+' - '+kErr.response.statusText.toString()})}
      else{return Promise.resolve({r:false,d:'Error: Unspecified Error'})};
    };
  };
};
//-----------------------------------------------
async function wledSetGrpSyncOn(on:boolean):Promise<boolean>{
  availCons('wledSetGrpSyncOn','('+String(on)+')...');
  if(on){
    wledGroupSyncOn=true;
    for(let wi=0;wi<wleds.length;wi++){
      if(wleds[wi]){
        const sName:string=wleds[wi].info.name;
        const sUDPObj:any={udpn:onUDPs[sName]};
        const sUDPJSON:any=JSON.stringify(sUDPObj);
        await wledJSONReq(sName,'post',sUDPJSON);
        await doW(0.25);
      };
    };
    return Promise.resolve(true);
  }else{
    wledGroupSyncOn=false;
    for(let wi=0;wi<wleds.length;wi++){
      if(wleds[wi]){
        const sName:string=wleds[wi].info.name;
        const sUDPObj:any={udpn:offUDP};
        const sUDPJSON:any=JSON.stringify(sUDPObj);
        await wledJSONReq(sName,'post',sUDPJSON);
        await doW(0.25);
      }
    }
  }
}
//------------------------------------------------
ipcMain.handle('isDelayedWLEDInit',(e:any,args:any[]):Promise<boolean>=>{return Promise.resolve(willDoDelayedWLEDInit)});
//------------------------------------------------
async function initWLED():Promise<boolean>{
  availCons('initWLED','()...');
  const isDTLFXLiveRes:{r:boolean,d:any}=await wledJSONReq('Zer0WLED1','get','info');
  if(!isDTLFXLiveRes.r||(isDTLFXLiveRes.r&&isDTLFXLiveRes.d.live)){willDoDelayedWLEDInit=true;return Promise.resolve(false)};
  await killWLEDDupes();
  wleds=[];
  const nCIPs:string[]=netInfo.clients.map(c=>c.ip);
  if(wledIPs.length>0){
    for(let wi=0;wi<wledIPs.length;wi++){
      if(nCIPs.includes(wledIPs[wi])){
        try{
          let newWLED:WLEDClient=new WLEDClient({host:wledIPs[wi]});
          if((await newWLED.init())){
            wleds.push(newWLED);
            //-----------
            wleds[wi].on('update:info',(args:any)=>{
              if(!termAppInProg&&!dtlfxIsLive){
                if(args.hasOwnProperty('name')&&args.name&&args.hasOwnProperty('wifi')&&args.wifi&&args.wifi.hasOwnProperty('rssi')&&args.wifi.rssi&&wcWindow&&wcWindow.webContents){wcWindow.webContents.send('wledRSSI',[{n:args.name,v:args.wifi.rssi}])}
              }
            });
            //-----------
            wleds[wi].on('update:state',(args:any)=>{
              if(!termAppInProg&&!dtlfxIsLive){
                if(wleds[wi]){
                  if(!kodiVMInProg){
                    wleds[wi].state=args;
                    const wcIndex:number=wi,nStateObj:WLEDClientState=args,nMainSeg:WLEDClientSegment=nStateObj.segments[0],nPColorArr:(RGBColor|RGBWColor)=nMainSeg.colors[0];
                    //if(childW&&childW.webContents&&!syncStates.audioSync&&!syncStates.sshotSync){childW.webContents.send('wledColorChange',[nPColorArr])};
                    if(wcWindow&&wcWindow.webContents&&!syncStates.audioSync&&!syncStates.sshotSync){wcWindow.webContents.send('wledEventUpdateState',[{i:wcIndex,s:nStateObj}])};
                    if(ioClients&&ioClients.length>0){io.emit('serverData',['wledEventUpdateState',wcIndex,nStateObj])};
                  };
                  if(args&&args.hasOwnProperty('udpn')&&!_.isEmpty(args.udpn)){
                    let goodUDP:any={};wledGroupSyncOn?goodUDP=onUDPs[wleds[wi].info.name]:goodUDP=offUDP[wleds[wi].info.name];
                    if(!_.isEqual(args.udpn,goodUDP)){const gUDPJSON:any=JSON.stringify(goodUDP);wledJSONReq(wleds[wi].info.name,'post',gUDPJSON)}
                  }
                }
              }
            });
          };
        }catch(e){availCons('initWLED','ERROR Initiating '+wledIPs[wi]+': '+e)};
      }else{availCons('initWLED','SKIPPED '+wledIPs[wi]+': Not FOUND in netClients List')};
    };
    if(wleds.length>0){
      // Set RSSI & Sync Check INT
      rssiINT=setInterval(async()=>{
        if(!termAppInProg&&!dtlfxIsLive){
          let rssiArr:any[]=[];
          if(wleds&&wleds.length>0){
            for(let wsi=0;wsi<wleds.length;wsi++){
              try{
                wleds[wsi].refreshInfo();await doW(0.25);
                if(wleds[wsi]&&wleds[wsi].info&&wleds[wsi].info.hasOwnProperty('name')&&wleds[wsi].info.name&&wleds[wsi].info.hasOwnProperty('wifi')&&wleds[wsi].info.wifi&&wleds[wsi].info.wifi.hasOwnProperty('rssi')&&wleds[wsi].info.wifi.rssi){rssiArr.push({n:wleds[wsi].info.name,v:wleds[wsi].info.wifi.rssi})};
                wleds[wsi].refreshState();await doW(0.25);
                if(wleds[wsi].state&&wleds[wsi].state.hasOwnProperty('udpn')&&!_.isEmpty(wleds[wsi].state.udpn)){
                  let goodUDP:any={};wledGroupSyncOn?goodUDP=onUDPs[wleds[wsi].info.name]:goodUDP=offUDP[wleds[wsi].info.name];
                  if(!_.isEqual(wleds[wsi].state.udpn,goodUDP)){const gUDPJSON:any=JSON.stringify(goodUDP);wledJSONReq(wleds[wsi].info.name,'post',gUDPJSON)}
                };
              }catch(e){e=e;return};
            };
            if(rssiArr.length>0&&wcWindow&&wcWindow.webContents){wcWindow.webContents.send('wledRSSI',[rssiArr])};
          };
        }
      },600000);
      // Reset Colors/Bri to RealWhite/80%
      let wCs:WLEDClient[]=wleds;
      if(wledGroupSyncOn){wCs=wCs.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6')};
      for(let wci=0;wci<wCs.length;wci++){
        if(wCs[wci].info.name==='Zer0WLED6'){
          if(wCs[wci].state.brightness!==255||!_.isEqual(wCs[wci].state.segments[0].colors[0],[255,205,160])){
            const defCB:any=JSON.stringify({tt:10,bri:255,seg:[{col:[[255,205,160]]}]});
            await wledJSONReq(wCs[wci].info.name,'post',defCB);
          };
        }else{
          if(wCs[wci].state.brightness!==127||!_.isEqual(wCs[wci].state.segments[0].colors[0],[0,0,0,255])){
            const defCB:any=JSON.stringify({tt:10,bri:127,seg:[{col:[[0,0,0,255]]}]});
            await wledJSONReq(wCs[wci].info.name,'post',defCB);
          };
        };
      };
      return Promise.resolve(true)
    }else{return Promise.resolve(false)};
  }else{return Promise.resolve(false)};
};
//------------------------------------------------
ipcMain.handle('getWLEDGrpLeads',(e:any,args:any[]):Promise<string[]>=>{return Promise.resolve(wledGrpLeads)});
ipcMain.handle('getWLEDGrpMembs',(e:any,args:any[]):Promise<{[key:string]:string[]}>=>{return Promise.resolve(wledGrpMembrs)});
//------------------------------------------------
ipcMain.on('kbKnobAdjust',(e:any,args:any[])=>{if(args[0]==='brightness'){kbKnobAdjust(args[0],args[1])}else{kbKnobAdjust(args[0])}});
function kbKnobAdjust(type:string,incDec?:string){
  availCons('kbKnobAdjust','('+type+','+(incDec?incDec:'N/A')+')...');
  let wCs:WLEDClient[]=wleds;if(wledGroupSyncOn){wCs=wCs.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6')};
  if(!dtlfxIsLive){
    if(type==='brightness'){
      for(let wi=0;wi<wCs.length;wi++){
        let newB:number=wCs[wi].state.brightness;
        incDec==='inc'?newB=newB+25:newB=newB-25;
        if(newB>255){newB=255};if(newB<0){newB=0};
        wCs[wi].updateState({brightness:newB})
      }
    }else{
      for(let wi=0;wi<wCs.length;wi++){
        let newC:any;
        if(wCs[wi].info.name==='Zer0WLED6'){newC=(_.isEqual(wCs[wi].state.segments[0].colors[0],[0,0,0])?[255,205,160]:[0,0,0])}
        else{newC=(_.isEqual(wCs[wi].state.segments[0].colors[0],[0,0,0,0])?[0,0,0,255]:[0,0,0,0])};
        wCs[wi].setColor(newC);
      }
    }
  }
}
//------------------------------------------------
ipcMain.handle('getWLEDColors',(e:any,args:any[]):Promise<any[]>=>{
  if(dtlfxIsLive){return Promise.resolve([])};
  let colArrs:any[]=[];
  for(let wi=0;wi<wleds.length;wi++){
    if(wleds[wi]){
      const w:WLEDClient=wleds[wi];
      w.refreshState();
      colArrs.push(wleds[wi].state.segments[0].colors[0]);
    };
  };
  return Promise.resolve(colArrs);
});
//------------------------------------------------
async function updWLEDColors(){
  if(!dtlfxIsLive&&!syncStates.audioSync&&!syncStates.sshotSync){
    let resObj:WLEDAllClientCols={};
    for(let wi=0;wi<wleds.length;wi++){
      if(wleds[wi]){
        let segColorsArr:any[]=[];
        await wleds[wi].refreshState();
        for(let si=0;si<wleds[wi].state.segments.length;si++){segColorsArr.push(wleds[wi].state.segments[si].colors)};
        resObj[wleds[wi].info.name]=segColorsArr;
      };
    };
    if(wcWindow.webContents){wcWindow.webContents.send('svrUpdateWLEDColors',[resObj])};
    if(ioClients.length>0){io.emit('serverWLEDColorUpdate',[resObj])};
  };
}
//------------------------------------------------
ipcMain.handle('getWLEDS',async(e:any,args:any[]):Promise<WCActiveWLEDS[]>=>{
  if(dtlfxIsLive){return Promise.resolve([])};
  availCons('ipcMAIN|getWLEDS','()...');
  let activeWLEDS:WCActiveWLEDS[]=[];
  for(let wi=0;wi<wleds.length;wi++){if(wleds[wi]){const tWC:WLEDClient=wleds[wi],actWLEDObj:WCActiveWLEDS={id:wi,ip:'192.168.0.10'+tWC.info.name.replace('Zer0WLED',''),effects:tWC.effects,palettes:tWC.palettes,presets:tWC.presets,info:tWC.info,state:tWC.state};activeWLEDS.push(actWLEDObj)}};
  return Promise.resolve(activeWLEDS);
});
//-------------------------------------------------
ipcMain.handle('refreshWLED',async(e:any,args:any[]):Promise<any[]|false>=>{
  if(dtlfxIsLive){return Promise.resolve(false)};
  const refreshOpts:string[]=['Config','Context','Effects','Info','Palettes','Presets','State'];
  let resArr:any[]=[];
  if(refreshOpts.includes(capd(args[0]))){
    const methodStr:string='refresh'+capd(args[0]);
    for(let wi=0;wi<wleds.length;wi++){
        await wleds[methodStr]();
        await doW(0.25);
        resArr.push(wleds[args[0]]);
    };
    return Promise.resolve(resArr);
  }else{availCons('ipcMain|refreshWLED','ERROR: Unknown Refresh Option: '+capd(args[0]));return Promise.resolve(false)};
});
//-------------------------------------------------
ipcMain.handle('wledListEffects',async(e:any,args:any[]):Promise<any[]>=>{
  if(dtlfxIsLive){return Promise.resolve([])};
  let resArr:any[]=[];
  for(let wi=0;wi<wleds.length;wi++){
      await wleds[wi].refreshEffects();
      if(wleds[wi]&&wleds[wi].effects){resArr.push(wleds[wi].effects)}
      else{resArr.push(false)};
  };
  return Promise.resolve(resArr);
});
//-------------------------------------------------
ipcMain.handle('wledListPalettes',async(e:any,args:any[]):Promise<any[]>=>{
  if(dtlfxIsLive){return Promise.resolve([])};
  let resArr:any[]=[];
  for(let wi=0;wi<wleds.length;wi++){
      await wleds[wi].refreshPalettes();
      if(wleds[wi]&&wleds[wi].palettes){resArr.push(wleds[wi].palettes)}
      else{resArr.push(false)};
  };
  return Promise.resolve(resArr);
});
//-------------------------------------------------
ipcMain.handle('wledGetState',async(e:any,args:any[]):Promise<any[]>=>{
  if(dtlfxIsLive){return Promise.resolve([])};
  let resArr:any[]=[];
  for(let wi=0;wi<wleds.length;wi++){
      await wleds[wi].refreshState();
      if(wleds[wi]&&wleds[wi].state){resArr.push(wleds[wi].state)}
      else{resArr.push(false)};
  };
  return Promise.resolve(resArr);
});
//--------------------------------------------------
ipcMain.handle('wledSetColor',async(e:any,args:any[]):Promise<boolean>=>{
  if(dtlfxIsLive){return Promise.resolve(false)};
  const color:RGBColor|RGBWColor|string=args[0],trans:number=args[1];
  if(z1bMQTTOnline){
    let lcdColorArr:number[]=[];
    if(typeof color==='string'){lcdColorArr=[255,255,255]}
    else{lcdColorArr=[color[0],color[1],color[2]]};
    z1bColor=lcdColorArr;
    let z1boxcolorStr:string=String(lcdColorArr[0])+','+String(lcdColorArr[1])+','+String(lcdColorArr[2]);
    z1bMQTTClient.publish('z1boxcolor',z1boxcolorStr)
  };
  let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
  for(let wi=0;wi<setWCs.length;wi++){
    let ncJSONObj:any={tt:0,seg:[{col:[args[0]]}]};
    if(setWCs[wi].info.name==='Zer0WLED6'){
      if(color==='white'||(color[0]===255&&color[1]===255&&color[2]===255)){ncJSONObj.seg[0].col=[[255,205,160]]}
      else{ncJSONObj.seg[0].col=[[args[0][0],args[0][1],args[0][2]]]};
    }else{if(color==='white'||(color[0]===255&&color[1]===255&&color[2]===255)){ncJSONObj.seg[0].col=[[0,0,0,255]]}};
    const ncJSON:string=JSON.stringify(ncJSONObj);
    await wledJSONReq(setWCs[wi].info.name,'post',ncJSON);
  };
  return Promise.resolve(true);
});
//-------------------------------------------------
async function wledSetColor(color:RGBColor|RGBWColor,trans:number):Promise<boolean>{
  if(dtlfxIsLive){return Promise.resolve(false)};
  let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
  for(let wi=0;wi<setWCs.length;wi++){
    if(setWCs[wi].info.name==='Zer0WLED6'){await setWCs[wi].setColor([color[0],color[1],color[2]],{transition:trans})}
    else{await setWCs[wi].setColor([color[0],color[1],color[2],color[3]],{transition:trans})};
  };
  return Promise.resolve(true);
}
//-------------------------------------------------
ipcMain.handle('wledDoSleep',async(e:any,args:any[]):Promise<boolean>=>{
  if(z1bIsOnline){sendZ1BoxData('sleep',true)};
  const doSleepSeq=async(wClient:WLEDClient):Promise<boolean>=>{
    await wClient.refreshState();
    if(wClient.state.segments[0].effectId!==0){await wClient.setEffect(0,{transition:0})};
    wClient.setBrightness(0,{transition:15});
    return Promise.resolve(true);
  };
  if(syncStates.audioSync){wcWindow.webContents.send('traySync2Audio',['stop']);await doW(2)};
  if(syncStates.sshotSync){wcWindow.webContents.send('animSShotToggle',['stop']);await doW(2)};
  if(!dtlfxIsLive){
    let setWCs:WLEDClient[]=wleds;
    if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
    for(let wi=0;wi<setWCs.length;wi++){await doSleepSeq(setWCs[wi])};
  };
  return Promise.resolve(true);
});
//-------------------------------------------------
ipcMain.handle('wledDoWake',async(e:any,args:any[]):Promise<boolean>=>{
  if(z1bIsOnline){sendZ1BoxData('wake',true)};
  if(!dtlfxIsLive){
    let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
    for(let wi=0;wi<setWCs.length;wi++){
      if(setWCs[wi].info.name==='Zer0WLED6'){await wledJSONReq(setWCs[wi].info.name,'post',(JSON.stringify({tt:15,bri:204,seg:[{col:[[255,205,160]]}]})))}
      else{await wledJSONReq(setWCs[wi].info.name,'post',(JSON.stringify({tt:15,bri:204,seg:[{col:[[0,0,0,255]]}]})))};
    };
  };
  return Promise.resolve(true);
});
//-------------------------------------------------
ipcMain.handle('wledDoChimeStart',async(e:any,args:any[]):Promise<any>=>{
  if(!dtlfxIsLive&&!syncStates.audioSync&&!syncStates.sshotSync&&!isSleep&&!noteLightsInProg&&!chimeLightsInProg&&!kodiVMInProg){
    availCons('ipcMain|wledDoChimeStart','('+args[0]+')...');
    chimeLightsInProg=true;
    const cNo2PsId:any={4:11,3:12,2:13,1:14},chimePS:number=cNo2PsId[args[0]],chimeWait:number=(0.7*args[0])+1;
    let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4')};
    for(let wi=0;wi<setWCs.length;wi++){await srWLEDState('s',setWCs[wi].info.name);setWCs[wi].setPreset(chimePS)};
    await doW(chimeWait);
    return Promise.resolve(true);
  }else{return Promise.resolve(false)};
});
//-------------------------------------------------
  async function srWLEDState(saveRestore:'s'|'r',wcName:string):Promise<boolean>{
    const psNo:number=100+Number(wcName.replace('Zer0WLED',''));
    if(saveRestore==='s'){await wledJSONReq(wcName,'post',(JSON.stringify({psave:psNo})))}
    else{await wledJSONReq(wcName,'post',{tt:0,ps:psNo});await doW(0.25);await wledJSONReq(wcName,'post',(JSON.stringify({pdel:psNo})))}
    return Promise.resolve(true);
  }
//-------------------------------------------------
ipcMain.handle('wledDoChimeStop',async(e:any,args:any[]):Promise<boolean>=>{
  if(!dtlfxIsLive&&!syncStates.audioSync&&!syncStates.sshotSync&&!isSleep&&!noteLightsInProg&&!kodiVMInProg){
    let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4')};
    for(let wi=0;wi<setWCs.length;wi++){await srWLEDState('r',setWCs[wi].info.name)};
    chimeLightsInProg=false;
    return Promise.resolve(true);
  }else{return Promise.resolve(false)}
});
//-------------------------------------------------
async function doWLEDToggleSync():Promise<boolean>{
  availCons('doWLEDToggleSync','()...');
  if(!dtlfxIsLive){
    const newTogState:boolean=(wledGroupSyncOn?false:true);
    await wledSetGrpSyncOn(newTogState);
  };
  return Promise.resolve(true);
};
//-------------------------------------------------
ipcMain.on('wledToggleSync',async(e:any,args:any[])=>{
  availCons('IPCMAIN|wledToggleSync','()...');
  if(!dtlfxIsLive){await doWLEDToggleSync()}
});
//-------------------------------------------------
ipcMain.on('wledFnChange',async(e:any,args:any[])=>{
  if(dtlfxIsLive){return};
  availCons('wledFnChange',args);
  const wledDeviceIndex:number=args[0].index;
  const wledDev:WLEDClient=wleds[wledDeviceIndex];
  const wledFnType:string=args[0].type;
  const wledNewId:number=args[0].id;
  switch(wledFnType){
    case 'fxSpeed':await wledDev.setEffectSpeed(wledNewId);await doW(0.5);break;
    case 'fxInt':await wledDev.setEffectIntensity(wledNewId);await doW(0.5);break;
    case 'effects':
      await wledDev.setPreset(-1);
      await doW(0.5);
      await wledDev.setEffect(Number(wledNewId),{segmentId:0});
      break;
    case 'presets':
      await wledDev.setEffect(-1,{segmentId:0});
      await doW(0.5);
      await wledDev.setPreset((wledNewId+1));
      break;
  };
  await doW(0.5);
  initTray();
});
//-------------------------------------------------
ipcMain.on('serverAdjustWLEDBright',(e:any,args:any[])=>{
  adjustWLEDBright(args[0],args[1],args[2],args[3]);
})
//-------------------------------------------------
async function adjustWLEDBright(v:number,isSync:boolean,devIndex:number,wledName:string){
  if(dtlfxIsLive){return};
  const setB=async(wClient:WLEDClient,v:number):Promise<boolean>=>{if(wClient){try{await wClient.updateState({brightness:v});return Promise.resolve(true)}catch(e){return Promise.resolve(false)}}else{return Promise.resolve(false)}};
  let setWCIndex:number=wleds.findIndex((wc)=>wc.info.name===wledName);
  if(setWCIndex!==-1){
    const setWCBri:number=wleds[setWCIndex].state.brightness;
    if(isSync){
      if(wledName==='Zer0WLED2'||wledName==='Zer0WLED3'){
        const masterWCIndex:number=wleds.findIndex((wc)=>wc.info.name==='Zer0WLED1');
        if(masterWCIndex!==-1){
          const masterBri:number=wleds[masterWCIndex].state.brightness;
          if(setWCBri!==masterBri){await setB(wleds[setWCIndex],masterBri)}
        }
      }else if(wledName==='Zer0WLED5'){
        const masterWCIndex:number=wleds.findIndex((wc)=>wc.info.name==='Zer0WLED4');
        if(masterWCIndex!==-1){
          const masterBri:number=wleds[masterWCIndex].state.brightness;
          if(setWCBri!==masterBri){await setB(wleds[setWCIndex],masterBri)}
        }
      }else if(wledName==='Zer0WLED7'||wledName==='Zer0WLED8'||wledName==='Zer0WLED9'){
        const masterWCIndex:number=wleds.findIndex((wc)=>wc.info.name==='Zer0WLED6');
        if(masterWCIndex!==-1){
          const masterBri:number=wleds[masterWCIndex].state.brightness;
          if(setWCBri!==masterBri){await setB(wleds[setWCIndex],masterBri)}
        }
      }else{if(v!==setWCBri){await setB(wleds[setWCIndex],v)}}
    }else{if(v!==setWCBri){await setB(wleds[setWCIndex],v)}}
  };
}
//////////////////////////////////////////////////
// @HOME / MOTION SENSORS
//////////////////////////////////////////////////
ipcMain.on('pirsOn',(e:any,args:any[])=>{pirsPower=args[0]});
ipcMain.on('pirsInit',(e:any,args:any[])=>{pirsPower=args[0];pirsOnline=args[1];startMotionDetectListener()});
ipcMain.handle('getPIRWLEDIndexes',(e:any,args:any[]):Promise<any>=>{return Promise.resolve(pirWLEDIndexes)});
//-----------------------
async function killMDSVR():Promise<boolean>{
  if(mdSVR){
    try{
      await mdSVRKill.terminate();
      mdSVR=null;
      mdSVRKill=null;
      return Promise.resolve(true);
    }catch(e){return Promise.resolve(false)};
  }else{return Promise.resolve(true)};
}
//-----------------------
async function startMotionDetectListener(){
  const mdCons=(t:'i'|'req'|'res',m:string)=>{let pf:string='startMotionDetectListener|';t==='i'?pf+='INF':pf==='req'?pf+='REQ':pf+='RES';availCons(pf,m)};
  mdCons('i','STARTING MotionDetect SVR...');
  if(wleds&&wleds.length>0){
    for(let wi=0;wi<wleds.length;wi++){
      const wC:WLEDClient=wleds[wi];
      if(wC.info&&wC.info.hasOwnProperty('name')&&wC.info.name&&wC.info.name.startsWith('Zer0WLED')){
        const stripNo:number=Number(wC.info.name.toString().replace('Zer0WLED',''));
        pirWLEDIndexes[stripNo]=wi;
      }
    }
  };
  if(!_.isEmpty(pirWLEDIndexes)){
    availCons('startMotionDetectListener','Created pirWLEDIndex Object:');
    for(const[k,v]of Object.entries(pirWLEDIndexes)){availCons('startMotionDetectListener',' < '+String(k)+' > Zer0neWLED'+String(k)+' - WLEDS Index = '+String(v))};
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('setPIRWLEDIndexes',[pirWLEDIndexes])};
  }else{availCons('startMotionDetectListener','Failed to create pirWLEDIndex Object')};
  if(mdSVR){await killMDSVR()};
  try{
    mdSVR=http.createServer((req,res)=>{
      const isAuth=(ip:string,head:any):boolean=>{if(ip.startsWith('192.168.0.20')&&head.hasOwnProperty('zauth')&&head.zauth&&head.zauth.toString().trim().length>0&&head.zauth.toString().trim()==='*******3'){return true}else{return false}};
      const mdReqMethod:string=req.method.toLocaleLowerCase();
      const mdReqIP:string=req.socket.remoteAddress.replace('::ffff:','');
      const parsedUrl:url.UrlWithParsedQuery=url.parse(req.url,true);
      const mdReqPath:string=parsedUrl.pathname||' ';
      const mdReqQParam:string|null=parsedUrl.search||null;
      const mdReqHeads=req.headers;
      //------------
      if(!isAuth(mdReqIP,mdReqHeads)){res.writeHead(401);res.end();mdCons('req','[401] Unauthorized Client ('+mdReqIP+')')};
      switch(mdReqMethod){
        // [GET] Requests ------
        case 'get':
          mdCons('req','[GET] '+mdReqPath+(mdReqQParam?' with [QP] '+mdReqQParam:' ')+'from '+mdReqIP);
          switch(mdReqPath){
            default:res.writeHead(404);res.end();mdCons('res','[404] Bad Path');break;
          };
          break;
        // [POST] Requests ------
        case 'post':
          let rawD:string='';
          switch(mdReqPath){
            case '/status':
              req.on('data',(chunk)=>{rawD+=chunk});
              req.on('end',async()=>{
                if(rawD){
                  if(rawD&&rawD.toString().trim().length>0&&rawD.toString().trim().startsWith('pir')){
                    const pirNo:number=Number(rawD&&rawD.toString().trim().replace('pir',''));
                    wcWindow.webContents.send('motionDetectData',['status',pirNo]);
                  };
                };
                res.writeHead(200);res.end();
              });
              break;
            case '/motion':
              req.on('data',(chunk)=>{rawD+=chunk});
              req.on('end',async()=>{
                res.writeHead(200);res.end();
                if(rawD){
                  if(rawD&&rawD.toString().trim().length>0&&rawD.toString().trim().startsWith('pir')){
                    const pirNo:number=Number(rawD&&rawD.toString().trim().replace('pir',''));
                    if(pirsPower&&!_.isEmpty(pirWLEDIndexes)){
                      if(!dtlfxIsLive&&!isSleep&&!syncStates.audioSync&&!syncStates.sshotSync&&!noteLightsInProg&&!chimeLightsInProg&&!kodiVMInProg){
                        motionLightsTrigger(pirNo)
                      };
                    };
                    wcWindow.webContents.send('motionDetectData',['motion',pirNo]);
                  };
                };
              });
              break;
            default:res.writeHead(404);res.end();mdCons('res','[404] Bad Path');break;
          };
          break;
        // [BAD] Requests ------
        default:res.writeHead(405);res.end();mdCons('res','[405] Method Not Allowed ('+mdReqMethod+')');break;
      };
    }).listen(1010);
    mdSVRKill=createHttpTerminator({gracefulTerminationTimeout:1000,server:mdSVR});
    mdCons('i','STARTED MotionDetect SVR => RUNNING @ http://localhost:1010');
    await doW(1);
    const onUDPs:any={Zer0WLED1:{send:true,recv:true,sgrp:1,rgrp:1},Zer0WLED2:{send:false,recv:true,sgrp:0,rgrp:1},Zer0WLED3:{send:false,recv:true,sgrp:0,rgrp:1},Zer0WLED4:{send:true,recv:true,sgrp:2,rgrp:2},Zer0WLED5:{send:false,recv:true,sgrp:0,rgrp:2}};
    for(let wi=0;wi<wleds.length;wi++){
      if(wleds[wi]){
        const sName:string=wleds[wi].info.name;
        const sUDPObj:any={udpn:onUDPs[sName]};
        const sUDPJSON:any=JSON.stringify(sUDPObj);
        await wledJSONReq(sName,'post',sUDPJSON);
        await doW(0.25);
      };
    };
    if(!dtlfxIsLive){
      for(let wi=0;wi<wleds.length;wi++){
        if(wleds[wi]){
          const wC:WLEDClient=wleds[wi];
          if(wC.info.name==='Zer0WLED4'||wC.info.name==='Zer0WLED5'){wC.setBrightness(1)};
        };
      };
    }
  }catch(e){mdCons('i','ERROR: '+e)}
}
//////////////////////////////////////////////////
// MOTION LIGHTS
//////////////////////////////////////////////////
function motionLightsTrigger(pirNo:number){
  pirTCounts[pirNo]++;
  if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionTriggerData',[pirNo,{count:pirTCounts[pirNo],countTOS:pirCountSecsINT[pirNo].secs}])};
  if(pirTCounts[pirNo]===1){
    const trigMS:number=new Date().getTime();
    pirSTimes[pirNo]=trigMS;
    availCons('motionLights|TRIGGER','PIR '+String(pirNo)+' - [TRIGGER|Count]: '+String(pirTCounts[pirNo])+' / '+String(pirMinCount[pirNo])+' @ 0s');
    if(pirCountTO[pirNo]!==null){clearTimeout(pirCountTO[pirNo]);pirCountTO[pirNo]=null};
    pirCountTO[pirNo]=setTimeout(()=>{pirSTimes[pirNo]=0;pirTCounts[pirNo]=0;pirCountTO[pirNo]=null},(pirCountMaxTimeS[pirNo]*1000));
    if(pirCountSecsINT[pirNo].int!==null){clearInterval(pirCountSecsINT[pirNo].int);pirCountSecsINT[pirNo].int=null;pirCountSecsINT[pirNo].secs=pirCountMaxTimeS[pirNo]};
    pirCountSecsINT[pirNo].int=setInterval(()=>{
      if(pirCountSecsINT[pirNo].secs>0){
        pirCountSecsINT[pirNo].secs--;
        if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionTriggerData',[pirNo,{count:pirTCounts[pirNo],countTOS:pirCountSecsINT[pirNo].secs}])};
      }else{clearInterval(pirCountSecsINT[pirNo].int)}
    },1000);
  }else if(pirTCounts[pirNo]>1&&pirTCounts[pirNo]<pirMinCount[pirNo]){
    const nowMS:number=new Date().getTime();
    const msDiff:number=nowMS-pirSTimes[pirNo];
    const durStr:string=(msDiff/1000).toFixed(1)+'s';
    availCons('motionLights|TRIGGER','PIR '+String(pirNo)+' - [TRIGGER|Count]: '+String(pirTCounts[pirNo])+' / '+String(pirMinCount[pirNo])+' @ '+durStr);
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionTriggerData',[pirNo,{count:pirTCounts[pirNo],countTOS:pirCountSecsINT[pirNo].secs}])};
    return;
  }else if(pirTCounts[pirNo]>=pirMinCount[pirNo]){
    const nowMS:number=new Date().getTime();
    const msDiff:number=nowMS-pirSTimes[pirNo];
    const durStr:string=(msDiff/1000).toFixed(1)+'s';
    availCons('motionLights|TRIGGER','PIR '+String(pirNo)+' - [TRIGGER|Count]: '+String(pirTCounts[pirNo])+' / '+String(pirMinCount[pirNo])+' @ '+durStr);
    if(pirCountTO[pirNo]!==null){clearTimeout(pirCountTO[pirNo]);pirCountTO[pirNo]=null};
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionTriggerData',[pirNo,{count:pirTCounts[pirNo],countTOS:pirCountSecsINT[pirNo].secs}])};
    if(pirTCounts[pirNo]>pirMinCount[pirNo]){
      if(pirNo===1){if(webcamMotion){motionLightsOn(pirNo)}}
      else{motionLightsOn(pirNo)}
    }else{motionLightsOn(pirNo)};
  };
};
//-------------------------------------------------
function motionLightsOn(pirNo:number){
  const nowMS:number=new Date().getTime();
  const msDiff:number=nowMS-pirSTimes[pirNo];
  const durStr:string=(msDiff/1000).toFixed(1)+'s';
  if(!pirWLEDInProg[pirNo]){
    pirWLEDInProg[pirNo]=true;
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionCtrlData',[pirNo,{ctrl:pirWLEDInProg[pirNo],ctrlTOS:pirWLEDSecsINT[pirNo].secs}])};
    const motMS:number=new Date().getTime();
    pirSTimes[pirNo]=motMS;
    const motUTS:number=motMS/1000;
    const motDate:Date=fromUnixTime(motUTS);
    const motNice:string=format(motDate,'HH:mm:ss');
    availCons('motionLights|!MOTION','PIR '+String(pirNo)+' - [MOTION|Start]: @ '+motNice+' (0.0s)');
    let pirWLEDStripNos:number[]=[];if(wledGroupSyncOn){pirWLEDStripNos=pir2WLEDMapSync[pirNo]}else{pirWLEDStripNos=pir2WLEDMap[pirNo]};
    for(let pli=0;pli<pirWLEDStripNos.length;pli++){
      const stripIndex:number=pirWLEDIndexes[pirWLEDStripNos[pli]];
      const stripName:string=wleds[stripIndex].info.name;
      if(pirNo===1){
        const pir1MotionJSON:string=JSON.stringify({transition:0,bri:255});
        wledJSONReq(stripName,'post',pir1MotionJSON);
      }else if(pirNo===2){
        const wledZ1Index:number=wleds.findIndex((wc)=>wc.info.name==='Zer0WLED1');
        if(wledZ1Index!==-1){
          pir2PrevBri=wleds[wledZ1Index].state.brightness;
          pir2PrevColor=wleds[wledZ1Index].state.segments[0].colors[0];
          const stairStateJSON:string=JSON.stringify({tt:0,udpn:{nn:true},seg:[{bri:255,start:250,col:[[255,255,255,255]]}]});
          wledJSONReq('Zer0WLED1','post',stairStateJSON);
        }
      }else if(pirNo===3){
        //if(wcWindow&&wcWindow.webContents&&isSleep){wcWindow.webContents.send('clientDoWakeSleep',['wake'])}
      };
    };
  }else{
    availCons('motionLights|!MOTION','PIR '+String(pirNo)+' - [MOTION|Count]: '+String(pirTCounts[pirNo])+' / '+String(pirMinCount[pirNo])+' @ '+durStr)
  };
  if(pirWLEDTO[pirNo]!==null){
    clearTimeout(pirWLEDTO[pirNo]);pirWLEDTO[pirNo]=null;
    clearInterval(pirWLEDSecsINT[pirNo].int);pirWLEDSecsINT[pirNo].int=null;pirWLEDSecsINT[pirNo].secs=pirCtrlLastsS[pirNo];
  };
  pirWLEDTO[pirNo]=setTimeout(async()=>{
    const getAddSecsNow=getAddSecs(pirNo);
    if(getAddSecsNow>0){await doW(getAddSecsNow);motionLightsReset(pirNo)}
    else{motionLightsReset(pirNo)};
  },(pirCtrlLastsS[pirNo]*1000));
  pirWLEDSecsINT[pirNo].int=setInterval(()=>{
    if(pirWLEDSecsINT[pirNo].secs===0){
      if(pirWLEDSecsINT[pirNo].int!==null){
        clearInterval(pirWLEDSecsINT[pirNo].int);
        pirWLEDSecsINT[pirNo].int=null;
        pirWLEDSecsINT[pirNo].secs=pirCtrlLastsS[pirNo]
      }
    }else{
      if(pirNo===1){if(!webcamMotion){pirWLEDSecsINT[pirNo].secs--}}
      else{pirWLEDSecsINT[pirNo].secs--};
      if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionCtrlData',[pirNo,{ctrl:pirWLEDInProg[pirNo],ctrlTOS:pirWLEDSecsINT[pirNo].secs}])}
    };
  },1000);
};
//-------------------------------------------------
ipcMain.on('killPIRMotion',(e:any,args:any[])=>{motionLightsReset(args[0])});
//-------------------------------------------------
async function motionLightsReset(pirNo:number){
  if(pirWLEDTO[pirNo]!==null){clearTimeout(pirWLEDTO[pirNo]);pirWLEDTO[pirNo]=null};
  if(pirCountTO[pirNo]!==null){clearTimeout(pirCountTO[pirNo]);pirCountTO[pirNo]=null};
  if(pirWLEDSecsINT[pirNo].int!==null){clearInterval(pirWLEDSecsINT[pirNo].int);pirWLEDSecsINT[pirNo].int=null;pirWLEDSecsINT[pirNo].secs=pirCtrlLastsS[pirNo]};
  if(pirCountSecsINT[pirNo].int!==null){clearInterval(pirCountSecsINT[pirNo].int);pirCountSecsINT[pirNo].int=null;pirCountSecsINT[pirNo].secs=pirCountMaxTimeS[pirNo]};
  let pirWLEDStripNos:number[]=[];if(wledGroupSyncOn){pirWLEDStripNos=pir2WLEDMapSync[pirNo]}else{pirWLEDStripNos=pir2WLEDMap[pirNo]};
  for(let pli=0;pli<pirWLEDStripNos.length;pli++){
    const stripIndex:number=pirWLEDIndexes[pirWLEDStripNos[pli]];
    const stripName:string=wleds[stripIndex].info.name;
    if(pirNo===1){
      const pir1RestoreJSON:string=JSON.stringify({transition:100,bri:1});
      wledJSONReq(stripName,'post',pir1RestoreJSON);
      //adjustWLEDBright(1,wledGroupSyncOn,stripIndex,stripName)
    }else if(pirNo===2){
      const restStateJSON:string=JSON.stringify({tt:0,udpn:{nn:true},seg:[{bri:pir2PrevBri,start:0,col:[pir2PrevColor]}]});
      wledJSONReq('Zer0WLED1','post',restStateJSON)
    }else if(pirNo===3){availCons('motionLightsReset','TO for Pir3 Finished')};
  };
  const finTOMS:number=new Date().getTime();
  const finTOUTS:number=finTOMS/1000;
  const finTODate:Date=fromUnixTime(finTOUTS);
  const finTONice:string=format(finTODate,'HH:mm:ss');
  const motTOMS:number=pirCtrlLastsS[pirNo]*1000;
  const durMotMS:number=finTOMS-pirSTimes[pirNo]-motTOMS;
  const durMotNice:string=(durMotMS/1000).toFixed(1)+'s';
  availCons('motionLights|!MOTION','PIR '+String(pirNo)+' - [MOTION|Stop]: @ '+finTONice+' ('+durMotNice+')');
  pirSTimes[pirNo]=0;
  pirTCounts[pirNo]=0;
  pirWLEDInProg[pirNo]=false;
  if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionCtrlData',[pirNo,{ctrl:pirWLEDInProg[pirNo],ctrlTOS:pirWLEDSecsINT[pirNo].secs}])};
  if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('motionTriggerData',[pirNo,{count:pirTCounts[pirNo],countTOS:pirCountSecsINT[pirNo].secs}])};
}
//////////////////////////////////////////////////
// @HOME / NETDEV FUNCTIONS
//////////////////////////////////////////////////
function doRpiInfo(rawInfo:string){
  const iA:string[]=rawInfo.split('|');
  if(iA.length!==5||!iA.every((v:any)=>(v&&v.trim().length>0&&typeof v==='string'))){return};
  const rA:string[]=iA[1].split(','),dA:string[]=iA[2].split(',');
  let newPInfo:RPIInfo={
    cpu:{l:'pl',v:(Number(iA[0])/100),s:String(iA[0]),fx:'%'},
    ram:{l:'rm',v:(Number(rA[0])/Number(rA[1])),s:((Number(rA[0])/Number(rA[1]))*100).toFixed(0),fx:'%'},
    disk:{l:'df',v:(Number(dA[0])/Number(dA[1])),s:((Number(dA[0])/Number(dA[1]))*100).toFixed(0),fx:'%'},
    temp:{l:'tm',v:(Number(iA[3])),s:String(iA[3]),fx:'°C'},
    txp:{l:'tx',v:(Number(iA[4])),s:String(iA[4]),fx:'dBm'}
  };
  try{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('rpiInfo',[newPInfo])}}catch(e){e=e};
}
//------------------------------------------------
function doDebInfo(rawInfo:string){
  const iA:string[]=rawInfo.split('|');
  if(iA.length!==3||!iA.every((v:any)=>(v&&v.trim().length>0&&typeof v==='string'))){return};
  const rA:string[]=iA[1].split(','),dA:string[]=iA[2].split(',');
  let newDInfo:DebInfo={
    cpu:{l:'pl',v:(Number(iA[0])/100),s:String(iA[0]),fx:'%'},
    ram:{l:'rm',v:(Number(rA[0])/Number(rA[1])),s:((Number(rA[0])/Number(rA[1]))*100).toFixed(0),fx:'%'},
    disk:{l:'df',v:(Number(dA[0])/Number(dA[1])),s:((Number(dA[0])/Number(dA[1]))*100).toFixed(0),fx:'%'}
  };
  try{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('debInfo',[newDInfo])}}catch(e){e=e};
}
//------------------------------------------------
ipcMain.on('putty2RC',async(e:any,args:any[])=>{putty2RemoteComp(args[0])});
function putty2RemoteComp(ip:string){
  let tpw:string='';ip==='192.168.0.18'?tpw='***********':tpw='PianoFarm123!?';
  const puttySpawn=require('child_process').spawn,puttyProc=puttySpawn('putty',['-ssh','root@'+ip+':22','-pw',tpw]);
  puttyProc.on('error',(e:any)=>{availCons('putty2RemoteComp|ERROR',e)})
  puttyProc.on('exit',(c)=>{availCons('putty2RemoteComp|'+(c===0?'SUCCESS':'ERROR'),'Putty Window/Console Closed (Code '+String(c)+')')});
}
//------------------------------------------------
let rpiInfoINT:any=null,lastRawInfo:string='',debInfoINT:any=null,lastDRawInfo:string='';
let noteListenSVR:any,killNoteListenSVR:any;
function startNotifListener(){
  availCons('startNotifListener','()...');
  try{
    noteListenSVR=http.createServer(async(req,res)=>{
      const reqIP4:string=req.socket.remoteAddress.replace('::ffff:','').trim();
      if(reqIP4==='192.168.0.3'){
        if(req.headers.dtlfx.toString()==='config'){
          const configName:string=req.headers.dtlfxconfig.toString();
          if(z1bConfigName!==configName){z1bConfigName=configName};
          res.writeHead(200);res.end();
        }else if(req.headers.dtlfx.toString()==='ping'){
          res.writeHead(200,'pong',{'Content-Type':'text/html'});
          res.end('pong');
        }else if(req.headers.dtlfx.toString()==='started'){
          if(z1bConfigName!=='z1bonly'){
            dtlfxIsLive=true;
            try{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('dtlfxDidStartStop',['started'])}}catch(e){console.log(e)};
          };
          if(z1bSendVizInfo){await reqDTLFX('get','sendvizinfo')};
          res.writeHead(200);
          res.end();
        }else if(req.headers.dtlfx.toString()==='stopped'){
          if(z1bConfigName!=='z1bonly'){
            if(willDoDelayedWLEDInit){
              dtlfxIsLive=false;
              await doW(5);
              const dwiRes:boolean=await initWLED();
              if(dwiRes){
                let activeWLEDS:WCActiveWLEDS[]=[];
                for(let wi=0;wi<wleds.length;wi++){if(wleds[wi]){const tWC:WLEDClient=wleds[wi],actWLEDObj:WCActiveWLEDS={id:wi,ip:'192.168.0.10'+tWC.info.name.replace('Zer0WLED',''),effects:tWC.effects,palettes:tWC.palettes,presets:tWC.presets,info:tWC.info,state:tWC.state};activeWLEDS.push(actWLEDObj)}};
                wcWindow.webContents.send('dtlfxDidStartStop',['stopped',true,activeWLEDS]);
              }else{availCons('IPCMAIN|delayedInitWLED','ERROR: initWLED() Fn Failed');wcWindow.webContents.send('dtlfxDidStartStop',['stopped',true,'error'])}
            }else{dtlfxIsLive=false;wcWindow.webContents.send('dtlfxDidStartStop',['stopped',false])};
          };
          if(z1bConfigName!==null){z1bConfigName=null};
          res.writeHead(200);
          res.end();
        }else if(req.headers.dtlfx.toString()==='post'){
          let dRaw:string='';
          req.on('data',(chunk)=>{dRaw+=chunk});
          req.on('end',async()=>{
            if(dRaw&&dRaw.length>0&&(await isJSON(dRaw))){
              const postDataObj:any=JSON.parse(dRaw);
              // Process Post Here...
              let postRespData:any={r:true,d:{some:'data'}};
              res.writeHead(200,'OK',{'Content-Type':'application/json'});
              res.end(JSON.stringify(postRespData));
            }else{
              res.writeHead(400,'OK',{'Content-Type':'application/json'});
              res.end(JSON.stringify({r:false,d:null}));
            }
          })
        }
      }else if(req.socket.remoteAddress.toString().includes('192.168.0.11')){
        let dRawInfo:string='';
        req.on('data',(chunk)=>{dRawInfo+=chunk});
        req.on('end',async()=>{
          try{
            if(dRawInfo&&dRawInfo.length>0){
              if(dRawInfo!==lastDRawInfo){lastDRawInfo=dRawInfo;doDebInfo(dRawInfo)};
              if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('debOnline',[true])};
              if(debInfoINT!==null){clearTimeout(debInfoINT)};
              debInfoINT=setTimeout(()=>{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('debOnline',[false])}},20000);
            };
          }catch(e){e=e}
        });
        res.writeHead(200);res.end();
      }else if(req.socket.remoteAddress.toString().includes('192.168.0.18')){
        if(!kodiServiceRunning||kodiOnlineINT!==null){
          const kIsO:boolean=await checkKodiRunning();
          if(kIsO){kodiOnlineChecker('stop')};
        };
        let rawInfo:string='';
        req.on('data',(chunk)=>{rawInfo+=chunk});
        req.on('end',()=>{
          if(rawInfo&&rawInfo.length>0){
            if(rawInfo!==lastRawInfo){lastRawInfo=rawInfo;doRpiInfo(rawInfo)};
            if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('rpiOnline',[true])};
            if(rpiInfoINT!==null){clearTimeout(rpiInfoINT)};
            rpiInfoINT=setTimeout(()=>{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('rpiOnline',[false])}},20000);
          };
        });
        res.writeHead(200);res.end();
      }else{
        availCons('noteSVR|RECEIVED','['+req.method.toUpperCase()+'] from '+req.socket.remoteAddress.replace('::ffff:',''));
        if(!req.socket.remoteAddress.toString().includes('192.168.0.69')){res.writeHead(401);res.end();availCons('noteSVR|NOAUTH','Sent 401 Response')}
        else{
          if(req.method.toLocaleLowerCase()==='post'){
            // Removed Voice Command ref Tasker Issues
            return;
          }else{
            let noteType:string|null=null;
            if(req.headers.app.toString()==='ytKodi'){
              if(req.headers.hasOwnProperty('vid')&&typeof req.headers.vid==='string'&&req.headers.vid&&req.headers.vid.replace('https://www.youtube.com/watch?v=','').trim().length===11){
                const vIdStr:string=req.headers.vid.replace('https://www.youtube.com/watch?v=','').trim(),mWYTDLIndex:number|false=await getMWBrwsr('ytdl');
                if(mWYTDLIndex&&mWYTDLIndex!==-1&&moreWins[mWYTDLIndex]&&moreWins[mWYTDLIndex].webContents){moreWins[mWYTDLIndex].webContents.send('ytKodiVidPlay',[vIdStr])};
              };
            }else if(req.headers.app.toString()==='sleepwake'){
              if(isSleep){wcWindow.webContents.send('traySleepWakeNow',['wake'])}
              else{wcWindow.webContents.send('traySleepWakeNow',['sleep'])}
            }
            else if(req.headers.app.toString()==='rdark'){
              if(dtlfxIsLive){return};
              wcWindow.webContents.send('clientRandomDark')}
            else if(req.headers.app.toString()==='allon'){
              if(dtlfxIsLive){return};
              let setWCs:WLEDClient[]=wleds;
              if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
              const allWJSON:string=JSON.stringify({tt:0,on:true});
              for(let wi=0;wi<setWCs.length;wi++){await wledJSONReq(setWCs[wi].info.name,'post',allWJSON)};
            }else if(req.headers.app.toString()==='allwhite'){
              if(dtlfxIsLive){return};
              wcWindow.webContents.send('traySetAllWhiteLight');
            }else if(req.headers.app.toString()==='alloff'){
              if(dtlfxIsLive){return};
              let setWCs:WLEDClient[]=wleds;if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
              const allWJSON:string=JSON.stringify({tt:0,on:false});
              for(let wi=0;wi<setWCs.length;wi++){await wledJSONReq(setWCs[wi].info.name,'post',allWJSON)};
            }
            else if(req.headers.app.toString()==='com.google.android.apps.messaging'){noteType='sms'}
            else if(req.headers.app.toString()==='com.whatsapp'){noteType='whatsapp'}
            else if(req.headers.app.toString()==='com.google.android.gm'){noteType='gmail'};
            if(noteType!==null){if(dtlfxIsLive){return};doNewNoteLights(noteType)};
            res.writeHead(200);res.end();
          }
        };
      }
    }).listen(6666);
    killNoteListenSVR=createHttpTerminator({gracefulTerminationTimeout:1000,server:noteListenSVR});
    availCons('startNotifListener','NotifSVR Running @ http://localhost:6666');
  }catch(e){availCons('startNotifListener','ERROR: '+e)}
};
//------------------------------------------------
  async function doNewNoteLights(type:string){
    if(dtlfxIsLive){return};
    availCons('doNewNoteLights','('+type+')...');
    if(!syncStates.audioSync&&!syncStates.sshotSync&&!isSleep&&!noteLightsInProg&&!chimeLightsInProg&&!kodiVMInProg){
      noteLightsInProg=true;
      if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('startNoteICUE',[type])};
      let wledOrigSegs:any[]=[];
      let aLs:WLEDClient[]=wleds;if(wledGroupSyncOn){aLs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED4'||wc.info.name==='Zer0WLED6'||wc.info.name==='Zer0WLED10')};
      let aLMax:number[]=[];for(let mi=0;mi<aLs.length;mi++){aLMax.push(aLs[mi].info.leds.count)};
      let wledNoteSegs:any[]=[];
      for(let ni=0;ni<aLs.length;ni++){
        let isWS:boolean=false;if(aLs[ni].info.name==='Zer0WLED6'){isWS=true};
        const noteSeg:any=await getWledNoteSegs(type,aLMax[ni],isWS);
        wledNoteSegs.push(noteSeg);
      };
      for(let oi=0;oi<aLs.length;oi++){wledOrigSegs.push(aLs[oi].state.segments)};
      for(let bi=0;bi<aLs.length;bi++){await aLs[bi].updateState({segments:wledNoteSegs[bi]})};
      await doW(1);
      let cgs:number=0;
      const alts=setInterval(async()=>{
        cgs++;
        if(cgs<9){
          for(let ci=0;ci<aLs.length;ci++){
            !wledNoteSegs[ci][1].reverse?wledNoteSegs[ci][1].reverse=true:wledNoteSegs[ci][1].reverse=false;
            await aLs[ci].updateState({segments:wledNoteSegs[ci]});
          };
        }else{
          clearInterval(alts);
          for(let ri=0;ri<aLs.length;ri++){
            await aLs[ri].deleteSegment(1);
            await aLs[ri].updateState({segments:wledOrigSegs[ri]});
          };
          noteLightsInProg=false;
          if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('stopNoteICUE')};
        };
      },250);
    }else{availCons('doNewNoteLights','SKIPPED - Audio Sync Running')};
  };
//------------------------------------------------
async function getNetDevs():Promise<WCNetDevs[]>{
  return new Promise((resolve)=>{
    const exec=require('child_process').exec,
    sNet:string=netInterface.gateway.substring(0,netInterface.gateway.length-1);
    try{exec('powershell.exe -Command "ping '+meD.ip+' -n 1"')}catch(e){e=e};
    try{
      exec('powershell.exe -Command "arp -a"',(e:any,stdo:any,stde:any)=>{
        let nDs:WCNetDevs[]=[],tOs:string[]=[];
        if(e||stde||!stdo){return Promise.resolve([])}
        else{
          const rLs:any[]=stdo.split('\n');
          for(let i=0;i<rLs.length;i++){
            const rL:string=rLs[i].trim();
            if(rL.length>0&&!rL.includes('Interface')&&!rL.includes('Internet Address')){
              const dP:string[]=rL.trim().split(/\s+/);
              if(dP.length>0){
                if(dP[0].includes(sNet)){
                  nDs.push({ip:dP[0],mac:dP[1].replace(/-/gi,'').toLowerCase()})
                };
              };
            };
          };
          if(nDs.length>0){
            for(let toi=0;toi<nDs.length;toi++){
              if(nDs[toi]&&nDs[toi].hasOwnProperty('ip')&&nDs[toi].ip){
                try{
                  exec('powershell.exe -Command "ping '+nDs[toi].ip+' -n 1"',(e:any,stdo:any,stde:any)=>{
                    let nDs:WCNetDevs[]=[];
                    if(e||stde||!stdo){return Promise.resolve([])}
                    else{
                      const rLs:any[]=stdo.split('\n');
                      for(let i=0;i<rLs.length;i++){
                        const rL:string=rLs[i].trim();
                        if(rL.length>0&&rL.includes('host unreachable')){tOs.push(nDs[toi].ip)}
                      }
                    }
                  });
                }catch(e){e=e};
              }
            };
          };
          nDs=nDs.filter(o=>o&&o.hasOwnProperty('ip')&&o.ip&&!tOs.includes(o.ip));
          resolve(nDs);
        };
      });
    }catch(e){return Promise.resolve(lastNDs)};
  });
}
//-------------------------------------------------
async function checkStatLights(data:WCCheckStat){
  if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('clientDoWakeSleep',[(data.status==='arrive'?'wake':'sleep')])};
};
//-------------------------------------------------
function gLDs(){return lastNDs};
//-------------------------------------------------
async function toggleDeviceNetStatDetect(){
  availCons('toggleDeviceNetStatDetect','()...');
  if(!devNSDActive){
    lastNDs=await getNetDevs();
    devNSDInt=setInterval(async()=>{
      const gNDRes:WCNetDevs[]=await getNetDevs();
      if(!_.isEqual(gNDRes,gLDs())){
        if((_.some(gNDRes,meD))){checkStatLights({status:'arrive',time:new Date()})}
        else{checkStatLights({status:'leave',time:new Date()})};
        lastNDs=gNDRes;
      };
    },3000);
    devNSDActive=true;
  }else{
    clearInterval(devNSDInt);
    devNSDActive=false;
  };
}
//////////////////////////////////////////////////
// KODI API FUNCTIONS
//////////////////////////////////////////////////
function kId():number{return (Math.floor(1000+Math.random()*9000))};
function setKodiURL(ip:string){kodiBURL='http://'+ip+':8080/jsonrpc'};
async function decKodiAH(ah?:any):Promise<string|false>{
  let tryAH:any;ah?tryAH=ah:tryAH=kodiAH;
  if(!tryAH||!tryAH.hasOwnProperty('Authorization')||tryAH.Authorization==='None'){return Promise.resolve(false)}
  else{
    const decRes:string=Buffer.from((tryAH.Authorization.replace('Basic ','').trim()),'base64').toString('utf8');
    return Promise.resolve(decRes)
  }
};
async function setKodiAH(auth:boolean,up?:any):Promise<boolean>{if(auth&&up){const b64UP:string=Buffer.from(up.u+':'+up.p,'utf8').toString('base64');kodiAH={Authorization:'Basic '+b64UP}}else{kodiAH={Authorization:'None'}};const writeUPRes:{r:boolean,d?:any}=await rwKodiAuth('w',{auth:kodiAH,ip:kodiServerIP});if(writeUPRes.r){return Promise.resolve(true)}else{return Promise.resolve(false)}};
async function delKodiAuth():Promise<boolean>{const kaPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/ka');try{await unlink(kaPath);return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
async function rwKodiAuth(action:'r'|'w',auth?:any):Promise<{r:boolean,d?:any}>{
  const kaPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/ka');
  const rAuth=async():Promise<{r:boolean,d:any}>=>{
    if(!(await exists(kaPath))||(await statSize(kaPath)).d===0){return Promise.resolve({r:false,d:null})};
    try{const rR:string=await readFile(kaPath,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){availCons('rwKodiAuth','Kodi Auth File [READ] - OK');return Promise.resolve({r:true,d:JSON.parse(rR)})}else{return Promise.resolve({r:false,d:'ERROR: JSON Parse Failed'})}}catch(e){console.log(e);return Promise.resolve({r:false,d:e})}};
  const wAuth=async(data:any):Promise<boolean>=>{const kaStr:string=JSON.stringify(data);try{await writeFile(kaPath,kaStr,{encoding:'utf-8'});availCons('rwKodiAuth','Kodi Auth File [WRITE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  if(action==='r'){return Promise.resolve((await rAuth()))}
  else{return Promise.resolve({r:(await wAuth(auth))})};
};
//------------------------------------------------
ipcMain.handle('needsKodiUPAuth',async(e:any,args:[]):Promise<{r:boolean,d:any}>=>{
  if(promptKUPs){
    let oldDec:string|false=await decKodiAH();
    if(!oldDec){const retryAHRes:{r:boolean,d?:any}=await rwKodiAuth('r');if(retryAHRes.r){oldDec=await decKodiAH(retryAHRes.d)}};
    if(!oldDec){return Promise.resolve({r:true,d:{auth:true,up:{u:'',p:''}}})}
    else{
      const upSplit:string[]=oldDec.split(':');
      return Promise.resolve({r:true,d:{auth:true,up:{u:upSplit[0],p:upSplit[1]}}});
    }
  }else{return Promise.resolve({r:false,d:{hasKodi:hasKodi}})};
});
//------------------------------------------------
async function checkKodiRunning():Promise<boolean>{
  const{r,d}=await kodiReq('JSONRPC.Ping',{},3000);
  if(r&&d&&d==='pong'){kodiServiceRunning=true;if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiIsRunning',[true])}}
  else{kodiServiceRunning=false;if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiIsRunning',[false])}};
  return Promise.resolve(r);
}
//------------------------------------------------
ipcMain.handle('updateKodiAH',async(e:any,args:any[]):Promise<{r:boolean,d:any}>=>{
  const newAH:any=args[0];
  const saveRes:boolean=await setKodiAH(newAH.auth,(newAH.auth?newAH.up:null));
  if(saveRes){
    if(kodiBURL){
      const testCredsRes:{r:boolean,d:any}=await kodiReq('JSONRPC.Ping',{},1500);
      if(testCredsRes.r&&testCredsRes.d==='pong'){
        if(!kodiServiceRunning){startKodiService()};
        return Promise.resolve({r:true,d:['ok','credentials saved successfully','authorized with '+kodiServerIP+' - OK']});
      }else{
        availCons('',testCredsRes);
        if(typeof testCredsRes.d==='object'&&testCredsRes.d.hasOwnProperty('status')&&testCredsRes.d.status===401){
          kodiAH=null;await delKodiAuth();
          return Promise.resolve({r:false,d:['fail','username and/or password invalid','tested with '+kodiServerIP+' - FAILED']});
        }else{return Promise.resolve({r:true,d:['part','credentials saved successfully','test error with '+kodiServerIP+' - unknown error']})};
      }
    }else{return Promise.resolve({r:true,d:['part','credentials saved successfully','not tested - no kodi server found']})};
  }else{return Promise.resolve({r:false,d:['fail','failed to save credentials','check file permissions']})};
});
//------------------------------------------------
async function initKodiAPI():Promise<{kodi:boolean,auth:boolean}>{
  availCons('initKodiAPI','()...');
  const gKA:{r:boolean,d?:any}=await rwKodiAuth('r');
  if(gKA.r&&gKA.d){kodiAH=gKA.d.auth;kodiServerIP=gKA.d.ip}else{kodiAH=null};
  const fKIPRes:{ip:string,auth:boolean}|false=await findKodiIP();
  if(fKIPRes!==false){
    let kIP:string='192.168.0.18',kAuth:boolean=true;
    if(fKIPRes){
      if(fKIPRes.hasOwnProperty('ip')&&fKIPRes.ip&&fKIPRes.ip.startsWith('192.168.0.')){kIP=fKIPRes.ip};
      if(fKIPRes.hasOwnProperty('auth')&&typeof fKIPRes.auth==='boolean'){kAuth=fKIPRes.auth};
    };
    setKodiURL(kIP);
    availCons('initKodiAPI','Found Kodi Server @ '+kIP+' | Auth: '+String(kAuth));
    return Promise.resolve({kodi:true,auth:true});
  }else{availCons('initKodiAPI','No Kodi Servers Found');return Promise.resolve({kodi:false,auth:false})};
}
//------------------------------------------------
async function findKodiIP():Promise<{ip:string,auth:boolean}|false>{
  let ok:string[]=[],maybe:string[]=[];
  if(kodiServerIP&&kodiServerIP.length>0){
    setKodiURL(kodiServerIP);
    const{r,d}=await kodiReq('JSONRPC.Ping',{},1500);
    if(r&&d==='pong'){
      const nCIndex:number=netClients.findIndex(nc=>nc.ip===kodiServerIP);
      if(nCIndex!==-1){netClients[nCIndex].name='Kodi Server'};
      return Promise.resolve({ip:kodiServerIP,auth:true});
    };
  }else{
    if(netClients.length===0){return Promise.resolve(false)}
    else{
      const cIPList:string[]=netClients.map(c=>c.ip);
      for(let nci=0;nci<cIPList.length;nci++){
        setKodiURL(cIPList[nci]);
        const{r,d}=await kodiReq('JSONRPC.Ping',{},1500);
        if(r&&d==='pong'){ok.push(cIPList[nci])}
        if(!r&&d!=='NOTKODI'&&d!=='TO'){maybe.push(cIPList[nci])};
      };
      if(ok.length>0){
        const nCIndex:number=netClients.findIndex(nc=>nc.ip===ok[0]);
        if(nCIndex!==-1){netClients[nCIndex].name='Kodi Server';kodiServerIP=netClients[nCIndex].ip};
        return Promise.resolve({ip:ok[0],auth:true});
      }else{
        if(maybe.length>0){
          const nCIndex:number=netClients.findIndex(nc=>nc.ip===maybe[0]);
          if(nCIndex!==-1){netClients[nCIndex].name='Kodi Server';kodiServerIP=netClients[nCIndex].ip};
          return Promise.resolve({ip:maybe[0],auth:false});
        }else{return Promise.resolve(false)};
      };
    };
  }
}
//------------------------------------------------
function gTDurMS(sT:Date):number{const stMS:number=getTime(sT),eTMS:number=getTime(new Date());return (eTMS-stMS)};
//------------------------------------------------
ipcMain.on('fetchSIInfo',(e:any,args:any[])=>{getSIInfo()});
async function getSIInfo():Promise<SIInfo|null>{
  let newSIInfo:SIInfo=defSIInfo;
  try{
    newSIInfo.dfSize=(await si.fsSize());
    z1bFSInfo=newSIInfo.dfSize;
    newSIInfo.usb=(await si.usb());
    newSIInfo.netStats=(await si.networkStats());
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('SIInfo',[newSIInfo])};
    return Promise.resolve(newSIInfo);
  }catch(e){console.log(e);return Promise.resolve(null)}
}
//------------------------------------------------
async function startHWInfo():Promise<any>{
  availCons('getHWInfo','()...');
  const icLogsPath:string=path.normalize('C:\\Users\\owenl\\Documents\\iCUELogs\\*.csv');
  const hwiLogPath:string=path.normalize('C:\\Users\\owenl\\Documents\\iCUELogs\\hwi\\log.csv');
  const cpRawLog=async():Promise<boolean>=>{return new Promise(async(resolve)=>{exec('powershell.exe -Command "cp '+icLogsPath+' '+hwiLogPath+'"',(err,stdout,stderr)=>{if(err){console.log(err);resolve(false)}else{resolve(true)}})})};
  const rLL=async():Promise<HWIInfo|false>=>{
    try{const lldata:string=await readFile(hwiLogPath,{encoding:'utf8'}),allLs:string[]=lldata.split('\r\n');
      if(allLs&&allLs.length>1){
        const valSufRx:RegExp=/^(\d+(\.\d+)?)(RPM|°C|%)$/,
        llArr:any[]=allLs[allLs.length-2].split(',').filter((o:string,i:number)=>i!==0&&o.match(valSufRx)!==null).map((o:string,i:number)=>({v:Number(o.match(valSufRx)[1]),fx:o.match(valSufRx)[3]}));
        let hwiObj:any={
          mb:{fan:llArr[0],temp:llArr[1]},
          cpu:{temp:llArr[2],load:llArr[3]},
          gpu1:{fan:llArr[4],temp:{v:((llArr[5].v+llArr[6].v)/2),fx:llArr[5].fx},load:llArr[7]},
          gpu2:{temp:llArr[6],load:llArr[8]},
          cfans:{v:[llArr[9].v,llArr[10].v,llArr[11].v,llArr[12].v,llArr[13].v,llArr[14].v],s:llArr[9].fx},
          pump:{rpm:llArr[15],temp:llArr[16]}
        };
        return Promise.resolve(hwiObj);
      }else{return Promise.resolve(false)}
    }catch(e){return Promise.resolve(false)}
  };
  const doHWI=async()=>{
    if((await cpRawLog())){
      const rLLRes:HWIInfo|false=await rLL();
      const netStatsRes:si.Systeminformation.NetworkStatsData[]=await si.networkStats();
      if(!termAppInProg&&rLLRes!==false&&wcWindow&&wcWindow.webContents){
        z1bHWInfo=rLLRes;
        wcWindow.webContents.send('HWInfo',[rLLRes]);
        z1bNETInfo=netStatsRes;
        wcWindow.webContents.send('SINetStats',[netStatsRes]);
      };
    }
  }
  //------------
  doHWI();
  hwiINT=setInterval(async()=>{doHWI()},12000);
  //------------
  getSIInfo();
}
//------------------------------------------------
ipcMain.on('ocs0ServReboot',(e:any,args:any[])=>{availCons('ocs0ServReboot','()...');exec('powershell.exe -Command plink -batch -ssh root@192.168.0.11 -pw PianoFarm123!? reboot',(err,stdout,stderr)=>{if(err){console.log(err)}})})
//------------------------------------------------
ipcMain.on('kodiQCFn',async(e:any,args:any[])=>{
  availCons('kodiQCFn','(['+args[0]+','+(args[1]?args[1]:'null')+'])...');
  const cmd:string=args[0];
  let data:any|null;if(args[1]&&args[1]!==null){data=args[1]};
  if(cmd==='Application.Quit'){await kodiReq(cmd,null)}
  else if(cmd==='startx'||cmd==='reboot'||cmd==='startkodi'){
    let baseCMD:string='plink -batch -ssh root@'+kodiServerIP+' -pw *********** ';
    const sshCMD=async(c:string):Promise<boolean>=>{
      if(c==='startx'){await kodiReq('Application.Quit',null);await doW(3);baseCMD+='"startx"'}
      else if(c==='startkodi'||cmd==='reboot'){baseCMD+='"reboot"'};
      return new Promise(async(resolve)=>{exec('powershell.exe -Command '+baseCMD,(err,stdout,stderr)=>{if(err){console.log(err);resolve(false)}else{resolve(true)}})})
    };
    await sshCMD(cmd)
  }else if(cmd==='viewmode'){
    const gVMRes:{r:boolean,d:any}=await kodiReq('Player.GetViewMode',null);
    availCons('',gVMRes);
    if(gVMRes.r&&gVMRes.d&&gVMRes.d.hasOwnProperty('viewmode')&&gVMRes.d.viewmode.length>0){
      if(gVMRes.d.viewmode!=='normal'&&gVMRes.d.viewmode!=='zoom'){return}
      else{
        let newVM:string|null=null;gVMRes.d.viewmode==='normal'?newVM='zoom':newVM='normal';
        await kodiReq('Player.SetSpeed',{playerid:1,speed:0});
        await kodiReq('Player.SetViewMode',{viewmode:newVM});
        await kodiReq('Player.SetSpeed',{playerid:1,speed:1});
      }
    }else{return};
  }else if(cmd==='zoomies'){await kodiReq('Player.Open',{item:{file:'/home/shares/Zooms/Zoomies.m3u'}})}
  else if(cmd.includes('Input.')){await kodiReq(cmd,null)}
  else if(cmd==='Application.SetVolume'){await kodiReq('Application.SetVolume',{volume:data+'rement'})}
  else if(cmd==='Application.SetMute'){await kodiReq('Application.SetMute',{mute:'toggle'})}
  else if(cmd==='GUI.ActivateWindow'){if(data==='addon'){await kodiReq(cmd,{window:'videos',parameters:['addons','Name=Otaku']})}else{await kodiReq(cmd,{window:data})}}
});
//------------------------------------------------
async function kodiReq(method:string,params:any,to?:number):Promise<{r:boolean,d:any}>{
  try{
    const thisKID:number=kId();
    let kReqBase:any={jsonrpc:'2.0',id:thisKID,method:method};if(params){kReqBase['params']=params};
    let kReqOpts:any={timeout:(to?to:10000)};if(kodiAH&&typeof kodiAH==='object'){kReqOpts['headers']=kodiAH};
    const{status,statusText,data}=await axios.post(kodiBURL,kReqBase,kReqOpts);
    if(status===200&&data&&data.id===thisKID){
      if(!data.hasOwnProperty('error')){return Promise.resolve({r:true,d:data.result})}
      else{return Promise.resolve({r:false,d:'ERROR: ('+String(data.error.code)+') - '+data.error.data.message})};
    }else{return Promise.resolve({r:false,d:{status:status,msg:statusText}})};
  }catch(kErr){
    if(kErr.code==='ECONNREFUSED'){return Promise.resolve({r:false,d:'NOTKODI'})}
    else if(kErr.code==='ECONNABORTED'){return Promise.resolve({r:false,d:'TO'})}
    else{
      if(kErr.hasOwnProperty('response')){return Promise.resolve({r:false,d:{status:kErr.response.status,msg:kErr.response.statusText}})}
      else{return Promise.resolve({r:false,d:null})};
    };
  };
}
//------------------------------------------------
const setKStatPos=async(player:any,item:any,status:string):Promise<boolean>=>{
  let dC:boolean=false;
  if(!kodiActivePlyrs.map(p=>p.playerid).includes(player.playerid)){kodiActivePlyrs.push(player)};
  if(!_.isEqual(kodiPlyr.item,item)){kodiPlyr.item=item;dC=true};
  if(kodiPlyr.status!==status){
    if((kodiPlyr.status==='stopped'||kodiPlyr.status==='loading')&&status==='playing'&&kodiPlyr.pos.total===0){
      const{r,d}=await kodiReq('Player.GetProperties',{properties:['totaltime','time','percentage'],playerid:player.playerid});
      if(r){
        if(d.hasOwnProperty('percentage')){kodiPlyr.pos.perc=d.percentage/100};
        if(d.hasOwnProperty('totaltime')){kodiPlyr.pos.total=((d.totaltime.hours*3600)+(d.totaltime.minutes*60)+d.totaltime.seconds)};
        if(d.hasOwnProperty('time')){kodiPlyr.pos.time=((d.time.hours*3600)+(d.time.minutes*60)+d.time.seconds)};
      };
    };
    kodiPlyr.status=status;
    dC=true;
  };
  if((status==='loading'||status==='playing')&&!kodiPosLooping){await startStopKodiPosLoop('start')};
  if(dC){
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}])};
    const mWYTDLIndex:number|false=await getMWBrwsr('ytdl');
    if(mWYTDLIndex&&mWYTDLIndex!==-1){
      if(moreWins[mWYTDLIndex]){
        moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrEvent',[{plyr:kodiPlyr,vm:kodiVolMute}])
      }
    };
  };
  return Promise.resolve(true);
}
//------------------------------------------------
ipcMain.on('doKodiPlyrSeek',async(e:any,args:any[])=>{
  availCons('ipcMain|doKodiPlyrSeek','Seek to '+String(args[0])+'%');
  if(kodiPlyr.status!=='stopped'){
    if(kodiActivePlyrs.length<1){await updKodiActPlyr();if(kodiActivePlyrs.length<1){return}};
    availCons('',{playerid:kodiActivePlyrs[0].playerid,value:{percentage:args[0]}});
    await kodiReq('Player.Seek',{playerid:kodiActivePlyrs[0].playerid,value:{percentage:args[0]}});
  };
});
//------------------------------------------------
function startStopKodiPosLoop(action:string):Promise<boolean>{
  if(action==='start'){
    if(!kodiPosLooping){
      kodiPosINT=setInterval(()=>{
        if(kodiPlyr.status!=='paused'&&kodiPlyr.pos.total!==0){
          kodiPlyr.pos.time++;
          kodiPlyr.pos.perc=kodiPlyr.pos.time/kodiPlyr.pos.total;
          if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiPlyrPosUpdate',[kodiPlyr.pos])}
        };
      },1000);
      kodiPosLooping=true;
      return Promise.resolve(true);
    };
  }else{
    if(kodiPosLooping){
      clearInterval(kodiPosINT);
      kodiPosLooping=false
    };
    return Promise.resolve(true);
  };
};
//------------------------------------------------
async function startKodiWSL():Promise<{r:boolean,d:any}>{
  let o:boolean=false,e:boolean=false,to:boolean=false,err:any;
  const sock=new WebSocket('ws://'+kodiServerIP+':9090/jsonrpc');
  sock.onopen=(e:any)=>{availCons('kodiSock|Event|ON.OPEN','OPENED!');o=true};
  sock.onclose=(e:any)=>{availCons('kodiSock|Event|ON.CLOSE','CLOSED!');o=false};
  sock.onerror=(e:any)=>{availCons('kodiSock|Event|ON.ERROR','ERROR');e=true};
  sock.onmessage=async(e:any)=>{
    const eJ:any=JSON.parse(e.data);
    availCons('kodiSock|Event|ON.MESSAGE=>NOTIF',eJ.method);
    availCons('',eJ);
    switch(eJ.method){
      // GUI -------------
      case 'GUI.OnScreensaverActivated':break;
      case 'GUI.OnScreensaverDeactivated':break;
      // Input -----------
      case 'Input.OnInputRequested':await doKodiInput('start');break;
      case 'Input.OnInputFinished':await doKodiInput('stop');break;
      // Application -----
      case 'Application.OnVolumeChanged':
        doKodiVolChange(eJ.params.data);
        break;
      // Player ----------
      case 'Playlist.OnAdd':
        break;
      case 'Playlist.OnClear':
        if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
        break;
      case 'Player.OnAVChange':
        if(kodiWLEDState==='seeking'||kodiWLEDState==='paused'){await doKodiWLEDFX('stop')};
        if(eJ.params.data.item&&!_.isEmpty(eJ.params.data.item)&&!_.isEqual(kodiPlyr.item,eJ.params.data.item)){
          let didC:boolean=false;
          if(kodiPlyr.item!==null){
            for(const[k,v]of Object.entries(eJ.params.data.item)){
              if(kodiPlyr.item.hasOwnProperty(k)){if(kodiPlyr.item[k]!==v){kodiPlyr.item[k]=v;didC=true}}
              else{kodiPlyr.item[k]=v;didC=true};
            };
          }else{kodiPlyr.item=eJ.params.data.item;didC=true};
          if(didC){
            if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}])};
            const mWYTDLIndex:number|false=await getMWBrwsr('ytdl');
            if(mWYTDLIndex&&mWYTDLIndex!==-1){
              if(moreWins[mWYTDLIndex]){
                moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrStart',[{plyr:kodiPlyr,vm:kodiVolMute}])
              }
            };
          }
        };
        break;
      case 'Player.OnPlay':
        await setKStatPos(eJ.params.data.player,eJ.params.data.item,'loading');
        if(!eJ.params.data.item.hasOwnProperty('file')){
          if(kodiWLEDState!=='loading'){
            if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
            await doKodiWLEDFX('start','loading');
          };
        };
        const mWYTDLIndexOP:number|false=await getMWBrwsr('ytdl');
        if(mWYTDLIndexOP&&mWYTDLIndexOP!==-1){
          if(moreWins[mWYTDLIndexOP]){
            moreWins[mWYTDLIndexOP].webContents.send('mwKodiPlyrStart',[{plyr:kodiPlyr,vm:kodiVolMute}])
          }
        };
        break;
      case 'Player.OnAVStart':
        await setKStatPos(eJ.params.data.player,eJ.params.data.item,'playing');
        if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
        const mWYTDLIndexOAVS:number|false=await getMWBrwsr('ytdl');
        if(mWYTDLIndexOAVS&&mWYTDLIndexOAVS!==-1){
          if(moreWins[mWYTDLIndexOAVS]){
            moreWins[mWYTDLIndexOAVS].webContents.send('mwKodiPlyrStart',[{plyr:kodiPlyr,vm:kodiVolMute}])
          }
        };
        break;
      case 'Player.OnResume':
        await setKStatPos(eJ.params.data.player,eJ.params.data.item,'playing');
        if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
        break;
      case 'Player.OnPause':
        await setKStatPos(eJ.params.data.player,eJ.params.data.item,'paused');
        if(kodiWLEDState!=='paused'){
          if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
          await doKodiWLEDFX('start','paused');
        };
        break;
      case 'Player.OnStop':
        if(kodiPosLooping){await startStopKodiPosLoop('stop')};
        kodiPlyr={item:null,status:'stopped',pos:{total:0,time:0,perc:0}};
        if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}])};
        const mWYTDLIndexOS:number|false=await getMWBrwsr('ytdl');
        if(mWYTDLIndexOS&&mWYTDLIndexOS!==-1){
          if(moreWins[mWYTDLIndexOS]){
            moreWins[mWYTDLIndexOS].webContents.send('mwKodiPlyrStop',[{plyr:kodiPlyr,vm:kodiVolMute}])
          }
        };
        if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
        break;
      case 'Player.OnSeek':
        if(kodiWLEDState!=='seeking'){
          if(kodiWLEDState!==null){await doKodiWLEDFX('stop')};
          await doKodiWLEDFX('start','seeking');
        };
        await updKodiPlyrPos(eJ.params.data.player);
        break;
      // System ----------
      case 'System.OnQuit':
      case 'System.OnRestart':
        await doKodiWLEDFX('stop');
        await doKodiInput('stop');
        stopKodiService();
        break;
      //------------------
      default:availCons('NOTE:',eJ);
    };
  };
  return new Promise(async(resolve)=>{
    const initTO=setTimeout(()=>{to=true},10000);
    const initINT=setInterval(()=>{
      if(to){clearInterval(initINT);resolve({r:false,d:'to'})}
      else{
        if(o&&!e){clearTimeout(initTO);clearInterval(initINT);resolve({r:true,d:null})}
        else if(e){clearTimeout(initTO);clearInterval(initINT);resolve({r:false,d:err})}
      };
    },250);
  });
}
//----------------------------------------------
ipcMain.on('kodiPlayerAction',async(e:any,args:any[])=>{
  switch(args[0]){
    case 'toggleMute':
      let newMute:boolean;kodiVolMute.muted?newMute=false:newMute=true;
      await kodiReq('Application.SetMute',{mute:newMute});
      break;
    case 'togglePause':
      if(kodiPlyr.status!=='stopped'){
        if(kodiActivePlyrs.length<1){await updKodiActPlyr();if(kodiActivePlyrs.length<1){return}};
        let newSpeed:number=-1;kodiPlyr.status==='paused'?newSpeed=1:newSpeed=0;
        await kodiReq('Player.SetSpeed',{playerid:kodiActivePlyrs[0].playerid,speed:newSpeed});
      };
      break;
    case 'doStop':
      if(kodiPlyr.status!=='stopped'){
        if(kodiActivePlyrs.length<1){await updKodiActPlyr();if(kodiActivePlyrs.length<1){return}};
        await kodiReq('Player.Stop',{playerid:kodiActivePlyrs[0].playerid});
      };
      break;
  };
})
//----------------------------------------------
async function doKodiWLEDFX(action:'start'|'stop',state?:string):Promise<boolean>{
  let cCS:string='';state?cCS=state:cCS='NULL';
  availCons('doKodiWLEDFX','Action: '+action+', State: '+cCS);
  return Promise.resolve(true);
}
//----------------------------------------------
async function doKodiInput(stage:string){
  availCons('doKodiInput','('+stage+')...');
  if(stage==='start'){doKodiWLEDFX('start','paused')}
  else{doKodiWLEDFX('stop')};
  return Promise.resolve(true);
}
//----------------------------------------------
async function kodiVolFinish(type:string){
  let setWCs:WLEDClient[]=[];
  if(wledGroupSyncOn){setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1')}else{setWCs=wleds.filter((wc)=>wc.info.name==='Zer0WLED1'||wc.info.name==='Zer0WLED2'||wc.info.name==='Zer0WLED3')};
  for(let wi=0;wi<setWCs.length;wi++){
    if(type==='muted'){
      const finishStateObj={tt:0,seg:[{col:[kodiPrevMuteCols[wi]]}]}
      const finJSON:any=JSON.stringify(finishStateObj);
      await wledJSONReq(setWCs[wi].info.name,'post',finJSON);
      kodiPrevMuteCols=[];
    }else{
      const volStateObj:any={tt:0,seg:[{fx:0,col:[kodiPrevVolCols[wi]]}]};
      const finJSON:any=JSON.stringify(volStateObj);
      await wledJSONReq(setWCs[wi].info.name,'post',finJSON);
      kodiPrevVolCols=[];
    }
  };
  if(kodiVolTO!==null){clearTimeout(kodiVolTO);kodiVolTO=null};
  if(kodiVMInProg){kodiVMInProg=false};
}
//----------------------------------------------
async function doKodiVolChange(vm:KVolMute){
  return Promise.resolve(true);
}
//----------------------------------------------
async function updKodiPlyrPos(player:any){
  availCons('updKodiPlyrPos','()...');
  const{r,d}=await kodiReq('Player.GetProperties',{properties:['totaltime','time','percentage'],playerid:player.playerid});
  if(r){
    if(d.hasOwnProperty('percentage')){kodiPlyr.pos.perc=d.percentage/100};
    if(d.hasOwnProperty('totaltime')){kodiPlyr.pos.total=((d.totaltime.hours*3600)+(d.totaltime.minutes*60)+d.totaltime.seconds)};
    if(d.hasOwnProperty('time')){kodiPlyr.pos.time=((d.time.hours*3600)+(d.time.minutes*60)+d.time.seconds)};
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}])};
  };
  return Promise.resolve(true);
}
//----------------------------------------------
async function updKodiActPlyr(){
  availCons('updKodiActPlyr','()...');
  const{r,d}=await kodiReq('Player.GetActivePlayers',null);
  if(r&&d&&d.length>0&&!_.isEqual(kodiActivePlyrs,d)){kodiActivePlyrs=d};
  return Promise.resolve(true);
}kodiServiceRunning
//----------------------------------------------
async function doKodiSleepWake(isSleep:boolean):Promise<boolean>{
  if(isSleep){
    for(let pi=0;pi<kodiActivePlyrs.length;pi++){await kodiReq('Player.Stop',{playerid:kodiActivePlyrs[pi].playerid})};
    await kodiReq('Player.Open',{item:{file:'/home/zer0ne/Pictures/willsleep.png'}});
    await doW(1.5);
    await kodiReq('Player.Open',{item:{file:'/home/zer0ne/Pictures/sleep.png'}});
  }else{
    await kodiReq('Player.Open',{item:{file:'/home/zer0ne/Pictures/willwake.png'}});
    await doW(1.5);
    await kodiReq('Player.Stop',{'playerid':2});
    await kodiReq('Input.Home',null);
    await doW(0.5);
  };
  return Promise.resolve(true);
}
//------------------------------------------------
async function checkKodiOnline(){
  if(kodiServiceRunning&&kodiOnlineINT===null){return}
  else{
    const testCredsRes:{r:boolean,d:any}=await kodiReq('JSONRPC.Ping',{});
    if(testCredsRes.r&&testCredsRes.d==='pong'){
      if(kodiOnlineINT!==null){clearInterval(kodiOnlineINT);kodiOnlineINT=null};
      if(!kodiServiceRunning){startKodiService()}
    }
  }
}
//------------------------------------------------
function kodiOnlineChecker(action:'start'|'stop'){
  availCons('kodiOnlineChecker','('+action+')...');
  if(action==='start'){
    let eT:number=0;
    kodiOnlineINT=setInterval(()=>{
      eT+=10000;
      if(eT>=60000&&eT<360000){
        clearInterval(kodiOnlineINT);
        kodiOnlineINT=setInterval(checkKodiOnline,60000);
      }else if(eT>=360000){
        clearInterval(kodiOnlineINT);
        kodiOnlineINT=setInterval(checkKodiOnline,300000);
      }
      checkKodiOnline();
    },10000);
  }else if(action==='stop'){if(kodiOnlineINT!==null){clearInterval(kodiOnlineINT);kodiOnlineINT=null}}
}
//------------------------------------------------
async function stopKodiService():Promise<boolean>{
  kodiPlyr={item:null,status:'stopped',pos:{total:0,time:0,perc:0}};
  kodiActivePlyrs=[];
  showNotification({type:'kodi',title:'Kodi Service',msg:'Stopped',duration:2000},'both');
  kodiServiceRunning=false;
  if(wcWindow&&wcWindow.webContents){
    wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}]);
    wcWindow.webContents.send('kodiIsRunning',[false]);
  };
  kodiOnlineChecker('start');
  return Promise.resolve(true);
}
//------------------------------------------------
ipcMain.handle('getKodiData',(e:any,args:any[])=>{return Promise.resolve([{plyr:kodiPlyr,vm:kodiVolMute}])});
//------------------------------------------------
async function startKodiService():Promise<boolean>{
  if(kodiOnlineINT!==null){kodiOnlineChecker('stop')};
  const{r,d}=await startKodiWSL();
  if(r){
    if(!kodiServiceRunning){kodiServiceRunning=true};
    sendKodiNote('wifiCUE','CONNECT via '+netInterface.pc);
    showNotification({type:'kodi',title:'Kodi Service',msg:'Started',duration:2000},'both');
    const vmRes:{r:boolean,d:any}=await kodiReq('Application.GetProperties',{properties:['muted','volume']});
    if(vmRes.r&&vmRes.d&&!_.isEqual(kodiVolMute,vmRes.d)){kodiVolMute=vmRes.d};
    await updKodiActPlyr();
    if(kodiActivePlyrs.length>0){
      const actPId:number=kodiActivePlyrs[0].playerid;
      if(kodiPlyr.item===null){
        const getItemRes:{r:boolean,d:any}=await kodiReq('Player.GetItem',{playerid:actPId});
        if(getItemRes.r&&getItemRes.d&&getItemRes.d.hasOwnProperty('item')){kodiPlyr.item=getItemRes.d.item};
      };
      if(kodiPlyr.pos.total===0){
        const getStatRes:{r:boolean,d:any}=await kodiReq('Player.GetProperties',{playerid:actPId,properties:['speed']});
        if(getStatRes.r&&getStatRes.d&&getStatRes.d.hasOwnProperty('speed')){if(getStatRes.d.speed===0){kodiPlyr.status='paused'}else{kodiPlyr.status='playing'}};
        const getPosRes:{r:boolean,d:any}=await kodiReq('Player.GetProperties',{properties:['totaltime','time','percentage'],playerid:actPId});
        if(getPosRes.r){
          if(getPosRes.d.hasOwnProperty('percentage')){kodiPlyr.pos.perc=Number((getPosRes.d.percentage/100).toFixed(2))};
          if(getPosRes.d.hasOwnProperty('totaltime')){kodiPlyr.pos.total=((getPosRes.d.totaltime.hours*3600)+(getPosRes.d.totaltime.minutes*60)+getPosRes.d.totaltime.seconds)};
          if(getPosRes.d.hasOwnProperty('time')){kodiPlyr.pos.time=((getPosRes.d.time.hours*3600)+(getPosRes.d.time.minutes*60)+getPosRes.d.time.seconds)};
        };
      };
      if(!kodiPosLooping){await startStopKodiPosLoop('start')};
    };
    if(wcWindow&&wcWindow.webContents){
      wcWindow.webContents.send('kodiPlyrUpdate',[{plyr:kodiPlyr,vm:kodiVolMute}]);
      wcWindow.webContents.send('kodiIsRunning',[true]);
    };
    const mWYTDLIndex:number|false=await getMWBrwsr('ytdl');
    if(mWYTDLIndex&&mWYTDLIndex!==-1){
      if(moreWins[mWYTDLIndex]&&moreWins[mWYTDLIndex].webContents){
        moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrStart',[{plyr:kodiPlyr,vm:kodiVolMute}])
      }
    };
  }else{
    if(kodiServiceRunning){kodiServiceRunning=false};
    if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('kodiIsRunning',[true])};
    kodiOnlineChecker('start');
    if(d==='to'){showNotification({type:'kodi',title:'Kodi Service',msg:'ERROR: Timeout (>5s)',duration:2000},'both')}
    else{showNotification({type:'kodi',title:'Kodi Service',msg:'ERROR: Unknown',duration:2000},'both');console.log(d)};
  };
  return Promise.resolve(true);
}
//------------------------------------------------
async function sendKodiNote(title:string,msg:string,ms?:number):Promise<boolean>{
  let nPs:any={title:title,message:msg};if(ms){nPs['displayTime']=ms};
  const{r,d}=await kodiReq('GUI.ShowNotification',nPs,1000);
  return Promise.resolve(r);
};
///////////////////////////////////////////////////
// ADB/PHONE FUNCTIONS
///////////////////////////////////////////////////
ipcMain.on('doPhoneCMD',async(e:any,args:any[])=>{
  availCons('IPCMAIN|doPhoneCMD','('+args[0]+')...');
  const checkConn:boolean=await doPhoneConnect();
  if(checkConn){const fnStr='doPhone'+capd(args[0])+'()';eval(fnStr)}
});
//-------------------------------------------------
async function runADBConsoleCMD(params:string[]):Promise<{r:boolean,d:any}>{
  return new Promise((resolve)=>{
    const cmdSpawn=require('child_process').spawn,cmdProc=cmdSpawn('adb',params);let result:{r:boolean,d:any}={r:false,d:''};
    cmdProc.stdout.on('data',(data:any)=>{if(data&&data.toString().trim().length>0){result.d+=data.toString().trim()}});
    cmdProc.on('close',async(code:any)=>{
      if(result.d&&result.d.includes('already connected')){resolve({r:true,d:''})};
      code===0||code==='0'?result.r=true:result.r=false;
      if(!result.r||result.d.includes('not found')||result.d.includes('offline')){
        let errMsg:string='ERROR: ';
        if(code!==0&&code!=='0'){errMsg+='('+String(code)+') '};
        if(result.d.includes('not found')){errMsg+='Device Not Found '};
        if(result.d.includes('offline')){errMsg+='Device Offline '};
        availCons('runConsoleCMD',errMsg+'- Attempting Reconnect...');
        const rRRes1:boolean=await phoneReconRun(params,1);
        if(rRRes1){resolve({r:true,d:''})}
        else{
          const rRRes2:boolean=await phoneReconRun(params,2);
          if(rRRes2){resolve({r:true,d:''})}else{resolve({r:false,d:''})};
        }
      }else{resolve(result)};
    });
  });
}
//-------------------------------------------------
const phoneReconRun=async(p:string[],attempt:number):Promise<boolean>=>{
  const rC=async(c:string[]):Promise<boolean>=>{
    return new Promise((resolve)=>{
      let d:string='';const s=require('child_process').spawn,p=s('adb',c);
      p.stdout.on('data',(data:any)=>{if(data&&data.toString().trim().length>0){d+=data.toString().trim()}});
      p.on('close',async(code:any)=>{if(code!==0&&code!=='0'&&!d.includes('not found')&&!d.includes('offline')){resolve(true)}else{resolve(false)}});
    })
  };
  //-----------
  if(attempt===1){
    availCons('phoneReconRun','ATTEMPT #1 - Reconnecting Offline Devices...');
    await rC(['reconnect','offline']);await doW(1);
    const reRunRes:boolean=await rC(p);if(reRunRes){return Promise.resolve(true)}else{return Promise.resolve(false)};
  }else{
    availCons('phoneReconRun','ATTEMPT #2 - Full Server Restart...');
    availCons('phoneReconRun','Kill Server...');
    await rC(['kill-server']);await doW(1);
    availCons('phoneReconRun','Start Server...');
    await rC(['start-server']);await doW(1);
    availCons('phoneReconRun','TCPIP @ 5555...');
    await rC(['tcpip','5555']);await doW(0.5);
    availCons('phoneReconRun','Connect 192.168.0.69:5555...');
    await rC(['connect','192.168.0.69:5555']);
    const reRunRes:boolean=await rC(p);if(reRunRes){return Promise.resolve(true)}else{return Promise.resolve(false)};
  };
}
//-------------------------------------------------
async function getPhoneDSInfo():Promise<PhoneDSInfo>{
  const gDSI=async(service:string,prop?:string):Promise<{r:boolean,d:any}>=>{
    let adbCMDArr:string[]=['-s','192.168.0.69:5555','shell','dumpsys','-t','5',service];
    if(service==='name'||service==='make'||service==='model'||service==='os'&&(prop&&prop.length>0)){adbCMDArr=['-s','192.168.0.69:5555','shell','getprop',prop]};
    if(service==='mem'){adbCMDArr=['-s','192.168.0.69:5555','shell','cat','proc/meminfo']};
    const dsRes:{r:boolean,d:any}=await runADBConsoleCMD(adbCMDArr);
    return Promise.resolve(dsRes);
  };
  const xtractDSI=async(service:string,data:string):Promise<any>=>{
    let xRes:any;
    try{
      switch(service){
        case 'power':const pArr:string[]=data.split(/\n/g),isAC:boolean=JSON.parse(pArr.filter((l:string)=>l.trim().startsWith('AC powered: '))[0].trim().split('AC powered: ')[1]),isUSB:boolean=JSON.parse(pArr.filter((l:string)=>l.trim().startsWith('USB powered: '))[0].trim().split('USB powered: ')[1]),lvlNo:number=Number(pArr.filter((l:string)=>l.trim().startsWith('level: '))[0].trim().split('level: ')[1]);xRes={charging:(isAC||isUSB),level:{perc:(lvlNo/100),str:lvlNo.toFixed(0)+'%'}};break;
        case 'wifi':const connLineArr:string[]=data.split(/\n/g).filter((l:string)=>l.trim().length>0&&l.trim().startsWith('NetworkAgentInfo{ ')),ssid:string=connLineArr[0].split('SSID: ')[1].split(' ')[0].replace(/"/g,''),sig:number=Number(connLineArr[0].split('SignalStrength: ')[1].split(' ')[0]);if(ssid&&ssid.length>0&&sig&&sig<0){xRes={ssid:ssid,tx:sig}}else{xRes=false};break;
        case 'cpu':const cpuLineArr:string[]=data.split(/\n/g).filter((l:string)=>l.trim().includes('TOTAL: '));if(cpuLineArr&&cpuLineArr.length===1){const percStr:string=cpuLineArr[0].trim().split(' TOTAL: ')[0];xRes={perc:Math.round(Number(percStr.replace('%','')))/100,str:(Number(percStr.replace('%',''))).toFixed(0)}}else{xRes=false};break;
        case 'mem':const memArr:string[]=data.split(/\n/g),ttl:number=Number(memArr.filter((l:string)=>l.trim().startsWith('MemTotal: '))[0].trim().split('MemTotal: ')[1].split(' kB')[0].trim()),free:number=Number(memArr.filter((l:string)=>l.trim().startsWith('MemAvailable: '))[0].trim().split('MemAvailable: ')[1].split(' kB')[0].trim()),used:number=ttl-free;xRes={perc:(used/ttl),str:((used/ttl)*100).toFixed(0)+'%'};break;
        case 'disk':const dFree:number=Number(data.split(/\n/g).filter((l:string)=>l.trim().startsWith('Data-Free: '))[0].split(' = ')[1].split('% free')[0]),dUsed:number=100-dFree;xRes={perc:(dUsed/100),str:dUsed.toFixed(0)+'%'};break;
        default:xRes=false;
      }
      return Promise.resolve(xRes);
    }catch(e){return Promise.resolve(false)};
  };
  //-----------
  let dsInfo:PhoneDSInfo={name:'-',make:'-',model:'-',os:'-',power:{charging:false,level:{perc:0,str:'-'}},wifi:{ssid:'-',tx:0},cpu:{perc:0,str:'-'},mem:{perc:0,str:'-'},disk:{perc:0,str:'-'}};
  //-----------
  const dsNameRes:{r:boolean,d:any}=await gDSI('name','persist.sys.device_name');
  if(dsNameRes.r&&dsNameRes.d){dsInfo.name=dsNameRes.d.trim()};
  const dsMakeRes:{r:boolean,d:any}=await gDSI('make','ro.product.vendor.manufacturer');
  if(dsMakeRes.r&&dsMakeRes.d){dsInfo.make=dsMakeRes.d.trim()};
  const dsModelRes:{r:boolean,d:any}=await gDSI('model','ro.product.vendor.model');
  if(dsModelRes.r&&dsModelRes.d){dsInfo.model=dsModelRes.d.trim()};
  const dsOSRes:{r:boolean,d:any}=await gDSI('os','ro.build.version.release');
  if(dsOSRes.r&&dsOSRes.d){dsInfo.os=dsOSRes.d.trim()};
  //-----------
  const dsPwrRes:{r:boolean,d:any}=await gDSI('battery');
  if(dsPwrRes.r&&dsPwrRes.d){
    const dsPwrXtrRes:any=await xtractDSI('power',dsPwrRes.d);
    if(dsPwrXtrRes!==false){dsInfo.power=dsPwrXtrRes};
  };
  const dsWifiRes:{r:boolean,d:any}=await gDSI('connectivity');
  if(dsWifiRes.r&&dsWifiRes.d){
    const dsWifiXtrRes:any=await xtractDSI('wifi',dsWifiRes.d);
    if(dsWifiXtrRes!==false){dsInfo.wifi=dsWifiXtrRes};
  };
  const dsCPURes:{r:boolean,d:any}=await gDSI('cpuinfo');
  if(dsCPURes.r&&dsCPURes.d){
    const dsCPUXtrRes:any=await xtractDSI('cpu',dsCPURes.d);
    if(dsCPUXtrRes!==false){dsInfo.cpu=dsCPUXtrRes};
  };
  const dsMemRes:{r:boolean,d:any}=await gDSI('mem');
  if(dsMemRes.r&&dsMemRes.d){
    const dsMemXtrRes:any=await xtractDSI('mem',dsMemRes.d);
    if(dsMemXtrRes!==false){dsInfo.mem=dsMemXtrRes};
  };
  const dsDiskRes:{r:boolean,d:any}=await gDSI('diskstats');
  if(dsDiskRes.r&&dsDiskRes.d){
    const dsDiskXtrRes:any=await xtractDSI('disk',dsDiskRes.d);
    if(dsDiskXtrRes!==false){dsInfo.disk=dsDiskXtrRes};
  };
  //-----------
  return Promise.resolve(dsInfo);
};
//-------------------------------------------------
async function doNotifyMD2Phone(list:WCYTDLMDPLItem[]):Promise<boolean>{
  availCons('doNotifyMD2Phone','('+list.length+')');
  //-----------
  let popFile:string='',lineCount:number=0;
  for(let li=0;li<list.length;li++){
    let popLine:string='• ';
    let title:string=list[li].vTitle.split(' ').slice(0,6).join(' ');
    if(title.length>30){title=title.substring(0,27)+'...'};
    popLine+=title;
    let chan:string=list[li].cTitle.split(' ').slice(0,2).join(' ');
    if(chan.length>15){chan=chan.substring(0,12)+'...'};
    popLine+=' - '+chan;
    const dur:string=s2T(list[li].dur);
    popLine+=' ('+dur+') ';
    if(list[li].plCats.includes('star')){popLine+='⭐'};
    if(list[li].plCats.includes('sleep')){popLine+='💤'};
    popLine+='<br>';
    popFile+=popLine;
    lineCount++;
  };
  if(popFile.length>0){
    const localNotifPath:string='C:\\myYTDLData\\mydaily\\phNotif.txt';
    const localNotifTitlePath:string='C:\\myYTDLData\\mydaily\\phNotifTitle.txt';
    try{
      await writeFile(localNotifPath,popFile,{encoding:'utf-8'});
      await writeFile(localNotifTitlePath,'📺 DailyPooCube Update - (+'+String(lineCount)+')',{encoding:'utf-8'});
      await doW(0.5);
      await doPhoneFilePush(localNotifTitlePath,'/sdcard/Download/phNotifTitle.txt');
      await doPhoneFilePush(localNotifPath,'/sdcard/Download/phNotif.txt');
      const{r,d}=await runADBConsoleCMD(['-s','192.168.0.69:5555','shell','am','broadcast','-a','net.dinglisch.android.tasker.Pop']);
      if(!r&&d!==null){availCons('doNotifMD2Phone','ERROR: '+d)};
      return Promise.resolve(true);
    }catch(e){console.log(e);return Promise.resolve(false)}
  }else{return Promise.resolve(true)};
}
//-------------------------------------------------
const doPhoneConnect=async():Promise<boolean>=>{
  availCons('doPhoneConnect','()...');
  const{r,d}=await runADBConsoleCMD(['connect','192.168.0.69:5555']);
  if(!r){if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('phRedmiOnlineData',[false])};availCons('doPhoneConnect','ERROR: '+d);return Promise.resolve(false)}
  else{if(wcWindow&&wcWindow.webContents){wcWindow.webContents.send('phRedmiOnlineData',[true])};return Promise.resolve(true)};
}
//-------------------------------------------------
const doPhoneFilePush=async(localPath:string,phonePath:string):Promise<boolean>=>{
  availCons('doPhoneFilePush','('+localPath+','+phonePath+')...');
  const{r,d}=await runADBConsoleCMD(['-s','192.168.0.69:5555','push',localPath,phonePath]);
  if(!r&&d!==null){availCons('doPhoneFilePush','ERROR: '+d);return Promise.resolve(false)}
  else{return Promise.resolve(true)};
}
//-------------------------------------------------
const doPhoneBright=async()=>{
  availCons('doPhoneBright','()...');
  const{r,d}=await runADBConsoleCMD(['-s','192.168.0.69:5555','shell','settings','put','system','screen_brightness','500']);
  if(!r&&d!==null){availCons('doPhoneBright','ERROR: '+d)};
}
//-------------------------------------------------
const doPhoneDim=async()=>{
  availCons('doPhoneDim','()...');
  const{r,d}=await runADBConsoleCMD(['-s','192.168.0.69:5555','shell','settings','put','system','screen_brightness','120']);
  if(!r&&d!==null){availCons('doPhoneDim','ERROR: '+d)};
}
//-------------------------------------------------
const doPhonePop=async()=>{
  availCons('doPhonePop','()...');
  const{r,d}=await runADBConsoleCMD(['-s','192.168.0.69:5555','shell','am','start','-a','android.intent.action.VIEW','-d','/sdcard/Download/FX/pop.mp3 -t audio/mp3']);
  if(!r&&d!==null){availCons('doPhonePop','ERROR: '+d)};
}
///////////////////////////////////////////////////////////
async function delOldKodiPL():Promise<boolean>{
  availCons('delOldKodiPL','()...');
  const dptDir:string=path.normalize('\\\\ZER0KODIPI4\\Zer0Pi4\\home\\zer0ne\\DailyPooCube');
  const nowDate:Date=new Date();
  const getExistList=async():Promise<string[]|false>=>{try{const gELRes:string[]=await readdir(dptDir);return Promise.resolve(gELRes)}catch(e){console.log(e);return Promise.resolve(false)}};
  const delOldPLDir=async(dirP:string):Promise<boolean>=>{if(fs.existsSync(dirP)){fs.readdirSync(dirP).forEach((f)=>{const curP=dirP+'/'+f;if(fs.lstatSync(curP).isDirectory()){delOldPLDir(curP)}else{fs.unlinkSync(curP)}});fs.rmdirSync(dirP);return Promise.resolve(true)}else{return Promise.resolve(true)}};
  const existRes:string[]|false=await getExistList();
  if(existRes!==false){
    if(existRes.length>0){
      let okDirs:string[]=[];
      const tdDir:string=format(nowDate,'ddMMyy');okDirs.push(tdDir);
      const tdSub1:Date=subDays(nowDate,1),tdSub1Dir:string=format(tdSub1,'ddMMyy');okDirs.push(tdSub1Dir);
      const tdSub2:Date=subDays(nowDate,2),tdSub2Dir:string=format(tdSub2,'ddMMyy');okDirs.push(tdSub2Dir);
      const tdSub3:Date=subDays(nowDate,3),tdSub3Dir:string=format(tdSub3,'ddMMyy');okDirs.push(tdSub3Dir);
      for(let exi=0;exi<existRes.length;exi++){const dirStr:string=existRes[exi];if(!okDirs.includes(dirStr)){const delDirPath:string=path.join(dptDir,dirStr);await delOldPLDir(delDirPath)}};
      return Promise.resolve(true);
    }else{return Promise.resolve(true)}
  }else{return Promise.resolve(false)}
}
///////////////////////////////////////////////////////////
let kodiPLUpdInProg:boolean=false;
ipcMain.on('addUpdateMDKodiPL',async(e:any,args:any[])=>{
  const mwi:number|false=await getMWBrwsr('ytdl');
  if(!kodiPLUpdInProg){
    availCons('addUpdateMDKodiPL','(todayPLObj:WCYTDLMDKodiPLDay[])...');
    kodiPLUpdInProg=true;
    const tdRawPL:WCYTDLMDKodiPLDay=args[0];
    const doMDNotify:WCYTDLMDPLItem[]|null=args[1];
    //-----------------
    const copyPLData2Kodi=async():Promise<boolean>=>{
      const mwi:number|false=await getMWBrwsr('ytdl');
      return new Promise(async(resolve)=>{
        try{
          const dayDirStr:string=tdRawPL.date.replace(/\//g,'');
          const parameters=[dayDirStr];
          const child=childProcess.spawn('cmd.exe',['/c','C:\\myYTDLData\\mydaily\\copyPLData.bat',...parameters]);
          let statusArr:KodiUplItem[]=[];
          child.stdout.on('data',(data:any)=>{
            const d:string=data.toString().trim();
            let rawL:string[]=[];
            if(d.includes('\r\n')){rawL=d.split('\r\n')}else if(d.includes('\n')){rawL=d.split('\n')}else{rawL.push(d)};
            if(rawL.length>0){
              for(let rli=0;rli<rawL.length;rli++){
                const rL:string=rawL[rli].trim();
                if(rL.length>0&&!rL.includes('echo off')&&!rL.includes('[/////]')&&!rL.includes('error')&&!rL.includes('Error')&&!rL.startsWith('- ')&&!rL.startsWith('(A)')&&rL.replace(/\s+/gi,'').length>0&&rL.includes('| binary |')){
                  const uLArr:string[]=rL.split('|');
                  if(uLArr.length===5){
                    const fnArr:string[]=uLArr[0].split('\\'),fnArrLen:number=fnArr.length;
                    const newL:KodiUplItem={fileName:fnArr[fnArrLen-1].trim(),fileSize:uLArr[1].trim().replace(' ',''),uplSpeed:uLArr[2].trim().replace(' ',''),uplPerc:uLArr[4].trim()};
                    if((statusArr.filter(i=>i.fileName===newL.fileName)).length===0){statusArr.push(newL);if(mwi&&mwi!==-1){moreWins[mwi].webContents.send('mdKodiUploadStatus',['prog',statusArr])}};
                  }
                }
              }
            }
          });
          child.stderr.on('data',(data)=>{availCons('addUpdateKodiPL',`STDERR: ${data}`)});
          child.on('close',(code)=>{resolve(true);availCons('',statusArr)});
        }catch(e){console.log(e);resolve(true)};
      });
    }
    //-----------------
    const writeM3ULocal=async(plCat:string,plData:string):Promise<boolean>=>{
      try{
        const dayDirStr:string=tdRawPL.date.replace(/\//g,'');
        const localDayDirPath:string=path.join(path.normalize('C:\\myYTDLData\\mydaily\\kodipls'),dayDirStr);
        if(!(await exists(localDayDirPath))){try{await mkdir(localDayDirPath,{recursive:true})}catch(e){console.log(e)}};
        const localM3UPath:string=path.join(localDayDirPath,(capd(plCat))+'.m3u');
        await writeFile(localM3UPath,plData,{encoding:'utf-8'});
        return Promise.resolve(true);
      }catch(e){console.log(e);return Promise.resolve(false)};
    };
    //-----------------
    const remPath=(localPath:string):string=>{const justFN:string=path.basename(localPath);const dayDirStr:string=tdRawPL.date.replace(/\//g,'');return '/home/zer0ne/DailyPooCube/'+dayDirStr+'/'+justFN};
    //-----------------
    const getBytSz=async(fPath:string):Promise<number|false>=>{try{const{r,d}=await statSize(fPath);if(r&&d&&d>0){return Promise.resolve(d)}else{return Promise.resolve(false)}}
    catch(e){console.log(e);return Promise.resolve(false)}};
    //-----------------
    let newM3UOrsData:string[]=['#EXTM3U','#EXTENC:UTF-8','#PLAYLIST:'+tdRawPL.date+' - PooCube [ORS] List'];
    let newM3UStarData:string[]=['#EXTM3U','#EXTENC:UTF-8','#PLAYLIST:'+tdRawPL.date+' - PooCube [STAR] List'];
    let newM3USleepData:string[]=['#EXTM3U','#EXTENC:UTF-8','#PLAYLIST:'+tdRawPL.date+' - PooCube [SLEEP] List'];
    for(let pli=0;pli<tdRawPL.all.length;pli++){
      const rO:WCYTDLMDPLItem=tdRawPL.all[pli];
      if(rO.vPath!=='null'){
        let itemTags:string[]=[];
        itemTags.push('#EXTINF:'+(Math.round(rO.dur)).toString()+','+rO.cTitle+' - '+rO.vTitle+' ('+(s2T(rO.dur))+') -|- '+rO.vId);
        if(rO.vPath.startsWith('http')){itemTags.push(rO.vPath)}
        else{
          itemTags.push((remPath(rO.vPath)));
          const vSz:number|false=await getBytSz(rO.vPath);
          if(vSz!==false){itemTags.push('#EXTBYT:'+String(vSz))}
          else{itemTags.push('#EXTBYT:0')};
        };
        for(let ci=0;ci<rO.plCats.length;ci++){
          if(rO.plCats[ci]==='ors'){newM3UOrsData=newM3UOrsData.concat(itemTags)};
          if(rO.plCats[ci]==='star'){newM3UStarData=newM3UStarData.concat(itemTags)};
          if(rO.plCats[ci]==='sleep'){newM3USleepData=newM3USleepData.concat(itemTags)};
        };
      };
    };
    if(newM3UOrsData.length>0){const orsPLStrData:string=newM3UOrsData.join('\r\n');await writeM3ULocal('ors',orsPLStrData)};
    if(newM3UStarData.length>0){const starPLStrData:string=newM3UStarData.join('\r\n');await writeM3ULocal('star',starPLStrData)};
    if(newM3USleepData.length>0){const sleepPLStrData:string=newM3USleepData.join('\r\n');await writeM3ULocal('sleep',sleepPLStrData)};
    //---------------------
    if(mwi&&mwi!==-1){moreWins[mwi].webContents.send('mdKodiUploadStatus',['start'])};await doW(0.5);
    await delOldKodiPL();
    await copyPLData2Kodi();await doW(0.5);
    if(mwi&&mwi!==-1){moreWins[mwi].webContents.send('mdKodiUploadStatus',['finish'])};
    //---------------------
    if(doMDNotify!==null){doNotifyMD2Phone(doMDNotify)};
    //---------------------
    kodiPLUpdInProg=false;
  };
});
//////////////////////////////////////////////////
// TWITCH API FUNCTIONS
//////////////////////////////////////////////////
ipcMain.handle('twtChatMention',(e:any,args:any[])=>{
  if(args[0]==='show'){
    if(childW){childW.once('focus',()=>childW.flashFrame(false));childW.flashFrame(true)};
    if(wcWindow){
      wcWindow.once('focus',()=>wcWindow.flashFrame(false));
      wcWindow.setOverlayIcon((nativeImage.createFromPath((icoP('assets/wcc-window-notif-twtchatmention.png')))),'Twitch Chat Mention');
      wcWindow.flashFrame(true);
    };
  }else{wcWindow.flashFrame(false);wcWindow.setOverlayIcon(null,'')};
  return Promise.resolve(true);
})
//-------------------------------------------------
async function rwdTwitchAuth(action:'r'|'w'|'d',auth?:any):Promise<{r:boolean,d?:any}>{
  const taPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/twitch');
  const rAuth=async():Promise<{r:boolean,d:any}>=>{if(!(await exists(taPath))||(await statSize(taPath)).d===0){return Promise.resolve({r:false,d:null})};try{const rR:string=await readFile(taPath,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){availCons('rwTwitchToken','Twitch Auth File [READ] - OK');return Promise.resolve({r:true,d:JSON.parse(rR)})}else{return Promise.resolve({r:false,d:'ERROR: JSON Parse Failed'})}}catch(e){console.log(e);return Promise.resolve({r:false,d:e})}};
  const wAuth=async(data:any):Promise<boolean>=>{const taStr:string=JSON.stringify(data);try{await writeFile(taPath,taStr,{encoding:'utf-8'});availCons('rwTwicthAuth','Twitch Auth File [WRITE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  const dAuth=async():Promise<boolean>=>{if((await exists(taPath))){try{await unlink(taPath);availCons('rwTwicthAuth','Twitch Auth File [DELETE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}}else{return Promise.resolve(true)}};
  if(action==='r'){return Promise.resolve((await rAuth()))}
  else if(action==='w'){return Promise.resolve({r:(await wAuth(auth))})}
  else{return Promise.resolve({r:(await dAuth())})};
};
//-------------------------------------------------
ipcMain.handle('getTWTAuth',(e:any,args:any[]):Promise<any>=>{return Promise.resolve(twtAuth)});
//-------------------------------------------------
function isTWTAuthV(auth:string):Promise<boolean>{let allKs:string[]=['cbUrl','username','code','token','refresh','expires','client','secret'],reqKs:string[]=['token','refresh','client','secret'],v:boolean=true;for(let aki=0;aki<allKs.length;aki++){if(!auth.hasOwnProperty(allKs[aki])){v=false;break};for(let rki=0;rki<reqKs.length;rki++){if(!auth[reqKs[rki]]||auth[reqKs[rki]].trim().length===0){v=false;break}}};console.log('Twitch Auth JSON Valid: '+String(v).toUpperCase());return Promise.resolve(v)};
//-------------------------------------------------
async function twtValidate():Promise<boolean>{try{const valInstance=axios.create({headers:{Authorization:'OAuth '+twtAuth.token}}),{status}=await valInstance.get('https://id.twitch.tv/oauth2/validate');if(status===200){console.log('Twitch API Validated: TRUE');return Promise.resolve(true)}else{console.log('Twitch API Validated: FALSE');return Promise.resolve(false)}}catch(e){console.log('Twitch API Validated: FALSE');console.log(e);return Promise.resolve(false)}};
//-------------------------------------------------
ipcMain.handle('getTwtLives',async(e:any,args:any[]):Promise<any[]>=>{await getTwtLives();return Promise.resolve(twtLives)})
async function getTwtLives():Promise<boolean>{
  if(!twtIsAuth||!twtUser||!twtUser.id){return Promise.resolve(false)};
  const{r,d}=await twtReq('get','streams/followed',{user_id:twtUser.id});
  if(r){
    if(!_.isEqual(twtLives,d)){
      twtLives=d;
      if(childW&&childW.webContents){childW.webContents.send('twtLives',[twtLives])};
    };
    return Promise.resolve(true);
  }else{return Promise.resolve(false)};
}
//------------------------------------------------
ipcMain.handle('getTwtUser',async(e:any,args:any[]):Promise<any[]>=>{if(!twtUser){await getTwtUser()};return Promise.resolve(twtUser)})
async function getTwtUser():Promise<boolean>{
  availCons('getTwtUser','()...');
  if(!twtIsAuth){return Promise.resolve(false)};
  const{r,d}=await twtReq('get','users',{login:'zer0ne33'});
  if(r&&d&&d.length>0){
    if(!_.isEqual(twtUser,d[0])){
      twtUser=d[0];
      if(childW&&childW.webContents){childW.webContents.send('twtUser',[twtUser])}};
      return Promise.resolve(true);
  }else{return Promise.resolve(false)}
}
//------------------------------------------------
async function twtRefresh():Promise<{r:boolean,d:string}>{
  availCons('twtRefresh','()...');
  try{
    const rfURL:string='https://id.twitch.tv/oauth2/token?client_id='+twtAuth.client+'&client_secret='+twtAuth.secret+'&grant_type=refresh_token&refresh_token='+twtAuth.refresh;
    const rfInstance=axios.create({responseType:'json'});
    const{status,data}:any=await rfInstance.post(rfURL);
    console.log('Twitch API Refresh: '+String(status));
    if(data.hasOwnProperty('access_token')&&twtAuth.token!==data.access_token){twtAuth.token=data.access_token};
    if(data.hasOwnProperty('refresh_token')&&twtAuth.refresh!==data.refresh_token){twtAuth.refresh=data.refresh_token};
    if(childW&&childW.webContents){childW.webContents.send('updTwtAuth',[twtAuth])};
    await rwdTwitchAuth('w',twtAuth);
    return Promise.resolve({r:true,d:data.access_token});
  }catch(e){
    console.log('Twitch API Refresh: ERROR');
    return Promise.resolve({r:false,d:''})
  };
}
//------------------------------------------------
async function twtReq(m:string,ep:string,ps?:any):Promise<{r:boolean,d:any}>{
  availCons('twtReq','('+m+','+ep+',params/data)...');
  const twtInstance=axios.create({headers:{Authorization:'Bearer '+twtAuth.token,'Client-Id':twtAuth.client},responseType:'json',timeout:5000});
  const NO_RETRY_HEADER='x-no-retry'
  twtInstance.interceptors.response.use(undefined,async(error)=>{
    if(error.response.status===404){return axios(error.config)}
    else if(!axios.isCancel(error)&&axios.isAxiosError(error)&&error.response.status===401){
      if(error.config.headers&&error.config.headers[NO_RETRY_HEADER]){return Promise.reject(error)};
      error.config.headers[NO_RETRY_HEADER]='true';
      const rfRes:{r:boolean,d:string}=await twtRefresh();
      if(rfRes.r&&rfRes.d){
        error.config.headers['Authorization']='Bearer '+rfRes.d;
        return axios(error.config);
      }else{return Promise.reject(error)};
    }else{return Promise.reject(error)};
  });
  const bURL:string='https://api.twitch.tv/helix/';
  try{
    let reqBody:any={url:bURL+ep,method:m};if(m==='get'||m==='delete'){if(ps){reqBody['params']=ps}}else{if(ps){reqBody['data']=ps}};
    const{status,data}=await twtInstance.request(reqBody);
    if(status===200){return Promise.resolve({r:true,d:data.data})}
    else{return Promise.resolve({r:false,d:null})};
  }catch(e:any){
    if(e.hasOwnProperty('response')&&e.response&&e.response.hasOwnProperty('status')&&e.response.status&&Number(e.response.status)===404){
      let sText:string='';if(e.response.hasOwnProperty('statusText')){sText=e.response.statusText};
      return Promise.resolve({r:false,d:'Error: ('+String(e.response.status)+') '+sText});
    }else{
      console.log(e);
      return Promise.resolve({r:false,d:e})
    };
  };
}
//------------------------------------------------
ipcMain.handle('initTwt',async(e:any,args:any[]):Promise<boolean>=>{const itRes:boolean=await initTwitch();return Promise.resolve(itRes)});
ipcMain.handle('initTwtChat',async(e:any,args:any[])=>{const itcRes:boolean=await startTWTChat(args[0]);return Promise.resolve(itcRes)});
ipcMain.handle('homeGetTwtStatus',(e:any,args:any[])=>{return {auth:twtIsAuth,chat:twtChatConn}});
//------------------------------------------------
ipcMain.handle('getTwtFollowing',async(e:any,args:any[]):Promise<any[]>=>{
  await getFollowing();
  return Promise.resolve(twtFollowing);
})
//------------------------------------------------
async function getFollowing():Promise<boolean>{
  availCons('getFollowing','()...');
  if(!twtIsAuth){return Promise.resolve(false)};
  const{r,d}=await twtReq('get','channels/followed',{user_id:'139738358',first:100});
  if(r&&d&&d.length>0){
    if(!_.isEqual(twtFollowing,d)){
      twtFollowing=d;
      if(childW&&childW.webContents){childW.webContents.send('twtFollowing',[twtFollowing])}};
      return Promise.resolve(true);
  }else{return Promise.resolve(false)};
}
//------------------------------------------------
let twtSVR:any,killTwtSVR:any;
async function initTwitch():Promise<boolean>{
  availCons('initTwitch','()...');
  const doSuccess=async():Promise<boolean>=>{
    twtIsAuth=true;
    await getTwtUser();
    await getFollowing();
    await getTwtLives();
    if(twtLivesRefreshINT===null){twtLivesRefreshINT=setInterval(()=>{getTwtLives()},60000)};
    await delTWTEvSubs();
    startTwitchWSEvents();
    return Promise.resolve(true);
  };
  let doNewAccess:boolean=false;
  //------------
  const{r,d}=await rwdTwitchAuth('r');
  if(r&&d){
    const testVRes:boolean=await isTWTAuthV(d);
    if(!testVRes){await rwdTwitchAuth('d');doNewAccess=true}
    else{
      twtAuth=d;
      const twtValidRes:boolean=await twtValidate();
      if(twtValidRes){await doSuccess();return Promise.resolve(true)}
      else{
        const rfRes:{r:boolean,d:string}=await twtRefresh();
        if(rfRes.r){
          await doW(1);
          const retryTWTVRes:boolean=await twtValidate();
          if(retryTWTVRes){await doSuccess();return Promise.resolve(true)}
          else{doNewAccess=true}
        }else{doNewAccess=true}
      };
    };
  }else{doNewAccess=true};
  //------------
  if(doNewAccess){
    return new Promise(async(resolve)=>{
      try{
        twtSVR=http.createServer(async(req,res)=>{
          if(req.method.toLowerCase()==='get'){
            availCons('initTwitch','Requesting New Twitch Token...');
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(twtAuthHTML);
          }else{
            if(req.headers.hasOwnProperty('error')){let rawD:string='',errData:any;req.on('data',(chunk)=>{rawD+=chunk});req.on('end',async()=>{if((await isJSON(rawD))){errData=JSON.parse(rawD);availCons('initTwitch','ERROR: '+errData.d.error+' - '+errData.d.msg)}})}
            else{
              if(req.headers.hasOwnProperty('access')&&req.headers.access&&req.headers.access.length>0){
                twtAuth.code=req.headers.access;
                availCons('initTwitch','Received New Code ('+twtAuth.code+')');
                try{
                  const{status,statusText,data}=await axios.post('https://id.twitch.tv/oauth2/token?client_id='+twtAuth.client+'&client_secret='+twtAuth.secret+'&code='+twtAuth.code+'&grant_type=authorization_code&redirect_uri=http://localhost:3333&scope='+twtScopesEnc);
                  if(status===200){
                    availCons('initTwitch','Code => Token SUCCESS!');
                    if(data.hasOwnProperty('access_token')&&twtAuth.token!==data.access_token){twtAuth.token=data.access_token};
                    if(data.hasOwnProperty('refresh_token')&&twtAuth.refresh!==data.refresh_token){twtAuth.refresh=data.refresh_token};
                    if(data.hasOwnProperty('expires_in')&&twtAuth.expires!==data.expires_in){twtAuth.expires=data.expires_in};
                  }else{availCons('initTwitch','Code => Token ERROR: '+String(status)+' - ' + statusText);resolve(false)};
                }catch(e){console.log(e);resolve(false)};
                if(!r||(r&&!_.isEqual(d,twtAuth))){await rwdTwitchAuth('w',twtAuth);availCons('initTwitch','Updated/Saved Twitch Auth')};
                await doSuccess();
                resolve(true);
              }else{availCons('initTwitch','New Token ERROR: No "access" Header Object');resolve(false)};
            };
            res.writeHead(200);
            res.end();
          };
        }).listen(3333);
        killTwtSVR=createHttpTerminator({gracefulTerminationTimeout:1000,server:twtSVR});
        console.log('Twitch Server Running @ '+twtAuth.cbUrl);
        shell.openExternal('https://id.twitch.tv/oauth2/authorize?response_type=code&client_id='+twtAuth.client+'&redirect_uri='+twtAuth.cbUrl+'&scope='+twtScopesEnc);
      }catch(e){console.log('initTwitch - ERROR: Error Creating Server')};
    })
  }else{return Promise.resolve(true)};
}
//------------------------------------------------
function parseTWTTags(t:any){
  const tagsToIgnore={'client-nonce':null,'flags':null};
  let dPTags={},pTags:any[]=t.split(';');
  pTags.forEach((t:any)=>{
    let pT:any[]=t.split('='),tV:any=(pT[1]==='')?null:pT[1];
    switch(pT[0]){
      case 'badges':
      case 'badge-info':
        if(tV){
          let dict:any={},badges:any[]=tV.split(',');
          badges.forEach((p:any)=>{
            let bParts:any[]=p.split('/');
            dict[bParts[0]]=bParts[1]
          });
          dPTags[pT[0]]=dict
        }else{dPTags[pT[0]]=null};
        break;
      case 'emotes':
        if(tV){
          let dEmotes:any={},emotes:any[]=tV.split('/');
          emotes.forEach((e:any)=>{
            let eParts:any[]=e.split(':'),tPos:any=[],ps:any[]=eParts[1].split(',');
            ps.forEach((p:any)=>{
              let pParts:any[]=p.split('-');
              tPos.push({startPosition:pParts[0],endPosition:pParts[1]});
            });
            dEmotes[eParts[0]]=tPos;
          });
          dPTags[pT[0]]=dEmotes;
        }else{dPTags[pT[0]]=null};
        break;
      case 'emote-sets':let eSetIds:any[]=tV.split(',');dPTags[pT[0]]=eSetIds;break;
      default:if(tagsToIgnore.hasOwnProperty(pT[0])){;}else{dPTags[pT[0]]=tV};
    };
  });
  return dPTags;
};
//------------------------------------------------
function parseTWTComm(rawC:any){
  let pC:any=null,cParts:any[]=rawC.split(' ');
  switch(cParts[0]){
    case 'JOIN':pC={command:cParts[0],channel:cParts[1]};break;
    case 'PART':pC={command:cParts[0],channel:cParts[1]};break;
    case 'USERNOTICE':pC={command:cParts[0],channel:cParts[1]}
    case 'NOTICE':
      pC={command:cParts[0]};
      if(cParts[1]&&cParts[1].charAt(0)==='#'){pC['channel']=cParts[1]};
      break;
    case 'CLEARCHAT':
      pC={command:cParts[0]};
      if(cParts[1]&&cParts[1].charAt(0)==='#'){pC['channel']=cParts[1]};
      break;
    case 'HOSTTARGET':
      pC={command:cParts[0]};
      if(cParts[1]){pC['target']=cParts[1]};
      break;
    case 'PRIVMSG':pC={command:cParts[0],channel:cParts[1]};break;
    case 'USERSTATE':pC={command:cParts[0],channel:cParts[1]};break;
    case 'ROOMSTATE':pC={command:cParts[0],channel:cParts[1]};break;
    case 'PING':pC={command:cParts[0]};break;
    case 'CAP':pC={command:cParts[0],isCapRequestEnabled:(cParts[2]==='ACK')?true:false};break;
    case 'GLOBALUSERSTATE':pC={command:cParts[0]};break;
    case 'RECONNECT':pC={command:cParts[0]};break;
    //------------
    case '401':case '402':case '403':case '404':case '405':case '406':case '407':case '408':case '409':case '410':case '411':case '412':case '413':case '414':pC={command:'ERROR',error:cParts[0],msg:'Failed to send to server/channel/nick'};break;
    case '421':pC={command:'ERROR',error:cParts[0],msg:'Unknown command'};break;
    case '432':pC={command:'ERROR',error:cParts[0],msg:'Nickname already in use'};break;
    case '465':pC={command:'ERROR',error:cParts[0],msg:'Password incorrect'};break;
    case '471':pC={command:'ERROR',error:cParts[0],msg:'Channel is full'};break;
    case '473':pC={command:'ERROR',error:cParts[0],msg:'Channel is invite-only'};break;
    case '474':pC={command:'ERROR',error:cParts[0],msg:'Banned from channel'};if(cParts[1]&&cParts[1].charAt(0)==='#'){pC.msg+=' '+cParts[1]};break;
    //------------
    case '001':pC={command:'SERVER',type:cParts[0]};break;
    case '002':pC={command:'SERVER',type:cParts[0]};break;
    case '003':pC={command:'SERVER',type:cParts[0]};break;
    case '004':pC={command:'SERVER',type:cParts[0]};break;
    //------------
    case '352':pC={command:'SERVER',type:'WHOREPLY'};break;
    case '315':pC={command:'SERVER',type:'ENDOFWHO'};break;
    //------------
    case '353':pC={command:'SERVER',type:'NAMREPLY'};break;
    case '366':pC={command:'SERVER',type:'ENDOFNAMES'};break;
    //------------
    case '367':pC={command:'SERVER',type:'BANLIST'};break;
    case '368':pC={command:'SERVER',type:'ENDOFBANLIST'};break;
    //------------
    case '371':pC={command:'SERVER',type:'INFO'};break;
    case '374':pC={command:'SERVER',type:'ENDOFINFO'};break;
    //------------
    case '375':pC={command:'SERVER',type:'MOTDSTART'};break;
    case '372':pC={command:'SERVER',type:'MOTD'};break;
    case '376':pC={command:'SERVER',type:'ENDOFMOTD'};break;
    //------------
    default:pC={command:'NK'};break;
  };
  return pC;
}
//------------------------------------------------
function parseTWTSrc(rawS:any){if(rawS===null){return null}else{let sParts:any[]=rawS.split('!');return {nick:(sParts.length===2)?sParts[0]:null,host:(sParts.length===2)?sParts[1]:sParts[0]}}}
//------------------------------------------------
function parseTWTParams(rawP:any,cmd:any){
  let i:number=0,cParts:any=rawP.slice(i+1).trim(),pIdx:number=cParts.indexOf(' ');
  if(pIdx===-1){cmd.botCommand=cParts.slice(0)}
  else{cmd.botCommand=cParts.slice(0,pIdx);cmd.botCommandParams=cParts.slice(pIdx).trim()};
  return cmd;
}
//------------------------------------------------
function parseTWTMsg(m:any):Promise<any>{
  let pM:any={command:null,tags:null,source:null,parameters:null};
  let mi=0,rawT=null,rawS=null,rawC=null,rawP=null;
  if(m[mi]==='@'){let endIdx=m.indexOf(' ');rawT=m.slice(1,endIdx);mi=endIdx+1};
  if(m[mi]===':'){mi+=1;let endIdx=m.indexOf(' ',mi);rawC=m.slice(mi,endIdx);mi=endIdx+1};
  let endIdx=m.indexOf(':',mi);if(-1==endIdx){endIdx=m.length};
  rawC=m.slice(mi,endIdx).trim();
  if(endIdx!=m.length){mi=endIdx+1;rawP=m.slice(mi)};
  //-----------
  pM.command=parseTWTComm(rawC);
  if(rawT!==null){pM.tags=parseTWTTags(rawT)};
  pM.source=parseTWTSrc(rawS);
  pM.parameters=rawP;
  if(rawP&&rawP[0]==='!'){pM.command=parseTWTParams(rawP,pM.command)};
  //-----------
  if((pM.command.command==='JOIN'||pM.command.command==='PART')&&!pM.parameters){pM.parameters=m.split(' ')[0].split('!')[0].replace(':','')};
  //-----------
  return Promise.resolve(pM);
}
//------------------------------------------------
async function startTWTChat(channel?:string):Promise<boolean>{
  availCons('startTWTChat','()...');
  return new Promise((resolve)=>{
    const wsc=require('websocket').client;twtWSC=new wsc();
    twtWSC.on('connectFailed',(err:any)=>{
      twtChatConn=false;if(childW&&childW.webContents){childW.webContents.send('twtChatConn',[twtChatConn])};
      let msg:string='[CONNECTFAILED]';if(err&&err.toString()){msg+=': '+err.toString()};
      availCons('twtChat|WSEvent',msg);
      resolve(false);
    });
    twtWSC.on('connect',async(cC:any)=>{
      chatConn=cC;
      //------------
      chatConn.on('error',(e:any)=>{
        let msg:string='[ERROR]';if(e&&e.toString()){msg+=': '+e.toString()};
        availCons('twtChat|WSEvent',msg);
        twtChatConn=false;if(childW&&childW.webContents){childW.webContents.send('twtChatErr',[msg])};
      });
      //------------
      chatConn.on('close',(e:any)=>{
        availCons('closeObject',e);
        if(childW&&childW.webContents){childW.webContents.send('twtChatCloseInfo',[e])};
        twtChatConn=false;
        if(childW&&childW.webContents){childW.webContents.send('twtChatConn',[twtChatConn])};
        if(twtCommandListenerOn){ipcMain.removeListener('twtChatCommand',twtCommandListener);twtCommandListenerOn=false};
        if(twtDiscoHandlerOn){ipcMain.removeHandler('twtChatDisconnect');twtDiscoHandlerOn=false};
      });
      //------------
      chatConn.on('message',async(m:any)=>{
        if(m.type==='utf8'){
          let rawM:string=m.utf8Data.trimEnd();
          if(childW&&childW.webContents){childW.webContents.send('rawM',[rawM])};
          availCons('twtChat|WSEvent','[MESSAGE] (Receieve) @ '+new Date().toISOString());
          let mArr:string[]=rawM.split('\r\n');
          for(let msi=0;msi<mArr.length;msi++){
            let pM:any=await parseTWTMsg(mArr[msi]);
            if(pM){
              //-----------
              if(childW&&childW.webContents){childW.webContents.send('twtMsgData',[pM])};
              //-----------
              if(pM.command.command==='PING'){
                const randW=():number=>{return Number((Math.random()*(3-1)+1).toFixed(1))},pongTxt=pM.parameters;
                await doW(randW());
                chatConn.sendUTF('PONG :'+pongTxt);
                availCons('twtChat|PONG|Response','SENT!');
              };
            }else{availCons('twtChat|Event|Error','Message Parse Failed')};
          };
        }else{availCons('twtChat|Event|Error','Message NOT UTF8')};
      });
      //------------
      chatConn.sendUTF('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
      chatConn.sendUTF('PASS oauth:'+twtAuth.token);
      chatConn.sendUTF('NICK '+twtAuth.username);
      twtChatConn=true;if(childW&&childW.webContents){childW.webContents.send('twtChatConn',[twtChatConn])};
      availCons('twtChat|WSEvent','[CONNECT]: Connected to Twitch IRC - OK');
      if(channel){await chatJoinPart('join',channel)};
      if(!twtCommandListenerOn){ipcMain.on('twtChatCommand',twtCommandListener);twtCommandListenerOn=true};
      if(!twtDiscoHandlerOn){ipcMain.handle('twtChatDisconnect',twtDiscoHandler);twtDiscoHandlerOn=true};
      resolve(true);
    });
    twtWSC.connect('wss://irc-ws.chat.twitch.tv:443');
  });
}
//------------------------------------------------
ipcMain.handle('doChatCMD',async(e:any,args:any[]):Promise<boolean>=>{
  availCons('doChatCMD',args[0]);
  try{chatConn.sendUTF(args[0]);return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}})
//------------------------------------------------
ipcMain.handle('doChatJoinPart',async(e:any,args:any[]):Promise<boolean>=>{
  const cjRes:boolean=await chatJoinPart(args[0],args[1]);
  return Promise.resolve(cjRes);
})
//-----------
async function chatJoinPart(joinPart:string,channel:string):Promise<boolean>{
  const jpCMD:string=joinPart.trim().toUpperCase();
  let jpCHN:string=channel;
  if(jpCHN.startsWith('##')){jpCHN=channel.replace('##','#')};
  if(!jpCHN.startsWith('#')){jpCHN='#'+channel};
  availCons('chatJoinPartFn',jpCMD+' '+jpCHN);
  try{
    chatConn.sendUTF(jpCMD+' '+jpCHN);
    await doW(1);
    return Promise.resolve(true);
  }catch(e){return Promise.resolve(false)}
};
//------------------------------------------------
ipcMain.handle('twtSendWhisper',async(e:any,args:any[]):Promise<boolean>=>{
  const userId:string=args[0],msg:string=args[1],swRes:{r:boolean,d:any}=await twtReq('post','whispers',{from_user_id:twtUser.id,to_user_id:userId,message:msg});
  return Promise.resolve(swRes.r);
});
//------------------------------------------------
function twtCommandListener(e:any,args:any[]){
  let cmd:string=args[0].toUpperCase();args[0]!=='PRIVMSG'?cmd+=' #':cmd+=' ';cmd+=args[1];
  chatConn.sendUTF(cmd);
  availCons('twtChat|WSEvent','[MESSAGE] (Send) @ '+new Date().toISOString()+': '+cmd);
}
//------------------------------------------------
function twtDiscoHandler(e:any,args:any[]){chatConn.close();twtChatConn=false;if(childW&&childW.webContents){childW.webContents.send('twtChatConn',[twtChatConn])};return Promise.resolve(true)}
///////////////////////////////////////////////////
ipcMain.handle('getTWTCheermotes',async(e:any,args:any[])=>{
  if(typeof args[0]==='string'&&args[0].length>0){
    const{r,d}=await twtReq('get','bits/cheermotes',{broadcaster_id:args[0],clean_json:true});
    if(r){
      const cMList:string[]=d.map((cmO:any)=>cmO.prefix);
      return Promise.resolve({r:true,d:cMList});
    }else{return Promise.resolve({r:false,d:null})}
  }else{return Promise.resolve({r:false,d:null})};
});
//------------------------------------------------
ipcMain.handle('getTWTChanmotes',async(e:any,args:any[])=>{
  if(typeof args[0]==='string'&&args[0].length>0){
    const{r,d}=await twtReq('get','chat/emotes',{broadcaster_id:args[0]});
    if(r){return Promise.resolve({r:true,d:d});
    }else{return Promise.resolve({r:false,d:null})}
  }else{return Promise.resolve({r:false,d:null})};
});
//------------------------------------------------
ipcMain.handle('getTWTGlobalmotes',async(e:any,args:any[])=>{
  const{r,d}=await twtReq('get','chat/emotes/global');
  if(r){return Promise.resolve({r:true,d:d})}
  else{return Promise.resolve({r:false,d:null})};
});
//------------------------------------------------
ipcMain.handle('getTWTSubLevel',async(e:any,args:any[])=>{
  const{r,d}=await twtReq('get','subscriptions/user',{broadcaster_id:args[0],user_id:139738358});
  if(r&&d&&d.hasOwnProperty('tier')){return Promise.resolve({r:true,d:d.tier})}
  else{return Promise.resolve({r:false,d:null})}
})
//------------------------------------------------
ipcMain.handle('getTWTEvSubs',(e:any,args:any[])=>{
  return twtEvSubs;
});
//------------------------------------------------
async function getTWTEvSubs():Promise<any[]|false>{
  try{
    const{r,d}=await twtReq('get','eventsub/subscriptions');
    if(r){
      twtEvSubs=d;
      availCons('twtEVSubs|NOW',d);
      return Promise.resolve(twtEvSubs);
    }else{return Promise.resolve(false)}}
  catch(e){console.log(e);return Promise.resolve(false)}
}
//------------------------------------------------
async function delTWTEvSubs(subid?:string):Promise<boolean>{
  let delSubIds:string[]=[];
  if(subid){delSubIds=[subid]}else{await getTWTEvSubs();if(twtEvSubs.length>0){delSubIds=twtEvSubs.map(s=>s.id)}else{delSubIds=[]}};
  for(let esi=0;esi<delSubIds.length;esi++){await twtReq('delete','eventsub/subscriptions',{id:delSubIds[esi]})};
  await getTWTEvSubs();
  return Promise.resolve(true);
}
//------------------------------------------------
ipcMain.on('twtEvSubModify',async(e:any,args:any[])=>{
  if(args[0]==='remove'){delTWTEvSubs(args[1])}
  else{addTWTEvSubs(args[1])}
});
//------------------------------------------------
async function addTWTEvSubs(userId?:string):Promise<boolean>{
  const sessId:string=twtEventsSession.id;
  let addUserIds:string[]=[];
  if(userId){addUserIds=[userId]}
  else{await getTwtLives();if(twtLives.length>0){addUserIds=twtLives.map(l=>l.user_id)}};
  for(let nsi=0;nsi<addUserIds.length;nsi++){
    await getTWTEvSubs();
    const existI:number=twtEvSubs.findIndex(s=>s.condition.broadcaster_user_id===addUserIds[nsi]);
    if(existI===-1){
      try{
        await twtReq('post','eventsub/subscriptions',{type:'stream.offline',version:'1',condition:{broadcaster_user_id:addUserIds[nsi]},transport:{method:'websocket',session_id:sessId}});
        availCons('setSub|STREAM.OFFLINE','[+] '+addUserIds[nsi])
      }catch(e){console.log(e)};
    };
  };
  await getTWTEvSubs();
  return Promise.resolve(true);
}
//------------------------------------------------
function startTwitchWSEvents(){
  availCons('startTwitchWSEvents','()...');
  const wsc=require('websocket').client;
  twtEvWSC=new wsc();
  twtEvWSC.on('connectFailed',(err:any)=>{
    twtEventsConn=false;
    if(childW&&childW.webContents){childW.webContents.send('twtEventsConn',[twtEventsConn])};
    let msg:string='[CONNECTFAILED]';if(err&&err.toString()){msg+=': '+err.toString()};
    availCons('twtEvents|WSEvent',msg);
  });
  twtEvWSC.on('connect',async(cC:any)=>{
    eventsConn=cC;
    //------------
    eventsConn.on('error',(e:any)=>{
      let msg:string='[ERROR]';if(e&&e.toString()){msg+=': '+e.toString()};
      availCons('twtEvents|WSEvent',msg);
      if(childW&&childW.webContents){childW.webContents.send('twtEventsErr',[msg])};
    });
    //------------
    eventsConn.on('close',(e:any)=>{
      let clInfo:string='Conn Closed';
      availCons('closeObject',e);
      const clReasons:any={4000:'Internal Server Error',4001:'Client Sent Inbound Traffic',4002:'Client Failed Ping-Pong',4003:'Client Unused',4004:'Reconnect Grace Expired',4005:'Network Timeout',4006:'Network Error',4007:'Invalid Reconnect'};
      if(e.hasOwnProperty('code')){clInfo+=' ('+String(e.code)+') '};
      if(clReasons.hasOwnProperty(e.code)){clInfo+=clReasons[e.code]};
      availCons('twtEvents|WSEvent',clInfo);
      twtEventsConn=false;
      if(childW&&childW.webContents){childW.webContents.send('twtEventsConn',[twtEventsConn])};
    });
    //------------
    eventsConn.on('message',async(m:any)=>{
      let mData:any=JSON.parse(m.utf8Data);
      if(mData.metadata.message_type!=='session_keepalive'){availCons('twtEvents|WSEvent|'+mData.metadata.message_type.toUpperCase(),mData)};
      switch(mData.metadata.message_type){
        case 'session_welcome':
          twtEventsConn=true;
          if(twtEventsSession&&twtEventsSession.hasOwnProperty('reconnect_url')){availCons('>>>>>>>>>','[ [|RE|CONNECTED - OK! ] <<<<<<<<<')}
          else{availCons('>>>>>>>>>','[ CONNECTED - OK ] <<<<<<<<<')};
          twtEventsSession=mData.payload.session;
          await addTWTEvSubs();
          break;
        case 'session_keepalive':break;
        case 'session_reconnect':
          twtEventsSession=mData.payload.session;
          twtEventsConn=false;
          if(childW&&childW.webContents){childW.webContents.send('twtEventsConn',[twtEventsConn])};
          availCons('>>>>>>>>>','[ RECONNECTING ] <<<<<<<<<');
          eventsConn.close();
          await doW(1);
          startTwitchWSEvents();
          break;
        case 'notification':
          availCons('twtEvents|'+mData.metadata.subscription_type.toUpperCase(),mData.payload.event);
          const rawE:any=mData.payload.event;
          switch(mData.metadata.subscription_type){
            case 'stream.online':
            case 'stream.offline':
              availCons('',rawE);
              if(childW&&childW.webContents){childW.webContents.send('twtEventData',[mData.metadata.subscription_type,mData.payload.event])};
              break;
            default:availCons('twtEvents|WSEvent','[UNKNOWN] Subscription Type: '+mData.metadata.subscription_type);
          };
          break;
        case 'revocation':await getTWTEvSubs();break;
        default:availCons('twtEvents|WSEvent','[UNKNOWN] Message Type: '+mData.metadata.message_type);
      };
    });
    //------------
    twtEventsConn=true;
    if(childW&&childW.webContents){childW.webContents.send('twtEventsConn',[twtEventsConn])};
    availCons('twtEvents|WSEvent','[CONNECT]: Connected to Twitch Websocket Events - OK');
  });
  let twtEvWSSURL:string='wss://eventsub.wss.twitch.tv/ws';
  if(twtEventsSession&&twtEventsSession.hasOwnProperty('reconnect_url')&&twtEventsSession.reconnect_url.length>6){twtEvWSSURL=twtEventsSession.reconnect_url};
  twtEvWSC.connect(twtEvWSSURL);
}
//------------------------------------------------
ipcMain.handle('getBPMData',async(e:any,args:any[]):Promise<{r:boolean,d:any}>=>{
  availCons('getBPMData','()...');
  const getBPM=():Promise<number|false>=>{
    return new Promise((resolve)=>{
      execFile(fbBPMExePath,['-d','-p','-f','0',fbMP3Path],(error,stdout,stderr)=>{
        if(error){resolve(false)};
        let bpm:number=parseInt(stdout.trim().split('\n').filter(l=>l.trim().length>0&&!l.includes('\r'))[0].replace(' BPM',''));
        if(bpm<=90){bpm=bpm*2};
        if(bpm>=200){bpm=bpm/2};
        resolve(bpm);
      });
    });
  };
  if(fbInProg){return Promise.resolve({r:false,d:'BPM Calc IN PROGRESS...'})}
  else{
    fbInProg=true;
    const recMP3Res:boolean=await recBPMAudio();
    if(!recMP3Res){if((await exists(fbMP3Path))){try{await unlink(fbMP3Path)}catch(e){console.log(e)}};fbInProg=false;return Promise.resolve({r:false,d:'BPM Record Failed'})}
    else{
      const calcBPMRes:number|false=await getBPM();
      if((await exists(fbMP3Path))){try{await unlink(fbMP3Path)}catch(e){console.log(e)}};
      if(calcBPMRes===false){fbInProg=false;return Promise.resolve({r:false,d:'BPM Detect Failed'})}
      else{fbInProg=false;return Promise.resolve({r:true,d:calcBPMRes})};
    };
  };
});
//------------------------------------------------
async function recBPMAudio():Promise<boolean>{
  if((await exists(fbMP3Path))){try{await unlink(fbMP3Path)}catch(e){console.log(e);return Promise.resolve(false)}};
  return new Promise((resolve)=>{
    const fBSpawn=require('child_process').spawn;
    const doFBRec=fBSpawn(fbFFMPath,['-f','dshow','-i','audio=Line 1 (Virtual Audio Cable)','-t','30',fbMP3Path]);
    doFBRec.on('close',async(code:any)=>{
      if((code===0||code==='0')&&(await exists(fbMP3Path))){resolve(true)}
      else{resolve(false)};
    });
  });
};
//------------------------------------------------
ipcMain.handle('findTune',async(e:any,args:any[]):Promise<{r:boolean,d:any}>=>{
  const dCode=(s:string):string=>{return decodeURIComponent(s.replace(/\+/g,' '))};
  // NEW SHAZAM
  const shazRecAudio=async():Promise<boolean>=>{
    return new Promise((resolve)=>{
      let errs:number=0;
      const fTSpawn=require('child_process').spawn;
      const doRec=fTSpawn(ftFFMPath,['-f','dshow','-i','audio=Line 1 (Virtual Audio Cable)','-t','5','-y','-f','s16le','-ac','1','-acodec','pcm_s16le',ftRAWPath]);
      doRec.on('close',async(code:number)=>{
        if(code===0&&(await exists(ftRAWPath))){availCons('findTune|FFMPEG|Record','Sample RAW SUCCESS');resolve(true)}
        else{availCons('findTune|FFMPEG|Record','Sample RAW FAILED ('+String(errs)+' Errors) - Code:'+String(code));resolve(false)};
      });
    });
  };
  if((await exists(ftRAWPath))){try{await unlink(ftRAWPath)}catch(e){console.log(e)}};
  childW.webContents.send('findTuneStatus',['recording']);
  const doRecRes:boolean=await shazRecAudio();
  if(doRecRes){
    childW.webContents.send('findTuneStatus',['matching']);
    const ftData:string=await readFile(ftRAWPath,{encoding:'base64'});
    try{
      const aRes:any=await axios.post(ftAPIUrl,ftData,ftReqOpts);
      let ftResObj:any={artist:'',title:'',album:'',label:'',year:''};
      if(aRes.status===200&&aRes.data.hasOwnProperty('matches')&&aRes.data.matches.length>0&&aRes.data.hasOwnProperty('track')&&!_.isEmpty(aRes.data.track)){
        const ftR:any=aRes.data.track;
        if(ftR.hasOwnProperty('urlparams')&&!_.isEmpty(ftR.urlparams)&&ftR.urlparams.hasOwnProperty('{tracktitle}')&&ftR.urlparams['{tracktitle}']&&ftR.urlparams['{tracktitle}'].length>0&&ftR.urlparams.hasOwnProperty('{trackartist}')&&ftR.urlparams['{trackartist}']&&ftR.urlparams['{trackartist}'].length>0){
          ftResObj.artist=dCode(ftR.urlparams['{trackartist}']);
          ftResObj.title=dCode(ftR.urlparams['{tracktitle}']);
        }else if(ftR.hasOwnProperty('share')&&!_.isEmpty(ftR.share)&&ftR.share.hasOwnProperty('subject')&&ftR.share.subject&&ftR.share.subject.length>0){
          const shareStrArr:string[]=ftR.share.subject.split(' - ');
          ftResObj.artist=shareStrArr[1].trim();
          ftResObj.title=shareStrArr[0].trim();
        };
        if(ftR.hasOwnProperty('sections')&&!_.isEmpty(ftR.sections)){
          const songArr:any[]=ftR.sections.filter(s=>s.type==='SONG');
          if(songArr.length>0){
            const songObj:any=songArr[0];
            if(songObj.hasOwnProperty('metadata')&&songObj.metadata&&songObj.metadata.length>0){
              const albumArr:any[]=songObj.metadata.filter(mO=>mO.title==='Album');
              if(albumArr.length>0){if(albumArr[0].text.toLowerCase().includes(' - single')){ftResObj.album='Single'}else{ftResObj.album=albumArr[0].text}};
              const labelArr:any[]=songObj.metadata.filter(mO=>mO.title==='Label');
              if(labelArr.length>0){ftResObj.label=labelArr[0].text};
              const yearArr:any[]=songObj.metadata.filter(mO=>mO.title==='Released');
              if(yearArr.length>0){ftResObj.year=yearArr[0].text};
            };
          };
        };
        //-----------
        if(ftResObj.artist.length>0&&ftResObj.title.length>0){return Promise.resolve({r:true,d:ftResObj});
        }else{return Promise.resolve({r:false,d:'lackdetail'})};
        //-----------
      }else{return Promise.resolve({r:false,d:'notfound'})};
    }catch(e){console.log(e);return Promise.resolve({r:false,d:'error'})};
  }else{console.log('ABORTED - Recording Failed');return Promise.resolve({r:false,d:'error'})};
});
//------------------------------------------------
async function initFFMPEG():Promise<boolean>{
  console.log('initFFMPEG ()...');
  let newFPaths:any=ffPaths;
  let appPath:string=app.getAppPath();console.log('initFFMPEG App Path: '+appPath);
  for(const k of Object.keys(ffPaths)){
    const defP=path.join(appPath,'binary/'+k+'.exe');
    if((await exists(defP))){newFPaths[k]=defP;console.log('initFFMPEG Added '+k.toUpperCase()+' to ffPaths: '+defP)}
    else{newFPaths[k]=null;console.log('initFFMPEG !!! MISSING !!! '+k.toUpperCase()+' - .exe !==exist')};
  };
  ffPaths=newFPaths;
  if(ffPaths.ffmpeg!==null&&ffPaths.ffplay!==null&&ffPaths.ffprobe!==null){console.log('initFFMPEG SUCCESS! All ffPaths Set - OK')}
  else{let errPs:string[]=[];for(const[k,v] of Object.entries(ffPaths)){if(v===null){errPs.push(k)};console.log('initFFMPEG ERROR: Missing .EXEs: '+errPs.join(', '))}};
  if(childW&&childW.webContents){childW.webContents.send('ffPaths',[ffPaths])};
  return Promise.resolve(true);
}
//////////////////////////////////////////////////
///// YTDL MODULE
//////////////////////////////////////////////////
async function rwdYTDLData(action:'r'|'w'|'d',data?:any):Promise<{r:boolean,d?:any}>{
  const ytPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/ytdl');
  const rData=async():Promise<{r:boolean,d:any}>=>{if(!(await exists(ytPath))||(await statSize(ytPath)).d===0){return Promise.resolve({r:false,d:null})};try{const rR:string=await readFile(ytPath,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){availCons('rwdYTDLData','YTDL Data File [READ] - OK');return Promise.resolve({r:true,d:JSON.parse(rR)})}else{return Promise.resolve({r:false,d:'ERROR: JSON Parse Failed'})}}catch(e){console.log(e);return Promise.resolve({r:false,d:e})}};
  const wData=async(wD:any):Promise<boolean>=>{const ytStr:string=JSON.stringify(wD);try{await writeFile(ytPath,ytStr,{encoding:'utf-8'});availCons('rwdYTDLData','YTDL Data File [WRITE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  const dData=async():Promise<boolean>=>{if((await exists(ytPath))){try{await unlink(ytPath);availCons('rwdYTDLData','YTDL Data File [DELETE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}}else{return Promise.resolve(true)}};
  if(action==='r'){return Promise.resolve((await rData()))}
  else if(action==='w'){return Promise.resolve({r:(await wData(data))})}
  else{return Promise.resolve({r:(await dData())})};
};
//-------------------------------------------------
ipcMain.handle('readHistoryDrop',async(e:any,args:any[])=>{
  const readHTML=async(p:string):Promise<string|false>=>{try{const rr=await readFile(p,{encoding:'utf-8'});if(rr&&rr.length>0){return Promise.resolve(rr)}}catch{return Promise.resolve(false)}}
  const doHistConv=async(hfp:string):Promise<any[]|false>=>{
    const vcUrlIsV=urlString=>{var urlPattern=new RegExp('^(https?:\\/\\/)?'+'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+'((\\d{1,3}\\.){3}\\d{1,3}))'+'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+'(\\?[;&a-z\\d%_.~+=-]*)?'+'(\\#[-a-z\\d_]*)?$','i');return !!urlPattern.test(urlString)};
    const readHTMLRes=await readHTML(hfp);
    if(readHTMLRes===false){console.log('FAILED - Error Reading HTML File');return Promise.resolve(false)}
    else{
      //------------
      let finHA=[];
      //------------
      let bodyTxt=readHTMLRes.split('</style></head><body><div class="mdl-grid">')[1];
      let rb=bodyTxt.replaceAll('<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp">','XXX<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp">');
      const gBodArr=rb.split('XXX');
      for(let gbi=0;gbi<gBodArr.length;gbi++){
        let l=gBodArr[gbi];
        if(l.trim().length>0){
          l=l.replace('<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp"><div class="mdl-grid"><div class="header-cell mdl-cell mdl-cell--12-col"><p class="mdl-typography--title">YouTube<br></p></div><div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">Watched','');
          l=l.replace(/ class="[a-zA-Z0-9:;\.\s\(\)\-\,]*"/gi,'');
          l=l.replace('</div><div></div><div><b>Products:</b><br>&emsp;YouTube<br><b>Why is this here?</b><br>&emsp;This activity was saved to your Google Account because the following settings were on:&nbsp;YouTube watch history.&nbsp;You can control these settings &nbsp;<a href="https://myaccount.google.com/activitycontrols">here</a>.</div></div></div>','');
          if(l.startsWith('<a href=')){
            const lArr=l.split('">'),u=lArr[0].replace('<a href="','').trim(),t=lArr[1].split('</a>')[0].trim().replace(/&nbsp;/g,'');
            let d;if(lArr[2]){d=lArr[2].split('<br>')[1].split('AWST')[0]}else{d='NK'};
            finHA.push({vUrl:u,vTitle:t,date:d});
          }
        }
      };
      //------------
      let ddArr=[];
      //------------
      for(let ci=0;ci<finHA.length;ci++){
        let hO=finHA[ci];
        if(!(vcUrlIsV(finHA[ci].vUrl))){hO.vUrl='https://youtube.com'};
        hO.vTitle=finHA[ci].vTitle.replace(/[^a-zA-Z0-9]/g,' ').trim().replace(/\s+/g,' ');
        if(hO.date!=='NK'){const ddns=finHA[ci].date.replace(/\u202FAM/g,'AM').replace(/[^a-zA-Z0-9:,]+/g,''),dp=parse(ddns,'MMMd,yyyy,h:mm:ssa',new Date());if(isValid(dp)){hO.date=format(dp,'dd/MM/yy HH:mm:ss');ddArr.push(hO)}}
      };
      return Promise.resolve(ddArr);
    }
  };
  //----------
  const hFPath:string=args[0];
  if(args[0]&&args[0].length>0&&(await exists(hFPath))){
    const sS:{r:boolean,d:number}=await statSize(hFPath);
    if(sS.r&&sS.d>0){
      const hArr:any[]|false=await doHistConv(path.resolve(args[0]));
      if(hArr!==false){return Promise.resolve(hArr)}
      else{return Promise.resolve([])}
    }else{return Promise.resolve([])}
  }else{return Promise.resolve([])}
});
//-------------------------------------------------
ipcMain.handle('readYTDLData',async(e:any,args:any[]):Promise<WCYTDLData>=>{
  const ytPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/ytdl');
  if(ytdlData&&typeof ytdlData==='object'&&!_.isEmpty(ytdlData)){return Promise.resolve(ytdlData)}
  else{
    const dD:WCYTDLData={scrapeItems:[],searchItems:[],selectedItems:[],dlBatches:[],finSessions:[],myDaily:{mySubs:[],myDls:[],myKodi:{playlists:[],logs:[]},myHistory:[]}};
    if(!(await exists(ytPath))){await rwdYTDLData('w',dD);ytdlData=dD;return Promise.resolve(dD)}
    else{const{r,d}=await rwdYTDLData('r');if(r&&d){ytdlData=d;return Promise.resolve(d)}else{await rwdYTDLData('w',dD);ytdlData=dD;return Promise.resolve(dD)}};
  };
});
//-------------------------------------------------
ipcMain.handle('ytdlDLPLThumbnail',async(e:any,args:any[]):Promise<string|false>=>{
  availCons('IPCMAIN|ytdlDLPLThumbnail',args[0]+' / '+args[1]);
  const jpgUrl:string=args[0],vId:string=args[1];
  const dayPLDirName:string=format(new Date(),'ddMMyy');
  const baseDayPLDir:string='C:\\myYTDLData\\mydaily\\kodipls\\'+dayPLDirName;
  const thumbPath:string=path.join(baseDayPLDir,'thumb_'+vId);
  const fixThumbExt=():Promise<string|false>=>{
    const tDir:string='C:\\myYTDLData\\bins',tExe:string=path.join(tDir,'trid.exe'),tDef:string=path.join(tDir,'triddefs.trd');
    return new Promise(async(resolve)=>{
      try{
        const tridProc:any=spawn(tExe,[thumbPath,'-ce','-d:'+tDef,'-n:0'],{windowsHide:true});
        tridProc.on('close',async()=>{
          const newList:string[]=await readdir(baseDayPLDir);
          if(newList&&newList.length>0){
            let matchFNStr:string|null=null;
            for(let ti=0;ti<newList.length;ti++){const tN:string=newList[ti];if(tN.includes('thumb_'+vId)){matchFNStr=tN}};
            if(matchFNStr){const fixdFullPath:string=path.join(baseDayPLDir,matchFNStr);resolve(fixdFullPath)}
            else{resolve(false)};
          }else{resolve(false)};
        });
      }catch(e){resolve(false)};
    });
  };
  const dlThumb=():Promise<boolean>=>{
    return new Promise((resolve)=>{
      const fileStream=fs.createWriteStream(thumbPath);
      https.get(jpgUrl,(response)=>{
        response.pipe(fileStream);
        fileStream.on('finish',()=>{fileStream.close();resolve(true)});
        fileStream.on('error',(e)=>{console.log(e);resolve(false)});
      }).on('error',(e)=>{console.log(e);resolve(false)});
    });
  };
  const remThumb=async(path:string):Promise<boolean>=>{try{await unlink(path);return Promise.resolve(true)}catch(e){return Promise.resolve(false)}};
  //--------------
  const noExtPath:string=thumbPath;
  const neTStatRes:{r:boolean,d:any}=await statSize(noExtPath);
  const jpgExtPath:string=thumbPath+'.jpg';
  const jpTStateRes:{r:boolean,d:any}=await statSize(jpgExtPath);
  if(jpTStateRes.r){return Promise.resolve(jpgExtPath)}
  else{if((await exists(jpgExtPath))){await remThumb(jpgExtPath)}};
  if(neTStatRes.r){
    const doFixRes:string|false=await fixThumbExt();
    if(doFixRes){return Promise.resolve(doFixRes)}
    else{return Promise.resolve(noExtPath)}
  }else{if((await exists(noExtPath))){await remThumb(noExtPath)}};
  const doDL:boolean=await dlThumb();
  if(doDL){
    const doFixExt:string|false=await fixThumbExt();
    if(doFixExt){return Promise.resolve(doFixExt)}
    else{return Promise.resolve(thumbPath)};
  }else{return Promise.resolve(false)};
});
//-------------------------------------------------
ipcMain.handle('writeYTDLData',async(e:any,args:any[]):Promise<boolean>=>{
  const wRes:{r:boolean}=await rwdYTDLData('w',args[0]);
  if(wRes.r){ytdlData=args[0];return Promise.resolve(true)}
  else{return Promise.resolve(false)};
});
//------------------------------------------------
const getRnd3WordTerm=async():Promise<string>=>{const gRST:string=await randomST();return Promise.resolve(gRST)};
const getYTTrends=async():Promise<any[]|false>=>{
  try{
    const{status,data}=await axios.get(trendYTAPIUrl,trendYTReqOpts);
    if(status===200&&data&&data.length>0){
      let trendYTVids:any[]=[];
      for(let vi=0;vi<data.length;vi++){
        const v:any=data[vi];
        trendYTVids.push({id:v.videoId,title:v.title,url:v.videoUrl,channel:{id:v.channelUrl,name:v.channelName,url:v.channelUrl}});
      };
      return Promise.resolve(trendYTVids);
    }else{return Promise.resolve(false)};
  }catch(e){return Promise.resolve(false)};
};
const getTwitterTrends=async():Promise<{r:boolean,d:any}>=>{
  try{
    const{status,data}=await axios.get(trendTwitterAPIUrl,trendTwitterReqOpts);
    if(status===200&&data.success&&data.data.modules.length>0){
      const trendsArr:any[]=data.data.modules;
      let trendStrArr:string[]=[];
      for(let mi=0;mi<trendsArr.length;mi++){
        const t:string=trendsArr[mi].trend.name.trim().replace(/#/g,'');
        if(t.length>3){
          trendStrArr.push(t);
        };
      };
      return Promise.resolve({r:true,d:trendStrArr});
    }else{return Promise.resolve({r:false,d:null})};
  }catch(e){return Promise.resolve({r:false,d:null})};
};
ipcMain.handle('getYTDLTerms',async(e:any,args:any[]):Promise<WCYTDLGetTermResult[]>=>{
  let gTopicsRes:WCYTDLGetTermResult[]=[],gTopicMax:number=100,gTopicCount:number=0;
  const gYTTRes:WCYTDLGetVidResult[]|false=await getYTTrends();
  if(gYTTRes){
    const gYTTResObj:WCYTDLGetTermResult={type:'ytt',item:gYTTRes};
    gTopicsRes.push(gYTTResObj);
    gTopicCount++;
    gTopicMax--
  };
  if(gTopicsRes.length>=100){
    if(gTopicsRes.length>100){gTopicsRes=gTopicsRes.slice(0,100)};
    return Promise.resolve(gTopicsRes);
  }else{
    const gTTRes:{r:boolean,d:any}=await getTwitterTrends();
    if(gTTRes.r){
      const gTTResObjs:WCYTDLGetTermResult[]=gTTRes.d.map((s:string)=>{return {type:'twt',item:s}});
      gTopicsRes=gTopicsRes.concat(gTTResObjs);
      gTopicCount+=gTTResObjs.length;
      gTopicMax-=gTTResObjs.length
    };
    if(gTopicsRes.length>=100){
      if(gTopicsRes.length>100){gTopicsRes=gTopicsRes.slice(0,100)};
      return Promise.resolve(gTopicsRes);
    }else{
      for(let mi=0;mi<gTopicMax;mi++){
        const gRTRes:string=await getRnd3WordTerm();
        const gRTObj:WCYTDLGetTermResult={type:'rnd',item:gRTRes};
        gTopicsRes.push(gRTObj);
      };
      return Promise.resolve(gTopicsRes);
    };
  };
});
//------------------------------------------------
const str2Secs=(s:string):number|false=>{
  if(typeof s!=='string'){return}
  let ttlS:number=0;
  try{
    if(s.includes(':')){
      const partsArr:string[]=s.split(':');
      if(partsArr.length===2){ttlS+=((Number(partsArr[0]))*60);ttlS+=Number(partsArr[1])}
      else if(partsArr.length===3){ttlS+=((Number(partsArr[0]))*60*60);ttlS+=((Number(partsArr[1]))*60);ttlS+=Number(partsArr[2])}
      else{availCons('IPCMain|ytdlGetDurOnly','ERROR: convert durStr -> seconds failed');return false};
    }else{ttlS=Number(s)};
    return ttlS
  }catch(e){
    console.log(e);
    availCons('IPCMain|ytdlGetDurOnly','ERROR: convert durStr -> seconds failed');return false}
};
//------------------------------------------------
ipcMain.handle('ytdlMDDLVideo',async(e:any,args:any[]):Promise<boolean>=>{
  const ytdlExePath:string='C:\\myYTDLData\\bins\\ytdl.exe'
  const videoURL:string='http://www.youtube.com/watch?v='+args[0];
  const baseDir:string='C:\\myYTDLData\\mydaily\\kodipls';
  const dayDirStr:string=format(new Date(),'ddMMyy');
  const vDLDirPath:string=path.join(baseDir,dayDirStr);
  const vDLFilePath:string=path.join(vDLDirPath,'video_'+args[0]+'.mp4');
  const dlVid=():Promise<boolean>=>{
    return new Promise((resolve)=>{
      try{
        let dlSTMS:number=Date.now();
        const cmdSpawn=require('child_process').spawn;
        const cmdProc=cmdSpawn(ytdlExePath,['-f','bestvideo[height<720]+bestaudio/best[height<720]','-o',vDLFilePath,'--merge-output-format','mp4',videoURL]);
        cmdProc.stdout.on('data',async(data:any)=>{
          let wI:number|false=await getMWBrwsr('ytdl');
          if(wI&&wI!==-1){
            const output:string=data.toString();
            if(output.trim().startsWith('[download]')&&output.includes(' of ')&&output.includes(' at ')&&output.includes(' ETA ')){
              const percNo:number=parseInt(output.split(' of ')[0].replace('[download]','').replace('%','').trim(),10)/100;
              const percStr:string=(percNo*100).toFixed(0)+'%';
              const bytesRegex:RegExp=/[0-9]+\.[0-9]+/g;
              let ttlBytesNo:number=0,ttlBytesStr:string='0';
              const ttlBMatch=output.split(' of ')[1].split(' at ')[0].trim().match(bytesRegex);
              if(ttlBMatch){ttlBytesNo=Math.floor(Number(ttlBMatch[0]));ttlBytesStr=String(ttlBytesNo)+'%'};
              let dlSpdNo:number=0,dlSpdStr:string='0';
              const dlBMatch=output.split(' at ')[1].split(' ETA ')[0].trim().match(bytesRegex);
              if(dlBMatch){dlSpdNo=Number(dlBMatch[0]);dlSpdStr=dlSpdNo.toFixed(1)};
              let dlBytesNo:number=0,dlBytesStr:string='0';
              if(ttlBytesNo>0&&percNo>0){dlBytesNo=Number((ttlBytesNo*percNo).toFixed(1))}
              let dlETASecs:number=-1,dlETAStr:string='?';
              const rawETA:string=output.split(' ETA ')[0].trim();
              const cvtETARes:false|number=str2Secs(rawETA);
              if(cvtETARes!==false){dlETASecs=cvtETARes;dlETAStr=rawETA};
              const elaNo:number=(Date.now()-dlSTMS)/1000;
              const elaStr:string=s2T(elaNo);
              let cmdProgObj:WCMDDLCMDProg={dl:{no:dlBytesNo,str:dlBytesStr},ttl:{no:ttlBytesNo,str:ttlBytesStr},perc:{no:percNo,str:percStr},spd:{no:dlSpdNo,str:dlSpdStr},ela:{no:elaNo,str:elaStr},eta:{no:dlETASecs,str:dlETAStr}};
              moreWins[wI].webContents.send('ytdlMDDLVideoProg',[cmdProgObj]);
              availCons('ipcMAIN|ytdlMDDLVideo',cmdProgObj);
            }
          }
        });
        cmdProc.on('error',(e)=>{availCons('IPCMain|ytdlMDDLVideo',e);resolve(false)});
        cmdProc.on('close',(code:any)=>{if(code===0||code==='0'){resolve(true)}else{resolve(false)}});
      }catch(e){availCons('IPCMain|ytdlMDDLVideo',e);resolve(false)};
    });
  };
  const cmdDLRes:boolean=await dlVid();
  return Promise.resolve(cmdDLRes);
})
//------------------------------------------------
ipcMain.handle('localGetDurOnly',async(e:any,args:any[]):Promise<{secs:number,str:string}|false>=>{
  const ffProbePath:string=path.normalize('C:\\myYTDLData\\bins\\ffprobe.exe');
  const lclVPath:string=path.normalize(args[0]);
  const getDur=():Promise<number|false>=>{
    return new Promise((resolve)=>{
      const cmdSpawn=require('child_process').spawn,cmdProc=cmdSpawn(ffProbePath,[lclVPath,'-show_entries','format=duration','-of','compact=p=0:nk=1','-v','0']);
      let gDRes:number|false=false;
      cmdProc.stdout.on('data',(data:any)=>{if(Number(data)&&Number(data)>0){gDRes=Math.round(Number(data))}});
      cmdProc.on('close',async(code:any)=>{if((code===0||code==='0')&&gDRes!==false){resolve(gDRes)}else{resolve(false)}})
    });
  };
  //-----------------
  if((await exists(lclVPath))){
    const gDRes:number|false=await getDur();
    if(gDRes!==false){return Promise.resolve({secs:gDRes,str:(s2T(gDRes))})}
    else{return Promise.resolve(false)}
  }else{return Promise.resolve(false)}
});
//------------------------------------------------
ipcMain.handle('ytdlGetDurOnly',async(e:any,args:any[]):Promise<number>=>{
  const gDORes:number=await ytdlGetDurOnly(args[0]);
  return Promise.resolve(gDORes);
});
async function ytdlGetDurOnly(idOrUrl:string):Promise<number>{
  const ytdlExePath:string='C:\\myYTDLData\\bins\\ytdl.exe';
  let videoURL:string='http://www.youtube.com/watch?v='+idOrUrl;
  if(idOrUrl.startsWith('http://')||idOrUrl.startsWith('https://')){videoURL=idOrUrl};
  const getDur=():Promise<string|false>=>{
    return new Promise((resolve)=>{
      const cmdSpawn=require('child_process').spawn,cmdProc=cmdSpawn(ytdlExePath,['--get-duration',videoURL]);
      let gDRes:string|false='';
      cmdProc.stdout.on('data',(data:any)=>{if(data){gDRes+=data.toString()}});
      cmdProc.on('close',async(code:any)=>{if((code===0||code==='0')&&gDRes!==false){resolve(gDRes)}else{resolve(false)}})
    });
  };
  const gDR:string|false=await getDur();
  if(gDR!==false){
    const s2SR:number|false=str2Secs(gDR);
    if(s2SR!==false){return Promise.resolve(s2SR)}
    else{return Promise.resolve(0)}
  }else{availCons('IPCMain|ytdlGetDurOnly','ERROR: get-duration FAILED for '+idOrUrl);return Promise.resolve(0)}
}
//////////////////////////////////////////////////
// WEBCAM MOTION FUNCTIONS
//////////////////////////////////////////////////
ipcMain.on('webcamMotion',(e:any,args:any[])=>{webcamMotion=args[0]});
//////////////////////////////////////////////////
// WIFING MODULE
//////////////////////////////////////////////////
const kaliPLinkBase:string[]=['-batch','-ssh','root@192.168.0.5','-pw','***********'];
let monModes:any={wlan0:false,wlan1:false};
const kaliIWConfig:string[]=['iwconfig'];
const kaliAirmonStartMM:string[]=['airmon-ng','start'];
const kaliAirmonStopMM:string[]=['airmon-ng','stop'];
let dumpNGProcess:any={inprog:false,pid:-1,proc:null,dumpINT:null,prevDD:[]};
let dumpIsPaused:boolean=false;
const kaliDumpStart:string[]=['airodump-ng','wlan0','-w','/mnt/hgfs/PC/KaliVM/ngData/dump','--output-format','csv','--write-interval','1','--update','1'];
const dumpCSVFPath:string=path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\dump-01.csv');
//------------------------------------------------
async function rwdWIFINGData(action:'r'|'w'|'d',data?:any):Promise<{r:boolean,d?:any}>{
  const wingPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/wifing');
  const rData=async():Promise<{r:boolean,d:any}>=>{if(!(await exists(wingPath))||(await statSize(wingPath)).d===0){return Promise.resolve({r:false,d:null})};try{const rR:string=await readFile(wingPath,{encoding:'utf-8'});if(rR&&(await isJSON(rR))){availCons('rwdWIFINGData','WIFING Data File [READ] - OK');return Promise.resolve({r:true,d:JSON.parse(rR)})}else{return Promise.resolve({r:false,d:'ERROR: JSON Parse Failed'})}}catch(e){console.log(e);return Promise.resolve({r:false,d:e})}};
  const wData=async(wD:any):Promise<boolean>=>{const ytStr:string=JSON.stringify(wD);try{await writeFile(wingPath,ytStr,{encoding:'utf-8'});availCons('rwdWIFINGData','WIFING Data File [WRITE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
  const dData=async():Promise<boolean>=>{if((await exists(wingPath))){try{await unlink(wingPath);availCons('rwdWIFINGData','YTDL Data File [DELETE] - OK');return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}}else{return Promise.resolve(true)}};
  if(action==='r'){return Promise.resolve((await rData()))}
  else if(action==='w'){return Promise.resolve({r:(await wData(data))})}
  else{return Promise.resolve({r:(await dData())})};
};
//-------------------------------------------------
ipcMain.handle('writeWIFINGData',async(e:any,args:any[]):Promise<boolean>=>{
  const wRes:{r:boolean}=await rwdWIFINGData('w',args[0]);
  if(wRes.r){wingData=args[0];return Promise.resolve(true)}
  else{return Promise.resolve(false)};
});
//-------------------------------------------------
ipcMain.handle('readWIFINGData',async(e:any,args:any[]):Promise<any>=>{
  const wingPath:string=path.join(app.getPath('documents'),'wifiCUE/wcdata/wifing');
  if(wingData&&typeof wingData==='object'&&!_.isEmpty(wingData)){return Promise.resolve(wingData)}
  else{
    const dD:WCWifingSaveData=defWifingSaveData;
    if(!(await exists(wingPath))){await rwdWIFINGData('w',dD);wingData=dD;return Promise.resolve(dD)}
    else{const{r,d}=await rwdWIFINGData('r');if(r&&d){wingData=d;return Promise.resolve(d)}else{await rwdWIFINGData('w',dD);ytdlData=dD;return Promise.resolve(dD)}};
  };
});
//------------------------------------------------
// OUIDB
//------------------------------------------------
const newDBFP:string=path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\OUI\\ouidb.json');
const oldDBFP:string=path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\OUI\\fallback\\ouidb.json');
let ouiDBData:any=null;
//------------------------------------------------
ipcMain.handle('updateOUIDBStatus',async(e:any,args:any[]):Promise<string>=>{
  let fetchDBStatusRes:string=await dlFreshOUIDB();
  if(fetchDBStatusRes!=='none'){
    const readRes:boolean=await readOUIData(fetchDBStatusRes);
    if(!readRes){fetchDBStatusRes='none'};
  };
  return Promise.resolve(fetchDBStatusRes);
});
//------------------------------------------------
async function readOUIData(status:string):Promise<boolean>{
  try{
    let rawJSONStr:string='';
    if(status==='new'){rawJSONStr=await fs.promises.readFile(newDBFP,{encoding:'utf-8'})}
    else{rawJSONStr=await fs.promises.readFile(oldDBFP,{encoding:'utf-8'})};
    if((await isJSON(rawJSONStr))){ouiDBData=JSON.parse(rawJSONStr);return Promise.resolve(true)}
    else{return Promise.resolve(false)}
  }catch(e){e=e;return Promise.resolve(false)}
};
//------------------------------------------------
ipcMain.handle('matchMAC2OUI',async(e:any,args:any[]):Promise<WCWifingMOPairs|false>=>{
  if(ouiDBData===null){return Promise.resolve(false)}
  else{
    const missMacArr:string[]=args[0];
    let moPairs:WCWifingMOPairs={};
    for(let mi=0;mi<missMacArr.length;mi++){
      const f6Arr:string[]=missMacArr[mi].split(':'),f6Prefix:string=f6Arr[0]+f6Arr[1]+f6Arr[2];
      if(f6Prefix.length===6){
        const matchI:number=ouiDBData.findIndex((oO:WCWifingOUIObj)=>oO.prefix===f6Prefix);
        if(matchI!==-1){moPairs[missMacArr[mi]]=ouiDBData[matchI]}
        else{moPairs[missMacArr[mi]]=null}
      }else{moPairs[missMacArr[mi]]=null}
    };
    return Promise.resolve(moPairs);
  }
});
//------------------------------------------------
async function statOUIDB():Promise<string>{
  const newDBExist:boolean=await exists(newDBFP);
  const newDBStat:{r:boolean,d:any}=await statSize(newDBFP);
  if(newDBExist&&newDBStat.r&&newDBStat.d>0){return Promise.resolve('new')}
  else{
    const oldDBExist:boolean=await exists(oldDBFP);
    const oldDBStat:{r:boolean,d:any}=await statSize(oldDBFP);
    if(oldDBExist&&oldDBStat.r&&oldDBStat.d>0){return Promise.resolve('old')}
    else{return Promise.resolve('none')}
  }
}
//------------------------------------------------
async function dlFreshOUIDB():Promise<string>{
  if((await exists(newDBFP))){try{await unlink(newDBFP)}catch(e){e=e}};
  const dlDBChild=require('child_process').spawn;
  const dlDBRes=async():Promise<string>=>{
    return new Promise(async(resolve)=>{
      const mmIWProc=dlDBChild('powershell.exe',['-Command','Invoke-WebRequest','-Uri','https://raw.githubusercontent.com/jfisbein/ouidb-json/master/ouidb.json','-OutFile',newDBFP]);
      mmIWProc.on('close',async(code:any)=>{
        const checkDBFiles:string=await statOUIDB();
        resolve(checkDBFiles)
      });
    });
  };
  const updateDBFilesRes:string=await dlDBRes();
  return Promise.resolve(updateDBFilesRes);
}
//------------------------------------------------
// MonMode - airmon-ng
//------------------------------------------------
ipcMain.handle('toggleMonMode',async(e:any,args:any[]):Promise<{r:boolean,d:any}>=>{
  const doToggleRes:boolean=await toggleMonMode(args[0],args[1]);
  return Promise.resolve({r:doToggleRes,d:monModes});
});
//------------------------------------------------
async function toggleMonMode(ss:string,iF:string):Promise<boolean>{
  const airmonChild=require('child_process').spawn;
  const mmIW=async():Promise<{wlan0:boolean,wlan1:boolean}|false>=>{
    let mmIWParams:string[]=kaliPLinkBase.concat(kaliIWConfig),mmIWData:string|null=null;
    return new Promise(async(resolve)=>{
      const mmIWProc=airmonChild('plink',mmIWParams,{encoding:'utf8'});
      mmIWProc.stdout.on('data',(stdoutData:any)=>{if(stdoutData){mmIWData+=stdoutData.toString()}});
      mmIWProc.stderr.on('data',(stderrData:any)=>{stderrData=stderrData;resolve(false)})
      mmIWProc.on('close',(code:any)=>{
        if(String(code)!=='0'){resolve(false)}
        else{
          if(mmIWData!==null&&mmIWData&&mmIWData.length>0){
            let iwLines:string[]=mmIWData.split('\n');
            const wlan0ModeLineIndex:number=iwLines.findIndex((l:string)=>l.includes('wlan0')&&l.includes('Mode:'));
            const wlan1ModeLineIndex:number=iwLines.findIndex((l:string)=>l.includes('wlan1')&&l.includes('Mode:'));
            if(wlan0ModeLineIndex===-1||wlan1ModeLineIndex===-1){resolve(false)}
            else{
              const wlan0Mode:string=iwLines[wlan0ModeLineIndex].trim().split('Mode:')[1].split('Access Point')[0].trim().toLowerCase();
              const wlan1Mode:string=iwLines[wlan1ModeLineIndex].trim().split('Mode:')[1].split('Access Point')[0].trim().toLowerCase();
              if((wlan0Mode==='managed'||wlan0Mode==='monitor')&&wlan1Mode==='managed'||wlan1Mode==='monitor'){
                resolve({wlan0:(wlan0Mode==='managed'?false:true),wlan1:(wlan1Mode==='managed'?false:true)});
              }else{resolve(false)}
            };
          }else{resolve(false)};
        };
      });
    });
  };
  //-------------
  const mmStart=async(interF:string):Promise<boolean>=>{
    let thisIFStartMM:string[]=kaliAirmonStartMM;thisIFStartMM.push(interF);
    let mmStartParams:string[]=kaliPLinkBase.concat(thisIFStartMM),mmStartData:string|null=null;
    return new Promise(async(resolve)=>{
      const mmStartProc=airmonChild('plink',mmStartParams,{encoding:'utf8'});
      mmStartProc.stdout.on('data',(stdoutData:any)=>{if(stdoutData){mmStartData+=stdoutData.toString()}});
      mmStartProc.stderr.on('data',(stderrData:any)=>{stderrData=stderrData;resolve(false)})
      mmStartProc.on('close',(code:any)=>{
        if(String(code)!=='0'){resolve(false)}
        else{
          if(mmStartData!==null&&mmStartData&&mmStartData.length>0){
            let sLines:string[]=mmStartData.split('\n');
            const enabledLinesArr:string[]=sLines.filter((l:string)=>l.includes('monitor mode already enabled')||l.includes('monitor mode enabled'));
            if(enabledLinesArr.length<1){resolve(false)}
            else{resolve(true)}
          }else{resolve(false)};
        }
      });
    });
  }
  //------------
  const mmStop=async(interF:string):Promise<boolean>=>{
    let thisIFStopMM:string[]=kaliAirmonStopMM;thisIFStopMM.push(interF);
    let mmStopParams:string[]=kaliPLinkBase.concat(thisIFStopMM),mmStopData:string|null=null;
    return new Promise(async(resolve)=>{
      const mmStopProc=airmonChild('plink',mmStopParams,{encoding:'utf8'});
      mmStopProc.stdout.on('data',(stdoutData:any)=>{if(stdoutData){mmStopData+=stdoutData.toString()}});
      mmStopProc.stderr.on('data',(stderrData:any)=>{stderrData=stderrData;resolve(false)})
      mmStopProc.on('close',(code:any)=>{
        if(String(code)!=='0'){resolve(false)}
        else{
          if(mmStopData!==null&&mmStopData&&mmStopData.length>0){
            let sLines:string[]=mmStopData.split('\n');
            const disabledLinesArr:string[]=sLines.filter((l:string)=>l.includes('monitor mode disabled'));
            if(disabledLinesArr.length<1){resolve(false)}
            else{resolve(true)}
          }else{resolve(false)};
        }
      });
    });
  }
  //-----------
  if(ss==='start'){
    if(iF==='all'&&Object.values(monModes).every((mmV:boolean)=>mmV===true)){return Promise.resolve(true)};
    if(monModes[iF]===true){return Promise.resolve(true)};
    const iwModesRes:false|{wlan0:boolean,wlan1:boolean}=await mmIW();
    let doStartIFArr:string[]=[];
    if(iwModesRes===false){if(iF==='all'){doStartIFArr=Object.keys(monModes)}else{doStartIFArr.push(iF)}}
    else{
      monModes=iwModesRes;
      if(iF==='all'){
        if(iwModesRes.wlan0===true&&iwModesRes.wlan1===true){return Promise.resolve(true)}
        else{for(const[k,v]of Object.entries(iwModesRes)){if(!v){doStartIFArr.push(k)}}}
      }else{if(iwModesRes[iF]===true){return Promise.resolve(true)}else{doStartIFArr.push(iF)}};
    };
    let ttlMMReqs:number=doStartIFArr.length,goodMMReqs:number=0;
    for(let sifi=0;sifi<doStartIFArr.length;sifi++){
      const thisMMReqRes:boolean=await mmStart(doStartIFArr[sifi]);
      monModes[doStartIFArr[sifi]]=thisMMReqRes;
      if(thisMMReqRes){goodMMReqs++}
    };
    if(ttlMMReqs===goodMMReqs){return Promise.resolve(true)}else{return Promise.resolve(false)};
  }else if(ss==='stop'){
    if(iF==='all'&&Object.values(monModes).every((mmV:boolean)=>mmV===false)){return Promise.resolve(true)};
    if(monModes[iF]===false){return Promise.resolve(true)};
    const iwModesRes:false|{wlan0:boolean,wlan1:boolean}=await mmIW();
    let doStopIFArr:string[]=[];
    if(iwModesRes===false){if(iF==='all'){doStopIFArr=Object.keys(monModes)}else{doStopIFArr.push(iF)}}
    else{
      monModes=iwModesRes;
      if(iF==='all'){
        if(iwModesRes.wlan0===false&&iwModesRes.wlan1===false){return Promise.resolve(true)}
        else{for(const[k,v]of Object.entries(iwModesRes)){if(v){doStopIFArr.push(k)}}}
      }else{if(iwModesRes[iF]===true){return Promise.resolve(true)}else{doStopIFArr.push(iF)}};
    };
    let ttlMMReqs:number=doStopIFArr.length,goodMMReqs:number=0;
    for(let sifi=0;sifi<doStopIFArr.length;sifi++){
      const thisMMReqRes:boolean=await mmStop(doStopIFArr[sifi]);
      monModes[doStopIFArr[sifi]]=thisMMReqRes;
      if(thisMMReqRes){goodMMReqs++}
    };
    if(ttlMMReqs===goodMMReqs){return Promise.resolve(true)}else{return Promise.resolve(false)}
  }else{return Promise.resolve(false)}
};
//------------------------------------------------
// DumpMode - airodump-ng
//------------------------------------------------
ipcMain.handle('toggleDumpNGPaused',(e:any,args:any[]):Promise<boolean>=>{
  dumpIsPaused=args[0];
  return Promise.resolve(dumpIsPaused);
});
//------------------------------------------------
ipcMain.on('toggleDumpNG',async(e:any,args:any[])=>{startStopDumpNG(args[0])});
//------------------------------------------------
async function readDumpCSV():Promise<string|false>{
  if(!(await exists(dumpCSVFPath))){return Promise.resolve(false)};
  try{
    const readRes:string=await fs.promises.readFile(dumpCSVFPath,{encoding:'utf-8'});
    if(readRes&&readRes.trim().length>0){return Promise.resolve(readRes)}
    else{return Promise.resolve(false)};
  }catch(e){return Promise.resolve(false)}
}
//------------------------------------------------
async function processDumpCSV(rawData:string):Promise<WCWifingDumpDevs>{
  const fTyp:any={isDate:['first','last'],isString:['mac','priv','ciph','auth','ip','id'],isNumber:['chan','spd','tx','bcs','data','idLen']};
  const macRX:RegExp=/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  const swMAC=(l:string):boolean=>{return (macRX.test(l.split(',')[0]))};
  const str2D=(s:string,f:string):Date=>{try{return parse(s,f,new Date())}catch(e){return new Date()}};
  let allDevsObj:WCWifingDumpDevs={justRouters:[],clientRouters:[],allClients:[],assClients:[],unassClients:[]};
  let apDevObj:WCWifingDumpAPDevs={mac:'',first:new Date(),last:new Date(),chan:0,spd:0,priv:'',ciph:'',auth:'',tx:0,bcs:0,data:0,ip:'',idLen:0,id:'',clients:[]};
  let clDevObj:WCWifingDumpCLDevs={mac:'',first:new Date(),last:new Date(),tx:0,data:0,apMac:'',probeIDs:[]};
  // Raw Arrs ------------
  const apclArr:string[]=rawData.split('Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs');
  const apLsArr:string[]=apclArr[0].split('\n').filter((l:string)=>l.trim().length>0&&(swMAC(l)));
  const clLsArr:string[]=apclArr[1].split('\n').filter((l:string)=>l.trim().length>0&&(swMAC(l)));
  // Routers ------------
  let newJustRouters:WCWifingDumpAPDevs[]=[];
  for(let api=0;api<apLsArr.length;api++){
    const apDLArr:string[]=apLsArr[api].split(', ');
    let apDObj:any={},fI:number=0;
    for(const k of Object.keys(apDevObj)){
      if(fTyp.isDate.includes(k)){apDLArr[fI]&&typeof apDLArr[fI]==='string'&&apDLArr[fI].trim().length>0?apDObj[k]=(str2D(apDLArr[fI].trim().split(' ')[1],'hh:mm:ss')):apDObj[k]=new Date()}else if(fTyp.isString.includes(k)){apDLArr[fI]&&typeof apDLArr[fI]==='string'&&apDLArr[fI].trim().length>0?apDObj[k]=String(apDLArr[fI].trim()):apDObj[k]='-';if(String(k)==='ip'){apDObj[k]=apDObj[k].replace(/\s/g,'')}}
      else if(fTyp.isNumber.includes(k)){apDLArr[fI]&&typeof apDLArr[fI]==='string'&&apDLArr[fI].trim().length>0?apDObj[k]=Number(apDLArr[fI].trim()):apDObj[k]=0};
      fI++;
    };
    apDObj['clients']=[];
    newJustRouters.push(apDObj);
  };
  if(newJustRouters.length>0){
    const ordNJR:WCWifingDumpAPDevs[]=_.orderBy(newJustRouters,['tx','bcs','data'],['desc','desc','desc']);
    allDevsObj.justRouters=ordNJR;
    allDevsObj.clientRouters=ordNJR;
  };
  // Clients ------------
  let newAllClients:any[]=[];
  for(let cli=0;cli<clLsArr.length;cli++){
    const clDLArr:string[]=clLsArr[cli].split(', ');
    let clDObj:any={},fI:number=0;
    for(const k of Object.keys(clDevObj)){
      if(String(k)==='apMac'){
          if(clDLArr[fI]&&typeof clDLArr[fI]==='string'&&clDLArr[fI].trim().length>0){
              if(clDLArr[fI].trim().startsWith('(not associated) ,')){
                  clDObj.apMac='-';
                  clDObj.probeIDs=clDLArr[fI].trim().replace('(not associated) ,','').split(',').map((id:string)=>id.trim()).filter((id:string)=>id&&id.length>0)
              }else if(clDLArr[fI].trim().endsWith(',')&&(macRX.test(clDLArr[fI].trim().replace(',','')))){
                  clDObj.apMac=clDLArr[fI].trim().replace(',','');
                  clDObj.probeIDs=[];
              }else{clDObj.apMac='-';clDObj.probeIDs=[]};
          }else{clDObj.apMac='-';clDObj.probeIDs=[]};
      }else if(fTyp.isDate.includes(k)){
        clDLArr[fI]&&typeof clDLArr[fI]==='string'&&clDLArr[fI].trim().length>0?clDObj[k]=(str2D(clDLArr[fI].trim().split(' ')[1],'hh:mm:ss')):clDObj[k]=new Date()
      }else if(fTyp.isString.includes(k)){clDLArr[fI]&&typeof clDLArr[fI]==='string'&&clDLArr[fI].trim().length>0?clDObj[k]=String(clDLArr[fI].trim()):clDObj[k]='-'}
      else if(fTyp.isNumber.includes(k)){clDLArr[fI]&&typeof clDLArr[fI]==='string'&&clDLArr[fI].trim().length>0?clDObj[k]=Number(clDLArr[fI].trim()):clDObj[k]=0};
      fI++;
    };
    newAllClients.push(clDObj);
  };
  if(newAllClients.length>0){
    const ordNAC:WCWifingDumpCLDevs[]=_.orderBy(newAllClients,['tx','data','probeIDs'],['desc','desc','desc']);
    allDevsObj.allClients=ordNAC;
    allDevsObj.assClients=ordNAC.filter((clO:any)=>(macRX.test(clO.apMac)));
    allDevsObj.unassClients=ordNAC.filter((clO:any)=>clO.apMac==='-');
  };
  // Combine Rs+Cls ------------
  for(let assci=0;assci<allDevsObj.assClients.length;assci++){
    if((macRX.test(allDevsObj.assClients[assci].apMac))){
      const cmatchMac:string=allDevsObj.assClients[assci].apMac;
      for(let cri=0;cri<allDevsObj.clientRouters.length;cri++){
        if(allDevsObj.clientRouters[cri].mac===cmatchMac){
          const existI:number=allDevsObj.clientRouters[cri].clients.findIndex((cO:any)=>cO.mac===allDevsObj.assClients[assci].mac);
          if(existI===-1){allDevsObj.clientRouters[cri].clients.push(allDevsObj.assClients[assci])};
        }
      }
    }
  };
  //-------------------------
  return Promise.resolve(allDevsObj);
  //-------------------------
}
//------------------------------------------------
async function startStopDumpNG(startStop:string){
  const mwIndex:number|false=await getMWBrwsr('wifing');
  const clearDump=async():Promise<boolean>=>{
     if(dumpNGProcess.dumpINT!==null){clearInterval(dumpNGProcess.dumpINT);dumpNGProcess.dumpINT=null};
     if(dumpNGProcess.inprog){dumpNGProcess.inprog=false};
     if(mwIndex!==false&&moreWins[mwIndex]&&moreWins[mwIndex].webContents){moreWins[mwIndex].webContents.send('wifingDumpNGInProg',[dumpNGProcess.inprog])};
     if(dumpNGProcess.pid!==-1){dumpNGProcess.pid=-1};
     if(dumpNGProcess.prevDD){dumpNGProcess.prevDD=null};
     return Promise.resolve(true);
  };
  const doDump=async():Promise<boolean>=>{
    if(mwIndex!==false&&moreWins[mwIndex]&&moreWins[mwIndex].webContents){moreWins[mwIndex].webContents.send('wifingDumpTimer',['start'])};
    if(dumpNGProcess.inprog){
      if(!dumpIsPaused){
        const readCSVRes:string|false=await readDumpCSV();
        if(readCSVRes!==false){
          if(dumpNGProcess.prevDD!==readCSVRes){
            dumpNGProcess.prevDD=readCSVRes;
            const processCSVRes:WCWifingDumpDevs=await processDumpCSV(readCSVRes);
            if(dumpNGProcess.inprog&&dumpNGProcess.prevDD!==null&&mwIndex!==false&&moreWins[mwIndex]&&moreWins[mwIndex].webContents){
              moreWins[mwIndex].webContents.send('wifingDumpNGData',[processCSVRes]);
            };
          }
        };
      };
    }else{clearDump()};
    return Promise.resolve(true);
  }
  //------------
  if(startStop==='start'){
    if(dumpNGProcess.inprog){if(mwIndex!==false&&moreWins[mwIndex]&&moreWins[mwIndex].webContents){moreWins[mwIndex].webContents.send('wifingDumpNGInProg',[dumpNGProcess.inprog])};return}
    else{
      if((await exists(dumpCSVFPath))){try{await unlink(dumpCSVFPath)}catch(e){e=e}};
      let ssDumpParams:string[]=kaliPLinkBase.concat(kaliDumpStart);
      const dumpNGChild=require('child_process').spawn;
      dumpNGProcess.proc=dumpNGChild('plink',ssDumpParams,{encoding:'utf8'});
      if(dumpNGProcess.proc&&dumpNGProcess.proc.pid&&typeof dumpNGProcess.proc.pid==='number'){
        dumpNGProcess.proc.stderr.on('data',(stderrData:any)=>{stderrData=stderrData})
        dumpNGProcess.proc.on('close',(code:any,signal:any)=>{
          availCons('DumpNGLoop','ONCLOSE: Closed '+(code?'(code): '+String(code):' ')+(signal?'(signal): '+String(signal):''));
          clearDump();
        });
        dumpNGProcess.pid=dumpNGProcess.proc.pid;
        dumpNGProcess.inprog=true;
        if(mwIndex!==false&&moreWins[mwIndex]&&moreWins[mwIndex].webContents){moreWins[mwIndex].webContents.send('wifingDumpNGInProg',[dumpNGProcess.inprog])};
        await doDump();
        dumpNGProcess.dumpINT=setInterval(async()=>{await doDump()},6000);
      }else{availCons('startStopDumpNG','ERROR: Failed to START Dump-ng');clearDump()}
    }
  }else{if(dumpNGProcess.proc){try{dumpNGProcess.proc.kill('SIGHUP')}catch(e){e=e}};clearDump()};
}
////////////////////////////////////////////////////////////////
// MONGODB FNS
////////////////////////////////////////////////////////////////
let mdbIsInit:boolean=false;
let mdbClient:mdb.MongoClient|null=null;
let mdbDB:mdb.Db|null=null;
let mdbC:mdb.Collection|null=null;
let mdbConnURL:string='mongodb://localhost:27017';
let mdbConnOpts:mdb.MongoClientOptions={monitorCommands:true,retryReads:true,serverSelectionTimeoutMS:5000,connectTimeoutMS:10000,appName:'wifiCUE',maxPoolSize:200,maxConnecting:20,minPoolSize:20};
let mdbDBName:string='ytCaps';
let mdbColName:string='caps';
let mdbListenOn:boolean=false;
let mdbMWIndex:number=-1;
let capsDocCount:number=-1;
////////////////////////////////////////////////////////////////
ipcMain.handle('initMDB',async(e:any,args:any[]):Promise<number|false>=>{const doInitRes:number|false=await initMDB();return Promise.resolve(doInitRes)});
//--------------------------------------------------------------
async function initMDB():Promise<number|false>{
  availCons('initMDB','()...');
  const awaitMWIndex=async():Promise<number|false>=>{return new Promise(async(resolve)=>{let checkICount:number=0,checkIINT=setInterval(async()=>{const mwIndex:number|false=await getMWBrwsr('ytdl');if(mwIndex!==false){clearInterval(checkIINT);mdbMWIndex=mwIndex;resolve(mwIndex)}else{if(checkICount<20){checkICount++}else{availCons('initMDB','ERROR: Timeout Waiting for MWIndex');clearInterval(checkIINT);resolve(false)}}},250)})};
  if(mdbIsInit&&mdbClient!==null){availCons('initMDB','MDB Already Init - Skipped');return Promise.resolve(capsDocCount)};
  if(!mdbIsInit&&mdbClient!==null){mdbIsInit=true;availCons('initMDB','MDB Already Init - Skipped');return Promise.resolve(capsDocCount)};
  if(mdbClient===null){mdbClient=new mdb.MongoClient(mdbConnURL,mdbConnOpts)};
  try{
    await awaitMWIndex();
    if(!mdbListenOn){await addRemoveMDBListeners('add')};
    await mdbClient.connect();
    mdbDB=mdbClient.db(mdbDBName),mdbC=mdbDB.collection(mdbColName),mdbIsInit=true;
    if(capsDocCount===-1){capsDocCount=await mdbC.countDocuments({},{hint:'_id_'})};
    return Promise.resolve(capsDocCount);
  }catch(e){
    availCons('initMDB','ERROR: Connection/Db/Collection: FAILED');
    mdbClient=null;mdbDB=null;mdbC=null,mdbIsInit=false;
    if(mdbListenOn){await addRemoveMDBListeners('remove')};
    return Promise.resolve(false);
  };
};
////////////////////////////////////////////////////////////////
ipcMain.handle('addRemoveMDBListeners',async(e:any,args:any[]):Promise<boolean>=>{const aRRes:boolean=await addRemoveMDBListeners(args[0]);return Promise.resolve(aRRes)});
//--------------------------------------------------------------
async function addRemoveMDBListeners(addRemoveOnce:string):Promise<boolean>{
  availCons('addRemoveMDBListeners','('+addRemoveOnce+')...');
  if(mdbMWIndex<0){await getMWBrwsr('ytdl')};
  const doEvCons=async(t:string,e:any)=>{moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent',[t,e])};
  const cTS:string[]=['Started','Succeeded','Failed'];
  if(addRemoveOnce==='add'){for(let ctsi=0;ctsi<cTS.length;ctsi++){mdbClient.on('command'+cTS[ctsi],async(e:any)=>{doEvCons(cTS[ctsi].toLowerCase(),e)})};mdbListenOn=true}
  else if(addRemoveOnce==='once'){for(let ctsi=0;ctsi<cTS.length;ctsi++){mdbClient.once('command'+cTS[ctsi],async(e:any)=>{doEvCons(cTS[ctsi].toLowerCase(),e)})}}
  else{mdbClient.removeAllListeners();mdbListenOn=false};
  return Promise.resolve(true);
}
////////////////////////////////////////////////////////////////
ipcMain.handle('doMDBQuery',async(e:any,args:any[]):Promise<{r:boolean,d:any}>=>{
  const dMDBQRes:{r:boolean,d:any}=await doMDBQuery(args[0],(args[1]?args[1]:null));return Promise.resolve(dMDBQRes)});
//--------------------------------------------------------------
async function doMDBQuery(qType:string,qParams?:any):Promise<{r:boolean,d:any}>{
  availCons('doMDBQuery','('+qType+',dataObj|null)...');
  if(!mdbIsInit){await initMDB();if(!mdbIsInit){availCons('IPCMAIN|doMDBQuery','ERROR: mdbIsInit===FALSE!');return Promise.resolve({r:false,d:'MDB Not Initialized'})}};
  let qResult:any={r:false,d:null};
  switch(qType){
    case 'ping':
      if(mdbDB){const pingRes:any=await mdbDB.command(qParams);if(pingRes.hasOwnProperty('ok')){qResult={r:true,d:pingRes.ok}}else{qResult={r:false,d:'Unknown Error'}}}
      else{availCons('IPCMAIN|doMDBQuery','ERROR: NULL mdbDB Object');qResult={r:false,d:'NULL mdbDB Object'}};
      break;
    case 'ftsExact':
      if(typeof qParams!=='string'){qResult={r:false,d:'typeof Param!==string'}}
      else{
        if(!mdbC){availCons('IPCMAIN|doMDBQuery','ERROR: NULL mdbC Object');qResult={r:false,d:'NULL mdbC Object'}}
        else{
          if(mdbListenOn){await addRemoveMDBListeners('remove')};
          moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent',['started',{requestId:0,commandName:'ftsExact'}]);
          //------------
          let exactMatchDocsArr:any[]=[];
          const runFTS=async():Promise<any[]>=>{
            try{
              const ftsExactQuery={$text:{$search:`"`+qParams+`"`}};
              const ftsExactProj:mdb.Document={_id:0,caps_data:0};
              const ftsExactCursor:mdb.FindCursor<mdb.BSON.Document>=mdbC.find(ftsExactQuery,{projection:ftsExactProj,batchSize:1});
              for await(const doc of ftsExactCursor){exactMatchDocsArr.push(doc);moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent',[doc])};
              ftsExactCursor.close();
              moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent',['succeeded',{requestId:0,commandName:'ftsExact'}]);
              return Promise.resolve(exactMatchDocsArr);
            }catch(e){e=e;moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent',['failed',{requestId:0,commandName:'ftsExact'}]);return Promise.resolve(exactMatchDocsArr)}
          };
          //------------
          const ftsRes:false|any[]=await runFTS();
          if(!ftsRes){qResult.d='Unknown DB/Query Error'}
          else{qResult={r:true,d:ftsRes}};
          if(!mdbListenOn){await addRemoveMDBListeners('add')};
        };
      };
      break;
    default:availCons('IPCMAIN|doMDBQuery','ERROR: UNKNOWN queryType ('+qType+')');qResult={r:false,d:'Unknown queryType'};break;
  };
  return Promise.resolve(qResult);
};
//////////////////////////////////////////////////
// TEST FUNCTION
//////////////////////////////////////////////////
ipcMain.handle('sendTest',async(e:any,args:any[]):Promise<any>=>{
  availCons('sendTest','()...');
});
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
