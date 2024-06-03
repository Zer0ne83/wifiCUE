import { Injectable } from '@angular/core';
const path=require('path');
import * as ytdl from 'ytdl-core';
import { access,stat,readFile,writeFile,mkdir,readdir,rename, unlink} from 'fs/promises';
import * as ytpl from 'ytpl';
import * as ytsr from 'ytsr';
import { EventsService } from '../events.service';
import { HomeScrapeDLInfo, HomeScrapeDLType, HomeScrapeSnippetSubMatch,WCYTDLCapRowObj,WCYTDLDLBatch,WCYTDLDLInfoRes, WCYTDLFinItem, WCYTDLGVHistResult, WCYTDLGetCapResult, WCYTDLGetPlResult, WCYTDLGetSrResult, WCYTDLMDKodiPLDay, WCYTDLMDPLItem, WCYTDLMDSub, WCYTDLSRItem, WCYTDLSRMatch, WCYTDLSRMatchTxt, WCYTDLSRTSLine, WCYTDLTRItem } from '../../appTypes';
import {execFile, execSync, spawn} from 'child_process';
import axios, {AxiosError,AxiosInstance,InternalAxiosRequestConfig,AxiosResponse} from 'axios';
import {createPool} from 'mysql2/promise';
import * as ffprobe from 'ffprobe';
import * as _ from 'lodash';
const OAuth2 = google.auth.OAuth2;
import { google, youtube_v3, Auth, Common } from 'googleapis';
import { ipcRenderer } from 'electron';
import { createWriteStream } from 'fs';
import * as http from 'http';
////////////////////////////////////////////////////////////////
@Injectable({providedIn:'root'})
////////////////////////////////////////////////////////////////
export class YTDLService {
  //------------------------------
  mpegExePath:string='C:\\ffmpeg\\ffmpeg\\ffmpeg.exe';
  probeExePath:string='C:\\ffmpeg\\ffmpeg\\ffprobe.exe'
  playExePath:string='C:\\ffmpeg\\ffmpeg\\ffplay.exe'
  ytdlExePath:string='C:\\ytdl\\ytdl\\ytdl.exe';
  //------------------------------
  wcYTDLDirPath:string='C:\\myYTDLData';
  wcYTDLInfoDir:string='C:\\myYTDLData\\info';
  wcYTDLCapsDir:string='C:\\myYTDLData\\caps';
  wcYTDLDLsDir:string='C:\\myYTDLData\\dls';
  wcYTDLMDKodiPLDir:string='C:\\myYTDLData\\mydaily\\kodipls';
  //------------------------------
  ytIsReady:boolean=false;
  ytServ:any=null;
  //------------------------------
  srLimit:number=250;
  //------------------------------
  matchMax:number=50;
  resolveMax:number=50;
  //------------------------------
  msqlIsRunning:boolean=false;
  msqlPool:any;
  msqlConnThreadIds:any[]=[];
  //------------------------------
  ytapiSecretPath:string='C:\\myYTDLData\\mydaily\\creds\\ytapiSecret.json';
  ytapiSecret:any={installed:{client_id:'25230909778-rg6phfrai3p86fglq4i9tgfj9dlbddhg.apps.googleusercontent.com',project_id:'comp0z1te',auth_uri:'https://accounts.google.com/o/oauth2/auth',token_uri:'https://oauth2.googleapis.com/token',auth_provider_x509_cert_url:'https://www.googleapis.com/oauth2/v1/certs',client_secret:'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',redirect_uris:['http://localhost']}};
  ytapiTokenPath:string='C:\\myYTDLData\\mydaily\\creds\\ytapiToken.json';
  ytapiToken:any|null=null;
  ytapiScopes:string[]=['https://www.googleapis.com/auth/youtube.readonly'];
  ytapiIsInit:boolean=false;
  ytapiClient:Auth.OAuth2Client|null=null;
  ytapiPrompt:'none'|'select_account'|'consent'|null=null;
////////////////////////////////////////////////////////////////
  constructor(
    private evServ:EventsService
  ){if(!this.ytIsReady||this.ytServ===null){this.ytIsReady=true}}
////////////////////////////////////////////////////////////////
// HELPER FNS
////////////////////////////////////////////////////////////////
  doW(s:number):Promise<boolean>{return new Promise(async(resolve)=>{setTimeout(async()=>{resolve(true)},(s*1000))})};
  dCon(t:string,f:string,m?:string){
    let tStr:string=this.evServ.strFormat(new Date(),'HH:mm:ss.SS'),
    fC:string='',
    b:string=tStr+' - [YTDLService|'+f+'] (Log): ',
    ts:any={fn:'(👟 RUN)',info:'(📋 INFO)',ok:'(✔️ SUCCESS)',nil:'(🤷 NIL)',err:'(❌ ERROR)'},
    cM:string=b+ts[t];
    if(!m){t==='fn'?fC=cM+='...':fC=cM}else{fC=cM+=': '+m};
    console.log(fC)
  };
  vStr2Id(v:string):string{if(typeof v==='string'&&v.length===11&&(ytdl.validateID(v))){return v}else if(typeof v==='string'&&v.startsWith('http')&&ytdl.validateURL(v)){return ytdl.getURLVideoID(v)}else{this.dCon('err','vStr2Id','Invalid YT ID/URl - Unfixable - Aborted')}};
  vStr2URL(v:string):string{if(typeof v==='string'&&v.length===11&&(ytdl.validateID(v))){return 'https://www.youtube.com/watch?v='+v}else if(typeof v==='string'&&v.startsWith('http')&&ytdl.validateURL(v)){return v}else{this.dCon('err','vStr2URL','Invalid YT ID/URl - Unfixable - Aborted')}};
  async statSize(path:string):Promise<any>{try{const sRes:any=await stat(path);return Promise.resolve({r:true,d:sRes.size})}catch(e){console.log(e);return Promise.resolve({r:false,d:0})}};
  async exists(path:string):Promise<boolean>{try{await access(path);return Promise.resolve(true)}catch{return Promise.resolve(false)}};
  async isJSON(data:any):Promise<boolean>{if(typeof data!=='string'){return Promise.resolve(false)};try{const result=JSON.parse(data);const type=Object.prototype.toString.call(result);return Promise.resolve(type==='[object Object]'||type==='[object Array]');}catch(err){return Promise.resolve(false)}};
  async probeInfo(filePath:string):Promise<ffprobe.FFProbeStream|false>{
    if(this.probeExePath){
      try{const ffPRes:ffprobe.FFProbeResult=await ffprobe(filePath,{path:this.probeExePath});if(ffPRes&&ffPRes.hasOwnProperty('streams')&&ffPRes.streams&&ffPRes.streams.length>0){return Promise.resolve(ffPRes.streams[0])}else{this.dCon('err','probeInfo','ERROR: Probe Result NULL or streams.length === 0');return Promise.resolve(false)}}
      catch(e){this.dCon('err','probeInfo','ERROR: '+e);return Promise.resolve(null)}
    }else{this.dCon('err','probeInfo','ERROR: probeExePath===null');return Promise.resolve(false)}
  }
  cvtBytes=(bs:number):string=>{
    const sizes:string[]=['Bytes','KB','MB','GB','TB'];
    if(bs===0){return 'N/A'};
    const i:number=(Math.floor(Math.log(bs)/Math.log(1024)));
    if(i===0){return bs+' '+sizes[i]};
    return (bs/Math.pow(1024,i)).toFixed(1)+sizes[i]
  };
//--------------------------------------------------------------
  async testYTAPI():Promise<boolean>{
    this.dCon('fn','testYTAPI','()...');
    const theTest=async():Promise<boolean>=>{
      const yt=google.youtube('v3');google.options({auth:this.ytapiClient});let catsListParams:youtube_v3.Params$Resource$Videocategories$List={part:['snippet'],regionCode:'US'};
      try{await yt.videoCategories.list(catsListParams);return Promise.resolve(true)}
      catch(e){return Promise.resolve(false)};
    };
    if(this.ytapiClient&&this.ytapiIsInit){
      const testRes:boolean=await theTest();
      if(testRes){return Promise.resolve(true)}
      else{return Promise.resolve(false)};
    }else{return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  newTokenListener(){
    this.dCon('fn','newTokenListener','()...');
    const tempSVR:http.Server=http.createServer(async(req,res)=>{
      if(req.url.toString().startsWith('/?code=')){
        tempSVR.close();
        const newCode:string=req.url.split('?code=')[1].split('&')[0];
        res.writeHead(200);res.end();await this.doW(0.25);
        this.dCon('fn','newTokenListener','GOT NEW CODE: '+newCode);
        this.evServ.publish('ytapiInputCode',newCode);
      }
    }).listen(80);
  }
//--------------------------------------------------------------
  async initYTAPIAuth():Promise<boolean>{
    this.dCon('fn','initYTAPIAuth','()...');
    const readToken=async():Promise<{r:boolean,d:any}>=>{try{const getTokenRes:string=await readFile(this.ytapiTokenPath,{encoding:'utf-8'});if(getTokenRes&&(await this.isJSON(getTokenRes))){const gTObj:any=JSON.parse(getTokenRes);return Promise.resolve({r:true,d:gTObj})}else{return Promise.resolve({r:false,d:null})}}catch(e){console.log(e);return Promise.resolve({r:false,d:null})}};
    const writeToken=async(tokenObj:Auth.Credentials):Promise<boolean>=>{try{await writeFile(this.ytapiTokenPath,JSON.stringify(tokenObj));console.log('New Token Object Written to File');console.log(JSON.stringify(tokenObj));return Promise.resolve(true)}catch(e){console.log(e);return Promise.resolve(false)}};
    const newToken=async():Promise<Auth.OAuth2Client|false>=>{
      this.dCon('fn','newToken','()...');
      return new Promise(async(resolve)=>{
        let baseAUrl:any={access_type:'offline',scope:this.ytapiScopes};
        if(this.ytapiPrompt!=null&&typeof this.ytapiPrompt==='string'&&this.ytapiPrompt.trim().length>0){baseAUrl['prompt']=this.ytapiPrompt};
        let authUrl:string=this.ytapiClient.generateAuthUrl({access_type:'offline',scope:this.ytapiScopes});
        this.newTokenListener();
        this.evServ.subscribe('ytapiInputCode',async(code:string)=>{
          console.log('evListen Received: '+code);
          this.ytapiClient.getToken(code,async(err,token)=>{
            if(err){this.dCon('err','initYTAPIAuth|newToken','ERROR: Failed to Retrieve NEW TOKEN');resolve(false)};
            this.ytapiClient.credentials=token;
            await writeToken(token);
            this.dCon('ok','initYTAPIAuth|newToken','SUCCESS: Retrieved NEW TOKEN');
            resolve(this.ytapiClient);
          });
        });
        this.evServ.publish('ytapiExtWebURL',authUrl);
      });
    };
    //-----------
    let cSecret:string=this.ytapiSecret.installed.client_secret;
    let cId:string=this.ytapiSecret.installed.client_id;
    let rUrl:string=this.ytapiSecret.installed.redirect_uris[0];
    this.ytapiClient=new OAuth2(cId,cSecret,rUrl);
    const readTRes:{r:boolean,d:any}=await readToken();
    if(!readTRes.r||this.ytapiPrompt!==null){
      this.dCon('err','initYTAPIAuth','Read Saved Token File Failed [OR] ytapiPrompt!==null');
      const ntRes:Auth.OAuth2Client|false=await newToken();
      if(ntRes!==false){
        this.ytapiIsInit=true;
        if(this.ytapiPrompt!==null){this.ytapiPrompt=null};
        this.dCon('ok','initYTAPIAuth','SUCCESS - via NEW TOKEN');
        return Promise.resolve(true);
      }else{this.dCon('err','initYTAPIAuth','Error: Failed to Get NEW TOKEN - Aborting');return Promise.resolve(false)};
    }else{
      this.ytapiClient.credentials=readTRes.d;
      this.ytapiIsInit=true;
      const doTestRes:boolean=await this.testYTAPI();
      if(!doTestRes){
        await unlink(this.ytapiTokenPath);
        const newTokenRes:boolean=await this.initYTAPIAuth();
        if(newTokenRes){return Promise.resolve(true)}
        else{return Promise.resolve(false)};
      };
      this.dCon('ok','initYTAPIAuth','SUCCESS - via SAVED TOKEN');
      return Promise.resolve(true);
    }
  }
//--------------------------------------------------------------
  async ytapiCheckAuth():Promise<boolean>{
    this.dCon('fn','ytapiCheckAuth','()...');
    const authRes:boolean=await this.initYTAPIAuth();
    return Promise.resolve(authRes);
  }
//--------------------------------------------------------------
  async ytapiGetMySubs():Promise<youtube_v3.Schema$Subscription[]|false>{
    this.dCon('fn','ytapiGetMySubs','()...');
    this.evServ.publish('getSubsProg',0);
    let ttlSubs:number=0,addBatches:number=0,nT:string|null=null,foundSubs:youtube_v3.Schema$Subscription[]=[],fetchCount:number=0;
    const getSubBatch=async(nextToken?:string):Promise<youtube_v3.Schema$SubscriptionListResponse|false>=>{
      fetchCount++;
      const yt=google.youtube('v3');
      google.options({auth:this.ytapiClient});
      let listParams:youtube_v3.Params$Resource$Subscriptions$List={part:['id','snippet','contentDetails'],mine:true,maxResults:50,order:'unread'};
      if(nextToken){listParams['pageToken']=nextToken};
      try{
        const{status,data}=await yt.subscriptions.list(listParams);
        if(fetchCount>1){this.evServ.publish('getSubsProg',(fetchCount/addBatches))};
        if(status===200&&data&&!_.isEmpty(data)){return Promise.resolve(data)}
        else{return Promise.resolve(false)}
      }catch(e){this.evServ.publish('getSubsProg',1);console.log(e);return Promise.resolve(false)}
    };
    //------------
    if(!this.ytapiIsInit||!this.ytapiClient){await this.ytapiCheckAuth()};
    if(this.ytapiIsInit&&this.ytapiClient){
      const firstBatchRes:youtube_v3.Schema$SubscriptionListResponse|false=await getSubBatch(nT);
      if(firstBatchRes!==false){
        if(firstBatchRes.hasOwnProperty('pageInfo')&&!_.isEmpty(firstBatchRes.pageInfo)&&firstBatchRes.pageInfo.hasOwnProperty('totalResults')&&firstBatchRes.pageInfo.totalResults>0){ttlSubs=firstBatchRes.pageInfo.totalResults}else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
        if(firstBatchRes.hasOwnProperty('items')&&firstBatchRes.items&&firstBatchRes.items.length>0){foundSubs=firstBatchRes.items}else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
        addBatches=Math.ceil((ttlSubs-foundSubs.length)/50);
        this.evServ.publish('getSubsProg',(fetchCount/addBatches));
        if(addBatches>0){
          if(firstBatchRes.hasOwnProperty('nextPageToken')&&firstBatchRes.nextPageToken&&firstBatchRes.nextPageToken.trim().length>0){nT=firstBatchRes.nextPageToken}
          else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
          //------
          for(let bi=0;bi<addBatches;bi++){
            const addBatchRes:youtube_v3.Schema$SubscriptionListResponse|false=await getSubBatch(nT);
            if(addBatchRes!==false){
              if(addBatchRes.hasOwnProperty('items')&&addBatchRes.items&&addBatchRes.items.length>0){foundSubs=foundSubs.concat(addBatchRes.items)};
              if(addBatchRes.hasOwnProperty('nextPageToken')&&addBatchRes.nextPageToken&&addBatchRes.nextPageToken.trim().length>0){nT=addBatchRes.nextPageToken}
              else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
            }else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
          };
          //------
        }else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
      }else{this.evServ.publish('getSubsProg',1);return Promise.resolve(foundSubs)};
    }else{console.log('ERROR: Auth Failed');return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async ytapiGetSingleVid(vTitle:string):Promise<youtube_v3.Schema$SearchResult|false>{
    this.dCon('fn','ytapiGetSingleVid',vTitle);
    if(this.ytapiIsInit&&this.ytapiClient){
      const yt=google.youtube('v3');
      google.options({auth:this.ytapiClient});
      let seachListParams:youtube_v3.Params$Resource$Search$List={part:['id','snippet'],forMine:false,maxResults:1,order:'relevance',q:vTitle,safeSearch:'none',type:['video']};
      try{
        const{status,data}=await yt.search.list(seachListParams);
        if(status===200&&data&&!_.isEmpty(data)&&data.hasOwnProperty('items')&&data.items&&data.items.length>0){return Promise.resolve(data.items[0])}
        else{return Promise.resolve(false)}
      }catch(e){console.log(e);return Promise.resolve(false)};
    }else{console.log('ERROR: Auth Failed');return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async getSR(searchStr:string):Promise<WCYTDLGetSrResult|false>{
    this.dCon('fn','getSR',searchStr);
    let qStrOrURL:string=searchStr;
    const getFilters=async():Promise<boolean>=>{
      try{
        const unFiltered:Map<string,Map<string,ytsr.Filter>>=await ytsr.getFilters(searchStr);
        if(unFiltered&&!_.isEmpty(unFiltered)){
          const vidFilter:ytsr.Filter=unFiltered.get('Type').get('Video');
          if(vidFilter&&vidFilter.url!==null){
            qStrOrURL=vidFilter.url;
            const vidFiltered:Map<string,Map<string,ytsr.Filter>>=await ytsr.getFilters(vidFilter.url);
            if(vidFiltered&&!_.isEmpty(vidFiltered)){
              const ccFilter:ytsr.Filter=vidFiltered.get('Features').get('Subtitles/CC');
              if(ccFilter&&ccFilter.url!==null){qStrOrURL=ccFilter.url}
            };
          };
        };
        return Promise.resolve(true);
      }catch(e){console.log(e);return Promise.resolve(false)}
    };
    await getFilters();
    try{
      const srReq=await ytsr(qStrOrURL,{limit:200});
      if(srReq&&srReq.items&&srReq.items.length>0){
        this.dCon('ok','getSR','str: '+(srReq.correctedQuery!==searchStr?srReq.correctedQuery:searchStr)+' | count: '+srReq.items.length);
        return Promise.resolve({str:(srReq.correctedQuery!==searchStr?srReq.correctedQuery:searchStr),items:srReq.items});
      }else{return Promise.resolve(false)};
    }catch(e){
      this.dCon('fn','getSRStatus','type:error,retry:true,limit:100');
      await this.doW(1);
      try{
        const rt1srReq:ytsr.Result=await ytsr(qStrOrURL,{limit:100});
        if(rt1srReq&&rt1srReq.items&&rt1srReq.items.length>0){
          this.dCon('ok','getSR','str: '+(rt1srReq.correctedQuery!==searchStr?rt1srReq.correctedQuery:searchStr)+' | count: '+rt1srReq.items.length);
          return Promise.resolve({str:(rt1srReq.correctedQuery!==searchStr?rt1srReq.correctedQuery:searchStr),items:rt1srReq.items});
        }else{return Promise.resolve(false)};
      }catch(e){
        this.dCon('fn','getSRStatus','type:error,retry:true,limit:50');
        await this.doW(1);
        try{
          const rt2srReq:ytsr.Result=await ytsr(qStrOrURL,{limit:50});
          if(rt2srReq&&rt2srReq.items&&rt2srReq.items.length>0){
            this.dCon('ok','getSR','str: '+(rt2srReq.correctedQuery!==searchStr?rt2srReq.correctedQuery:searchStr)+' | count: '+rt2srReq.items.length);
            return Promise.resolve({str:(rt2srReq.correctedQuery!==searchStr?rt2srReq.correctedQuery:searchStr),items:rt2srReq.items});
          }else{return Promise.resolve(false)};
        }catch(e){
          this.dCon('fn','getSRStatus','type:error,retry:false,limit:50');
          return Promise.resolve(false)
        };
      };
    };
  }
//--------------------------------------------------------------
  async getUploadPLData(todayPLObj:WCYTDLMDKodiPLDay,mySubs:WCYTDLMDSub[]):Promise<{updPL:WCYTDLMDKodiPLDay,didChange:boolean}>{
    let runST:Date=new Date();
    this.dCon('fn','getUploadPLData','(todayPLObj,mySubs)...');
    const getPLBatch=async(ulPLId:string):Promise<youtube_v3.Schema$PlaylistItemListResponse|false>=>{
      const yt=google.youtube('v3');
      google.options({auth:this.ytapiClient});
      let plParams:youtube_v3.Params$Resource$Playlistitems$List={part:['id','snippet','contentDetails','status'],playlistId:ulPLId};
      try{const{status,data}=await yt.playlistItems.list(plParams);if(status===200&&data&&!_.isEmpty(data)){return Promise.resolve(data)}else{return Promise.resolve(false)}}catch(e){console.log(e);return Promise.resolve(false)}
    };
    //------------
    if(!this.ytapiIsInit||!this.ytapiClient){await this.ytapiCheckAuth()};
    if(this.ytapiIsInit&&this.ytapiClient){
      for(let si=0;si<mySubs.length;si++){
        const uplURL:string='UU'+mySubs[si].sub.snippet.resourceId.channelId.substring(2,mySubs[si].sub.snippet.resourceId.channelId.length);
        const ulPLRes:youtube_v3.Schema$PlaylistItemListResponse|false=await getPLBatch(uplURL);
        if(ulPLRes!==false&&ulPLRes.items&&ulPLRes.items.length>0){
          const plvItems:youtube_v3.Schema$PlaylistItem[]=ulPLRes.items;
          for(let plvi=0;plvi<plvItems.length;plvi++){
            const plVO:youtube_v3.Schema$PlaylistItem=plvItems[plvi];
            const pubDate:Date=new Date(plVO.contentDetails.videoPublishedAt);
            const pubStr:string=this.evServ.strFormat(pubDate,'dd/MM/yy');
            if(pubStr===todayPLObj.date){
              const existVIndex:number=todayPLObj.all.findIndex((allVO:WCYTDLMDPLItem)=>allVO.vId===plVO.snippet.resourceId.videoId);
              //-----------
              if(existVIndex===-1){
                const nowD:Date=new Date();
                const baseDayPLDirPath:string=path.join(this.wcYTDLMDKodiPLDir,todayPLObj.date.replace(/\//g,''));
                if(!(await this.exists(baseDayPLDirPath))){try{await mkdir(baseDayPLDirPath,{recursive:true})}catch(e){this.dCon('err','getUploadPLData','!MK PL Dir')}};
                let newPLVItem:WCYTDLMDPLItem={plDate:todayPLObj.date,plCats:[],cId:plVO.snippet.channelId||plVO.snippet.videoOwnerChannelId||plVO.snippet.resourceId.channelId,cTitle:plVO.snippet.channelTitle||plVO.snippet.videoOwnerChannelTitle,vId:plVO.snippet.resourceId.videoId||plVO.contentDetails.videoId,vTitle:plVO.snippet.title,dur:0,published:nowD,added:nowD,vPath:'',dlDone:false,expires:0};
                if(mySubs[si].isSleep){newPLVItem.plCats.push('sleep')};
                if(mySubs[si].isStar){newPLVItem.plCats.push('star')};
                if(!mySubs[si].isSleep&&!mySubs[si].isStar){newPLVItem.plCats.push('ors')};
                const vPubStr:string=plVO.snippet.publishedAt||plVO.contentDetails.videoPublishedAt||nowD.toDateString();
                newPLVItem.published=new Date(vPubStr);
                if(newPLVItem.plCats.includes('ors')){
                  const gStreamURLRes:{url:string,expires:number}|false=await this.getPLStreamURL(newPLVItem.vId);
                  if(gStreamURLRes!==false){newPLVItem.vPath=gStreamURLRes.url;newPLVItem.expires=gStreamURLRes.expires}
                  else{newPLVItem.vPath='null'};
                }else{newPLVItem.vPath=path.join(baseDayPLDirPath,'video_'+newPLVItem.vId+'.mp4')};
                newPLVItem.dur=await this.cmdGetDur(newPLVItem.vId);
                todayPLObj.all.unshift(newPLVItem);
                if(mySubs[si].isSleep){todayPLObj.sleep.length===0?todayPLObj.sleep.push(newPLVItem):todayPLObj.sleep.unshift(newPLVItem)};
                if(mySubs[si].isStar){todayPLObj.star.length===0?todayPLObj.star.push(newPLVItem):todayPLObj.star.unshift(newPLVItem)};
                if(!mySubs[si].isSleep&&!mySubs[si].isStar){todayPLObj.ors.length===0?todayPLObj.ors.push(newPLVItem):todayPLObj.ors.unshift(newPLVItem)};
              //------------
              }else{
                if(todayPLObj.all[existVIndex].dur===0){
                  const cmdDurRes:number=await this.cmdGetDur(todayPLObj.all[existVIndex].vId);
                  if(cmdDurRes!==0){
                    todayPLObj.all[existVIndex].dur=cmdDurRes;
                    for(let cci=0;cci<todayPLObj.all[existVIndex].plCats.length;cci++){
                      const catVIndex:number=todayPLObj[todayPLObj.all[existVIndex].plCats[cci]].findIndex(cvo=>cvo.vId===todayPLObj.all[existVIndex].vId);
                      if(catVIndex!==-1){todayPLObj[todayPLObj.all[existVIndex].plCats[cci]][catVIndex]=todayPLObj.all[existVIndex]};
                    }
                  }
                };
                const sSleep:boolean=mySubs[si].isSleep,sStar:boolean=mySubs[si].isStar;
                if(sSleep){if(!todayPLObj.all[existVIndex].plCats.includes('sleep')){todayPLObj.all[existVIndex].plCats.push('sleep')}}
                else{if(todayPLObj.all[existVIndex].plCats.includes('sleep')){todayPLObj.all[existVIndex].plCats=todayPLObj.all[existVIndex].plCats.filter(s=>s!=='sleep')}};
                if(sStar){if(!todayPLObj.all[existVIndex].plCats.includes('star')){todayPLObj.all[existVIndex].plCats.push('star')}}
                else{if(todayPLObj.all[existVIndex].plCats.includes('star')){todayPLObj.all[existVIndex].plCats=todayPLObj.all[existVIndex].plCats.filter(s=>s!=='star')}};
                if(!sSleep&&!sStar){if(!todayPLObj.all[existVIndex].plCats.includes('ors')){todayPLObj.all[existVIndex].plCats.push('ors')}}
                else{if(todayPLObj.all[existVIndex].plCats.includes('ors')){todayPLObj.all[existVIndex].plCats=todayPLObj.all[existVIndex].plCats.filter(s=>s!=='ors')}};
                //------------
                if(todayPLObj.all[existVIndex].vPath.startsWith('http')){
                  const nowUTS:number=this.evServ.gUT(new Date());
                  if(!todayPLObj.all[existVIndex].hasOwnProperty('expires')||todayPLObj.all[existVIndex].expires===0||todayPLObj.all[existVIndex].expires<nowUTS){
                    const gStreamURLRes:{url:string,expires:number}|false=await this.getPLStreamURL(todayPLObj.all[existVIndex].vId);
                  if(gStreamURLRes!==false){todayPLObj.all[existVIndex].vPath=gStreamURLRes.url;todayPLObj.all[existVIndex].expires=gStreamURLRes.expires}
                  else{todayPLObj.all[existVIndex].vPath='null'};
                  };
                };
              };
              //------------
              let retrievedDurs:any={};
              for(const[k,v]of Object.entries(todayPLObj)){
                if(Array.isArray(v)){
                  for(let pli=0;pli<v.length;pli++){
                    if(!v[pli].dur||v[pli].dur===0){
                      if(retrievedDurs.hasOwnProperty(v[pli].vId)){
                        if(retrievedDurs[v[pli].vId]!==-1){
                          const rDur:number=retrievedDurs[v[pli].vId];
                          todayPLObj[k][pli].dur=rDur;
                          this.dCon('ok','getUploadPLData',v[pli].vId+' - CORRECTED .dur Pty => '+String(rDur));
                        }
                      }else{
                        this.dCon('info','getUploadPLData',v[pli].vId+' - EMPTY .dur Pty => Attempt cmdGetDur...');
                        const cmdDurRes:number=await this.cmdGetDur(v[pli].vId);
                        if(cmdDurRes!==0){
                          this.dCon('ok','getUploadPLData',v[pli].vId+' - SUCCESS .dur Pty => '+String(cmdDurRes));
                          retrievedDurs[v[pli].vId]=cmdDurRes;
                          todayPLObj[k][pli].dur=cmdDurRes;
                        }else{
                          retrievedDurs[v[pli].vId]=-1;
                          this.dCon('err','getUploadPLData',v[pli].vId+' - FAIL .dur Pty => UNCHANGED (0)')
                        }
                      }
                    }
                  }
                }
              }
              //------------
            };
          };
          //-----------
          // Sort All Array
          if(todayPLObj.all.length>0){
            let cBoth:WCYTDLMDPLItem[]=[],cOne:WCYTDLMDPLItem[]=[],cNone:WCYTDLMDPLItem[]=[];
            for(let sorti=0;sorti<todayPLObj.all.length;sorti++){
              if(todayPLObj.all[sorti].plCats.includes('star')&&todayPLObj.all[sorti].plCats.includes('sleep')){cBoth.push(todayPLObj.all[sorti])}
              else if(todayPLObj.all[sorti].plCats.includes('star')||todayPLObj.all[sorti].plCats.includes('sleep')){cOne.push(todayPLObj.all[sorti])}
              else{cNone.push(todayPLObj.all[sorti])};
            };
            todayPLObj.all=cBoth.concat(cOne,cNone);
          };
        };
        let evPerc:number=((si+1)/mySubs.length);
        if(evPerc<0){evPerc=0};if(evPerc>1){evPerc=1};
        this.evServ.publish('uploadPLDataProg',evPerc);
      };
      this.evServ.publish('uploadPLDataProg',1);
      const ttlTime:string=this.evServ.ttlTime(runST);
      let finStr:string='FINISHED '+ttlTime;
      this.dCon('ok','getUploadPLData',finStr);
      return Promise.resolve({updPL:todayPLObj,didChange:true});
    }else{this.dCon('err','getUploadPLData','Failed to Init Auth');return Promise.resolve({updPL:todayPLObj,didChange:false})};
  }
//--------------------------------------------------------------
  async getPL(idOrURL:string):Promise<WCYTDLGetPlResult|false>{
    this.dCon('fn','getPL',idOrURL);
    let plId:string=await ytpl.getPlaylistID(idOrURL);
    if(!(ytpl.validateID(plId))){return Promise.resolve(false)};
    try{
      const{id,title,url,author,items}=await ytpl(plId,{limit:Infinity,pages:Infinity});
      if(id&&items&&items.length>0){
        this.dCon('ok','getPL','id: '+id+' | title: '+title+' ('+author.name+'), count: '+items.length);
        return Promise.resolve({id:plId,title:title,url:url,channel:{id:author.channelID,name:author.name,url:author.url},items:items});
      }else{this.dCon('nil','getPL');return Promise.resolve(false)}
    }catch(e){this.dCon('err','getPL',JSON.stringify(e));return Promise.resolve(false)};
  }
////////////////////////////////////////////////////////////////
  async hasCaps(vId:string):Promise<boolean>{ this.dCon('fn','hasCaps',vId);
    try{const vInfo:any=await ytdl.getInfo(this.vStr2URL(vId)),cTracks:any=vInfo.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
      if(cTracks&&cTracks.length>0&&cTracks.find(t=>t.languageCode==='en')!==undefined){return Promise.resolve(true)}else{return Promise.resolve(false)}
    }catch(e){this.dCon('err','hasCaps',JSON.stringify(e));return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async dlCaps(vId:string,cTBaseURL:string):Promise<number|false>{
    this.dCon('fn','dlCaps',vId);
    const capPath:string=path.join(this.wcYTDLCapsDir,vId+'.xml');
    let wordCount:number=0;
    const getCap=async():Promise<boolean>=>{
      try{
        const{status,data}=await axios.get(cTBaseURL,{timeout:5000});
        if(status===200&&data){
          wordCount=data.trim().split(/\s+/).length;
          await writeFile(capPath,data);
          return Promise.resolve(true);
        }else{this.dCon('err','(dlCaps) ERROR: Download Failed');return Promise.resolve(false)}
      }catch(e){this.dCon('err','(dlCaps) ERROR: Download Failed');return Promise.resolve(false)}
    };
    const dlCRes:boolean=await getCap(),dlE:boolean=await this.exists(capPath),dlS:{r:boolean,d:any}=await this.statSize(capPath);
    if(dlCRes&&dlE&&dlS.r&&dlS.d>0){
      this.dCon('ok','dlCaps','vId: '+vId+' | words: '+wordCount);
      return Promise.resolve(wordCount);
    }else{this.dCon('err','(dlCaps) ERROR: Download Failed');return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async dlAudio(vId:string,audioPath:string):Promise<HomeScrapeDLType>{
    this.dCon('fn','dlAudio',vId);
    const updSTP=()=>{let dlTTL:number=stp.dla;if(dlTTL<0){dlTTL=0};if(dlTTL>1){dlTTL=1};this.evServ.publish('stpA'+vId,dlTTL)};
    let aRes:HomeScrapeDLType={ext:'mp3',path:path.join(audioPath,vId+'.mp3'),size:0,err:false},stp:any={dla:0,proc:0};
    return new Promise((resolve)=>{
      const audio=ytdl(this.vStr2URL(vId),{quality:'highestaudio'}).on('progress',(_,dla,ttla)=>{stp.dla=(dla/ttla);updSTP()});
      const ffmProc:any=spawn(this.mpegExePath,['-i','pipe:0','-acodec:a','libmp3lame',aRes.path],{windowsHide:true});
      ffmProc.on('close',async(code:number)=>{
        if(code===0){const{r,d}:any=await this.statSize(aRes.path);if(r&&d>0){aRes.size=d}else{aRes.err=true;this.dCon('err','dlAudio','0/null file size')};resolve(aRes)}
        else{this.dCon('err','dlAudio','ERROR Code: '+code);aRes.err=true;resolve(aRes)}
      });
      audio.pipe(ffmProc.stdio[0]);
    });
  }
//--------------------------------------------------------------
s2T(secs:number):string{let fStr:string='',tH:string|null,tM:string|null,tS:string|null,hours:number=Math.floor(secs/3600),mins:number=0;if(hours>=1){tH=String(hours);secs=secs-(hours*3600)}else{tH=null};mins=Math.floor(secs/60);if(mins>=1){tM=String(mins);secs=secs-(mins*60)}else{tM=null};if(secs<1){tS=null}else{tS=String(secs)};(tH&&tM&&tM.length===1)?tM='0'+tM:void 0;(tS&&tS.length===1)?tS='0'+tS:void 0;if(tH){fStr+=tH;tM=':'+tM};if(tM){fStr+=tM;tS=':'+tS}else{fStr+='00:'};if(tS){fStr+=tS};if(fStr.includes(':null')){const rX:RegExp=/:null/gi;fStr=fStr.replace(rX,':00')};if(fStr===''){fStr='0'};return fStr};
//--------------------------------------------------------------
  async dlBatch(batch:WCYTDLDLBatch,dlrId:string,bI:number):Promise<WCYTDLFinItem[]|false>{
    const batchDir:string=path.join(this.wcYTDLDLsDir,dlrId+'/B'+String(bI));
    if(!(await this.exists(batchDir))){try{await mkdir(batchDir,{recursive:true})}catch(e){console.log(e);return Promise.resolve(false)}};
    const updDLProg=(dlPerc:number)=>{if(dlPerc<0){dlPerc=0};if(dlPerc>1){dlPerc=1};this.evServ.publish('dlFileProg',dlPerc)};
    const dlTRFn=(vId:string,dlP:string,tS:string,tD:string):Promise<{p:string,s:number}|false>=>{
      return new Promise((resolve)=>{
        const dlTRStream=ytdl(this.vStr2URL(vId),{quality:'lowest',filter:format=>format.container==='mp4'&&format.hasAudio});
        dlTRStream.on('progress',(_:any,dl:any,ttla:any)=>{const dlPerc:number=(dl/ttla);updDLProg(dlPerc)});
        const ffmProc=spawn(this.mpegExePath,['-i','pipe:0','-ss',tS,'-t',tD,dlP],{windowsHide:true});
        ffmProc.on('close',async(code:number)=>{if(code===0){const{r,d}:any=await this.statSize(dlP);if(r&&d>0){resolve({p:dlP,s:d})}else{resolve(false)}}else{resolve(false)}});
        dlTRStream.pipe(ffmProc.stdio[0]);
      });
    };
    //----------
    let finItems:WCYTDLFinItem[]=[];
    if(batch.items.length<1){this.dCon('err','dlBatches','ERROR: 0 Items in Batch');return Promise.resolve(false)};
    for(let bii=0;bii<batch.items.length;bii++){
      const tBItem:WCYTDLSRItem=batch.items[bii];
      if(tBItem&&tBItem.hasOwnProperty('matches')&&tBItem.matches&&typeof tBItem.matches==='object'&&Array.isArray(tBItem.matches)&&tBItem.matches.length>0){
        const tBMArr:WCYTDLSRMatch[]=tBItem.matches;
        for(let bimi=0;bimi<tBMArr.length;bimi++){
          const tBMItem:WCYTDLSRMatch=tBMArr[bimi];
          const dlVId:string=tBItem.vId,trS:string=tBMItem.transTime.start.toFixed(1),trD:string=tBMItem.transTime.dur.toFixed(1);
          const dlPath:string=path.join(batchDir,'I'+String(bii)+'M'+String(bimi)+'-'+tBItem.vId+'.mp4');
          let dlRes:{p:string,s:number}|false=false;
          if((await this.exists(dlPath))){const gS:{r:boolean,d:any}=await this.statSize(dlPath);if(gS.r&&gS.d>0){dlRes={p:dlPath,s:gS.d}}}
          else{dlRes=await dlTRFn(dlVId,dlPath,trS,trD)};
          if(dlRes!==false){
            const pInf:false|ffprobe.FFProbeStream=await this.probeInfo(dlRes.p);console.log(pInf);
            if(pInf!==false){
              const finItem:WCYTDLFinItem={term:batch.term,itemIndex:bii,matchIndex:bimi,vId:tBItem.vId,dbId:tBItem.dbId,file:{path:dlRes.p,size:{no:dlRes.s,str:(this.cvtBytes(dlRes.s))},dur:{no:pInf.duration,str:(pInf.duration<60?pInf.duration.toFixed(1)+'s':this.evServ.secsToMSS(pInf.duration))},info:pInf}};
              finItems.push(finItem);
            };
          };
          this.evServ.publish('dlMatchProg',true);
        };
      };
      this.evServ.publish('dlItemProg',true);
    };
    return Promise.resolve(finItems);
  }
//--------------------------------------------------------------
  async dlVideo(vId:string,videoPath:string):Promise<HomeScrapeDLType>{
    this.dCon('fn','dlVideo',vId);
    const updSTP=()=>{let dlTTL:number=stp.dla+stp.dlv;if(dlTTL<0){dlTTL=0};if(dlTTL>1){dlTTL=1};this.evServ.publish('stpV'+vId,dlTTL)};
    let vRes:HomeScrapeDLType={ext:'mp4',path:path.join(videoPath,vId+'.mp4'),size:0,err:false},stp:any={dla:0,dlv:0,proc:0};
    return new Promise((resolve)=>{
      const audio=ytdl(this.vStr2URL(vId),{quality:'highestaudio'}).on('progress',(_,dla,ttla)=>{stp.dla=((dla/ttla)/2);updSTP()});
      const video=ytdl(this.vStr2URL(vId),{quality:'lowestvideo',filter:format=>format.container==='mp4'}).on('progress',(_,dlv,ttlv)=>{stp.dlv=((dlv/ttlv)/2);updSTP()});
      const ffmProc:any=spawn(this.mpegExePath,['-loglevel','8','-hide_banner','-progress','pipe:3','-i','pipe:4','-i','pipe:5','-map','0:a','-map','1:v',vRes.path],{windowsHide:true,stdio:['inherit','inherit','inherit','pipe','pipe','pipe']});
      ffmProc.on('close',async(code:number)=>{
        if(code===0){
          const{r,d}:any=await this.statSize(vRes.path);if(r&&d>0){vRes.size=d}else{vRes.err=true;this.dCon('err','dlVideo','0/null file size')};resolve(vRes)}
          else{this.dCon('err','dlVideo','ERROR Code: '+code);vRes.err=true;resolve(vRes)}
      });
      audio.pipe(ffmProc.stdio[4]);
      video.pipe(ffmProc.stdio[5]);
    });
  }
//--------------------------------------------------------------
  async getPLStreamURL(vId:string):Promise<{url:string,expires:number}|false>{
    this.dCon('fn','getPLStreamURL','('+vId+')...');
    const getURL=(q:number):Promise<{url:string,expires:number}|false>=>{
      return new Promise(async(resolve)=>{
        try{
          let gotData:boolean=false,pData:string='';
          const ytdlProc:any=spawn(this.ytdlExePath,['https://www.youtube.com/watch?v='+vId,'-f',String(q),'-g'],{windowsHide:true});
          ytdlProc.stdout.on('data',(d)=>{gotData=true;pData+=d});
          ytdlProc.stderr.on('data',(d)=>{gotData=true;pData+=d});
          ytdlProc.on('close',()=>{
            if(gotData&&pData.length>0){
              let e:number=0;
              const d:string=pData.trim(),decD:string=decodeURI(d),decPsArr:string[]=decD.split('&'),expMArr:string[]=decPsArr.filter((s:string)=>s.includes('expire='));
              if(expMArr.length>0&&expMArr[0]&&expMArr[0].includes('=')){e=Number(expMArr[0].split('=')[1])};
              if(e!==0&&String(e).length===10){resolve({url:d,expires:e})}
              else{resolve(false)}
            }else{return Promise.resolve(false)}
          });
        }catch(e){console.log(e);resolve(false)}
      });
    };
    const hQRes:{url:string,expires:number}|false=await getURL(22);
    if(hQRes!==false){return Promise.resolve(hQRes)}
    else{
      const lQRes:{url:string,expires:number}|false=await getURL(18);
      if(lQRes!==false){return Promise.resolve(lQRes)}
      else{return Promise.resolve(false)};
    };
  }
//--------------------------------------------------------------
  fixThumbExt(thumbPath:string):Promise<string|false>{
    this.dCon('fn','guessThumbExt','('+thumbPath+')...');
    const origTFName:string=path.basename(thumbPath),origTDirPath:string=path.dirname(thumbPath);
    const tDir:string='C:\\myYTDLData\\bins',tExe:string=path.join(tDir,'trid.exe'),tDef:string=path.join(tDir,'triddefs.trd');
    return new Promise(async(resolve)=>{
      try{
        const tridProc:any=spawn(tExe,[thumbPath,'-ce','-d:'+tDef,'-n:0'],{windowsHide:true});
        tridProc.on('close',async(code:number)=>{
          const newList:string[]=await readdir(origTDirPath);
          if(newList&&newList.length>0){
            const match:string[]=newList.filter((n:string)=>n.includes(origTFName));
            if(match&&match.length>0){
              const fixdFullPath:string=path.join(origTDirPath,match[0]);
              this.dCon('ok','fixThumbExt','Fixed ThumbExt: '+fixdFullPath);
              resolve(fixdFullPath);
            }else{resolve(false)}
          }else{resolve(false)};
        });
      }catch(e){resolve(false)};
    });
  }
//--------------------------------------------------------------
  async dlMDVideo(vId:string):Promise<boolean>{
    this.dCon('fn','dlMDVideo',vId);
    let dlStartUTMS:number=0;
    const dlProg=(d:number,t:number)=>{
      const perc:number=d/t,elap:number=(Date.now()-dlStartUTMS)/1000,rem:number=(elap/perc)-elap;
      this.evServ.publish('dlMDVideoProg',{d:d,t:t,p:perc,e:elap,r:rem});
    };
    const baseDir:string='C:\\myYTDLData\\mydaily\\kodipls',dayDirStr:string=(this.evServ.todayPLStr()).replace(/\//g,''),vDLDirPath:string=path.join(baseDir,dayDirStr);
    const vDLFilePath:string=path.join(vDLDirPath,'video_'+vId+'.mp4');
    const vDLFileURL:string=this.vStr2URL(vId);
    const doDL=async(q:number):Promise<boolean>=>{
      return new Promise(async(resolve)=>{
        try{
          //const vDL=ytdl(vDLFileURL,{filter:format=>format.itag===22});
          const vDL=ytdl(vDLFileURL,{quality:'lowest',filter:format=>format.container==='mp4'&&format.hasAudio});
          vDL.pipe(createWriteStream(vDLFilePath));
          vDL.once('response',()=>{dlStartUTMS=Date.now()});
          vDL.on('progress',(_,dld:number,ttl:number)=>{dlProg(dld,ttl)});
          vDL.on('end',async()=>{if((await this.exists(vDLFilePath))){resolve(true)}else{resolve(false)}});
          vDL.on('error',(e:Error)=>{this.dCon('err','dlMDVideo','('+(q===22?'HQ':'LQ')+') ERROR: '+e.message);resolve(false)});
        }catch(e){this.dCon('err','dlMDVideo','('+(q===22?'HQ':'LQ')+') ERROR: '+e.message);resolve(false)};
      });
    };
    const hQRes:boolean=await doDL(22);
    if(hQRes){return Promise.resolve(true)}
    else{
      const lQ:boolean=await doDL(18);
      if(lQ){return Promise.resolve(true)}
      else{return Promise.resolve(false)}
    };
  }
//--------------------------------------------------------------
  async gotInfFile(vId:string):Promise<boolean>{
    const infoFPath:string=path.join(this.wcYTDLInfoDir,vId+'.json'),e:boolean=await this.exists(infoFPath),s:any=await this.statSize(infoFPath);
    if(e&&s.r&&s.d>0){return Promise.resolve(true)}else{return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async getCapTrack(vId:string):Promise<string|false>{
    const infoFPath:string=path.join(this.wcYTDLInfoDir,vId+'.json');
    if(!(await this.exists(infoFPath))||(await this.statSize(infoFPath)).d===0){return Promise.resolve(false)};
    try{
      const rR:string=await readFile(infoFPath,{encoding:'utf-8'});
      if(rR&&(await this.isJSON(rR))){
        const infObj:any=JSON.parse(rR);
        const cTracks:any[]=infObj.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
        if(cTracks&&cTracks.length>0){
          const cTrack:any|undefined=cTracks.find(t=>t.languageCode==='en');
          if(cTrack&&cTrack!==undefined&&cTrack.hasOwnProperty('baseUrl')){return Promise.resolve(cTrack.baseUrl)}
          else{return Promise.resolve(false)};
        }else{return Promise.resolve(false)};
      }else{return Promise.resolve(false)};
    }catch(e){console.log(e);return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async gVDur(vId:string):Promise<number|false>{try{const gIRes:ytdl.videoInfo=await ytdl.getInfo(this.vStr2Id(vId)),durStr:string=gIRes.player_response.videoDetails.lengthSeconds;return Promise.resolve(Number(durStr))}catch(e){console.log(e);return Promise.resolve(false)}}
//--------------------------------------------------------------
  async cmdGetDur(vId:string):Promise<number>{
    const cmdGDRes:number=await ipcRenderer.invoke('ytdlGetDurOnly',[vId]);
    return Promise.resolve(cmdGDRes);
  }
//--------------------------------------------------------------
  async gVHistInfo(vId:string):Promise<{r:boolean,d:WCYTDLGVHistResult|null}>{
    this.dCon('fn','gVHistInfo','()...');
    try{const gIRes:ytdl.videoInfo=await ytdl.getInfo(this.vStr2Id(vId));return Promise.resolve({r:true,d:{vT:gIRes.player_response.videoDetails.title,cT:gIRes.videoDetails.author.name,cUrl:gIRes.videoDetails.author.channel_url,dS:Number(gIRes.player_response.videoDetails.lengthSeconds)}})}catch(e){console.log(e);return Promise.resolve({r:false,d:null})};
  }
//--------------------------------------------------------------
  async dlInfo(vId:string):Promise<boolean>{
  this.dCon('fn','dlInfo',vId);
    try{
      const infoFPath:string=path.join(this.wcYTDLInfoDir,vId+'.json');
      const vInfo:any=await ytdl.getInfo(this.vStr2Id(vId));
      const cTracks:any[]=vInfo.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
      console.log(cTracks);
      if(cTracks&&cTracks.length>0){const cTrack:any|undefined=cTracks.find(t=>t.languageCode==='en');
        if(cTrack&&cTrack!==undefined){const vJSON:string=JSON.stringify(vInfo).replace(/(ip(?:=|%3D|\/))((?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|[0-9a-f]{1,4}(?:(?::|%3A)[0-9a-f]{1,4}){7})/ig,'$10.0.0.0');
          try{
            await writeFile(infoFPath,vJSON);
            await this.doW(0.25);
            const checkGot:boolean=await this.gotInfFile(vId);
            if(checkGot){}
            if((await this.exists(infoFPath))){return Promise.resolve(true)}else{return Promise.resolve(false)};
          }catch(e){this.dCon('err','dlVideoInfo',JSON.stringify(e));return Promise.resolve(false)};
        }else{this.dCon('nil','dlVideoInfo','Not English');return Promise.resolve(false)};
      }else{this.dCon('nil','dlVideoInfo','No Captions');return Promise.resolve(false)};
    }catch(e){this.dCon('err','dlVideoInfo',JSON.stringify(e));return Promise.resolve(false)};
  }
////////////////////////////////////////////////////////////////
  async startStopMySql(action:string):Promise<boolean>{
    this.dCon('fn','startStopMySql',action);
    if(action==='start'){
      if(!this.msqlIsRunning){
        this.msqlIsRunning=true;
        this.msqlPool=createPool({host:'192.168.0.11',user:'ytcaps',password:'PianoFarm123!?',database:'ytcaps',connectionLimit:50,waitForConnections:true,queueLimit:50});
        this.msqlPool.on('acquire',(c:any)=>{if(!this.msqlConnThreadIds.includes(c.threadId)){this.dCon('fn','msqlPool','New Connection '+c.threadId+' ACQUIRED');this.msqlConnThreadIds.push(c.threadId)}});
        this.msqlPool.on('connection',(c:any)=>{c.query('SET SESSION auto_increment_increment=1')});
        this.msqlPool.on('release',(c:any)=>{if(!this.msqlConnThreadIds.includes(c.threadId)){this.dCon('fn','msqlPool','Connection '+c.threadId+' RELEASED');this.msqlConnThreadIds.push(c.threadId)}});
        this.msqlPool.on('enqueue',()=>{this.dCon('fn','msqlPool','Connection ENQUEUED')});
        return Promise.resolve(true);
      }else{this.dCon('fn','startStopMySql|start','SKIPPED - Already Running');return Promise.resolve(true)}
    }else{
      if(this.msqlIsRunning){
        this.msqlIsRunning=false;
        return Promise.resolve(true);
      }else{this.dCon('fn','startStopMySql|stop','SKIPPED - Already Stopped');return Promise.resolve(true)}
    }
  }
//--------------------------------------------------------------
  async dbQ(q:string,v:any[]|null):Promise<any>{
    try{
      const db=await this.msqlPool.getConnection();
      const[r,]:any=await db.query(q,v);
      db.release();
      if(Array.isArray(r)){return Promise.resolve({r:true,d:r})}
      else{
        const optPs:string[]=['fieldCount','warningCount','insertId'];let resObj:any={r:true,d:{type:null,raw:r,msg:null}};let mm:string='';
        r.constructor.name==='ResultSetHeader'?resObj.d.type='ResultSetHeader':resObj.d.type='OkPacket';
        for(const[key,value]of Object.entries(r)){const k:string=String(key);const v:any=value;if(optPs.includes(k)&&v>0){mm=mm+key+':'+v+' '}};
        if(!r.hasOwnProperty('changedRows')){mm=mm+'changes:'+r.affectedRows}else{if(r.changedRows>0){mm=mm+'changes:'+r.changedRows}else{mm=mm+'changes:'+r.affectedRows}};
        resObj.d.msg=mm;return Promise.resolve(resObj);
      }
    }catch(e){this.dCon('err','dbQ',JSON.stringify(e));return Promise.resolve({r:false,d:e})}
  }
//--------------------------------------------------------------
  async getDBPing():Promise<{ms:number,str:string}|false>{
    const db=await this.msqlPool.getConnection();
    const sT:Date=new Date();
    const pRes:any=await db.ping();
    console.log(pRes);
    const tT:number=this.evServ.ttlDurMS(sT);
    db.release();
    return Promise.resolve({ms:tT,str:String(tT)+'ms'});
  }
//--------------------------------------------------------------
  getSRMatches(capData:any,sS:string):Promise<WCYTDLSRMatch[]|false>{
    const bLen:number=2,aLen:number=2;
    const isVLine=(l:WCYTDLSRTSLine):boolean=>{if(typeof l==='object'&&!_.isEmpty(l)&&l.hasOwnProperty('text')&&l.text&&typeof l.text==='string'&&l.text.length>0&&l.hasOwnProperty('time')&&l.time&&typeof l.time==='object'&&!_.isEmpty(l.time)&&l.time.hasOwnProperty('start')&&l.time.start&&typeof l.time.start==='number'&&l.time.start>0&&l.time.hasOwnProperty('dur')&&l.time.dur&&typeof l.time.dur==='number'&&l.time.dur>0){return true}else{return false}};
    if(!sS||typeof sS!=='string'||sS.length<1||!sS.toLowerCase){return Promise.resolve(false)};
    if(capData===null||capData===undefined||typeof capData!=='object'||_.isEmpty(capData)||!capData.hasOwnProperty('transcript')||!capData.transcript||!Array.isArray(capData.transcript)||capData.transcript.length<1){return Promise.resolve([])};
    let lineMatches:WCYTDLSRMatch[]=[];
    const tsLines:WCYTDLSRTSLine[]=capData.transcript;
    for(let tlI=0;tlI<tsLines.length;tlI++){
      const tLineObj:WCYTDLSRTSLine=tsLines[tlI];
      if((isVLine(tLineObj))){
        const tlText:string=tLineObj.text.toLowerCase();
        let tlMatch:string=' '+sS.toLowerCase()+' ';
        if(tlText.startsWith(sS.toLowerCase())){tlMatch=tlMatch.trimStart()};
        if(tlText.endsWith(sS.toLowerCase())){tlMatch=tlMatch.trimEnd()};
        const mI:number=tlText.indexOf(tlMatch);
        if(mI!==-1){
          let lMatch:WCYTDLSRMatch={transIndex:tlI,transTime:tLineObj.time,transText:{b:bLen,a:aLen,str:'',arr:[]}};
          const bS:string=tlText.slice(0,mI),bSWs:string[]=bS.split(' ');
          for(let bL=bLen;bL>0;bL--){
            if(bSWs[0]!==''&&bSWs.length>=bL){lMatch.transText.arr.push(bSWs[(bSWs.length-bL)])}
            else{
              if(tlI>0){
                const pLineObj:WCYTDLSRTSLine=tsLines[(tlI-1)];
                if((isVLine(pLineObj))){
                  const plText:string=pLineObj.text.toLowerCase(),plSWs:string[]=plText.split(' ');
                  lMatch.transText.arr.push(plSWs[(plSWs.length-bL)]);
                }
              }
            }
          };
          lMatch.transText.arr.push(sS.trim());
          const aS:string=tlText.slice((mI+tlMatch.length),tlText.length),aSWs:string[]=aS.split(' ');
          for(let aL=0;aL<aLen;aL++){
            if(aSWs[0]!==''&&aSWs.length>=aL){lMatch.transText.arr.push(aSWs[aL])}
            else{
              if(tlI<(tsLines.length-1)){
                const nLineObj:WCYTDLSRTSLine=tsLines[(tlI+1)];
                if((isVLine(nLineObj))){
                  const nlText:string=nLineObj.text.toLowerCase(),nlSWs:string[]=nlText.split(' ');
                  lMatch.transText.arr.push(nlSWs[aL]);
                }
              }
            }
          };
          if(lMatch.transText.arr.length>0){lMatch.transText.str=lMatch.transText.arr.join(' ');lineMatches.push(lMatch)};
        }
      }
    };
    return Promise.resolve(lineMatches);
  }
//--------------------------------------------------------------
  async findCapStr(searchStr:string):Promise<WCYTDLSRItem[]|false>{
    this.dCon('fn','findCapStr',searchStr);
    try{
      const db=await this.msqlPool.getConnection();
      const [r,]=await db.query(`SELECT video_id,db_id,caps_data FROM caps WHERE JSON_SEARCH(caps_data,'all','%`+searchStr+`%',NULL,'$.transcript[*].text') IS NOT NULL`,[]);
      db.release();
      this.evServ.publish('srDBProg',true);
      let resItems:WCYTDLSRItem[]=[];
      if(r&&r.length>0){
        for(let ri=0;ri<r.length;ri++){
          const rCapsJSON:string=r[ri].caps_data,rCapsObj:any=JSON.parse(rCapsJSON);
          const rCapMatches:WCYTDLSRMatch[]|false=await this.getSRMatches(rCapsObj,searchStr);
          if(rCapMatches!==false){resItems.push({dbId:r[ri].db_id,vId:r[ri].video_id,matches:rCapMatches})};
        };
        return Promise.resolve(resItems);
      }else{return Promise.resolve(resItems)}
    }catch(e){console.log(e);return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async getTTLDBByteSize():Promise<{mb:number,str:string}|false>{
    const db=await this.msqlPool.getConnection();
    const[r,]:any=await db.query(`SELECT size_mb FROM (SELECT table_schema as name, ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) as size_mb FROM information_schema.tables GROUP BY table_schema) alias_one WHERE name = 'ytcaps'`,[]);
    db.release();
    if(r[0]&&r[0].hasOwnProperty('size_mb')&&r[0].size_mb&&Number(r[0].size_mb)>0){
      let sO:any={mb:Math.round(Number(r[0].size_mb)),str:''};
      if((sO.mb/1000)<1){sO.str=String(sO.mb)+'MB'}
      else if((sO.mb/1000)>1&&(sO.mb/1000)<1000){sO.str=(sO.mb/1000).toFixed(2)+'GB'}
      else if((sO.mb/1000)>1&&(sO.mb/1000)>1000){sO.str=(sO.mb/1000/1000).toFixed(2)+'TB'};
      return Promise.resolve(sO);
    }else{return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async getTTLDBCapsCount():Promise<number|false>{
    const db=await this.msqlPool.getConnection();
    const[r,]:any=await db.query('SELECT COUNT(*) AS count FROM caps',[]);
    const ttlCount:number=Number(r[0].count);
    db.release();
    return Promise.resolve(ttlCount)
  }
//--------------------------------------------------------------
//--------------------------------------------------------------
  async hasCapInDB(vId:string):Promise<number|false>{
    this.dCon('fn','hasCapInDB','('+vId+')...');
    const{r,d}=await this.dbQ('SELECT * FROM `caps` WHERE `video_id` = ?',[vId]);
    if(r&&d.length>0){return Promise.resolve(Number(d[0].db_id))}
    else{return Promise.resolve(false)};
  }
//--------------------------------------------------------------
  async addCap2DB(item:WCYTDLCapRowObj):Promise<number|false>{
    const insRes:{r:boolean,d:any}=await this.dbQ('INSERT INTO `caps` SET ?',[item]);
    if(insRes.r){
      const dbIDRes:number|false=await this.hasCapInDB(item.video_id);
      if(dbIDRes!==false){return Promise.resolve(dbIDRes)}
      else{return Promise.resolve(false)};
    }else{return Promise.resolve(false)};
  }
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
}
