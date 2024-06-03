import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {getUnixTime,format,fromUnixTime,intervalToDuration,formatDuration,isBefore,isAfter,getTime,addMinutes,isSameDay,isSameMinute,subDays, isYesterday, isTomorrow, subMonths, isSameYear, subMinutes, addSeconds,subSeconds,addDays,getDay,getYear,parse,isSameSecond,addHours, startOfDay, parseISO, subWeeks, formatDistanceToNowStrict, isValid, subHours} from 'date-fns';
import { parseWithOptions } from 'date-fns/fp';
import { TWTTimes } from '../appTypes';
const _ = require('lodash');
//////////////////////////////////////////////////
@Injectable({providedIn:'root'})
//////////////////////////////////////////////////
export class EventsService {
//////////////////////////////////////////////////
  channels:{[key:string]:Subject<any>}={};
  subscribe(topic:string,observer:(_:any)=>void):Subscription{if(!this.channels[topic]){this.channels[topic]=new Subject<any>()};return this.channels[topic].subscribe(observer)}
  publish(topic:string,data:any):void{const subject=this.channels[topic];if(!subject){return};subject.next(data)}
  check(topic:string):Promise<boolean>{const subject=this.channels[topic];if(!subject){return Promise.resolve(false)}else{return Promise.resolve(true)}}
  destroy(topic:string):null{const subject=this.channels[topic];if(!subject){return};subject.complete();delete this.channels[topic]}
//////////////////////////////////////////////////
  secsToMSS(s:number):string{const hD:Date=addSeconds(new Date(0),s);return format(hD,'m:ss')};
  str2D(s:string,f:string):Date{try{return parse(s,f,new Date())}catch(e){console.log(e);return new Date()}};
  strFormat(d:Date,s:string):string{try{return format(d,s)}catch(e){return ''}};
  triggerTime(d:Date):string{return format(d,'hh:mmaaa')};
  just24Time(d:Date):string{return format(d,'HH:mm')};
  nowNice():string{return format(new Date(),'dd/MM/yyyy hh:mmaaa')};
  dNice(d:Date):string{return format(d,'dd/MM/yyyy hh:mmaaa')};
  nowMinsOnly():Promise<string>{return Promise.resolve(format(new Date(),'m'))};
  gUTMS():number{const nowUTSS:number=getUnixTime(new Date());const nowUTMS:number=nowUTSS*1000;return nowUTMS};
  gUT(d:any):number{try{return getUnixTime(new Date(d))}catch(e){return 0}};
  dUT(uts:any):Date{return fromUnixTime(Number(uts))};
  isSleepTime(sleepStr:string,wakeStr:string):boolean{
    const sDate:Date=this.str2D(sleepStr,'h:mma'),wDate:Date=this.str2D(wakeStr,'h:mma'),now:Date=new Date();
    if(now>=sDate&&now<wDate){return true}else{return false};
  };
  durToNow(d:Date):string{const dO:Duration=intervalToDuration({start:new Date(),end:d});return formatDuration(dO,{delimiter:', ',format:['hours','minutes']})};
  runTime(d:Date):string{const dO:Duration=intervalToDuration({start:new Date(),end:d});return formatDuration(dO,{delimiter:', ',format:['minutes','seconds']})};
  triggerGetDur(d:Date):Duration{const dO:Duration=intervalToDuration({start:new Date(),end:d});return dO};
  streamRT(d:Date):string{
    const dO:Duration=intervalToDuration({start:new Date(),end:d});
    let dS:string=formatDuration(dO,{delimiter:':',zero:true,format:['hours','minutes']});
    const rplArr:RegExp[]=[/hours/gi,/hour/gi,/minutes/gi,/minute/gi,/\s/gi];
    for(let ri=0;ri<rplArr.length;ri++){dS=dS.replace(rplArr[ri],'')};
    let dSSArr:string[]=dS.split(':');
    if(dSSArr[1]==='0'){dSSArr[1]='00'};
    if(dSSArr[1].length===1){dSSArr[1]='0'+dSSArr[1]};
    if(dSSArr[0]==='0'){dSSArr[0]='00'};
    if(dSSArr[0].length===1){dSSArr[0]='0'+dSSArr[0]};
    const finalDS:string=dSSArr[0]+':'+dSSArr[1];
    return finalDS;
  };
  streamRTWT(sS:Date,wS:Date):TWTTimes{
    const stDO:Duration=intervalToDuration({start:new Date(),end:sS}),wtDO:Duration=intervalToDuration({start:new Date(),end:wS});
    let stDS:string=formatDuration(stDO,{delimiter:':',zero:true,format:['hours','minutes','seconds']}),wtDS:string=formatDuration(wtDO,{delimiter:':',zero:true,format:['hours','minutes','seconds']});
    const rplArr:RegExp[]=[/hours/gi,/hour/gi,/minutes/gi,/minute/gi,/seconds/gi,/second/gi,/\s/gi];
    for(let stri=0;stri<rplArr.length;stri++){stDS=stDS.replace(rplArr[stri],'')};
    let stDSArr:string[]=stDS.split(':');
    if(stDSArr[2]==='0'){stDSArr[2]='00'};
    if(stDSArr[2].length===1){stDSArr[2]='0'+stDSArr[2]};
    if(stDSArr[1]==='0'){stDSArr[1]='00'};
    if(stDSArr[1].length===1){stDSArr[1]='0'+stDSArr[1]};
    if(stDSArr[0]==='0'){stDSArr[0]='00'};
    if(stDSArr[0].length===1){stDSArr[0]='0'+stDSArr[0]};
    const finalST:string=stDSArr[0]+':'+stDSArr[1]+':'+stDSArr[2];
    for(let wtri=0;wtri<rplArr.length;wtri++){wtDS=wtDS.replace(rplArr[wtri],'')};
    let wtDSArr:string[]=wtDS.split(':');
    if(wtDSArr[2]==='0'){wtDSArr[2]='00'};
    if(wtDSArr[2].length===1){wtDSArr[2]='0'+wtDSArr[2]};
    if(wtDSArr[1]==='0'){wtDSArr[1]='00'};
    if(wtDSArr[1].length===1){wtDSArr[1]='0'+wtDSArr[1]};
    if(wtDSArr[0]==='0'){wtDSArr[0]='00'};
    if(wtDSArr[0].length===1){wtDSArr[0]='0'+wtDSArr[0]};
    const finalWT:string=wtDSArr[0]+':'+wtDSArr[1]+':'+wtDSArr[2];
    return {st:finalST,wt:finalWT};
  };
  longDurToNow(d:Date):string{const dO:Duration=intervalToDuration({start:new Date(),end:d});return formatDuration(dO,{delimiter:', ',format:['days','hours','minutes']})};
  ttlTime(sT:Date):string{const stMS:number=getTime(sT);const eTMS:number=getTime(new Date());return '(⏲️ '+((eTMS-stMS)/1000).toFixed(1)+'s)'};
  ttlDur(sT:Date):string{const stMS:number=getTime(sT);const eTMS:number=getTime(new Date());return ((eTMS-stMS)/1000).toFixed(1)+'s'};
  ttlDurS(sT:Date):number{const stMS:number=getTime(sT);const eTMS:number=getTime(new Date());return ((eTMS-stMS)/1000)};
  ttlDurMS(sT:Date):number{const stMS:number=getTime(sT);const eTMS:number=getTime(new Date());return (eTMS-stMS)};
  isSD(d1:Date,d2:Date):boolean{return isSameDay(d1,d2)};
  isYD(d:Date):boolean{return isYesterday(d)};
  isB(d1:Date,d2:Date){return isBefore(d1,d2)};
  isA(d1:Date,d2:Date){return isAfter(d1,d2)};
  addMins(d:Date,m:number){return addMinutes(d,m)};
  subMins(d:Date,m:number){return subMinutes(d,m)};
  addSecs(d:Date,s:number){return addSeconds(d,s)};
  addHrs(d:Date,h:number){return addHours(d,h)};
  subSecs(d:Date,s:number){return subSeconds(d,s)};
  addDs(d:Date,ds:number){return addDays(d,ds)};
  subDs(d:Date,ds:number){return subDays(d,ds)};
  sub6MsUTS(){const sub6D:Date=subMonths(new Date(),6);const sub6UTS:number=this.gUT(sub6D);return sub6UTS};
  isLast1H(d:Date):boolean{const nowUTS:number=this.gUT(new Date()),thenUTS:number=this.gUT(d);if((nowUTS-3600)<thenUTS){return false}else{return true}};
  isLast1M(uts:number){const sub1MD:Date=subMonths(new Date(),1),sub1MUTS=this.gUT(sub1MD),nowUTS=this.gUT(new Date());if(uts>sub1MUTS&&uts<nowUTS){return true}else{return false}};
  isLast1W(uts:number){const sub1WD:Date=subWeeks(new Date(),1),sub1WUTS=this.gUT(sub1WD),nowUTS=this.gUT(new Date());if(uts>sub1WUTS&&uts<nowUTS){return true}else{return false}};
  sub1WUTS(){const sub6D:Date=subMonths(new Date(),6);const sub6UTS:number=this.gUT(sub6D);return sub6UTS};
  isSM(d1:Date,d2:Date){return isSameMinute(d1,d2)};
  gD(d:Date):number{return getDay(d)};
  gY(d:Date):number{return getYear(d)};
  pISO(iso:string):Date{return parseISO(iso)};
  parseStr(Dstr:string,strF:string):Date{return parse(Dstr,strF,new Date())};
  isTM(d:Date):boolean{return isTomorrow(d)};
  isSY(d1:Date,d2:Date):boolean{return isSameYear(d1,d2)};
  isSS(d1:Date,d2:Date):boolean{return isSameSecond(d1,d2)};
  isSameMin(d:Date):boolean{return isSameMinute(d,new Date())};
  ttMS(d1:Date,d2:Date):number{const startUT:number=d1.getTime(),endUT:number=d2.getTime(),msDur:number=endUT-startUT;return msDur};
  tAgo(d:Date):string{return formatDistanceToNowStrict(d,{addSuffix:false,unit:'hour'}).replace(' hours','h').replace(' hour','h')};
  isVD(d:any){if(isValid(d)){return true}else{return false}};
  nowSubXHrs(hrs:number):Date{return subHours(new Date(),hrs)};
  todayPLStr():string{return this.strFormat(new Date(),'dd/MM/yy')};
  lessThanXMinsAgo(d:Date,x:number):boolean{
    const dUTS:number=getUnixTime(new Date(d)),nUTS:number=getUnixTime(new Date()),diffS:number=nUTS-dUTS;
    if(diffS>(x*60)){return false}else{return true}
  };
//////////////////////////////////////////////////
  /* isDiff(newObject:any,oldObject:any):any{function changes(object:any,base:any){return _.transform(object,function(result:any,value:any,key:any){if(!_.isEqual(value,base[key])){result[key]=(_.isObject(value)&&_.isObject(base[key]))?changes(value,base[key]):value}})};const diffRes:object=changes(newObject,oldObject);if(_.isEmpty(diffRes)){return {r:false}}else{return {r:true,d:diffRes}}}; */
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
}
