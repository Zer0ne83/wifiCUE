/* eslint-disable no-trailing-spaces */
import { defWCData, WCData, getLang, TWTStatusBar, TWTChatStates, defTwtChatStates, TWTPlyrStatus, TWTPlyrFormat,  TWTChangeStream, TWTTimes, TWTSTimes, WCWinSizePos, TWTTriggerEvent, TWTSaveData, TWTTriggerEventType, TWTChatUser, TWTBPMResult } from '../../appTypes';
import {Component,OnInit,AfterViewInit,ChangeDetectorRef,ViewChild,ElementRef} from '@angular/core';
import {EventsService} from '../events.service';
import {ipcRenderer,clipboard} from 'electron';
import {DomSanitizer,SafeResourceUrl} from '@angular/platform-browser';
import * as _ from 'lodash';
import * as Twitch from '../tejs';
import { access } from 'fs/promises';
//////////////////////////////////////////////////
@Component({selector:'app-child',templateUrl:'./child.component.html',styleUrls:['./child.component.scss']})
export class ChildComponent implements OnInit,AfterViewInit{
//////////////////////////////////////////////////
@ViewChild('twtChatInput') twtChatInput:ElementRef<HTMLInputElement>;
@ViewChild('twtReplyInput') twtReplyInput:ElementRef<HTMLInputElement>;
@ViewChild('twtintplyr') twtintplyr:ElementRef<HTMLDivElement>;
@ViewChild('twtCanvas') twtCanvas:ElementRef<HTMLCanvasElement>;
@ViewChild('twtCanvasWrap') twtCanvasWrap:ElementRef<HTMLDivElement>;
//////////////////////////////////////////////////
cwDataReady:boolean=false;
cWin:WCWinSizePos|null=null;
twtWinToggle:string='list';
meStrArr:string[]=['Zer0ne33','zer0ne33','***********@gmail.com','Zer0ne','zer0ne','Zerone','zerone','Zero','zero','Zer0','zer0','owen','Owen','lenegan','Lenegan','owie','@Zer0ne33','@zer0ne33'];
lFaves:string[]=['staxxbundlez','djmoases','mystery2k','miss_octopus_','char_dj','helmahof','krita_beatz','hexadecimaldj','etownjunglists','ethan_dubb'];
twtStatus:TWTStatusBar={type:null,source:null,msg:null};
twtStatusTO:any=null;
//-----------------
twtAuth:any=null;
twtUser:any=null;
twtFollowing:any[]=[];
twtLives:any[]=[];
livesRefreshing:boolean=false;
twtEvSubs:any[]=[];
twtActChanEvSubs:any[]=[];
twtSvrMsgs:string[]=[];
twtSvrTO:any=null;
smOutAnim:boolean=false;
//-------
twtChatConn:boolean=false;
twtChatErr:number=0;
twtChatRoom:string|null=null;
twtChatRoomData:TWTChatStates|null=null;
twtChatMsgs:any[]=[];
twtChatUsersChangeINT:any=null;
twtChatUsersChange:string[]=[];
twtChatUsersIncDec:'same'|'inc'|'dec'='same';
twtChatPausedMsgs:any[]=[];
twtChatIsPaused:boolean=false;
twtChatColor:string|null=null;
didCloseChat:boolean=false;
twtChatListHidden:boolean=false;
twtVideoBright:number=1;
//-------
twtChatMentions:any[]=[];
mentionsShowing:boolean=false;
mentionReply:any=null;
//-------
twtStreamPlyr:any=null;
twtSPStatus:TWTPlyrStatus={init:false,hidevideo:false,playing:false,paused:false,muted:false,volume:1,title:'',channel:'',formats:[],format:'',stats:{backendVersion:'',bufferSize:0,codecs:'',displayResolution:'',fps:0,hlsLatencyBroadcaster:0,playbackRate:0,skippedFrames:0,videoResolution:''}};
twtChangeStream:TWTChangeStream={nowStream:'',nextStream:'',reason:'',data:{int:null,time:15},inprog:false};
twtStreamTimes:TWTSTimes|null=null;
streamStatsINT:any=null;
streamTimesINT:any=null;
sSINTCount:number=0;
showStreamPlyr:boolean=false;
tFrame:boolean=false;twtScrollCount:number=0;tFrameId:any;twtMaxScroll:number=0;twtScrollDir:string='up';twtInfoIsScroll:boolean=false;twtInfoMD:boolean=false;twtInfoDiv:any;twtInfoWrap:any;twtInfoScrollIINT:any;twtInfoPos:any={top:0,left:0,x:0,y:0};
//-----------------
videoResize:string|null=null;
cmIsOpen:boolean=false;
ffPaths:any=null;
findingTune:boolean=false;
ftStatus:string|null=null;
ftResult:any|null=null;
//------------------
rtNotifyNew:boolean=false;
rtPrevBPMResult:TWTBPMResult={r:true,d:176};
rtBPMResult:TWTBPMResult={r:true,d:176};
fbMP3Path:string='C:\\ffmpeg\\recs\\b.mp3';
//-----------------
fTuneTriggers:string[]=['!id','!song','id please','song id','name of song','name of this song','name of the song','name of tune','name of this tune','name of the tune','who is this by','what song is this','what tune is this','current song','current tune','identify this song','who is this by'];
fBPMTriggers:string[]=['!bpm','!speed','!tempo','bpm?','tempo?','what bpm','what tempo','current bpm','bpm now'];
greetArr:string[]=['Holla XXX and crazy chat crew! Hope everyone is well! Big love to ya\'ll','G\'day happy chat crew and BIG Ups + BIG Love XXX','BIG ups and BIGGER love XXX and all chatters inside! Hope evryone is having an awesome morning/evening <3 <3 <3'];
welcomesArr:string[]=['Welcome, welcome, XXX hope you are doing well!','GTSY XXX! Welcome in and enjoy the tunes!','G\'day XXX, BIG love <3, hope you are doing well'];
tySubArr:string[]=['Thank you SO MUCH XXX! Subs are love and VERY much appreciated :) Big Ruvvs!','XXX - What a legend! Cheers for the Sub/Support man','Big ups the Sub Love, XXX!','Tidy work XXX - Supporting a worthy cause!'];
tyBitsArr:string[]=['XXX - What an absolute LEGEND! Big ups + love for the support','Big love for the support, XXX!','Nice one, XXX, big love to you','Tidy work, XXX, big ups to you'];
tyRaidArr:string[]=['Ayyyyyoooo, WELCOME in Raiders! Big ups to XXX - hope you had a good stream, G <3','WELCOME RAIDERS! Big ups + big love XXX, appreciate you!','RAID LOVE RAID LOVE <3 <3 <3 - Welcome all! Hope you had a good Stream XXX'];
rrWords:string[]=['TUNE','BIGUPS','BANGER','VIBES','BIGLOVE'];
myEsArr:any={
  faveEs:['LionOfYara','NewRecord','<3','panicBasket','bleedPurple','DxCat','CurseLit','TwitchLit','MorphinTime','GlitchLit'],
  dirEs:[{l:'MercyWing1',r:'MercyWing2'},{l:'PowerUpL',r:'PowerUpR'},{l:'Squid1',r:'Squid4'},{l:'PJSalt',r:'PJSugar'},{l:'Kappa',r:'KappaRoss'}],
  wordEs:['SabaPing','Kreygasm','GlitchCat','FBtouchdown']
};
rrModes:string[]=['word','std','std'];
nextTOms:number=0;
rahRahTO:any=null;
rahRahINT:any=null;
rahRahINTCount:number=0;
rahRahCD:string='';
rahRahAnim:boolean=false;
channelMotes:any[]=[];
chanSubLevel:string|null=null;
globalMotes:any[]=[];
cheerMotes:string[]=[];
lastRah:any[]=[];
trigSummaryOpen:boolean=false;
newBotAction:boolean=false;
//------------------
twtSaveData:TWTSaveData|null=null;
//-------------------
twtChatUsersShowing:boolean=false;
//-------------------
twtVizOn:boolean=false;
aFrame:boolean=false;
aFrameId:any;
nS:MediaStream|null=null;
aCTX:AudioContext|null=null;
aSRC:MediaStreamAudioSourceNode|null=null;
cCTX:CanvasRenderingContext2D|null=null;
vizAnal:AnalyserNode|null=null;
vizBuffLen:number;
vizDataArr:Uint8Array;
vizBaseColor:number[]=[255,0,0];
vizZ01:any;
zIProps:any={x:0,y:56,w:268,h:50}
avgAmps:number[]=[];
vFrameCount:number=0;
//////////////////////////////////////////////////
  constructor(
    private changeDet:ChangeDetectorRef,
    private evServ:EventsService,
    private sanitizer:DomSanitizer
  ){}
//////////////////////////////////////////////////
// LIFECYCLE FUNCTIONS
//////////////////////////////////////////////////
  ngOnInit():void{this.preInit()}
  async preInit(){
    this.cCons('preInit','()...');
    //------------
    const savedWCData:WCData|false=await ipcRenderer.invoke('handleTWTGetData');
    if(savedWCData){this.twtSaveData=savedWCData.twtSaveData}
    else{this.twtSaveData=defWCData.twtSaveData};
    //------------
    ipcRenderer.on('wledColorChange',(e:any,args:any[])=>{
      let mC:number[]=args[0];
      if(Number(mC[0])===0&&Number(mC[1])===0&&Number(mC[2])===0&&Number(mC[3])>0){mC=[255,255,255]}
      else if(Number(mC[0])===0&&Number(mC[1])===0&&Number(mC[2])===0&&Number(mC[3])===0){mC=[255,0,0]}
      else{mC=[Number(mC[0]),Number(mC[1]),Number(mC[2])]};
      if(!_.isEqual(this.vizBaseColor,mC)){this.vizBaseColor=mC};
    });
    ipcRenderer.on('findTuneStatus',(e:any,args:any[])=>{if(this.findingTune&&!this.ftResult){this.ftStatus=args[0];this.pDOM()}});
    ipcRenderer.on('cm',async(e:any,args:any[])=>{if(this.twtChatConn&&this.twtChatRoom!==null){this.botAction(args[0],true)}});
    ipcRenderer.on('cmIsOpen',(e:any,args:any[])=>{this.cmIsOpen=args[0]});
    ipcRenderer.on('updTwtAuth',(e:any,args:any[])=>{this.twtAuth=args[0]});
    this.evServ.subscribe('twtServEvent',(tE:any)=>{this.twtStatus=tE;this.pDOM()});
    ipcRenderer.on('ffPaths',(e:any,args:any[])=>{this.availCons('ffPaths',args[0]);this.ffPaths=args[0]});
    ipcRenderer.on('twtEventsConn',(e:any,args:any[])=>{this.availCons('twtEvents|Conn',args[0])});
    ipcRenderer.on('twtEventsErr',(e:any,args:any[])=>{this.availCons('twtEvents|Err',args[0])});
    ipcRenderer.on('updTwtEvSubs',(e:any,args:any[])=>{this.twtEvSubs=args[0];this.pDOM()});
    ipcRenderer.on('twtEventData',async (e:any,args:any[])=>{
      if(args[0]==='stream.offline'){
        const existLiveI:number=this.twtLives.findIndex(l=>l.user_login===args[1].broadcaster_user_login);
        if(existLiveI!==-1){this.twtLives=this.twtLives.filter(l=>l.user_login!==args[1].broadcaster_user_login)};
        if((this.twtChatRoom===args[1].broadcaster_user_login||this.twtSPStatus.channel===args[1].broadcaster_user_login)&&!this.twtChangeStream.inprog){this.doChangeStream('dead',args[1].broadcaster_user_login)};
      };
    });
    //------------
    ipcRenderer.on('cWinSizePos',(e:any,args:any[])=>{this.cWin=args[0];this.pDOM()});
    ipcRenderer.on('childWIsReady',async(e:any,args:any[])=>{this.doDataInits();this.showChildWindow();this.cwDataReady=true;this.pDOM()});
    ipcRenderer.on('twtUser',(e:any,args:any[])=>{this.twtUser=args[0];if(!this.meStrArr.includes(this.twtUser.display_name)){this.meStrArr.push(this.twtUser.display_name)};if(!this.meStrArr.includes('@'+this.twtUser.display_name)){this.meStrArr.push('@'+this.twtUser.display_name)};this.pDOM()});
    ipcRenderer.on('twtFollowing',(e:any,args:any[])=>{
      if(args[0].length>0){
        const liveNames:string[]=this.twtLives.map(lO=>lO.user_login);
        let lessLives:any[]=args[0].filter(fO=>!liveNames.includes(fO.to_name));
        let ordList:any[]=_.orderBy(lessLives,['followed_at'],['asc']);
        this.twtFollowing=ordList;
        this.pDOM();
      };
    });
    ipcRenderer.on('twtLives',async(e:any,args:any[])=>{
      this.cCons('twtChatLives','Updated...');
      this.cCons('LIVES',args[0]);
      if(args[0].length===0){this.twtLives=[];this.pDOM()}
      else{
        let rawSubs=args[0],actSubID:string|null=null,actSub:any,addOLineIds:string[]=[];
        for(let si=0;si<rawSubs.length;si++){
          rawSubs[si].thumbnail_url=rawSubs[si].thumbnail_url.replace('{width}','16').replace('{height}','16');
          rawSubs[si].language=await getLang(rawSubs[si].language);
          rawSubs[si]['rt']=this.evServ.streamRT((this.evServ.pISO(rawSubs[si].started_at)));
          if(this.twtChatRoom&&this.twtChatRoom===rawSubs[si].user_login){actSubID=rawSubs[si].user_id;actSub=rawSubs[si]};
          const existLI:number=this.twtLives.findIndex(l=>l.user_id===rawSubs[si].user_id);
          if(existLI===-1){addOLineIds.push(rawSubs[si].user_id)};
        };
        if(actSubID){rawSubs=rawSubs.filter(sO=>sO.user_id!==actSubID);rawSubs.unshift(actSub)};
        this.twtLives=rawSubs;
        if(addOLineIds.length>0){for(let ai=0;ai<addOLineIds.length;ai++){ipcRenderer.send('twtEvSubModify',['add',addOLineIds[ai]])}};
        this.pDOM();
      };
    });
    ipcRenderer.on('twtChatCloseInfo',async(e:any,args:any[])=>{
      this.cCons('twtChatCloseInfo',args[0]);
      this.twtSBar('show',{type:'error',source:'chat',msg:'Connection Closed: '+args[0]});
      if(!this.didCloseChat){
        await this.doW(1.5);
        this.twtSBar('show',{type:'info',source:'chat',msg:'Attempting Reconnect...'});
        let reConChan:string|null=null;if(this.twtChatRoom){reConChan=this.twtChatRoom};
        this.twtChatConnection('connect',reConChan);
      }else{await this.doW(2);this.didCloseChat=false};
      this.pDOM();
    });
    ipcRenderer.on('twtChatConn',(e:any,args:any[])=>{
      this.cCons('twtChatConn',String(args[0]));
      if(this.twtChatConn!==args[0]){this.twtChatConn=args[0];this.pDOM()};
    });
    ipcRenderer.on('twtChatErr',(e:any,args:any[])=>{
      if(!this.didCloseChat){
        this.cCons('twtChatErr',args[0]);
        this.twtChatErr++;
        this.twtSBar('show',{type:'error',source:'chat',msg:args[0]});
        this.pDOM();
      }
    });
    ipcRenderer.on('twtMsgData',async(e:any,args:any[])=>{
      const mData:any=args[0];
      switch(mData.command.command){
        case 'HOSTTARGET':
          let htSVRM:string='['+mData.command.command+']: ';
          if(mData.command.hasOwnProperty('target')&&mData.command.target){htSVRM+=mData.command.target};
          if(mData.hasOwnProperty('parameters')&&mData.parameters){htSVRM+=' - '+mData.parameters};
          this.doServerMsg(htSVRM);
          break;
        case 'JOIN':
          let jC:string|null=null,jU:string|null=null,jIsMe:boolean=false;
          if(mData.command.channel&&mData.command.channel.trim().length>0){mData.command.channel.trim().startsWith('#')?jC=mData.command.channel.trim().replace('#',''):jC=mData.command.channel.trim()};
          if(mData.parameters&&mData.parameters.trim().length>0){jU=mData.parameters.trim().toLowerCase();if(jU===this.twtUser.display_name.toLowerCase()){jIsMe=true}};
          if(!jC||!jU){return};
          if(this.twtChatRoom!==jC){this.twtChatRoom=jC};
          if(this.twtChatRoomData===null){this.twtChatRoomData=defTwtChatStates(jC)};
          if(jIsMe){if(this.twtChatUsersChangeINT===null){this.twtChatUsersChangeINT=setInterval(()=>{this.updChatRoomIncDec()},60000);if(this.twtWinToggle==='list'){this.twtWinToggle='chat';this.pDOM()}}};
          //------------
          const existUI:number=this.twtChatRoomData.users.findIndex((u:TWTChatUser)=>u.name.toLowerCase()===jU);
          if(existUI===-1){this.twtChatRoomData.users.push({name:jU,isSub:null,isMod:null,isVIP:null});this.twtChatUsersChange.push('inc');this.twtChatRoomData.users=_.sortBy(this.twtChatRoomData.users,['name','asc'])};
          //------------
          if(jIsMe){
            this.twtSBar('show',{type:'ok',source:'chat',msg:'You joined #'+jC});
            const userId:string=this.twtLives.filter(l=>l.user_login===this.twtChatRoom)[0].user_id;
            const subLvlRes:{r:boolean,d:any}=await ipcRenderer.invoke('getTWTSubLevel',[userId]);
            if(subLvlRes.r){this.chanSubLevel=subLvlRes.d}else{this.chanSubLevel=null};
            if(this.globalMotes.length===0){
              const getGlobalMRes:{r:boolean,d:any}=await ipcRenderer.invoke('getTWTGlobalmotes');
              if(getGlobalMRes.r&&getGlobalMRes.d.length>0){this.globalMotes=getGlobalMRes.d}else{this.globalMotes=[]};
            };
            const getCheerMRes:{r:boolean,d:any}=await ipcRenderer.invoke('getTWTCheermotes',[userId]);
            if(getCheerMRes.r&&getCheerMRes.d.length>0){this.cheerMotes=getCheerMRes.d}else{this.cheerMotes=[]};
            const getChanMRes:{r:boolean,d:any}=await ipcRenderer.invoke('getTWTChanmotes',[userId]);
            if(getChanMRes.r&&getChanMRes.d.length>0){this.channelMotes=getChanMRes.d}else{this.channelMotes=[]};
            if(!this.twtSPStatus.init){await this.twtStreamPlayer('init',jC)}
            else{
              if(this.twtSPStatus.channel!==jC){await this.twtStreamPlayer('setChannel',jC)};
              if(this.twtSPStatus.muted){await this.twtStreamPlayer('setMuted',false)};
              if(this.twtSPStatus.paused){await this.twtStreamPlayer('play',null)};
            };
            if(this.twtSaveData.toggles.greetOn){this.botAction('greet',false)};
            if(this.twtSaveData.toggles.rahRahOn&&this.nextTOms===0){await this.clearRahRah();await this.setRahRah()};
          };
          break;
        case 'PART':
          let pC:string|null=null,pU:string|null=null,pIsMe:boolean=false;
          if(mData.command.channel&&mData.command.channel.trim().length>0){mData.command.channel.trim().startsWith('#')?pC=mData.command.channel.trim().replace('#',''):pC=mData.command.channel.trim()};
          if(mData.parameters&&mData.parameters.trim().length>0){pU=mData.parameters.trim().toLowerCase();if(pU===this.twtUser.display_name.toLowerCase()){pIsMe=true}};
          if(!pC||!pU||this.twtChatRoom!==pC){return};
          if(pIsMe){
            await this.twtClearChatData();
            this.twtSBar('show',{type:'ok',source:'chat',msg:'You parted #'+pC});
            if(this.twtSPStatus.init){
              if(!this.twtSPStatus.muted){await this.twtStreamPlayer('setMuted',true)};
              if(!this.twtSPStatus.paused){await this.twtStreamPlayer('pause',null)};
            };
          }else{
            if(this.twtChatRoomData!==null){
              const existUI:number=this.twtChatRoomData.users.findIndex((u:TWTChatUser)=>u.name.toLowerCase()===pU);
              if(existUI!==-1){
                this.twtChatRoomData.users=this.twtChatRoomData.users.filter((u:TWTChatUser)=>u.name.toLowerCase()!==pU);
                this.twtChatUsersChange.push('dec');
                this.twtChatRoomData.users=_.sortBy(this.twtChatRoomData.users,['name','asc']);
              };
            };
          };
          break;
        case 'USERNOTICE':
          switch(mData.tags['msg-id']){
            case 'sub':case 'resub':case 'subgift':this.isMsgTrigger({type:'tysub',user:mData.tags.login,isMod:(mData.tags.mod.toString()==='1'?true:false)},true);break;
            case 'raid':this.isMsgTrigger({type:'tyraid',user:mData.tags['msg-param-login'],isMod:false,viewers:mData.tags['msg-param-viewerCount']},true);
            default:this.cCons('twtMsgData','Unknown USERNOTICE Type: '+mData.tags['msg-id']);
          }
        case 'NOTICE':break
        case 'CLEARCHAT':break;
        case 'USERSTATE':
          let usC:string|null=null;if(mData.command.channel&&mData.command.channel.trim().length>0){mData.command.channel.trim().startsWith('#')?usC=mData.command.channel.trim().replace('#',''):usC=mData.command.channel.trim()};
          let usT:any=null;if(mData.hasOwnProperty('tags')&&!_.isEmpty(mData.tags)){usT=mData.tags};
          if(!usC||!usT){return};
          if(this.twtChatRoom!==usC||(this.twtChatRoomData&&this.twtChatRoomData.channel!==usC)){await this.twtClearChatData();this.twtChatRoom=usC};
          if(this.twtChatRoomData===null){this.twtChatRoomData=defTwtChatStates(usC)};
          if(this.twtChatRoom===usC&&this.twtChatRoomData.channel===usC){
            if(usT.hasOwnProperty('bits')&&parseInt(usT.bits,10)){this.twtChatRoomData.me.bits=Number(usT.bits)};
            if(usT.hasOwnProperty('mod')&&usT.mod==='1'){this.twtChatRoomData.me.mod=true};
            if(usT.hasOwnProperty('subscriber')&&usT.subscriber==='1'){this.twtChatRoomData.me.sub=true};
            let uListMeObj:TWTChatUser={name:this.twtUser.display_name.toLowerCase(),isSub:this.twtChatRoomData.me.sub,isMod:this.twtChatRoomData.me.mod,isVIP:(usT.hasOwnProperty('vip')&&usT.vip==='1'?true:false)};
            if(this.twtChatRoomData&&this.twtChatRoomData.hasOwnProperty('users')&&this.twtChatRoomData.users.length>0){
              const meUI:number=this.twtChatRoomData.users.findIndex((u:TWTChatUser)=>u.name.toLowerCase()===this.twtUser.display_name.toLowerCase());
              if(meUI!==-1){this.twtChatRoomData.users[meUI]=uListMeObj}
              else{this.twtChatRoomData.users.push(uListMeObj)};
            }else{this.twtChatRoomData['users']=[uListMeObj]};
          };
          break;
        case 'ROOMSTATE':
          let rsC:string|null=null;if(mData.command.channel&&mData.command.channel.trim().length>0){mData.command.channel.trim().startsWith('#')?rsC=mData.command.channel.trim().replace('#',''):rsC=mData.command.channel.trim()};
          let rsT:any=null;if(mData.hasOwnProperty('tags')&&!_.isEmpty(mData.tags)){rsT=mData.tags};
          if(!rsC||!rsT){return};
          if(this.twtChatRoom!==rsC||(this.twtChatRoomData&&this.twtChatRoomData.channel!==rsC)){await this.twtClearChatData();this.twtChatRoom=rsC};
          if(this.twtChatRoomData===null){this.twtChatRoomData=defTwtChatStates(rsC)};
          if(this.twtChatRoom===rsC&&this.twtChatRoomData.channel===rsC){
            if(rsT['emote-only']==='1'){this.twtChatRoomData.room.emoteonly=true};
            if(rsT['followers-only']==='1'){this.twtChatRoomData.room.followersonly=true};
            if(rsT['subs-only']==='1'){this.twtChatRoomData.room.subsonly=true};
          };
          break;
        case 'RECONNECT':
          const pcgusrSVRM:string='['+mData.command.command+']';
          this.doServerMsg(pcgusrSVRM);
          break;
        case 'ERROR':this.twtChatErr++;break
        case 'SERVER':
          const ignTypes:string[]=['001','002','003','004','MOTDSTART','MOTD','ENDOFMOTD','ENDOFNAMES'];
          let orsSM:string='';
          if(!ignTypes.includes(mData.command.type)){orsSM+='['+mData.command.type+'] '};
          if(mData.hasOwnProperty('parameters')&&mData.parameters&&mData.parameters.trim().length>1){orsSM+=mData.parameters};
          if(mData.command.type==='NAMREPLY'){
            console.log('NAMREPLY');
            console.log(mData.parameters);
            let listArr:string[]=[];
            if(!mData.parameters.trim().includes(' ')){listArr=[mData.parameters.trim()]}
            else{listArr=mData.parameters.trim().split(' ')};
            if(listArr.length>0&&this.twtChatRoomData){
              if(!this.twtChatRoomData.hasOwnProperty('users')){this.twtChatRoomData['users']=listArr.map((un:string)=>{return {name:un.toLowerCase(),isSub:null,isMod:null,isVIP:null}})}
              else{
                for(let aui=0;aui<listArr.length;aui++){
                  const existUI:number=this.twtChatRoomData.users.findIndex((u:TWTChatUser)=>u.name.toLowerCase()===listArr[aui].toLowerCase());
                  if(existUI===-1){this.twtChatRoomData['users'].push({name:listArr[aui].toLowerCase(),isSub:null,isMod:null,isVIP:null})}
                };
                for(let rmi=0;rmi<this.twtChatRoomData['users'].length;rmi++){
                  if(!listArr.includes(this.twtChatRoomData['users'][rmi].name.toLowerCase())){
                    this.twtChatRoomData['users']=this.twtChatRoomData['users'].filter((u:TWTChatUser)=>u.name.toLowerCase()!==this.twtChatRoomData['users'][rmi].name.toLowerCase());
                  };
                };
              };
              this.twtChatRoomData.users=_.sortBy(this.twtChatRoomData.users,['name','asc']);
            };
          }else{if(orsSM.trim().length>1){this.doServerMsg(orsSM)}};
          break;
        case 'PRIVMSG':
          //------------
          let isMention:boolean=await this.isMeMention(mData);
          this.isMsgTrigger(mData);
          this.addUListData(mData);
          const origMsg:string=mData.parameters;
          if(mData.tags.emotes!==null&&!mData.tags.hasOwnProperty('emote-only')){
            let emoteStrArr:string[]=[];
            for(const e of Object.values(mData.tags.emotes)){
              if(Array.isArray(e)){
                for(let ei=0;ei<e.length;ei++){
                  const eSetStrArr:string[]=origMsg.slice(e[ei].startPosition,e[ei].endPosition+1).split(' ');
                  for(let ui=0;ui<eSetStrArr.length;ui++){if(!emoteStrArr.includes(eSetStrArr[ui])){emoteStrArr.push(eSetStrArr[ui])}}
                };
              };
            };
            let origMsgArr:string[]=mData.parameters.split(' '),noEmoArr:string[]=[];
            for(let ri=0;ri<origMsgArr.length;ri++){if(!emoteStrArr.includes(origMsgArr[ri])){noEmoArr.push(origMsgArr[ri])}};
            if(isMention){
              const mIndex:number=this.twtChatMentions.findIndex(m=>m.tags.id===mData.tags.id);
              if(mIndex!==-1){this.twtChatMentions[mIndex]['replied']=false};
            };
            mData.parameters=noEmoArr.join(' ').trim();
          };
          if(mData.tags['display-name'].toLowerCase()===this.twtUser.display_name.toLowerCase()){
            let meData={isMe:true,parameters:origMsg,tags:{'display-name':this.twtUser.display_name,isRah:false}};
            if(!this.twtChatIsPaused&&this.twtChatMsgs.length>100){this.twtChatMsgs=_.takeRight(this.twtChatMsgs,50)};
            this.twtChatIsPaused?this.twtChatPausedMsgs.unshift(meData):this.twtChatMsgs.unshift(meData);
          }else{
            mData['isRah']=false;
            if(!this.twtChatIsPaused&&this.twtChatMsgs.length>100){this.twtChatMsgs=_.takeRight(this.twtChatMsgs,50)};
            this.twtChatIsPaused?this.twtChatPausedMsgs.unshift(mData):this.twtChatMsgs.unshift(mData);
          };
          if(mData.tags['display-name'].toLowerCase()!==this.twtUser.display_name.toLowerCase()&&mData.tags.hasOwnProperty('bits')&&parseInt(mData.tags.bits,10)>100){
            this.isMsgTrigger({type:'tybits',user:mData.tags['display-name'].toLowerCase()},true);
          };
          break;
        case 'GLOBALUSERSTATE':
          let gusT:any=null;
          if(mData.hasOwnProperty('tags')&&!_.isEmpty(mData.tags)){gusT=mData.tags};
          if(!gusT||!this.twtUser){return};
          this.twtChatColor=mData.tags.color;
          this.twtUser.display_name=gusT['display-name'];
          if(!this.meStrArr.includes(this.twtUser.display_name)){this.meStrArr.push(this.twtUser.display_name)};
          if(!this.meStrArr.includes('@'+this.twtUser.display_name)){this.meStrArr.push('@'+this.twtUser.display_name)};
          break;
        case 'PING':break;
        case 'CAP':break;
        default:console.log('DEFAULT MSG');console.log(mData);
      };
      this.pDOM();
    });
  };
/////////////////////////////////////////////////////////
  bgCanvas(){this.cCTX.fillStyle='#00000000';this.cCTX.fillRect(0,0,288,162)};
  clrCanvas(){this.cCTX.clearRect(0,0,288,162)};
  //-------------------------------------------------------------
  async doFrameLoop():Promise<boolean>{
    const cArrs:any[]=[this.vizBaseColor,this.vizBaseColor,this.vizBaseColor,this.vizBaseColor,this.vizBaseColor];
    const bPC:number=Number((64/cArrs.length).toFixed(1));
    const aAmp:number=Math.ceil((this.avgAmps.reduce((a,b)=>a+b,0)/this.avgAmps.length)||0);
    const tAmp:number=Math.ceil((this.vizDataArr.reduce((a,b)=>a+b,0)/this.vizDataArr.length)||0);
    const vAmp:number=(tAmp-aAmp);
    const pAmp:number=Number((vAmp/aAmp).toFixed(1));
    let zH:number=Math.ceil(this.zIProps.h-(pAmp*25));
    if(zH>55){zH=55};if(zH<45){zH=45};
    const zY:number=(162-zH)/2;
    if(pAmp===0){this.zIProps.x+=2}else if(pAmp>0){this.zIProps.x+=3}else{this.zIProps.x+=1};
    if(this.zIProps.x>288){this.zIProps.x=-268};
    this.clrCanvas();
    this.cCTX.drawImage(this.vizZ01,this.zIProps.x,zY,this.zIProps.w,zH);
    let barX:number=0;
    const barW:number=((this.twtCanvas.nativeElement.width/64)-1);
    for(let i=0;i<64;i++){
      const bPerc:number=(Math.ceil(this.vizDataArr[i]*0.39)/100),bH:number=((162/3)*bPerc);
      let lC:string;
      if(i<=(bPC*1)){lC='rgba('+String(cArrs[0][0])+','+String(cArrs[0][1])+','+String(cArrs[0][2])+','};
      if(i>(bPC*1)&&i<=(bPC*2)){lC='rgba('+String(cArrs[1][0])+','+String(cArrs[1][1])+','+String(cArrs[1][2])+','};
      if(i>(bPC*2)&&i<=(bPC*3)){lC='rgba('+String(cArrs[2][0])+','+String(cArrs[2][1])+','+String(cArrs[2][2])+','};
      if(i>(bPC*3)&&i<=(bPC*4)){lC='rgba('+String(cArrs[3][0])+','+String(cArrs[3][1])+','+String(cArrs[3][2])+','};
      if(i>(bPC*4)&&i<=(bPC*5)){lC='rgba('+String(cArrs[4][0])+','+String(cArrs[4][1])+','+String(cArrs[4][2])+','};
      const lineColor=lC+String((bPerc*0.36))+')';
      this.cCTX.fillStyle=lineColor;
      this.cCTX.fillRect(barX,(162-bH),barW,bH);
      this.cCTX.fillRect(barX,0,barW,bH);
      barX+=barW+1;
    };
    if(this.avgAmps.length>128){this.avgAmps=_.takeRight(this.avgAmps,127)};
    this.avgAmps.push(tAmp);
    return Promise.resolve(true);
  }
//-------------------------------------------------------------
  async vizAnimStart():Promise<boolean>{
    const wledCols:any[]=await ipcRenderer.invoke('getWLEDColors');
    if(wledCols.length>0&&wledCols[0]){
      const mC:number[]=wledCols[0];
      if(Number(mC[0])===0&&Number(mC[1])===0&&Number(mC[2])===0&&Number(mC[3])>0){this.vizBaseColor=[255,255,255]}
      else if(Number(mC[0])===0&&Number(mC[1])===0&&Number(mC[2])===0&&Number(mC[3])===0){this.vizBaseColor=[255,0,0]}
      else{this.vizBaseColor=[Number(mC[0]),Number(mC[1]),Number(mC[2])]};
    };
    return new Promise(async(resolve)=>{
    this.vizZ01=new Image();
    this.vizZ01.src='assets/vizZer0ne.png';
      this.vizZ01.onload=()=>{
        if(!this.aFrame){this.aFrame=true};
        this.vFrameCount=0;
        this.vizAnimStep();
        this.cCons('(vizAnimStart)','STARTED...');
        resolve(true);
      };
    });
  }
//-------------------------------------------------------------
  async vizAnimStop():Promise<boolean>{
    this.aFrame=false;
    this.vFrameCount=0;
    this.clrCanvas();
    this.cCons('(vizAnimStop)','STOPPED.');
    return Promise.resolve(true);
  }
//-------------------------------------------------------------
  async vizAnimStep(){
    if(!this.aFrame){window.cancelAnimationFrame(this.aFrameId)}
    else{
      this.vFrameCount++;
      this.vizAnal.getByteFrequencyData(this.vizDataArr);
      await this.doFrameLoop();
      this.aFrameId=window.requestAnimationFrame(()=>this.vizAnimStep());
    };
  }
///////////////////////////////////////////////////
  toggleVideoBright(){
    let newVB:number=this.twtVideoBright+=0.25;
    if(newVB>1){newVB=0.25};
    this.twtVideoBright=newVB;
    this.pDOM();
    this.twtSBar('show',{type:'info',source:'ctrl',msg:'Video Bright: '+String((newVB*100))+'%'});
  }
//////////////////////////////////////////////////
  async toggleTWTViz(){
    this.cCons('toggleTWTViz','()...');
    if(this.twtVizOn){await this.twtVizAction('stop')}
    else{await this.twtVizAction('start')};
  }
//////////////////////////////////////////////////
  twtShowHideChatList(){
    if(this.twtChatListHidden){
      document.body.style.maxHeight='unset';
      this.twtChatListHidden=false;
    }else{
      document.body.style.maxHeight='242px';
      this.twtChatListHidden=true;
    };
    this.pDOM();
  }
//////////////////////////////////////////////////
async twtVizAction(action:'start'|'stop'){
  this.cCons('twtVizAction','('+action+')...');
  if(action==='start'){
    if(!this.twtVizOn){
      this.twtVizOn=true;
      this.pDOM();
      this.twtCanvas.nativeElement.width=288;
      this.twtCanvas.nativeElement.height=162;
      this.cCTX=this.twtCanvas.nativeElement.getContext('2d');
      this.nS=await navigator.mediaDevices.getUserMedia({audio:{deviceId:'default'},video:false});
      this.aCTX=new AudioContext();
      this.aSRC=this.aCTX.createMediaStreamSource(this.nS);
      this.vizAnal=this.aCTX.createAnalyser();
      this.vizAnal.fftSize=256;
      this.vizBuffLen=this.vizAnal.frequencyBinCount;
      this.aSRC.connect(this.vizAnal);
      this.vizDataArr=new Uint8Array(this.vizBuffLen);
      this.vizAnimStart();
      this.pDOM();
    }else{this.cCons('twtVizAction','SKIPPED: Sync Already Active')};
  }else{
    if(this.twtVizOn){
      this.pDOM();
      this.vizAnimStop();
      this.twtVizOn=false;
      this.nS.getTracks().forEach((track)=>{if(track.readyState==='live'&&track.kind.includes('audio')){track.stop()}});
    }else{this.cCons('twtVizAction','SKIPPED: Sync Not Active')};
  };
}
/////////////////////////////////////////////////////////
  addUListData(mData:any){
    const tpArr:string[]=['subscriber','mod','vip'],upArr:string[]=['isSub','isMod','isVIP'];
    let uInf:TWTChatUser={name:'',isSub:null,isMod:null,isVIP:null};
    if(this.twtChatRoomData.hasOwnProperty('users')&&this.twtChatRoomData.users.length>0){
      if(mData.hasOwnProperty('tags')&&!_.isEmpty(mData.tags)){
        const mT:any=mData.tags;
        if(mData.tags.hasOwnProperty('display-name')){uInf.name=mT['display-name'].toLowerCase()}else{return};
        const existUI:number=this.twtChatRoomData.users.findIndex((u:TWTChatUser)=>u.name.toLowerCase()===uInf.name);
        for(let uii=0;uii<tpArr.length;uii++){
          if(mT.hasOwnProperty(tpArr[uii])){uInf[upArr[uii]]=(mT[tpArr[uii]]==='1')};
          if(existUI!==-1){if(this.twtChatRoomData.users[existUI][upArr[uii]]!==uInf[upArr[uii]]){this.twtChatRoomData.users[existUI][upArr[uii]]=uInf[upArr[uii]]}};
        };
        if(existUI===-1){this.twtChatRoomData.users.push(uInf);this.twtChatUsersChange.push('inc')};
      };
    };
  }
/////////////////////////////////////////////////////////
  toggleChatUsersSheet(){
    this.cCons('toggleChatUsersSheet','()...');
    this.twtChatUsersShowing?this.twtChatUsersShowing=false:this.twtChatUsersShowing=true;
    this.pDOM();
  }
/////////////////////////////////////////////////////////
  randRRTOMSecs():number{let r:number=Math.random();r=Math.floor(r*12);r=r+6;return (r*60000)};
  rInR(min:number,max:number):number{let r:number=Math.random();r=Math.floor(r*(max-min));r=r+min;return r};
/////////////////////////////////////////////////////////
  toggleTriggersSummary(){
    this.cCons('toggleTriggersSummary','()...');
    this.trigSummaryOpen?this.trigSummaryOpen=false:this.trigSummaryOpen=true;this.pDOM();
    if(this.trigSummaryOpen&&this.newBotAction===true){this.newBotAction=false};
  }
/////////////////////////////////////////////////////////
  async clearTriggerEvents(){
    this.cCons('clearTriggerEvents','()...');
    this.twtSaveData.data.sessionTriggers=[];
    this.pDOM();
    await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
  }
/////////////////////////////////////////////////////////
  async twtDataToggles(type:string){
    this.cCons('twtDataToggles','('+type+')...');
    const typeToPty:any={greet:'greetOn',rah:'rahRahOn',bpm:'bpmReqOn',tune:'tuneReqOn',wc:'welcomeOn',tysub:'tySubOn',tybits:'tyBitsOn'};
    const sdTogPty:string=typeToPty[type];
    this.twtSaveData.toggles[sdTogPty]?this.twtSaveData.toggles[sdTogPty]=false:this.twtSaveData.toggles[sdTogPty]=true;
    this.pDOM();await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
    const nS:boolean=this.twtSaveData.toggles[sdTogPty];
    this.twtSBar('show',{type:(nS?'ok':'error'),source:'chat',msg:'Toggled '+(this.capd(type.toLowerCase()))+' Bot Action: '+(nS?'ON':'OFF')});
    if(type==='rah'){
      await this.clearRahRah();
      if(nS){await this.setRahRah()};
    };
  }
/////////////////////////////////////////////////////////
  setRahRah():Promise<boolean>{
    this.cCons('setRahRah','()...');
    this.nextTOms=this.randRRTOMSecs();
    this.rahRahTO=setTimeout(()=>{this.botAction('rahrah',false)},this.nextTOms);
    this.rahRahINT=setInterval(()=>{
      this.rahRahINTCount++;
      const newTimeSecs:number=((this.nextTOms-(this.rahRahINTCount*1000))/1000);
      this.rahRahCD=(this.evServ.secsToMSS(newTimeSecs));
      this.pDOM();
    },1000);
    return Promise.resolve(true);
  }
/////////////////////////////////////////////////////////
  clearRahRah():Promise<boolean>{
    this.cCons('clearRahRah','()...');
    if(this.rahRahINT!==null){clearInterval(this.rahRahINT);this.rahRahINT=null};
    if(this.rahRahTO!==null){clearTimeout(this.rahRahTO);this.rahRahTO=null};
    this.rahRahINTCount=0;
    this.nextTOms=0;
    this.rahRahCD='';
    this.rahRahAnim=false;
    return Promise.resolve(true);
  }
/////////////////////////////////////////////////////////
  rdI(a:any[]):any{return a[(Math.floor(Math.random()*a.length))]};
  l2dURL(u:string,ms:string[]):string{if(ms.includes('dark')&&u.split('/static/')[1].startsWith('light')){return u.replace('/light/','/dark/')}else{return u}};
/////////////////////////////////////////////////////////
  async botAction(action:'greet'|'rahrah',isManual:boolean){
    this.cCons('botAction','('+action+')...');
    //------------
    const nowTime:Date=new Date(),nowUT:number=this.evServ.gUT(nowTime);
    const meUser:string=this.twtUser.display_name.toLowerCase(),meRoom:string=this.twtChatRoom.toLowerCase();
    let triggerEvent:TWTTriggerEvent={type:action,time:{d:nowTime,s:(this.evServ.triggerTime(nowTime))},user:meUser,userIsMod:false,channel:meRoom,matches:[(isManual&&isManual===true?'manual':'auto')],didSkip:false};
    //------------
    switch(action){
      case 'greet':
        let doGreet:boolean=false,existGI:number=-1;
        if(this.twtSaveData.data.didGreet.length===0){doGreet=true}
        else{
          existGI=this.twtSaveData.data.didGreet.findIndex(g=>g.channel===this.twtChatRoom);
          if(existGI===-1){doGreet=true}
          else{
            if(isManual){doGreet=true}
            else{
              const existLI:number=this.twtLives.findIndex(l=>l.user_name.toLowerCase()===this.twtChatRoom);
              const lSD:Date=this.evServ.pISO(this.twtLives[existLI].started_at),lSUT:number=this.evServ.gUT(lSD);
              const lGUT:number=this.evServ.gUT(this.twtSaveData.data.didGreet[existGI].time);
              if(lGUT<lSUT){doGreet=true}else{doGreet=false};
            };
          };
        };
        if(doGreet){
          const rGStr:string=(this.rdI(this.greetArr)).replace('XXX','@'+this.twtChatRoom);
          await this.processChatInput(rGStr);
          if(existGI!==-1){this.twtSaveData.data.didGreet[existGI].time=new Date()}
          else{this.twtSaveData.data.didGreet.push({channel:this.twtChatRoom,time:new Date()})};
          if(this.twtSaveData.data.sessionTriggers.length>0){this.twtSaveData.data.sessionTriggers.unshift(triggerEvent)}else{this.twtSaveData.data.sessionTriggers=[triggerEvent]};
          if(!this.trigSummaryOpen){this.newBotAction=true};
          this.twtSaveData.data.lastTrigger={type:action,user:meUser,channel:meRoom,time:{d:nowTime,s:triggerEvent.time.s,ut:nowUT}};
          await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
          this.pDOM();
        };
        break;
      //------------
      case 'rahrah':
        this.rahRahAnim=true;
        this.pDOM();
        if(this.channelMotes.length>0||this.globalMotes.length>0){
          let availChanEs:{n:string,u:string}[]=[];
          if(this.channelMotes.length>0){
            let chanEFilts:string[]=['follower'];if(this.twtChatRoomData.me.sub){chanEFilts.push('subscriptions')};
            const okChanEs:any[]=this.channelMotes.filter((e:any)=>chanEFilts.includes(e['emote_type'])&&(e['tier']===''||parseInt(e['tier'],10)<=parseInt(this.chanSubLevel,10)));
            if(okChanEs.length>0){availChanEs=okChanEs.map((e:any)=>{return {n:e['name'],u:this.l2dURL(e['images']['url_1x'],e['theme_mode'])}})};
          };
          const rrMode:string=this.rdI(this.rrModes);
          const allGlobalEs:any[]=_.shuffle(this.globalMotes);
          let usedGlobalEs:string[]=[];
          if(rrMode!=='std'){for(let ei=0;ei<this.myEsArr.dirEs.length;ei++){usedGlobalEs.push(this.myEsArr.dirEs[ei].l);usedGlobalEs.push(this.myEsArr.dirEs[ei].r)};usedGlobalEs=usedGlobalEs.concat(this.myEsArr.wordEs)};
          usedGlobalEs=usedGlobalEs.concat(this.myEsArr.faveEs);
          let availGlobalEs:{n:string,u:string}[]=[];for(let agei=0;agei<allGlobalEs.length;agei++){const gE:any=allGlobalEs[agei];if(!usedGlobalEs.includes(gE.name)){availGlobalEs.push({n:gE.name,u:this.l2dURL(gE['images']['url_1x'],gE['theme_mode'])})}};
          const rrLen:number=this.rInR(24,32);
          let rrComboSetEs:{n:string,u:string|null}[]=availChanEs;
          if(rrComboSetEs.length<rrLen){const mustAdd:number=rrLen-rrComboSetEs.length;for(let mai=0;mai<mustAdd;mai++){const randGlobE:any=this.rdI(availGlobalEs);rrComboSetEs.push(randGlobE)}};
          //-------------
          const thisRRRandSet:{n:string,u:string}[]=_.shuffle(rrComboSetEs);
          let finalRRSet:{n:string,u:string|null}[]=[];
          //------------
          if(rrMode!=='std'){
            const rWordE1Name:string=this.rdI(this.myEsArr.wordEs),matchGObj1:any=this.globalMotes.filter((ge:any)=>ge.name===rWordE1Name)[0],rWord1Obj1:{n:string,u:string}={n:matchGObj1['name'],u:this.l2dURL(matchGObj1['images']['url_1x'],matchGObj1['theme_mode'])};
            const rWordE2Name:string=this.rdI(this.myEsArr.wordEs),matchGObj2:any=this.globalMotes.filter((ge:any)=>ge.name===rWordE2Name)[0],rWord1Obj2:{n:string,u:string}={n:matchGObj2['name'],u:this.l2dURL(matchGObj2['images']['url_1x'],matchGObj2['theme_mode'])};
            const wBase:string=this.rrWords[(Math.floor(Math.random()*this.rrWords.length))],wPos:string=this.rdI(['s','m','e']),wExcl=this.rdI(['!','!!','!!!']),wordObj:{n:string,u:null}={n:wBase+wExcl,u:null};
            if(!this.rrWords.includes(this.twtChatRoom)){this.rrWords.push(this.twtChatRoom.toUpperCase())};
            const finalWordSet:{n:string,u:string|null}[]=[rWord1Obj1,wordObj,rWord1Obj2];
            if(wPos==='s'){finalRRSet=finalWordSet.concat(thisRRRandSet)}
            else if(wPos==='m'){const halfNo:number=Math.ceil(thisRRRandSet.length/2),fHalf:{n:string,u:string|null}[]=thisRRRandSet.slice(0,halfNo),lHalf:{n:string,u:string|null}[]=thisRRRandSet.slice(halfNo);finalRRSet=fHalf.concat(finalWordSet,lHalf)}
            else{finalRRSet=thisRRRandSet.concat(finalWordSet)};
          }else{finalRRSet=thisRRRandSet};
          //------------
          this.lastRah=finalRRSet;
          const rahStr:string=finalRRSet.map(rO=>rO.n).join(' ').trim();
          if(this.twtChatConn&&this.twtChatRoom!==null){
            const sendCMDRes:boolean=await ipcRenderer.invoke('doChatCMD',['PRIVMSG #'+this.twtChatRoom+' :'+rahStr]);
            if(sendCMDRes){
              let myRahData:any={isRah:true,rah:this.lastRah,tags:{'display-name':this.twtUser.display_name}};
              if(!this.twtChatIsPaused&&this.twtChatMsgs.length>100){this.twtChatMsgs=_.takeRight(this.twtChatMsgs,50)};
              this.twtChatMsgs.unshift(myRahData);
              if(this.twtSaveData.data.sessionTriggers.length>0){this.twtSaveData.data.sessionTriggers.unshift(triggerEvent)}else{this.twtSaveData.data.sessionTriggers=[triggerEvent]};
              if(!this.trigSummaryOpen){this.newBotAction=true};
              this.twtSaveData.data.lastTrigger={type:action,user:meUser,channel:meRoom,time:{d:nowTime,s:triggerEvent.time.s,ut:nowUT}};
              await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
            };
          };
        };
        //------------
        setTimeout(async()=>{await this.clearRahRah();if(this.twtSaveData.toggles.rahRahOn){await this.setRahRah()};this.rahRahAnim=false},3000);
        break;
      //------------
      default:this.cCons('botAction','Unknown Action: '+action);
    };
  }
/////////////////////////////////////////////////////////
  async actChanRaidSubAction(eventData:any):Promise<boolean>{
    this.cCons('actChanRaidSubAction','(data:any)...');
    this.isMsgTrigger({type:'tyraid',user:eventData.from_broadcaster_user_name,viewers:eventData.viewers},true);
    return Promise.resolve(true);
  }
/////////////////////////////////////////////////////////
  async isMsgTrigger(mData:any,isManual?:boolean):Promise<boolean>{
    const meUser:string=this.twtUser.display_name.toLowerCase(),meRoom:string=this.twtChatRoom.toLowerCase();
    let trigUser:string='',trigUIsMod:boolean=false,trigTypes:TWTTriggerEventType[]=[],trigMatches:any={};
    if(isManual&&isManual===true){
      if(mData.user.toLowerCase()===meUser||mData.user.toLowerCase==='streamelements'||mData.isMod){return};
      if(mData.type==='tyraid'&&parseInt(mData.viewers,10)<10){return};
      if(mData.type==='tyraid'&&!this.twtSaveData.toggles.welcomeOn){return};
      if(mData.type==='tysub'&&!this.twtSaveData.toggles.tySubOn){return};
      if(mData.type==='tybits'&&!this.twtSaveData.toggles.tyBitsOn){return};
      switch(mData.type){
        case 'tyraid':case 'tysub':case 'tybits':
          trigTypes=[mData.type];
          trigUser=mData.user;
          trigMatches[mData.type]=['PRIVMSG.tags.msg-id==='+mData.type.replace('ty','')];
        default:this.cCons('isMsgTrigger|Manual','Unknown Type: '+mData.type);
      };
    }else{
      const trigTags:any=mData.tags;
      const trigUFirstMsg:boolean=(trigTags['first-msg']==='1');
      const trigUReturn:boolean=(trigTags['returning-chatter']==='1');
      const trigMsg:string=mData.parameters;
      trigUser=trigTags['display-name'].toLowerCase();
      trigUIsMod=(trigTags.mod==='1');
      if(trigUser===meUser||trigUser==='streamelements'||trigUIsMod){return};
      //------------
      if(this.twtSaveData.toggles.tuneReqOn){
        for(let fti=0;fti<this.fTuneTriggers.length;fti++){if(trigMsg.includes(this.fTuneTriggers[fti])){trigTypes.push('tune');if(!trigMatches.hasOwnProperty('tune')){trigMatches['tune']=[this.fTuneTriggers[fti]]}else{trigMatches['tune'].push(this.fTuneTriggers[fti])}}};
      };
      if(this.twtSaveData.toggles.bpmReqOn){
        for(let bpmi=0;bpmi<this.fBPMTriggers.length;bpmi++){if(trigMsg.includes(this.fBPMTriggers[bpmi])){trigTypes.push('bpm');if(!trigMatches.hasOwnProperty('bpm')){trigMatches['bpm']=[this.fBPMTriggers[bpmi]]}else{trigMatches['bpm'].push(this.fBPMTriggers[bpmi])}}};
      };
      if(this.twtSaveData.toggles.welcomeOn){
        if(trigUFirstMsg&&!trigUReturn){trigTypes.push('welcome');trigMatches['welcome']=trigMsg};
      };
      if(this.twtSaveData.toggles.tyBitsOn){
        if(trigTags.hasOwnProperty('pinned-chat-paid-amount')){
          const aNo:number=(parseInt(trigTags['pinned-chat-paid-amount'],10))/100,aStr:string=aNo.toFixed(2);
          trigMatches['tybits']='Paid Chat - $'+aStr;
          trigTypes.push('tybits');
        };
      };
    };
    //------------
    const doTriggerAction=async(t:TWTTriggerEventType):Promise<boolean>=>{
      const nowTime:Date=new Date(),nowUT:number=this.evServ.gUT(nowTime);
      let triggerEvent:TWTTriggerEvent={type:t,time:{d:nowTime,s:(this.evServ.triggerTime(nowTime))},user:trigUser,userIsMod:trigUIsMod,channel:meRoom,matches:trigMatches[t],didSkip:false};
      const tooSoon=():boolean=>{
        if(!this.twtSaveData.data.lastTrigger){return false};
        if(this.twtSaveData.data.lastTrigger.type!==t){return false}
        else{
          if(!this.twtSaveData.data.lastTrigger.time.d||(nowUT-30)>this.twtSaveData.data.lastTrigger.time.ut){return false}
          else{return true}
        };
      };
      const sameUser=():boolean=>{
        if(!this.twtSaveData.data.lastTrigger){return false};
        if(this.twtSaveData.data.lastTrigger.user!==trigUser){return false}
        else{
          if(!this.twtSaveData.data.lastTrigger.time.d||(nowUT-300)>this.twtSaveData.data.lastTrigger.time.ut){return false}
          else{return true}
        };
      };
      //------------
      if((tooSoon())){triggerEvent.didSkip=true;if(!triggerEvent.hasOwnProperty('skip')){triggerEvent['skip']=['time']}else{triggerEvent.skip.push('time')}};
      if((sameUser())){triggerEvent.didSkip=true;if(!triggerEvent.hasOwnProperty('skip')){triggerEvent['skip']=['user']}else{triggerEvent.skip.push('user')}};
      if(this.twtSaveData.data.lastTrigger.time.d&&(nowUT-30)<this.twtSaveData.data.lastTrigger.time.ut){return false};
      if(!triggerEvent.didSkip){
        this.twtSaveData.data.lastTrigger={type:t,user:trigUser,channel:meRoom,time:{d:nowTime,s:triggerEvent.time.s,ut:nowUT}};
        await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
        await this.doW((this.rdI([5,15])));
        switch(t){
          case 'tune':
            this.evServ.subscribe('triggerTuneDone',()=>{
              this.evServ.destroy('trigerTuneDone');
              let tuneRespTxt:string='';
              if(!this.findingTune&&this.ftResult&&this.ftResult.r&&this.ftResult.d&&this.ftResult.d.length>0){
                tuneRespTxt=this.ftResult.d.artist+' - '+this.ftResult.d.title;
                this.doFindTune('sharechat',trigUser);
                this.doFindTune('close');
              }else{
                tuneRespTxt='Not Found';
                this.doFindTune('close');
              };
              triggerEvent.matches.push(tuneRespTxt);
              this.pDOM();
            });
            break;
          case 'bpm':
            let bpmRespTxt:string='';
            if(this.twtSaveData.toggles.bpmLoopOn&&this.rtBPMResult.r&&this.rtBPMResult.d){
              bpmRespTxt='@'+trigUser+' - tunes @ approx. '+String(this.rtBPMResult.d)+' BPM';
              await this.processChatInput(bpmRespTxt);
            }else{
              if(!this.twtSaveData.toggles.bpmLoopOn){bpmRespTxt='BPM Loop is OFF'};
              if(!this.rtBPMResult.r){bpmRespTxt='BPM Result = Error'};
              if(!this.rtBPMResult.d){bpmRespTxt='BPM Data = NULL'};
            };
            triggerEvent.matches.push(bpmRespTxt);
            this.pDOM();
            break;
          case 'welcome':
            const rWStr:string=(this.rdI(this.welcomesArr)).replace('XXX','@'+trigUser);
            await this.processChatInput(rWStr);
            triggerEvent.matches.push(rWStr);
            this.pDOM();
            break;
          case 'tysub':
            const rTYS:string=(this.rdI(this.tySubArr)).replace('XXX','@'+trigUser);
            await this.processChatInput(rTYS);
            triggerEvent.matches.push(rTYS);
            this.pDOM();
            break;
          case 'tybits':
            const rTYB:string=(this.rdI(this.tyBitsArr)).replace('XXX','@'+trigUser);
            await this.processChatInput(rTYB);
            triggerEvent.matches.push(rTYB);
            this.pDOM();
            break;
          case 'tyraid':
            const rTYR:string=(this.rdI(this.tyRaidArr)).replace('XXX','@'+trigUser);
            await this.processChatInput(rTYR);
            triggerEvent.matches.push(rTYR);
            this.pDOM();
            break;
        };
      };
      this.twtSaveData.data.sessionTriggers.unshift(triggerEvent);
      if(!this.trigSummaryOpen){this.newBotAction=true};
      return Promise.resolve(true);
    };
    //------------
    if(trigTypes.length<1){return Promise.resolve(true)}
    else{
      for(let mti=0;mti<trigTypes.length;mti++){doTriggerAction(trigTypes[mti]);await this.doW(0.25)};
      return Promise.resolve(true);
    };
  };
//////////////////////////////////////////////////
  async doCalcBPM(){
    const notifyNew=async()=>{this.rtNotifyNew=true;this.pDOM();await this.doW(5);this.rtNotifyNew=false;this.pDOM()};
    if(this.twtSaveData.toggles.bpmLoopOn){
      const bpmCRes:{r:boolean,d:any}=await ipcRenderer.invoke('getBPMData');
      if(this.twtSaveData.toggles.bpmLoopOn){
        if(this.rtBPMResult!==null){this.rtPrevBPMResult=this.rtBPMResult};
        this.rtBPMResult=bpmCRes;
        notifyNew();
        this.doCalcBPM();
      }else{this.doClearBPMData()};
    }else{this.doClearBPMData()};
  }
//////////////////////////////////////////////////
  doClearBPMData(){this.rtBPMResult=null;this.rtPrevBPMResult=null;this.rtNotifyNew=false;this.pDOM()};
//////////////////////////////////////////////////
  async rtBPMToggle(){
    this.doClearBPMData();
    this.twtSaveData.toggles.bpmLoopOn?this.twtSaveData.toggles.bpmLoopOn=false:this.twtSaveData.toggles.bpmLoopOn=true;
    const nS:boolean=this.twtSaveData.toggles.bpmLoopOn;
    if(nS){this.doCalcBPM()};
    this.twtSBar('show',{type:'ok',source:'ctrl',msg:'Realtime BPM Cal: '+nS?'ON':'OFF'});
    this.pDOM();
    await ipcRenderer.invoke('handleTWTWriteData',[this.twtSaveData]);
  }
/////////////////////////////////////////////////////////
  async doFindTune(action:string,data?:any):Promise<boolean>{
    this.cCons('doFindTune','('+action+')...');
    switch(action){
      case 'start':
        this.findingTune=true;this.ftStatus=null;this.ftResult=null;
        const ftRes:{r:boolean,d:any}=await ipcRenderer.invoke('findTune');
        this.findingTune=false;this.ftStatus=null;
        if(ftRes.r){let lFTR:any=ftRes.d;lFTR['action']=false;this.ftResult={r:true,d:lFTR};this.pDOM()}
        else{
          this.ftResult={r:false,d:ftRes.d};this.pDOM();
          this.evServ.publish('triggerTuneDone',true);
          await this.doW(3);
          this.doFindTune('close');
        };
        break;
      case 'sharechat':
        if(!this.findingTune&&this.ftResult&&this.ftResult.r){
          let triggerPrefix:string='';if(data&&data.length>0){triggerPrefix='@'+data+' '};
          let chatStr:string=triggerPrefix+'Tune is '+this.ftResult.d.artist+' by '+this.ftResult.d.title;
          if(this.ftResult.d.hasOwnProperty('label')){chatStr+=' via '+this.ftResult.d.label};
          if(this.ftResult.d.hasOwnProperty('year')){chatStr+=' ('+this.ftResult.d.year+')'};
          await this.processChatInput(chatStr);
          this.ftResult.d.action='sharedchat';
          this.pDOM();
        };
        break;
      case 'sharecb':
        if(!this.findingTune&&this.ftResult&&this.ftResult.r){
          const posPtys:string[]=['album','label','date'];
          let cbStr:string=this.ftResult.d.artist+' - '+this.ftResult.d.title;
          for(let pi=0;pi<posPtys.length;pi++){if(this.ftResult.d.hasOwnProperty(posPtys[pi])&&this.ftResult.d[posPtys[pi]].length>0){cbStr+=' '+this.ftResult.d[posPtys[pi]]}};
          clipboard.writeText(cbStr);
          this.ftResult.d.action='copied';
          this.pDOM();
        };
        break;
      case 'close':this.findingTune=false;this.ftStatus=null;this.ftResult=null;this.pDOM();break;
      default:this.cCons('doFindTune','Unknown Action: '+String(action));
    };
    this.pDOM();
    return Promise.resolve(true);
  }
/////////////////////////////////////////////////////////
  chatCMFns(event:string){
    this.cCons('chatCMFns','('+event+')...');
    switch(event){
      case 'me':
        if(this.cmIsOpen){this.cmIsOpen=false}{ipcRenderer.send('cmIsOpen',[false])};
        if(this.twtChatConn&&this.twtChatRoom!==null){ipcRenderer.send('cmContext',['chat'])}
        else{ipcRenderer.send('cmContext',[''])};
        break;
      case 'ml':if(!this.cmIsOpen){ipcRenderer.send('cmContext',[''])};break;
      case 'cm':this.cmIsOpen=true;ipcRenderer.send('cmIsOpen',[true]);break;
      default:break
    }
  }
//////////////////////////////////////////////////
  async doDataInits():Promise<boolean>{
    this.cCons('doDataInits','()...');
    const gTURes:any=await ipcRenderer.invoke('getTwtUser');
    if(gTURes){this.twtUser=gTURes};
    const gTLRes:any[]=await ipcRenderer.invoke('getTwtLives');
    if(gTLRes.length===0){this.twtLives=[]}
    else{
      let rawSubs:any[]=gTLRes,actSubID:string|null=null,actSub:any;
      for(let si=0;si<rawSubs.length;si++){
        rawSubs[si].thumbnail_url=rawSubs[si].thumbnail_url.replace('{width}','16').replace('{height}','16');
        rawSubs[si].language=await getLang(rawSubs[si].language);
        rawSubs[si]['rt']=(this.evServ.streamRT((this.evServ.pISO(rawSubs[si].started_at)))).replace(/\s/g,'');
        if(this.twtChatRoom&&this.twtChatRoom===rawSubs[si].user_login){actSubID=rawSubs[si].user_id;actSub=rawSubs[si]};
      };
      if(actSubID){rawSubs=rawSubs.filter(sO=>sO.user_id!==actSubID);rawSubs.unshift(actSub)};
      this.twtLives=rawSubs;
    };
    const gFRes:any=await ipcRenderer.invoke('getTwtFollowing');
    if(gFRes.length===0){this.twtFollowing=[]}
    else{
      const liveNames:string[]=this.twtLives.map(lO=>lO.user_login);
      let lessLives:any[]=gFRes.filter(fO=>!liveNames.includes(fO.to_name));
      let ordList:any[]=_.orderBy(lessLives,['followed_at'],['asc']);
      this.twtFollowing=ordList;
    };
    const gTESRes:any[]=await ipcRenderer.invoke('getTWTEvSubs');
    if(gTESRes.length===0){this.twtEvSubs=[]}
    else{this.twtEvSubs=gTESRes};
    if(!this.ffPaths){this.ffPaths=await ipcRenderer.invoke('getFFPaths')};
    this.pDOM();
    this.cCons('doDataInits','Retrieving twtAuth Object');
    this.twtAuth=await ipcRenderer.invoke('getTWTAuth');
    if(this.twtAuth&&this.twtAuth.token.trim().length>0){
      let lAll:string[]=[],chan4Join:string|null=null;
      if(this.twtLives.length>0){lAll=this.twtLives.map(l=>l.user_name.toLowerCase())}else{lAll=[]};
      let liveFaves:string[]=[];for(let li=0;li<lAll.length;li++){if(this.lFaves.includes(lAll[li])){liveFaves.push(lAll[li])}};
      if(liveFaves.length>0){chan4Join=liveFaves[0]}else{if(lAll.length>0){chan4Join=lAll[0]}};
      if(!this.twtChatConn){await this.twtChatConnection('connect',chan4Join)};
    }else{this.twtSBar('show',{type:'error',source:'chat',msg:'Failed to Retrieve Auth'})};
    if(this.twtSaveData.toggles.bpmLoopOn){this.doCalcBPM()};
    return Promise.resolve(true);
  }
//------------------------------------------------
  updChatRoomIncDec(){
    if(this.twtChatUsersChange.length>0){
      const incCount:number=this.twtChatUsersChange.filter(c=>c==='inc').length;
      const decCount:number=this.twtChatUsersChange.filter(c=>c==='dec').length;
      if(incCount===decCount){
        this.twtChatUsersIncDec='same'
      }else{
        if(incCount>decCount){this.twtChatUsersIncDec='inc'}
        else{this.twtChatUsersIncDec='dec'};
      }
    }else{this.twtChatUsersIncDec='same'};
    this.pDOM();
  }
//------------------------------------------------
  async cancelChangeStream(){
    this.cCons('cancelChangeStream','()...');
    if(this.twtChangeStream.inprog&&this.twtChangeStream.data.int!==null){
      clearInterval(this.twtChangeStream.data.int);
      this.twtChangeStream={nowStream:'',nextStream:'',reason:'',data:{int:null,time:15},inprog:false};
    }else{this.cCons('cancelChangeStream','SKIPPED - !inprog || int===null')};
  }
//------------------------------------------------
  async resolveChangeStream(){
    this.cCons('resolveChangeStream','()...');
    if(this.twtChangeStream.reason==='adblock'){this.twtChangeStream={nowStream:'',nextStream:'',reason:'',data:{int:null,time:15},inprog:false}}
    else{
      this.pDOM();await this.doW(0.25);
      if(this.twtChatConn){
        if(this.twtChatRoom){await this.joinPartChatRoom('part',this.twtChangeStream.nowStream)};
        await this.joinPartChatRoom('join',this.twtChangeStream.nextStream);
      }else{await this.twtChatConnection('connect',this.twtChangeStream.nextStream)};
      this.resetPlyr();this.pDOM();await this.doW(0.25);
      if(this.twtSPStatus.init&&this.twtStreamPlyr){this.twtStreamPlayer('setChannel',this.twtChangeStream.nextStream)}
      else{this.twtStreamPlayer('init',this.twtChangeStream.nextStream)};
      this.twtChangeStream={nowStream:'',nextStream:'',reason:'',data:{int:null,time:15},inprog:false};
    };
  }
//////////////////////////////////////////////////
  async exitRoomStream(roomStream:string){
    this.cCons('exitRoomStream','('+roomStream+')...');
    await this.joinPartChatRoom('part',this.twtChatRoom);
    this.twtChangeStream.reason='no';
    this.twtChangeStream.inprog=true;
    this.resetPlyr();
  }
//------------------------------------------------
  async joinPartChatRoom(action:string,channelName:string):Promise<boolean>{
    this.cCons('joinPartChatRoom','('+action+','+channelName+')...');
    if(action==='join'){
      if(!this.twtChatConn){await this.twtChatConnection('connect',channelName)}
      else{
        if(this.twtChatRoom){await ipcRenderer.invoke('doChatJoinPart',['part',this.twtChatRoom])};
        await ipcRenderer.invoke('doChatJoinPart',['join',channelName]);
      };
    }else{if(this.twtChatConn){await ipcRenderer.invoke('doChatJoinPart',['part',channelName])}};
    return Promise.resolve(true);
  }
//------------------------------------------------
  streamListSelect(streamName:string){
    this.cCons('streamListSelect','('+streamName+')...');
    let currentChan:string='none';if(this.twtChatRoom&&this.twtChatRoom.length>0){currentChan=this.twtChatRoom};
    this.doChangeStream('change',currentChan,streamName);
  }
//------------------------------------------------
  async doChangeStream(reason:string,channel:string,next?:string){
    let isN:string='';if(next&&next.length>0){isN=next};
    this.cCons('doChangeStream','('+reason+','+channel+','+isN+')...');
    if(this.twtChangeStream.inprog&&this.twtChangeStream.reason==='no'){this.twtChangeStream.inprog=false};
    if(!this.twtChangeStream.inprog){
      this.twtChangeStream.reason=reason;
      this.twtChangeStream.nowStream=channel;
      if(reason==='adblock'){this.twtChangeStream.nextStream=channel;this.twtChangeStream.data.time=15}
      else if(reason==='change'&&next&&next.length>0){this.twtChangeStream.nextStream=next;this.twtChangeStream.data.time=3}
      else if(reason==='dead'){
        this.twtLives=this.twtLives.filter(l=>l.user_login!==this.twtChangeStream.nowStream);
        this.twtLives=this.twtLives.filter(l=>l.user_name.toLowerCase()!==this.twtChangeStream.nowStream);
        let lAll:string[]=[],chan4Next:string|null=null;
        if(this.twtLives.length>0){lAll=this.twtLives.map(l=>l.user_name.toLowerCase())}else{lAll=[]};
        let liveFaves:string[]=[];for(let li=0;li<lAll.length;li++){if(this.lFaves.includes(lAll[li])){liveFaves.push(lAll[li])}};
        if(liveFaves.length>0){chan4Next=liveFaves[0]}else{if(lAll.length>0){chan4Next=lAll[0]}else{chan4Next='monstercat'}};
        this.twtChangeStream.nextStream=chan4Next;
        this.twtChangeStream.data.time=3;
      };
      this.twtChangeStream.inprog=true;
      this.pDOM();
      this.twtChangeStream.data.int=setInterval(()=>{
        this.twtChangeStream.data.time--;
        if(this.twtChangeStream.data.time===0){
          clearInterval(this.twtChangeStream.data.int);
          this.resolveChangeStream();
        };
      },1000);
    }else{this.cCons('checkNextInProg','Skipped - nextInProg===true')};
  }
//------------------------------------------------
  resetPlyr():Promise<boolean>{
    this.twtSPStatus.playing=false;
    if(this.twtStreamPlyr){this.twtStreamPlayer('getPaused',null)}else{this.twtSPStatus.paused=false};
    if(this.twtStreamPlyr){this.twtStreamPlayer('getMuted',null)}else{this.twtSPStatus.muted=false};
    this.twtSPStatus.volume=1;this.twtSPStatus.title='';this.twtSPStatus.channel='';this.twtSPStatus.formats=[];this.twtSPStatus.format='';this.twtSPStatus.stats={backendVersion:'',bufferSize:0,codecs:'',displayResolution:'',fps:0,hlsLatencyBroadcaster:0,playbackRate:0,skippedFrames:0,videoResolution:''};
    if(this.streamStatsINT!==null){clearInterval(this.streamStatsINT);this.streamStatsINT=null;this.sSINTCount=0};
    this.pDOM();
    return Promise.resolve(true);
  }
//------------------------------------------------
  updSTimes(){
    if(this.twtStreamTimes&&this.twtStreamTimes.stream===this.twtSPStatus.channel&&this.twtStreamTimes.ss&&this.twtStreamTimes.ws){
      this.twtStreamTimes.times=this.evServ.streamRTWT(this.twtStreamTimes.ss,this.twtStreamTimes.ws);
      this.pDOM();
    };
  }
//------------------------------------------------
  async updPlyrStatsLoop(){
    this.sSINTCount++;
    if(this.twtStreamPlyr&&this.twtSPStatus.init&&this.twtSPStatus.playing){
      const{r,d}=await this.twtStreamPlayer('getStats','noCons');
      if(r&&!_.isEqual(d,this.twtSPStatus.stats)){this.twtSPStatus.stats=d;this.pDOM()}
    };
  }
//------------------------------------------------
  async twtStreamPlayer(action:string,data:any):Promise<{r:boolean,d?:any}>{
    let isDCons:string='null/nodata';if(data){isDCons=String(data)};
    if(data!=='noCons'){this.cCons('twtStreamPlyr','('+action+','+isDCons+')')};
    let tspRes:{r:boolean,d?:any}={r:false,d:null};
    const plyrSB=(t:'ok'|'error'|'info',m:string)=>{this.twtSBar('show',{type:t,source:'player',msg:m});this.cCons('twtStreamPlyr',t.toUpperCase()+': '+m);this.pDOM()};
    const setBestFmt=async():Promise<boolean>=>{
      await this.twtStreamPlayer('getQualities',null);
      if(this.twtSPStatus.formats.length>0){
        const mSrcArr:TWTPlyrFormat[]=this.twtSPStatus.formats.filter(f=>f.group==='chunked');
        if(mSrcArr.length>0){
          if(mSrcArr[0].height>=1080){await this.twtStreamPlayer('setQuality',mSrcArr[0].group)}
          else{let ordList:TWTPlyrFormat=_.orderBy(this.twtSPStatus.formats,['height'],['desc']);await this.twtStreamPlayer('setQuality',ordList[0].group)}
        };
        this.twtSPStatus.format=(await this.twtStreamPlayer('getQuality',null)).d;
      };
      return Promise.resolve(true);
    };
    if(action==='init'){
      if(this.twtSPStatus.init){plyrSB('info','Already initialized');tspRes.r=false}
      else{
        let twtPlyrOpts:any={width:288,height:162,channel:(data?data:'monstercat'),layout:'video',allowfullscreen:false,theme:'dark',autoplay:true,muted:false};
        this.twtSPStatus.channel=twtPlyrOpts.channel;
        this.twtSPStatus.title=this.twtLives.filter(l=>l.user_name.toLowerCase()===this.twtSPStatus.channel)[0].title;
        this.twtStreamPlyr=new Twitch.Embed('twtintplyr',twtPlyrOpts);
        this.twtSPStatus.init=true;
        this.twtStreamPlyr.addEventListener(Twitch.Player.READY,async(e:any)=>{
          await this.twtStreamPlayer('getQualities',null);await setBestFmt();await this.doW(0.1);
          await this.twtStreamPlayer('getQuality',null);await this.doW(0.1);
          await this.twtStreamPlayer('getChannel',null);await this.doW(0.1);
          await this.twtStreamPlayer('getStats',null);await this.doW(0.1);
          await this.twtStreamPlayer('getVolume',null);if(this.twtSPStatus.volume!==1){await this.twtStreamPlayer('setVolume',1);await this.doW(0.15)};
          await this.twtStreamPlayer('getMuted',null);
          await this.twtStreamPlayer('getPaused',null);if(this.twtSPStatus.paused){await this.twtStreamPlayer('play',null)};
          plyrSB('ok','Player Init & Ready!');
          this.pDOM();
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.ONLINE,(e:any)=>{plyrSB('ok','Stream Online ('+this.twtSPStatus.channel+')');this.pDOM()});
        this.twtStreamPlyr.addEventListener(Twitch.Player.PLAYING,async(e:any)=>{
          if(!this.twtSPStatus.playing){this.twtSPStatus.playing=true};
          if(this.twtSPStatus.paused){this.twtSPStatus.paused=false};
          await setBestFmt();
          if(this.twtSPStatus.volume<1){await this.twtStreamPlayer('setVolume',1);this.pDOM()};
          if(this.twtSPStatus.hidevideo||this.showStreamPlyr){this.showStreamPlyr=true;this.twtSPStatus.hidevideo=true;this.pDOM()};
          if(this.streamStatsINT===null){this.streamStatsINT=setInterval(()=>{this.updPlyrStatsLoop()},1000)};
          if(this.streamTimesINT===null||this.twtStreamTimes===null||(this.twtStreamTimes&&this.twtStreamTimes.stream!==this.twtSPStatus.channel)){
            if(this.streamTimesINT!==null){clearInterval(this.streamTimesINT);this.streamTimesINT=null;this.pDOM()};
            if(this.twtStreamTimes!==null){this.twtStreamTimes=null;this.pDOM()};
            let sI:number=this.twtLives.findIndex(l=>l.user_login.toLowerCase()===this.twtSPStatus.channel.toLowerCase());
            if(sI!==-1){
              const sS:Date=this.evServ.pISO(this.twtLives[sI].started_at);
              const wS:Date=new Date();
              const timesRes:TWTTimes=this.evServ.streamRTWT(sS,wS);
              this.twtStreamTimes={stream:this.twtSPStatus.channel,ss:sS,ws:wS,times:timesRes};
              this.streamTimesINT=setInterval(()=>{this.updSTimes()},1000)
              this.pDOM();
            }else{console.log('channel not found in Lives?')};
          };
          if(this.twtSPStatus.channel===''){await this.twtStreamPlayer('getChannel',null)};
          if(this.twtSPStatus.title===''){this.twtSPStatus.title=this.twtLives.filter(l=>l.user_name.toLowerCase()===this.twtSPStatus.channel)[0].title};
          this.twtChangeStream={nowStream:'',nextStream:'',reason:'',data:{int:null,time:15},inprog:false};
          plyrSB('ok','Stream Playing ('+this.twtSPStatus.channel+')');
          this.pDOM();
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.PLAYBACK_BLOCKED,(e:any)=>{
          this.resetPlyr();
          plyrSB('error','Stream Blocked ('+this.twtSPStatus.channel+')');
          this.pDOM();
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.PLAY,(e:any)=>{
          if(this.twtSPStatus.paused){
            this.twtSPStatus.paused=false;
            plyrSB('info','Stream Resuming ('+this.twtSPStatus.channel+')');
            this.pDOM();
          };
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.PAUSE,(e:any)=>{
          if(!this.twtSPStatus.paused){this.twtSPStatus.paused=true};
          if(this.twtSPStatus.playing){this.twtSPStatus.playing=false};
          plyrSB('info','Stream Paused ('+this.twtSPStatus.channel+')');
          this.pDOM();
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.ENDED,(e:any)=>{
          if(this.twtSPStatus.channel!==''&&!this.twtChangeStream.inprog){this.doChangeStream('dead',this.twtSPStatus.channel)}
          else{this.resetPlyr()};
          plyrSB('error','Stream Ended ('+this.twtSPStatus.channel+')');
          this.pDOM();
        });
        this.twtStreamPlyr.addEventListener(Twitch.Player.OFFLINE,(e:any)=>{
          if(this.twtSPStatus.channel!==''&&!this.twtChangeStream.inprog){this.doChangeStream('dead',this.twtSPStatus.channel)}
          else{this.resetPlyr()};
          plyrSB('error','Stream Offline ('+this.twtSPStatus.channel+')');
          this.pDOM()
        });
        tspRes.r=true;
        this.pDOM();
      };
    }else{
      if(this.twtStreamPlyr&&this.twtSPStatus.init){
        switch(action){
          case 'play':this.twtStreamPlyr.play();tspRes.r=true;break;
          case 'pause':this.twtStreamPlyr.pause();tspRes.r=true;break;
          case 'setChannel':
            if(data!==null){
              this.twtStreamPlyr.setChannel(data);
              await this.doW(0.25);
              await this.twtStreamPlayer('getChannel',null);
              plyrSB('info','Set Channel: '+this.twtSPStatus.channel);
              tspRes.r=true;
            };
            break;
          case 'setQuality':
            if(data!==null&&data!==this.twtSPStatus.format){
              this.twtStreamPlyr.setQuality(data);
              await this.doW(0.25);
              await this.twtStreamPlayer('getQuality',null);
              plyrSB('info','Set Quality: '+this.twtSPStatus.formats.filter(f=>f.group===this.twtSPStatus.format)[0].name);
              tspRes.r=true;
            };
            break
          case 'setMuted':
            if(data!==null&&data!==this.twtSPStatus.muted){
              this.twtStreamPlyr.setMuted(data);
              await this.doW(0.25);
              await this.twtStreamPlayer('getMuted',null);
              if(this.twtSPStatus.muted){plyrSB('error','Stream Muted: '+this.twtSPStatus.channel)}
              else{plyrSB('info','Stream Unmuted: '+this.twtSPStatus.channel)};
              tspRes.r=true;
            };
            break;
          case 'setVolume':
            if(data!==null&&data!==this.twtSPStatus.volume){
              this.twtStreamPlyr.setVolume(data);
              await this.doW(0.25);
              await this.twtStreamPlayer('getVolume',null);
              tspRes.r=true;
            };
            break;
          //----------
          case 'getChannel':this.twtSPStatus.channel=this.twtStreamPlyr.getChannel();tspRes={r:true,d:this.twtSPStatus.channel};break;
          case 'getStats':this.twtSPStatus.stats=this.twtStreamPlyr.getPlaybackStats();tspRes={r:true,d:this.twtSPStatus.stats};break;
          case 'getQualities':
            let formatsArr:TWTPlyrFormat[]=this.twtStreamPlyr.getQualities();
            if(formatsArr.length>0){this.twtSPStatus.formats=formatsArr}else{this.twtSPStatus.formats=[]};
            this.pDOM();
            tspRes={r:true,d:this.twtSPStatus.formats};
            break;
          case 'getQuality':this.twtSPStatus.format=this.twtStreamPlyr.getQuality();tspRes={r:true,d:this.twtSPStatus.format};break;
          case 'getMuted':this.twtSPStatus.muted=this.twtStreamPlyr.getMuted();tspRes={r:true,d:this.twtSPStatus.muted};break;
          case 'getPaused':this.twtSPStatus.paused=this.twtStreamPlyr.isPaused();tspRes={r:true,d:this.twtSPStatus.paused};break;
          case 'getVolume':this.twtSPStatus.volume=this.twtStreamPlyr.getVolume();tspRes={r:true,d:this.twtSPStatus.volume};break;
          //-----------
          case 'toggleQualities':
            let qI:number=this.twtSPStatus.formats.findIndex(f=>f.group===this.twtSPStatus.format);
            if(qI!==-1){qI++;if(qI>(this.twtSPStatus.formats.length-1)){qI=0};this.twtStreamPlyr.setQuality(this.twtSPStatus.formats[qI].group);await this.doW(1);this.twtSPStatus.format=this.twtStreamPlyr.getQuality()};
            break;
          default:plyrSB('error','Unknown action: '+action);tspRes.r=false;break;
        };
        this.pDOM();
      }else{plyrSB('error','Not initialized');tspRes.r=false;this.pDOM()};
    };
    this.pDOM();
    return Promise.resolve(tspRes);
  }
//------------------------------------------------
  async twtStreamFn(action:string,data?:any){
    this.cCons('twtStreamFn','('+action+',data?)...');
    switch(action){
      case 'audio':
        this.twtSPStatus.hidevideo=true;
        ipcRenderer.send('toggleChildVidVis',['hide']);
        this.pDOM();
        this.twtSBar('show',{type:'info',source:'player',msg:'Audio Only'});
        break;
      case 'video':
        this.twtSPStatus.hidevideo=false;
        ipcRenderer.send('toggleChildVidVis',['show']);
        this.pDOM();
        this.twtSBar('show',{type:'info',source:'player',msg:'Video + Audio'});
        break;
      case 'togglemute':
        let newMute:boolean=this.twtSPStatus.muted;newMute?newMute=false:newMute=true;
        await this.twtStreamPlayer('setMuted',newMute);
        this.pDOM();
        break;
      case 'togglepaused':
        if(this.twtSPStatus.paused){await this.twtStreamPlayer('play',null);this.twtSPStatus.paused=false;this.pDOM()}
        else{await this.twtStreamPlayer('pause',null);this.twtSPStatus.paused=true;this.pDOM()};
        this.pDOM();
        break;
      case 'killstream':
        await this.twtStreamPlayer('setMuted',true);
        await this.twtStreamPlayer('pause',null);
        if(this.showStreamPlyr){this.showStreamPlyr=false};
        break;
      case 'togglewin':
        this.twtWinToggle==='list'?this.twtWinToggle='chat':this.twtWinToggle='list';
        this.pDOM();
        this.twtSBar('show',{type:'info',source:'ctrl',msg:'View Changed: '+this.capd(this.twtWinToggle)});
        break;
    };
    this.pDOM();
  }
//------------------------------------------------
  async mentionAction(action:string,mIndex:number,data?:any){
    this.cCons('mentionAction','('+action+','+String(mIndex)+')...');
    if(action==='dismiss'){
      this.twtChatMentions=this.twtChatMentions.filter(m=>m.tags.id!==data.tags.id);
      this.pDOM();
      await this.doW(0.25);
      if(this.twtChatMentions.length===0&&this.mentionsShowing){
        this.mentionsShowing=false;
        await ipcRenderer.invoke('twtChatMention',['clear']);
      };
      this.pDOM()
    }else if(action==='showReply'){
      let replyMent:any=this.twtChatMentions[mIndex];
      replyMent['type']=data.toUpperCase();
      this.mentionReply=replyMent;
      this.pDOM();
    }else if(action==='cancelReply'){
      const inputNE:HTMLInputElement=this.twtReplyInput.nativeElement as HTMLInputElement;
      inputNE.value='';
      this.mentionReply=null;
      this.pDOM();
    };
  };
//--------------------------------------------------
  async mentionReplyInputFn(action:string,event:any,value:string){
    const inputNE:HTMLInputElement=this.twtReplyInput.nativeElement as HTMLInputElement;
    switch(action){
      case 'kd':
        const eKey:any=event.key;
        if(eKey==='Enter'||eKey==='Escape'){
          event.preventDefault();
          if(event.defaultPrevented){
            if(eKey==='Escape'){if(inputNE.focus){if(inputNE.value.length>0){inputNE.value=''}else{inputNE.blur()}}}
            else if(eKey==='Enter'){
              let cmdStr:string=value.trim();
              if(inputNE.focus&&cmdStr.length>0){
                const mentId:string=this.mentionReply.tags.id;
                if(this.mentionReply.type==='WHISPER'){await this.processChatInput('/w '+this.mentionReply.tags['display-name']+' '+cmdStr)}
                else{await this.processChatInput('@'+this.mentionReply.tags['display-name']+' '+cmdStr)};
                inputNE.value='';
                this.mentionReply=null;
                this.pDOM();
                await this.doW(1);
                this.twtChatMentions=this.twtChatMentions.filter(m=>m.tags.id!==mentId);
                if(this.twtChatMentions.length===0&&this.mentionsShowing){this.mentionsShowing=false;this.pDOM()};
                this.pDOM();
              };
            };
          };
        };
        break;
      case 'f':break;
      case 'cls':inputNE.value='';break;
    };
  }
  niceTime(ts:any):string{const tUTS:number=Math.round(Number(ts)/1000),tDate:Date=this.evServ.dUT(tUTS),tStr:string=this.evServ.strFormat(tDate,'hh:mmaaa');return tStr};
//------------------------------------------------
  async isMeMention(mData:any):Promise<boolean>{
    if(!mData.hasOwnProperty('tags')||!mData.tags.hasOwnProperty('id')){return Promise.resolve(false)};
    if(mData.tags['display-name']!==this.twtUser.display_name){
      let txtArr:string[]=mData.parameters.split(' '),didMention:boolean=false;
      for(let ti=0;ti<txtArr.length;ti++){if(this.meStrArr.includes(txtArr[ti])){didMention=true}};
      const existI:number=this.twtChatMentions.findIndex(m=>m.tags.id===mData.tags.id);
      if(didMention&&existI===-1){
        if(this.twtChatMentions.length===0){this.twtChatMentions=[mData]}
        else{this.twtChatMentions.unshift(mData)};
        this.pDOM();
        await ipcRenderer.invoke('twtChatMention',['show']);
        return Promise.resolve(true);
      }else{return Promise.resolve(false)}
    }else{return Promise.resolve(false)}
  }
//------------------------------------------------
  async chatMentions(action:string){
    this.cCons('chatMentions','('+action+')...');
    if(action==='clear'){
      this.twtChatMentions=[];
      this.mentionReply=null;
      if(this.mentionsShowing){this.mentionsShowing=false};
      await ipcRenderer.invoke('twtChatMention',['clear']);
    }else{if(!this.mentionsShowing){this.mentionsShowing=true}};
    this.pDOM();
  }
//------------------------------------------------
  ngAfterViewInit():void{this.cCons('ngAfterViewInit','()...')};
//------------------------------------------------
  ngOnDestroy():void{this.cCons('ngOnDestroy','()...')};
//////////////////////////////////////////////////
  doServerMsg(msg:string){
    if(this.twtSvrTO!==null){clearTimeout(this.twtSvrTO)};
    this.twtSvrMsgs.push(msg);this.pDOM();
    this.twtSvrTO=setTimeout(async()=>{this.smOutAnim=true;this.pDOM();await this.doW(0.4);this.twtSvrMsgs=[];this.smOutAnim=false;this.pDOM();this.twtSvrTO=null},2000);
  }
//////////////////////////////////////////////////
  twtSBar(a:'show'|'hide',status?:TWTStatusBar){
    this.cCons('twtSBar','('+a+','+(status?status.type+'|'+status.source+'|'+status.msg:'null')+')...');
    if(this.twtStatusTO!==null){clearTimeout(this.twtStatusTO)};
    if(a==='show'){this.twtStatus=status;this.twtStatusTO=setTimeout(()=>{this.twtStatus={type:null,source:null,msg:null}},3500)}
    else{this.twtStatus={type:null,source:null,msg:null}};
    this.pDOM();
  }
//////////////////////////////////////////////////
  async twtClearChatData():Promise<boolean>{
    this.twtSvrMsgs=[];this.twtSvrTO=null;this.smOutAnim=false;this.twtChatMsgs=[];this.twtChatErr=0;this.twtChatRoom=null;this.twtChatRoomData=null;this.twtChatUsersChange=[];this.twtChatUsersIncDec='same';this.twtChatPausedMsgs=[];this.twtChatIsPaused=false;this.twtChatMentions=[];this.mentionsShowing=false;this.mentionReply=null;
    if(this.twtSvrTO!==null){clearTimeout(this.twtSvrTO)};
    if(this.twtChatUsersChangeINT!==null){clearInterval(this.twtChatUsersChangeINT);this.twtChatUsersChangeINT=null};
    await ipcRenderer.invoke('twtChatMention',['clear']);
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
  async twtChatConnection(action:string,channel?:string):Promise<boolean>{
    this.cCons('twtChatConnection','('+action+','+(channel?channel:'null')+')...');
    let chanOpt:string|null=null;if(channel){chanOpt=channel.toLowerCase();if(!channel.startsWith('#')){chanOpt='#'+channel.toLowerCase()}};
    if(action==='connect'){
      if(!this.twtChatConn){
        await this.twtClearChatData();
        const connRes:boolean=await ipcRenderer.invoke('initTwtChat',[chanOpt]);
        return Promise.resolve(connRes);
      }else{this.twtSBar('show',{type:'info',source:'chat',msg:'Ignored - Already Connected'})};
    }else{
      if(this.twtChatConn){
        this.didCloseChat=true;
        const discRes:boolean=await ipcRenderer.invoke('twtChatDisconnect');
        if(discRes){await this.twtClearChatData()};
        return Promise.resolve(discRes);
      }else{this.twtSBar('show',{type:'info',source:'chat',msg:'Ignored - Not Connected'})}
    }
  }
//-------------------------------------------------------------
  async twtScrollStep(){
    if(!this.tFrame){window.cancelAnimationFrame(this.tFrameId)}
    else{
      this.twtScrollCount++;
      if(this.twtScrollCount%3===0){
        const kiDiv=document.getElementById('twt-info-container');
        const kiWrap=document.getElementById('twt-info-wrap');
        if(kiWrap.offsetWidth<kiDiv.offsetWidth){this.twtScroll('stop')}
        else{
          if(this.twtMaxScroll===0){this.twtMaxScroll=kiWrap.offsetWidth-kiDiv.offsetWidth};
          let nowLeft:number=kiDiv.scrollLeft;
          if(((nowLeft+1)>this.twtMaxScroll)||((nowLeft-1)<0)){this.twtScrollDir==='up'?this.twtScrollDir='back':this.twtScrollDir='up'};
          let newLeft:number=0;
          if(this.twtScrollDir==='up'){newLeft=(nowLeft+1)}else{newLeft=(nowLeft-1)};
          kiDiv.scrollLeft=newLeft;
        };
      };
      this.tFrameId=window.requestAnimationFrame(()=>this.twtScrollStep());
    };
  }
//------------------------------------------------
  async twtScroll(action:string):Promise<boolean>{
    if(!this.twtInfoMD){
      if(action==='start'){
        if(!this.twtInfoIsScroll){
          if(this.twtScrollCount!==0){this.twtScrollCount=0};
          this.twtInfoIsScroll=true;
          if(!this.tFrame){this.tFrame=true};
          await this.doW(1);
          this.twtScrollStep();
          return Promise.resolve(true);
        };
      }else{
        if(this.twtInfoIsScroll){
          this.tFrame=false;
          this.twtInfoIsScroll=false;
          this.twtMaxScroll=0;
          this.twtScrollCount=0;
          return Promise.resolve(true);
        };
      };
    };
  }
  //------------------------------------------------
  async twtInfoHandler(e:any){
    if(this.twtInfoIsScroll){await this.twtScroll('stop')};
    this.twtInfoMD=true;
    this.twtInfoDiv=document.getElementById('twt-info-container');
    const mMove=(e:any)=>{const mx=e.clientX-this.twtInfoPos.x;this.twtInfoDiv.scrollLeft=this.twtInfoPos.left-mx};
    const mUp=(e:any)=>{this.twtInfoMD=false;document.removeEventListener('mousemove',mMove);document.removeEventListener('mouseup',mUp);this.twtInfoDiv.style.cursor='grab';this.twtInfoDiv.style.removeProperty('user-select')};
    this.twtInfoPos={left:this.twtInfoDiv.scrollLeft,top:this.twtInfoDiv.scrollTop,x:e.clientX,y:e.clientY};
    this.twtInfoDiv.style.cursor='grabbing';
    this.twtInfoDiv.style.userSelect='none'
    document.addEventListener('mousemove',mMove);
    document.addEventListener('mouseup',mUp);
  }
//////////////////////////////////////////////////
  async refreshLives(){
    this.cCons('refreshLives','()...');
    this.livesRefreshing=true;this.pDOM();
    this.twtLives=[];
    const gTLRes:any[]=await ipcRenderer.invoke('getTwtLives');
    if(gTLRes.length===0){this.twtLives=[]}
    else{let rawSubs:any[]=gTLRes;for(let si=0;si<rawSubs.length;si++){rawSubs[si].thumbnail_url=rawSubs[si].thumbnail_url.replace('{width}','16').replace('{height}','16')};this.twtLives=rawSubs};
    await this.doW(1);
    this.livesRefreshing=false;
    this.pDOM();
  }
//////////////////////////////////////////////////
  twtChatClearPause(action:string):Promise<boolean>{
    this.cCons('twtChatPause','('+action+')...');
    if(action==='clear'){this.twtChatMsgs=[];this.pDOM();return Promise.resolve(true)}
    else{
      if(this.twtChatIsPaused){
        let combMsgs:any[]=[];
        if(this.twtChatPausedMsgs.length>0){combMsgs=this.twtChatMsgs.concat(this.twtChatPausedMsgs)}else{combMsgs=this.twtChatMsgs};
        if(combMsgs.length>100){combMsgs=_.takeRight(combMsgs,50)};
        this.twtChatMsgs=combMsgs;
        this.twtChatIsPaused=false;
      }else{
        this.twtChatPausedMsgs=[];
        this.twtChatIsPaused=true;
      };
      this.pDOM();
      return Promise.resolve(true);
    }
  }
//////////////////////////////////////////////////
  async processChatInput(cmd:string):Promise<boolean>{
    this.cCons('processChatInput','('+cmd+')...');
    if(cmd.startsWith('/')){
      const c:string[]=cmd.split(' ');
      switch(c[0]){
        case '/whisper':case '/w':
          const wR:string=c[1],wM:string=c.splice(2).join(' ');
          if(this.twtChatConn&&this.twtAuth.token){
            await ipcRenderer.invoke('doChatCMD',['PRIVMSG #'+this.twtChatRoom+' :/w '+wR+' '+wM]);
            this.cCons('Chat','[WHISPER] Sent ('+this.twtAuth.username+' => '+wR+'): '+wM);
          }else{this.cCons('Chat','[WHISPER] !connected || !twitchToken')};
          break;
        case '/me':
          const mM:string=c.splice(1).join(' ');
          if(this.twtChatConn&&this.twtAuth.token){
            await ipcRenderer.invoke('doChatCMD',['PRIVMSG #'+this.twtChatRoom+' :/me '+mM]);
            this.cCons('Chat','[ME] Sent ('+this.twtAuth.username+' => #'+this.twtChatRoom+'): '+mM);
          }else{this.cCons('Chat','[ME] !connected || !twitchToken')};
          break;
        case '/kill':case '/stop':case '/quit':await this.twtChatConnection('disconnect');break;
        case '/start':case '/restart':case '/reset':
          let nowChan:any=null;if(this.twtChatConn&&this.twtChatRoom.length>0){nowChan=this.twtChatRoom};
          this.twtSBar('show',{type:'info',source:'chat',msg:(this.twtChatConn?'Res':'S')+'tarting Chat'+(nowChan?' ('+nowChan+')':'')});
          if(this.twtChatConn){await this.twtChatConnection('disconnect');await this.doW(1)};
          await this.twtChatConnection('connect',nowChan);
          break;
        case '/channel':
          if(c[1]){
            this.twtSBar('show',{type:'info',source:'chat',msg:(this.twtChatRoom?'Switch':'Join')+'ing Channel #'+c[1]});
            await this.joinPartChatRoom('join',c[1]);
            await this.doChangeStream('change',this.twtChatRoom,c[1]);
          };
          break;
        case '/ban':case '/unban':case '/clear':case '/color':case '/commercial':case '/delete':case '/disconnect':case '/emoteonly':case '/emoteonlyoff':case '/followers':case '/followersoff':case '/host':case '/unhost':case '/marker':case '/mod':case '/unmod':case '/mods':case '/r9kbeta':case '/r9kbetaoff':case '/raid':case '/unraid':case '/slow':case '/slowoff':case '/subscribers':case '/subscribersoff':case '/timeout':case '/untimeout':case '/vip':case '/unvip':case '/vips':
          if(this.twtChatConn){
            await ipcRenderer.invoke('doChatCMD',['PRIVMSG #'+this.twtChatRoom+' :'+cmd]);
            this.cCons('Chat','[CMD] Sent ('+this.twtAuth.username+' => #'+this.twtChatRoom+'): '+cmd);
          }else{
            this.twtSBar('show',{type:'error',source:'chat',msg:c[0]+' not sent - Disconnected'});
            this.cCons('Chat','[CMD] !connected')
          };
          break;
        default:
          this.cCons('INFO','Invalid Command: '+cmd);
          this.twtSBar('show',{type:'error',source:'chat',msg:'Unknown Command ('+c[0]+')'});
          break;
      };
    }else{
      if(this.twtChatConn&&this.twtChatRoom!==null){
        const sendCMDRes:boolean=await ipcRenderer.invoke('doChatCMD',['PRIVMSG #'+this.twtChatRoom+' :'+cmd]);
        if(sendCMDRes){
          let myMData:any={isMe:true,parameters:cmd,tags:{'display-name':this.twtUser.display_name}};
          if(!this.twtChatIsPaused&&this.twtChatMsgs.length>100){this.twtChatMsgs=_.takeRight(this.twtChatMsgs,50)};
          this.twtChatIsPaused?this.twtChatPausedMsgs.unshift(myMData):this.twtChatMsgs.unshift(myMData);
        }
      };
    };
    return Promise.resolve(true);
  }
//////////////////////////////////////////////////
  async twtChatInputFn(action:string,event:any,value:string){
    const inputNE:HTMLInputElement=this.twtChatInput.nativeElement as HTMLInputElement;
    const doFocus=():Promise<boolean>=>{return new Promise(async(resolve)=>{const iFLoop=setInterval(()=>{inputNE.focus();if(inputNE.focus){clearInterval(iFLoop);resolve(true)}},100)})};
    switch(action){
      case 'refUser':
        let pasteStr:string='';inputNE.value.trim().length===0?pasteStr='@'+value+' ':pasteStr=inputNE.value.trim()+' @'+value+' ';
        await doFocus();
        inputNE.value=pasteStr;
        await this.doW(0.1);
        inputNE.setSelectionRange(inputNE.value.length,inputNE.value.length);
        break;
      case 'kd':
        const eKey:any=event.key;
        if(eKey==='Enter'||eKey==='Escape'){
          event.preventDefault();
          if(event.defaultPrevented){
            if(eKey==='Escape'){if(inputNE.focus){if(inputNE.value.length>0){inputNE.value=''}else{inputNE.blur()}}}
            else{
              let cmdStr:string=value.trim();
              if(inputNE.focus&&cmdStr.length>0){
                this.processChatInput(cmdStr);
                inputNE.value='';
                if(cmdStr.includes('@')){
                  const atStrUser:string=cmdStr.split('@')[1].split(' ')[0];
                  const pendMentI:number=this.twtChatMentions.findIndex(m=>m.tags['display-name']===atStrUser);
                  if(pendMentI!==-1){this.twtChatMentions=this.twtChatMentions.filter(m=>m.tags['display-name']===atStrUser)};
                };
              };
            };
          };
        };
        break;
      case 'f':break;
      case 'cls':inputNE.value='';break;
    };
  };
//////////////////////////////////////////////////
  async killChildWindow(){
    if(this.twtSPStatus.init){
      await this.twtStreamPlayer('setMuted',true);
      await this.twtStreamPlayer('pause',null);
      if(this.showStreamPlyr){this.showStreamPlyr=false};
    };
    if(this.twtChatConn){await ipcRenderer.invoke('twtChatDisconnect')};
    ipcRenderer.removeAllListeners('twtMsgData');
    ipcRenderer.send('killChildWindow');
  };
//////////////////////////////////////////////////
  async showChildWindow(){ipcRenderer.send('showChildWindow')};
//////////////////////////////////////////////////
async exists(path:string):Promise<boolean>{try{await access(path);return Promise.resolve(true)}catch{return Promise.resolve(false)}};
lsIsChat(username:string):boolean{return (this.twtChatConn&&this.twtChatRoom===username.toLowerCase())};
//------------------------------------------------
async cCons(fn:string,msg:any){if(typeof msg==='string'){console.log('[child|'+fn+'] - '+msg)}else{console.log('[child|'+fn+']: ');console.log(msg)}};
//------------------------------------------------
availCons(fn:string,msg:any){if(typeof msg==='string'){console.log('[home|VIA-MAIN|'+fn+'] - '+msg)}else{console.log('[home|VIA-MAIN|'+fn+'|Object]...');console.log(msg)}};
//------------------------------------------------
pDOM(skip?:string){this.changeDet.detectChanges()};
//------------------------------------------------
doW(s:number):Promise<boolean>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
//////////////////////////////////////////////////
sanitizeURL(url:string):SafeResourceUrl{return (this.sanitizer.bypassSecurityTrustResourceUrl(url))};
capd(s:string):string{return s.charAt(0).toUpperCase()+s.slice(1)};
//////////////////////////////////////////////////
}
