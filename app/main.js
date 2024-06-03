"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appTypes_1 = require("./appTypes");
const electron_1 = require("electron");
const promises_1 = require("fs/promises");
const date_fns_1 = require("date-fns");
const socket_io_1 = require("socket.io");
const http_terminator_1 = require("http-terminator");
const bonjour_service_1 = require("bonjour-service");
const wled_client_1 = require("wled-client");
const contextMenu = require("electron-context-menu");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const sdk = require("cue-sdk");
const find = require("local-devices");
const http = require("http");
const crypto = require("crypto");
const axios_1 = require("axios");
const ws_1 = require("ws");
const child_process_1 = require("child_process");
const https = require("https");
const url = require("url");
const childProcess = require("child_process");
const appTypes_2 = require("../src/appTypes");
const child_process_2 = require("child_process");
const si = require("systeminformation");
const mdb = require("mongodb");
const mqtt = require("mqtt");
//////////////////////////////////////////////////
// GLOBAL VARS
//////////////////////////////////////////////////
let termAppInProg = false;
let noteLightsInProg = false;
let chimeLightsInProg = false;
let devNSDInt;
let devNSDActive = false;
let lastNDs = [];
let meD = { ip: '192.168.0.69', mac: 'a44bd5c9eb60' };
let hwiINT;
let rssiINT;
// WLED ------------------------------------------
let wledIPs = [
    '192.168.0.101',
    '192.168.0.102',
    '192.168.0.103',
    '192.168.0.104',
    '192.168.0.105',
    '192.168.0.106',
    '192.168.0.107',
    '192.168.0.108',
    '192.168.0.109',
    '192.168.0.110',
    '192.168.0.131' // }
];
let wledGrpLeads = ['Zer0WLED1', 'Zer0WLED4', 'Zer0WLED6', 'Zer0WLED10'];
let wledGrpMembrs = {
    1: ['Zer0WLED1', 'Zer0WLED2', 'Zer0WLED3'],
    2: ['Zer0WLED4', 'Zer0WLED5'],
    3: ['Zer0WLED6', 'Zer0WLED7', 'Zer0WLED8', 'Zer0WLED9'],
    4: ['Zer0WLED10', 'Zer0WLEDMatrix']
};
let ws2815WLEDIPs = [
    '192.168.0.106',
    '192.168.0.107',
    '192.168.0.108',
    '192.168.0.109',
    '192.168.0.131'
];
let sk6812WLEDIPs = [
    '192.168.0.101',
    '192.168.0.102',
    '192.168.0.103',
    '192.168.0.104',
    '192.168.0.105',
    '192.168.0.110'
];
let z1bESP32IPs = {
    touch: {
        left: '192.168.0.111',
        right: '192.168.0.112' // e4:65:b8:ae:21:30 | HubPort 5 | COM35
    },
    round: {
        left1: '192.168.0.113',
        left2: '192.168.0.114',
        right1: '192.168.0.115',
        right2: '192.168.0.116' // e4:65:b8:77:6f:04 | HubPort 7 | COM36
    }
};
let wleds = [];
let willDoDelayedWLEDInit = false;
let wledGroupSyncOn = true;
let dtlfxIsLive = false;
// SOCKET ----------------------------------------
let mSensorIPs = ['192.168.0.201', '192.168.0.202', '192.168.0.203'];
// SOCKET ----------------------------------------
let io;
let ioUp = false;
let ioClients = [];
// MOTIONSRV -------------------------------------
let mdSVR = null;
let mdSVRKill = null;
// MAIN INVOKE -----------------------------------
let awaitFnsInProg = [];
// ENVMODE ---------------------------------------
let wcMode = 'dev';
// NETWORK ---------------------------------------
let netInfo = null;
let netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
let netClients = [];
// WCSERVER --------------------------------------
let isListen = true;
let syncStates = { audioSync: false, sshotSync: false };
let isSleep = false;
let lastWakeSleep = null;
// WINDOW ----------------------------------------
let wcWindowOpts = { x: 0, y: 0, width: 300, height: 600, minWidth: 280, minHeight: 48, title: 'wifiCUE', darkTheme: true, frame: false, transparent: true, icon: path.join(__dirname, '../dist/assets/icons/large-wcicon.png'), webPreferences: { nodeIntegration: true, nodeIntegrationInWorker: true, nodeIntegrationInSubFrames: true, webSecurity: false, allowRunningInsecureContent: true, webgl: true, plugins: true, backgroundThrottling: false, sandbox: false, contextIsolation: false, spellcheck: false, defaultFontFamily: { sansSerif: 'Arial' }, defaultFontSize: 14 } };
let wcWindow = null;
// DEVTOOLS --------------------------------------
let wcDevTools = null;
// CONTEXT MENU ----------------------------------
let cmOpts = null;
let childWCMIsOpen = false;
let cmContextStr = '';
// TRAY ------------------------------------------
let wcTray = null;
let wcTrayUpdating = false;
let wcTrayContextMenu = null;
// CUE SDK ---------------------------------------
let cueSDKStatus = null;
let ledPollInt;
let isPollingLED = false;
let showLEDPollTo = { server: true, client: true };
let sshotPollInt;
let setCUEDefDevList = null;
// PREFS/PROFILES/PATHS --------------------------
const wcSSFileDir = path.join(electron_1.app.getPath('documents'), 'wifiCUE');
const wcBFile = path.join(electron_1.app.getPath('documents'), 'wifiCUE/.bans');
const wcGFile = path.join(electron_1.app.getPath('documents'), 'wifiCUE/.grants');
const wcDataDirPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata');
const wcDataFilePath = path.join(wcDataDirPath, 'wcdata.json');
let wcData = null;
let wcDataRWInProg = false;
let lastImgPath = null;
// XPSERVER --------------------------------------
let svrUUID = null;
let svrDidStart;
let svrListening = null;
let svrSVR = null;
let svrSVRKill = null;
let svrInfo = { ip: '127.0.0.1', port: 6969 };
let wcBonInst;
let wcBonSvr;
let wcBonIsUp = false;
// SHORTCUTS -------------------------------------
let scsActive = false;
// KODI ------------------------------------------
let hasKodi = false;
let kodiBURL;
let kodiAH;
let kodiOnlineINT;
let promptKUPs = false;
let kodiServerIP = '';
let kodiServiceRunning = false;
let kodiThemeOpts = [];
let lastKodiThemeCol = [];
let kodiPlyr = { item: null, status: 'stopped', pos: { total: 0, time: 0, perc: 0 } };
let kodiActivePlyrs = [];
let kodiVMInProg = false;
let kodiVolMute = { muted: false, volume: 50 };
let kodiPosINT = null;
let kodiVolTO = null;
let kodiPosLooping = false;
let kodiWLEDState = null;
let kodiPrevMuteCols = [];
let kodiPrevVolCols = [];
// MORE WINS -------------------------------------
let moreWins = [];
let moreWinDeets = [];
let moreDevTools = [];
let defMoreWinOpts = { x: 0, y: 0, width: 300, height: 240, minWidth: 280, minHeight: 48, title: '', darkTheme: true, frame: false, transparent: true, icon: path.join(__dirname, '../dist/assets/icons/large-wcicon.png'), resizable: true, webPreferences: { nodeIntegration: true, nodeIntegrationInWorker: true, nodeIntegrationInSubFrames: true, webSecurity: false, allowRunningInsecureContent: true, webgl: true, plugins: true, backgroundThrottling: false, sandbox: false, contextIsolation: false, spellcheck: false, defaultFontFamily: { sansSerif: 'Arial' }, defaultFontSize: 14 } };
let mwCMs = [];
// CHILD WINDOW ----------------------------------
let childW = null;
let childDevTools;
let childWindowOpts = { x: 0, y: 0, width: 300, height: 542, minWidth: 280, minHeight: 48, title: 'Twitch', darkTheme: true, frame: false, transparent: true, icon: path.join(__dirname, '../dist/assets/icons/large-wcicon.png'), resizable: false, webPreferences: { nodeIntegration: true, nodeIntegrationInWorker: true, nodeIntegrationInSubFrames: true, webSecurity: false, allowRunningInsecureContent: true, webgl: true, plugins: true, backgroundThrottling: false, sandbox: false, contextIsolation: false, spellcheck: false, defaultFontFamily: { sansSerif: 'Arial' }, defaultFontSize: 14 } };
// TWITCH ----------------------------------------
let twtAuth = { cbUrl: 'http://localhost:3333', username: 'zer0ne33', code: '', token: '', refresh: '', expires: 0, client: 'cdbusdlezzt8yiysbv39s2zik3fyd0', secret: 'z1u5ccpp46i7ec3gavdb4k5snelr3a' };
let twtScopesEnc = 'user%3Aread%3Afollows+user%3Amanage%3Achat_color+user%3Aread%3Aemail+user%3Aread%3Asubscriptions+user%3Amanage%3Awhispers+user%3Aedit+chat%3Aread+chat%3Aedit+bits%3Aread+whispers%3Aread+whispers%3Aedit+channel%3Amoderate+channel%3Aread%3Aeditors+channel%3Aread%3Agoals+channel%3Aread%3Ahype_train+channel%3Aread%3Apolls+channel%3Aread%3Apredictions+channel%3Aread%3Aredemptions+channel%3Aread%3Asubscriptions';
const twtId = '139738358';
let twtIsAuth = false;
let twtUser = null;
let twtFollowing = [];
let twtLives = null;
let twtLivesRefreshINT = null;
let twtWSC;
let twtEvWSC;
let twtEventsConn = false;
let twtEventsSession = null;
let twtChatConn = false;
let twtEvSubs = [];
let chatConn;
let eventsConn;
let twtDiscoHandlerOn;
let twtCommandListenerOn;
// FFMPEG ----------------------------------------
let ffPaths = { ffmpeg: null, ffplay: null, ffprobe: null };
// FIND TUNE -------------------------------------
let ftMP3Path = 'C:\\ffmpeg\\recs\\a.mp3';
let ftRAWPath = 'C:\\ffmpeg\\recs\\a.raw';
let ftFFMPath = 'C:\\ffmpeg\\ffmpeg\\ffmpeg.exe';
let ftAPIUrl = 'https://shazam.p.rapidapi.com/songs/v2/detect';
let ftReqOpts = { headers: { 'Content-Type': 'text/plain', 'X-RapidAPI-Key': '124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52', 'X-RapidAPI-Host': 'shazam.p.rapidapi.com' } };
// FIND BPM --------------------------------------
let fbMP3Path = 'C:\\ffmpeg\\recs\\b.mp3';
let fbFFMPath = 'C:\\ffmpeg\\ffmpeg\\ffmpeg.exe';
let fbBPMExePath = 'C:\\ffmpeg\\recs\\bpm.exe';
let fbInProg = false;
let tempC = 0;
// WIFING ------------------------------------------
let wingData = null;
// YTDL ------------------------------------------
let ytdlData = null;
let trendTwitterAPIUrl = 'https://twitter-pack.p.rapidapi.com/trend';
let trendTwitterReqOpts = { headers: { 'Content-Type': 'text/plain', 'X-RapidAPI-Key': '124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52', 'X-RapidAPI-Host': 'twitter-pack.p.rapidapi.com' }, params: { woeid: 23424977 } };
let trendYTAPIUrl = 'https://youtube-trending.p.rapidapi.com/trending';
let trendYTReqOpts = { headers: { 'Content-Type': 'text/plain', 'X-RapidAPI-Key': '124f605b8amshdc6578e3d461b30p19dfc0jsnb96171192c52', 'X-RapidAPI-Host': 'youtube-trending.p.rapidapi.com' }, params: { country: 'US' } };
// ADB CONNECT -----------------------------------
let adbTrackerInst;
let adbActiveDevs = [];
// WLED SYNC GROUPS ------------------------------
const onUDPs = {
    Zer0WLED1: { send: true, recv: true, sgrp: 1, rgrp: 1 },
    Zer0WLED2: { send: false, recv: true, sgrp: 0, rgrp: 1 },
    Zer0WLED3: { send: false, recv: true, sgrp: 0, rgrp: 1 },
    Zer0WLED4: { send: true, recv: true, sgrp: 2, rgrp: 2 },
    Zer0WLED5: { send: false, recv: true, sgrp: 0, rgrp: 2 },
    Zer0WLED6: { send: true, recv: true, sgrp: 3, rgrp: 3 },
    Zer0WLED7: { send: false, recv: true, sgrp: 0, rgrp: 3 },
    Zer0WLED8: { send: false, recv: true, sgrp: 0, rgrp: 3 },
    Zer0WLED9: { send: false, recv: true, sgrp: 0, rgrp: 3 },
    Zer0WLED10: { send: true, recv: true, sgrp: 4, rgrp: 4 },
    Zer0WLEDMatrix: { send: false, recv: true, sgrp: 0, rgrp: 4 }
};
const offUDP = { send: false, recv: false, sgrp: 0, rgrp: 0 };
// PIR SENSORS/MOTION ----------------------------
let webcamMotion = false;
let pirWLEDIndexes = {};
let pirsPower = true;
let pirsOnline = { 1: false, 2: false, 3: false };
const pir2WLEDMap = { 1: [4, 5], 2: [1], 3: [1, 2, 3, 4, 5] };
const pir2WLEDMapSync = { 1: [4], 2: [1], 3: [1, 4] };
const pirCtrlLastsS = { 1: 60, 2: 10, 3: 3 };
const pirMinCount = { 1: 3, 2: 1, 3: 1 };
const pirCountMaxTimeS = { 1: 6, 2: 6, 3: 3 };
let pirSTimes = { 1: 0, 2: 0, 3: 0 };
let pirTCounts = { 1: 0, 2: 0, 3: 0 };
let pirWLEDInProg = { 1: false, 2: false, 3: false };
let pirCountTO = { 1: null, 2: null, 3: null };
let pirCountSecsINT = { 1: { secs: pirCountMaxTimeS[1], int: null }, 2: { secs: pirCountMaxTimeS[2], int: null }, 3: { secs: pirCountMaxTimeS[3], int: null } };
let pirWLEDTO = { 1: null, 2: null, 3: null };
let pirWLEDSecsINT = { 1: { secs: pirCtrlLastsS[1], int: null }, 2: { secs: pirCtrlLastsS[2], int: null }, 3: { secs: pirCtrlLastsS[3], int: null } };
const getAddSecs = (pirNo) => { return pirWLEDSecsINT[pirNo].secs; };
let pir3PrevColor = [0, 0, 0, 255];
let pir3PrevBri = 204;
let pir2PrevColor = [0, 0, 0, 255];
let pir2PrevBri = 204;
// Z1BOX VARIABLES --------------------------------
let z1bMQTTClient = null;
let z1bMQTTOnline = false;
let z1bCurrentScreen = null;
let z1bConfigName = null;
const z1bSDataDir = path.join(electron_1.app.getPath('documents'), 'z1Box');
const z1bSDataFile = path.join(electron_1.app.getPath('documents'), 'z1Box/z1BoxSavedSettings.json');
let z1bSData = null;
let z1bIsOnline = false;
let z1bSVR;
let killZ1BSVR;
let z1bHWInfo = false;
let z1bColor = [127, 127, 127];
let z1bFSInfo = [];
let z1bNETInfo = [];
let z1bWeatherObj = null;
let z1bAudioEVListen = false;
let z1bSRCVal = null;
let z1bVolVal = null;
let z1bMuteVal = null;
let z1TimeINT = null;
let z1WeatherINT = null;
let z1bSendVizInfo = false;
//////////////////////////////////////////////////
// UTILITY FNS
//////////////////////////////////////////////////
electron_1.ipcMain.handle('getPIRMaxTOS', (e, args) => { return Promise.resolve(pirCountMaxTimeS[args[0]]); });
const mainEvCons = (evSource, evName, evOb) => { let sTxt = ''; if (evSource === 'a') {
    sTxt = 'App';
}
else if (evSource === 'w') {
    sTxt = 'Window';
}
else {
    sTxt = 'DevTools';
} ; const tStr = (0, date_fns_1.format)(new Date(), 'HH:mm:ss.SS'); console.log(tStr + ' - [MAIN|' + sTxt + '] (Event): ' + evName.toUpperCase()); if (evOb) {
    console.dir(evOb, { depth: 100 });
} };
//-------------------------------------------------
const anyPirInProg = () => { return Object.values(pirWLEDInProg).some((ip) => (ip)); };
//-------------------------------------------------
const availCons = async (fnName, msg) => {
    if (termAppInProg) {
        return;
    }
    ;
    try {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('sendAvailCons', [fnName, msg]);
        }
        else {
            const tStr = (0, date_fns_1.format)(new Date(), 'HH:mm:ss.SS');
            let m = tStr + ' - [MAIN|' + fnName + '] (Log): ';
            if (typeof msg === 'string') {
                console.log(m + msg);
            }
            else {
                console.log(m);
                console.dir(msg, { depth: null });
            }
        }
    }
    catch (e) { }
};
//-------------------------------------------------
const exists = async (path) => { try {
    await (0, promises_1.access)(path);
    return true;
}
catch {
    return false;
} };
//-------------------------------------------------
const doW = async (s) => { return new Promise(async (resolve) => { setTimeout(async () => { resolve(true); }, (s * 1000)); }); };
//-------------------------------------------------
const capd = (s) => { return s.charAt(0).toUpperCase() + s.slice(1); };
//-------------------------------------------------
const statSize = async (path) => { try {
    const sRes = await (0, promises_1.stat)(path);
    if (sRes && sRes.size > 0) {
        return Promise.resolve({ r: true, d: sRes.size });
    }
    else {
        return Promise.resolve({ r: false, d: 0 });
    }
}
catch (e) {
    return Promise.resolve({ r: false, d: 0 });
} };
//-------------------------------------------------
const readDataFile = async () => { try {
    const rR = await (0, promises_1.readFile)(wcDataFilePath, { encoding: 'utf-8' });
    if (rR && (await isJSON(rR))) {
        wcData = JSON.parse(rR);
        availCons('readDataFile', 'Data File [READ] - OK');
        return Promise.resolve(JSON.parse(rR));
    }
    else {
        return Promise.resolve(false);
    }
}
catch (e) {
    console.log(e);
    return Promise.resolve(false);
} };
//-------------------------------------------------
const writeDataFile = async (data) => { let updData = data; updData.lastUpdate = (0, date_fns_1.getUnixTime)(new Date()); const updDataStr = JSON.stringify(data); try {
    await (0, promises_1.writeFile)(wcDataFilePath, updDataStr, { encoding: 'utf-8' });
    availCons('writeDataFile', 'Data File [WRITE] - OK');
    await readDataFile();
    return Promise.resolve(true);
}
catch (e) {
    console.log(e);
    return Promise.resolve(false);
} };
//-------------------------------------------------
const isNetEnabled = async () => { if (!netInterface.error && netInterface.active && netInterface.name.trim().length > 0 && netInterface.type.trim().length > 0) {
    return true;
}
else {
    const gNIRes = await getNetInfo();
    if (gNIRes.info.name === '' || gNIRes.info.type === '') {
        return Promise.resolve(false);
    }
    else {
        return Promise.resolve(true);
    }
} };
//-------------------------------------------------
const listenONOFFStr = () => { if (wcData.isListen === null) {
    return 'Loading... (-)';
}
else {
    if (wcData.isListen === true) {
        return 'Listening (ON)';
    }
    else {
        return 'Listening (OFF)';
    }
} };
//-------------------------------------------------
const icoP = (p) => { const iP = path.join(__dirname, '../dist/' + p); return iP; };
//-------------------------------------------------
const natIco = (pngFileName) => { return (electron_1.nativeImage.createFromPath((icoP('assets/' + pngFileName)))); };
//-------------------------------------------------
const isVJ = (d) => { try {
    JSON.parse(d);
    return Promise.resolve(true);
}
catch (e) {
    return Promise.resolve(false);
} };
//-------------------------------------------------
const isJSON = (data) => { if (typeof data !== 'string') {
    return Promise.resolve(false);
} ; try {
    const result = JSON.parse(data);
    const type = Object.prototype.toString.call(result);
    return Promise.resolve(type === '[object Object]' || type === '[object Array]');
}
catch (err) {
    return Promise.resolve(false);
} };
//-------------------------------------------------
const s2T = (secs) => { let fStr = '', tH, tM, tS, hours = Math.floor(secs / 3600), mins = 0; if (hours >= 1) {
    tH = String(hours);
    secs = secs - (hours * 3600);
}
else {
    tH = null;
} ; mins = Math.floor(secs / 60); if (mins >= 1) {
    tM = String(mins);
    secs = secs - (mins * 60);
}
else {
    tM = null;
} ; if (secs < 1) {
    tS = null;
}
else {
    tS = String(secs);
} ; (tH && tM && tM.length === 1) ? tM = '0' + tM : void 0; (tS && tS.length === 1) ? tS = '0' + tS : void 0; if (tH) {
    fStr += tH;
    tM = ':' + tM;
} ; if (tM) {
    fStr += tM;
    tS = ':' + tS;
}
else {
    fStr += '00:';
} ; if (tS) {
    fStr += tS;
} ; if (fStr.includes(':null')) {
    const rX = /:null/gi;
    fStr = fStr.replace(rX, ':00');
} ; if (fStr === '') {
    fStr = '-';
} ; if (fStr === ':00') {
    fStr = '-';
} ; return fStr; };
//------------------------------------------------
async function reqDTLFX(method, data) {
    availCons('reqDTLFX', '(' + method + ',data)...');
    try {
        let defReqOpts = { url: 'http://192,168.0.3:9696', method: method, timeout: 3000 };
        if (method === 'get') {
            defReqOpts['headers'] = { dtlfxtoken: '*******', dtlfxfrom: 'wificue', wificue: data };
            defReqOpts['responseType'] = 'json';
        }
        else {
            defReqOpts['headers'] = { dtlfxtoken: '*******', dtlfxfrom: 'wificue', wificue: 'post' };
            defReqOpts['data'] = JSON.stringify(data);
            defReqOpts['responseType'] = 'json';
        }
        ;
        const reqRes = await axios_1.default.request(defReqOpts);
        if (reqRes.status !== 200) {
            availCons('reqDTLFX', 'ERROR: ' + reqRes.status);
        }
        ;
        return Promise.resolve(reqRes.data);
    }
    catch (e) {
        return Promise.resolve({ r: false, d: null });
    }
}
//------------------------------------------------
const invokeAwaitFn = (fnName, data) => {
    return new Promise((resolve) => {
        if (!awaitFnsInProg.includes(fnName)) {
            awaitFnsInProg.push(fnName);
            const awaitFnLoop = setInterval(() => {
                if (!awaitFnsInProg.includes(fnName)) {
                    clearInterval(awaitFnLoop);
                    resolve(true);
                }
                ;
            }, 250);
            let iAFParamsArr = [fnName];
            if (data) {
                iAFParamsArr.push(data);
            }
            ;
            wcWindow.webContents.send('invokeAwaitFn', iAFParamsArr);
        }
        else {
            resolve(false);
        }
        ;
    });
};
//------------------------------------------------
electron_1.ipcMain.on('openExtWebURL', (e, args) => {
    electron_1.shell.openExternal(args[0]);
});
//------------------------------------------------
async function awaitMWQuickSaves() {
    let qsResCount = 0, mwTryCount = moreWinDeets.length, qsINT, qsTO = 10, qsC = 0;
    return new Promise((resolve) => {
        qsINT = setInterval(() => { qsC++; if (qsC < qsTO) {
            if (qsResCount >= mwTryCount) {
                console.log('awaitMWQuickSaves - FINISHED OK!');
                resolve(true);
            }
        }
        else {
            console.log('awaitMWQuickSaves - !TIMEOUT!');
            clearInterval(qsINT);
            resolve(false);
        } }, 200);
        electron_1.ipcMain.on('mwQuickSaveDone', () => { qsResCount++; });
        for (let mwdi = 0; mwdi < moreWinDeets.length; mwdi++) {
            try {
                if (moreWins[mwdi] && moreWins[mwdi].webContents) {
                    moreWins[mwdi].webContents.send('mwQuickSave');
                }
            }
            catch (e) {
                qsResCount++;
            }
        }
        ;
    });
}
//////////////////////////////////////////////////
// ELECTRON MAIN FUNCTION
//////////////////////////////////////////////////
try {
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.once('ready', () => {
        electron_1.session.defaultSession.webRequest.onBeforeRequest({ urls: ['https://embed.twitch.tv/*channel=*'] }, (d, cb) => {
            let redirectURL = d.url, params = new URLSearchParams(redirectURL.replace('https://embed.twitch.tv/', ''));
            if (params.get('parent') != '') {
                cb({});
                return;
            }
            ;
            params.set('parent', 'locahost');
            params.set('referrer', 'https://localhost/');
            redirectURL = 'https://embed.twitch.tv/?' + params.toString();
            cb({ cancel: false, redirectURL });
        });
        electron_1.session.defaultSession.webRequest.onHeadersReceived({ urls: ['https://www.twitch.tv/*', 'https://player.twitch.tv/*', 'https://embed.twitch.tv/*'] }, (d, cb) => {
            let responseHeaders = d.responseHeaders;
            delete responseHeaders['Content-Security-Policy'];
            cb({ cancel: false, responseHeaders });
        });
        initApp();
        scs(true);
    });
    if (process.platform === 'win32') {
        electron_1.app.on('ready', () => { electron_1.app.setAppUserModelId('dev.zer0ne.wificue'); });
    }
    ;
    electron_1.app.on('browser-window-focus', () => { scs(true); checkRealVis(); mainEvCons('a', 'browser-window-focus'); });
    electron_1.app.on('browser-window-blur', () => { checkRealVis(); mainEvCons('a', 'browser-window-blur'); });
    electron_1.app.on('web-contents-created', () => { mainEvCons('a', 'web-contents-created'); });
    electron_1.app.on('window-all-closed', () => { mainEvCons('a', 'window-all-closed'); electron_1.app.quit(); });
    electron_1.app.on('before-quit', async (e) => {
        try {
            termAppInProg = true;
            e.preventDefault();
            await invokeAwaitFn('doQuickSaveData');
            const xConf = await closeConf();
            if (xConf) {
                await awaitMWQuickSaves();
                if (wcWindow && wcWindow.webContents) {
                    wcWindow.webContents.send('quickKillKeyPadListener');
                }
                ;
                if (io) {
                    io.emit('serverStatus', [{ id: svrUUID, hostname: netInfo.info.pc, ip: svrInfo.ip, online: false, time: new Date() }]);
                }
                electron_1.app.exit();
            }
            else {
                return;
            }
            ;
        }
        catch (e) {
            e = e;
        }
        ;
    });
    electron_1.app.on('quit', () => { return; });
    electron_1.app.on('will-quit', () => { electron_1.app.exit(); });
}
catch (e) {
    availCons('baseInit', 'ERROR: ' + e);
}
;
//////////////////////////////////////////////////
// MAIN START/INIT FUNCTIONS
//////////////////////////////////////////////////
async function initApp() {
    // IMMEDIATE
    reqDTLFX('get', 'started');
    await initData();
    await getNetInfo();
    await initSocket();
    await initCUESDK();
    await initWLED();
    await z1bOnline();
    const kIRes = await initKodiAPI();
    if (kIRes.kodi) {
        hasKodi = true;
        if (!kIRes.auth) {
            promptKUPs = true;
        }
        else {
            startKodiService();
        }
    }
    ;
    if (!wcWindow) {
        electron_1.ipcMain.once('homeInitsDone', async () => { delayedInits(); });
        await initWindow();
    }
    ;
    if (!wcDevTools && wcMode === 'dev') {
        await initDevTools();
    }
    ;
    if (!wcTray) {
        await initTray();
    }
    ;
    if (!cmOpts) {
        await cmBuild();
        contextMenu(cmOpts);
    }
    else {
        contextMenu(cmOpts);
    }
    ;
}
//////////////////////////////////////////////////
function delayedInits() {
    availCons('delayedInits', 'Running in 10s...');
    setTimeout(async () => {
        // Z1BOX SERVER
        startZ1BoxListener();
        // NOTIFS & LOCATION FENCE
        startNotifListener();
        toggleDeviceNetStatDetect();
        // HWINFO
        startHWInfo();
        // MOTION SENSORS
        if (pirsPower) {
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('homePIRCountMaxTimeS', [pirCountMaxTimeS]);
            }
            ;
            if (pirsOnline[1]) {
                let setWCIndexNames = [];
                setWCIndexNames.push({ i: (wleds.findIndex((wc) => wc.info.name === 'Zer0WLED4')), n: 'Zer0WLED4' });
                if (!wledGroupSyncOn) {
                    setWCIndexNames.push({ i: (wleds.findIndex((wc) => wc.info.name === 'Zer0WLED5')), n: 'Zer0WLED5' });
                }
                ;
                for (let swi = 0; swi < setWCIndexNames.length; swi++) {
                    adjustWLEDBright(1, wledGroupSyncOn, setWCIndexNames[swi].i, setWCIndexNames[swi].n);
                    await doW(0.5);
                }
                ;
            }
            ;
        }
        ;
        // ADB/PHONE
        const firstPC = await doPhoneConnect();
        if (firstPC) {
            const phDSInfo = await getPhoneDSInfo();
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('phoneDSInfoData', [phDSInfo]);
            }
            ;
        }
        ;
        doPhonePop();
        setInterval(async () => {
            const isPhConn = await doPhoneConnect();
            if (isPhConn) {
                const phDSInfo = await getPhoneDSInfo();
                if (wcWindow && wcWindow.webContents) {
                    wcWindow.webContents.send('phoneDSInfoData', [phDSInfo]);
                }
                ;
            }
            ;
        }, 120000);
        // Z1Box Data Sends
        await z1bOnline();
        if (z1bOnline) {
            z1bWeather();
        }
        ;
        await initZ1BMQTT();
    }, 3500);
}
;
//////////////////////////////////////////////////
// MAIN CLOSE/EXIT FUNCTIONS
//////////////////////////////////////////////////
async function closeConf() {
    const doKillTwtSVR = async () => { try {
        await killTwtSVR.terminate();
        twtSVR = null;
        killTwtSVR = null;
        return Promise.resolve(true);
    }
    catch (e) {
        return Promise.resolve(false);
    } };
    const doKillNLSVR = async () => { try {
        await killNoteListenSVR.terminate();
        noteListenSVR = null;
        killNoteListenSVR = null;
        return Promise.resolve(true);
    }
    catch (e) {
        return Promise.resolve(false);
    } };
    const doQuitConf = async () => { const doQuit = (await electron_1.dialog.showMessageBox(electron_1.BrowserWindow.getFocusedWindow(), { icon: natIco('wcicon.png'), title: 'Exit wifiCUE?', message: 'Exit/Close wifiCUE - Are you sure?', type: 'question', buttons: ['Cancel', 'Exit'], defaultId: 0, cancelId: 1 })).response; if (doQuit === 1) {
        return Promise.resolve(false);
    }
    else {
        return Promise.resolve(true);
    } };
    //------------
    const quitConfRes = await doQuitConf();
    if (quitConfRes) {
        return Promise.resolve(false);
    }
    else {
        scs(false);
        reqDTLFX('get', 'stopped');
        if (twtSVR) {
            await doKillTwtSVR();
        }
        ;
        if (noteListenSVR) {
            await doKillNLSVR();
        }
        ;
        if (svrSVR) {
            await killSVR();
        }
        ;
        if (mdSVR) {
            await killMDSVR();
        }
        ;
        if (z1bSVR) {
            await killZ1BoxSVR();
        }
        ;
        if (wcBonInst) {
            await killBon();
        }
        ;
        if (hwiINT) {
            clearInterval(hwiINT);
        }
        ;
        if (rssiINT) {
            clearInterval(rssiINT);
        }
        ;
        if (setCUEDefDevList.length > 0) {
            await killICUE();
        }
        ;
        return Promise.resolve(true);
    }
    ;
}
///////////////////////////////////////////////////
// NETWORK CONFIG FUNCTIONS
///////////////////////////////////////////////////
const getNetClients = async () => {
    const matchSubNet = netInterface.gateway.substring(0, netInterface.gateway.length - 1);
    const exec = require('child_process').exec;
    const getMIs = async () => {
        return new Promise((resolve) => {
            exec('powershell.exe -Command "arp -a"', (error, stdout, stderr) => {
                let ipMacDevs = [];
                if (error || stderr || !stdout) {
                    return Promise.resolve(false);
                }
                else {
                    const rawLines = stdout.split('\n');
                    if (rawLines.length > 0) {
                        for (let i = 0; i < rawLines.length; i++) {
                            const rL = rawLines[i].trim();
                            if (rL.length > 0 && !rL.includes('Interface: ') && !rL.includes('Internet Address')) {
                                const dP = rL.trim().split(/\s+/);
                                if (dP.length > 0) {
                                    if (dP[0].includes(matchSubNet)) {
                                        ipMacDevs.push({ name: '?', ip: dP[0], mac: dP[1] });
                                    }
                                    ;
                                }
                                ;
                            }
                            ;
                        }
                        ;
                        resolve(ipMacDevs);
                    }
                    else {
                        resolve(false);
                    }
                    ;
                }
                ;
            });
        });
    };
    const gNMIPResRaw = await getMIs();
    let gFindRes = await find({ skipNameResolution: false });
    if (gNMIPResRaw) {
        const gNMIPRes = _.uniqBy(gNMIPResRaw, 'ip').filter(c => c.ip.split('.')[3] !== '255');
        if (gFindRes && gFindRes.length > 0) {
            for (let gFI = 0; gFI < gFindRes.length; gFI++) {
                const gFO = gFindRes[gFI], gMIndex = gNMIPRes.findIndex((gMO) => gMO.ip === gFO.ip);
                if (gMIndex !== -1 && gFO.name.trim().length > 0) {
                    gNMIPRes[gMIndex].name = gFO.name;
                }
                ;
            }
            ;
            for (let gMI = 0; gMI < gNMIPRes.length; gMI++) {
                const dName = gNMIPRes[gMI].name;
                if (dName === '?' || dName.trim().length < 1) {
                    if (gNMIPRes[gMI].ip.split('.')[3] === '1') {
                        gNMIPRes[gMI].name = 'Network Router';
                    }
                    else {
                        gNMIPRes[gMI].name = 'Device #' + String(gMI + 1);
                    }
                }
                ;
            }
            ;
            netClients = gNMIPRes;
            return Promise.resolve(gNMIPRes);
        }
        else {
            for (let gMI = 0; gMI < gNMIPRes.length; gMI++) {
                if (gNMIPRes[gMI].ip.split('.')[3] === '1') {
                    gNMIPRes[gMI].name = 'Network Router';
                }
                else {
                    gNMIPRes[gMI].name = 'Device #' + String(gMI + 1);
                }
            }
            ;
            netClients = gNMIPRes;
            return Promise.resolve(gNMIPRes);
        }
        ;
    }
    else {
        if (gFindRes && gFindRes.length > 0) {
            for (let gFI = 0; gFI < gFindRes.length; gFI++) {
                if (gFindRes[gFI].name.trim().length < 1) {
                    if (gFindRes[gFI].ip.split('.')[3] === '1') {
                        gFindRes[gFI].name = 'Network Router';
                    }
                    else {
                        gFindRes[gFI].name = 'Device #' + String(gFI + 1);
                    }
                }
                ;
            }
            ;
            netClients = gFindRes;
            return Promise.resolve(gFindRes);
        }
        else {
            netClients = [];
            return Promise.resolve([]);
        }
        ;
    }
    ;
};
//-------------------------------------------------
const getNetInfo = async () => {
    const setNetInt = () => {
        const exec = require('child_process').exec;
        return new Promise((resolve) => {
            exec('powershell.exe -Command "(Get-WMIObject win32_computersystemproduct) | Select UUID"', (errorUUID, stdoutUUID, stderrUUID) => {
                if (errorUUID) {
                    availCons('getNetInfo|setNetInt', String(errorUUID));
                    availCons('getNetInfo|setNetInt', String(errorUUID));
                    netInterface.error = true;
                    resolve(false);
                }
                else {
                    if (!stdoutUUID || stdoutUUID.trim().length === 0) {
                        netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                        resolve(false);
                    }
                    else {
                        let finalUUID = '';
                        const sOutUUID = stdoutUUID.split('\n').filter(l => !l.includes('UUID') && !l.includes('--') && l.trim().length > 0)[0].replace(/-/g, '').substring(0, 16);
                        if (sOutUUID && sOutUUID.length === 16) {
                            finalUUID = sOutUUID;
                        }
                        else {
                            finalUUID = crypto.randomBytes(20).toString('hex');
                        }
                        ;
                        svrUUID = finalUUID;
                        exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select Name"', (errorName, stdoutName, stderrName) => {
                            if (errorName) {
                                availCons('getNetInfo|setNetInt', String(errorName));
                                availCons('getNetInfo|setNetInt', String(errorName));
                                netInterface.error = true;
                                resolve(false);
                            }
                            else {
                                if (!stdoutName || stdoutName.trim().length === 0) {
                                    netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                    resolve(false);
                                }
                                else {
                                    const sOutOSName = stdoutName.split('|')[0].split('\n').filter(l => !l.includes('Name') && !l.includes('--') && !l.includes('\r'))[0];
                                    exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select Version"', (errorVer, stdoutVer, stderrVer) => {
                                        if (errorName) {
                                            availCons('getNetInfo|setNetInt', String(errorVer));
                                            availCons('getNetInfo|setNetInt', String(errorVer));
                                            netInterface.error = true;
                                            resolve(false);
                                        }
                                        else {
                                            if (!stdoutVer || stdoutName.trim().length === 0) {
                                                netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                                resolve(false);
                                            }
                                            else {
                                                const sOutOSVer = stdoutVer.trim().split('\n').filter(l => !l.includes('Version') && !l.includes('--') && !l.includes('\r'))[0];
                                                exec('powershell.exe -Command "(Get-WMIObject win32_operatingsystem) | Select OSArchitecture"', (errorArch, stdoutArch, stderrArch) => {
                                                    if (errorName) {
                                                        availCons('getNetInfo|setNetInt', String(errorArch));
                                                        availCons('getNetInfo|setNetInt', String(errorArch));
                                                        netInterface.error = true;
                                                        resolve(false);
                                                    }
                                                    else {
                                                        if (!stdoutArch || stdoutName.trim().length === 0) {
                                                            netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                                            resolve(false);
                                                        }
                                                        else {
                                                            const sOutOSArch = stdoutArch.trim().split('\n').filter(l => !l.includes('OSArchitecture') && !l.includes('--') && !l.includes('\r'))[0];
                                                            exec('powershell.exe -Command "hostname"', (error0, stdout0, stderr0) => {
                                                                if (error0) {
                                                                    availCons('getNetInfo|setNetInt', String(error0));
                                                                    availCons('getNetInfo|setNetInt', String(error0));
                                                                    netInterface.error = true;
                                                                    resolve(false);
                                                                }
                                                                else {
                                                                    if (!stdout0 || stdout0.trim().length === 0) {
                                                                        netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                                                        resolve(false);
                                                                    }
                                                                    else {
                                                                        const sOut0Name = stdout0.trim();
                                                                        exec('powershell.exe -Command "Get-NetConnectionProfile"', (error1, stdout1, stderr) => {
                                                                            if (error1) {
                                                                                availCons('getNetInfo|setNetInt', String(error1));
                                                                                availCons('getNetInfo|setNetInt', String(error1));
                                                                                netInterface.error = true;
                                                                                resolve(false);
                                                                            }
                                                                            else {
                                                                                if (!stdout1 || stdout1.trim().length === 0) {
                                                                                    netInterface = { error: false, active: false, pc: '', os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                                                                    resolve(false);
                                                                                }
                                                                                else {
                                                                                    const sOut1Ls = stdout1.split('\n').filter((l) => l.includes(' : ') && !l.includes('DomainAuthenticationKind')).map((l) => l.split(':')[1].trim());
                                                                                    let newNInt = { error: false, active: true, pc: sOut0Name, os: { name: sOutOSName, version: sOutOSVer, arch: sOutOSArch }, name: sOut1Ls[0], type: sOut1Ls[1], index: Number(sOut1Ls[2]), category: sOut1Ls[3], ip4Conn: sOut1Ls[4], ip6Conn: sOut1Ls[5], ip: '', gateway: '' };
                                                                                    exec('powershell.exe -Command "Get-NetIPConfiguration -InterfaceIndex ' + String(newNInt.index) + '"', (error2, stdout2, stderr) => {
                                                                                        if (error2) {
                                                                                            availCons('getNetInfo|setNetInt|IP', String(error2));
                                                                                            availCons('getNetInfo|setNetInt|IP', String(error2));
                                                                                            netInterface.error = true;
                                                                                            resolve(false);
                                                                                        }
                                                                                        else {
                                                                                            if (!stdout2 || stdout2.trim().length === 0 || stdout2.includes('No MSFT_NetIPInterface')) {
                                                                                                netInterface = { error: false, active: false, pc: sOut0Name, os: null, name: '', type: '', index: -1, category: '', ip4Conn: '', ip6Conn: '', ip: '', gateway: '' };
                                                                                                resolve(false);
                                                                                            }
                                                                                            else {
                                                                                                const sOut2Ls = stdout2.split('\n').filter((l) => l.includes(' : ') && (l.includes('IPv4Address') || l.includes('IPv4DefaultGateway'))).map((l) => l.split(':')[1].trim());
                                                                                                if (sOut2Ls[0].length > 0) {
                                                                                                    newNInt.ip = sOut2Ls[0];
                                                                                                }
                                                                                                else {
                                                                                                    newNInt.ip = '';
                                                                                                }
                                                                                                ;
                                                                                                if (sOut2Ls[1].length > 0) {
                                                                                                    newNInt.gateway = sOut2Ls[1];
                                                                                                }
                                                                                                else {
                                                                                                    newNInt.gateway = '';
                                                                                                }
                                                                                                ;
                                                                                                netInterface = newNInt;
                                                                                                resolve(true);
                                                                                            }
                                                                                            ;
                                                                                        }
                                                                                        ;
                                                                                    });
                                                                                }
                                                                                ;
                                                                            }
                                                                            ;
                                                                        });
                                                                    }
                                                                    ;
                                                                }
                                                                ;
                                                            });
                                                        }
                                                        ;
                                                    }
                                                    ;
                                                });
                                            }
                                            ;
                                        }
                                        ;
                                    });
                                }
                                ;
                            }
                            ;
                        });
                    }
                    ;
                }
                ;
            });
        });
    };
    await setNetInt();
    if (netInterface.ip && netInterface.ip.trim().length > 0) {
        svrInfo.ip = netInterface.ip;
    }
    ;
    availCons('getNetInfo', 'Server IP (svrInfo.ip) set to ' + svrInfo.ip);
    const gncRes = await getNetClients();
    if (gncRes !== false && gncRes.length > 0) {
        const foundIPs = gncRes.map((ncO) => ncO.ip);
        let wasFound = [];
        for (let wi = 0; wi < wledIPs.length; wi++) {
            if (foundIPs.includes(wledIPs[wi])) {
                wasFound.push(wledIPs[wi]);
            }
        }
        ;
        for (let si = 0; si < mSensorIPs.length; si++) {
            if (foundIPs.includes(mSensorIPs[si])) {
                wasFound.push(mSensorIPs[si]);
            }
        }
        ;
        if (wasFound.length < wledIPs.length) {
            console.log('getNetInfo|!!!- Missing ' + (wledIPs.length - wasFound.length) + ' WLED Clients/Sensors - Pinging...');
            const missingIPs = wledIPs.filter((ipStr) => !wasFound.includes(ipStr)).filter((ipStr) => !wasFound.includes(ipStr));
            await doW(0.25);
            await pingMissingIPs(missingIPs);
            await doW(0.25);
            const xtraGNCsRes = await getNetClients();
            if (xtraGNCsRes !== false && xtraGNCsRes.length > gncRes.length) {
                netClients = xtraGNCsRes;
            }
        }
    }
    ;
    netInfo = { info: netInterface, clients: netClients, isListen: isListen, zConf: { name: svrUUID, isUp: wcBonIsUp } };
    return Promise.resolve(netInfo);
};
//////////////////////////////////////////////////
// Z1BOX FUNCTIONS
//////////////////////////////////////////////////
async function initZ1BMQTT() {
    if (z1bMQTTClient && z1bMQTTOnline) {
        return Promise.resolve(true);
    }
    ;
    if (z1bMQTTClient && z1bMQTTClient.connected && !z1bMQTTOnline) {
        z1bMQTTOnline = true;
        return Promise.resolve(true);
    }
    ;
    z1bMQTTClient = mqtt.connect('mqtt://192.168.0.3');
    z1bMQTTClient.on('connect', () => {
        z1bMQTTOnline = true;
        z1bMQTTClient.publish('z1boxwc', '0,0,1');
        availCons('initZ1BMQTT', 'CONNECTED to Broker @ mqtt://192.168.0.3:1883');
        z1bMQTTClient.subscribe('z1box', (err) => {
            if (!err) {
                availCons('initZ1BMQTT', '[SUBSCRIBE] to [z1box] - OK');
            }
            else {
                availCons('initZ1BMQTT', 'ERROR: [SUBSCRIBE] to [z1box] FAILED');
            }
        });
        z1bMQTTClient.subscribe('z1boxwc', (err) => {
            if (!err) {
                availCons('initZ1BMQTT', '[SUBSCRIBE] to [z1boxwc] - OK');
            }
            else {
                availCons('initZ1BMQTT', 'ERROR: [SUBSCRIBE] to [z1boxwc] FAILED');
            }
        });
    });
    z1bMQTTClient.on('disconnect', () => {
        z1bMQTTOnline = false;
        z1bMQTTClient.publish('z1boxwc', '0,0,0');
        availCons('initZ1BMQTT', 'DISCONNECTED from Broker @ mqtt://192.168.0.3:1883');
    });
    z1bMQTTClient.on('message', (t, m) => {
        let d = mqttStr2NoArr(m.toString());
        availCons('z1bMQTT', '[MESSAGE] @ ' + t + ' - ' + m.toString());
        switch (t) {
            case "z1box":
                break;
            case "z1boxwc":
                if (d[0] == 0 && d[1] == 0 && d[2] == -1) {
                    availCons('initZ1BMQTT', 'Sending ONLINE message to z1boxwc (touchRight)');
                    z1bMQTTClient.publish('z1boxwc', '0,0,1');
                }
                else {
                    availCons('initZ1BMQTT', 'Ignoring OWN MSG');
                }
                break;
            default: availCons('initZ1BMQTT', 'Uknown/Unsubscribed Topic: "' + t + '"');
        }
    });
    return Promise.resolve(true);
}
//------------------------------------------------
function mqttStr2NoArr(str) { return str.split(',').map((s) => Number(s)); }
//------------------------------------------------
async function createNewZ1BoxSDataFile(dirOnly) {
    try {
        await (0, promises_1.mkdir)(z1bSDataDir, { recursive: true });
        if (dirOnly && dirOnly === true) {
            return Promise.resolve({ r: true, d: null });
        }
        ;
        let newSDObj = { startScreen: 'home', screenBright: 127, lastUpdate: (0, date_fns_1.getUnixTime)(new Date()) };
        const writeNSDFRes = await writeZ1BoxSDataFile(newSDObj);
        if (writeNSDFRes.r) {
            return Promise.resolve({ r: true, d: null });
        }
        else {
            return Promise.resolve({ r: false, d: 'Failed to Write SDF JSON File' });
        }
        ;
    }
    catch {
        return Promise.resolve({ r: false, d: 'Failed to Create SDF Dir' });
    }
    ;
}
;
//------------------------------------------------
async function writeZ1BoxSDataFile(data) {
    if (!data) {
        return Promise.resolve({ r: false, d: 'No Data Provided' });
    }
    ;
    if (!(await exists(z1bSDataDir))) {
        const cNewSDDRes = await createNewZ1BoxSDataFile(true);
        if (!cNewSDDRes.r) {
            return Promise.resolve({ r: false, d: 'Failed to Create SD Directory' });
        }
    }
    ;
    let updData = data;
    if (typeof updData === 'string') {
        updData = JSON.parse(updData);
    }
    ;
    updData.lastUpdate = (0, date_fns_1.getUnixTime)(new Date());
    const updDataStr = JSON.stringify(data);
    try {
        await (0, promises_1.writeFile)(z1bSDataFile, updDataStr, { encoding: 'utf-8' });
        availCons('writeZ1BoxSDataFile', 'Data File [WRITE] - OK');
        await readZ1BoxSDataFile();
        return Promise.resolve({ r: true, d: null });
    }
    catch (e) {
        e = e;
        return Promise.resolve({ r: false, d: 'Failed to Write SDF' });
    }
}
;
//------------------------------------------------
async function readZ1BoxSDataFile() {
    if (!(await exists(z1bSDataFile))) {
        const cNewSDFRes = await createNewZ1BoxSDataFile();
        if (!cNewSDFRes) {
            return Promise.resolve({ r: false, d: 'Failed to Create New SDF' });
        }
        ;
    }
    ;
    try {
        const rR = await (0, promises_1.readFile)(z1bSDataFile, { encoding: 'utf-8' });
        if (rR && (await isJSON(rR))) {
            z1bSData = JSON.parse(rR);
            availCons('readZ1BoxSDataFile', 'Data File [READ] - OK');
            return Promise.resolve({ r: true, d: rR });
        }
        else {
            return Promise.resolve({ r: false, d: 'Failed to Parse SDF' });
        }
    }
    catch (e) {
        e = e;
        return Promise.resolve({ r: false, d: 'Failed to Read SDF' });
    }
    ;
}
;
//------------------------------------------------
async function muteAudio(tf) {
    return new Promise((resolve) => {
        let toggleStr = '';
        tf ? toggleStr = '/Mute' : toggleStr = '/Unmute';
        const muteSpawn = require('child_process').spawn, muteProc = muteSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe', [toggleStr, '4- USB HIFI AUDIO']);
        muteProc.on('error', (e) => { availCons('muteAudio|' + toggleStr.replace('/', '') + '|FAIL', e); resolve(false); });
        muteProc.on('exit', (c) => { availCons('muteAudio|' + toggleStr.replace('/', '') + '|OK', c); resolve(true); });
    });
}
//------------------------------------------------
async function getMuted() {
    return new Promise((resolve) => {
        let rawResData = '';
        const ismSpawn = require('child_process').spawn, ismProc = ismSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe', ['/Stdout', '/GetMute', '4- USB HIFI AUDIO\\Device\\Speakers\\Render']);
        ismProc.stdout.on('data', (data) => { rawResData += data.toString(); });
        ismProc.on('error', (e) => { availCons('getMuted|FAIL', e); resolve(false); });
        ismProc.on('exit', (c) => {
            if (rawResData && rawResData.length > 0) {
                let ismLinesArr = [];
                let ismResultNo = null;
                if (rawResData.includes('\r\n')) {
                    ismLinesArr = rawResData.split('\r\n');
                }
                else if (rawResData.includes('\n')) {
                    ismLinesArr = rawResData.split('\n');
                }
                else {
                    ismLinesArr.push(rawResData);
                }
                ;
                for (let li = 0; li < ismLinesArr.length; li++) {
                    if (ismLinesArr[li] && ismLinesArr[li].trim().length > 0 && (ismLinesArr[li].trim() === '0' || ismLinesArr[li].trim() === '1')) {
                        ismResultNo = Number(ismLinesArr[li].trim());
                    }
                }
                ;
                if (ismResultNo === 0 || ismResultNo == 1) {
                    resolve(ismResultNo);
                }
                else {
                    resolve(false);
                }
                ;
            }
            else {
                availCons('getAudioSRC|NULL', 'No Audio SRC Data Returned');
                resolve(false);
            }
        });
    });
}
//------------------------------------------------
async function getAudioSRC() {
    return new Promise((resolve) => {
        let rawResData = '', resObj = { status: null, title: null, artist: null };
        const srcSpawn = require('child_process').spawn, srcProc = srcSpawn('powershell.exe', ['C:\\Users\\owenl\\Desktop\\DopeUtils\\asrc.ps1']);
        srcProc.stdout.on('data', (data) => { rawResData += data.toString(); });
        srcProc.on('error', (e) => { availCons('getAudioSRC|FAIL', e); resolve(false); });
        srcProc.on('exit', (c) => {
            if (rawResData && rawResData.length > 0) {
                const rawResLines = rawResData.split('\r\n');
                let resLines = [];
                for (let rli = 0; rli < rawResLines.length; rli++) {
                    if (rawResLines[rli] && rawResLines[rli].trim().length > 0) {
                        resLines.push(rawResLines[rli].trim());
                    }
                }
                ;
                if (resLines.length > 0) {
                    if (resLines[0].replace('status=', '').trim().length > 0) {
                        resObj.status = resLines[0].replace('status=', '').trim();
                    }
                    ;
                    if (resLines[1].replace('title=', '').trim().length > 0) {
                        resObj.title = resLines[1].replace('title=', '').trim();
                    }
                    ;
                    if (resLines[2].replace('artist=', '').trim().length > 0) {
                        resObj.artist = resLines[2].replace('artist=', '').trim();
                    }
                    ;
                    resolve(resObj);
                }
                else {
                    resolve(resObj);
                }
            }
            else {
                resolve(resObj);
            }
        });
    });
}
//------------------------------------------------
async function getVolume() {
    return new Promise((resolve) => {
        let vpResStr = '';
        const vpSpawn = require('child_process').spawn, vpProc = vpSpawn('C:\\Users\\owenl\\Desktop\\DopeUtils\\svcl.exe', ['/Stdout', '/GetPercent', '4- USB HIFI AUDIO\\Device\\Speakers\\Render']);
        vpProc.stdout.on('data', (data) => {
            if (data && data.toString().trim().length > 0) {
                vpResStr += data.toString().trim();
            }
        });
        vpProc.on('error', (e) => { availCons('getVolumePerc|FAIL', e); resolve(false); });
        vpProc.on('exit', (c) => {
            if (vpResStr && vpResStr.length > 0) {
                const vpResNo = Math.round(Number(vpResStr));
                resolve(vpResNo);
            }
            else {
                resolve(false);
            }
            ;
        });
    });
}
//------------------------------------------------
async function z1bVolumeUpd(v) {
    availCons('z1bVolumeUpd', String(v));
    const r = await sendZ1BoxData('audiovol', String(v));
    return Promise.resolve(r);
}
;
//------------------------------------------------
async function z1bMuteUpd(muted) {
    const isMutedStr = (muted === 0 ? 'false' : 'true');
    availCons('z1bMuteUpd', 'MUTED: ' + isMutedStr);
    const r = await sendZ1BoxData('audiomuted', isMutedStr);
    return Promise.resolve(r);
}
;
//------------------------------------------------
async function z1bSRCUpd(src) {
    availCons('z1bSRCUpd', '{status:' + (src.status === null ? 'NULL' : src.status) + ',title:' + (src.title === null ? 'NULL' : src.title) + ',artist:' + (src.artist === null ? 'NULL' : src.artist));
    let newSRCStr = (src.status !== null ? src.status + ' | ' : '') + (src.title !== null ? src.title : '') + (src.artist !== null && src.title !== null ? ' - ' : '') + (src.artist !== null ? src.artist : '');
    newSRCStr = truncSRCStr(newSRCStr);
    if (newSRCStr.length < 1) {
        newSRCStr = '-';
    }
    ;
    const r = await sendZ1BoxData('audiosrc', newSRCStr);
    return Promise.resolve(r);
}
//------------------------------------------------
function truncSRCStr(info) { if (info.length > 36) {
    return info.substring(0, 36) + '...';
} ; return info; }
//------------------------------------------------
async function checkZ1BoxAudioInfo(alwaysSend) {
    let vVal, mVal, sVal, vUpd = false, mUpd = false, sUpd = false, chgCount = 0;
    vVal = await getVolume();
    if (vVal !== false) {
        if (vVal !== z1bVolVal || alwaysSend) {
            z1bVolVal = vVal;
            vUpd = true;
            chgCount++;
        }
    }
    ;
    mVal = await getMuted();
    if (mVal !== false) {
        if (mVal !== z1bMuteVal || alwaysSend) {
            z1bMuteVal = mVal;
            mUpd = true;
            chgCount++;
        }
    }
    ;
    sVal = await getAudioSRC();
    if (sVal !== false) {
        if (!_.isEqual(sVal, z1bSRCVal) || alwaysSend) {
            z1bSRCVal = sVal;
            sUpd = true;
            chgCount++;
        }
    }
    ;
    if (vUpd || mUpd || sUpd) {
        let cS = (alwaysSend ? '+++ alwaysSend +++ ' : '') + '[' + String(chgCount) + '] Change' + (chgCount > 1 ? 's' : '') + ' - ';
        if (vUpd) {
            await z1bVolumeUpd(z1bVolVal);
            await doW(0.25);
            cS += '(!)';
        }
        ;
        cS += 'Volume:' + String(z1bVolVal) + ',';
        if (mUpd) {
            await z1bMuteUpd(z1bMuteVal);
            await doW(0.25);
            cS += '(!)';
        }
        ;
        cS += 'Muted:' + (z1bMuteVal === 1 ? 'true' : 'false') + ',';
        if (sUpd) {
            await z1bSRCUpd(z1bSRCVal);
            cS += '(!)';
        }
        ;
        let newSRCStr = (z1bSRCVal.status !== null ? z1bSRCVal.status + ' | ' : '') + (z1bSRCVal.title !== null ? z1bSRCVal.title : '') + (z1bSRCVal.artist !== null && z1bSRCVal.title !== null ? ' - ' : '') + (z1bSRCVal.artist !== null ? z1bSRCVal.artist : '');
        newSRCStr = truncSRCStr(newSRCStr);
        if (newSRCStr.length < 1) {
            newSRCStr = '-';
        }
        ;
        cS += 'Source:' + newSRCStr;
        availCons('checkZ1BoxAudioInfo', cS);
    }
    ;
}
//------------------------------------------------
let checkAudioInfoINT = null;
async function z1bAudioEventsToggle(onOff) {
    if (onOff === 'on' && !z1bAudioEVListen) {
        if (checkAudioInfoINT === null) {
            checkAudioInfoINT = setInterval(async () => {
                checkZ1BoxAudioInfo(false);
            }, 5000);
        }
        ;
        z1bAudioEVListen = true;
    }
    ;
    if (onOff === 'off' && z1bAudioEVListen) {
        if (checkAudioInfoINT) {
            clearInterval(checkAudioInfoINT);
            checkAudioInfoINT = null;
        }
        ;
        z1bAudioEVListen = false;
    }
    ;
    return Promise.resolve(true);
}
//------------------------------------------------
function startZ1BoxListener() {
    availCons('startZ1BoxListener', '()...');
    try {
        z1bSVR = http.createServer(async (req, res) => {
            const reqIP4 = req.socket.remoteAddress.replace('::ffff:', '').trim();
            if (reqIP4.startsWith('192.168.0.')) {
                if (req.method.toLocaleLowerCase() === 'get') {
                    availCons('Z1BoxListener|GET|Request', req.headers.z1box.toString());
                    if (req.headers.hasOwnProperty('z1box') && (req.headers.z1box.toString() === 'home' || req.headers.z1box.toString() === 'settings' || req.headers.z1box.toString() === 'lights' || req.headers.z1box.toString() === 'system' || req.headers.z1box.toString() === 'music')) {
                        const navStr = req.headers.z1box.toString();
                        if (z1bCurrentScreen !== navStr) {
                            z1bCurrentScreen = navStr;
                            availCons('z1boxListener|NAV', 'Moved to ' + navStr.toUpperCase());
                            if (navStr === 'music') {
                                await z1bAudioEventsToggle('on');
                                if (!dtlfxIsLive && z1bConfigName !== 'z1bonly') {
                                    doStartDTLFXEXE(true);
                                }
                                ;
                            }
                            else {
                                await z1bAudioEventsToggle('off');
                            }
                            ;
                            if (navStr === 'home') {
                                if (z1TimeINT === null) {
                                    z1TimeINT = setInterval(() => { if (z1bIsOnline) {
                                        if (z1bCurrentScreen === 'home') {
                                            sendZ1BoxData('time');
                                        }
                                    }
                                    else {
                                        z1bOnline();
                                    } }, 60000);
                                }
                                ;
                                if (z1WeatherINT === null) {
                                    z1WeatherINT = setInterval(() => { if (z1bIsOnline) {
                                        if (z1bCurrentScreen === 'home') {
                                            z1bWeather();
                                        }
                                    }
                                    else {
                                        z1bOnline();
                                    } }, 900000);
                                }
                                ;
                            }
                            else {
                                if (z1TimeINT !== null) {
                                    clearInterval(z1TimeINT);
                                    z1TimeINT = null;
                                }
                                ;
                                if (z1WeatherINT !== null) {
                                    clearInterval(z1WeatherINT);
                                    z1WeatherINT = null;
                                }
                                ;
                            }
                        }
                        ;
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end('OK');
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'audioinfo') {
                        checkZ1BoxAudioInfo(true);
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end('OK');
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'audiounmute') {
                        const amRes = await muteAudio(false);
                        if (amRes) {
                            res.writeHead(200, 'Mute', { 'Content-Type': 'application/json' });
                            res.end('OK');
                        }
                        else {
                            res.writeHead(400, 'Mute', { 'Content-Type': 'application/json' });
                            res.end('ERROR');
                        }
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'audiomute') {
                        const amRes = await muteAudio(true);
                        if (amRes) {
                            res.writeHead(200, 'Mute', { 'Content-Type': 'application/json' });
                            res.end('OK');
                        }
                        else {
                            res.writeHead(400, 'Mute', { 'Content-Type': 'application/json' });
                            res.end('ERROR');
                        }
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'getsavedata') {
                        let gsdRes = { r: false, d: 'Unknown Error' };
                        if (z1bSData !== null) {
                            gsdRes = { r: true, d: (JSON.stringify(z1bSData)) };
                        }
                        else {
                            gsdRes = await readZ1BoxSDataFile();
                        }
                        ;
                        res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(gsdRes));
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'dosavedata' && req.headers.hasOwnProperty('savedata') && req.headers.savedata.toString().length > 0 && req.headers.savedata.toString().includes(':')) {
                        availCons('z1bREQ|DOSAVEDATA', 'Received Save Data Request');
                        let existSD = z1bSData;
                        if (!existSD) {
                            const readRes = await readZ1BoxSDataFile();
                            if (!readRes.r) {
                                res.writeHead(400, readRes.d, { 'Content-Type': 'text/html' });
                                res.end();
                            }
                            else {
                                existSD = JSON.parse(readRes.d);
                            }
                            ;
                        }
                        ;
                        availCons('oldData', existSD);
                        const sDPropsArr = req.headers.savedata.toString().split('=')[0].split(':');
                        availCons('', sDPropsArr);
                        const sDValue = req.headers.savedata.toString().split('=')[1];
                        availCons('', sDValue);
                        if (sDPropsArr.length > 5) {
                            res.writeHead(400, 'SD Prop Value Too Deep', { 'Content-Type': 'text/html' });
                            res.end();
                        }
                        else {
                            if (sDPropsArr.length === 1) {
                                existSD[sDPropsArr[0]] = sDValue;
                            }
                            else if (sDPropsArr.length === 2) {
                                existSD[sDPropsArr[0]][sDPropsArr[1]] = sDValue;
                            }
                            else if (sDPropsArr.length === 3) {
                                existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]] = sDValue;
                            }
                            else if (sDPropsArr.length === 4) {
                                existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]][sDPropsArr[3]] = sDValue;
                            }
                            else if (sDPropsArr.length === 5) {
                                existSD[sDPropsArr[0]][sDPropsArr[1]][sDPropsArr[2]][sDPropsArr[3]][sDPropsArr[4]] = sDValue;
                            }
                            availCons('', existSD);
                            res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                            res.end();
                        }
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'time') {
                        sendZ1BoxData('time');
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end();
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'color') {
                        let z1boxcolorStr = String(z1bColor[0]) + ',' + String(z1bColor[1]) + ',' + String(z1bColor[2]);
                        if (z1bMQTTOnline) {
                            z1bMQTTClient.publish('z1boxcolor', z1boxcolorStr);
                        }
                        ;
                        //sendZ1BoxData('color',z1bColor);
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end();
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'weather') {
                        z1bWeather();
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end();
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'online') {
                        res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
                        res.end();
                    }
                    else if (req.headers.hasOwnProperty('z1box') && req.headers.z1box.toString() === 'systeminfo') {
                        let hwinfoObj = {};
                        if (z1bHWInfo !== false) {
                            hwinfoObj = {
                                mb: { fan: Number(z1bHWInfo.mb.fan.v), temp: Number(z1bHWInfo.mb.temp.v) },
                                cpu: { temp: Number(z1bHWInfo.cpu.temp.v), load: Number(z1bHWInfo.cpu.load.v) },
                                gpu1: { fan: Number(z1bHWInfo.gpu1.fan.v), temp: Number(z1bHWInfo.gpu1.temp.v), load: Number(z1bHWInfo.gpu1.load.v) },
                                gpu2: { temp: Number(z1bHWInfo.gpu2.temp.v), load: Number(z1bHWInfo.gpu2.load.v) },
                                cfan1: Number(z1bHWInfo.cfans.v[0]),
                                cfan2: Number(z1bHWInfo.cfans.v[1]),
                                cfan3: Number(z1bHWInfo.cfans.v[2]),
                                cfan4: Number(z1bHWInfo.cfans.v[3]),
                                cfan5: Number(z1bHWInfo.cfans.v[4]),
                                cfan6: Number(z1bHWInfo.cfans.v[5]),
                                pump: { rpm: Number(z1bHWInfo.pump.rpm.v), temp: (z1bHWInfo.pump.hasOwnProperty('temp') && z1bHWInfo.pump.temp && z1bHWInfo.pump.temp.hasOwnProperty('v') && z1bHWInfo.pump.temp.v ? Number(z1bHWInfo.pump.temp.v) : 0) }
                            };
                        }
                        ;
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(200);
                        console.log('HWINFO:');
                        const hwRes = JSON.stringify(hwinfoObj);
                        console.log(hwRes);
                        res.end(hwRes);
                    }
                    else if (req.headers.z1box.toString() === 'lights') {
                        res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ r: false, d: null }));
                    }
                }
            }
        }).listen(1313);
        killZ1BSVR = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: z1bSVR });
        availCons('startZ1BoxListener', 'Z1BSVR Running @ http://localhost:1313');
    }
    catch (e) {
        availCons('startZ1BoxListener', 'ERROR: ' + e);
    }
}
;
//------------------------------------------------
async function z1bOnline() {
    try {
        const { status, data } = await axios_1.default.get('http://192.168.0.112', { timeout: 3000 });
        if (status === 200 && data.toString() === 'Zer0Box says Hurroz!') {
            z1bIsOnline = true;
            return Promise.resolve(true);
        }
        else {
            z1bIsOnline = false;
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        e = e;
        return Promise.resolve(false);
    }
}
//------------------------------------------------
async function z1bWeather() {
    try {
        const { status, data } = await axios_1.default.get('http://reg.bom.gov.au/fwo/IDW60901/IDW60901.94614.json', { timeout: 3000, responseType: 'json', headers: { 'Content-Type': 'application/json' } });
        if (status === 200 && data) {
            const wProps = ['apparent_t', 'air_temp', 'rel_hum', 'wind_dir', 'wind_spd_kmh'];
            const rO = data.observations.data[0];
            const nO = { temp: Math.ceil(rO[wProps[1]]), feels: Math.ceil(rO[wProps[0]]), hum: Math.ceil(rO[wProps[2]]), wind_dir: rO[wProps[3]], wind_spd: Math.ceil(rO[wProps[4]]) };
            z1bWeatherObj = nO;
            sendZ1BoxData('weather', z1bWeatherObj);
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        e = e;
        return Promise.resolve(false);
    }
}
//------------------------------------------------
function color2RGB565(rgbArr) {
    const hex = rgb2Hex(rgbArr);
    var r = parseInt("0x" + hex[1] + hex[2]), g = parseInt("0x" + hex[3] + hex[4]), b = parseInt("0x" + hex[5] + hex[6]), rgb565 = (((r & 0xf8) << 8) + ((g & 0xfc) << 3) + ((b & 0xf8) >> 3)).toString(16);
    while (rgb565.length < 4) {
        rgb565 = "0" + rgb565;
    }
    ;
    return "0x" + rgb565.toUpperCase();
}
;
//------------------------------------------------
function rgb2Hex(rgbArr) { return "#" + ((1 << 24) + (rgbArr[0] << 16) + (rgbArr[1] << 8) + rgbArr[2]).toString(16).slice(1); }
;
//------------------------------------------------
async function sendZ1BoxData(type, data) {
    let z1bParam, z1bData, isInvalid = false;
    switch (type) {
        case 'lfxonoff':
            z1bParam = 'z1LFXOnOff';
            z1bData = data;
            break;
        case 'audiosrc':
            z1bParam = 'z1AudioSRC';
            z1bData = data;
            break;
        case 'audiomuted':
            z1bParam = 'z1AudioMuted';
            z1bData = data;
            break;
        case 'audiovol':
            z1bParam = 'z1AudioVol';
            z1bData = data;
            break;
        case 'sleep':
            z1bParam = 'z1Sleep';
            z1bData = true;
            break;
        case 'wake':
            z1bParam = 'z1Wake';
            z1bData = true;
            break;
        case 'weather':
            if (!data) {
                isInvalid = true;
            }
            else {
                z1bParam = 'z1Weather';
                z1bData = Object.values(data).join(',');
            }
            ;
            break;
        case 'time':
            const nowDate = new Date(), strTime = (0, date_fns_1.format)(nowDate, 'hh:mm');
            z1bParam = 'z1Time';
            z1bData = strTime;
            break;
        case 'color':
            if (!data) {
                isInvalid = true;
            }
            else {
                z1bParam = 'z1Color';
                z1bData = String(data[0]) + ',' + String(data[1] + ',' + String(data[2]));
            }
            ;
            break;
        default: return Promise.resolve(true);
    }
    ;
    //------------
    let baseDStr = 'http://192.168.0.112/get?z1box=true&';
    if (isInvalid) {
        return Promise.resolve(false);
    }
    else {
        if (typeof z1bData === 'string') {
            z1bData = encodeURIComponent(z1bData);
        }
        ;
        baseDStr += z1bParam + '=' + z1bData;
        try {
            availCons('sendZ1BoxData|' + type, baseDStr);
            await axios_1.default.get(baseDStr);
            z1bIsOnline = true;
            return Promise.resolve(true);
        }
        catch (e) {
            e = e;
            z1bIsOnline = false;
            return Promise.resolve(false);
        }
        ;
    }
}
//------------------------------------------------
async function pingMissingIPs(missIPs) {
    const exec = require('child_process').exec;
    const arpPing = async (ip) => { return new Promise((resolve) => { exec('powershell.exe -Command "ping ' + ip + ' -n 1"', async (e, stdo, stde) => { await doW(0.5); exec('powershell.exe -Command "arp -a -N ' + ip + '"', async (e, stdo, stde) => { await doW(0.5); exec('powershell.exe -Command "ping ' + ip + ' -n 1"', async (e, stdo, stde) => { await doW(0.5); resolve(true); }); }); }); }); };
    //------------
    for (let mi = 0; mi < missIPs.length; mi++) {
        await arpPing(missIPs[mi]);
        await doW(0.25);
    }
    ;
    return Promise.resolve(true);
}
//////////////////////////////////////////////////
// APP/MODULE FILESYSTEM FUNCTIONS
//////////////////////////////////////////////////
async function initData() {
    const mkPrefsDir = async () => { try {
        await (0, promises_1.mkdir)(wcDataDirPath, { recursive: true });
        return Promise.resolve(true);
    }
    catch {
        return Promise.resolve(false);
    } };
    const doInitFail = () => { availCons('initData', 'ERROR: Failed to Init WC Prefs File'); availCons('initData', 'ERROR: Failed to Init WC Prefs File'); return Promise.resolve(true); };
    const doInitOK = () => { availCons('initData', 'Init WC Prefs File - OK'); availCons('initData', 'Init WC Prefs File - OK'); return Promise.resolve(true); };
    if ((!await exists(wcDataDirPath))) {
        await mkPrefsDir();
        availCons('initData', 'Created Missing WC Prefs Dir - OK');
        availCons('initData', 'Created Missing WC Prefs Dir - OK');
    }
    ;
    if ((!await exists(wcDataFilePath)) || !(await statSize(wcDataFilePath)).r) {
        availCons('initData', 'Missing WC Prefs File - Creating Default...');
        availCons('initData', 'Missing WC Prefs File - Creating Default...');
        await writeDataFile(appTypes_1.defWCData);
        if (await exists(wcDataFilePath) && (await statSize(wcDataFilePath)).r) {
            const checkRead = await readDataFile();
            if (checkRead) {
                await doInitOK();
                return Promise.resolve(true);
            }
            else {
                await doInitFail();
                return Promise.resolve(false);
            }
        }
        else {
            await doInitFail();
            return Promise.resolve(false);
        }
        ;
    }
    else {
        const checkRead = await readDataFile();
        if (checkRead) {
            await doInitOK();
            return Promise.resolve(true);
        }
        else {
            await doInitFail();
            return Promise.resolve(false);
        }
        ;
    }
    ;
}
//////////////////////////////////////////////////
// WC WINDOW FUNCTIONS
//////////////////////////////////////////////////
async function initWindow() {
    const displaySize = electron_1.screen.getPrimaryDisplay().workAreaSize;
    if (!_.isEqual(wcData.wcWinSizePos.display, displaySize)) {
        wcData.wcWinSizePos.display = displaySize;
        if (displaySize.width < 300) {
            wcData.wcWinSizePos.width = 240;
        }
        else {
            wcData.wcWinSizePos.width = 300;
        }
        ;
        if ((displaySize.height / 2) < 48) {
            wcData.wcWinSizePos.height = 48;
        }
        else {
            wcData.wcWinSizePos.height = displaySize.height / 2;
        }
        ;
        wcData.wcWinSizePos.x = (displaySize.width - wcData.wcWinSizePos.width) + 6;
        wcData.wcWinSizePos.y = (displaySize.height - wcData.wcWinSizePos.height) + 6;
        await writeDataFile(wcData);
    }
    ;
    wcWindowOpts.maxWidth = displaySize.width;
    wcWindowOpts.maxHeight = displaySize.height;
    wcWindowOpts.width = wcData.wcWinSizePos.width;
    wcWindowOpts.height = wcData.wcWinSizePos.height;
    wcWindowOpts.x = wcData.wcWinSizePos.x;
    wcWindowOpts.y = wcData.wcWinSizePos.y;
    wcWindow = new electron_1.BrowserWindow(wcWindowOpts);
    let pathIndex = './index.html';
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';
    }
    ;
    const url = new URL(path.join('file:', __dirname, pathIndex));
    wcWindow.loadURL(url.href);
    wcWindow.on('resized', async () => { await winSizePosCalcs(); });
    wcWindow.on('moved', async () => { await winSizePosCalcs(); });
    return Promise.resolve(wcWindow);
}
;
//--------------------------------------------------
const checkRealVis = () => { setTimeout(() => { wcWindow.isMinimized() || !wcWindow.isVisible() ? showLEDPollTo.server = false : showLEDPollTo.server = true; }, 500); };
//--------------------------------------------------
function winCtrl(action) {
    if (!electron_1.app || !wcWindow) {
        return;
    }
    else {
        if (action === 'exit') {
            electron_1.app.quit();
        }
        else if (action === 'close') {
            wcWindow.hide();
        }
        else if (action === 'min') {
            wcWindow.minimize();
        }
        else if (action === 'show') {
            doWCFocusFn();
        }
    }
}
;
//-------------------------------------------------
function doWCFocusFn(sendEvStr) { if (wcWindow) {
    wcWindow.show();
    wcWindow.moveTop();
    wcWindow.focus();
    if (sendEvStr) {
        wcWindow.webContents.send(sendEvStr);
    }
} }
;
//-------------------------------------------------
async function winSizePosCalcs() {
    const nS = wcWindow.getSize();
    let nP = wcWindow.getPosition();
    let fixPos = { x: nP[0], y: nP[1] };
    wcData.wcWinSizePos.width = nS[0];
    wcData.wcWinSizePos.height = nS[1];
    const lLim = -6, rLim = (wcData.wcWinSizePos.display.width - wcData.wcWinSizePos.width) + 6, tLim = -6, bLim = (wcData.wcWinSizePos.display.height - wcData.wcWinSizePos.height) + 6;
    const lSnap = lLim + 6, rSnap = rLim - 6, tSnap = tLim - 6, bSnap = bLim - 6;
    if (fixPos.x < lLim) {
        fixPos.x = lLim;
    }
    ;
    if (fixPos.x > rLim) {
        fixPos.x = rLim;
    }
    ;
    if (fixPos.y < tLim || fixPos.y === 0) {
        fixPos.y = tLim;
    }
    ;
    if (fixPos.y > bLim) {
        fixPos.y = bLim;
    }
    ;
    if (fixPos.x > lLim && fixPos.x < lSnap) {
        fixPos.x = lLim;
    }
    ;
    if (fixPos.x < rLim && fixPos.x > rSnap) {
        fixPos.x = rLim;
    }
    ;
    if (fixPos.y > tLim && fixPos.y < tSnap) {
        fixPos.y = tLim;
    }
    ;
    if (fixPos.y < bLim && fixPos.y > bSnap) {
        fixPos.y = bLim;
    }
    ;
    if (nP[0] !== fixPos.x || nP[1] !== fixPos.y) {
        wcWindow.setPosition(fixPos.x, fixPos.y, true);
        nP = wcWindow.getPosition();
    }
    ;
    wcData.wcWinSizePos.x = nP[0];
    wcData.wcWinSizePos.y = nP[1];
    nP[0] === lLim ? wcData.wcWinSizePos.snaps.left = true : wcData.wcWinSizePos.snaps.left = false;
    nP[0] === rLim ? wcData.wcWinSizePos.snaps.right = true : wcData.wcWinSizePos.snaps.right = false;
    nP[1] === tLim ? wcData.wcWinSizePos.snaps.top = true : wcData.wcWinSizePos.snaps.top = false;
    nP[1] === bLim ? wcData.wcWinSizePos.snaps.bottom = true : wcData.wcWinSizePos.snaps.bottom = false;
    await writeDataFile(wcData);
    wcWindow.webContents.send('winChanged', [wcData.wcWinSizePos]);
    return Promise.resolve(true);
}
//--------------------------------------------------
async function initDevTools() {
    availCons('initDevTools', '()...');
    wcDevTools = new electron_1.BrowserWindow;
    wcWindow.webContents.setDevToolsWebContents(wcDevTools.webContents);
    wcWindow.webContents.openDevTools({ mode: 'detach', activate: false });
    wcWindow.webContents.once('did-finish-load', () => { wcDevTools.setPosition(375, 115, false); wcDevTools.setSize(1460, 900, false); wcDevTools.show(); });
    wcWindow.webContents.on('devtools-closed', async () => { mainEvCons('d', 'devtools-closed'); electron_1.app.quit(); });
    wcWindow.webContents.on('devtools-focused', () => { mainEvCons('d', 'devtools-focused'); });
    return Promise.resolve(wcDevTools);
}
;
////////////////////////////////////////////////////
// MORE WINDOW FUNCTIONS
////////////////////////////////////////////////////
const getMWBrwsr = async (n) => {
    const mwDeetsIndex = moreWinDeets.findIndex((mwO) => mwO.name.toLowerCase() === n.toLowerCase());
    if (mwDeetsIndex === -1) {
        availCons('getMWBrwsr', 'ERROR: Find Index of ' + n + ' in moreWinDeets === -1');
        return Promise.resolve(false);
    }
    else {
        if (moreWinDeets.length !== moreWins.length) {
            availCons('getMWBrwsr', 'ERROR: moreWinDeets.length !== moreWins.length');
            return Promise.resolve(false);
        }
        else {
            availCons('getMWBrwsr', 'FOUND => ' + moreWinDeets[mwDeetsIndex].name + ' at INDEX ' + String(mwDeetsIndex));
            return Promise.resolve(mwDeetsIndex);
        }
    }
};
//-------------------------------------------------
electron_1.ipcMain.on('createMoreWin', async (e, args) => {
    availCons('IPCMAIN|createMoreWin', '(' + args[0] + ')...');
    const cMWRes = await createMoreWin(args[0]);
    if (cMWRes) {
        wcWindow.webContents.send('moreWShowing', [args[0], true]);
    }
    else {
        wcWindow.webContents.send('moreWShowing', [args[0], false]);
    }
    ;
});
//-------------------------------------------------
electron_1.ipcMain.on('killMoreWin', async (e, args) => {
    const mwModName = args[0];
    availCons('killMoreWin', '(' + mwModName + ')...');
    const mwBWI = await getMWBrwsr(mwModName);
    if (mwBWI === false) {
        return;
    }
    else {
        if (moreDevTools[mwBWI]) {
            moreDevTools[mwBWI].close();
            moreDevTools.splice(mwBWI, 1);
        }
        ;
        if (moreWins[mwBWI]) {
            moreWins[mwBWI].close();
            moreWins.splice(mwBWI, 1);
        }
        ;
        moreWinDeets.splice(mwBWI, 1);
        wcWindow.webContents.send('moreWShowing', [mwModName, false]);
    }
});
//-------------------------------------------------
electron_1.ipcMain.on('showMoreWin', async (e, args) => {
    const mwModName = args[0];
    availCons('showMoreWin', '(' + mwModName + ')...');
    const mwBWI = await getMWBrwsr(mwModName);
    if (mwBWI === false) {
        return;
    }
    else {
        moreWins[mwBWI].show();
        moreWins[mwBWI].focus();
    }
});
//-------------------------------------------------
electron_1.ipcMain.handle('getMoreSnaps', async (e, args) => {
    const mwModName = args[0];
    availCons('getMoreSnaps', '(' + mwModName + ')...');
    const mwBWI = await getMWBrwsr(mwModName);
    if (mwBWI === false) {
        return Promise.resolve(false);
    }
    else {
        return Promise.resolve(moreWinDeets[mwBWI].sizePos);
    }
});
//-------------------------------------------------
const getPrevMWData = async () => {
    let pW = { name: '', size: [], pos: [], snaps: { top: false, right: false, bottom: false, left: false } };
    if (moreWins.length > 0) {
        const lWI = (moreWins.length - 1);
        pW.size = (moreWins[lWI].getSize());
        pW.pos = (moreWins[lWI].getPosition());
        if (moreWinDeets[lWI]) {
            pW.name = moreWinDeets[lWI].name;
            pW.snaps = moreWinDeets[lWI].sizePos.snaps;
        }
        ;
    }
    else if (childW !== null) {
        pW.name = 'child';
        pW.size = (childW.getSize());
        pW.pos = (childW.getPosition());
        pW.snaps = wcData.childWinSizePos.snaps;
    }
    else {
        pW.name = 'main';
        pW.size = (wcWindow.getSize());
        pW.pos = (wcWindow.getPosition());
        pW.snaps = wcData.wcWinSizePos.snaps;
    }
    ;
    return Promise.resolve(pW);
};
//-------------------------------------------------
async function createMoreWin(wName) {
    //-------------------------------
    if (!wcWindow) {
        availCons('createMoreWin', 'ERROR: Main/Parent Window Does Not Exist');
        return Promise.resolve(false);
    }
    ;
    const mwBWI = await getMWBrwsr(wName);
    let newMWBWOpts = defMoreWinOpts;
    if (mwBWI !== false) {
        if (moreWins[mwBWI]) {
            availCons('createMoreWin', 'WARNING: ' + wName + ' BrowserDeets AND BrowserWindow Already Exist - Showing/Focussing');
            moreWins[mwBWI].show();
            moreWins[mwBWI].focus();
            return Promise.resolve(false);
        }
        else {
            availCons('createMoreWin', 'WARNING: ' + wName + ' BrowserDeets Already Exists - Skip Create WCMoreWinDeets Object...');
            newMWBWOpts = moreWinDeets[mwBWI].opts;
        }
        ;
    }
    else {
        availCons('createMoreWin', 'Creating NEW WCMoreWinDeets Object for (' + wName + ')...');
        const displaySize = (electron_1.screen.getPrimaryDisplay()).workAreaSize;
        const pW = await getPrevMWData();
        let defMWData = { name: wName, opts: null, sizePos: { display: displaySize, x: 0, y: 0, width: defMoreWinOpts.width, height: defMoreWinOpts.height, snaps: { top: false, right: false, bottom: false, left: false } } };
        let nPlace = '';
        if (pW.snaps.right && !pW.snaps.top) {
            nPlace = 'top';
        }
        else if (pW.snaps.right && pW.snaps.top) {
            nPlace = 'left';
        }
        else if (pW.snaps.top && !pW.snaps.right && !pW.snaps.left || pW.snaps.top && pW.snaps.right && !pW.snaps.left) {
            nPlace = 'left';
        }
        else if (pW.snaps.top && pW.snaps.left) {
            nPlace = 'bottom';
        }
        ;
        if (nPlace === 'top') {
            const isCrn = (pW.pos[1] > 96 && pW.pos[1] < 600);
            if (isCrn) {
                defMWData.sizePos.height = (pW.pos[1] + 6);
                defMWData.sizePos.snaps.top = true;
                defMWData.sizePos.snaps.right = true;
                defMWData.sizePos.snaps.bottom = false;
                defMWData.sizePos.snaps.left = false;
            }
            else {
                defMWData.sizePos.snaps.top = true;
                defMWData.sizePos.snaps.right = true;
                defMWData.sizePos.snaps.bottom = false;
                defMWData.sizePos.snaps.left = false;
            }
            ;
            defMWData.sizePos.x = ((displaySize.width - defMWData.sizePos.width) + 6);
            defMWData.sizePos.y = (pW.pos[1] - defMWData.sizePos.height) + 6;
        }
        else if (nPlace === 'left') {
            const isCrn = (pW.pos[0] > 96 && pW.pos[0] < 600);
            if (isCrn) {
                defMWData.sizePos.width = (pW.pos[0] + 6);
                defMWData.sizePos.snaps.top = true;
                defMWData.sizePos.snaps.left = true;
                defMWData.sizePos.snaps.right = false;
                defMWData.sizePos.snaps.bottom = false;
            }
            else {
                defMWData.sizePos.snaps.top = true;
                defMWData.sizePos.snaps.right = false;
                defMWData.sizePos.snaps.bottom = false;
                defMWData.sizePos.snaps.left = false;
            }
            ;
            if (isCrn) {
                defMWData.sizePos.x = -6;
            }
            else {
                defMWData.sizePos.x = pW.pos[0] - defMWData.sizePos.width;
            }
            ;
            defMWData.sizePos.y = 0;
        }
        else if (nPlace === 'bottom') {
            const isCrn = ((displaySize.height - (pW.pos[1] + pW.size[1])) > 96 && (displaySize.height - (pW.pos[1] + pW.size[1])) < 600);
            if (isCrn) {
                defMWData.sizePos.height = ((displaySize.height - (pW.pos[1] + pW.size[1])) + 6);
                defMWData.sizePos.snaps.top = false;
                defMWData.sizePos.snaps.right = false;
                defMWData.sizePos.snaps.bottom = true;
                defMWData.sizePos.snaps.left = true;
            }
            else {
                defMWData.sizePos.snaps.top = false;
                defMWData.sizePos.snaps.right = false;
                defMWData.sizePos.snaps.bottom = false;
                defMWData.sizePos.snaps.left = true;
            }
            ;
            defMWData.sizePos.x = -6;
            defMWData.sizePos.y = (displaySize.height - defMWData.sizePos.height);
        }
        ;
        //------
        defMWData.opts = { x: defMWData.sizePos.x, y: defMWData.sizePos.y, width: defMWData.sizePos.width, height: defMWData.sizePos.height, minWidth: 280, minHeight: 48, title: defMWData.name, darkTheme: true, frame: false, transparent: true, icon: path.join(__dirname, '../dist/assets/icons/large-wcicon.png'), resizable: true, show: false, parent: wcWindow, webPreferences: { nodeIntegration: true, nodeIntegrationInWorker: true, nodeIntegrationInSubFrames: true, webSecurity: false, allowRunningInsecureContent: true, webgl: true, plugins: true, backgroundThrottling: false, sandbox: false, contextIsolation: false, spellcheck: false, defaultFontFamily: { sansSerif: 'Arial' }, defaultFontSize: 14 } };
        if (wName === 'wifing') {
            defMWData.opts.resizable = true;
        }
        ;
        if (wName === 'ytdl') {
            defMWData.opts.x = 3140;
            defMWData.opts.y = 0;
            defMWData.opts.width = 294;
            defMWData.opts.height = 393;
            defMWData.opts.show = false;
        }
        ;
        //------
        newMWBWOpts = defMWData.opts;
        moreWinDeets.push(defMWData);
    }
    //-------------
    const newMW = new electron_1.BrowserWindow(newMWBWOpts);
    let pathIndex = './index.html';
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';
    }
    ;
    const url = new URL(path.join('file:', __dirname, pathIndex));
    const compUrl = url.href + '#/more';
    newMW.loadURL(compUrl);
    newMW.webContents.on('did-finish-load', () => {
        moreWins.push(newMW);
        const mWinsI = moreWins.length - 1;
        moreWins[mWinsI].webContents.send('moreWIsReady', [wName]);
        wcWindow.webContents.send('moreWShowing', [wName, true]);
        const mwDevTools = new electron_1.BrowserWindow;
        moreDevTools.push(mwDevTools);
        moreWins[mWinsI].webContents.setDevToolsWebContents(moreDevTools[mWinsI].webContents);
        moreWins[mWinsI].webContents.openDevTools({ mode: 'detach', activate: false });
        moreDevTools[mWinsI].show();
        moreDevTools[mWinsI].setPosition(375, 115, false);
        moreDevTools[mWinsI].setSize(1460, 900, false);
        mwCMs = mwCMs.filter(cmO => cmO.name !== wName);
        mwCMs.push({ name: wName, index: mWinsI, opts: {}, isOpen: false, ctx: '' });
        const cmI = mwCMs.findIndex(c => c.name === wName);
        moreWins[mWinsI].webContents.on('context-menu', () => { mwCMs[cmI].isOpen = true; moreWins[mWinsI].webContents.send('cmIsOpen', [true]); });
        electron_1.ipcMain.on('mwCMIsOpen', (e, args) => {
            const cmI = mwCMs.findIndex(c => c.name === args[0]);
            if (cmI !== -1) {
                mwCMs[cmI].isOpen = args[1];
            }
            ;
        });
        electron_1.ipcMain.on('mwCMContext', (e, args) => {
            const cmI = mwCMs.findIndex(c => c.name === args[0]);
            if (cmI !== -1) {
                mwCMs[cmI].ctx = args[1];
                cmBuild();
            }
            ;
        });
    });
    return Promise.resolve(true);
}
;
////////////////////////////////////////////////////
/// CHILD WINDOW FUNCTIONS
////////////////////////////////////////////////////
electron_1.ipcMain.on('createChildWindow', (e, args) => { createChildWindow(args[0]); });
//-------------------------------------------------
electron_1.ipcMain.on('killChildWindow', (e, args) => { childW.webContents.closeDevTools(); childW.close(); });
//-------------------------------------------------
electron_1.ipcMain.on('showChildWindow', async (e, args) => { childW.show(); childW.focus(); await childWSizePosCalcs(); });
//-------------------------------------------------
async function createChildWindow(content) {
    if (childW === null) {
        const displaySize = electron_1.screen.getPrimaryDisplay().workAreaSize;
        if (!_.isEqual(wcData.childWinSizePos.display, displaySize)) {
            wcData.childWinSizePos.display = displaySize;
            if (displaySize.width < 300) {
                wcData.childWinSizePos.width = 240;
            }
            else {
                wcData.childWinSizePos.width = 300;
            }
            ;
            if ((displaySize.height / 2) < 48) {
                wcData.childWinSizePos.height = 48;
            }
            else {
                wcData.childWinSizePos.height = 542;
            }
            ;
            wcData.childWinSizePos.x = (displaySize.width - wcData.childWinSizePos.width) + 6;
            wcData.childWinSizePos.y = (displaySize.height - (wcData.wcWinSizePos.height + wcData.childWinSizePos.height)) + 6;
            await writeDataFile(wcData);
        }
        ;
        childWindowOpts.maxWidth = displaySize.width;
        childWindowOpts.maxHeight = displaySize.height;
        childWindowOpts.width = wcData.childWinSizePos.width;
        childWindowOpts.height = wcData.childWinSizePos.height;
        childWindowOpts.x = wcData.childWinSizePos.x;
        childWindowOpts.y = (displaySize.height - (wcData.wcWinSizePos.height + wcData.childWinSizePos.height)) + 6;
        if (!wcWindow) {
            return Promise.resolve(false);
        }
        ;
        childWindowOpts['show'] = false;
        childWindowOpts['parent'] = wcWindow;
        childW = new electron_1.BrowserWindow(childWindowOpts);
        let pathIndex = './index.html';
        if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
            pathIndex = '../dist/index.html';
        }
        ;
        const url = new URL(path.join('file:', __dirname, pathIndex));
        const compUrl = url.href + '#/child';
        childW.loadURL(compUrl);
        childW.on('resized', async () => { await childWSizePosCalcs(); });
        childW.on('moved', async () => { await childWSizePosCalcs(); });
        childW.webContents.on('did-finish-load', () => {
            childW.webContents.send('childWIsReady', [content, twtUser]);
            wcWindow.webContents.send('twtChildWShowing', [true]);
            childDevTools = new electron_1.BrowserWindow;
            childW.webContents.setDevToolsWebContents(childDevTools.webContents);
            childW.webContents.openDevTools({ mode: 'detach', activate: false });
            childDevTools.show();
            childDevTools.setPosition(375, 115, false);
            childDevTools.setSize(1460, 900, false);
            childW.webContents.on('context-menu', () => { childWCMIsOpen = true; childW.webContents.send('cmIsOpen', [true]); });
            electron_1.ipcMain.on('cmIsOpen', (e, args) => { childWCMIsOpen = args[0]; });
            electron_1.ipcMain.on('cmContext', (e, args) => { cmContextStr = args[0]; cmBuild(); });
        });
        childW.on('closed', () => { childW = null; wcWindow.webContents.send('twtChildWShowing', [false]); });
        return Promise.resolve(true);
    }
    else {
        wcWindow.webContents.send('twtChildWShowing', [true]);
        return Promise.resolve(false);
    }
}
//-------------------------------------------------
electron_1.ipcMain.on('toggleChildVidVis', (e, args) => {
    const [cW, cH] = childW.getSize();
    const [cX, cY] = childW.getPosition();
    if (args[0] === 'hide') {
        childW.setBounds({ height: (cH - 162), y: (cY + 162) }, false);
    }
    else {
        childW.setBounds({ height: (cH + 162), y: (cY - 162) }, false);
    }
    ;
    const [acW, acH] = childW.getSize(), [acX, acY] = childW.getPosition();
});
//-------------------------------------------------
async function childWSizePosCalcs() {
    const nS = childW.getSize();
    let nP = childW.getPosition();
    let fixPos = { x: nP[0], y: nP[1] };
    wcData.childWinSizePos.width = nS[0];
    wcData.childWinSizePos.height = nS[1];
    const lLim = -6, rLim = (wcData.childWinSizePos.display.width - wcData.childWinSizePos.width) + 6, tLim = -6, bLim = (wcData.childWinSizePos.display.height - wcData.childWinSizePos.height) + 6;
    const lSnap = lLim + 6, rSnap = rLim - 6, tSnap = tLim - 6, bSnap = bLim - 6;
    if (fixPos.x < lLim) {
        fixPos.x = lLim;
    }
    ;
    if (fixPos.x > rLim) {
        fixPos.x = rLim;
    }
    ;
    if (fixPos.y < tLim || fixPos.y === 0) {
        fixPos.y = tLim;
    }
    ;
    if (fixPos.y > bLim) {
        fixPos.y = bLim;
    }
    ;
    if (fixPos.x > lLim && fixPos.x < lSnap) {
        fixPos.x = lLim;
    }
    ;
    if (fixPos.x < rLim && fixPos.x > rSnap) {
        fixPos.x = rLim;
    }
    ;
    if (fixPos.y > tLim && fixPos.y < tSnap) {
        fixPos.y = tLim;
    }
    ;
    if (fixPos.y < bLim && fixPos.y > bSnap) {
        fixPos.y = bLim;
    }
    ;
    if (nP[0] !== fixPos.x || nP[1] !== fixPos.y) {
        childW.setPosition(fixPos.x, fixPos.y, true);
        nP = childW.getPosition();
    }
    ;
    wcData.childWinSizePos.x = nP[0];
    wcData.childWinSizePos.y = nP[1];
    nP[0] === lLim ? wcData.childWinSizePos.snaps.left = true : wcData.childWinSizePos.snaps.left = false;
    nP[0] === rLim ? wcData.childWinSizePos.snaps.right = true : wcData.childWinSizePos.snaps.right = false;
    nP[1] === tLim ? wcData.childWinSizePos.snaps.top = true : wcData.childWinSizePos.snaps.top = false;
    nP[1] === bLim ? wcData.childWinSizePos.snaps.bottom = true : wcData.childWinSizePos.snaps.bottom = false;
    await writeDataFile(wcData);
    childW.webContents.send('cWinSizePos', [wcData.childWinSizePos]);
    return Promise.resolve(true);
}
//////////////////////////////////////////////////
// CONTEXT MENU FUNCTIONS
//////////////////////////////////////////////////
const cmBuild = () => {
    let baseCMOpts = { showLookUpSelection: false, showSearchWithGoogle: false, showCopyImage: false, showCopyImageAddress: false, showSaveImage: false, showSaveImageAs: false, showSaveLinkAs: false, showInspectElement: false, showServices: false,
        prepend: (dA, ps, bW, e) => [
            { label: 'Greeting', visible: true, enabled: (isEn('chat')), icon: icoP('assets/cm-twt-greet-ico.png'), type: 'normal', click: () => { childW.webContents.send('cm', ['greet']); } },
            { label: 'RahRah!', visible: true, enabled: true, icon: icoP('assets/cm-twt-letsgo-ico.png'), type: 'normal', click: () => { childW.webContents.send('cm', ['rahrah']); } }
        ]
    };
    cmOpts = baseCMOpts;
    return Promise.resolve(true);
};
//-------------------------------------------------
const isEn = (ctx) => { if (ctx === cmContextStr) {
    return true;
}
else {
    return false;
} };
//////////////////////////////////////////////////
// WC TRAY FUNCTIONS
//////////////////////////////////////////////////
async function initTray() {
    if (!wcTrayUpdating) {
        wcTrayUpdating = true;
        let connMenuItem;
        //----- WLED
        let wledMenuItem = { label: 'WLED', visible: true, enabled: !syncStates.audioSync && !dtlfxIsLive, icon: icoP('assets/wc-tray-wledfns-sub-ico.png'), type: 'submenu', submenu: [] };
        let wledsFnMenu = [];
        if (wleds.length > 0) {
            if (wleds.length > 1) {
                for (let awi = 0; awi < wleds.length; awi++) {
                    wledsFnMenu.push({ label: wleds[awi].info.name, visible: true, enabled: true, icon: icoP('assets/wc-tray-wledfns-sub-ico.png'), type: 'submenu', submenu: [
                            { label: 'Effects', visible: true, enabled: true, icon: icoP('assets/wc-tray-wledeffects-ico.png'), type: 'submenu', submenu: [] },
                            { label: 'Presets', visible: true, enabled: true, icon: icoP('assets/wc-tray-wledpresets-ico.png'), type: 'submenu', submenu: [] }
                        ]
                    });
                    let multiFXList = wleds[awi].effects;
                    const multiFXNow = wleds[awi].state.segments[0].effectId;
                    for (let mfxi = 0; mfxi < multiFXList.length; mfxi++) {
                        wledsFnMenu[awi].submenu[0].submenu.push({ label: multiFXList[mfxi], visible: true, enabled: true, type: 'checkbox', checked: (mfxi === multiFXNow ? true : false), click: () => { wcWindow.webContents.send('clientWLEDFnChange', [{ index: awi, type: 'effects', id: mfxi }]); } });
                    }
                    ;
                    const multiPSList = Object.values(wleds[awi].presets).filter(p => !_.isEmpty(p) && p.hasOwnProperty('name')).map(p => p['name']);
                    const multiPSNow = wleds[awi].state.presetId;
                    for (let pmi = 0; pmi < multiPSList.length; pmi++) {
                        wledsFnMenu[awi].submenu[1].submenu.push({ label: multiPSList[pmi], visible: true, enabled: true, type: 'checkbox', checked: (pmi === multiPSNow ? true : false), click: () => { wcWindow.webContents.send('clientWLEDFnChange', [{ index: awi, type: 'presets', id: pmi }]); } });
                    }
                    ;
                }
                ;
                wledMenuItem.submenu = wledsFnMenu;
            }
            else {
                wledMenuItem.submenu = [
                    { label: 'Effects', visible: true, enabled: true, icon: icoP('assets/wc-tray-wledeffects-ico.png'), type: 'submenu', submenu: [] },
                    { label: 'Presets', visible: true, enabled: true, icon: icoP('assets/wc-tray-wledpresets-ico.png'), type: 'submenu', submenu: [] }
                ];
                const singleFXList = wleds[0].effects;
                const singleFXNow = wleds[0].state.segments[0].effectId;
                for (let sfxi = 0; sfxi < singleFXList.length; sfxi++) {
                    wledMenuItem.submenu[0].submenu.push({ label: singleFXList[sfxi], visible: true, enabled: true, type: 'checkbox', checked: (sfxi === singleFXNow ? true : false), click: () => { wcWindow.webContents.send('clientWLEDFnChange', [{ index: 0, type: 'effects', id: sfxi }]); } });
                }
                ;
                const singlePSList = Object.values(wleds[0].presets).filter(p => !_.isEmpty(p) && p.hasOwnProperty('name')).map(p => p['name']);
                const singlePSNow = wleds[0].state.presetId;
                for (let psi = 0; psi < singlePSList.length; psi++) {
                    wledMenuItem.submenu[1].submenu.push({ label: singlePSList[psi], visible: true, enabled: true, type: 'checkbox', checked: (psi === singlePSNow ? true : false), click: () => { wcWindow.webContents.send('clientWLEDFnChange', [{ index: 0, type: 'presets', id: psi }]); } });
                }
                ;
            }
            ;
        }
        else {
            wledMenuItem.enabled = false;
        }
        ;
        //----------
        let sShotSyncIco, audioSyncIco;
        syncStates.audioSync ? audioSyncIco = icoP('assets/wc-tray-sync2audio-ico-on.png') : audioSyncIco = icoP('assets/wc-tray-sync2audio-ico.png');
        syncStates.sshotSync ? sShotSyncIco = icoP('assets/wc-tray-sshot-ico-on.png') : sShotSyncIco = icoP('assets/wc-tray-sshot-ico.png');
        if (!(isNetEnabled())) {
            connMenuItem = { label: 'No Network', enabled: false, type: 'normal', icon: icoP('assets/wc-tray-connected-false.png'), click: () => { return; } };
        }
        else {
            connMenuItem = { label: 'Connected: ' + netInterface.name + ' (' + netInterface.type + ')', enabled: false, type: 'normal', icon: icoP((netInterface.type === 'Ethernet' ? 'assets/wc-tray-connstatus-wired-ico.png' : 'assets/wc-tray-connstatus-wifi-ico.png')), click: () => { return; } };
        }
        ;
        const isSleeping = () => { return isSleep; };
        if (wcTray) {
            wcTray.destroy();
            wcTray = null;
        }
        ;
        const trayIcoPath = path.join(__dirname, '../dist/assets/icons/large-wcicon.png');
        wcTray = new electron_1.Tray(trayIcoPath);
        wcTrayContextMenu = electron_1.Menu.buildFromTemplate([
            { type: 'separator' },
            connMenuItem,
            { type: 'separator' },
            { label: listenONOFFStr(), visible: (isNetEnabled()), enabled: true, type: 'checkbox', checked: isListen, click: () => { wcWindow.webContents.send('doInvokeToggleWCListen'); } },
            { type: 'separator' },
            { label: 'Sleep Now', visible: true, enabled: !(isSleeping()), type: 'normal', icon: icoP('assets/wc-tray-sleep-ico.png'), click: () => { wcWindow.webContents.send('traySleepWakeNow', ['sleep']); } },
            { label: 'Wake Now', visible: true, enabled: (isSleeping()), type: 'normal', icon: icoP('assets/wc-tray-wake-ico.png'), click: () => { wcWindow.webContents.send('traySleepWakeNow', ['wake']); } },
            { type: 'separator' },
            { label: 'All White Light', visible: true, enabled: true, type: 'normal', icon: icoP('assets/wc-tray-allwhite-ico.png'), click: () => { wcWindow.webContents.send('traySetAllWhiteLight'); } },
            { label: 'Set New Color', visible: true, enabled: true, type: 'normal', icon: icoP('assets/mmdd-actions-setnewcolor-ico.png'), click: () => { wcWindow.webContents.send('traySetColor'); } },
            { type: 'separator' },
            { label: 'Screen Sync', visible: true, enabled: true, type: 'normal', icon: sShotSyncIco, click: () => { wcWindow.webContents.send('animSShotToggle', [(syncStates.sshotSync ? 'stop' : 'start'), 'server']); } },
            { label: 'Audio Sync', visible: true, enabled: true, type: 'normal', icon: audioSyncIco, click: () => { wcWindow.webContents.send('traySync2Audio', [(syncStates.audioSync ? 'stop' : 'start')]); } },
            { type: 'separator' },
            wledMenuItem,
            { type: 'separator' },
            { label: 'Open wifiCUE', visible: true, enabled: true, type: 'normal', icon: icoP('assets/wc-tray-showapp-ico.png'), click: () => { doWCFocusFn(); } },
            { label: 'Settings', visible: true, enabled: true, type: 'normal', icon: icoP('assets/wc-tray-settings-ico.png'), click: async () => { doWCFocusFn('trayGoSettings'); } },
            { type: 'separator' },
            { label: 'Exit wifiCUE', visible: true, enabled: true, type: 'normal', icon: icoP('assets/wc-tray-exit-ico.png'), click: () => { electron_1.app.quit(); } },
        ]);
        wcTray.setToolTip('wifiCUE');
        wcTray.setContextMenu(wcTrayContextMenu);
        wcTrayUpdating = false;
        return Promise.resolve(wcTray);
    }
    else {
        availCons('initTray', 'SKIPPED - Tray Already Updating!');
        return Promise.resolve(false);
    }
    ;
}
;
//////////////////////////////////////////////////
// SHORTCUTS
//////////////////////////////////////////////////
const scs = (tf) => { if (tf) {
    if (!scsActive) {
        shortCutRegs('register');
    }
}
else {
    if (scsActive) {
        shortCutRegs('unregister');
    }
} };
const shortCutRegs = (action) => {
    if (action === 'register') {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('appHasFocus', [true]);
        }
        ;
        electron_1.globalShortcut.register('Ctrl+Shift+X', () => { winCtrl('quit'); });
        // Custom KP - KNOB 1 (Top) - Brightness/OnOff
        electron_1.globalShortcut.register('numdiv', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            const ooJSON = JSON.stringify({ tt: 0, on: (setWCs[0].state.on ? false : true) });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', ooJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('numdec', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            if (wleds && wleds.length > 0 && wleds[0].state.on) {
                kbKnobAdjust('brightness', 'inc');
            }
            ;
        });
        electron_1.globalShortcut.register('num0', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            if (wleds && wleds.length > 0 && wleds[0].state.on) {
                kbKnobAdjust('brightness', 'dec');
            }
        });
        // Custom KP - KNOB 2 (Bottom) - FX Fwd|Back/Onff
        electron_1.globalShortcut.register('nummult', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            const togFxJSON = JSON.stringify({ tt: 0, seg: [{ fx: 0 }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', togFxJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('numadd', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let fwdFXId = (setWCs[0].state.segments[0].effectId + 1);
            if (fwdFXId === setWCs[0].effects.length) {
                fwdFXId = 0;
            }
            ;
            const fwdFxJSON = JSON.stringify({ tt: 0, seg: [{ fx: fwdFXId }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', fwdFxJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('numsub', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let backFXId = (setWCs[0].state.segments[0].effectId - 1);
            if (backFXId === 0) {
                backFXId = setWCs[0].effects.length;
            }
            ;
            const backFxJSON = JSON.stringify({ tt: 0, seg: [{ fx: backFXId }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', backFxJSON);
            }
            ;
        });
        // Custom KP - ROWS 1+2 (Top+Middle) - R1=W,R,G,B|R2=fxInt-,fxInt+,fxSpd-,fxSpd+
        electron_1.globalShortcut.register('num1', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let wJSON;
            for (let wi = 0; wi < setWCs.length; wi++) {
                setWCs[wi].info.name === 'Zer0WLED6' ? wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[255, 205, 160]] }] }) : wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 0, 0, 255]] }] });
                wledJSONReq(setWCs[wi].info.name, 'post', wJSON);
            }
            ;
            let icWArr = [];
            for (let i = 0; i < setCUEDefDevList.length; i++) {
                icWArr.push({ id: setCUEDefDevList[i].id, colors: setCUEDefDevList[i].colors.map((ledCO) => { return { id: ledCO.id, r: 255, g: 205, b: 160, a: 255 }; }) });
            }
            ;
            for (let i = 0; i < icWArr.length; i++) {
                sdk.CorsairSetLedColors(icWArr[i].id, icWArr[i].colors);
            }
            ;
        });
        electron_1.globalShortcut.register('num2', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let wJSON;
            for (let wi = 0; wi < setWCs.length; wi++) {
                setWCs[wi].info.name === 'Zer0WLED6' ? wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[255, 0, 0, 0]] }] }) : wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[255, 0, 0]] }] });
                wledJSONReq(setWCs[wi].info.name, 'post', wJSON);
            }
            ;
            let icRArr = [];
            for (let i = 0; i < setCUEDefDevList.length; i++) {
                icRArr.push({ id: setCUEDefDevList[i].id, colors: setCUEDefDevList[i].colors.map((ledCO) => { return { id: ledCO.id, r: 255, g: 0, b: 0, a: 255 }; }) });
            }
            ;
            for (let i = 0; i < icRArr.length; i++) {
                sdk.CorsairSetLedColors(icRArr[i].id, icRArr[i].colors);
            }
            ;
        });
        electron_1.globalShortcut.register('num3', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let wJSON;
            for (let wi = 0; wi < setWCs.length; wi++) {
                setWCs[wi].info.name === 'Zer0WLED6' ? wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 255, 0, 0]] }] }) : wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 255, 0]] }] });
                wledJSONReq(setWCs[wi].info.name, 'post', wJSON);
            }
            ;
            let icGArr = [];
            for (let i = 0; i < setCUEDefDevList.length; i++) {
                icGArr.push({ id: setCUEDefDevList[i].id, colors: setCUEDefDevList[i].colors.map((ledCO) => { return { id: ledCO.id, r: 0, g: 255, b: 0, a: 255 }; }) });
            }
            ;
            for (let i = 0; i < icGArr.length; i++) {
                sdk.CorsairSetLedColors(icGArr[i].id, icGArr[i].colors);
            }
            ;
        });
        electron_1.globalShortcut.register('num4', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let wJSON;
            for (let wi = 0; wi < setWCs.length; wi++) {
                setWCs[wi].info.name === 'Zer0WLED6' ? wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 0, 255, 0]] }] }) : wJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 0, 255]] }] });
                wledJSONReq(setWCs[wi].info.name, 'post', wJSON);
            }
            ;
            let icBArr = [];
            for (let i = 0; i < setCUEDefDevList.length; i++) {
                icBArr.push({ id: setCUEDefDevList[i].id, colors: setCUEDefDevList[i].colors.map((ledCO) => { return { id: ledCO.id, r: 0, g: 0, b: 255, a: 255 }; }) });
            }
            ;
            for (let i = 0; i < icBArr.length; i++) {
                sdk.CorsairSetLedColors(icBArr[i].id, icBArr[i].colors);
            }
            ;
        });
        //------------
        electron_1.globalShortcut.register('num5', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let decIX = (wleds[0].state.segments[0].effectIntensity - 51);
            if (decIX < 0) {
                decIX = 0;
            }
            ;
            const dixJSON = JSON.stringify({ tt: 0, seg: [{ ix: decIX }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', dixJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('num6', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let incIX = (wleds[0].state.segments[0].effectIntensity + 51);
            if (incIX > 255) {
                incIX = 255;
            }
            ;
            const iixJSON = JSON.stringify({ tt: 0, seg: [{ ix: incIX }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', iixJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('num7', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let decSX = (wleds[0].state.segments[0].effectSpeed - 51);
            if (decSX < 0) {
                decSX = 0;
            }
            ;
            const dsxJSON = JSON.stringify({ tt: 0, seg: [{ sx: decSX }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', dsxJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('num8', () => {
            if (dtlfxIsLive) {
                return;
            }
            ;
            let setWCs = wleds;
            if (wledGroupSyncOn) {
                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
            }
            ;
            let incSX = (wleds[0].state.segments[0].effectSpeed + 51);
            if (incSX > 255) {
                incSX = 255;
            }
            ;
            const isxJSON = JSON.stringify({ tt: 0, seg: [{ sx: incSX }] });
            for (let wi = 0; wi < setWCs.length; wi++) {
                wledJSONReq(setWCs[wi].info.name, 'post', isxJSON);
            }
            ;
        });
        electron_1.globalShortcut.register('PrintScreen', () => { if (dtlfxIsLive) {
            return;
        }
        else {
            doStartDTLFXEXE(false);
        } });
        scsActive = true;
    }
    else {
        electron_1.globalShortcut.unregisterAll();
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('appHasFocus', [false]);
        }
        ;
        scsActive = false;
    }
    ;
};
//////////////////////////////////////////////////
async function doStartDTLFXEXE(fromZ1Box) {
    if (fromZ1Box && fromZ1Box === true) {
        z1bSendVizInfo = true;
    }
    else {
        z1bSendVizInfo = false;
    }
    ;
    const dtlfxExePath = path.normalize('C:\\Users\\owenl\\Desktop\\DopeUtils\\dtlfx.exe');
    (0, child_process_2.exec)(dtlfxExePath, async (error, stdout, stderr) => {
        if (error || stderr) {
            availCons('KeyPadSC|KEY9 > PrintScreen', 'ERROR');
            if (error) {
                console.log(error);
            }
            ;
            if (stderr) {
                console.log(stderr);
            }
        }
        else {
            availCons('KeyPadSC|KEY9 > PrintScreen', 'Opened DTLFX.exe');
        }
    });
}
//////////////////////////////////////////////////
// SERVER/CLIENT SOCKET.IO
//////////////////////////////////////////////////
async function initSocket() {
    availCons('initSocket', '()...');
    if (svrSVR !== null || svrListening === true) {
        await killSVR();
    }
    ;
    try {
        svrSVR = http.createServer();
        svrSVRKill = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: svrSVR });
        io = new socket_io_1.Server(svrSVR);
        //----------
        io.on('connection', (ioSocket) => {
            availCons('[SOCKET.io|EVENT]', '"connection"');
            //----------
            ioSocket.on('clientCtrlData', async (args) => { availCons('[SOCKET.io|EVENT]', '"clientCtrlData"'); if ((await valGrantClient(args[0].i.id))) {
                io.emit('serverCtrlDataResp', [{ r: true, c: 'ok', d: wcData }]);
            }
            else {
                io.emit('serverCtrlDataResp', [{ r: false, c: 'noauth', d: null }]);
            } });
            ioSocket.on('clientAudioSync', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientAudioSync"');
                if ((await valGrantClient(args[0].i.id))) {
                    io.emit('serverAudioSyncResp', [{ r: true, c: 'ok', d: syncStates.audioSync }]);
                }
                else {
                    io.emit('serverAudioSyncResp', [{ r: false, c: 'noauth', d: null }]);
                }
                ;
            });
            ioSocket.on('clientRunLEDFXEXE', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientRunLEDFXEXE"');
                if ((await valGrantClient(args[0].i.id))) {
                    // Integrate with DTLFX Here...
                    io.emit('serverRunLEDFXEXEResp', [{ r: false, c: 'disabled', d: null }]);
                }
                ;
            });
            ioSocket.on('clientLEDFXOnOff', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientLEDFXOnOff"');
                // Integrate with DTLFX Here...
                io.emit('serverLEDFXOnOffResp', [false]);
            });
            ioSocket.on('clientLEDFXSync', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientLEDFXSync"');
                let respD = { r: false, c: 'ok', d: null };
                if ((await valGrantClient(args[0].i.id))) {
                    // Integrate with DTLFX Here...
                }
                ;
                io.emit('serverLEDFXSyncResp', [respD]);
            });
            ioSocket.on('clientWLEDData', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientWLEDData"');
                if ((await valGrantClient(args[0].i.id))) {
                    let activeWLEDS = [];
                    for (let wi = 0; wi < wleds.length; wi++) {
                        activeWLEDS.push({
                            id: wi, ip: wledIPs[wi],
                            config: wleds[wi].config,
                            effects: wleds[wi].effects,
                            palettes: wleds[wi].palettes,
                            presets: wleds[wi].presets,
                            info: wleds[wi].info,
                            state: wleds[wi].state
                        });
                    }
                    ;
                    io.emit('serverWLEDDataResp', [{ r: true, c: 'ok', d: activeWLEDS }]);
                }
                else {
                    io.emit('serverWLEDDataResp', [{ r: false, c: 'noauth', d: null }]);
                }
                ;
            });
            //----------
            ioSocket.on('clientRefreshAll', async (args) => { availCons('[SOCKET.io|EVENT]', '"clientRefreshAll"'); if ((await valGrantClient(args[0].i.id))) {
                io.emit('serverRefreshAllResp', [{ r: true, c: 'ok', d: wcData }]);
            }
            else {
                io.emit('serverRefreshAllResp', [{ r: false, c: 'noauth', d: null }]);
            } });
            //----------
            ioSocket.on('clientPing', async (args) => { availCons('[SOCKET.io|EVENT]', '"clientPing"'); io.emit('serverPingResp', [{ r: true, c: 'ok', d: netInfo.info.ip }]); });
            //----------
            ioSocket.on('clientGetHN', async (args) => { availCons('[SOCKET.io|EVENT]', '"clientGetHN"'); io.emit('serverGetHNResp', [{ r: true, c: 'ok', d: netInfo.info.pc }]); });
            //----------
            ioSocket.on('clientIsAuth', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientIsAuth"');
                let cIARes = { r: true, c: '', d: null };
                const isBan = await cIsBanned(args[0].i.ip);
                if (isBan) {
                    cIARes.r = false, cIARes.c = 'banned';
                }
                else {
                    const isARes = await valGrantClient(args[0].i.id);
                    cIARes.c = String(isARes), cIARes.d = isARes;
                }
                ;
                io.emit('serverIsAuthResp', [cIARes]);
            });
            //----------
            ioSocket.on('clientAuth', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientAuth"');
                let cReqResp = { r: true, c: 'error', d: null };
                if (!isListen) {
                    cReqResp.c = '!listen';
                }
                else {
                    const cDevInfo = args[0].i, authAct = args[0].d;
                    if (authAct === 'doauth') {
                        await readDataFile();
                        if ((await valGrantClient(cDevInfo.id))) {
                            cReqResp = { r: true, c: 'granted', d: wcData };
                        }
                        else {
                            const aGOnRes = isAutoGrantOn();
                            wcWindow.setOverlayIcon((electron_1.nativeImage.createFromPath((icoP('assets/wcc-window-notif-req-ico.png')))), 'New Control Request');
                            let authRes = -1, wasTO;
                            if (aGOnRes !== false) {
                                wasTO = false;
                                if (aGOnRes === 'grant') {
                                    authRes = 2;
                                }
                                else {
                                    authRes = 0;
                                }
                            }
                            else {
                                const { result, to } = await doGrantPop(cDevInfo);
                                authRes = result;
                                wasTO = to;
                            }
                            ;
                            switch (authRes) {
                                case 0:
                                    wasTO ? cReqResp.c = 'timeout' : cReqResp.c = 'denied';
                                    break;
                                case 1:
                                    cReqResp.c = 'banned';
                                    await addBanClient((netClients.filter(ncO => ncO.ip === cDevInfo.ip)[0].mac));
                                    break;
                                case 2:
                                    (await addGrantClient(cDevInfo)) ? cReqResp = { r: true, c: 'granted', d: wcData } : cReqResp.c = 'error';
                                    break;
                            }
                            ;
                            wcWindow.setOverlayIcon(null, '');
                        }
                        ;
                    }
                    else {
                        if ((await valGrantClient(cDevInfo.id))) {
                            const dARes = await remGrantClient(cDevInfo.id);
                            if (dARes) {
                                cReqResp.c = 'deauth';
                            }
                            ;
                        }
                        ;
                    }
                    ;
                }
                ;
                io.emit('serverAuthResp', [cReqResp]);
                wcWindow.webContents.send('doInvokeGetNetworkInfo');
            });
            //----------
            ioSocket.on('clientStatus', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientStatus"');
                if (args[0].connected) {
                    let ioCI = -1;
                    const isC = isIOClient(args[0].id);
                    if (!isC) {
                        ioClients.push({ id: args[0].id, sid: args[0].sId, authInfo: (await aCID2Info(args[0].id)), didOnline: false, didOffline: false });
                        ioCI = ioClients.findIndex(c => c.id === args[0].id);
                    }
                    else {
                        ioCI = isC.i;
                        if (!isC.o) {
                            ioClients[isC.i].authInfo = (await aCID2Info(args[0].id));
                        }
                    }
                    ;
                    const CO = ioClients[ioCI];
                    availCons('', CO);
                    if (CO.authInfo) {
                        availCons('', CO.authInfo);
                        if (args[0].sId !== ioClients[ioCI].sid) {
                            ioClients[ioCI].sid = args[0].sId;
                            ioClients[ioCI].didOnline = false;
                            ioClients[ioCI].didOffline = false;
                        }
                        ;
                        if (!ioClients[ioCI].didOnline) {
                            doIOClientNotif('on', ioCI, CO.authInfo);
                        }
                        ;
                    }
                }
                else {
                    const isC = isIOClient(args[0].id);
                    if (isC) {
                        if (isC.o.authInfo) {
                            if (args[0].sId !== ioClients[isC.i].sid) {
                                ioClients[isC.i].sid = args[0].sId;
                                ioClients[isC.i].didOnline = false;
                                ioClients[isC.i].didOffline = false;
                            }
                            ;
                            if (!ioClients[isC.i].didOffline) {
                                doIOClientNotif('off', isC.i, isC.o.authInfo);
                            }
                            ;
                        }
                        ;
                        ioClients = ioClients.filter(c => c.id === args[0].id);
                    }
                    ;
                }
                ;
                io.emit('serverStatus', [{ id: svrUUID, hostname: netInfo.info.pc, ip: svrInfo.ip, online: true, time: new Date() }]);
            });
            //----------
            ioSocket.on('clientSnippet', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientSnippet"');
                let cSRes = { r: true, c: '', d: null };
                const cDevInfo = args[0].i;
                if ((await cIsBanned(cDevInfo.ip))) {
                    cSRes.r = false;
                    cSRes.c = 'banned';
                }
                else {
                    let info = {
                        sdk: getSDKVersInfo(), svrStart: svrDidStart, isListen: isListen, isSleep: isSleep, syncStates: syncStates, zcUp: wcBonIsUp, sIOUp: ioUp,
                        cueCounts: { group: 0, device: 0, led: 0 },
                        wledCounts: { device: 0, led: 0 }
                    };
                    for (let wi = 0; wi < wleds.length; wi++) {
                        info.wledCounts.device++;
                        info.wledCounts.led += wleds[wi].info.leds.count;
                    }
                    ;
                    if (wcData !== null) {
                        info.cueCounts.group = wcData.tree.length;
                        for (let gi = 0; gi < wcData.tree.length; gi++) {
                            info.cueCounts.device += wcData.tree[gi].dtCount;
                            for (let di = 0; di < wcData.tree[gi].dtDevices.length; di++) {
                                info.cueCounts.led += wcData.tree[gi].dtDevices[di].info.ledCount;
                            }
                        }
                    }
                    ;
                    cSRes.c = 'ok';
                    cSRes.d = info;
                }
                ;
                io.emit('serverSnippetResp', [cSRes]);
            });
            //----------
            ioSocket.on('clientData', async (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientData"');
                const cDevInfo = args[0].i, cDataType = args[0].d.type, cDataProps = args[0].d.props;
                if ((await valGrantClient(cDevInfo.id))) {
                    switch (cDataType) {
                        case 'rebootWLED':
                            for (let wi = 0; wi < wleds.length; wi++) {
                                if (dtlfxIsLive) {
                                    return;
                                }
                                ;
                                if (wleds[wi]) {
                                    const wled = wleds[0];
                                    await wled.toggle();
                                }
                            }
                            ;
                            break;
                        case 'updSettings':
                            wcWindow.webContents.send('clientChangeSettings', [cDataProps.cat, cDataProps.opt, cDataProps.value]);
                            break;
                        case 'changeColor':
                            wcWindow.webContents.send('clientSetColor', [cDataProps.color, cDataProps.complete]);
                            break;
                        case 'deviceSelectUpdate':
                            wcWindow.webContents.send('deviceSelectUpdate', [cDataProps]);
                            break;
                        case 'toggleWLEDUDPSync':
                            doWLEDToggleSync();
                            break;
                        case 'manualSleepWake':
                            wcWindow.webContents.send('clientDoWakeSleep', [cDataProps]);
                            break;
                        case 'manualChime':
                            wcWindow.webContents.send('clientDoChime', [cDataProps]);
                            break;
                        case 'wledFnChange':
                            wcWindow.webContents.send('clientWLEDFnChange', [cDataProps]);
                            break;
                        case 'ledfxChangeEffect':
                            wcWindow.webContents.send('ledfxChangeEffect', [cDataProps]);
                            break;
                        case 'ledfxChangeGrad': break;
                        case 'clearWLEDEP':
                            const clearPreset = async (wClient) => { await wClient.setPreset(0); return Promise.resolve(true); };
                            const clearEffect = async (wClient) => {
                                let oldState = wClient.state;
                                for (let s = 0; s < oldState.segments.length; s++) {
                                    oldState.segments[s].effectId = 0;
                                }
                                ;
                                await wClient.updateState(oldState);
                                return Promise.resolve(true);
                            };
                            //----------
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            let setWCs = wleds;
                            if (wledGroupSyncOn) {
                                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
                            }
                            ;
                            for (let wi = 0; wi < setWCs.length; wi++) {
                                if (cDataProps === 'preset') {
                                    await clearPreset(setWCs[wi]);
                                    await doW(0.25);
                                }
                                else {
                                    await clearEffect(setWCs[wi]);
                                    await doW(0.25);
                                }
                            }
                            ;
                            break;
                        case 'wledBright':
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            adjustWLEDBright(cDataProps[0], cDataProps[1], cDataProps[2], cDataProps[3]);
                            break;
                        case 'allWhite':
                            wcWindow.webContents.send('clientDoAllWhite', [cDataProps]);
                            break;
                        case 'audioSyncToggle':
                            if (syncStates.audioSync === cDataProps) {
                                io.emit('serverData', ['audioSync', syncStates.audioSync]);
                            }
                            else {
                                wcWindow.webContents.send('audioSyncToggle', [cDataProps]);
                            }
                            ;
                            break;
                        case 'sshotSyncToggle':
                            if (syncStates.sshotSync === cDataProps) {
                                io.emit('serverData', ['sshotSync', syncStates.sshotSync]);
                            }
                            else {
                                wcWindow.webContents.send('animSShotToggle', [(cDataProps) ? 'start' : 'stop', 'client']);
                            }
                            ;
                            break;
                        case 'randomDark':
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            wcWindow.webContents.send('clientRandomDark');
                        case 'appStateIsActive':
                            showLEDPollTo.client = cDataProps;
                            break;
                        case 'getDataRequest':
                            switch (cDataProps) {
                                case 'ctrlData':
                                    io.emit('serverData', ['ctrlData', wcData]);
                                    break;
                            }
                            ;
                            break;
                        default: return;
                    }
                    ;
                }
                ;
            });
            //----------
            ioSocket.on('clientNotifToast', (args) => {
                availCons('[SOCKET.io|EVENT]', '"clientNotifToast"');
                showLocalNotifcation(args[0]);
            });
            //----------
            ioSocket.on('disconnect', (id) => {
                availCons('[SOCKET.io|EVENT]', '"disconnect" - ' + id);
                if (id) {
                    const isC = isIOClient(id);
                    if (isC) {
                        if (isC.o.authInfo && !isC.o.didOffline) {
                            doIOClientNotif('off', isC.i, isC.o.authInfo);
                        }
                        ;
                        ioClients = ioClients.filter(c => c.id === id);
                    }
                }
                ;
            });
        });
        //----------
        io.listen(6969);
        svrListening = true;
        svrDidStart = new Date();
        ioUp = true;
        io.emit('serverStatus', [{ id: svrUUID, hostname: netInfo.info.pc, ip: svrInfo.ip, online: true, time: new Date() }]);
        availCons('initSocket', '[OK] Listening @ ' + svrInfo.ip + ':' + svrInfo.port);
        initBon();
        return Promise.resolve(true);
    }
    catch (e) {
        availCons('initSocket', e);
        ioUp = false;
        svrListening = false;
        return Promise.resolve(false);
    }
}
//------------------------------------------------
async function killZ1BoxSVR() {
    availCons('killZ1BoxSVR', '()...');
    if (z1bSVR !== null) {
        try {
            await killZ1BSVR.terminate();
            z1bSVR = null;
            killZ1BSVR = null;
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(true);
    }
    ;
}
//------------------------------------------------
async function killSVR() {
    availCons('killSVR', '()...');
    if (svrSVR !== null || svrListening === true) {
        try {
            await svrSVRKill.terminate();
            svrSVR = null;
            svrSVRKill = null;
            svrListening = false;
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(true);
    }
    ;
}
//------------------------------------------------
async function initBon() {
    availCons('initBon', '()...');
    if (wcBonInst !== null || wcBonIsUp === true) {
        await killBon();
    }
    ;
    wcBonInst = new bonjour_service_1.default(null, () => { availCons('initBon', 'ERROR Initializing zeroConf/Bonjour Service'); });
    wcBonSvr = wcBonInst.publish({ name: svrUUID + '|' + svrInfo.ip, type: 'http', port: 9696 });
    wcBonIsUp = true;
    netInfo.zConf.isUp = wcBonIsUp;
    return Promise.resolve(true);
}
//------------------------------------------------
function killBon() {
    availCons('killBon', '()...');
    return new Promise((resolve) => {
        if (wcBonInst !== null) {
            try {
                wcBonInst.unpublishAll(() => { wcBonInst.destroy(); netInfo.zConf.name = svrUUID; wcBonSvr = wcBonInst = null; wcBonIsUp = netInfo.zConf.isUp = false; resolve(true); });
            }
            catch (e) {
                resolve(false);
            }
        }
        else {
            resolve(true);
        }
        ;
    });
}
;
//------------------------------------------------
const isIOClient = (id) => { const existI = ioClients.findIndex(c => c.id === id); if (existI === -1) {
    return false;
}
else {
    return { i: existI, o: ioClients[existI] };
} };
//------------------------------------------------
const doIOClientNotif = (onOff, cI, acI, data) => {
    let lN = { type: 'client' + onOff + 'line', title: (acI.label.trim().length > 0 && acI.label.trim() !== '?' ? acI.label.trim() : 'wifiCUE User') + ' ➔ ' + (onOff === 'on' ? '𝗢𝗡' : '𝗢𝗙𝗙') + '𝗟𝗜𝗡𝗘', msg: 'ɪᴘ: ' + acI.ip, duration: 3000 };
    if (data) {
        lN.msg += '\n' + data;
    }
    ;
    showNotification(lN, 'server');
    ioClients[cI]['did' + capd(onOff) + 'line'] = true;
};
//-------------------------------------------------
const cIsBanned = async (clIP) => { let isBanned = false; const ip2MacI = netClients.findIndex(ncO => ncO.ip === clIP); if (ip2MacI !== -1) {
    isBanned = await isBanClient(netClients[ip2MacI].mac);
} ; if (isBanned) {
    return Promise.resolve(true);
}
else {
    return Promise.resolve(false);
} };
//-------------------------------------------------
const addBanClient = async (mac) => {
    const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const rBanF = async () => { const bfExist = await exists(wcBFile), { r, d } = await statSize(wcBFile); if (!bfExist || d === 0) {
        return Promise.resolve([]);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcBFile, { encoding: 'utf-8' });
            if (rR && (Array.isArray(JSON.parse(rR)))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const wBanF = async () => {
        let existBArr = [];
        const getExistBData = await rBanF();
        if (getExistBData === false) {
            availCons('addBanClient', '[ERROR]: Failed to read ./bans file');
            return Promise.resolve(false);
        }
        else {
            existBArr = getExistBData;
            if (existBArr.includes(mac)) {
                availCons('addBanClient', '[SKIPPED]: ./bans file already includes ' + mac);
                return Promise.resolve(true);
            }
            else {
                existBArr.push(mac);
                const updBStr = JSON.stringify(existBArr);
                try {
                    await (0, promises_1.writeFile)(wcBFile, updBStr, { encoding: 'utf-8' });
                    availCons('addBanClient', '[ADDED]: ' + mac + ' written to ./bans file - OK');
                    return Promise.resolve(true);
                }
                catch (e) {
                    availCons('addBanClient', '[ERROR]: Failed to write ' + mac + ' to ./bans file');
                    return Promise.resolve(false);
                }
            }
            ;
        }
        ;
    };
    const addRes = await wBanF();
    if (addRes) {
        let grantDataRes = await rGrantsF();
        if (grantDataRes) {
            let matchId = false;
            for (const [k, v] of Object.entries(grantDataRes)) {
                if (v['mac'] === mac) {
                    matchId = k;
                }
            }
            ;
            if (matchId) {
                availCons('addBanClient', '[INFO]: ./grants DOES include banned mac - removing...');
                delete grantDataRes[matchId];
                const wGrantsF = async (updGrantsObj) => { const updGStr = JSON.stringify(updGrantsObj); try {
                    await (0, promises_1.writeFile)(wcGFile, updGStr, { encoding: 'utf-8' });
                    return Promise.resolve(true);
                }
                catch (e) {
                    console.log(e);
                    return Promise.resolve(false);
                } };
                const writeNewGrantsRes = await wGrantsF(grantDataRes);
                if (writeNewGrantsRes) {
                    availCons('addBanClient', '[SUCCESS]: Successfully Written Updated ./grants Removing ' + mac);
                }
                else {
                    availCons('addBanClient', '[ERROR]: Failed to write updated ./grants file removing ' + mac);
                }
                ;
            }
            else {
                availCons('addBanClient', '[OK]: ./grants did not include banned mac');
            }
            ;
        }
        else {
            availCons('addBanClient', '[ERROR]: Failed to read ./grants to check for banned mac');
        }
        ;
        availCons('addBanClient', '[+ADDED]: ' + mac + ' to ./bans');
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('doInvokeRefreshNetClients');
        }
        ;
        return Promise.resolve(true);
    }
    else {
        availCons('addBanClient', '[ERROR] Writing ' + mac + ' to ./bans Failed');
        return Promise.resolve(false);
    }
    ;
};
//------------------------------------------------
const isBanClient = async (mac) => {
    const rBanF = async () => { const bfExist = await exists(wcBFile), { r, d } = await statSize(wcBFile); if (!bfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcBFile, { encoding: 'utf-8' });
            if (rR && (Array.isArray(JSON.parse(rR)))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const readBFileRes = await rBanF();
    if (readBFileRes === false || readBFileRes.length === 0) {
        return Promise.resolve(false);
    }
    else {
        if (readBFileRes.includes(mac)) {
            availCons('isBanClient', '[YES] - ./bans file includes ' + mac);
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    ;
};
//------------------------------------------------
const removeBanClient = async (mac) => {
    const rBanF = async () => { try {
        const rR = await (0, promises_1.readFile)(wcBFile, { encoding: 'utf-8' });
        if (rR && (Array.isArray(JSON.parse(rR)))) {
            return Promise.resolve(JSON.parse(rR));
        }
        else {
            return Promise.resolve(false);
        }
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const wBanF = async (updBanArr) => { const updBStr = JSON.stringify(updBanArr); try {
        await (0, promises_1.writeFile)(wcBFile, updBStr, { encoding: 'utf-8' });
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const bfExist = await exists(wcBFile), { r, d } = await statSize(wcBFile);
    if (!bfExist || d === 0) {
        availCons('removeBanClient', '[SKIPPED]: ./bans file !exist');
        return Promise.resolve(true);
    }
    else {
        const banFileDataRes = await rBanF();
        if (!banFileDataRes) {
            availCons('removeBanClient', '[ERROR]: Reading ./bans file Failed');
            return Promise.resolve(false);
        }
        else {
            let newBanFileData = banFileDataRes;
            if (!newBanFileData.includes(mac)) {
                availCons('removeBanClient', '[SKIPPED]: ./bans file !include mac');
                return Promise.resolve(true);
            }
            else {
                newBanFileData = newBanFileData.filter(m => m !== mac);
                const writeGFRes = await wBanF(newBanFileData);
                if (writeGFRes) {
                    availCons('removeBanClient', '[+REMOVED]: ' + mac + ' from ./bans');
                    if (wcWindow && wcWindow.webContents) {
                        wcWindow.webContents.send('doInvokeRefreshNetClients');
                    }
                    ;
                    return Promise.resolve(true);
                }
                else {
                    availCons('removeBanClient', '[ERROR] Writing UPD ./bans file');
                    return Promise.resolve(false);
                }
                ;
            }
            ;
        }
        ;
    }
    ;
};
//------------------------------------------------
const addGrantClient = async (cIO) => {
    const genSalt = (l) => { return crypto.randomBytes(Math.ceil(l / 2)).toString().slice(0, l); };
    const sha512 = (p, s) => { const h = crypto.createHmac('sha512', s); h.update(p); const v = h.digest('hex'); return { s: s, h: v }; };
    const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const wGrantsF = async (nGC) => { let existGObj = {}; const getExistGData = await rGrantsF(); if (getExistGData !== false) {
        existGObj = getExistGData;
    } ; existGObj[cIO.id] = nGC; const updGStr = JSON.stringify(existGObj); try {
        await (0, promises_1.writeFile)(wcGFile, updGStr, { encoding: 'utf-8' });
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const shPass = async () => {
        const rPW = cIO.id;
        const nS = genSalt(16);
        const { s, h } = sha512(rPW, nS);
        let nGCO = { date: new Date(), hash: h, salt: s, label: cIO.hostname, ip: cIO.ip, mac: '' };
        if (netInfo && netInfo.clients && netInfo.clients.length > 0) {
            const hasClI = netInfo.clients.findIndex((ncO) => ncO.ip === cIO.ip);
            if (hasClI !== -1) {
                nGCO.mac = netInfo.clients[hasClI].mac;
            }
            ;
        }
        ;
        const writeNewGrantRes = await wGrantsF(nGCO);
        if (writeNewGrantRes) {
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('doInvokeRefreshNetClients');
            }
            ;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    };
    const aGCResult = await shPass();
    return Promise.resolve(aGCResult);
};
//------------------------------------------------
const valGrantClient = async (cId) => {
    const doValidate = (p, hashP, salt) => { let h = crypto.createHmac('sha512', salt); h.update(p); p = h.digest('hex'); return p == hashP; };
    const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const readGFileRes = await rGrantsF();
    if (readGFileRes !== false && readGFileRes.hasOwnProperty(cId)) {
        const gCl = readGFileRes[cId];
        const isValid = doValidate(cId, gCl.hash, gCl.salt);
        return Promise.resolve(isValid);
    }
    else {
        return Promise.resolve(false);
    }
    ;
};
//------------------------------------------------
const aCID2Info = async (id) => {
    try {
        const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
            return Promise.resolve(null);
        }
        else {
            try {
                const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
                if (rR && (await isJSON(rR))) {
                    return Promise.resolve(JSON.parse(rR));
                }
                else {
                    return Promise.resolve(false);
                }
            }
            catch (e) {
                console.log(e);
                return Promise.resolve(false);
            }
        } };
        const readGFileRes = await rGrantsF();
        if (readGFileRes !== false && readGFileRes.hasOwnProperty(id)) {
            const cI = readGFileRes[id];
            return Promise.resolve({ label: cI.label, ip: cI.ip, mac: cI.mac });
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        return Promise.resolve(false);
    }
    ;
};
//------------------------------------------------
const remGrantClient = async (cId) => {
    const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
        return Promise.resolve(null);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const wGrantsF = async (updGrantsObj) => { const updGStr = JSON.stringify(updGrantsObj); try {
        await (0, promises_1.writeFile)(wcGFile, updGStr, { encoding: 'utf-8' });
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    let readGFileRes = await rGrantsF();
    if (readGFileRes === null) {
        return Promise.resolve(true);
    }
    else {
        if (readGFileRes === false) {
            return Promise.resolve(false);
        }
        else {
            if (readGFileRes.hasOwnProperty(cId)) {
                delete readGFileRes[cId];
                const writeUpdGFileRes = await wGrantsF(readGFileRes);
                if (writeUpdGFileRes) {
                    if (wcWindow && wcWindow.webContents) {
                        wcWindow.webContents.send('doInvokeRefreshNetClients');
                    }
                    ;
                    return Promise.resolve(true);
                }
                else {
                    return Promise.resolve(false);
                }
                ;
            }
            else {
                return Promise.resolve(true);
            }
            ;
        }
        ;
    }
    ;
};
//------------------------------------------------
const isAutoGrantOn = () => { if (wcData && wcData.settings.controlRequests.autoResponder.isOn) {
    return wcData.settings.controlRequests.autoResponder.response;
}
else {
    return false;
} };
//------------------------------------------------
const getGrantTO = () => { let defTO = 10; if (wcData && wcData.settings.controlRequests.timeout !== defTO) {
    defTO = wcData.settings.controlRequests.timeout;
} ; return defTO; };
//------------------------------------------------
const doGrantPop = async (cInfo) => {
    let abortCtrl = new AbortController(), wasTO = false;
    const grantBoxOpts = { title: 'Remote Control Requested', message: '! CONTROL REQUEST !\n' + cInfo.hostname + ' (' + cInfo.ip + ')\n[DENY] or [GRANT] the Request?\n\nTime Limit: Ten Seconds (10s)', type: 'question', buttons: ['❌ DENY', '💀 BAN', '✅ GRANT'], defaultId: 2, cancelId: 0, signal: abortCtrl.signal };
    wcWindow.show();
    wcWindow.moveTop();
    wcWindow.focus();
    wcWindow.flashFrame(true);
    const getTO = getGrantTO();
    const respTO = setTimeout(() => { wasTO = true; abortCtrl.abort(); }, (getTO * 1000));
    const rNo = (await electron_1.dialog.showMessageBox(wcWindow, grantBoxOpts)).response;
    clearTimeout(respTO);
    wcWindow.flashFrame(false);
    return Promise.resolve({ result: rNo, to: wasTO });
};
//////////////////////////////////////////////////
// MISC IPC HANDLERS/LISTENERS
//////////////////////////////////////////////////
electron_1.ipcMain.handle('getFFPaths', async (e, args) => {
    if (!ffPaths.ffmpeg || !ffPaths.ffplay || !ffPaths.ffprobe) {
        await initFFMPEG();
    }
    ;
    return Promise.resolve(ffPaths);
});
//------------------------------------------------
electron_1.ipcMain.on('openExplorerPath', (e, args) => { electron_1.shell.showItemInFolder(args[0].replace(/\//g, '\\')); });
//------------------------------------------------
electron_1.ipcMain.handle('handleTWTGetData', async (e, args) => {
    const readDataRes = await readDataFile();
    if (readDataRes) {
        return Promise.resolve(readDataRes);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('handleTWTWriteData', async (e, args) => {
    const readDataRes = await readDataFile();
    if (readDataRes) {
        let baseWCD = readDataRes;
        baseWCD.twtSaveData = args[0];
        const writeDataRes = await writeDataFile(baseWCD);
        if (writeDataRes) {
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('updateTWTData', [args[0]]);
            }
            ;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('handleGetData', async (e, args) => {
    if (!wcDataRWInProg) {
        wcDataRWInProg = true;
        const readDataRes = await readDataFile();
        wcDataRWInProg = false;
        if (readDataRes) {
            return Promise.resolve(readDataRes);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('handleWriteData', async (e, args) => {
    if (!wcDataRWInProg) {
        wcDataRWInProg = true;
        const writeDataRes = await writeDataFile(args[0]);
        wcDataRWInProg = false;
        if (writeDataRes) {
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('handleGetNetworkInfo', async (e, args) => {
    if (!netInfo || args[0]) {
        await getNetInfo();
    }
    ;
    return Promise.resolve(netInfo);
});
//------------------------------------------------
electron_1.ipcMain.handle('handleToggleWCListen', async (e, args) => {
    if (isListen) {
        await killBon();
        await killSVR();
        isListen = false;
        netInfo.isListen = false;
    }
    else {
        await initSocket();
        isListen = true;
        netInfo.isListen = true;
    }
    ;
    await initTray();
    if (ioClients && ioClients.length > 0) {
        io.emit('serverData', ['isListen', isListen]);
    }
    ;
    return Promise.resolve(isListen);
});
//-------------------------------------
electron_1.ipcMain.handle('doAlert', async (e, args) => {
    const doAlert = async (aType, aTitle, aMsg) => {
        const errBoxOpts = { message: aMsg, type: aType, buttons: ['OK'], defaultId: 0, title: aTitle };
        electron_1.dialog.showMessageBox(electron_1.BrowserWindow.getFocusedWindow(), errBoxOpts);
        return Promise.resolve(true);
    };
    await doAlert(args[0], args[1], args[2]);
    return true;
});
//----------------------------------------------
electron_1.ipcMain.handle('doConfirmWake', async (e, args) => {
    const doPopBox = async () => {
        let wakeBoxOpts = { title: 'Wake wifiCUE Early?', type: 'question', icon: natIco('wc-asleepwake-wakepop-ico.png'), message: 'Scheduled wake time is ' + args[0] + '\nAre you sure you want to wake now?', buttons: ['Cancel', 'Wake Now'], defaultId: 1, cancelId: 0 };
        return (await electron_1.dialog.showMessageBox(wcWindow, wakeBoxOpts)).response;
    };
    const wakeConfRes = await doPopBox();
    if (wakeConfRes === 1) {
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//----------------------------------------------
electron_1.ipcMain.handle('listGrantClients', async (e, args) => {
    const rGrantsF = async () => { const gfExist = await exists(wcGFile), { r, d } = await statSize(wcGFile); if (!gfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcGFile, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const gFileData = await rGrantsF();
    if (gFileData === false) {
        return Promise.resolve(false);
    }
    else {
        return Promise.resolve(gFileData);
    }
    ;
});
//----------------------------------------------
electron_1.ipcMain.handle('listBanClients', async (e, args) => {
    const rBanF = async () => { const bfExist = await exists(wcBFile), { r, d } = await statSize(wcBFile); if (!bfExist || d === 0) {
        return Promise.resolve(false);
    }
    else {
        try {
            const rR = await (0, promises_1.readFile)(wcBFile, { encoding: 'utf-8' });
            if (rR && (Array.isArray(JSON.parse(rR)))) {
                return Promise.resolve(JSON.parse(rR));
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    } };
    const bFileData = await rBanF();
    if (!bFileData) {
        return Promise.resolve([]);
    }
    else {
        return Promise.resolve(bFileData);
    }
    ;
});
//----------------------------------------------
electron_1.ipcMain.handle('addBanClient', async (e, args) => {
    await addBanClient(args[0]);
    return Promise.resolve(true);
});
//----------------------------------------------
electron_1.ipcMain.handle('removeBanClient', async (e, args) => {
    await removeBanClient(args[0]);
    return Promise.resolve(true);
});
//----------------------------------------------
electron_1.ipcMain.handle('deauthClient', async (e, args) => {
    const remRes = await remGrantClient(args[0]);
    if (remRes) {
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//----------------------------------------------
electron_1.ipcMain.handle('doUpdCtrlData', (e, args) => {
    wcData = args[0];
    if (ioClients && ioClients.length > 0) {
        io.emit('serverData', ['ctrlData', args[0]]);
    }
    ;
    availCons('ipcMAIN|doUpdCtrlData', '[SOCKET.IO] Sending wcData > ctrlData to Client!');
    return Promise.resolve(true);
});
//----------------------------------------------
electron_1.ipcMain.on('doWinCtrlBtn', async (e, args) => { availCons('doWinCtrlBtn', '(' + args[0] + ')...'); winCtrl(args[0]); });
//----------------------------------------------
electron_1.ipcMain.handle('refreshNetClients', async (e, args) => {
    const freshClientsRes = await getNetClients();
    return Promise.resolve(freshClientsRes);
});
//----------------------------------------------
electron_1.ipcMain.on('setWCWinHeight', async (e, args) => {
    availCons('IPCMain|setWCWinHeight', 'to: ' + String(args[0]) + ' (W) x ' + String(args[1]) + ' (H)');
    if (wcWindow && wcWindow.webContents) {
        wcWindow.setSize(args[0], args[1], true);
    }
    ;
});
//----------------------------------------------
electron_1.ipcMain.on('setOverlayIco', (e, args) => { wcWindow.setOverlayIcon((electron_1.nativeImage.createFromPath((icoP('assets/' + args[0])))), args[1]); });
//----------------------------------------------
electron_1.ipcMain.on('updateIsSleeping', async (e, args) => {
    doKodiSleepWake(args[0]);
    io.emit('serverData', ['isSleep', args[0]]);
    if (args[0]) {
        wcWindow.setOverlayIcon((electron_1.nativeImage.createFromPath((icoP('assets/wcc-window-notif-issleeping-ico.png')))), 'Sleeping (Wake @ ' + args[1] + ')');
    }
    else {
        wcWindow.setOverlayIcon(null, '');
    }
    ;
    isSleep = args[0];
    lastWakeSleep = new Date();
    initTray();
    await doW(1);
    updCUEColors();
    updWLEDColors();
});
//----------------------------------------------
electron_1.ipcMain.on('updateClientSettings', (e, args) => { io.emit('serverData', ['settings', args[0]]); });
//----------------------------------------------
electron_1.ipcMain.on('updateClientDeviceSelect', (e, args) => { io.emit('serverData', ['deviceSelect', args[0]]); });
//----------------------------------------------
electron_1.ipcMain.on('sendAwaitFnDone', (e, args) => {
    if (awaitFnsInProg.includes(args[0])) {
        awaitFnsInProg = awaitFnsInProg.filter(n => n !== args[0]);
    }
    else {
        availCons('sendAwaitFnDone', 'ERROR: ' + args[0] + ' not found in awaitFnsInProg list');
    }
    ;
});
//////////////////////////////////////////////////
// ELECTRON/NATIVE NOTIFICATION FUNCTIONS
//////////////////////////////////////////////////
electron_1.ipcMain.on('sendShowToastNotif', (e, args) => { showNotification(args[0], args[1]); });
//------------------------------------------------
function showClientNotfication(tN) { io.emit('serverNotifToast', [tN]); }
;
//------------------------------------------------
function showLocalNotifcation(tN) {
    const tIcoKeys = { ok: 'wcc-status-green-led.png', warn: 'wcc-status-yellow-led.png', client: 'wcc-client-big-ico.png', server: 'wcc-server-big-ico.png', clientonline: 'wc-client-online-notif-ico.png', clientoffline: 'wc-client-offline-notif-ico.png', kodi: 'wc-kodi-icon.png' };
    const genNIco = (fName) => { return electron_1.nativeImage.createFromPath((icoP('assets/' + fName))); };
    let lNOpts = { title: tN.title, body: tN.msg, silent: true, icon: (genNIco('wcicon.png')), urgency: 'normal', hasReply: false, timeoutType: 'default' };
    if (tN.duration === null) {
        lNOpts.timeoutType = 'never';
    }
    ;
    if (tN.type === 'err') {
        lNOpts.silent = false;
        lNOpts.urgency = 'critical';
        lNOpts.icon = (genNIco('wcc-status-red-led.png'));
    }
    else {
        lNOpts.icon = (genNIco(tIcoKeys[tN.type]));
    }
    ;
    new electron_1.Notification(lNOpts).show();
}
;
//------------------------------------------------
function showNotification(notif, showTo) {
    if (showTo === 'both') {
        showClientNotfication(notif);
        showLocalNotifcation(notif);
    }
    else if (showTo === 'client') {
        showClientNotfication(notif);
    }
    else {
        showLocalNotifcation(notif);
    }
    ;
    if (kodiServiceRunning) {
        if (notif.type === 'clientonline' || notif.type === 'clientoffline') {
            let clientName = notif.title.split(' ')[0].trim();
            if (clientName.includes('-')) {
                clientName = clientName.split('-')[0];
            }
            ;
            sendKodiNote('wifiCUE', 'CONTROL via ' + clientName);
        }
        ;
    }
    ;
}
//////////////////////////////////////////////////
// GENERAL COLOR FUNCTIONS
//////////////////////////////////////////////////
electron_1.ipcMain.on('doUpdColors', async (e, args) => { updCUEColors(); updWLEDColors(); });
//------------------------------------------------
electron_1.ipcMain.on('setLED', async (e, args) => {
    sdk.CorsairSetLedColors(args[0], args[1]);
});
//------------------------------------------------
electron_1.ipcMain.handle('setAllWhiteLights', async (e, args) => {
    z1bColor = [255, 255, 255];
    //if(z1bIsOnline){sendZ1BoxData('color',[255,255,255])};
    if (z1bMQTTOnline) {
        z1bMQTTClient.publish('z1boxcolor', '255,255,255');
    }
    ;
    for (let scI = 0; scI < args[0].length; scI++) {
        sdk.CorsairSetLedColors(args[0][scI].id, args[0][scI].colors);
    }
    ;
    let setWCs = wleds;
    if (wledGroupSyncOn) {
        setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
    }
    ;
    let allWJSON;
    for (let wi = 0; wi < setWCs.length; wi++) {
        setWCs[wi].info.name === 'Zer0WLED6' ? allWJSON = JSON.stringify({ tt: 0, seg: [{ col: [[255, 205, 160]] }] }) : allWJSON = JSON.stringify({ tt: 0, seg: [{ col: [[0, 0, 0, 255]] }] });
        await wledJSONReq(setWCs[wi].info.name, 'post', allWJSON);
    }
    ;
    return Promise.resolve(true);
});
//////////////////////////////////////////////////
// ICUE FUNCTIONS
//////////////////////////////////////////////////
async function initCUESDK() {
    await cueGetConnStatus();
    if (cueSDKStatus.session.code === 0 && cueSDKStatus.error.code === 69) {
        return Promise.resolve(false);
    }
    ;
    if (cueSDKStatus.session.code === 2) {
        await doW(3);
    }
    ;
    if ((cueSDKStatus.error.code === 0 || cueSDKStatus.error.code === 1) && cueSDKStatus.session.code !== 6) {
        sdk.CorsairConnect(async (sS) => {
            cueSDKStatus = await (0, appTypes_1.CUESS2Status)(cueSDKStatus, sS);
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('cueSDKStatus', [cueSDKStatus]);
            }
            ;
        });
    }
    return Promise.resolve(true);
}
;
//-------------------------------------------------
const getSDKVersInfo = () => { let vers = ''; cueSDKStatus.versions ? vers += cueSDKStatus.versions.clientVersion + '/' + cueSDKStatus.versions.serverVersion : vers += 'Unknown'; return vers; };
//-------------------------------------------------
electron_1.ipcMain.on('setCUEDefDevList', (e, args) => { setCUEDefDevList = args[0]; });
//-------------------------------------------------
async function killICUE() {
    return new Promise(async (resolve) => {
        let newDL = [];
        for (let i = 0; i < setCUEDefDevList.length; i++) {
            newDL.push({ id: setCUEDefDevList[i].id, colors: setCUEDefDevList[i].colors.map((ledCO) => { return { id: ledCO.id, r: 255, g: 255, b: 255, a: 255 }; }) });
        }
        ;
        for (let i = 0; i < newDL.length; i++) {
            sdk.CorsairSetLedColors(newDL[i].id, newDL[i].colors);
        }
        ;
        sdk.CorsairDisconnect();
        resolve(true);
    });
}
//------------------------------------------------
electron_1.ipcMain.handle('getCUESDKStatus', async (e, args) => {
    if (cueSDKStatus === null) {
        await cueGetConnStatus();
    }
    ;
    return Promise.resolve(cueSDKStatus);
});
//------------------------------------------------
async function cueGetConnStatus() {
    const strV = (vO) => { return String(vO.major) + '.' + String(vO.minor) + '.' + String(vO.patch); };
    const discoVs = (sVO, sVHO) => { if (Object.values(sVO).every((sV) => Number(sV) === 0) && Object.values(sVHO).every((sVH) => Number(sVH) === 0)) {
        return true;
    }
    else {
        return false;
    } };
    let resCodes = [-1, -1], vStrs = ['0.0.0', '0.0.0', '0.0.0'];
    try {
        const { error, data } = await sdk.CorsairGetSessionDetails();
        if (Number(error) === 0 && (discoVs(data.serverVersion, data.serverHostVersion))) {
            resCodes = [1, 0];
        }
        else {
            resCodes = [0, 0];
        }
        ;
        vStrs = [strV(data.clientVersion), strV(data.serverVersion), strV(data.serverHostVersion)];
    }
    catch (e) {
        resCodes = [0, 69];
        console.log(e);
    }
    ;
    cueSDKStatus = { session: ((0, appTypes_1.getCUESessionStatus)(resCodes[0])), error: ((0, appTypes_1.getCUEErrorStatus)(resCodes[1])), versions: { clientVersion: vStrs[0], serverVersion: vStrs[1], serverHostVersion: vStrs[2] } };
    return Promise.resolve(cueSDKStatus);
}
//------------------------------------------------
electron_1.ipcMain.handle('dType2Str', (e, args) => { return sdk.CorsairDeviceTypeToString(args[0]); });
//------------------------------------------------
electron_1.ipcMain.handle('handleGetDevices', async (e, args) => {
    let newCDevs = { count: 0, devices: [] };
    const cGDRes = sdk.CorsairGetDevices({ deviceTypeMask: sdk.CorsairDeviceType.CDT_All });
    if (Number(cGDRes.error) !== 0) {
        cueSDKStatus.error = (0, appTypes_1.getCUEErrorStatus)(Number(cGDRes.error));
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('cueSDKStatus', [cueSDKStatus]);
        }
        ;
        return Promise.resolve(newCDevs);
    }
    ;
    if (cGDRes.data.length < 1) {
        return Promise.resolve(newCDevs);
    }
    ;
    const devices = cGDRes.data;
    for (let rdI = 0; rdI < devices.length; rdI++) {
        newCDevs.count++;
        let thisDev = { info: devices[rdI], pos: [], colors: [] };
        const { data: ledPositions } = sdk.CorsairGetLedPositions(devices[rdI].id);
        thisDev.pos = ledPositions;
        let rdLEDBC = ledPositions.map((p) => ({ id: p.id, r: 0, g: 0, b: 0, a: 0 }));
        sdk.CorsairGetLedColors(devices[rdI].id, rdLEDBC);
        thisDev.colors = rdLEDBC;
        newCDevs.devices.push(thisDev);
    }
    ;
    return Promise.resolve(newCDevs);
});
//------------------------------------------------
async function updCUEColors() {
    if (setCUEDefDevList === null || setCUEDefDevList.length === 0) {
        await getCUEBlankDeviceLEDs();
    }
    ;
    let dCA = setCUEDefDevList;
    for (let ncI = 0; ncI < dCA.length; ncI++) {
        sdk.CorsairGetLedColors(dCA[ncI].id, dCA[ncI].colors);
    }
    ;
    if (wcWindow.webContents) {
        wcWindow.webContents.send('svrUpdateCUEColors', [dCA]);
    }
    ;
    if (ioClients.length > 0) {
        io.emit('serverColorUpdate', [dCA, true]);
    }
    ;
}
//------------------------------------------------
async function getCUEBlankDeviceLEDs() {
    if (setCUEDefDevList === null || setCUEDefDevList.length === 0) {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('forceCUESetDefList');
            await doW(1);
        }
    }
    ;
    if (setCUEDefDevList === null || setCUEDefDevList.length === 0) {
        return Promise.resolve([]);
    }
    else {
        return Promise.resolve(setCUEDefDevList);
    }
}
//------------------------------------------------
let myAA = [];
let myCA = [];
let myCDirs = [];
const rcO = (lId) => { const rca = myCA[(Math.floor(Math.random() * myCA.length))]; return { id: lId, r: rca[0], g: rca[1], b: rca[2], a: 255 }; };
//------------------------------------------------
electron_1.ipcMain.handle('prepICUEAudioSync', async (e, args) => {
    myAA = [];
    myCDirs = [];
    myCA = args[0];
    if (setCUEDefDevList === null || setCUEDefDevList.length === 0) {
        await getCUEBlankDeviceLEDs();
    }
    ;
    for (let rdI = 0; rdI < setCUEDefDevList.length; rdI++) {
        const { error, data: dInf } = sdk.CorsairGetDeviceInfo(setCUEDefDevList[rdI].id);
        if (!error) {
            const dObj = { id: setCUEDefDevList[rdI].id, count: dInf.ledCount, channels: dInf.channelCount, leds: setCUEDefDevList[rdI].colors };
            myAA.push(dObj);
            myCDirs.push({ c: 0, d: 'u' });
            sdk.CorsairRequestControl(setCUEDefDevList[rdI].id, sdk.CorsairAccessLevel.CAL_ExclusiveLightingControlAndKeyEventsListening);
        }
        ;
    }
    ;
    for (let ndi = 0; ndi < myAA.length; ndi++) {
        for (let li = 0; li < myAA[ndi].leds.length; li++) {
            myAA[ndi].leds[li] = rcO(myAA[ndi].leds[li].id);
        }
    }
    ;
    for (let sdi = 0; sdi < myAA.length; sdi++) {
        sdk.CorsairSetLedColors(myAA[sdi].id, myAA[sdi].leds);
    }
    ;
    return Promise.resolve(true);
});
//-------------------------------------------------
electron_1.ipcMain.on('setICUEAudioSync', async (e, args) => {
    for (let pui = 0; pui < myAA.length; pui++) {
        if (myCDirs[pui].c <= myAA[pui].count / myAA[pui].channels) {
            myCDirs[pui].c++;
        }
        else {
            myCDirs[pui].c = 0;
            myCDirs[pui].d === 'u' ? myCDirs[pui].d = 'd' : myCDirs[pui].d = 'u';
        }
        ;
        let pLO = {};
        for (let puli = 0; puli < myAA[pui].leds.length; puli++) {
            if (myCDirs[pui].d === 'u') {
                if (puli === 0) {
                    pLO = myAA[pui].leds[puli];
                    myAA[pui].leds[puli] = rcO(myAA[pui].leds[puli].id);
                }
                else {
                    const b4O = myAA[pui].leds[puli];
                    pLO.id = myAA[pui].leds[puli].id;
                    myAA[pui].leds[puli] = { id: pLO.id, r: pLO.r, g: pLO.g, b: pLO.b, a: pLO.a };
                    pLO = b4O;
                }
                ;
            }
            else {
                if (puli === (myAA[pui].leds.length - 1)) {
                    myAA[pui].leds[puli] = rcO(myAA[pui].leds[puli].id);
                }
                else {
                    myAA[pui].leds[puli] = { id: myAA[pui].leds[puli].id, r: myAA[pui].leds[(puli + 1)].r, g: myAA[pui].leds[(puli + 1)].g, b: myAA[pui].leds[(puli + 1)].b, a: myAA[pui].leds[(puli + 1)].a };
                }
                ;
            }
            ;
            sdk.CorsairSetLedColors(myAA[pui].id, myAA[pui].leds);
        }
        ;
    }
    ;
});
//////////////////////////////////////////////////
// WLED FUNCTIONS
//////////////////////////////////////////////////
async function killWLEDDupes() {
    const exec = require('child_process').exec;
    let kDTO;
    return new Promise((resolve) => {
        const killP = async (id) => { return new Promise((resolve) => { exec('powershell.exe -Command "Stop-Process -Id ' + String(id) + '"', (error, stdout, stderr) => { if (error || stderr || !stdout) {
            availCons('killWLEDDupes', 'ERROR: Failed to Kill Dupe WLED Process (' + String(id) + ')');
            resolve(false);
        }
        else {
            availCons('killWLEDDupes', 'SUCCESS: Killed Dupe WLED Process (' + String(id) + ')');
            resolve(true);
        } }); }); };
        kDTO = setTimeout(() => { resolve(false); }, 3000);
        exec('powershell.exe -Command "Get-Process WLED | fl Id"', async (error, stdout, stderr) => {
            if (error || stderr || !stdout) {
                clearTimeout(kDTO);
                resolve(true);
            }
            else {
                let pIdsArr = [];
                const rLs = stdout.split('\n');
                for (let li = 0; li < rLs.length; li++) {
                    if (rLs[li].trim().startsWith('Id')) {
                        pIdsArr.push(Number(rLs[li].trim().split(' : ')[1]));
                    }
                }
                ;
                if (pIdsArr.length > 1) {
                    const lastPId = Math.max(...pIdsArr);
                    for (let pi = 0; pi < pIdsArr.length; pi++) {
                        if (pIdsArr[pi] !== lastPId) {
                            await killP(pIdsArr[pi]);
                        }
                    }
                }
                ;
                clearTimeout(kDTO);
                resolve(true);
            }
            ;
        });
    });
}
//------------------------------------------------
electron_1.ipcMain.on('wledCCIndivDevice', (e, args) => {
    let wcName = args[0], newCol = args[1], type = args[2], wledCCIObj = { tt: 5, seg: [{ col: [newCol] }] };
    if (type === 'indiv' && wledGroupSyncOn) {
        wledCCIObj['udpn'] = { nn: true };
    }
    ;
    const wledCCIJSON = JSON.stringify(wledCCIObj);
    wledJSONReq(wcName, 'post', wledCCIJSON);
});
//------------------------------------------------
const wledJSONReq = async (stripName, method, reqData, to) => {
    if (dtlfxIsLive) {
        return Promise.resolve({ r: false, d: null });
    }
    ;
    let stripBaseURL = 'http://192.168.0.10' + stripName.replace('Zer0WLED', '') + '/json/';
    const reqBaseConfig = { timeout: (to ? to : 10000), responseType: 'json', headers: { 'Content-Type': 'application/json' } };
    try {
        let wjReq;
        if (method === 'get') {
            wjReq = await axios_1.default.get(stripBaseURL + reqData, reqBaseConfig);
        }
        else {
            let readyData = reqData;
            if (!(await isVJ(reqData))) {
                if (typeof reqData === 'string') {
                    availCons('wledJSONReq', 'Invalid Post Data');
                    return Promise.resolve({ r: false, d: 'Invalid Post Data' });
                }
                else {
                    const rDJSON = JSON.stringify(reqData);
                    if (!(await isVJ(rDJSON))) {
                        availCons('wledJSONReq', 'Invalid Post Data');
                        return Promise.resolve({ r: false, d: 'Invalid Post Data' });
                    }
                    else {
                        readyData = rDJSON;
                    }
                }
            }
            ;
            wjReq = await axios_1.default.post(stripBaseURL + 'state', readyData, reqBaseConfig);
        }
        ;
        if (wjReq.status === 200 && !_.isEmpty(wjReq.data) && !wjReq.data.hasOwnProperty('error')) {
            if (method === 'get') {
                return Promise.resolve({ r: true, d: wjReq.data });
            }
            else {
                return Promise.resolve({ r: true, d: wjReq.data.success });
            }
        }
        else {
            let rO = { r: false, d: null };
            if (wjReq.data && wjReq.data.hasOwnProperty('error')) {
                rO.d = 'Error Code ' + String(wjReq.data.error);
            }
            ;
            return Promise.resolve(rO);
        }
    }
    catch (kErr) {
        if (kErr.code === 'ECONNREFUSED') {
            return Promise.resolve({ r: false, d: 'Error: Connection Refused' });
        }
        else if (kErr.code === 'ECONNABORTED') {
            return Promise.resolve({ r: false, d: 'Timeout' });
        }
        else {
            if (kErr.hasOwnProperty('response')) {
                return Promise.resolve({ r: false, d: kErr.response.status.toString() + ' - ' + kErr.response.statusText.toString() });
            }
            else {
                return Promise.resolve({ r: false, d: 'Error: Unspecified Error' });
            }
            ;
        }
        ;
    }
    ;
};
//-----------------------------------------------
async function wledSetGrpSyncOn(on) {
    availCons('wledSetGrpSyncOn', '(' + String(on) + ')...');
    if (on) {
        wledGroupSyncOn = true;
        for (let wi = 0; wi < wleds.length; wi++) {
            if (wleds[wi]) {
                const sName = wleds[wi].info.name;
                const sUDPObj = { udpn: onUDPs[sName] };
                const sUDPJSON = JSON.stringify(sUDPObj);
                await wledJSONReq(sName, 'post', sUDPJSON);
                await doW(0.25);
            }
            ;
        }
        ;
        return Promise.resolve(true);
    }
    else {
        wledGroupSyncOn = false;
        for (let wi = 0; wi < wleds.length; wi++) {
            if (wleds[wi]) {
                const sName = wleds[wi].info.name;
                const sUDPObj = { udpn: offUDP };
                const sUDPJSON = JSON.stringify(sUDPObj);
                await wledJSONReq(sName, 'post', sUDPJSON);
                await doW(0.25);
            }
        }
    }
}
//------------------------------------------------
electron_1.ipcMain.handle('isDelayedWLEDInit', (e, args) => { return Promise.resolve(willDoDelayedWLEDInit); });
//------------------------------------------------
async function initWLED() {
    availCons('initWLED', '()...');
    const isDTLFXLiveRes = await wledJSONReq('Zer0WLED1', 'get', 'info');
    if (!isDTLFXLiveRes.r || (isDTLFXLiveRes.r && isDTLFXLiveRes.d.live)) {
        willDoDelayedWLEDInit = true;
        return Promise.resolve(false);
    }
    ;
    await killWLEDDupes();
    wleds = [];
    const nCIPs = netInfo.clients.map(c => c.ip);
    if (wledIPs.length > 0) {
        for (let wi = 0; wi < wledIPs.length; wi++) {
            if (nCIPs.includes(wledIPs[wi])) {
                try {
                    let newWLED = new wled_client_1.WLEDClient({ host: wledIPs[wi] });
                    if ((await newWLED.init())) {
                        wleds.push(newWLED);
                        //-----------
                        wleds[wi].on('update:info', (args) => {
                            if (!termAppInProg && !dtlfxIsLive) {
                                if (args.hasOwnProperty('name') && args.name && args.hasOwnProperty('wifi') && args.wifi && args.wifi.hasOwnProperty('rssi') && args.wifi.rssi && wcWindow && wcWindow.webContents) {
                                    wcWindow.webContents.send('wledRSSI', [{ n: args.name, v: args.wifi.rssi }]);
                                }
                            }
                        });
                        //-----------
                        wleds[wi].on('update:state', (args) => {
                            if (!termAppInProg && !dtlfxIsLive) {
                                if (wleds[wi]) {
                                    if (!kodiVMInProg) {
                                        wleds[wi].state = args;
                                        const wcIndex = wi, nStateObj = args, nMainSeg = nStateObj.segments[0], nPColorArr = nMainSeg.colors[0];
                                        //if(childW&&childW.webContents&&!syncStates.audioSync&&!syncStates.sshotSync){childW.webContents.send('wledColorChange',[nPColorArr])};
                                        if (wcWindow && wcWindow.webContents && !syncStates.audioSync && !syncStates.sshotSync) {
                                            wcWindow.webContents.send('wledEventUpdateState', [{ i: wcIndex, s: nStateObj }]);
                                        }
                                        ;
                                        if (ioClients && ioClients.length > 0) {
                                            io.emit('serverData', ['wledEventUpdateState', wcIndex, nStateObj]);
                                        }
                                        ;
                                    }
                                    ;
                                    if (args && args.hasOwnProperty('udpn') && !_.isEmpty(args.udpn)) {
                                        let goodUDP = {};
                                        wledGroupSyncOn ? goodUDP = onUDPs[wleds[wi].info.name] : goodUDP = offUDP[wleds[wi].info.name];
                                        if (!_.isEqual(args.udpn, goodUDP)) {
                                            const gUDPJSON = JSON.stringify(goodUDP);
                                            wledJSONReq(wleds[wi].info.name, 'post', gUDPJSON);
                                        }
                                    }
                                }
                            }
                        });
                    }
                    ;
                }
                catch (e) {
                    availCons('initWLED', 'ERROR Initiating ' + wledIPs[wi] + ': ' + e);
                }
                ;
            }
            else {
                availCons('initWLED', 'SKIPPED ' + wledIPs[wi] + ': Not FOUND in netClients List');
            }
            ;
        }
        ;
        if (wleds.length > 0) {
            // Set RSSI & Sync Check INT
            rssiINT = setInterval(async () => {
                if (!termAppInProg && !dtlfxIsLive) {
                    let rssiArr = [];
                    if (wleds && wleds.length > 0) {
                        for (let wsi = 0; wsi < wleds.length; wsi++) {
                            try {
                                wleds[wsi].refreshInfo();
                                await doW(0.25);
                                if (wleds[wsi] && wleds[wsi].info && wleds[wsi].info.hasOwnProperty('name') && wleds[wsi].info.name && wleds[wsi].info.hasOwnProperty('wifi') && wleds[wsi].info.wifi && wleds[wsi].info.wifi.hasOwnProperty('rssi') && wleds[wsi].info.wifi.rssi) {
                                    rssiArr.push({ n: wleds[wsi].info.name, v: wleds[wsi].info.wifi.rssi });
                                }
                                ;
                                wleds[wsi].refreshState();
                                await doW(0.25);
                                if (wleds[wsi].state && wleds[wsi].state.hasOwnProperty('udpn') && !_.isEmpty(wleds[wsi].state.udpn)) {
                                    let goodUDP = {};
                                    wledGroupSyncOn ? goodUDP = onUDPs[wleds[wsi].info.name] : goodUDP = offUDP[wleds[wsi].info.name];
                                    if (!_.isEqual(wleds[wsi].state.udpn, goodUDP)) {
                                        const gUDPJSON = JSON.stringify(goodUDP);
                                        wledJSONReq(wleds[wsi].info.name, 'post', gUDPJSON);
                                    }
                                }
                                ;
                            }
                            catch (e) {
                                e = e;
                                return;
                            }
                            ;
                        }
                        ;
                        if (rssiArr.length > 0 && wcWindow && wcWindow.webContents) {
                            wcWindow.webContents.send('wledRSSI', [rssiArr]);
                        }
                        ;
                    }
                    ;
                }
            }, 600000);
            // Reset Colors/Bri to RealWhite/80%
            let wCs = wleds;
            if (wledGroupSyncOn) {
                wCs = wCs.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6');
            }
            ;
            for (let wci = 0; wci < wCs.length; wci++) {
                if (wCs[wci].info.name === 'Zer0WLED6') {
                    if (wCs[wci].state.brightness !== 255 || !_.isEqual(wCs[wci].state.segments[0].colors[0], [255, 205, 160])) {
                        const defCB = JSON.stringify({ tt: 10, bri: 255, seg: [{ col: [[255, 205, 160]] }] });
                        await wledJSONReq(wCs[wci].info.name, 'post', defCB);
                    }
                    ;
                }
                else {
                    if (wCs[wci].state.brightness !== 127 || !_.isEqual(wCs[wci].state.segments[0].colors[0], [0, 0, 0, 255])) {
                        const defCB = JSON.stringify({ tt: 10, bri: 127, seg: [{ col: [[0, 0, 0, 255]] }] });
                        await wledJSONReq(wCs[wci].info.name, 'post', defCB);
                    }
                    ;
                }
                ;
            }
            ;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(false);
    }
    ;
}
;
//------------------------------------------------
electron_1.ipcMain.handle('getWLEDGrpLeads', (e, args) => { return Promise.resolve(wledGrpLeads); });
electron_1.ipcMain.handle('getWLEDGrpMembs', (e, args) => { return Promise.resolve(wledGrpMembrs); });
//------------------------------------------------
electron_1.ipcMain.on('kbKnobAdjust', (e, args) => { if (args[0] === 'brightness') {
    kbKnobAdjust(args[0], args[1]);
}
else {
    kbKnobAdjust(args[0]);
} });
function kbKnobAdjust(type, incDec) {
    availCons('kbKnobAdjust', '(' + type + ',' + (incDec ? incDec : 'N/A') + ')...');
    let wCs = wleds;
    if (wledGroupSyncOn) {
        wCs = wCs.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6');
    }
    ;
    if (!dtlfxIsLive) {
        if (type === 'brightness') {
            for (let wi = 0; wi < wCs.length; wi++) {
                let newB = wCs[wi].state.brightness;
                incDec === 'inc' ? newB = newB + 25 : newB = newB - 25;
                if (newB > 255) {
                    newB = 255;
                }
                ;
                if (newB < 0) {
                    newB = 0;
                }
                ;
                wCs[wi].updateState({ brightness: newB });
            }
        }
        else {
            for (let wi = 0; wi < wCs.length; wi++) {
                let newC;
                if (wCs[wi].info.name === 'Zer0WLED6') {
                    newC = (_.isEqual(wCs[wi].state.segments[0].colors[0], [0, 0, 0]) ? [255, 205, 160] : [0, 0, 0]);
                }
                else {
                    newC = (_.isEqual(wCs[wi].state.segments[0].colors[0], [0, 0, 0, 0]) ? [0, 0, 0, 255] : [0, 0, 0, 0]);
                }
                ;
                wCs[wi].setColor(newC);
            }
        }
    }
}
//------------------------------------------------
electron_1.ipcMain.handle('getWLEDColors', (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve([]);
    }
    ;
    let colArrs = [];
    for (let wi = 0; wi < wleds.length; wi++) {
        if (wleds[wi]) {
            const w = wleds[wi];
            w.refreshState();
            colArrs.push(wleds[wi].state.segments[0].colors[0]);
        }
        ;
    }
    ;
    return Promise.resolve(colArrs);
});
//------------------------------------------------
async function updWLEDColors() {
    if (!dtlfxIsLive && !syncStates.audioSync && !syncStates.sshotSync) {
        let resObj = {};
        for (let wi = 0; wi < wleds.length; wi++) {
            if (wleds[wi]) {
                let segColorsArr = [];
                await wleds[wi].refreshState();
                for (let si = 0; si < wleds[wi].state.segments.length; si++) {
                    segColorsArr.push(wleds[wi].state.segments[si].colors);
                }
                ;
                resObj[wleds[wi].info.name] = segColorsArr;
            }
            ;
        }
        ;
        if (wcWindow.webContents) {
            wcWindow.webContents.send('svrUpdateWLEDColors', [resObj]);
        }
        ;
        if (ioClients.length > 0) {
            io.emit('serverWLEDColorUpdate', [resObj]);
        }
        ;
    }
    ;
}
//------------------------------------------------
electron_1.ipcMain.handle('getWLEDS', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve([]);
    }
    ;
    availCons('ipcMAIN|getWLEDS', '()...');
    let activeWLEDS = [];
    for (let wi = 0; wi < wleds.length; wi++) {
        if (wleds[wi]) {
            const tWC = wleds[wi], actWLEDObj = { id: wi, ip: '192.168.0.10' + tWC.info.name.replace('Zer0WLED', ''), effects: tWC.effects, palettes: tWC.palettes, presets: tWC.presets, info: tWC.info, state: tWC.state };
            activeWLEDS.push(actWLEDObj);
        }
    }
    ;
    return Promise.resolve(activeWLEDS);
});
//-------------------------------------------------
electron_1.ipcMain.handle('refreshWLED', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve(false);
    }
    ;
    const refreshOpts = ['Config', 'Context', 'Effects', 'Info', 'Palettes', 'Presets', 'State'];
    let resArr = [];
    if (refreshOpts.includes(capd(args[0]))) {
        const methodStr = 'refresh' + capd(args[0]);
        for (let wi = 0; wi < wleds.length; wi++) {
            await wleds[methodStr]();
            await doW(0.25);
            resArr.push(wleds[args[0]]);
        }
        ;
        return Promise.resolve(resArr);
    }
    else {
        availCons('ipcMain|refreshWLED', 'ERROR: Unknown Refresh Option: ' + capd(args[0]));
        return Promise.resolve(false);
    }
    ;
});
//-------------------------------------------------
electron_1.ipcMain.handle('wledListEffects', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve([]);
    }
    ;
    let resArr = [];
    for (let wi = 0; wi < wleds.length; wi++) {
        await wleds[wi].refreshEffects();
        if (wleds[wi] && wleds[wi].effects) {
            resArr.push(wleds[wi].effects);
        }
        else {
            resArr.push(false);
        }
        ;
    }
    ;
    return Promise.resolve(resArr);
});
//-------------------------------------------------
electron_1.ipcMain.handle('wledListPalettes', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve([]);
    }
    ;
    let resArr = [];
    for (let wi = 0; wi < wleds.length; wi++) {
        await wleds[wi].refreshPalettes();
        if (wleds[wi] && wleds[wi].palettes) {
            resArr.push(wleds[wi].palettes);
        }
        else {
            resArr.push(false);
        }
        ;
    }
    ;
    return Promise.resolve(resArr);
});
//-------------------------------------------------
electron_1.ipcMain.handle('wledGetState', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve([]);
    }
    ;
    let resArr = [];
    for (let wi = 0; wi < wleds.length; wi++) {
        await wleds[wi].refreshState();
        if (wleds[wi] && wleds[wi].state) {
            resArr.push(wleds[wi].state);
        }
        else {
            resArr.push(false);
        }
        ;
    }
    ;
    return Promise.resolve(resArr);
});
//--------------------------------------------------
electron_1.ipcMain.handle('wledSetColor', async (e, args) => {
    if (dtlfxIsLive) {
        return Promise.resolve(false);
    }
    ;
    const color = args[0], trans = args[1];
    if (z1bMQTTOnline) {
        let lcdColorArr = [];
        if (typeof color === 'string') {
            lcdColorArr = [255, 255, 255];
        }
        else {
            lcdColorArr = [color[0], color[1], color[2]];
        }
        ;
        z1bColor = lcdColorArr;
        let z1boxcolorStr = String(lcdColorArr[0]) + ',' + String(lcdColorArr[1]) + ',' + String(lcdColorArr[2]);
        z1bMQTTClient.publish('z1boxcolor', z1boxcolorStr);
    }
    ;
    let setWCs = wleds;
    if (wledGroupSyncOn) {
        setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
    }
    ;
    for (let wi = 0; wi < setWCs.length; wi++) {
        let ncJSONObj = { tt: 0, seg: [{ col: [args[0]] }] };
        if (setWCs[wi].info.name === 'Zer0WLED6') {
            if (color === 'white' || (color[0] === 255 && color[1] === 255 && color[2] === 255)) {
                ncJSONObj.seg[0].col = [[255, 205, 160]];
            }
            else {
                ncJSONObj.seg[0].col = [[args[0][0], args[0][1], args[0][2]]];
            }
            ;
        }
        else {
            if (color === 'white' || (color[0] === 255 && color[1] === 255 && color[2] === 255)) {
                ncJSONObj.seg[0].col = [[0, 0, 0, 255]];
            }
        }
        ;
        const ncJSON = JSON.stringify(ncJSONObj);
        await wledJSONReq(setWCs[wi].info.name, 'post', ncJSON);
    }
    ;
    return Promise.resolve(true);
});
//-------------------------------------------------
async function wledSetColor(color, trans) {
    if (dtlfxIsLive) {
        return Promise.resolve(false);
    }
    ;
    let setWCs = wleds;
    if (wledGroupSyncOn) {
        setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
    }
    ;
    for (let wi = 0; wi < setWCs.length; wi++) {
        if (setWCs[wi].info.name === 'Zer0WLED6') {
            await setWCs[wi].setColor([color[0], color[1], color[2]], { transition: trans });
        }
        else {
            await setWCs[wi].setColor([color[0], color[1], color[2], color[3]], { transition: trans });
        }
        ;
    }
    ;
    return Promise.resolve(true);
}
//-------------------------------------------------
electron_1.ipcMain.handle('wledDoSleep', async (e, args) => {
    if (z1bIsOnline) {
        sendZ1BoxData('sleep', true);
    }
    ;
    const doSleepSeq = async (wClient) => {
        await wClient.refreshState();
        if (wClient.state.segments[0].effectId !== 0) {
            await wClient.setEffect(0, { transition: 0 });
        }
        ;
        wClient.setBrightness(0, { transition: 15 });
        return Promise.resolve(true);
    };
    if (syncStates.audioSync) {
        wcWindow.webContents.send('traySync2Audio', ['stop']);
        await doW(2);
    }
    ;
    if (syncStates.sshotSync) {
        wcWindow.webContents.send('animSShotToggle', ['stop']);
        await doW(2);
    }
    ;
    if (!dtlfxIsLive) {
        let setWCs = wleds;
        if (wledGroupSyncOn) {
            setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
        }
        ;
        for (let wi = 0; wi < setWCs.length; wi++) {
            await doSleepSeq(setWCs[wi]);
        }
        ;
    }
    ;
    return Promise.resolve(true);
});
//-------------------------------------------------
electron_1.ipcMain.handle('wledDoWake', async (e, args) => {
    if (z1bIsOnline) {
        sendZ1BoxData('wake', true);
    }
    ;
    if (!dtlfxIsLive) {
        let setWCs = wleds;
        if (wledGroupSyncOn) {
            setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
        }
        ;
        for (let wi = 0; wi < setWCs.length; wi++) {
            if (setWCs[wi].info.name === 'Zer0WLED6') {
                await wledJSONReq(setWCs[wi].info.name, 'post', (JSON.stringify({ tt: 15, bri: 204, seg: [{ col: [[255, 205, 160]] }] })));
            }
            else {
                await wledJSONReq(setWCs[wi].info.name, 'post', (JSON.stringify({ tt: 15, bri: 204, seg: [{ col: [[0, 0, 0, 255]] }] })));
            }
            ;
        }
        ;
    }
    ;
    return Promise.resolve(true);
});
//-------------------------------------------------
electron_1.ipcMain.handle('wledDoChimeStart', async (e, args) => {
    if (!dtlfxIsLive && !syncStates.audioSync && !syncStates.sshotSync && !isSleep && !noteLightsInProg && !chimeLightsInProg && !kodiVMInProg) {
        availCons('ipcMain|wledDoChimeStart', '(' + args[0] + ')...');
        chimeLightsInProg = true;
        const cNo2PsId = { 4: 11, 3: 12, 2: 13, 1: 14 }, chimePS = cNo2PsId[args[0]], chimeWait = (0.7 * args[0]) + 1;
        let setWCs = wleds;
        if (wledGroupSyncOn) {
            setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4');
        }
        ;
        for (let wi = 0; wi < setWCs.length; wi++) {
            await srWLEDState('s', setWCs[wi].info.name);
            setWCs[wi].setPreset(chimePS);
        }
        ;
        await doW(chimeWait);
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//-------------------------------------------------
async function srWLEDState(saveRestore, wcName) {
    const psNo = 100 + Number(wcName.replace('Zer0WLED', ''));
    if (saveRestore === 's') {
        await wledJSONReq(wcName, 'post', (JSON.stringify({ psave: psNo })));
    }
    else {
        await wledJSONReq(wcName, 'post', { tt: 0, ps: psNo });
        await doW(0.25);
        await wledJSONReq(wcName, 'post', (JSON.stringify({ pdel: psNo })));
    }
    return Promise.resolve(true);
}
//-------------------------------------------------
electron_1.ipcMain.handle('wledDoChimeStop', async (e, args) => {
    if (!dtlfxIsLive && !syncStates.audioSync && !syncStates.sshotSync && !isSleep && !noteLightsInProg && !kodiVMInProg) {
        let setWCs = wleds;
        if (wledGroupSyncOn) {
            setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4');
        }
        ;
        for (let wi = 0; wi < setWCs.length; wi++) {
            await srWLEDState('r', setWCs[wi].info.name);
        }
        ;
        chimeLightsInProg = false;
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
});
//-------------------------------------------------
async function doWLEDToggleSync() {
    availCons('doWLEDToggleSync', '()...');
    if (!dtlfxIsLive) {
        const newTogState = (wledGroupSyncOn ? false : true);
        await wledSetGrpSyncOn(newTogState);
    }
    ;
    return Promise.resolve(true);
}
;
//-------------------------------------------------
electron_1.ipcMain.on('wledToggleSync', async (e, args) => {
    availCons('IPCMAIN|wledToggleSync', '()...');
    if (!dtlfxIsLive) {
        await doWLEDToggleSync();
    }
});
//-------------------------------------------------
electron_1.ipcMain.on('wledFnChange', async (e, args) => {
    if (dtlfxIsLive) {
        return;
    }
    ;
    availCons('wledFnChange', args);
    const wledDeviceIndex = args[0].index;
    const wledDev = wleds[wledDeviceIndex];
    const wledFnType = args[0].type;
    const wledNewId = args[0].id;
    switch (wledFnType) {
        case 'fxSpeed':
            await wledDev.setEffectSpeed(wledNewId);
            await doW(0.5);
            break;
        case 'fxInt':
            await wledDev.setEffectIntensity(wledNewId);
            await doW(0.5);
            break;
        case 'effects':
            await wledDev.setPreset(-1);
            await doW(0.5);
            await wledDev.setEffect(Number(wledNewId), { segmentId: 0 });
            break;
        case 'presets':
            await wledDev.setEffect(-1, { segmentId: 0 });
            await doW(0.5);
            await wledDev.setPreset((wledNewId + 1));
            break;
    }
    ;
    await doW(0.5);
    initTray();
});
//-------------------------------------------------
electron_1.ipcMain.on('serverAdjustWLEDBright', (e, args) => {
    adjustWLEDBright(args[0], args[1], args[2], args[3]);
});
//-------------------------------------------------
async function adjustWLEDBright(v, isSync, devIndex, wledName) {
    if (dtlfxIsLive) {
        return;
    }
    ;
    const setB = async (wClient, v) => { if (wClient) {
        try {
            await wClient.updateState({ brightness: v });
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(false);
    } };
    let setWCIndex = wleds.findIndex((wc) => wc.info.name === wledName);
    if (setWCIndex !== -1) {
        const setWCBri = wleds[setWCIndex].state.brightness;
        if (isSync) {
            if (wledName === 'Zer0WLED2' || wledName === 'Zer0WLED3') {
                const masterWCIndex = wleds.findIndex((wc) => wc.info.name === 'Zer0WLED1');
                if (masterWCIndex !== -1) {
                    const masterBri = wleds[masterWCIndex].state.brightness;
                    if (setWCBri !== masterBri) {
                        await setB(wleds[setWCIndex], masterBri);
                    }
                }
            }
            else if (wledName === 'Zer0WLED5') {
                const masterWCIndex = wleds.findIndex((wc) => wc.info.name === 'Zer0WLED4');
                if (masterWCIndex !== -1) {
                    const masterBri = wleds[masterWCIndex].state.brightness;
                    if (setWCBri !== masterBri) {
                        await setB(wleds[setWCIndex], masterBri);
                    }
                }
            }
            else if (wledName === 'Zer0WLED7' || wledName === 'Zer0WLED8' || wledName === 'Zer0WLED9') {
                const masterWCIndex = wleds.findIndex((wc) => wc.info.name === 'Zer0WLED6');
                if (masterWCIndex !== -1) {
                    const masterBri = wleds[masterWCIndex].state.brightness;
                    if (setWCBri !== masterBri) {
                        await setB(wleds[setWCIndex], masterBri);
                    }
                }
            }
            else {
                if (v !== setWCBri) {
                    await setB(wleds[setWCIndex], v);
                }
            }
        }
        else {
            if (v !== setWCBri) {
                await setB(wleds[setWCIndex], v);
            }
        }
    }
    ;
}
//////////////////////////////////////////////////
// @HOME / MOTION SENSORS
//////////////////////////////////////////////////
electron_1.ipcMain.on('pirsOn', (e, args) => { pirsPower = args[0]; });
electron_1.ipcMain.on('pirsInit', (e, args) => { pirsPower = args[0]; pirsOnline = args[1]; startMotionDetectListener(); });
electron_1.ipcMain.handle('getPIRWLEDIndexes', (e, args) => { return Promise.resolve(pirWLEDIndexes); });
//-----------------------
async function killMDSVR() {
    if (mdSVR) {
        try {
            await mdSVRKill.terminate();
            mdSVR = null;
            mdSVRKill = null;
            return Promise.resolve(true);
        }
        catch (e) {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        return Promise.resolve(true);
    }
    ;
}
//-----------------------
async function startMotionDetectListener() {
    const mdCons = (t, m) => { let pf = 'startMotionDetectListener|'; t === 'i' ? pf += 'INF' : pf === 'req' ? pf += 'REQ' : pf += 'RES'; availCons(pf, m); };
    mdCons('i', 'STARTING MotionDetect SVR...');
    if (wleds && wleds.length > 0) {
        for (let wi = 0; wi < wleds.length; wi++) {
            const wC = wleds[wi];
            if (wC.info && wC.info.hasOwnProperty('name') && wC.info.name && wC.info.name.startsWith('Zer0WLED')) {
                const stripNo = Number(wC.info.name.toString().replace('Zer0WLED', ''));
                pirWLEDIndexes[stripNo] = wi;
            }
        }
    }
    ;
    if (!_.isEmpty(pirWLEDIndexes)) {
        availCons('startMotionDetectListener', 'Created pirWLEDIndex Object:');
        for (const [k, v] of Object.entries(pirWLEDIndexes)) {
            availCons('startMotionDetectListener', ' < ' + String(k) + ' > Zer0neWLED' + String(k) + ' - WLEDS Index = ' + String(v));
        }
        ;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('setPIRWLEDIndexes', [pirWLEDIndexes]);
        }
        ;
    }
    else {
        availCons('startMotionDetectListener', 'Failed to create pirWLEDIndex Object');
    }
    ;
    if (mdSVR) {
        await killMDSVR();
    }
    ;
    try {
        mdSVR = http.createServer((req, res) => {
            const isAuth = (ip, head) => { if (ip.startsWith('192.168.0.20') && head.hasOwnProperty('zauth') && head.zauth && head.zauth.toString().trim().length > 0 && head.zauth.toString().trim() === '*******3') {
                return true;
            }
            else {
                return false;
            } };
            const mdReqMethod = req.method.toLocaleLowerCase();
            const mdReqIP = req.socket.remoteAddress.replace('::ffff:', '');
            const parsedUrl = url.parse(req.url, true);
            const mdReqPath = parsedUrl.pathname || ' ';
            const mdReqQParam = parsedUrl.search || null;
            const mdReqHeads = req.headers;
            //------------
            if (!isAuth(mdReqIP, mdReqHeads)) {
                res.writeHead(401);
                res.end();
                mdCons('req', '[401] Unauthorized Client (' + mdReqIP + ')');
            }
            ;
            switch (mdReqMethod) {
                // [GET] Requests ------
                case 'get':
                    mdCons('req', '[GET] ' + mdReqPath + (mdReqQParam ? ' with [QP] ' + mdReqQParam : ' ') + 'from ' + mdReqIP);
                    switch (mdReqPath) {
                        default:
                            res.writeHead(404);
                            res.end();
                            mdCons('res', '[404] Bad Path');
                            break;
                    }
                    ;
                    break;
                // [POST] Requests ------
                case 'post':
                    let rawD = '';
                    switch (mdReqPath) {
                        case '/status':
                            req.on('data', (chunk) => { rawD += chunk; });
                            req.on('end', async () => {
                                if (rawD) {
                                    if (rawD && rawD.toString().trim().length > 0 && rawD.toString().trim().startsWith('pir')) {
                                        const pirNo = Number(rawD && rawD.toString().trim().replace('pir', ''));
                                        wcWindow.webContents.send('motionDetectData', ['status', pirNo]);
                                    }
                                    ;
                                }
                                ;
                                res.writeHead(200);
                                res.end();
                            });
                            break;
                        case '/motion':
                            req.on('data', (chunk) => { rawD += chunk; });
                            req.on('end', async () => {
                                res.writeHead(200);
                                res.end();
                                if (rawD) {
                                    if (rawD && rawD.toString().trim().length > 0 && rawD.toString().trim().startsWith('pir')) {
                                        const pirNo = Number(rawD && rawD.toString().trim().replace('pir', ''));
                                        if (pirsPower && !_.isEmpty(pirWLEDIndexes)) {
                                            if (!dtlfxIsLive && !isSleep && !syncStates.audioSync && !syncStates.sshotSync && !noteLightsInProg && !chimeLightsInProg && !kodiVMInProg) {
                                                motionLightsTrigger(pirNo);
                                            }
                                            ;
                                        }
                                        ;
                                        wcWindow.webContents.send('motionDetectData', ['motion', pirNo]);
                                    }
                                    ;
                                }
                                ;
                            });
                            break;
                        default:
                            res.writeHead(404);
                            res.end();
                            mdCons('res', '[404] Bad Path');
                            break;
                    }
                    ;
                    break;
                // [BAD] Requests ------
                default:
                    res.writeHead(405);
                    res.end();
                    mdCons('res', '[405] Method Not Allowed (' + mdReqMethod + ')');
                    break;
            }
            ;
        }).listen(1010);
        mdSVRKill = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: mdSVR });
        mdCons('i', 'STARTED MotionDetect SVR => RUNNING @ http://localhost:1010');
        await doW(1);
        const onUDPs = { Zer0WLED1: { send: true, recv: true, sgrp: 1, rgrp: 1 }, Zer0WLED2: { send: false, recv: true, sgrp: 0, rgrp: 1 }, Zer0WLED3: { send: false, recv: true, sgrp: 0, rgrp: 1 }, Zer0WLED4: { send: true, recv: true, sgrp: 2, rgrp: 2 }, Zer0WLED5: { send: false, recv: true, sgrp: 0, rgrp: 2 } };
        for (let wi = 0; wi < wleds.length; wi++) {
            if (wleds[wi]) {
                const sName = wleds[wi].info.name;
                const sUDPObj = { udpn: onUDPs[sName] };
                const sUDPJSON = JSON.stringify(sUDPObj);
                await wledJSONReq(sName, 'post', sUDPJSON);
                await doW(0.25);
            }
            ;
        }
        ;
        if (!dtlfxIsLive) {
            for (let wi = 0; wi < wleds.length; wi++) {
                if (wleds[wi]) {
                    const wC = wleds[wi];
                    if (wC.info.name === 'Zer0WLED4' || wC.info.name === 'Zer0WLED5') {
                        wC.setBrightness(1);
                    }
                    ;
                }
                ;
            }
            ;
        }
    }
    catch (e) {
        mdCons('i', 'ERROR: ' + e);
    }
}
//////////////////////////////////////////////////
// MOTION LIGHTS
//////////////////////////////////////////////////
function motionLightsTrigger(pirNo) {
    pirTCounts[pirNo]++;
    if (wcWindow && wcWindow.webContents) {
        wcWindow.webContents.send('motionTriggerData', [pirNo, { count: pirTCounts[pirNo], countTOS: pirCountSecsINT[pirNo].secs }]);
    }
    ;
    if (pirTCounts[pirNo] === 1) {
        const trigMS = new Date().getTime();
        pirSTimes[pirNo] = trigMS;
        availCons('motionLights|TRIGGER', 'PIR ' + String(pirNo) + ' - [TRIGGER|Count]: ' + String(pirTCounts[pirNo]) + ' / ' + String(pirMinCount[pirNo]) + ' @ 0s');
        if (pirCountTO[pirNo] !== null) {
            clearTimeout(pirCountTO[pirNo]);
            pirCountTO[pirNo] = null;
        }
        ;
        pirCountTO[pirNo] = setTimeout(() => { pirSTimes[pirNo] = 0; pirTCounts[pirNo] = 0; pirCountTO[pirNo] = null; }, (pirCountMaxTimeS[pirNo] * 1000));
        if (pirCountSecsINT[pirNo].int !== null) {
            clearInterval(pirCountSecsINT[pirNo].int);
            pirCountSecsINT[pirNo].int = null;
            pirCountSecsINT[pirNo].secs = pirCountMaxTimeS[pirNo];
        }
        ;
        pirCountSecsINT[pirNo].int = setInterval(() => {
            if (pirCountSecsINT[pirNo].secs > 0) {
                pirCountSecsINT[pirNo].secs--;
                if (wcWindow && wcWindow.webContents) {
                    wcWindow.webContents.send('motionTriggerData', [pirNo, { count: pirTCounts[pirNo], countTOS: pirCountSecsINT[pirNo].secs }]);
                }
                ;
            }
            else {
                clearInterval(pirCountSecsINT[pirNo].int);
            }
        }, 1000);
    }
    else if (pirTCounts[pirNo] > 1 && pirTCounts[pirNo] < pirMinCount[pirNo]) {
        const nowMS = new Date().getTime();
        const msDiff = nowMS - pirSTimes[pirNo];
        const durStr = (msDiff / 1000).toFixed(1) + 's';
        availCons('motionLights|TRIGGER', 'PIR ' + String(pirNo) + ' - [TRIGGER|Count]: ' + String(pirTCounts[pirNo]) + ' / ' + String(pirMinCount[pirNo]) + ' @ ' + durStr);
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('motionTriggerData', [pirNo, { count: pirTCounts[pirNo], countTOS: pirCountSecsINT[pirNo].secs }]);
        }
        ;
        return;
    }
    else if (pirTCounts[pirNo] >= pirMinCount[pirNo]) {
        const nowMS = new Date().getTime();
        const msDiff = nowMS - pirSTimes[pirNo];
        const durStr = (msDiff / 1000).toFixed(1) + 's';
        availCons('motionLights|TRIGGER', 'PIR ' + String(pirNo) + ' - [TRIGGER|Count]: ' + String(pirTCounts[pirNo]) + ' / ' + String(pirMinCount[pirNo]) + ' @ ' + durStr);
        if (pirCountTO[pirNo] !== null) {
            clearTimeout(pirCountTO[pirNo]);
            pirCountTO[pirNo] = null;
        }
        ;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('motionTriggerData', [pirNo, { count: pirTCounts[pirNo], countTOS: pirCountSecsINT[pirNo].secs }]);
        }
        ;
        if (pirTCounts[pirNo] > pirMinCount[pirNo]) {
            if (pirNo === 1) {
                if (webcamMotion) {
                    motionLightsOn(pirNo);
                }
            }
            else {
                motionLightsOn(pirNo);
            }
        }
        else {
            motionLightsOn(pirNo);
        }
        ;
    }
    ;
}
;
//-------------------------------------------------
function motionLightsOn(pirNo) {
    const nowMS = new Date().getTime();
    const msDiff = nowMS - pirSTimes[pirNo];
    const durStr = (msDiff / 1000).toFixed(1) + 's';
    if (!pirWLEDInProg[pirNo]) {
        pirWLEDInProg[pirNo] = true;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('motionCtrlData', [pirNo, { ctrl: pirWLEDInProg[pirNo], ctrlTOS: pirWLEDSecsINT[pirNo].secs }]);
        }
        ;
        const motMS = new Date().getTime();
        pirSTimes[pirNo] = motMS;
        const motUTS = motMS / 1000;
        const motDate = (0, date_fns_1.fromUnixTime)(motUTS);
        const motNice = (0, date_fns_1.format)(motDate, 'HH:mm:ss');
        availCons('motionLights|!MOTION', 'PIR ' + String(pirNo) + ' - [MOTION|Start]: @ ' + motNice + ' (0.0s)');
        let pirWLEDStripNos = [];
        if (wledGroupSyncOn) {
            pirWLEDStripNos = pir2WLEDMapSync[pirNo];
        }
        else {
            pirWLEDStripNos = pir2WLEDMap[pirNo];
        }
        ;
        for (let pli = 0; pli < pirWLEDStripNos.length; pli++) {
            const stripIndex = pirWLEDIndexes[pirWLEDStripNos[pli]];
            const stripName = wleds[stripIndex].info.name;
            if (pirNo === 1) {
                const pir1MotionJSON = JSON.stringify({ transition: 0, bri: 255 });
                wledJSONReq(stripName, 'post', pir1MotionJSON);
            }
            else if (pirNo === 2) {
                const wledZ1Index = wleds.findIndex((wc) => wc.info.name === 'Zer0WLED1');
                if (wledZ1Index !== -1) {
                    pir2PrevBri = wleds[wledZ1Index].state.brightness;
                    pir2PrevColor = wleds[wledZ1Index].state.segments[0].colors[0];
                    const stairStateJSON = JSON.stringify({ tt: 0, udpn: { nn: true }, seg: [{ bri: 255, start: 250, col: [[255, 255, 255, 255]] }] });
                    wledJSONReq('Zer0WLED1', 'post', stairStateJSON);
                }
            }
            else if (pirNo === 3) {
                //if(wcWindow&&wcWindow.webContents&&isSleep){wcWindow.webContents.send('clientDoWakeSleep',['wake'])}
            }
            ;
        }
        ;
    }
    else {
        availCons('motionLights|!MOTION', 'PIR ' + String(pirNo) + ' - [MOTION|Count]: ' + String(pirTCounts[pirNo]) + ' / ' + String(pirMinCount[pirNo]) + ' @ ' + durStr);
    }
    ;
    if (pirWLEDTO[pirNo] !== null) {
        clearTimeout(pirWLEDTO[pirNo]);
        pirWLEDTO[pirNo] = null;
        clearInterval(pirWLEDSecsINT[pirNo].int);
        pirWLEDSecsINT[pirNo].int = null;
        pirWLEDSecsINT[pirNo].secs = pirCtrlLastsS[pirNo];
    }
    ;
    pirWLEDTO[pirNo] = setTimeout(async () => {
        const getAddSecsNow = getAddSecs(pirNo);
        if (getAddSecsNow > 0) {
            await doW(getAddSecsNow);
            motionLightsReset(pirNo);
        }
        else {
            motionLightsReset(pirNo);
        }
        ;
    }, (pirCtrlLastsS[pirNo] * 1000));
    pirWLEDSecsINT[pirNo].int = setInterval(() => {
        if (pirWLEDSecsINT[pirNo].secs === 0) {
            if (pirWLEDSecsINT[pirNo].int !== null) {
                clearInterval(pirWLEDSecsINT[pirNo].int);
                pirWLEDSecsINT[pirNo].int = null;
                pirWLEDSecsINT[pirNo].secs = pirCtrlLastsS[pirNo];
            }
        }
        else {
            if (pirNo === 1) {
                if (!webcamMotion) {
                    pirWLEDSecsINT[pirNo].secs--;
                }
            }
            else {
                pirWLEDSecsINT[pirNo].secs--;
            }
            ;
            if (wcWindow && wcWindow.webContents) {
                wcWindow.webContents.send('motionCtrlData', [pirNo, { ctrl: pirWLEDInProg[pirNo], ctrlTOS: pirWLEDSecsINT[pirNo].secs }]);
            }
        }
        ;
    }, 1000);
}
;
//-------------------------------------------------
electron_1.ipcMain.on('killPIRMotion', (e, args) => { motionLightsReset(args[0]); });
//-------------------------------------------------
async function motionLightsReset(pirNo) {
    if (pirWLEDTO[pirNo] !== null) {
        clearTimeout(pirWLEDTO[pirNo]);
        pirWLEDTO[pirNo] = null;
    }
    ;
    if (pirCountTO[pirNo] !== null) {
        clearTimeout(pirCountTO[pirNo]);
        pirCountTO[pirNo] = null;
    }
    ;
    if (pirWLEDSecsINT[pirNo].int !== null) {
        clearInterval(pirWLEDSecsINT[pirNo].int);
        pirWLEDSecsINT[pirNo].int = null;
        pirWLEDSecsINT[pirNo].secs = pirCtrlLastsS[pirNo];
    }
    ;
    if (pirCountSecsINT[pirNo].int !== null) {
        clearInterval(pirCountSecsINT[pirNo].int);
        pirCountSecsINT[pirNo].int = null;
        pirCountSecsINT[pirNo].secs = pirCountMaxTimeS[pirNo];
    }
    ;
    let pirWLEDStripNos = [];
    if (wledGroupSyncOn) {
        pirWLEDStripNos = pir2WLEDMapSync[pirNo];
    }
    else {
        pirWLEDStripNos = pir2WLEDMap[pirNo];
    }
    ;
    for (let pli = 0; pli < pirWLEDStripNos.length; pli++) {
        const stripIndex = pirWLEDIndexes[pirWLEDStripNos[pli]];
        const stripName = wleds[stripIndex].info.name;
        if (pirNo === 1) {
            const pir1RestoreJSON = JSON.stringify({ transition: 100, bri: 1 });
            wledJSONReq(stripName, 'post', pir1RestoreJSON);
            //adjustWLEDBright(1,wledGroupSyncOn,stripIndex,stripName)
        }
        else if (pirNo === 2) {
            const restStateJSON = JSON.stringify({ tt: 0, udpn: { nn: true }, seg: [{ bri: pir2PrevBri, start: 0, col: [pir2PrevColor] }] });
            wledJSONReq('Zer0WLED1', 'post', restStateJSON);
        }
        else if (pirNo === 3) {
            availCons('motionLightsReset', 'TO for Pir3 Finished');
        }
        ;
    }
    ;
    const finTOMS = new Date().getTime();
    const finTOUTS = finTOMS / 1000;
    const finTODate = (0, date_fns_1.fromUnixTime)(finTOUTS);
    const finTONice = (0, date_fns_1.format)(finTODate, 'HH:mm:ss');
    const motTOMS = pirCtrlLastsS[pirNo] * 1000;
    const durMotMS = finTOMS - pirSTimes[pirNo] - motTOMS;
    const durMotNice = (durMotMS / 1000).toFixed(1) + 's';
    availCons('motionLights|!MOTION', 'PIR ' + String(pirNo) + ' - [MOTION|Stop]: @ ' + finTONice + ' (' + durMotNice + ')');
    pirSTimes[pirNo] = 0;
    pirTCounts[pirNo] = 0;
    pirWLEDInProg[pirNo] = false;
    if (wcWindow && wcWindow.webContents) {
        wcWindow.webContents.send('motionCtrlData', [pirNo, { ctrl: pirWLEDInProg[pirNo], ctrlTOS: pirWLEDSecsINT[pirNo].secs }]);
    }
    ;
    if (wcWindow && wcWindow.webContents) {
        wcWindow.webContents.send('motionTriggerData', [pirNo, { count: pirTCounts[pirNo], countTOS: pirCountSecsINT[pirNo].secs }]);
    }
    ;
}
//////////////////////////////////////////////////
// @HOME / NETDEV FUNCTIONS
//////////////////////////////////////////////////
function doRpiInfo(rawInfo) {
    const iA = rawInfo.split('|');
    if (iA.length !== 5 || !iA.every((v) => (v && v.trim().length > 0 && typeof v === 'string'))) {
        return;
    }
    ;
    const rA = iA[1].split(','), dA = iA[2].split(',');
    let newPInfo = {
        cpu: { l: 'pl', v: (Number(iA[0]) / 100), s: String(iA[0]), fx: '%' },
        ram: { l: 'rm', v: (Number(rA[0]) / Number(rA[1])), s: ((Number(rA[0]) / Number(rA[1])) * 100).toFixed(0), fx: '%' },
        disk: { l: 'df', v: (Number(dA[0]) / Number(dA[1])), s: ((Number(dA[0]) / Number(dA[1])) * 100).toFixed(0), fx: '%' },
        temp: { l: 'tm', v: (Number(iA[3])), s: String(iA[3]), fx: '°C' },
        txp: { l: 'tx', v: (Number(iA[4])), s: String(iA[4]), fx: 'dBm' }
    };
    try {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('rpiInfo', [newPInfo]);
        }
    }
    catch (e) {
        e = e;
    }
    ;
}
//------------------------------------------------
function doDebInfo(rawInfo) {
    const iA = rawInfo.split('|');
    if (iA.length !== 3 || !iA.every((v) => (v && v.trim().length > 0 && typeof v === 'string'))) {
        return;
    }
    ;
    const rA = iA[1].split(','), dA = iA[2].split(',');
    let newDInfo = {
        cpu: { l: 'pl', v: (Number(iA[0]) / 100), s: String(iA[0]), fx: '%' },
        ram: { l: 'rm', v: (Number(rA[0]) / Number(rA[1])), s: ((Number(rA[0]) / Number(rA[1])) * 100).toFixed(0), fx: '%' },
        disk: { l: 'df', v: (Number(dA[0]) / Number(dA[1])), s: ((Number(dA[0]) / Number(dA[1])) * 100).toFixed(0), fx: '%' }
    };
    try {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('debInfo', [newDInfo]);
        }
    }
    catch (e) {
        e = e;
    }
    ;
}
//------------------------------------------------
electron_1.ipcMain.on('putty2RC', async (e, args) => { putty2RemoteComp(args[0]); });
function putty2RemoteComp(ip) {
    let tpw = '';
    ip === '192.168.0.18' ? tpw = '***********' : tpw = 'PianoFarm123!?';
    const puttySpawn = require('child_process').spawn, puttyProc = puttySpawn('putty', ['-ssh', 'root@' + ip + ':22', '-pw', tpw]);
    puttyProc.on('error', (e) => { availCons('putty2RemoteComp|ERROR', e); });
    puttyProc.on('exit', (c) => { availCons('putty2RemoteComp|' + (c === 0 ? 'SUCCESS' : 'ERROR'), 'Putty Window/Console Closed (Code ' + String(c) + ')'); });
}
//------------------------------------------------
let rpiInfoINT = null, lastRawInfo = '', debInfoINT = null, lastDRawInfo = '';
let noteListenSVR, killNoteListenSVR;
function startNotifListener() {
    availCons('startNotifListener', '()...');
    try {
        noteListenSVR = http.createServer(async (req, res) => {
            const reqIP4 = req.socket.remoteAddress.replace('::ffff:', '').trim();
            if (reqIP4 === '192.168.0.3') {
                if (req.headers.dtlfx.toString() === 'config') {
                    const configName = req.headers.dtlfxconfig.toString();
                    if (z1bConfigName !== configName) {
                        z1bConfigName = configName;
                    }
                    ;
                    res.writeHead(200);
                    res.end();
                }
                else if (req.headers.dtlfx.toString() === 'ping') {
                    res.writeHead(200, 'pong', { 'Content-Type': 'text/html' });
                    res.end('pong');
                }
                else if (req.headers.dtlfx.toString() === 'started') {
                    if (z1bConfigName !== 'z1bonly') {
                        dtlfxIsLive = true;
                        try {
                            if (wcWindow && wcWindow.webContents) {
                                wcWindow.webContents.send('dtlfxDidStartStop', ['started']);
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                        ;
                    }
                    ;
                    if (z1bSendVizInfo) {
                        await reqDTLFX('get', 'sendvizinfo');
                    }
                    ;
                    res.writeHead(200);
                    res.end();
                }
                else if (req.headers.dtlfx.toString() === 'stopped') {
                    if (z1bConfigName !== 'z1bonly') {
                        if (willDoDelayedWLEDInit) {
                            dtlfxIsLive = false;
                            await doW(5);
                            const dwiRes = await initWLED();
                            if (dwiRes) {
                                let activeWLEDS = [];
                                for (let wi = 0; wi < wleds.length; wi++) {
                                    if (wleds[wi]) {
                                        const tWC = wleds[wi], actWLEDObj = { id: wi, ip: '192.168.0.10' + tWC.info.name.replace('Zer0WLED', ''), effects: tWC.effects, palettes: tWC.palettes, presets: tWC.presets, info: tWC.info, state: tWC.state };
                                        activeWLEDS.push(actWLEDObj);
                                    }
                                }
                                ;
                                wcWindow.webContents.send('dtlfxDidStartStop', ['stopped', true, activeWLEDS]);
                            }
                            else {
                                availCons('IPCMAIN|delayedInitWLED', 'ERROR: initWLED() Fn Failed');
                                wcWindow.webContents.send('dtlfxDidStartStop', ['stopped', true, 'error']);
                            }
                        }
                        else {
                            dtlfxIsLive = false;
                            wcWindow.webContents.send('dtlfxDidStartStop', ['stopped', false]);
                        }
                        ;
                    }
                    ;
                    if (z1bConfigName !== null) {
                        z1bConfigName = null;
                    }
                    ;
                    res.writeHead(200);
                    res.end();
                }
                else if (req.headers.dtlfx.toString() === 'post') {
                    let dRaw = '';
                    req.on('data', (chunk) => { dRaw += chunk; });
                    req.on('end', async () => {
                        if (dRaw && dRaw.length > 0 && (await isJSON(dRaw))) {
                            const postDataObj = JSON.parse(dRaw);
                            // Process Post Here...
                            let postRespData = { r: true, d: { some: 'data' } };
                            res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(postRespData));
                        }
                        else {
                            res.writeHead(400, 'OK', { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ r: false, d: null }));
                        }
                    });
                }
            }
            else if (req.socket.remoteAddress.toString().includes('192.168.0.11')) {
                let dRawInfo = '';
                req.on('data', (chunk) => { dRawInfo += chunk; });
                req.on('end', async () => {
                    try {
                        if (dRawInfo && dRawInfo.length > 0) {
                            if (dRawInfo !== lastDRawInfo) {
                                lastDRawInfo = dRawInfo;
                                doDebInfo(dRawInfo);
                            }
                            ;
                            if (wcWindow && wcWindow.webContents) {
                                wcWindow.webContents.send('debOnline', [true]);
                            }
                            ;
                            if (debInfoINT !== null) {
                                clearTimeout(debInfoINT);
                            }
                            ;
                            debInfoINT = setTimeout(() => { if (wcWindow && wcWindow.webContents) {
                                wcWindow.webContents.send('debOnline', [false]);
                            } }, 20000);
                        }
                        ;
                    }
                    catch (e) {
                        e = e;
                    }
                });
                res.writeHead(200);
                res.end();
            }
            else if (req.socket.remoteAddress.toString().includes('192.168.0.18')) {
                if (!kodiServiceRunning || kodiOnlineINT !== null) {
                    const kIsO = await checkKodiRunning();
                    if (kIsO) {
                        kodiOnlineChecker('stop');
                    }
                    ;
                }
                ;
                let rawInfo = '';
                req.on('data', (chunk) => { rawInfo += chunk; });
                req.on('end', () => {
                    if (rawInfo && rawInfo.length > 0) {
                        if (rawInfo !== lastRawInfo) {
                            lastRawInfo = rawInfo;
                            doRpiInfo(rawInfo);
                        }
                        ;
                        if (wcWindow && wcWindow.webContents) {
                            wcWindow.webContents.send('rpiOnline', [true]);
                        }
                        ;
                        if (rpiInfoINT !== null) {
                            clearTimeout(rpiInfoINT);
                        }
                        ;
                        rpiInfoINT = setTimeout(() => { if (wcWindow && wcWindow.webContents) {
                            wcWindow.webContents.send('rpiOnline', [false]);
                        } }, 20000);
                    }
                    ;
                });
                res.writeHead(200);
                res.end();
            }
            else {
                availCons('noteSVR|RECEIVED', '[' + req.method.toUpperCase() + '] from ' + req.socket.remoteAddress.replace('::ffff:', ''));
                if (!req.socket.remoteAddress.toString().includes('192.168.0.69')) {
                    res.writeHead(401);
                    res.end();
                    availCons('noteSVR|NOAUTH', 'Sent 401 Response');
                }
                else {
                    if (req.method.toLocaleLowerCase() === 'post') {
                        // Removed Voice Command ref Tasker Issues
                        return;
                    }
                    else {
                        let noteType = null;
                        if (req.headers.app.toString() === 'ytKodi') {
                            if (req.headers.hasOwnProperty('vid') && typeof req.headers.vid === 'string' && req.headers.vid && req.headers.vid.replace('https://www.youtube.com/watch?v=', '').trim().length === 11) {
                                const vIdStr = req.headers.vid.replace('https://www.youtube.com/watch?v=', '').trim(), mWYTDLIndex = await getMWBrwsr('ytdl');
                                if (mWYTDLIndex && mWYTDLIndex !== -1 && moreWins[mWYTDLIndex] && moreWins[mWYTDLIndex].webContents) {
                                    moreWins[mWYTDLIndex].webContents.send('ytKodiVidPlay', [vIdStr]);
                                }
                                ;
                            }
                            ;
                        }
                        else if (req.headers.app.toString() === 'sleepwake') {
                            if (isSleep) {
                                wcWindow.webContents.send('traySleepWakeNow', ['wake']);
                            }
                            else {
                                wcWindow.webContents.send('traySleepWakeNow', ['sleep']);
                            }
                        }
                        else if (req.headers.app.toString() === 'rdark') {
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            wcWindow.webContents.send('clientRandomDark');
                        }
                        else if (req.headers.app.toString() === 'allon') {
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            let setWCs = wleds;
                            if (wledGroupSyncOn) {
                                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
                            }
                            ;
                            const allWJSON = JSON.stringify({ tt: 0, on: true });
                            for (let wi = 0; wi < setWCs.length; wi++) {
                                await wledJSONReq(setWCs[wi].info.name, 'post', allWJSON);
                            }
                            ;
                        }
                        else if (req.headers.app.toString() === 'allwhite') {
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            wcWindow.webContents.send('traySetAllWhiteLight');
                        }
                        else if (req.headers.app.toString() === 'alloff') {
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            let setWCs = wleds;
                            if (wledGroupSyncOn) {
                                setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
                            }
                            ;
                            const allWJSON = JSON.stringify({ tt: 0, on: false });
                            for (let wi = 0; wi < setWCs.length; wi++) {
                                await wledJSONReq(setWCs[wi].info.name, 'post', allWJSON);
                            }
                            ;
                        }
                        else if (req.headers.app.toString() === 'com.google.android.apps.messaging') {
                            noteType = 'sms';
                        }
                        else if (req.headers.app.toString() === 'com.whatsapp') {
                            noteType = 'whatsapp';
                        }
                        else if (req.headers.app.toString() === 'com.google.android.gm') {
                            noteType = 'gmail';
                        }
                        ;
                        if (noteType !== null) {
                            if (dtlfxIsLive) {
                                return;
                            }
                            ;
                            doNewNoteLights(noteType);
                        }
                        ;
                        res.writeHead(200);
                        res.end();
                    }
                }
                ;
            }
        }).listen(6666);
        killNoteListenSVR = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: noteListenSVR });
        availCons('startNotifListener', 'NotifSVR Running @ http://localhost:6666');
    }
    catch (e) {
        availCons('startNotifListener', 'ERROR: ' + e);
    }
}
;
//------------------------------------------------
async function doNewNoteLights(type) {
    if (dtlfxIsLive) {
        return;
    }
    ;
    availCons('doNewNoteLights', '(' + type + ')...');
    if (!syncStates.audioSync && !syncStates.sshotSync && !isSleep && !noteLightsInProg && !chimeLightsInProg && !kodiVMInProg) {
        noteLightsInProg = true;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('startNoteICUE', [type]);
        }
        ;
        let wledOrigSegs = [];
        let aLs = wleds;
        if (wledGroupSyncOn) {
            aLs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED4' || wc.info.name === 'Zer0WLED6' || wc.info.name === 'Zer0WLED10');
        }
        ;
        let aLMax = [];
        for (let mi = 0; mi < aLs.length; mi++) {
            aLMax.push(aLs[mi].info.leds.count);
        }
        ;
        let wledNoteSegs = [];
        for (let ni = 0; ni < aLs.length; ni++) {
            let isWS = false;
            if (aLs[ni].info.name === 'Zer0WLED6') {
                isWS = true;
            }
            ;
            const noteSeg = await (0, appTypes_1.getWledNoteSegs)(type, aLMax[ni], isWS);
            wledNoteSegs.push(noteSeg);
        }
        ;
        for (let oi = 0; oi < aLs.length; oi++) {
            wledOrigSegs.push(aLs[oi].state.segments);
        }
        ;
        for (let bi = 0; bi < aLs.length; bi++) {
            await aLs[bi].updateState({ segments: wledNoteSegs[bi] });
        }
        ;
        await doW(1);
        let cgs = 0;
        const alts = setInterval(async () => {
            cgs++;
            if (cgs < 9) {
                for (let ci = 0; ci < aLs.length; ci++) {
                    !wledNoteSegs[ci][1].reverse ? wledNoteSegs[ci][1].reverse = true : wledNoteSegs[ci][1].reverse = false;
                    await aLs[ci].updateState({ segments: wledNoteSegs[ci] });
                }
                ;
            }
            else {
                clearInterval(alts);
                for (let ri = 0; ri < aLs.length; ri++) {
                    await aLs[ri].deleteSegment(1);
                    await aLs[ri].updateState({ segments: wledOrigSegs[ri] });
                }
                ;
                noteLightsInProg = false;
                if (wcWindow && wcWindow.webContents) {
                    wcWindow.webContents.send('stopNoteICUE');
                }
                ;
            }
            ;
        }, 250);
    }
    else {
        availCons('doNewNoteLights', 'SKIPPED - Audio Sync Running');
    }
    ;
}
;
//------------------------------------------------
async function getNetDevs() {
    return new Promise((resolve) => {
        const exec = require('child_process').exec, sNet = netInterface.gateway.substring(0, netInterface.gateway.length - 1);
        try {
            exec('powershell.exe -Command "ping ' + meD.ip + ' -n 1"');
        }
        catch (e) {
            e = e;
        }
        ;
        try {
            exec('powershell.exe -Command "arp -a"', (e, stdo, stde) => {
                let nDs = [], tOs = [];
                if (e || stde || !stdo) {
                    return Promise.resolve([]);
                }
                else {
                    const rLs = stdo.split('\n');
                    for (let i = 0; i < rLs.length; i++) {
                        const rL = rLs[i].trim();
                        if (rL.length > 0 && !rL.includes('Interface') && !rL.includes('Internet Address')) {
                            const dP = rL.trim().split(/\s+/);
                            if (dP.length > 0) {
                                if (dP[0].includes(sNet)) {
                                    nDs.push({ ip: dP[0], mac: dP[1].replace(/-/gi, '').toLowerCase() });
                                }
                                ;
                            }
                            ;
                        }
                        ;
                    }
                    ;
                    if (nDs.length > 0) {
                        for (let toi = 0; toi < nDs.length; toi++) {
                            if (nDs[toi] && nDs[toi].hasOwnProperty('ip') && nDs[toi].ip) {
                                try {
                                    exec('powershell.exe -Command "ping ' + nDs[toi].ip + ' -n 1"', (e, stdo, stde) => {
                                        let nDs = [];
                                        if (e || stde || !stdo) {
                                            return Promise.resolve([]);
                                        }
                                        else {
                                            const rLs = stdo.split('\n');
                                            for (let i = 0; i < rLs.length; i++) {
                                                const rL = rLs[i].trim();
                                                if (rL.length > 0 && rL.includes('host unreachable')) {
                                                    tOs.push(nDs[toi].ip);
                                                }
                                            }
                                        }
                                    });
                                }
                                catch (e) {
                                    e = e;
                                }
                                ;
                            }
                        }
                        ;
                    }
                    ;
                    nDs = nDs.filter(o => o && o.hasOwnProperty('ip') && o.ip && !tOs.includes(o.ip));
                    resolve(nDs);
                }
                ;
            });
        }
        catch (e) {
            return Promise.resolve(lastNDs);
        }
        ;
    });
}
//-------------------------------------------------
async function checkStatLights(data) {
    if (wcWindow && wcWindow.webContents) {
        wcWindow.webContents.send('clientDoWakeSleep', [(data.status === 'arrive' ? 'wake' : 'sleep')]);
    }
    ;
}
;
//-------------------------------------------------
function gLDs() { return lastNDs; }
;
//-------------------------------------------------
async function toggleDeviceNetStatDetect() {
    availCons('toggleDeviceNetStatDetect', '()...');
    if (!devNSDActive) {
        lastNDs = await getNetDevs();
        devNSDInt = setInterval(async () => {
            const gNDRes = await getNetDevs();
            if (!_.isEqual(gNDRes, gLDs())) {
                if ((_.some(gNDRes, meD))) {
                    checkStatLights({ status: 'arrive', time: new Date() });
                }
                else {
                    checkStatLights({ status: 'leave', time: new Date() });
                }
                ;
                lastNDs = gNDRes;
            }
            ;
        }, 3000);
        devNSDActive = true;
    }
    else {
        clearInterval(devNSDInt);
        devNSDActive = false;
    }
    ;
}
//////////////////////////////////////////////////
// KODI API FUNCTIONS
//////////////////////////////////////////////////
function kId() { return (Math.floor(1000 + Math.random() * 9000)); }
;
function setKodiURL(ip) { kodiBURL = 'http://' + ip + ':8080/jsonrpc'; }
;
async function decKodiAH(ah) {
    let tryAH;
    ah ? tryAH = ah : tryAH = kodiAH;
    if (!tryAH || !tryAH.hasOwnProperty('Authorization') || tryAH.Authorization === 'None') {
        return Promise.resolve(false);
    }
    else {
        const decRes = Buffer.from((tryAH.Authorization.replace('Basic ', '').trim()), 'base64').toString('utf8');
        return Promise.resolve(decRes);
    }
}
;
async function setKodiAH(auth, up) { if (auth && up) {
    const b64UP = Buffer.from(up.u + ':' + up.p, 'utf8').toString('base64');
    kodiAH = { Authorization: 'Basic ' + b64UP };
}
else {
    kodiAH = { Authorization: 'None' };
} ; const writeUPRes = await rwKodiAuth('w', { auth: kodiAH, ip: kodiServerIP }); if (writeUPRes.r) {
    return Promise.resolve(true);
}
else {
    return Promise.resolve(false);
} }
;
async function delKodiAuth() { const kaPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/ka'); try {
    await (0, promises_1.unlink)(kaPath);
    return Promise.resolve(true);
}
catch (e) {
    console.log(e);
    return Promise.resolve(false);
} }
;
async function rwKodiAuth(action, auth) {
    const kaPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/ka');
    const rAuth = async () => {
        if (!(await exists(kaPath)) || (await statSize(kaPath)).d === 0) {
            return Promise.resolve({ r: false, d: null });
        }
        ;
        try {
            const rR = await (0, promises_1.readFile)(kaPath, { encoding: 'utf-8' });
            if (rR && (await isJSON(rR))) {
                availCons('rwKodiAuth', 'Kodi Auth File [READ] - OK');
                return Promise.resolve({ r: true, d: JSON.parse(rR) });
            }
            else {
                return Promise.resolve({ r: false, d: 'ERROR: JSON Parse Failed' });
            }
        }
        catch (e) {
            console.log(e);
            return Promise.resolve({ r: false, d: e });
        }
    };
    const wAuth = async (data) => { const kaStr = JSON.stringify(data); try {
        await (0, promises_1.writeFile)(kaPath, kaStr, { encoding: 'utf-8' });
        availCons('rwKodiAuth', 'Kodi Auth File [WRITE] - OK');
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    if (action === 'r') {
        return Promise.resolve((await rAuth()));
    }
    else {
        return Promise.resolve({ r: (await wAuth(auth)) });
    }
    ;
}
;
//------------------------------------------------
electron_1.ipcMain.handle('needsKodiUPAuth', async (e, args) => {
    if (promptKUPs) {
        let oldDec = await decKodiAH();
        if (!oldDec) {
            const retryAHRes = await rwKodiAuth('r');
            if (retryAHRes.r) {
                oldDec = await decKodiAH(retryAHRes.d);
            }
        }
        ;
        if (!oldDec) {
            return Promise.resolve({ r: true, d: { auth: true, up: { u: '', p: '' } } });
        }
        else {
            const upSplit = oldDec.split(':');
            return Promise.resolve({ r: true, d: { auth: true, up: { u: upSplit[0], p: upSplit[1] } } });
        }
    }
    else {
        return Promise.resolve({ r: false, d: { hasKodi: hasKodi } });
    }
    ;
});
//------------------------------------------------
async function checkKodiRunning() {
    const { r, d } = await kodiReq('JSONRPC.Ping', {}, 3000);
    if (r && d && d === 'pong') {
        kodiServiceRunning = true;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiIsRunning', [true]);
        }
    }
    else {
        kodiServiceRunning = false;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiIsRunning', [false]);
        }
    }
    ;
    return Promise.resolve(r);
}
//------------------------------------------------
electron_1.ipcMain.handle('updateKodiAH', async (e, args) => {
    const newAH = args[0];
    const saveRes = await setKodiAH(newAH.auth, (newAH.auth ? newAH.up : null));
    if (saveRes) {
        if (kodiBURL) {
            const testCredsRes = await kodiReq('JSONRPC.Ping', {}, 1500);
            if (testCredsRes.r && testCredsRes.d === 'pong') {
                if (!kodiServiceRunning) {
                    startKodiService();
                }
                ;
                return Promise.resolve({ r: true, d: ['ok', 'credentials saved successfully', 'authorized with ' + kodiServerIP + ' - OK'] });
            }
            else {
                availCons('', testCredsRes);
                if (typeof testCredsRes.d === 'object' && testCredsRes.d.hasOwnProperty('status') && testCredsRes.d.status === 401) {
                    kodiAH = null;
                    await delKodiAuth();
                    return Promise.resolve({ r: false, d: ['fail', 'username and/or password invalid', 'tested with ' + kodiServerIP + ' - FAILED'] });
                }
                else {
                    return Promise.resolve({ r: true, d: ['part', 'credentials saved successfully', 'test error with ' + kodiServerIP + ' - unknown error'] });
                }
                ;
            }
        }
        else {
            return Promise.resolve({ r: true, d: ['part', 'credentials saved successfully', 'not tested - no kodi server found'] });
        }
        ;
    }
    else {
        return Promise.resolve({ r: false, d: ['fail', 'failed to save credentials', 'check file permissions'] });
    }
    ;
});
//------------------------------------------------
async function initKodiAPI() {
    availCons('initKodiAPI', '()...');
    const gKA = await rwKodiAuth('r');
    if (gKA.r && gKA.d) {
        kodiAH = gKA.d.auth;
        kodiServerIP = gKA.d.ip;
    }
    else {
        kodiAH = null;
    }
    ;
    const fKIPRes = await findKodiIP();
    if (fKIPRes !== false) {
        let kIP = '192.168.0.18', kAuth = true;
        if (fKIPRes) {
            if (fKIPRes.hasOwnProperty('ip') && fKIPRes.ip && fKIPRes.ip.startsWith('192.168.0.')) {
                kIP = fKIPRes.ip;
            }
            ;
            if (fKIPRes.hasOwnProperty('auth') && typeof fKIPRes.auth === 'boolean') {
                kAuth = fKIPRes.auth;
            }
            ;
        }
        ;
        setKodiURL(kIP);
        availCons('initKodiAPI', 'Found Kodi Server @ ' + kIP + ' | Auth: ' + String(kAuth));
        return Promise.resolve({ kodi: true, auth: true });
    }
    else {
        availCons('initKodiAPI', 'No Kodi Servers Found');
        return Promise.resolve({ kodi: false, auth: false });
    }
    ;
}
//------------------------------------------------
async function findKodiIP() {
    let ok = [], maybe = [];
    if (kodiServerIP && kodiServerIP.length > 0) {
        setKodiURL(kodiServerIP);
        const { r, d } = await kodiReq('JSONRPC.Ping', {}, 1500);
        if (r && d === 'pong') {
            const nCIndex = netClients.findIndex(nc => nc.ip === kodiServerIP);
            if (nCIndex !== -1) {
                netClients[nCIndex].name = 'Kodi Server';
            }
            ;
            return Promise.resolve({ ip: kodiServerIP, auth: true });
        }
        ;
    }
    else {
        if (netClients.length === 0) {
            return Promise.resolve(false);
        }
        else {
            const cIPList = netClients.map(c => c.ip);
            for (let nci = 0; nci < cIPList.length; nci++) {
                setKodiURL(cIPList[nci]);
                const { r, d } = await kodiReq('JSONRPC.Ping', {}, 1500);
                if (r && d === 'pong') {
                    ok.push(cIPList[nci]);
                }
                if (!r && d !== 'NOTKODI' && d !== 'TO') {
                    maybe.push(cIPList[nci]);
                }
                ;
            }
            ;
            if (ok.length > 0) {
                const nCIndex = netClients.findIndex(nc => nc.ip === ok[0]);
                if (nCIndex !== -1) {
                    netClients[nCIndex].name = 'Kodi Server';
                    kodiServerIP = netClients[nCIndex].ip;
                }
                ;
                return Promise.resolve({ ip: ok[0], auth: true });
            }
            else {
                if (maybe.length > 0) {
                    const nCIndex = netClients.findIndex(nc => nc.ip === maybe[0]);
                    if (nCIndex !== -1) {
                        netClients[nCIndex].name = 'Kodi Server';
                        kodiServerIP = netClients[nCIndex].ip;
                    }
                    ;
                    return Promise.resolve({ ip: maybe[0], auth: false });
                }
                else {
                    return Promise.resolve(false);
                }
                ;
            }
            ;
        }
        ;
    }
}
//------------------------------------------------
function gTDurMS(sT) { const stMS = (0, date_fns_1.getTime)(sT), eTMS = (0, date_fns_1.getTime)(new Date()); return (eTMS - stMS); }
;
//------------------------------------------------
electron_1.ipcMain.on('fetchSIInfo', (e, args) => { getSIInfo(); });
async function getSIInfo() {
    let newSIInfo = appTypes_1.defSIInfo;
    try {
        newSIInfo.dfSize = (await si.fsSize());
        z1bFSInfo = newSIInfo.dfSize;
        newSIInfo.usb = (await si.usb());
        newSIInfo.netStats = (await si.networkStats());
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('SIInfo', [newSIInfo]);
        }
        ;
        return Promise.resolve(newSIInfo);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(null);
    }
}
//------------------------------------------------
async function startHWInfo() {
    availCons('getHWInfo', '()...');
    const icLogsPath = path.normalize('C:\\Users\\owenl\\Documents\\iCUELogs\\*.csv');
    const hwiLogPath = path.normalize('C:\\Users\\owenl\\Documents\\iCUELogs\\hwi\\log.csv');
    const cpRawLog = async () => { return new Promise(async (resolve) => { (0, child_process_2.exec)('powershell.exe -Command "cp ' + icLogsPath + ' ' + hwiLogPath + '"', (err, stdout, stderr) => { if (err) {
        console.log(err);
        resolve(false);
    }
    else {
        resolve(true);
    } }); }); };
    const rLL = async () => {
        try {
            const lldata = await (0, promises_1.readFile)(hwiLogPath, { encoding: 'utf8' }), allLs = lldata.split('\r\n');
            if (allLs && allLs.length > 1) {
                const valSufRx = /^(\d+(\.\d+)?)(RPM|°C|%)$/, llArr = allLs[allLs.length - 2].split(',').filter((o, i) => i !== 0 && o.match(valSufRx) !== null).map((o, i) => ({ v: Number(o.match(valSufRx)[1]), fx: o.match(valSufRx)[3] }));
                let hwiObj = {
                    mb: { fan: llArr[0], temp: llArr[1] },
                    cpu: { temp: llArr[2], load: llArr[3] },
                    gpu1: { fan: llArr[4], temp: { v: ((llArr[5].v + llArr[6].v) / 2), fx: llArr[5].fx }, load: llArr[7] },
                    gpu2: { temp: llArr[6], load: llArr[8] },
                    cfans: { v: [llArr[9].v, llArr[10].v, llArr[11].v, llArr[12].v, llArr[13].v, llArr[14].v], s: llArr[9].fx },
                    pump: { rpm: llArr[15], temp: llArr[16] }
                };
                return Promise.resolve(hwiObj);
            }
            else {
                return Promise.resolve(false);
            }
        }
        catch (e) {
            return Promise.resolve(false);
        }
    };
    const doHWI = async () => {
        if ((await cpRawLog())) {
            const rLLRes = await rLL();
            const netStatsRes = await si.networkStats();
            if (!termAppInProg && rLLRes !== false && wcWindow && wcWindow.webContents) {
                z1bHWInfo = rLLRes;
                wcWindow.webContents.send('HWInfo', [rLLRes]);
                z1bNETInfo = netStatsRes;
                wcWindow.webContents.send('SINetStats', [netStatsRes]);
            }
            ;
        }
    };
    //------------
    doHWI();
    hwiINT = setInterval(async () => { doHWI(); }, 12000);
    //------------
    getSIInfo();
}
//------------------------------------------------
electron_1.ipcMain.on('ocs0ServReboot', (e, args) => { availCons('ocs0ServReboot', '()...'); (0, child_process_2.exec)('powershell.exe -Command plink -batch -ssh root@192.168.0.11 -pw PianoFarm123!? reboot', (err, stdout, stderr) => { if (err) {
    console.log(err);
} }); });
//------------------------------------------------
electron_1.ipcMain.on('kodiQCFn', async (e, args) => {
    availCons('kodiQCFn', '([' + args[0] + ',' + (args[1] ? args[1] : 'null') + '])...');
    const cmd = args[0];
    let data;
    if (args[1] && args[1] !== null) {
        data = args[1];
    }
    ;
    if (cmd === 'Application.Quit') {
        await kodiReq(cmd, null);
    }
    else if (cmd === 'startx' || cmd === 'reboot' || cmd === 'startkodi') {
        let baseCMD = 'plink -batch -ssh root@' + kodiServerIP + ' -pw *********** ';
        const sshCMD = async (c) => {
            if (c === 'startx') {
                await kodiReq('Application.Quit', null);
                await doW(3);
                baseCMD += '"startx"';
            }
            else if (c === 'startkodi' || cmd === 'reboot') {
                baseCMD += '"reboot"';
            }
            ;
            return new Promise(async (resolve) => { (0, child_process_2.exec)('powershell.exe -Command ' + baseCMD, (err, stdout, stderr) => { if (err) {
                console.log(err);
                resolve(false);
            }
            else {
                resolve(true);
            } }); });
        };
        await sshCMD(cmd);
    }
    else if (cmd === 'viewmode') {
        const gVMRes = await kodiReq('Player.GetViewMode', null);
        availCons('', gVMRes);
        if (gVMRes.r && gVMRes.d && gVMRes.d.hasOwnProperty('viewmode') && gVMRes.d.viewmode.length > 0) {
            if (gVMRes.d.viewmode !== 'normal' && gVMRes.d.viewmode !== 'zoom') {
                return;
            }
            else {
                let newVM = null;
                gVMRes.d.viewmode === 'normal' ? newVM = 'zoom' : newVM = 'normal';
                await kodiReq('Player.SetSpeed', { playerid: 1, speed: 0 });
                await kodiReq('Player.SetViewMode', { viewmode: newVM });
                await kodiReq('Player.SetSpeed', { playerid: 1, speed: 1 });
            }
        }
        else {
            return;
        }
        ;
    }
    else if (cmd === 'zoomies') {
        await kodiReq('Player.Open', { item: { file: '/home/shares/Zooms/Zoomies.m3u' } });
    }
    else if (cmd.includes('Input.')) {
        await kodiReq(cmd, null);
    }
    else if (cmd === 'Application.SetVolume') {
        await kodiReq('Application.SetVolume', { volume: data + 'rement' });
    }
    else if (cmd === 'Application.SetMute') {
        await kodiReq('Application.SetMute', { mute: 'toggle' });
    }
    else if (cmd === 'GUI.ActivateWindow') {
        if (data === 'addon') {
            await kodiReq(cmd, { window: 'videos', parameters: ['addons', 'Name=Otaku'] });
        }
        else {
            await kodiReq(cmd, { window: data });
        }
    }
});
//------------------------------------------------
async function kodiReq(method, params, to) {
    try {
        const thisKID = kId();
        let kReqBase = { jsonrpc: '2.0', id: thisKID, method: method };
        if (params) {
            kReqBase['params'] = params;
        }
        ;
        let kReqOpts = { timeout: (to ? to : 10000) };
        if (kodiAH && typeof kodiAH === 'object') {
            kReqOpts['headers'] = kodiAH;
        }
        ;
        const { status, statusText, data } = await axios_1.default.post(kodiBURL, kReqBase, kReqOpts);
        if (status === 200 && data && data.id === thisKID) {
            if (!data.hasOwnProperty('error')) {
                return Promise.resolve({ r: true, d: data.result });
            }
            else {
                return Promise.resolve({ r: false, d: 'ERROR: (' + String(data.error.code) + ') - ' + data.error.data.message });
            }
            ;
        }
        else {
            return Promise.resolve({ r: false, d: { status: status, msg: statusText } });
        }
        ;
    }
    catch (kErr) {
        if (kErr.code === 'ECONNREFUSED') {
            return Promise.resolve({ r: false, d: 'NOTKODI' });
        }
        else if (kErr.code === 'ECONNABORTED') {
            return Promise.resolve({ r: false, d: 'TO' });
        }
        else {
            if (kErr.hasOwnProperty('response')) {
                return Promise.resolve({ r: false, d: { status: kErr.response.status, msg: kErr.response.statusText } });
            }
            else {
                return Promise.resolve({ r: false, d: null });
            }
            ;
        }
        ;
    }
    ;
}
//------------------------------------------------
const setKStatPos = async (player, item, status) => {
    let dC = false;
    if (!kodiActivePlyrs.map(p => p.playerid).includes(player.playerid)) {
        kodiActivePlyrs.push(player);
    }
    ;
    if (!_.isEqual(kodiPlyr.item, item)) {
        kodiPlyr.item = item;
        dC = true;
    }
    ;
    if (kodiPlyr.status !== status) {
        if ((kodiPlyr.status === 'stopped' || kodiPlyr.status === 'loading') && status === 'playing' && kodiPlyr.pos.total === 0) {
            const { r, d } = await kodiReq('Player.GetProperties', { properties: ['totaltime', 'time', 'percentage'], playerid: player.playerid });
            if (r) {
                if (d.hasOwnProperty('percentage')) {
                    kodiPlyr.pos.perc = d.percentage / 100;
                }
                ;
                if (d.hasOwnProperty('totaltime')) {
                    kodiPlyr.pos.total = ((d.totaltime.hours * 3600) + (d.totaltime.minutes * 60) + d.totaltime.seconds);
                }
                ;
                if (d.hasOwnProperty('time')) {
                    kodiPlyr.pos.time = ((d.time.hours * 3600) + (d.time.minutes * 60) + d.time.seconds);
                }
                ;
            }
            ;
        }
        ;
        kodiPlyr.status = status;
        dC = true;
    }
    ;
    if ((status === 'loading' || status === 'playing') && !kodiPosLooping) {
        await startStopKodiPosLoop('start');
    }
    ;
    if (dC) {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
        }
        ;
        const mWYTDLIndex = await getMWBrwsr('ytdl');
        if (mWYTDLIndex && mWYTDLIndex !== -1) {
            if (moreWins[mWYTDLIndex]) {
                moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrEvent', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
            }
        }
        ;
    }
    ;
    return Promise.resolve(true);
};
//------------------------------------------------
electron_1.ipcMain.on('doKodiPlyrSeek', async (e, args) => {
    availCons('ipcMain|doKodiPlyrSeek', 'Seek to ' + String(args[0]) + '%');
    if (kodiPlyr.status !== 'stopped') {
        if (kodiActivePlyrs.length < 1) {
            await updKodiActPlyr();
            if (kodiActivePlyrs.length < 1) {
                return;
            }
        }
        ;
        availCons('', { playerid: kodiActivePlyrs[0].playerid, value: { percentage: args[0] } });
        await kodiReq('Player.Seek', { playerid: kodiActivePlyrs[0].playerid, value: { percentage: args[0] } });
    }
    ;
});
//------------------------------------------------
function startStopKodiPosLoop(action) {
    if (action === 'start') {
        if (!kodiPosLooping) {
            kodiPosINT = setInterval(() => {
                if (kodiPlyr.status !== 'paused' && kodiPlyr.pos.total !== 0) {
                    kodiPlyr.pos.time++;
                    kodiPlyr.pos.perc = kodiPlyr.pos.time / kodiPlyr.pos.total;
                    if (wcWindow && wcWindow.webContents) {
                        wcWindow.webContents.send('kodiPlyrPosUpdate', [kodiPlyr.pos]);
                    }
                }
                ;
            }, 1000);
            kodiPosLooping = true;
            return Promise.resolve(true);
        }
        ;
    }
    else {
        if (kodiPosLooping) {
            clearInterval(kodiPosINT);
            kodiPosLooping = false;
        }
        ;
        return Promise.resolve(true);
    }
    ;
}
;
//------------------------------------------------
async function startKodiWSL() {
    let o = false, e = false, to = false, err;
    const sock = new ws_1.WebSocket('ws://' + kodiServerIP + ':9090/jsonrpc');
    sock.onopen = (e) => { availCons('kodiSock|Event|ON.OPEN', 'OPENED!'); o = true; };
    sock.onclose = (e) => { availCons('kodiSock|Event|ON.CLOSE', 'CLOSED!'); o = false; };
    sock.onerror = (e) => { availCons('kodiSock|Event|ON.ERROR', 'ERROR'); e = true; };
    sock.onmessage = async (e) => {
        const eJ = JSON.parse(e.data);
        availCons('kodiSock|Event|ON.MESSAGE=>NOTIF', eJ.method);
        availCons('', eJ);
        switch (eJ.method) {
            // GUI -------------
            case 'GUI.OnScreensaverActivated': break;
            case 'GUI.OnScreensaverDeactivated': break;
            // Input -----------
            case 'Input.OnInputRequested':
                await doKodiInput('start');
                break;
            case 'Input.OnInputFinished':
                await doKodiInput('stop');
                break;
            // Application -----
            case 'Application.OnVolumeChanged':
                doKodiVolChange(eJ.params.data);
                break;
            // Player ----------
            case 'Playlist.OnAdd':
                break;
            case 'Playlist.OnClear':
                if (kodiWLEDState !== null) {
                    await doKodiWLEDFX('stop');
                }
                ;
                break;
            case 'Player.OnAVChange':
                if (kodiWLEDState === 'seeking' || kodiWLEDState === 'paused') {
                    await doKodiWLEDFX('stop');
                }
                ;
                if (eJ.params.data.item && !_.isEmpty(eJ.params.data.item) && !_.isEqual(kodiPlyr.item, eJ.params.data.item)) {
                    let didC = false;
                    if (kodiPlyr.item !== null) {
                        for (const [k, v] of Object.entries(eJ.params.data.item)) {
                            if (kodiPlyr.item.hasOwnProperty(k)) {
                                if (kodiPlyr.item[k] !== v) {
                                    kodiPlyr.item[k] = v;
                                    didC = true;
                                }
                            }
                            else {
                                kodiPlyr.item[k] = v;
                                didC = true;
                            }
                            ;
                        }
                        ;
                    }
                    else {
                        kodiPlyr.item = eJ.params.data.item;
                        didC = true;
                    }
                    ;
                    if (didC) {
                        if (wcWindow && wcWindow.webContents) {
                            wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                        }
                        ;
                        const mWYTDLIndex = await getMWBrwsr('ytdl');
                        if (mWYTDLIndex && mWYTDLIndex !== -1) {
                            if (moreWins[mWYTDLIndex]) {
                                moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrStart', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                            }
                        }
                        ;
                    }
                }
                ;
                break;
            case 'Player.OnPlay':
                await setKStatPos(eJ.params.data.player, eJ.params.data.item, 'loading');
                if (!eJ.params.data.item.hasOwnProperty('file')) {
                    if (kodiWLEDState !== 'loading') {
                        if (kodiWLEDState !== null) {
                            await doKodiWLEDFX('stop');
                        }
                        ;
                        await doKodiWLEDFX('start', 'loading');
                    }
                    ;
                }
                ;
                const mWYTDLIndexOP = await getMWBrwsr('ytdl');
                if (mWYTDLIndexOP && mWYTDLIndexOP !== -1) {
                    if (moreWins[mWYTDLIndexOP]) {
                        moreWins[mWYTDLIndexOP].webContents.send('mwKodiPlyrStart', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                    }
                }
                ;
                break;
            case 'Player.OnAVStart':
                await setKStatPos(eJ.params.data.player, eJ.params.data.item, 'playing');
                if (kodiWLEDState !== null) {
                    await doKodiWLEDFX('stop');
                }
                ;
                const mWYTDLIndexOAVS = await getMWBrwsr('ytdl');
                if (mWYTDLIndexOAVS && mWYTDLIndexOAVS !== -1) {
                    if (moreWins[mWYTDLIndexOAVS]) {
                        moreWins[mWYTDLIndexOAVS].webContents.send('mwKodiPlyrStart', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                    }
                }
                ;
                break;
            case 'Player.OnResume':
                await setKStatPos(eJ.params.data.player, eJ.params.data.item, 'playing');
                if (kodiWLEDState !== null) {
                    await doKodiWLEDFX('stop');
                }
                ;
                break;
            case 'Player.OnPause':
                await setKStatPos(eJ.params.data.player, eJ.params.data.item, 'paused');
                if (kodiWLEDState !== 'paused') {
                    if (kodiWLEDState !== null) {
                        await doKodiWLEDFX('stop');
                    }
                    ;
                    await doKodiWLEDFX('start', 'paused');
                }
                ;
                break;
            case 'Player.OnStop':
                if (kodiPosLooping) {
                    await startStopKodiPosLoop('stop');
                }
                ;
                kodiPlyr = { item: null, status: 'stopped', pos: { total: 0, time: 0, perc: 0 } };
                if (wcWindow && wcWindow.webContents) {
                    wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                }
                ;
                const mWYTDLIndexOS = await getMWBrwsr('ytdl');
                if (mWYTDLIndexOS && mWYTDLIndexOS !== -1) {
                    if (moreWins[mWYTDLIndexOS]) {
                        moreWins[mWYTDLIndexOS].webContents.send('mwKodiPlyrStop', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
                    }
                }
                ;
                if (kodiWLEDState !== null) {
                    await doKodiWLEDFX('stop');
                }
                ;
                break;
            case 'Player.OnSeek':
                if (kodiWLEDState !== 'seeking') {
                    if (kodiWLEDState !== null) {
                        await doKodiWLEDFX('stop');
                    }
                    ;
                    await doKodiWLEDFX('start', 'seeking');
                }
                ;
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
            default: availCons('NOTE:', eJ);
        }
        ;
    };
    return new Promise(async (resolve) => {
        const initTO = setTimeout(() => { to = true; }, 10000);
        const initINT = setInterval(() => {
            if (to) {
                clearInterval(initINT);
                resolve({ r: false, d: 'to' });
            }
            else {
                if (o && !e) {
                    clearTimeout(initTO);
                    clearInterval(initINT);
                    resolve({ r: true, d: null });
                }
                else if (e) {
                    clearTimeout(initTO);
                    clearInterval(initINT);
                    resolve({ r: false, d: err });
                }
            }
            ;
        }, 250);
    });
}
//----------------------------------------------
electron_1.ipcMain.on('kodiPlayerAction', async (e, args) => {
    switch (args[0]) {
        case 'toggleMute':
            let newMute;
            kodiVolMute.muted ? newMute = false : newMute = true;
            await kodiReq('Application.SetMute', { mute: newMute });
            break;
        case 'togglePause':
            if (kodiPlyr.status !== 'stopped') {
                if (kodiActivePlyrs.length < 1) {
                    await updKodiActPlyr();
                    if (kodiActivePlyrs.length < 1) {
                        return;
                    }
                }
                ;
                let newSpeed = -1;
                kodiPlyr.status === 'paused' ? newSpeed = 1 : newSpeed = 0;
                await kodiReq('Player.SetSpeed', { playerid: kodiActivePlyrs[0].playerid, speed: newSpeed });
            }
            ;
            break;
        case 'doStop':
            if (kodiPlyr.status !== 'stopped') {
                if (kodiActivePlyrs.length < 1) {
                    await updKodiActPlyr();
                    if (kodiActivePlyrs.length < 1) {
                        return;
                    }
                }
                ;
                await kodiReq('Player.Stop', { playerid: kodiActivePlyrs[0].playerid });
            }
            ;
            break;
    }
    ;
});
//----------------------------------------------
async function doKodiWLEDFX(action, state) {
    let cCS = '';
    state ? cCS = state : cCS = 'NULL';
    availCons('doKodiWLEDFX', 'Action: ' + action + ', State: ' + cCS);
    return Promise.resolve(true);
}
//----------------------------------------------
async function doKodiInput(stage) {
    availCons('doKodiInput', '(' + stage + ')...');
    if (stage === 'start') {
        doKodiWLEDFX('start', 'paused');
    }
    else {
        doKodiWLEDFX('stop');
    }
    ;
    return Promise.resolve(true);
}
//----------------------------------------------
async function kodiVolFinish(type) {
    let setWCs = [];
    if (wledGroupSyncOn) {
        setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1');
    }
    else {
        setWCs = wleds.filter((wc) => wc.info.name === 'Zer0WLED1' || wc.info.name === 'Zer0WLED2' || wc.info.name === 'Zer0WLED3');
    }
    ;
    for (let wi = 0; wi < setWCs.length; wi++) {
        if (type === 'muted') {
            const finishStateObj = { tt: 0, seg: [{ col: [kodiPrevMuteCols[wi]] }] };
            const finJSON = JSON.stringify(finishStateObj);
            await wledJSONReq(setWCs[wi].info.name, 'post', finJSON);
            kodiPrevMuteCols = [];
        }
        else {
            const volStateObj = { tt: 0, seg: [{ fx: 0, col: [kodiPrevVolCols[wi]] }] };
            const finJSON = JSON.stringify(volStateObj);
            await wledJSONReq(setWCs[wi].info.name, 'post', finJSON);
            kodiPrevVolCols = [];
        }
    }
    ;
    if (kodiVolTO !== null) {
        clearTimeout(kodiVolTO);
        kodiVolTO = null;
    }
    ;
    if (kodiVMInProg) {
        kodiVMInProg = false;
    }
    ;
}
//----------------------------------------------
async function doKodiVolChange(vm) {
    return Promise.resolve(true);
}
//----------------------------------------------
async function updKodiPlyrPos(player) {
    availCons('updKodiPlyrPos', '()...');
    const { r, d } = await kodiReq('Player.GetProperties', { properties: ['totaltime', 'time', 'percentage'], playerid: player.playerid });
    if (r) {
        if (d.hasOwnProperty('percentage')) {
            kodiPlyr.pos.perc = d.percentage / 100;
        }
        ;
        if (d.hasOwnProperty('totaltime')) {
            kodiPlyr.pos.total = ((d.totaltime.hours * 3600) + (d.totaltime.minutes * 60) + d.totaltime.seconds);
        }
        ;
        if (d.hasOwnProperty('time')) {
            kodiPlyr.pos.time = ((d.time.hours * 3600) + (d.time.minutes * 60) + d.time.seconds);
        }
        ;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
        }
        ;
    }
    ;
    return Promise.resolve(true);
}
//----------------------------------------------
async function updKodiActPlyr() {
    availCons('updKodiActPlyr', '()...');
    const { r, d } = await kodiReq('Player.GetActivePlayers', null);
    if (r && d && d.length > 0 && !_.isEqual(kodiActivePlyrs, d)) {
        kodiActivePlyrs = d;
    }
    ;
    return Promise.resolve(true);
}
kodiServiceRunning;
//----------------------------------------------
async function doKodiSleepWake(isSleep) {
    if (isSleep) {
        for (let pi = 0; pi < kodiActivePlyrs.length; pi++) {
            await kodiReq('Player.Stop', { playerid: kodiActivePlyrs[pi].playerid });
        }
        ;
        await kodiReq('Player.Open', { item: { file: '/home/zer0ne/Pictures/willsleep.png' } });
        await doW(1.5);
        await kodiReq('Player.Open', { item: { file: '/home/zer0ne/Pictures/sleep.png' } });
    }
    else {
        await kodiReq('Player.Open', { item: { file: '/home/zer0ne/Pictures/willwake.png' } });
        await doW(1.5);
        await kodiReq('Player.Stop', { 'playerid': 2 });
        await kodiReq('Input.Home', null);
        await doW(0.5);
    }
    ;
    return Promise.resolve(true);
}
//------------------------------------------------
async function checkKodiOnline() {
    if (kodiServiceRunning && kodiOnlineINT === null) {
        return;
    }
    else {
        const testCredsRes = await kodiReq('JSONRPC.Ping', {});
        if (testCredsRes.r && testCredsRes.d === 'pong') {
            if (kodiOnlineINT !== null) {
                clearInterval(kodiOnlineINT);
                kodiOnlineINT = null;
            }
            ;
            if (!kodiServiceRunning) {
                startKodiService();
            }
        }
    }
}
//------------------------------------------------
function kodiOnlineChecker(action) {
    availCons('kodiOnlineChecker', '(' + action + ')...');
    if (action === 'start') {
        let eT = 0;
        kodiOnlineINT = setInterval(() => {
            eT += 10000;
            if (eT >= 60000 && eT < 360000) {
                clearInterval(kodiOnlineINT);
                kodiOnlineINT = setInterval(checkKodiOnline, 60000);
            }
            else if (eT >= 360000) {
                clearInterval(kodiOnlineINT);
                kodiOnlineINT = setInterval(checkKodiOnline, 300000);
            }
            checkKodiOnline();
        }, 10000);
    }
    else if (action === 'stop') {
        if (kodiOnlineINT !== null) {
            clearInterval(kodiOnlineINT);
            kodiOnlineINT = null;
        }
    }
}
//------------------------------------------------
async function stopKodiService() {
    kodiPlyr = { item: null, status: 'stopped', pos: { total: 0, time: 0, perc: 0 } };
    kodiActivePlyrs = [];
    showNotification({ type: 'kodi', title: 'Kodi Service', msg: 'Stopped', duration: 2000 }, 'both');
    kodiServiceRunning = false;
    if (wcWindow && wcWindow.webContents) {
        wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
        wcWindow.webContents.send('kodiIsRunning', [false]);
    }
    ;
    kodiOnlineChecker('start');
    return Promise.resolve(true);
}
//------------------------------------------------
electron_1.ipcMain.handle('getKodiData', (e, args) => { return Promise.resolve([{ plyr: kodiPlyr, vm: kodiVolMute }]); });
//------------------------------------------------
async function startKodiService() {
    if (kodiOnlineINT !== null) {
        kodiOnlineChecker('stop');
    }
    ;
    const { r, d } = await startKodiWSL();
    if (r) {
        if (!kodiServiceRunning) {
            kodiServiceRunning = true;
        }
        ;
        sendKodiNote('wifiCUE', 'CONNECT via ' + netInterface.pc);
        showNotification({ type: 'kodi', title: 'Kodi Service', msg: 'Started', duration: 2000 }, 'both');
        const vmRes = await kodiReq('Application.GetProperties', { properties: ['muted', 'volume'] });
        if (vmRes.r && vmRes.d && !_.isEqual(kodiVolMute, vmRes.d)) {
            kodiVolMute = vmRes.d;
        }
        ;
        await updKodiActPlyr();
        if (kodiActivePlyrs.length > 0) {
            const actPId = kodiActivePlyrs[0].playerid;
            if (kodiPlyr.item === null) {
                const getItemRes = await kodiReq('Player.GetItem', { playerid: actPId });
                if (getItemRes.r && getItemRes.d && getItemRes.d.hasOwnProperty('item')) {
                    kodiPlyr.item = getItemRes.d.item;
                }
                ;
            }
            ;
            if (kodiPlyr.pos.total === 0) {
                const getStatRes = await kodiReq('Player.GetProperties', { playerid: actPId, properties: ['speed'] });
                if (getStatRes.r && getStatRes.d && getStatRes.d.hasOwnProperty('speed')) {
                    if (getStatRes.d.speed === 0) {
                        kodiPlyr.status = 'paused';
                    }
                    else {
                        kodiPlyr.status = 'playing';
                    }
                }
                ;
                const getPosRes = await kodiReq('Player.GetProperties', { properties: ['totaltime', 'time', 'percentage'], playerid: actPId });
                if (getPosRes.r) {
                    if (getPosRes.d.hasOwnProperty('percentage')) {
                        kodiPlyr.pos.perc = Number((getPosRes.d.percentage / 100).toFixed(2));
                    }
                    ;
                    if (getPosRes.d.hasOwnProperty('totaltime')) {
                        kodiPlyr.pos.total = ((getPosRes.d.totaltime.hours * 3600) + (getPosRes.d.totaltime.minutes * 60) + getPosRes.d.totaltime.seconds);
                    }
                    ;
                    if (getPosRes.d.hasOwnProperty('time')) {
                        kodiPlyr.pos.time = ((getPosRes.d.time.hours * 3600) + (getPosRes.d.time.minutes * 60) + getPosRes.d.time.seconds);
                    }
                    ;
                }
                ;
            }
            ;
            if (!kodiPosLooping) {
                await startStopKodiPosLoop('start');
            }
            ;
        }
        ;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiPlyrUpdate', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
            wcWindow.webContents.send('kodiIsRunning', [true]);
        }
        ;
        const mWYTDLIndex = await getMWBrwsr('ytdl');
        if (mWYTDLIndex && mWYTDLIndex !== -1) {
            if (moreWins[mWYTDLIndex] && moreWins[mWYTDLIndex].webContents) {
                moreWins[mWYTDLIndex].webContents.send('mwKodiPlyrStart', [{ plyr: kodiPlyr, vm: kodiVolMute }]);
            }
        }
        ;
    }
    else {
        if (kodiServiceRunning) {
            kodiServiceRunning = false;
        }
        ;
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('kodiIsRunning', [true]);
        }
        ;
        kodiOnlineChecker('start');
        if (d === 'to') {
            showNotification({ type: 'kodi', title: 'Kodi Service', msg: 'ERROR: Timeout (>5s)', duration: 2000 }, 'both');
        }
        else {
            showNotification({ type: 'kodi', title: 'Kodi Service', msg: 'ERROR: Unknown', duration: 2000 }, 'both');
            console.log(d);
        }
        ;
    }
    ;
    return Promise.resolve(true);
}
//------------------------------------------------
async function sendKodiNote(title, msg, ms) {
    let nPs = { title: title, message: msg };
    if (ms) {
        nPs['displayTime'] = ms;
    }
    ;
    const { r, d } = await kodiReq('GUI.ShowNotification', nPs, 1000);
    return Promise.resolve(r);
}
;
///////////////////////////////////////////////////
// ADB/PHONE FUNCTIONS
///////////////////////////////////////////////////
electron_1.ipcMain.on('doPhoneCMD', async (e, args) => {
    availCons('IPCMAIN|doPhoneCMD', '(' + args[0] + ')...');
    const checkConn = await doPhoneConnect();
    if (checkConn) {
        const fnStr = 'doPhone' + capd(args[0]) + '()';
        eval(fnStr);
    }
});
//-------------------------------------------------
async function runADBConsoleCMD(params) {
    return new Promise((resolve) => {
        const cmdSpawn = require('child_process').spawn, cmdProc = cmdSpawn('adb', params);
        let result = { r: false, d: '' };
        cmdProc.stdout.on('data', (data) => { if (data && data.toString().trim().length > 0) {
            result.d += data.toString().trim();
        } });
        cmdProc.on('close', async (code) => {
            if (result.d && result.d.includes('already connected')) {
                resolve({ r: true, d: '' });
            }
            ;
            code === 0 || code === '0' ? result.r = true : result.r = false;
            if (!result.r || result.d.includes('not found') || result.d.includes('offline')) {
                let errMsg = 'ERROR: ';
                if (code !== 0 && code !== '0') {
                    errMsg += '(' + String(code) + ') ';
                }
                ;
                if (result.d.includes('not found')) {
                    errMsg += 'Device Not Found ';
                }
                ;
                if (result.d.includes('offline')) {
                    errMsg += 'Device Offline ';
                }
                ;
                availCons('runConsoleCMD', errMsg + '- Attempting Reconnect...');
                const rRRes1 = await phoneReconRun(params, 1);
                if (rRRes1) {
                    resolve({ r: true, d: '' });
                }
                else {
                    const rRRes2 = await phoneReconRun(params, 2);
                    if (rRRes2) {
                        resolve({ r: true, d: '' });
                    }
                    else {
                        resolve({ r: false, d: '' });
                    }
                    ;
                }
            }
            else {
                resolve(result);
            }
            ;
        });
    });
}
//-------------------------------------------------
const phoneReconRun = async (p, attempt) => {
    const rC = async (c) => {
        return new Promise((resolve) => {
            let d = '';
            const s = require('child_process').spawn, p = s('adb', c);
            p.stdout.on('data', (data) => { if (data && data.toString().trim().length > 0) {
                d += data.toString().trim();
            } });
            p.on('close', async (code) => { if (code !== 0 && code !== '0' && !d.includes('not found') && !d.includes('offline')) {
                resolve(true);
            }
            else {
                resolve(false);
            } });
        });
    };
    //-----------
    if (attempt === 1) {
        availCons('phoneReconRun', 'ATTEMPT #1 - Reconnecting Offline Devices...');
        await rC(['reconnect', 'offline']);
        await doW(1);
        const reRunRes = await rC(p);
        if (reRunRes) {
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else {
        availCons('phoneReconRun', 'ATTEMPT #2 - Full Server Restart...');
        availCons('phoneReconRun', 'Kill Server...');
        await rC(['kill-server']);
        await doW(1);
        availCons('phoneReconRun', 'Start Server...');
        await rC(['start-server']);
        await doW(1);
        availCons('phoneReconRun', 'TCPIP @ 5555...');
        await rC(['tcpip', '5555']);
        await doW(0.5);
        availCons('phoneReconRun', 'Connect 192.168.0.69:5555...');
        await rC(['connect', '192.168.0.69:5555']);
        const reRunRes = await rC(p);
        if (reRunRes) {
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    ;
};
//-------------------------------------------------
async function getPhoneDSInfo() {
    const gDSI = async (service, prop) => {
        let adbCMDArr = ['-s', '192.168.0.69:5555', 'shell', 'dumpsys', '-t', '5', service];
        if (service === 'name' || service === 'make' || service === 'model' || service === 'os' && (prop && prop.length > 0)) {
            adbCMDArr = ['-s', '192.168.0.69:5555', 'shell', 'getprop', prop];
        }
        ;
        if (service === 'mem') {
            adbCMDArr = ['-s', '192.168.0.69:5555', 'shell', 'cat', 'proc/meminfo'];
        }
        ;
        const dsRes = await runADBConsoleCMD(adbCMDArr);
        return Promise.resolve(dsRes);
    };
    const xtractDSI = async (service, data) => {
        let xRes;
        try {
            switch (service) {
                case 'power':
                    const pArr = data.split(/\n/g), isAC = JSON.parse(pArr.filter((l) => l.trim().startsWith('AC powered: '))[0].trim().split('AC powered: ')[1]), isUSB = JSON.parse(pArr.filter((l) => l.trim().startsWith('USB powered: '))[0].trim().split('USB powered: ')[1]), lvlNo = Number(pArr.filter((l) => l.trim().startsWith('level: '))[0].trim().split('level: ')[1]);
                    xRes = { charging: (isAC || isUSB), level: { perc: (lvlNo / 100), str: lvlNo.toFixed(0) + '%' } };
                    break;
                case 'wifi':
                    const connLineArr = data.split(/\n/g).filter((l) => l.trim().length > 0 && l.trim().startsWith('NetworkAgentInfo{ ')), ssid = connLineArr[0].split('SSID: ')[1].split(' ')[0].replace(/"/g, ''), sig = Number(connLineArr[0].split('SignalStrength: ')[1].split(' ')[0]);
                    if (ssid && ssid.length > 0 && sig && sig < 0) {
                        xRes = { ssid: ssid, tx: sig };
                    }
                    else {
                        xRes = false;
                    }
                    ;
                    break;
                case 'cpu':
                    const cpuLineArr = data.split(/\n/g).filter((l) => l.trim().includes('TOTAL: '));
                    if (cpuLineArr && cpuLineArr.length === 1) {
                        const percStr = cpuLineArr[0].trim().split(' TOTAL: ')[0];
                        xRes = { perc: Math.round(Number(percStr.replace('%', ''))) / 100, str: (Number(percStr.replace('%', ''))).toFixed(0) };
                    }
                    else {
                        xRes = false;
                    }
                    ;
                    break;
                case 'mem':
                    const memArr = data.split(/\n/g), ttl = Number(memArr.filter((l) => l.trim().startsWith('MemTotal: '))[0].trim().split('MemTotal: ')[1].split(' kB')[0].trim()), free = Number(memArr.filter((l) => l.trim().startsWith('MemAvailable: '))[0].trim().split('MemAvailable: ')[1].split(' kB')[0].trim()), used = ttl - free;
                    xRes = { perc: (used / ttl), str: ((used / ttl) * 100).toFixed(0) + '%' };
                    break;
                case 'disk':
                    const dFree = Number(data.split(/\n/g).filter((l) => l.trim().startsWith('Data-Free: '))[0].split(' = ')[1].split('% free')[0]), dUsed = 100 - dFree;
                    xRes = { perc: (dUsed / 100), str: dUsed.toFixed(0) + '%' };
                    break;
                default: xRes = false;
            }
            return Promise.resolve(xRes);
        }
        catch (e) {
            return Promise.resolve(false);
        }
        ;
    };
    //-----------
    let dsInfo = { name: '-', make: '-', model: '-', os: '-', power: { charging: false, level: { perc: 0, str: '-' } }, wifi: { ssid: '-', tx: 0 }, cpu: { perc: 0, str: '-' }, mem: { perc: 0, str: '-' }, disk: { perc: 0, str: '-' } };
    //-----------
    const dsNameRes = await gDSI('name', 'persist.sys.device_name');
    if (dsNameRes.r && dsNameRes.d) {
        dsInfo.name = dsNameRes.d.trim();
    }
    ;
    const dsMakeRes = await gDSI('make', 'ro.product.vendor.manufacturer');
    if (dsMakeRes.r && dsMakeRes.d) {
        dsInfo.make = dsMakeRes.d.trim();
    }
    ;
    const dsModelRes = await gDSI('model', 'ro.product.vendor.model');
    if (dsModelRes.r && dsModelRes.d) {
        dsInfo.model = dsModelRes.d.trim();
    }
    ;
    const dsOSRes = await gDSI('os', 'ro.build.version.release');
    if (dsOSRes.r && dsOSRes.d) {
        dsInfo.os = dsOSRes.d.trim();
    }
    ;
    //-----------
    const dsPwrRes = await gDSI('battery');
    if (dsPwrRes.r && dsPwrRes.d) {
        const dsPwrXtrRes = await xtractDSI('power', dsPwrRes.d);
        if (dsPwrXtrRes !== false) {
            dsInfo.power = dsPwrXtrRes;
        }
        ;
    }
    ;
    const dsWifiRes = await gDSI('connectivity');
    if (dsWifiRes.r && dsWifiRes.d) {
        const dsWifiXtrRes = await xtractDSI('wifi', dsWifiRes.d);
        if (dsWifiXtrRes !== false) {
            dsInfo.wifi = dsWifiXtrRes;
        }
        ;
    }
    ;
    const dsCPURes = await gDSI('cpuinfo');
    if (dsCPURes.r && dsCPURes.d) {
        const dsCPUXtrRes = await xtractDSI('cpu', dsCPURes.d);
        if (dsCPUXtrRes !== false) {
            dsInfo.cpu = dsCPUXtrRes;
        }
        ;
    }
    ;
    const dsMemRes = await gDSI('mem');
    if (dsMemRes.r && dsMemRes.d) {
        const dsMemXtrRes = await xtractDSI('mem', dsMemRes.d);
        if (dsMemXtrRes !== false) {
            dsInfo.mem = dsMemXtrRes;
        }
        ;
    }
    ;
    const dsDiskRes = await gDSI('diskstats');
    if (dsDiskRes.r && dsDiskRes.d) {
        const dsDiskXtrRes = await xtractDSI('disk', dsDiskRes.d);
        if (dsDiskXtrRes !== false) {
            dsInfo.disk = dsDiskXtrRes;
        }
        ;
    }
    ;
    //-----------
    return Promise.resolve(dsInfo);
}
;
//-------------------------------------------------
async function doNotifyMD2Phone(list) {
    availCons('doNotifyMD2Phone', '(' + list.length + ')');
    //-----------
    let popFile = '', lineCount = 0;
    for (let li = 0; li < list.length; li++) {
        let popLine = '• ';
        let title = list[li].vTitle.split(' ').slice(0, 6).join(' ');
        if (title.length > 30) {
            title = title.substring(0, 27) + '...';
        }
        ;
        popLine += title;
        let chan = list[li].cTitle.split(' ').slice(0, 2).join(' ');
        if (chan.length > 15) {
            chan = chan.substring(0, 12) + '...';
        }
        ;
        popLine += ' - ' + chan;
        const dur = s2T(list[li].dur);
        popLine += ' (' + dur + ') ';
        if (list[li].plCats.includes('star')) {
            popLine += '⭐';
        }
        ;
        if (list[li].plCats.includes('sleep')) {
            popLine += '💤';
        }
        ;
        popLine += '<br>';
        popFile += popLine;
        lineCount++;
    }
    ;
    if (popFile.length > 0) {
        const localNotifPath = 'C:\\myYTDLData\\mydaily\\phNotif.txt';
        const localNotifTitlePath = 'C:\\myYTDLData\\mydaily\\phNotifTitle.txt';
        try {
            await (0, promises_1.writeFile)(localNotifPath, popFile, { encoding: 'utf-8' });
            await (0, promises_1.writeFile)(localNotifTitlePath, '📺 DailyPooCube Update - (+' + String(lineCount) + ')', { encoding: 'utf-8' });
            await doW(0.5);
            await doPhoneFilePush(localNotifTitlePath, '/sdcard/Download/phNotifTitle.txt');
            await doPhoneFilePush(localNotifPath, '/sdcard/Download/phNotif.txt');
            const { r, d } = await runADBConsoleCMD(['-s', '192.168.0.69:5555', 'shell', 'am', 'broadcast', '-a', 'net.dinglisch.android.tasker.Pop']);
            if (!r && d !== null) {
                availCons('doNotifMD2Phone', 'ERROR: ' + d);
            }
            ;
            return Promise.resolve(true);
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(true);
    }
    ;
}
//-------------------------------------------------
const doPhoneConnect = async () => {
    availCons('doPhoneConnect', '()...');
    const { r, d } = await runADBConsoleCMD(['connect', '192.168.0.69:5555']);
    if (!r) {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('phRedmiOnlineData', [false]);
        }
        ;
        availCons('doPhoneConnect', 'ERROR: ' + d);
        return Promise.resolve(false);
    }
    else {
        if (wcWindow && wcWindow.webContents) {
            wcWindow.webContents.send('phRedmiOnlineData', [true]);
        }
        ;
        return Promise.resolve(true);
    }
    ;
};
//-------------------------------------------------
const doPhoneFilePush = async (localPath, phonePath) => {
    availCons('doPhoneFilePush', '(' + localPath + ',' + phonePath + ')...');
    const { r, d } = await runADBConsoleCMD(['-s', '192.168.0.69:5555', 'push', localPath, phonePath]);
    if (!r && d !== null) {
        availCons('doPhoneFilePush', 'ERROR: ' + d);
        return Promise.resolve(false);
    }
    else {
        return Promise.resolve(true);
    }
    ;
};
//-------------------------------------------------
const doPhoneBright = async () => {
    availCons('doPhoneBright', '()...');
    const { r, d } = await runADBConsoleCMD(['-s', '192.168.0.69:5555', 'shell', 'settings', 'put', 'system', 'screen_brightness', '500']);
    if (!r && d !== null) {
        availCons('doPhoneBright', 'ERROR: ' + d);
    }
    ;
};
//-------------------------------------------------
const doPhoneDim = async () => {
    availCons('doPhoneDim', '()...');
    const { r, d } = await runADBConsoleCMD(['-s', '192.168.0.69:5555', 'shell', 'settings', 'put', 'system', 'screen_brightness', '120']);
    if (!r && d !== null) {
        availCons('doPhoneDim', 'ERROR: ' + d);
    }
    ;
};
//-------------------------------------------------
const doPhonePop = async () => {
    availCons('doPhonePop', '()...');
    const { r, d } = await runADBConsoleCMD(['-s', '192.168.0.69:5555', 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', '/sdcard/Download/FX/pop.mp3 -t audio/mp3']);
    if (!r && d !== null) {
        availCons('doPhonePop', 'ERROR: ' + d);
    }
    ;
};
///////////////////////////////////////////////////////////
async function delOldKodiPL() {
    availCons('delOldKodiPL', '()...');
    const dptDir = path.normalize('\\\\ZER0KODIPI4\\Zer0Pi4\\home\\zer0ne\\DailyPooCube');
    const nowDate = new Date();
    const getExistList = async () => { try {
        const gELRes = await (0, promises_1.readdir)(dptDir);
        return Promise.resolve(gELRes);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const delOldPLDir = async (dirP) => { if (fs.existsSync(dirP)) {
        fs.readdirSync(dirP).forEach((f) => { const curP = dirP + '/' + f; if (fs.lstatSync(curP).isDirectory()) {
            delOldPLDir(curP);
        }
        else {
            fs.unlinkSync(curP);
        } });
        fs.rmdirSync(dirP);
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(true);
    } };
    const existRes = await getExistList();
    if (existRes !== false) {
        if (existRes.length > 0) {
            let okDirs = [];
            const tdDir = (0, date_fns_1.format)(nowDate, 'ddMMyy');
            okDirs.push(tdDir);
            const tdSub1 = (0, date_fns_1.subDays)(nowDate, 1), tdSub1Dir = (0, date_fns_1.format)(tdSub1, 'ddMMyy');
            okDirs.push(tdSub1Dir);
            const tdSub2 = (0, date_fns_1.subDays)(nowDate, 2), tdSub2Dir = (0, date_fns_1.format)(tdSub2, 'ddMMyy');
            okDirs.push(tdSub2Dir);
            const tdSub3 = (0, date_fns_1.subDays)(nowDate, 3), tdSub3Dir = (0, date_fns_1.format)(tdSub3, 'ddMMyy');
            okDirs.push(tdSub3Dir);
            for (let exi = 0; exi < existRes.length; exi++) {
                const dirStr = existRes[exi];
                if (!okDirs.includes(dirStr)) {
                    const delDirPath = path.join(dptDir, dirStr);
                    await delOldPLDir(delDirPath);
                }
            }
            ;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(true);
        }
    }
    else {
        return Promise.resolve(false);
    }
}
///////////////////////////////////////////////////////////
let kodiPLUpdInProg = false;
electron_1.ipcMain.on('addUpdateMDKodiPL', async (e, args) => {
    const mwi = await getMWBrwsr('ytdl');
    if (!kodiPLUpdInProg) {
        availCons('addUpdateMDKodiPL', '(todayPLObj:WCYTDLMDKodiPLDay[])...');
        kodiPLUpdInProg = true;
        const tdRawPL = args[0];
        const doMDNotify = args[1];
        //-----------------
        const copyPLData2Kodi = async () => {
            const mwi = await getMWBrwsr('ytdl');
            return new Promise(async (resolve) => {
                try {
                    const dayDirStr = tdRawPL.date.replace(/\//g, '');
                    const parameters = [dayDirStr];
                    const child = childProcess.spawn('cmd.exe', ['/c', 'C:\\myYTDLData\\mydaily\\copyPLData.bat', ...parameters]);
                    let statusArr = [];
                    child.stdout.on('data', (data) => {
                        const d = data.toString().trim();
                        let rawL = [];
                        if (d.includes('\r\n')) {
                            rawL = d.split('\r\n');
                        }
                        else if (d.includes('\n')) {
                            rawL = d.split('\n');
                        }
                        else {
                            rawL.push(d);
                        }
                        ;
                        if (rawL.length > 0) {
                            for (let rli = 0; rli < rawL.length; rli++) {
                                const rL = rawL[rli].trim();
                                if (rL.length > 0 && !rL.includes('echo off') && !rL.includes('[/////]') && !rL.includes('error') && !rL.includes('Error') && !rL.startsWith('- ') && !rL.startsWith('(A)') && rL.replace(/\s+/gi, '').length > 0 && rL.includes('| binary |')) {
                                    const uLArr = rL.split('|');
                                    if (uLArr.length === 5) {
                                        const fnArr = uLArr[0].split('\\'), fnArrLen = fnArr.length;
                                        const newL = { fileName: fnArr[fnArrLen - 1].trim(), fileSize: uLArr[1].trim().replace(' ', ''), uplSpeed: uLArr[2].trim().replace(' ', ''), uplPerc: uLArr[4].trim() };
                                        if ((statusArr.filter(i => i.fileName === newL.fileName)).length === 0) {
                                            statusArr.push(newL);
                                            if (mwi && mwi !== -1) {
                                                moreWins[mwi].webContents.send('mdKodiUploadStatus', ['prog', statusArr]);
                                            }
                                        }
                                        ;
                                    }
                                }
                            }
                        }
                    });
                    child.stderr.on('data', (data) => { availCons('addUpdateKodiPL', `STDERR: ${data}`); });
                    child.on('close', (code) => { resolve(true); availCons('', statusArr); });
                }
                catch (e) {
                    console.log(e);
                    resolve(true);
                }
                ;
            });
        };
        //-----------------
        const writeM3ULocal = async (plCat, plData) => {
            try {
                const dayDirStr = tdRawPL.date.replace(/\//g, '');
                const localDayDirPath = path.join(path.normalize('C:\\myYTDLData\\mydaily\\kodipls'), dayDirStr);
                if (!(await exists(localDayDirPath))) {
                    try {
                        await (0, promises_1.mkdir)(localDayDirPath, { recursive: true });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                ;
                const localM3UPath = path.join(localDayDirPath, (capd(plCat)) + '.m3u');
                await (0, promises_1.writeFile)(localM3UPath, plData, { encoding: 'utf-8' });
                return Promise.resolve(true);
            }
            catch (e) {
                console.log(e);
                return Promise.resolve(false);
            }
            ;
        };
        //-----------------
        const remPath = (localPath) => { const justFN = path.basename(localPath); const dayDirStr = tdRawPL.date.replace(/\//g, ''); return '/home/zer0ne/DailyPooCube/' + dayDirStr + '/' + justFN; };
        //-----------------
        const getBytSz = async (fPath) => {
            try {
                const { r, d } = await statSize(fPath);
                if (r && d && d > 0) {
                    return Promise.resolve(d);
                }
                else {
                    return Promise.resolve(false);
                }
            }
            catch (e) {
                console.log(e);
                return Promise.resolve(false);
            }
        };
        //-----------------
        let newM3UOrsData = ['#EXTM3U', '#EXTENC:UTF-8', '#PLAYLIST:' + tdRawPL.date + ' - PooCube [ORS] List'];
        let newM3UStarData = ['#EXTM3U', '#EXTENC:UTF-8', '#PLAYLIST:' + tdRawPL.date + ' - PooCube [STAR] List'];
        let newM3USleepData = ['#EXTM3U', '#EXTENC:UTF-8', '#PLAYLIST:' + tdRawPL.date + ' - PooCube [SLEEP] List'];
        for (let pli = 0; pli < tdRawPL.all.length; pli++) {
            const rO = tdRawPL.all[pli];
            if (rO.vPath !== 'null') {
                let itemTags = [];
                itemTags.push('#EXTINF:' + (Math.round(rO.dur)).toString() + ',' + rO.cTitle + ' - ' + rO.vTitle + ' (' + (s2T(rO.dur)) + ') -|- ' + rO.vId);
                if (rO.vPath.startsWith('http')) {
                    itemTags.push(rO.vPath);
                }
                else {
                    itemTags.push((remPath(rO.vPath)));
                    const vSz = await getBytSz(rO.vPath);
                    if (vSz !== false) {
                        itemTags.push('#EXTBYT:' + String(vSz));
                    }
                    else {
                        itemTags.push('#EXTBYT:0');
                    }
                    ;
                }
                ;
                for (let ci = 0; ci < rO.plCats.length; ci++) {
                    if (rO.plCats[ci] === 'ors') {
                        newM3UOrsData = newM3UOrsData.concat(itemTags);
                    }
                    ;
                    if (rO.plCats[ci] === 'star') {
                        newM3UStarData = newM3UStarData.concat(itemTags);
                    }
                    ;
                    if (rO.plCats[ci] === 'sleep') {
                        newM3USleepData = newM3USleepData.concat(itemTags);
                    }
                    ;
                }
                ;
            }
            ;
        }
        ;
        if (newM3UOrsData.length > 0) {
            const orsPLStrData = newM3UOrsData.join('\r\n');
            await writeM3ULocal('ors', orsPLStrData);
        }
        ;
        if (newM3UStarData.length > 0) {
            const starPLStrData = newM3UStarData.join('\r\n');
            await writeM3ULocal('star', starPLStrData);
        }
        ;
        if (newM3USleepData.length > 0) {
            const sleepPLStrData = newM3USleepData.join('\r\n');
            await writeM3ULocal('sleep', sleepPLStrData);
        }
        ;
        //---------------------
        if (mwi && mwi !== -1) {
            moreWins[mwi].webContents.send('mdKodiUploadStatus', ['start']);
        }
        ;
        await doW(0.5);
        await delOldKodiPL();
        await copyPLData2Kodi();
        await doW(0.5);
        if (mwi && mwi !== -1) {
            moreWins[mwi].webContents.send('mdKodiUploadStatus', ['finish']);
        }
        ;
        //---------------------
        if (doMDNotify !== null) {
            doNotifyMD2Phone(doMDNotify);
        }
        ;
        //---------------------
        kodiPLUpdInProg = false;
    }
    ;
});
//////////////////////////////////////////////////
// TWITCH API FUNCTIONS
//////////////////////////////////////////////////
electron_1.ipcMain.handle('twtChatMention', (e, args) => {
    if (args[0] === 'show') {
        if (childW) {
            childW.once('focus', () => childW.flashFrame(false));
            childW.flashFrame(true);
        }
        ;
        if (wcWindow) {
            wcWindow.once('focus', () => wcWindow.flashFrame(false));
            wcWindow.setOverlayIcon((electron_1.nativeImage.createFromPath((icoP('assets/wcc-window-notif-twtchatmention.png')))), 'Twitch Chat Mention');
            wcWindow.flashFrame(true);
        }
        ;
    }
    else {
        wcWindow.flashFrame(false);
        wcWindow.setOverlayIcon(null, '');
    }
    ;
    return Promise.resolve(true);
});
//-------------------------------------------------
async function rwdTwitchAuth(action, auth) {
    const taPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/twitch');
    const rAuth = async () => { if (!(await exists(taPath)) || (await statSize(taPath)).d === 0) {
        return Promise.resolve({ r: false, d: null });
    } ; try {
        const rR = await (0, promises_1.readFile)(taPath, { encoding: 'utf-8' });
        if (rR && (await isJSON(rR))) {
            availCons('rwTwitchToken', 'Twitch Auth File [READ] - OK');
            return Promise.resolve({ r: true, d: JSON.parse(rR) });
        }
        else {
            return Promise.resolve({ r: false, d: 'ERROR: JSON Parse Failed' });
        }
    }
    catch (e) {
        console.log(e);
        return Promise.resolve({ r: false, d: e });
    } };
    const wAuth = async (data) => { const taStr = JSON.stringify(data); try {
        await (0, promises_1.writeFile)(taPath, taStr, { encoding: 'utf-8' });
        availCons('rwTwicthAuth', 'Twitch Auth File [WRITE] - OK');
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const dAuth = async () => { if ((await exists(taPath))) {
        try {
            await (0, promises_1.unlink)(taPath);
            availCons('rwTwicthAuth', 'Twitch Auth File [DELETE] - OK');
            return Promise.resolve(true);
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(true);
    } };
    if (action === 'r') {
        return Promise.resolve((await rAuth()));
    }
    else if (action === 'w') {
        return Promise.resolve({ r: (await wAuth(auth)) });
    }
    else {
        return Promise.resolve({ r: (await dAuth()) });
    }
    ;
}
;
//-------------------------------------------------
electron_1.ipcMain.handle('getTWTAuth', (e, args) => { return Promise.resolve(twtAuth); });
//-------------------------------------------------
function isTWTAuthV(auth) { let allKs = ['cbUrl', 'username', 'code', 'token', 'refresh', 'expires', 'client', 'secret'], reqKs = ['token', 'refresh', 'client', 'secret'], v = true; for (let aki = 0; aki < allKs.length; aki++) {
    if (!auth.hasOwnProperty(allKs[aki])) {
        v = false;
        break;
    }
    ;
    for (let rki = 0; rki < reqKs.length; rki++) {
        if (!auth[reqKs[rki]] || auth[reqKs[rki]].trim().length === 0) {
            v = false;
            break;
        }
    }
} ; console.log('Twitch Auth JSON Valid: ' + String(v).toUpperCase()); return Promise.resolve(v); }
;
//-------------------------------------------------
async function twtValidate() { try {
    const valInstance = axios_1.default.create({ headers: { Authorization: 'OAuth ' + twtAuth.token } }), { status } = await valInstance.get('https://id.twitch.tv/oauth2/validate');
    if (status === 200) {
        console.log('Twitch API Validated: TRUE');
        return Promise.resolve(true);
    }
    else {
        console.log('Twitch API Validated: FALSE');
        return Promise.resolve(false);
    }
}
catch (e) {
    console.log('Twitch API Validated: FALSE');
    console.log(e);
    return Promise.resolve(false);
} }
;
//-------------------------------------------------
electron_1.ipcMain.handle('getTwtLives', async (e, args) => { await getTwtLives(); return Promise.resolve(twtLives); });
async function getTwtLives() {
    if (!twtIsAuth || !twtUser || !twtUser.id) {
        return Promise.resolve(false);
    }
    ;
    const { r, d } = await twtReq('get', 'streams/followed', { user_id: twtUser.id });
    if (r) {
        if (!_.isEqual(twtLives, d)) {
            twtLives = d;
            if (childW && childW.webContents) {
                childW.webContents.send('twtLives', [twtLives]);
            }
            ;
        }
        ;
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
}
//------------------------------------------------
electron_1.ipcMain.handle('getTwtUser', async (e, args) => { if (!twtUser) {
    await getTwtUser();
} ; return Promise.resolve(twtUser); });
async function getTwtUser() {
    availCons('getTwtUser', '()...');
    if (!twtIsAuth) {
        return Promise.resolve(false);
    }
    ;
    const { r, d } = await twtReq('get', 'users', { login: 'zer0ne33' });
    if (r && d && d.length > 0) {
        if (!_.isEqual(twtUser, d[0])) {
            twtUser = d[0];
            if (childW && childW.webContents) {
                childW.webContents.send('twtUser', [twtUser]);
            }
        }
        ;
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
}
//------------------------------------------------
async function twtRefresh() {
    availCons('twtRefresh', '()...');
    try {
        const rfURL = 'https://id.twitch.tv/oauth2/token?client_id=' + twtAuth.client + '&client_secret=' + twtAuth.secret + '&grant_type=refresh_token&refresh_token=' + twtAuth.refresh;
        const rfInstance = axios_1.default.create({ responseType: 'json' });
        const { status, data } = await rfInstance.post(rfURL);
        console.log('Twitch API Refresh: ' + String(status));
        if (data.hasOwnProperty('access_token') && twtAuth.token !== data.access_token) {
            twtAuth.token = data.access_token;
        }
        ;
        if (data.hasOwnProperty('refresh_token') && twtAuth.refresh !== data.refresh_token) {
            twtAuth.refresh = data.refresh_token;
        }
        ;
        if (childW && childW.webContents) {
            childW.webContents.send('updTwtAuth', [twtAuth]);
        }
        ;
        await rwdTwitchAuth('w', twtAuth);
        return Promise.resolve({ r: true, d: data.access_token });
    }
    catch (e) {
        console.log('Twitch API Refresh: ERROR');
        return Promise.resolve({ r: false, d: '' });
    }
    ;
}
//------------------------------------------------
async function twtReq(m, ep, ps) {
    availCons('twtReq', '(' + m + ',' + ep + ',params/data)...');
    const twtInstance = axios_1.default.create({ headers: { Authorization: 'Bearer ' + twtAuth.token, 'Client-Id': twtAuth.client }, responseType: 'json', timeout: 5000 });
    const NO_RETRY_HEADER = 'x-no-retry';
    twtInstance.interceptors.response.use(undefined, async (error) => {
        if (error.response.status === 404) {
            return (0, axios_1.default)(error.config);
        }
        else if (!axios_1.default.isCancel(error) && axios_1.default.isAxiosError(error) && error.response.status === 401) {
            if (error.config.headers && error.config.headers[NO_RETRY_HEADER]) {
                return Promise.reject(error);
            }
            ;
            error.config.headers[NO_RETRY_HEADER] = 'true';
            const rfRes = await twtRefresh();
            if (rfRes.r && rfRes.d) {
                error.config.headers['Authorization'] = 'Bearer ' + rfRes.d;
                return (0, axios_1.default)(error.config);
            }
            else {
                return Promise.reject(error);
            }
            ;
        }
        else {
            return Promise.reject(error);
        }
        ;
    });
    const bURL = 'https://api.twitch.tv/helix/';
    try {
        let reqBody = { url: bURL + ep, method: m };
        if (m === 'get' || m === 'delete') {
            if (ps) {
                reqBody['params'] = ps;
            }
        }
        else {
            if (ps) {
                reqBody['data'] = ps;
            }
        }
        ;
        const { status, data } = await twtInstance.request(reqBody);
        if (status === 200) {
            return Promise.resolve({ r: true, d: data.data });
        }
        else {
            return Promise.resolve({ r: false, d: null });
        }
        ;
    }
    catch (e) {
        if (e.hasOwnProperty('response') && e.response && e.response.hasOwnProperty('status') && e.response.status && Number(e.response.status) === 404) {
            let sText = '';
            if (e.response.hasOwnProperty('statusText')) {
                sText = e.response.statusText;
            }
            ;
            return Promise.resolve({ r: false, d: 'Error: (' + String(e.response.status) + ') ' + sText });
        }
        else {
            console.log(e);
            return Promise.resolve({ r: false, d: e });
        }
        ;
    }
    ;
}
//------------------------------------------------
electron_1.ipcMain.handle('initTwt', async (e, args) => { const itRes = await initTwitch(); return Promise.resolve(itRes); });
electron_1.ipcMain.handle('initTwtChat', async (e, args) => { const itcRes = await startTWTChat(args[0]); return Promise.resolve(itcRes); });
electron_1.ipcMain.handle('homeGetTwtStatus', (e, args) => { return { auth: twtIsAuth, chat: twtChatConn }; });
//------------------------------------------------
electron_1.ipcMain.handle('getTwtFollowing', async (e, args) => {
    await getFollowing();
    return Promise.resolve(twtFollowing);
});
//------------------------------------------------
async function getFollowing() {
    availCons('getFollowing', '()...');
    if (!twtIsAuth) {
        return Promise.resolve(false);
    }
    ;
    const { r, d } = await twtReq('get', 'channels/followed', { user_id: '139738358', first: 100 });
    if (r && d && d.length > 0) {
        if (!_.isEqual(twtFollowing, d)) {
            twtFollowing = d;
            if (childW && childW.webContents) {
                childW.webContents.send('twtFollowing', [twtFollowing]);
            }
        }
        ;
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
}
//------------------------------------------------
let twtSVR, killTwtSVR;
async function initTwitch() {
    availCons('initTwitch', '()...');
    const doSuccess = async () => {
        twtIsAuth = true;
        await getTwtUser();
        await getFollowing();
        await getTwtLives();
        if (twtLivesRefreshINT === null) {
            twtLivesRefreshINT = setInterval(() => { getTwtLives(); }, 60000);
        }
        ;
        await delTWTEvSubs();
        startTwitchWSEvents();
        return Promise.resolve(true);
    };
    let doNewAccess = false;
    //------------
    const { r, d } = await rwdTwitchAuth('r');
    if (r && d) {
        const testVRes = await isTWTAuthV(d);
        if (!testVRes) {
            await rwdTwitchAuth('d');
            doNewAccess = true;
        }
        else {
            twtAuth = d;
            const twtValidRes = await twtValidate();
            if (twtValidRes) {
                await doSuccess();
                return Promise.resolve(true);
            }
            else {
                const rfRes = await twtRefresh();
                if (rfRes.r) {
                    await doW(1);
                    const retryTWTVRes = await twtValidate();
                    if (retryTWTVRes) {
                        await doSuccess();
                        return Promise.resolve(true);
                    }
                    else {
                        doNewAccess = true;
                    }
                }
                else {
                    doNewAccess = true;
                }
            }
            ;
        }
        ;
    }
    else {
        doNewAccess = true;
    }
    ;
    //------------
    if (doNewAccess) {
        return new Promise(async (resolve) => {
            try {
                twtSVR = http.createServer(async (req, res) => {
                    if (req.method.toLowerCase() === 'get') {
                        availCons('initTwitch', 'Requesting New Twitch Token...');
                        res.setHeader("Content-Type", "text/html");
                        res.writeHead(200);
                        res.end(appTypes_1.twtAuthHTML);
                    }
                    else {
                        if (req.headers.hasOwnProperty('error')) {
                            let rawD = '', errData;
                            req.on('data', (chunk) => { rawD += chunk; });
                            req.on('end', async () => { if ((await isJSON(rawD))) {
                                errData = JSON.parse(rawD);
                                availCons('initTwitch', 'ERROR: ' + errData.d.error + ' - ' + errData.d.msg);
                            } });
                        }
                        else {
                            if (req.headers.hasOwnProperty('access') && req.headers.access && req.headers.access.length > 0) {
                                twtAuth.code = req.headers.access;
                                availCons('initTwitch', 'Received New Code (' + twtAuth.code + ')');
                                try {
                                    const { status, statusText, data } = await axios_1.default.post('https://id.twitch.tv/oauth2/token?client_id=' + twtAuth.client + '&client_secret=' + twtAuth.secret + '&code=' + twtAuth.code + '&grant_type=authorization_code&redirect_uri=http://localhost:3333&scope=' + twtScopesEnc);
                                    if (status === 200) {
                                        availCons('initTwitch', 'Code => Token SUCCESS!');
                                        if (data.hasOwnProperty('access_token') && twtAuth.token !== data.access_token) {
                                            twtAuth.token = data.access_token;
                                        }
                                        ;
                                        if (data.hasOwnProperty('refresh_token') && twtAuth.refresh !== data.refresh_token) {
                                            twtAuth.refresh = data.refresh_token;
                                        }
                                        ;
                                        if (data.hasOwnProperty('expires_in') && twtAuth.expires !== data.expires_in) {
                                            twtAuth.expires = data.expires_in;
                                        }
                                        ;
                                    }
                                    else {
                                        availCons('initTwitch', 'Code => Token ERROR: ' + String(status) + ' - ' + statusText);
                                        resolve(false);
                                    }
                                    ;
                                }
                                catch (e) {
                                    console.log(e);
                                    resolve(false);
                                }
                                ;
                                if (!r || (r && !_.isEqual(d, twtAuth))) {
                                    await rwdTwitchAuth('w', twtAuth);
                                    availCons('initTwitch', 'Updated/Saved Twitch Auth');
                                }
                                ;
                                await doSuccess();
                                resolve(true);
                            }
                            else {
                                availCons('initTwitch', 'New Token ERROR: No "access" Header Object');
                                resolve(false);
                            }
                            ;
                        }
                        ;
                        res.writeHead(200);
                        res.end();
                    }
                    ;
                }).listen(3333);
                killTwtSVR = (0, http_terminator_1.createHttpTerminator)({ gracefulTerminationTimeout: 1000, server: twtSVR });
                console.log('Twitch Server Running @ ' + twtAuth.cbUrl);
                electron_1.shell.openExternal('https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=' + twtAuth.client + '&redirect_uri=' + twtAuth.cbUrl + '&scope=' + twtScopesEnc);
            }
            catch (e) {
                console.log('initTwitch - ERROR: Error Creating Server');
            }
            ;
        });
    }
    else {
        return Promise.resolve(true);
    }
    ;
}
//------------------------------------------------
function parseTWTTags(t) {
    const tagsToIgnore = { 'client-nonce': null, 'flags': null };
    let dPTags = {}, pTags = t.split(';');
    pTags.forEach((t) => {
        let pT = t.split('='), tV = (pT[1] === '') ? null : pT[1];
        switch (pT[0]) {
            case 'badges':
            case 'badge-info':
                if (tV) {
                    let dict = {}, badges = tV.split(',');
                    badges.forEach((p) => {
                        let bParts = p.split('/');
                        dict[bParts[0]] = bParts[1];
                    });
                    dPTags[pT[0]] = dict;
                }
                else {
                    dPTags[pT[0]] = null;
                }
                ;
                break;
            case 'emotes':
                if (tV) {
                    let dEmotes = {}, emotes = tV.split('/');
                    emotes.forEach((e) => {
                        let eParts = e.split(':'), tPos = [], ps = eParts[1].split(',');
                        ps.forEach((p) => {
                            let pParts = p.split('-');
                            tPos.push({ startPosition: pParts[0], endPosition: pParts[1] });
                        });
                        dEmotes[eParts[0]] = tPos;
                    });
                    dPTags[pT[0]] = dEmotes;
                }
                else {
                    dPTags[pT[0]] = null;
                }
                ;
                break;
            case 'emote-sets':
                let eSetIds = tV.split(',');
                dPTags[pT[0]] = eSetIds;
                break;
            default:
                if (tagsToIgnore.hasOwnProperty(pT[0])) {
                    ;
                }
                else {
                    dPTags[pT[0]] = tV;
                }
                ;
        }
        ;
    });
    return dPTags;
}
;
//------------------------------------------------
function parseTWTComm(rawC) {
    let pC = null, cParts = rawC.split(' ');
    switch (cParts[0]) {
        case 'JOIN':
            pC = { command: cParts[0], channel: cParts[1] };
            break;
        case 'PART':
            pC = { command: cParts[0], channel: cParts[1] };
            break;
        case 'USERNOTICE': pC = { command: cParts[0], channel: cParts[1] };
        case 'NOTICE':
            pC = { command: cParts[0] };
            if (cParts[1] && cParts[1].charAt(0) === '#') {
                pC['channel'] = cParts[1];
            }
            ;
            break;
        case 'CLEARCHAT':
            pC = { command: cParts[0] };
            if (cParts[1] && cParts[1].charAt(0) === '#') {
                pC['channel'] = cParts[1];
            }
            ;
            break;
        case 'HOSTTARGET':
            pC = { command: cParts[0] };
            if (cParts[1]) {
                pC['target'] = cParts[1];
            }
            ;
            break;
        case 'PRIVMSG':
            pC = { command: cParts[0], channel: cParts[1] };
            break;
        case 'USERSTATE':
            pC = { command: cParts[0], channel: cParts[1] };
            break;
        case 'ROOMSTATE':
            pC = { command: cParts[0], channel: cParts[1] };
            break;
        case 'PING':
            pC = { command: cParts[0] };
            break;
        case 'CAP':
            pC = { command: cParts[0], isCapRequestEnabled: (cParts[2] === 'ACK') ? true : false };
            break;
        case 'GLOBALUSERSTATE':
            pC = { command: cParts[0] };
            break;
        case 'RECONNECT':
            pC = { command: cParts[0] };
            break;
        //------------
        case '401':
        case '402':
        case '403':
        case '404':
        case '405':
        case '406':
        case '407':
        case '408':
        case '409':
        case '410':
        case '411':
        case '412':
        case '413':
        case '414':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Failed to send to server/channel/nick' };
            break;
        case '421':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Unknown command' };
            break;
        case '432':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Nickname already in use' };
            break;
        case '465':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Password incorrect' };
            break;
        case '471':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Channel is full' };
            break;
        case '473':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Channel is invite-only' };
            break;
        case '474':
            pC = { command: 'ERROR', error: cParts[0], msg: 'Banned from channel' };
            if (cParts[1] && cParts[1].charAt(0) === '#') {
                pC.msg += ' ' + cParts[1];
            }
            ;
            break;
        //------------
        case '001':
            pC = { command: 'SERVER', type: cParts[0] };
            break;
        case '002':
            pC = { command: 'SERVER', type: cParts[0] };
            break;
        case '003':
            pC = { command: 'SERVER', type: cParts[0] };
            break;
        case '004':
            pC = { command: 'SERVER', type: cParts[0] };
            break;
        //------------
        case '352':
            pC = { command: 'SERVER', type: 'WHOREPLY' };
            break;
        case '315':
            pC = { command: 'SERVER', type: 'ENDOFWHO' };
            break;
        //------------
        case '353':
            pC = { command: 'SERVER', type: 'NAMREPLY' };
            break;
        case '366':
            pC = { command: 'SERVER', type: 'ENDOFNAMES' };
            break;
        //------------
        case '367':
            pC = { command: 'SERVER', type: 'BANLIST' };
            break;
        case '368':
            pC = { command: 'SERVER', type: 'ENDOFBANLIST' };
            break;
        //------------
        case '371':
            pC = { command: 'SERVER', type: 'INFO' };
            break;
        case '374':
            pC = { command: 'SERVER', type: 'ENDOFINFO' };
            break;
        //------------
        case '375':
            pC = { command: 'SERVER', type: 'MOTDSTART' };
            break;
        case '372':
            pC = { command: 'SERVER', type: 'MOTD' };
            break;
        case '376':
            pC = { command: 'SERVER', type: 'ENDOFMOTD' };
            break;
        //------------
        default:
            pC = { command: 'NK' };
            break;
    }
    ;
    return pC;
}
//------------------------------------------------
function parseTWTSrc(rawS) { if (rawS === null) {
    return null;
}
else {
    let sParts = rawS.split('!');
    return { nick: (sParts.length === 2) ? sParts[0] : null, host: (sParts.length === 2) ? sParts[1] : sParts[0] };
} }
//------------------------------------------------
function parseTWTParams(rawP, cmd) {
    let i = 0, cParts = rawP.slice(i + 1).trim(), pIdx = cParts.indexOf(' ');
    if (pIdx === -1) {
        cmd.botCommand = cParts.slice(0);
    }
    else {
        cmd.botCommand = cParts.slice(0, pIdx);
        cmd.botCommandParams = cParts.slice(pIdx).trim();
    }
    ;
    return cmd;
}
//------------------------------------------------
function parseTWTMsg(m) {
    let pM = { command: null, tags: null, source: null, parameters: null };
    let mi = 0, rawT = null, rawS = null, rawC = null, rawP = null;
    if (m[mi] === '@') {
        let endIdx = m.indexOf(' ');
        rawT = m.slice(1, endIdx);
        mi = endIdx + 1;
    }
    ;
    if (m[mi] === ':') {
        mi += 1;
        let endIdx = m.indexOf(' ', mi);
        rawC = m.slice(mi, endIdx);
        mi = endIdx + 1;
    }
    ;
    let endIdx = m.indexOf(':', mi);
    if (-1 == endIdx) {
        endIdx = m.length;
    }
    ;
    rawC = m.slice(mi, endIdx).trim();
    if (endIdx != m.length) {
        mi = endIdx + 1;
        rawP = m.slice(mi);
    }
    ;
    //-----------
    pM.command = parseTWTComm(rawC);
    if (rawT !== null) {
        pM.tags = parseTWTTags(rawT);
    }
    ;
    pM.source = parseTWTSrc(rawS);
    pM.parameters = rawP;
    if (rawP && rawP[0] === '!') {
        pM.command = parseTWTParams(rawP, pM.command);
    }
    ;
    //-----------
    if ((pM.command.command === 'JOIN' || pM.command.command === 'PART') && !pM.parameters) {
        pM.parameters = m.split(' ')[0].split('!')[0].replace(':', '');
    }
    ;
    //-----------
    return Promise.resolve(pM);
}
//------------------------------------------------
async function startTWTChat(channel) {
    availCons('startTWTChat', '()...');
    return new Promise((resolve) => {
        const wsc = require('websocket').client;
        twtWSC = new wsc();
        twtWSC.on('connectFailed', (err) => {
            twtChatConn = false;
            if (childW && childW.webContents) {
                childW.webContents.send('twtChatConn', [twtChatConn]);
            }
            ;
            let msg = '[CONNECTFAILED]';
            if (err && err.toString()) {
                msg += ': ' + err.toString();
            }
            ;
            availCons('twtChat|WSEvent', msg);
            resolve(false);
        });
        twtWSC.on('connect', async (cC) => {
            chatConn = cC;
            //------------
            chatConn.on('error', (e) => {
                let msg = '[ERROR]';
                if (e && e.toString()) {
                    msg += ': ' + e.toString();
                }
                ;
                availCons('twtChat|WSEvent', msg);
                twtChatConn = false;
                if (childW && childW.webContents) {
                    childW.webContents.send('twtChatErr', [msg]);
                }
                ;
            });
            //------------
            chatConn.on('close', (e) => {
                availCons('closeObject', e);
                if (childW && childW.webContents) {
                    childW.webContents.send('twtChatCloseInfo', [e]);
                }
                ;
                twtChatConn = false;
                if (childW && childW.webContents) {
                    childW.webContents.send('twtChatConn', [twtChatConn]);
                }
                ;
                if (twtCommandListenerOn) {
                    electron_1.ipcMain.removeListener('twtChatCommand', twtCommandListener);
                    twtCommandListenerOn = false;
                }
                ;
                if (twtDiscoHandlerOn) {
                    electron_1.ipcMain.removeHandler('twtChatDisconnect');
                    twtDiscoHandlerOn = false;
                }
                ;
            });
            //------------
            chatConn.on('message', async (m) => {
                if (m.type === 'utf8') {
                    let rawM = m.utf8Data.trimEnd();
                    if (childW && childW.webContents) {
                        childW.webContents.send('rawM', [rawM]);
                    }
                    ;
                    availCons('twtChat|WSEvent', '[MESSAGE] (Receieve) @ ' + new Date().toISOString());
                    let mArr = rawM.split('\r\n');
                    for (let msi = 0; msi < mArr.length; msi++) {
                        let pM = await parseTWTMsg(mArr[msi]);
                        if (pM) {
                            //-----------
                            if (childW && childW.webContents) {
                                childW.webContents.send('twtMsgData', [pM]);
                            }
                            ;
                            //-----------
                            if (pM.command.command === 'PING') {
                                const randW = () => { return Number((Math.random() * (3 - 1) + 1).toFixed(1)); }, pongTxt = pM.parameters;
                                await doW(randW());
                                chatConn.sendUTF('PONG :' + pongTxt);
                                availCons('twtChat|PONG|Response', 'SENT!');
                            }
                            ;
                        }
                        else {
                            availCons('twtChat|Event|Error', 'Message Parse Failed');
                        }
                        ;
                    }
                    ;
                }
                else {
                    availCons('twtChat|Event|Error', 'Message NOT UTF8');
                }
                ;
            });
            //------------
            chatConn.sendUTF('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
            chatConn.sendUTF('PASS oauth:' + twtAuth.token);
            chatConn.sendUTF('NICK ' + twtAuth.username);
            twtChatConn = true;
            if (childW && childW.webContents) {
                childW.webContents.send('twtChatConn', [twtChatConn]);
            }
            ;
            availCons('twtChat|WSEvent', '[CONNECT]: Connected to Twitch IRC - OK');
            if (channel) {
                await chatJoinPart('join', channel);
            }
            ;
            if (!twtCommandListenerOn) {
                electron_1.ipcMain.on('twtChatCommand', twtCommandListener);
                twtCommandListenerOn = true;
            }
            ;
            if (!twtDiscoHandlerOn) {
                electron_1.ipcMain.handle('twtChatDisconnect', twtDiscoHandler);
                twtDiscoHandlerOn = true;
            }
            ;
            resolve(true);
        });
        twtWSC.connect('wss://irc-ws.chat.twitch.tv:443');
    });
}
//------------------------------------------------
electron_1.ipcMain.handle('doChatCMD', async (e, args) => {
    availCons('doChatCMD', args[0]);
    try {
        chatConn.sendUTF(args[0]);
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    }
});
//------------------------------------------------
electron_1.ipcMain.handle('doChatJoinPart', async (e, args) => {
    const cjRes = await chatJoinPart(args[0], args[1]);
    return Promise.resolve(cjRes);
});
//-----------
async function chatJoinPart(joinPart, channel) {
    const jpCMD = joinPart.trim().toUpperCase();
    let jpCHN = channel;
    if (jpCHN.startsWith('##')) {
        jpCHN = channel.replace('##', '#');
    }
    ;
    if (!jpCHN.startsWith('#')) {
        jpCHN = '#' + channel;
    }
    ;
    availCons('chatJoinPartFn', jpCMD + ' ' + jpCHN);
    try {
        chatConn.sendUTF(jpCMD + ' ' + jpCHN);
        await doW(1);
        return Promise.resolve(true);
    }
    catch (e) {
        return Promise.resolve(false);
    }
}
;
//------------------------------------------------
electron_1.ipcMain.handle('twtSendWhisper', async (e, args) => {
    const userId = args[0], msg = args[1], swRes = await twtReq('post', 'whispers', { from_user_id: twtUser.id, to_user_id: userId, message: msg });
    return Promise.resolve(swRes.r);
});
//------------------------------------------------
function twtCommandListener(e, args) {
    let cmd = args[0].toUpperCase();
    args[0] !== 'PRIVMSG' ? cmd += ' #' : cmd += ' ';
    cmd += args[1];
    chatConn.sendUTF(cmd);
    availCons('twtChat|WSEvent', '[MESSAGE] (Send) @ ' + new Date().toISOString() + ': ' + cmd);
}
//------------------------------------------------
function twtDiscoHandler(e, args) { chatConn.close(); twtChatConn = false; if (childW && childW.webContents) {
    childW.webContents.send('twtChatConn', [twtChatConn]);
} ; return Promise.resolve(true); }
///////////////////////////////////////////////////
electron_1.ipcMain.handle('getTWTCheermotes', async (e, args) => {
    if (typeof args[0] === 'string' && args[0].length > 0) {
        const { r, d } = await twtReq('get', 'bits/cheermotes', { broadcaster_id: args[0], clean_json: true });
        if (r) {
            const cMList = d.map((cmO) => cmO.prefix);
            return Promise.resolve({ r: true, d: cMList });
        }
        else {
            return Promise.resolve({ r: false, d: null });
        }
    }
    else {
        return Promise.resolve({ r: false, d: null });
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('getTWTChanmotes', async (e, args) => {
    if (typeof args[0] === 'string' && args[0].length > 0) {
        const { r, d } = await twtReq('get', 'chat/emotes', { broadcaster_id: args[0] });
        if (r) {
            return Promise.resolve({ r: true, d: d });
        }
        else {
            return Promise.resolve({ r: false, d: null });
        }
    }
    else {
        return Promise.resolve({ r: false, d: null });
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('getTWTGlobalmotes', async (e, args) => {
    const { r, d } = await twtReq('get', 'chat/emotes/global');
    if (r) {
        return Promise.resolve({ r: true, d: d });
    }
    else {
        return Promise.resolve({ r: false, d: null });
    }
    ;
});
//------------------------------------------------
electron_1.ipcMain.handle('getTWTSubLevel', async (e, args) => {
    const { r, d } = await twtReq('get', 'subscriptions/user', { broadcaster_id: args[0], user_id: 139738358 });
    if (r && d && d.hasOwnProperty('tier')) {
        return Promise.resolve({ r: true, d: d.tier });
    }
    else {
        return Promise.resolve({ r: false, d: null });
    }
});
//------------------------------------------------
electron_1.ipcMain.handle('getTWTEvSubs', (e, args) => {
    return twtEvSubs;
});
//------------------------------------------------
async function getTWTEvSubs() {
    try {
        const { r, d } = await twtReq('get', 'eventsub/subscriptions');
        if (r) {
            twtEvSubs = d;
            availCons('twtEVSubs|NOW', d);
            return Promise.resolve(twtEvSubs);
        }
        else {
            return Promise.resolve(false);
        }
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    }
}
//------------------------------------------------
async function delTWTEvSubs(subid) {
    let delSubIds = [];
    if (subid) {
        delSubIds = [subid];
    }
    else {
        await getTWTEvSubs();
        if (twtEvSubs.length > 0) {
            delSubIds = twtEvSubs.map(s => s.id);
        }
        else {
            delSubIds = [];
        }
    }
    ;
    for (let esi = 0; esi < delSubIds.length; esi++) {
        await twtReq('delete', 'eventsub/subscriptions', { id: delSubIds[esi] });
    }
    ;
    await getTWTEvSubs();
    return Promise.resolve(true);
}
//------------------------------------------------
electron_1.ipcMain.on('twtEvSubModify', async (e, args) => {
    if (args[0] === 'remove') {
        delTWTEvSubs(args[1]);
    }
    else {
        addTWTEvSubs(args[1]);
    }
});
//------------------------------------------------
async function addTWTEvSubs(userId) {
    const sessId = twtEventsSession.id;
    let addUserIds = [];
    if (userId) {
        addUserIds = [userId];
    }
    else {
        await getTwtLives();
        if (twtLives.length > 0) {
            addUserIds = twtLives.map(l => l.user_id);
        }
    }
    ;
    for (let nsi = 0; nsi < addUserIds.length; nsi++) {
        await getTWTEvSubs();
        const existI = twtEvSubs.findIndex(s => s.condition.broadcaster_user_id === addUserIds[nsi]);
        if (existI === -1) {
            try {
                await twtReq('post', 'eventsub/subscriptions', { type: 'stream.offline', version: '1', condition: { broadcaster_user_id: addUserIds[nsi] }, transport: { method: 'websocket', session_id: sessId } });
                availCons('setSub|STREAM.OFFLINE', '[+] ' + addUserIds[nsi]);
            }
            catch (e) {
                console.log(e);
            }
            ;
        }
        ;
    }
    ;
    await getTWTEvSubs();
    return Promise.resolve(true);
}
//------------------------------------------------
function startTwitchWSEvents() {
    availCons('startTwitchWSEvents', '()...');
    const wsc = require('websocket').client;
    twtEvWSC = new wsc();
    twtEvWSC.on('connectFailed', (err) => {
        twtEventsConn = false;
        if (childW && childW.webContents) {
            childW.webContents.send('twtEventsConn', [twtEventsConn]);
        }
        ;
        let msg = '[CONNECTFAILED]';
        if (err && err.toString()) {
            msg += ': ' + err.toString();
        }
        ;
        availCons('twtEvents|WSEvent', msg);
    });
    twtEvWSC.on('connect', async (cC) => {
        eventsConn = cC;
        //------------
        eventsConn.on('error', (e) => {
            let msg = '[ERROR]';
            if (e && e.toString()) {
                msg += ': ' + e.toString();
            }
            ;
            availCons('twtEvents|WSEvent', msg);
            if (childW && childW.webContents) {
                childW.webContents.send('twtEventsErr', [msg]);
            }
            ;
        });
        //------------
        eventsConn.on('close', (e) => {
            let clInfo = 'Conn Closed';
            availCons('closeObject', e);
            const clReasons = { 4000: 'Internal Server Error', 4001: 'Client Sent Inbound Traffic', 4002: 'Client Failed Ping-Pong', 4003: 'Client Unused', 4004: 'Reconnect Grace Expired', 4005: 'Network Timeout', 4006: 'Network Error', 4007: 'Invalid Reconnect' };
            if (e.hasOwnProperty('code')) {
                clInfo += ' (' + String(e.code) + ') ';
            }
            ;
            if (clReasons.hasOwnProperty(e.code)) {
                clInfo += clReasons[e.code];
            }
            ;
            availCons('twtEvents|WSEvent', clInfo);
            twtEventsConn = false;
            if (childW && childW.webContents) {
                childW.webContents.send('twtEventsConn', [twtEventsConn]);
            }
            ;
        });
        //------------
        eventsConn.on('message', async (m) => {
            let mData = JSON.parse(m.utf8Data);
            if (mData.metadata.message_type !== 'session_keepalive') {
                availCons('twtEvents|WSEvent|' + mData.metadata.message_type.toUpperCase(), mData);
            }
            ;
            switch (mData.metadata.message_type) {
                case 'session_welcome':
                    twtEventsConn = true;
                    if (twtEventsSession && twtEventsSession.hasOwnProperty('reconnect_url')) {
                        availCons('>>>>>>>>>', '[ [|RE|CONNECTED - OK! ] <<<<<<<<<');
                    }
                    else {
                        availCons('>>>>>>>>>', '[ CONNECTED - OK ] <<<<<<<<<');
                    }
                    ;
                    twtEventsSession = mData.payload.session;
                    await addTWTEvSubs();
                    break;
                case 'session_keepalive': break;
                case 'session_reconnect':
                    twtEventsSession = mData.payload.session;
                    twtEventsConn = false;
                    if (childW && childW.webContents) {
                        childW.webContents.send('twtEventsConn', [twtEventsConn]);
                    }
                    ;
                    availCons('>>>>>>>>>', '[ RECONNECTING ] <<<<<<<<<');
                    eventsConn.close();
                    await doW(1);
                    startTwitchWSEvents();
                    break;
                case 'notification':
                    availCons('twtEvents|' + mData.metadata.subscription_type.toUpperCase(), mData.payload.event);
                    const rawE = mData.payload.event;
                    switch (mData.metadata.subscription_type) {
                        case 'stream.online':
                        case 'stream.offline':
                            availCons('', rawE);
                            if (childW && childW.webContents) {
                                childW.webContents.send('twtEventData', [mData.metadata.subscription_type, mData.payload.event]);
                            }
                            ;
                            break;
                        default: availCons('twtEvents|WSEvent', '[UNKNOWN] Subscription Type: ' + mData.metadata.subscription_type);
                    }
                    ;
                    break;
                case 'revocation':
                    await getTWTEvSubs();
                    break;
                default: availCons('twtEvents|WSEvent', '[UNKNOWN] Message Type: ' + mData.metadata.message_type);
            }
            ;
        });
        //------------
        twtEventsConn = true;
        if (childW && childW.webContents) {
            childW.webContents.send('twtEventsConn', [twtEventsConn]);
        }
        ;
        availCons('twtEvents|WSEvent', '[CONNECT]: Connected to Twitch Websocket Events - OK');
    });
    let twtEvWSSURL = 'wss://eventsub.wss.twitch.tv/ws';
    if (twtEventsSession && twtEventsSession.hasOwnProperty('reconnect_url') && twtEventsSession.reconnect_url.length > 6) {
        twtEvWSSURL = twtEventsSession.reconnect_url;
    }
    ;
    twtEvWSC.connect(twtEvWSSURL);
}
//------------------------------------------------
electron_1.ipcMain.handle('getBPMData', async (e, args) => {
    availCons('getBPMData', '()...');
    const getBPM = () => {
        return new Promise((resolve) => {
            (0, child_process_1.execFile)(fbBPMExePath, ['-d', '-p', '-f', '0', fbMP3Path], (error, stdout, stderr) => {
                if (error) {
                    resolve(false);
                }
                ;
                let bpm = parseInt(stdout.trim().split('\n').filter(l => l.trim().length > 0 && !l.includes('\r'))[0].replace(' BPM', ''));
                if (bpm <= 90) {
                    bpm = bpm * 2;
                }
                ;
                if (bpm >= 200) {
                    bpm = bpm / 2;
                }
                ;
                resolve(bpm);
            });
        });
    };
    if (fbInProg) {
        return Promise.resolve({ r: false, d: 'BPM Calc IN PROGRESS...' });
    }
    else {
        fbInProg = true;
        const recMP3Res = await recBPMAudio();
        if (!recMP3Res) {
            if ((await exists(fbMP3Path))) {
                try {
                    await (0, promises_1.unlink)(fbMP3Path);
                }
                catch (e) {
                    console.log(e);
                }
            }
            ;
            fbInProg = false;
            return Promise.resolve({ r: false, d: 'BPM Record Failed' });
        }
        else {
            const calcBPMRes = await getBPM();
            if ((await exists(fbMP3Path))) {
                try {
                    await (0, promises_1.unlink)(fbMP3Path);
                }
                catch (e) {
                    console.log(e);
                }
            }
            ;
            if (calcBPMRes === false) {
                fbInProg = false;
                return Promise.resolve({ r: false, d: 'BPM Detect Failed' });
            }
            else {
                fbInProg = false;
                return Promise.resolve({ r: true, d: calcBPMRes });
            }
            ;
        }
        ;
    }
    ;
});
//------------------------------------------------
async function recBPMAudio() {
    if ((await exists(fbMP3Path))) {
        try {
            await (0, promises_1.unlink)(fbMP3Path);
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    }
    ;
    return new Promise((resolve) => {
        const fBSpawn = require('child_process').spawn;
        const doFBRec = fBSpawn(fbFFMPath, ['-f', 'dshow', '-i', 'audio=Line 1 (Virtual Audio Cable)', '-t', '30', fbMP3Path]);
        doFBRec.on('close', async (code) => {
            if ((code === 0 || code === '0') && (await exists(fbMP3Path))) {
                resolve(true);
            }
            else {
                resolve(false);
            }
            ;
        });
    });
}
;
//------------------------------------------------
electron_1.ipcMain.handle('findTune', async (e, args) => {
    const dCode = (s) => { return decodeURIComponent(s.replace(/\+/g, ' ')); };
    // NEW SHAZAM
    const shazRecAudio = async () => {
        return new Promise((resolve) => {
            let errs = 0;
            const fTSpawn = require('child_process').spawn;
            const doRec = fTSpawn(ftFFMPath, ['-f', 'dshow', '-i', 'audio=Line 1 (Virtual Audio Cable)', '-t', '5', '-y', '-f', 's16le', '-ac', '1', '-acodec', 'pcm_s16le', ftRAWPath]);
            doRec.on('close', async (code) => {
                if (code === 0 && (await exists(ftRAWPath))) {
                    availCons('findTune|FFMPEG|Record', 'Sample RAW SUCCESS');
                    resolve(true);
                }
                else {
                    availCons('findTune|FFMPEG|Record', 'Sample RAW FAILED (' + String(errs) + ' Errors) - Code:' + String(code));
                    resolve(false);
                }
                ;
            });
        });
    };
    if ((await exists(ftRAWPath))) {
        try {
            await (0, promises_1.unlink)(ftRAWPath);
        }
        catch (e) {
            console.log(e);
        }
    }
    ;
    childW.webContents.send('findTuneStatus', ['recording']);
    const doRecRes = await shazRecAudio();
    if (doRecRes) {
        childW.webContents.send('findTuneStatus', ['matching']);
        const ftData = await (0, promises_1.readFile)(ftRAWPath, { encoding: 'base64' });
        try {
            const aRes = await axios_1.default.post(ftAPIUrl, ftData, ftReqOpts);
            let ftResObj = { artist: '', title: '', album: '', label: '', year: '' };
            if (aRes.status === 200 && aRes.data.hasOwnProperty('matches') && aRes.data.matches.length > 0 && aRes.data.hasOwnProperty('track') && !_.isEmpty(aRes.data.track)) {
                const ftR = aRes.data.track;
                if (ftR.hasOwnProperty('urlparams') && !_.isEmpty(ftR.urlparams) && ftR.urlparams.hasOwnProperty('{tracktitle}') && ftR.urlparams['{tracktitle}'] && ftR.urlparams['{tracktitle}'].length > 0 && ftR.urlparams.hasOwnProperty('{trackartist}') && ftR.urlparams['{trackartist}'] && ftR.urlparams['{trackartist}'].length > 0) {
                    ftResObj.artist = dCode(ftR.urlparams['{trackartist}']);
                    ftResObj.title = dCode(ftR.urlparams['{tracktitle}']);
                }
                else if (ftR.hasOwnProperty('share') && !_.isEmpty(ftR.share) && ftR.share.hasOwnProperty('subject') && ftR.share.subject && ftR.share.subject.length > 0) {
                    const shareStrArr = ftR.share.subject.split(' - ');
                    ftResObj.artist = shareStrArr[1].trim();
                    ftResObj.title = shareStrArr[0].trim();
                }
                ;
                if (ftR.hasOwnProperty('sections') && !_.isEmpty(ftR.sections)) {
                    const songArr = ftR.sections.filter(s => s.type === 'SONG');
                    if (songArr.length > 0) {
                        const songObj = songArr[0];
                        if (songObj.hasOwnProperty('metadata') && songObj.metadata && songObj.metadata.length > 0) {
                            const albumArr = songObj.metadata.filter(mO => mO.title === 'Album');
                            if (albumArr.length > 0) {
                                if (albumArr[0].text.toLowerCase().includes(' - single')) {
                                    ftResObj.album = 'Single';
                                }
                                else {
                                    ftResObj.album = albumArr[0].text;
                                }
                            }
                            ;
                            const labelArr = songObj.metadata.filter(mO => mO.title === 'Label');
                            if (labelArr.length > 0) {
                                ftResObj.label = labelArr[0].text;
                            }
                            ;
                            const yearArr = songObj.metadata.filter(mO => mO.title === 'Released');
                            if (yearArr.length > 0) {
                                ftResObj.year = yearArr[0].text;
                            }
                            ;
                        }
                        ;
                    }
                    ;
                }
                ;
                //-----------
                if (ftResObj.artist.length > 0 && ftResObj.title.length > 0) {
                    return Promise.resolve({ r: true, d: ftResObj });
                }
                else {
                    return Promise.resolve({ r: false, d: 'lackdetail' });
                }
                ;
                //-----------
            }
            else {
                return Promise.resolve({ r: false, d: 'notfound' });
            }
            ;
        }
        catch (e) {
            console.log(e);
            return Promise.resolve({ r: false, d: 'error' });
        }
        ;
    }
    else {
        console.log('ABORTED - Recording Failed');
        return Promise.resolve({ r: false, d: 'error' });
    }
    ;
});
//------------------------------------------------
async function initFFMPEG() {
    console.log('initFFMPEG ()...');
    let newFPaths = ffPaths;
    let appPath = electron_1.app.getAppPath();
    console.log('initFFMPEG App Path: ' + appPath);
    for (const k of Object.keys(ffPaths)) {
        const defP = path.join(appPath, 'binary/' + k + '.exe');
        if ((await exists(defP))) {
            newFPaths[k] = defP;
            console.log('initFFMPEG Added ' + k.toUpperCase() + ' to ffPaths: ' + defP);
        }
        else {
            newFPaths[k] = null;
            console.log('initFFMPEG !!! MISSING !!! ' + k.toUpperCase() + ' - .exe !==exist');
        }
        ;
    }
    ;
    ffPaths = newFPaths;
    if (ffPaths.ffmpeg !== null && ffPaths.ffplay !== null && ffPaths.ffprobe !== null) {
        console.log('initFFMPEG SUCCESS! All ffPaths Set - OK');
    }
    else {
        let errPs = [];
        for (const [k, v] of Object.entries(ffPaths)) {
            if (v === null) {
                errPs.push(k);
            }
            ;
            console.log('initFFMPEG ERROR: Missing .EXEs: ' + errPs.join(', '));
        }
    }
    ;
    if (childW && childW.webContents) {
        childW.webContents.send('ffPaths', [ffPaths]);
    }
    ;
    return Promise.resolve(true);
}
//////////////////////////////////////////////////
///// YTDL MODULE
//////////////////////////////////////////////////
async function rwdYTDLData(action, data) {
    const ytPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/ytdl');
    const rData = async () => { if (!(await exists(ytPath)) || (await statSize(ytPath)).d === 0) {
        return Promise.resolve({ r: false, d: null });
    } ; try {
        const rR = await (0, promises_1.readFile)(ytPath, { encoding: 'utf-8' });
        if (rR && (await isJSON(rR))) {
            availCons('rwdYTDLData', 'YTDL Data File [READ] - OK');
            return Promise.resolve({ r: true, d: JSON.parse(rR) });
        }
        else {
            return Promise.resolve({ r: false, d: 'ERROR: JSON Parse Failed' });
        }
    }
    catch (e) {
        console.log(e);
        return Promise.resolve({ r: false, d: e });
    } };
    const wData = async (wD) => { const ytStr = JSON.stringify(wD); try {
        await (0, promises_1.writeFile)(ytPath, ytStr, { encoding: 'utf-8' });
        availCons('rwdYTDLData', 'YTDL Data File [WRITE] - OK');
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const dData = async () => { if ((await exists(ytPath))) {
        try {
            await (0, promises_1.unlink)(ytPath);
            availCons('rwdYTDLData', 'YTDL Data File [DELETE] - OK');
            return Promise.resolve(true);
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(true);
    } };
    if (action === 'r') {
        return Promise.resolve((await rData()));
    }
    else if (action === 'w') {
        return Promise.resolve({ r: (await wData(data)) });
    }
    else {
        return Promise.resolve({ r: (await dData()) });
    }
    ;
}
;
//-------------------------------------------------
electron_1.ipcMain.handle('readHistoryDrop', async (e, args) => {
    const readHTML = async (p) => { try {
        const rr = await (0, promises_1.readFile)(p, { encoding: 'utf-8' });
        if (rr && rr.length > 0) {
            return Promise.resolve(rr);
        }
    }
    catch {
        return Promise.resolve(false);
    } };
    const doHistConv = async (hfp) => {
        const vcUrlIsV = urlString => { var urlPattern = new RegExp('^(https?:\\/\\/)?' + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + '((\\d{1,3}\\.){3}\\d{1,3}))' + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + '(\\?[;&a-z\\d%_.~+=-]*)?' + '(\\#[-a-z\\d_]*)?$', 'i'); return !!urlPattern.test(urlString); };
        const readHTMLRes = await readHTML(hfp);
        if (readHTMLRes === false) {
            console.log('FAILED - Error Reading HTML File');
            return Promise.resolve(false);
        }
        else {
            //------------
            let finHA = [];
            //------------
            let bodyTxt = readHTMLRes.split('</style></head><body><div class="mdl-grid">')[1];
            let rb = bodyTxt.replaceAll('<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp">', 'XXX<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp">');
            const gBodArr = rb.split('XXX');
            for (let gbi = 0; gbi < gBodArr.length; gbi++) {
                let l = gBodArr[gbi];
                if (l.trim().length > 0) {
                    l = l.replace('<div class="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp"><div class="mdl-grid"><div class="header-cell mdl-cell mdl-cell--12-col"><p class="mdl-typography--title">YouTube<br></p></div><div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">Watched', '');
                    l = l.replace(/ class="[a-zA-Z0-9:;\.\s\(\)\-\,]*"/gi, '');
                    l = l.replace('</div><div></div><div><b>Products:</b><br>&emsp;YouTube<br><b>Why is this here?</b><br>&emsp;This activity was saved to your Google Account because the following settings were on:&nbsp;YouTube watch history.&nbsp;You can control these settings &nbsp;<a href="https://myaccount.google.com/activitycontrols">here</a>.</div></div></div>', '');
                    if (l.startsWith('<a href=')) {
                        const lArr = l.split('">'), u = lArr[0].replace('<a href="', '').trim(), t = lArr[1].split('</a>')[0].trim().replace(/&nbsp;/g, '');
                        let d;
                        if (lArr[2]) {
                            d = lArr[2].split('<br>')[1].split('AWST')[0];
                        }
                        else {
                            d = 'NK';
                        }
                        ;
                        finHA.push({ vUrl: u, vTitle: t, date: d });
                    }
                }
            }
            ;
            //------------
            let ddArr = [];
            //------------
            for (let ci = 0; ci < finHA.length; ci++) {
                let hO = finHA[ci];
                if (!(vcUrlIsV(finHA[ci].vUrl))) {
                    hO.vUrl = 'https://youtube.com';
                }
                ;
                hO.vTitle = finHA[ci].vTitle.replace(/[^a-zA-Z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
                if (hO.date !== 'NK') {
                    const ddns = finHA[ci].date.replace(/\u202FAM/g, 'AM').replace(/[^a-zA-Z0-9:,]+/g, ''), dp = (0, date_fns_1.parse)(ddns, 'MMMd,yyyy,h:mm:ssa', new Date());
                    if ((0, date_fns_1.isValid)(dp)) {
                        hO.date = (0, date_fns_1.format)(dp, 'dd/MM/yy HH:mm:ss');
                        ddArr.push(hO);
                    }
                }
            }
            ;
            return Promise.resolve(ddArr);
        }
    };
    //----------
    const hFPath = args[0];
    if (args[0] && args[0].length > 0 && (await exists(hFPath))) {
        const sS = await statSize(hFPath);
        if (sS.r && sS.d > 0) {
            const hArr = await doHistConv(path.resolve(args[0]));
            if (hArr !== false) {
                return Promise.resolve(hArr);
            }
            else {
                return Promise.resolve([]);
            }
        }
        else {
            return Promise.resolve([]);
        }
    }
    else {
        return Promise.resolve([]);
    }
});
//-------------------------------------------------
electron_1.ipcMain.handle('readYTDLData', async (e, args) => {
    const ytPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/ytdl');
    if (ytdlData && typeof ytdlData === 'object' && !_.isEmpty(ytdlData)) {
        return Promise.resolve(ytdlData);
    }
    else {
        const dD = { scrapeItems: [], searchItems: [], selectedItems: [], dlBatches: [], finSessions: [], myDaily: { mySubs: [], myDls: [], myKodi: { playlists: [], logs: [] }, myHistory: [] } };
        if (!(await exists(ytPath))) {
            await rwdYTDLData('w', dD);
            ytdlData = dD;
            return Promise.resolve(dD);
        }
        else {
            const { r, d } = await rwdYTDLData('r');
            if (r && d) {
                ytdlData = d;
                return Promise.resolve(d);
            }
            else {
                await rwdYTDLData('w', dD);
                ytdlData = dD;
                return Promise.resolve(dD);
            }
        }
        ;
    }
    ;
});
//-------------------------------------------------
electron_1.ipcMain.handle('ytdlDLPLThumbnail', async (e, args) => {
    availCons('IPCMAIN|ytdlDLPLThumbnail', args[0] + ' / ' + args[1]);
    const jpgUrl = args[0], vId = args[1];
    const dayPLDirName = (0, date_fns_1.format)(new Date(), 'ddMMyy');
    const baseDayPLDir = 'C:\\myYTDLData\\mydaily\\kodipls\\' + dayPLDirName;
    const thumbPath = path.join(baseDayPLDir, 'thumb_' + vId);
    const fixThumbExt = () => {
        const tDir = 'C:\\myYTDLData\\bins', tExe = path.join(tDir, 'trid.exe'), tDef = path.join(tDir, 'triddefs.trd');
        return new Promise(async (resolve) => {
            try {
                const tridProc = (0, child_process_1.spawn)(tExe, [thumbPath, '-ce', '-d:' + tDef, '-n:0'], { windowsHide: true });
                tridProc.on('close', async () => {
                    const newList = await (0, promises_1.readdir)(baseDayPLDir);
                    if (newList && newList.length > 0) {
                        let matchFNStr = null;
                        for (let ti = 0; ti < newList.length; ti++) {
                            const tN = newList[ti];
                            if (tN.includes('thumb_' + vId)) {
                                matchFNStr = tN;
                            }
                        }
                        ;
                        if (matchFNStr) {
                            const fixdFullPath = path.join(baseDayPLDir, matchFNStr);
                            resolve(fixdFullPath);
                        }
                        else {
                            resolve(false);
                        }
                        ;
                    }
                    else {
                        resolve(false);
                    }
                    ;
                });
            }
            catch (e) {
                resolve(false);
            }
            ;
        });
    };
    const dlThumb = () => {
        return new Promise((resolve) => {
            const fileStream = fs.createWriteStream(thumbPath);
            https.get(jpgUrl, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', () => { fileStream.close(); resolve(true); });
                fileStream.on('error', (e) => { console.log(e); resolve(false); });
            }).on('error', (e) => { console.log(e); resolve(false); });
        });
    };
    const remThumb = async (path) => { try {
        await (0, promises_1.unlink)(path);
        return Promise.resolve(true);
    }
    catch (e) {
        return Promise.resolve(false);
    } };
    //--------------
    const noExtPath = thumbPath;
    const neTStatRes = await statSize(noExtPath);
    const jpgExtPath = thumbPath + '.jpg';
    const jpTStateRes = await statSize(jpgExtPath);
    if (jpTStateRes.r) {
        return Promise.resolve(jpgExtPath);
    }
    else {
        if ((await exists(jpgExtPath))) {
            await remThumb(jpgExtPath);
        }
    }
    ;
    if (neTStatRes.r) {
        const doFixRes = await fixThumbExt();
        if (doFixRes) {
            return Promise.resolve(doFixRes);
        }
        else {
            return Promise.resolve(noExtPath);
        }
    }
    else {
        if ((await exists(noExtPath))) {
            await remThumb(noExtPath);
        }
    }
    ;
    const doDL = await dlThumb();
    if (doDL) {
        const doFixExt = await fixThumbExt();
        if (doFixExt) {
            return Promise.resolve(doFixExt);
        }
        else {
            return Promise.resolve(thumbPath);
        }
        ;
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//-------------------------------------------------
electron_1.ipcMain.handle('writeYTDLData', async (e, args) => {
    const wRes = await rwdYTDLData('w', args[0]);
    if (wRes.r) {
        ytdlData = args[0];
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//------------------------------------------------
const getRnd3WordTerm = async () => { const gRST = await (0, appTypes_2.randomST)(); return Promise.resolve(gRST); };
const getYTTrends = async () => {
    try {
        const { status, data } = await axios_1.default.get(trendYTAPIUrl, trendYTReqOpts);
        if (status === 200 && data && data.length > 0) {
            let trendYTVids = [];
            for (let vi = 0; vi < data.length; vi++) {
                const v = data[vi];
                trendYTVids.push({ id: v.videoId, title: v.title, url: v.videoUrl, channel: { id: v.channelUrl, name: v.channelName, url: v.channelUrl } });
            }
            ;
            return Promise.resolve(trendYTVids);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        return Promise.resolve(false);
    }
    ;
};
const getTwitterTrends = async () => {
    try {
        const { status, data } = await axios_1.default.get(trendTwitterAPIUrl, trendTwitterReqOpts);
        if (status === 200 && data.success && data.data.modules.length > 0) {
            const trendsArr = data.data.modules;
            let trendStrArr = [];
            for (let mi = 0; mi < trendsArr.length; mi++) {
                const t = trendsArr[mi].trend.name.trim().replace(/#/g, '');
                if (t.length > 3) {
                    trendStrArr.push(t);
                }
                ;
            }
            ;
            return Promise.resolve({ r: true, d: trendStrArr });
        }
        else {
            return Promise.resolve({ r: false, d: null });
        }
        ;
    }
    catch (e) {
        return Promise.resolve({ r: false, d: null });
    }
    ;
};
electron_1.ipcMain.handle('getYTDLTerms', async (e, args) => {
    let gTopicsRes = [], gTopicMax = 100, gTopicCount = 0;
    const gYTTRes = await getYTTrends();
    if (gYTTRes) {
        const gYTTResObj = { type: 'ytt', item: gYTTRes };
        gTopicsRes.push(gYTTResObj);
        gTopicCount++;
        gTopicMax--;
    }
    ;
    if (gTopicsRes.length >= 100) {
        if (gTopicsRes.length > 100) {
            gTopicsRes = gTopicsRes.slice(0, 100);
        }
        ;
        return Promise.resolve(gTopicsRes);
    }
    else {
        const gTTRes = await getTwitterTrends();
        if (gTTRes.r) {
            const gTTResObjs = gTTRes.d.map((s) => { return { type: 'twt', item: s }; });
            gTopicsRes = gTopicsRes.concat(gTTResObjs);
            gTopicCount += gTTResObjs.length;
            gTopicMax -= gTTResObjs.length;
        }
        ;
        if (gTopicsRes.length >= 100) {
            if (gTopicsRes.length > 100) {
                gTopicsRes = gTopicsRes.slice(0, 100);
            }
            ;
            return Promise.resolve(gTopicsRes);
        }
        else {
            for (let mi = 0; mi < gTopicMax; mi++) {
                const gRTRes = await getRnd3WordTerm();
                const gRTObj = { type: 'rnd', item: gRTRes };
                gTopicsRes.push(gRTObj);
            }
            ;
            return Promise.resolve(gTopicsRes);
        }
        ;
    }
    ;
});
//------------------------------------------------
const str2Secs = (s) => {
    if (typeof s !== 'string') {
        return;
    }
    let ttlS = 0;
    try {
        if (s.includes(':')) {
            const partsArr = s.split(':');
            if (partsArr.length === 2) {
                ttlS += ((Number(partsArr[0])) * 60);
                ttlS += Number(partsArr[1]);
            }
            else if (partsArr.length === 3) {
                ttlS += ((Number(partsArr[0])) * 60 * 60);
                ttlS += ((Number(partsArr[1])) * 60);
                ttlS += Number(partsArr[2]);
            }
            else {
                availCons('IPCMain|ytdlGetDurOnly', 'ERROR: convert durStr -> seconds failed');
                return false;
            }
            ;
        }
        else {
            ttlS = Number(s);
        }
        ;
        return ttlS;
    }
    catch (e) {
        console.log(e);
        availCons('IPCMain|ytdlGetDurOnly', 'ERROR: convert durStr -> seconds failed');
        return false;
    }
};
//------------------------------------------------
electron_1.ipcMain.handle('ytdlMDDLVideo', async (e, args) => {
    const ytdlExePath = 'C:\\myYTDLData\\bins\\ytdl.exe';
    const videoURL = 'http://www.youtube.com/watch?v=' + args[0];
    const baseDir = 'C:\\myYTDLData\\mydaily\\kodipls';
    const dayDirStr = (0, date_fns_1.format)(new Date(), 'ddMMyy');
    const vDLDirPath = path.join(baseDir, dayDirStr);
    const vDLFilePath = path.join(vDLDirPath, 'video_' + args[0] + '.mp4');
    const dlVid = () => {
        return new Promise((resolve) => {
            try {
                let dlSTMS = Date.now();
                const cmdSpawn = require('child_process').spawn;
                const cmdProc = cmdSpawn(ytdlExePath, ['-f', 'bestvideo[height<720]+bestaudio/best[height<720]', '-o', vDLFilePath, '--merge-output-format', 'mp4', videoURL]);
                cmdProc.stdout.on('data', async (data) => {
                    let wI = await getMWBrwsr('ytdl');
                    if (wI && wI !== -1) {
                        const output = data.toString();
                        if (output.trim().startsWith('[download]') && output.includes(' of ') && output.includes(' at ') && output.includes(' ETA ')) {
                            const percNo = parseInt(output.split(' of ')[0].replace('[download]', '').replace('%', '').trim(), 10) / 100;
                            const percStr = (percNo * 100).toFixed(0) + '%';
                            const bytesRegex = /[0-9]+\.[0-9]+/g;
                            let ttlBytesNo = 0, ttlBytesStr = '0';
                            const ttlBMatch = output.split(' of ')[1].split(' at ')[0].trim().match(bytesRegex);
                            if (ttlBMatch) {
                                ttlBytesNo = Math.floor(Number(ttlBMatch[0]));
                                ttlBytesStr = String(ttlBytesNo) + '%';
                            }
                            ;
                            let dlSpdNo = 0, dlSpdStr = '0';
                            const dlBMatch = output.split(' at ')[1].split(' ETA ')[0].trim().match(bytesRegex);
                            if (dlBMatch) {
                                dlSpdNo = Number(dlBMatch[0]);
                                dlSpdStr = dlSpdNo.toFixed(1);
                            }
                            ;
                            let dlBytesNo = 0, dlBytesStr = '0';
                            if (ttlBytesNo > 0 && percNo > 0) {
                                dlBytesNo = Number((ttlBytesNo * percNo).toFixed(1));
                            }
                            let dlETASecs = -1, dlETAStr = '?';
                            const rawETA = output.split(' ETA ')[0].trim();
                            const cvtETARes = str2Secs(rawETA);
                            if (cvtETARes !== false) {
                                dlETASecs = cvtETARes;
                                dlETAStr = rawETA;
                            }
                            ;
                            const elaNo = (Date.now() - dlSTMS) / 1000;
                            const elaStr = s2T(elaNo);
                            let cmdProgObj = { dl: { no: dlBytesNo, str: dlBytesStr }, ttl: { no: ttlBytesNo, str: ttlBytesStr }, perc: { no: percNo, str: percStr }, spd: { no: dlSpdNo, str: dlSpdStr }, ela: { no: elaNo, str: elaStr }, eta: { no: dlETASecs, str: dlETAStr } };
                            moreWins[wI].webContents.send('ytdlMDDLVideoProg', [cmdProgObj]);
                            availCons('ipcMAIN|ytdlMDDLVideo', cmdProgObj);
                        }
                    }
                });
                cmdProc.on('error', (e) => { availCons('IPCMain|ytdlMDDLVideo', e); resolve(false); });
                cmdProc.on('close', (code) => { if (code === 0 || code === '0') {
                    resolve(true);
                }
                else {
                    resolve(false);
                } });
            }
            catch (e) {
                availCons('IPCMain|ytdlMDDLVideo', e);
                resolve(false);
            }
            ;
        });
    };
    const cmdDLRes = await dlVid();
    return Promise.resolve(cmdDLRes);
});
//------------------------------------------------
electron_1.ipcMain.handle('localGetDurOnly', async (e, args) => {
    const ffProbePath = path.normalize('C:\\myYTDLData\\bins\\ffprobe.exe');
    const lclVPath = path.normalize(args[0]);
    const getDur = () => {
        return new Promise((resolve) => {
            const cmdSpawn = require('child_process').spawn, cmdProc = cmdSpawn(ffProbePath, [lclVPath, '-show_entries', 'format=duration', '-of', 'compact=p=0:nk=1', '-v', '0']);
            let gDRes = false;
            cmdProc.stdout.on('data', (data) => { if (Number(data) && Number(data) > 0) {
                gDRes = Math.round(Number(data));
            } });
            cmdProc.on('close', async (code) => { if ((code === 0 || code === '0') && gDRes !== false) {
                resolve(gDRes);
            }
            else {
                resolve(false);
            } });
        });
    };
    //-----------------
    if ((await exists(lclVPath))) {
        const gDRes = await getDur();
        if (gDRes !== false) {
            return Promise.resolve({ secs: gDRes, str: (s2T(gDRes)) });
        }
        else {
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(false);
    }
});
//------------------------------------------------
electron_1.ipcMain.handle('ytdlGetDurOnly', async (e, args) => {
    const gDORes = await ytdlGetDurOnly(args[0]);
    return Promise.resolve(gDORes);
});
async function ytdlGetDurOnly(idOrUrl) {
    const ytdlExePath = 'C:\\myYTDLData\\bins\\ytdl.exe';
    let videoURL = 'http://www.youtube.com/watch?v=' + idOrUrl;
    if (idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) {
        videoURL = idOrUrl;
    }
    ;
    const getDur = () => {
        return new Promise((resolve) => {
            const cmdSpawn = require('child_process').spawn, cmdProc = cmdSpawn(ytdlExePath, ['--get-duration', videoURL]);
            let gDRes = '';
            cmdProc.stdout.on('data', (data) => { if (data) {
                gDRes += data.toString();
            } });
            cmdProc.on('close', async (code) => { if ((code === 0 || code === '0') && gDRes !== false) {
                resolve(gDRes);
            }
            else {
                resolve(false);
            } });
        });
    };
    const gDR = await getDur();
    if (gDR !== false) {
        const s2SR = str2Secs(gDR);
        if (s2SR !== false) {
            return Promise.resolve(s2SR);
        }
        else {
            return Promise.resolve(0);
        }
    }
    else {
        availCons('IPCMain|ytdlGetDurOnly', 'ERROR: get-duration FAILED for ' + idOrUrl);
        return Promise.resolve(0);
    }
}
//////////////////////////////////////////////////
// WEBCAM MOTION FUNCTIONS
//////////////////////////////////////////////////
electron_1.ipcMain.on('webcamMotion', (e, args) => { webcamMotion = args[0]; });
//////////////////////////////////////////////////
// WIFING MODULE
//////////////////////////////////////////////////
const kaliPLinkBase = ['-batch', '-ssh', 'root@192.168.0.5', '-pw', '***********'];
let monModes = { wlan0: false, wlan1: false };
const kaliIWConfig = ['iwconfig'];
const kaliAirmonStartMM = ['airmon-ng', 'start'];
const kaliAirmonStopMM = ['airmon-ng', 'stop'];
let dumpNGProcess = { inprog: false, pid: -1, proc: null, dumpINT: null, prevDD: [] };
let dumpIsPaused = false;
const kaliDumpStart = ['airodump-ng', 'wlan0', '-w', '/mnt/hgfs/PC/KaliVM/ngData/dump', '--output-format', 'csv', '--write-interval', '1', '--update', '1'];
const dumpCSVFPath = path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\dump-01.csv');
//------------------------------------------------
async function rwdWIFINGData(action, data) {
    const wingPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/wifing');
    const rData = async () => { if (!(await exists(wingPath)) || (await statSize(wingPath)).d === 0) {
        return Promise.resolve({ r: false, d: null });
    } ; try {
        const rR = await (0, promises_1.readFile)(wingPath, { encoding: 'utf-8' });
        if (rR && (await isJSON(rR))) {
            availCons('rwdWIFINGData', 'WIFING Data File [READ] - OK');
            return Promise.resolve({ r: true, d: JSON.parse(rR) });
        }
        else {
            return Promise.resolve({ r: false, d: 'ERROR: JSON Parse Failed' });
        }
    }
    catch (e) {
        console.log(e);
        return Promise.resolve({ r: false, d: e });
    } };
    const wData = async (wD) => { const ytStr = JSON.stringify(wD); try {
        await (0, promises_1.writeFile)(wingPath, ytStr, { encoding: 'utf-8' });
        availCons('rwdWIFINGData', 'WIFING Data File [WRITE] - OK');
        return Promise.resolve(true);
    }
    catch (e) {
        console.log(e);
        return Promise.resolve(false);
    } };
    const dData = async () => { if ((await exists(wingPath))) {
        try {
            await (0, promises_1.unlink)(wingPath);
            availCons('rwdWIFINGData', 'YTDL Data File [DELETE] - OK');
            return Promise.resolve(true);
        }
        catch (e) {
            console.log(e);
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(true);
    } };
    if (action === 'r') {
        return Promise.resolve((await rData()));
    }
    else if (action === 'w') {
        return Promise.resolve({ r: (await wData(data)) });
    }
    else {
        return Promise.resolve({ r: (await dData()) });
    }
    ;
}
;
//-------------------------------------------------
electron_1.ipcMain.handle('writeWIFINGData', async (e, args) => {
    const wRes = await rwdWIFINGData('w', args[0]);
    if (wRes.r) {
        wingData = args[0];
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
    ;
});
//-------------------------------------------------
electron_1.ipcMain.handle('readWIFINGData', async (e, args) => {
    const wingPath = path.join(electron_1.app.getPath('documents'), 'wifiCUE/wcdata/wifing');
    if (wingData && typeof wingData === 'object' && !_.isEmpty(wingData)) {
        return Promise.resolve(wingData);
    }
    else {
        const dD = appTypes_1.defWifingSaveData;
        if (!(await exists(wingPath))) {
            await rwdWIFINGData('w', dD);
            wingData = dD;
            return Promise.resolve(dD);
        }
        else {
            const { r, d } = await rwdWIFINGData('r');
            if (r && d) {
                wingData = d;
                return Promise.resolve(d);
            }
            else {
                await rwdWIFINGData('w', dD);
                ytdlData = dD;
                return Promise.resolve(dD);
            }
        }
        ;
    }
    ;
});
//------------------------------------------------
// OUIDB
//------------------------------------------------
const newDBFP = path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\OUI\\ouidb.json');
const oldDBFP = path.normalize('C:\\Users\\owenl\\Documents\\KaliVM\\ngData\\OUI\\fallback\\ouidb.json');
let ouiDBData = null;
//------------------------------------------------
electron_1.ipcMain.handle('updateOUIDBStatus', async (e, args) => {
    let fetchDBStatusRes = await dlFreshOUIDB();
    if (fetchDBStatusRes !== 'none') {
        const readRes = await readOUIData(fetchDBStatusRes);
        if (!readRes) {
            fetchDBStatusRes = 'none';
        }
        ;
    }
    ;
    return Promise.resolve(fetchDBStatusRes);
});
//------------------------------------------------
async function readOUIData(status) {
    try {
        let rawJSONStr = '';
        if (status === 'new') {
            rawJSONStr = await fs.promises.readFile(newDBFP, { encoding: 'utf-8' });
        }
        else {
            rawJSONStr = await fs.promises.readFile(oldDBFP, { encoding: 'utf-8' });
        }
        ;
        if ((await isJSON(rawJSONStr))) {
            ouiDBData = JSON.parse(rawJSONStr);
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
    }
    catch (e) {
        e = e;
        return Promise.resolve(false);
    }
}
;
//------------------------------------------------
electron_1.ipcMain.handle('matchMAC2OUI', async (e, args) => {
    if (ouiDBData === null) {
        return Promise.resolve(false);
    }
    else {
        const missMacArr = args[0];
        let moPairs = {};
        for (let mi = 0; mi < missMacArr.length; mi++) {
            const f6Arr = missMacArr[mi].split(':'), f6Prefix = f6Arr[0] + f6Arr[1] + f6Arr[2];
            if (f6Prefix.length === 6) {
                const matchI = ouiDBData.findIndex((oO) => oO.prefix === f6Prefix);
                if (matchI !== -1) {
                    moPairs[missMacArr[mi]] = ouiDBData[matchI];
                }
                else {
                    moPairs[missMacArr[mi]] = null;
                }
            }
            else {
                moPairs[missMacArr[mi]] = null;
            }
        }
        ;
        return Promise.resolve(moPairs);
    }
});
//------------------------------------------------
async function statOUIDB() {
    const newDBExist = await exists(newDBFP);
    const newDBStat = await statSize(newDBFP);
    if (newDBExist && newDBStat.r && newDBStat.d > 0) {
        return Promise.resolve('new');
    }
    else {
        const oldDBExist = await exists(oldDBFP);
        const oldDBStat = await statSize(oldDBFP);
        if (oldDBExist && oldDBStat.r && oldDBStat.d > 0) {
            return Promise.resolve('old');
        }
        else {
            return Promise.resolve('none');
        }
    }
}
//------------------------------------------------
async function dlFreshOUIDB() {
    if ((await exists(newDBFP))) {
        try {
            await (0, promises_1.unlink)(newDBFP);
        }
        catch (e) {
            e = e;
        }
    }
    ;
    const dlDBChild = require('child_process').spawn;
    const dlDBRes = async () => {
        return new Promise(async (resolve) => {
            const mmIWProc = dlDBChild('powershell.exe', ['-Command', 'Invoke-WebRequest', '-Uri', 'https://raw.githubusercontent.com/jfisbein/ouidb-json/master/ouidb.json', '-OutFile', newDBFP]);
            mmIWProc.on('close', async (code) => {
                const checkDBFiles = await statOUIDB();
                resolve(checkDBFiles);
            });
        });
    };
    const updateDBFilesRes = await dlDBRes();
    return Promise.resolve(updateDBFilesRes);
}
//------------------------------------------------
// MonMode - airmon-ng
//------------------------------------------------
electron_1.ipcMain.handle('toggleMonMode', async (e, args) => {
    const doToggleRes = await toggleMonMode(args[0], args[1]);
    return Promise.resolve({ r: doToggleRes, d: monModes });
});
//------------------------------------------------
async function toggleMonMode(ss, iF) {
    const airmonChild = require('child_process').spawn;
    const mmIW = async () => {
        let mmIWParams = kaliPLinkBase.concat(kaliIWConfig), mmIWData = null;
        return new Promise(async (resolve) => {
            const mmIWProc = airmonChild('plink', mmIWParams, { encoding: 'utf8' });
            mmIWProc.stdout.on('data', (stdoutData) => { if (stdoutData) {
                mmIWData += stdoutData.toString();
            } });
            mmIWProc.stderr.on('data', (stderrData) => { stderrData = stderrData; resolve(false); });
            mmIWProc.on('close', (code) => {
                if (String(code) !== '0') {
                    resolve(false);
                }
                else {
                    if (mmIWData !== null && mmIWData && mmIWData.length > 0) {
                        let iwLines = mmIWData.split('\n');
                        const wlan0ModeLineIndex = iwLines.findIndex((l) => l.includes('wlan0') && l.includes('Mode:'));
                        const wlan1ModeLineIndex = iwLines.findIndex((l) => l.includes('wlan1') && l.includes('Mode:'));
                        if (wlan0ModeLineIndex === -1 || wlan1ModeLineIndex === -1) {
                            resolve(false);
                        }
                        else {
                            const wlan0Mode = iwLines[wlan0ModeLineIndex].trim().split('Mode:')[1].split('Access Point')[0].trim().toLowerCase();
                            const wlan1Mode = iwLines[wlan1ModeLineIndex].trim().split('Mode:')[1].split('Access Point')[0].trim().toLowerCase();
                            if ((wlan0Mode === 'managed' || wlan0Mode === 'monitor') && wlan1Mode === 'managed' || wlan1Mode === 'monitor') {
                                resolve({ wlan0: (wlan0Mode === 'managed' ? false : true), wlan1: (wlan1Mode === 'managed' ? false : true) });
                            }
                            else {
                                resolve(false);
                            }
                        }
                        ;
                    }
                    else {
                        resolve(false);
                    }
                    ;
                }
                ;
            });
        });
    };
    //-------------
    const mmStart = async (interF) => {
        let thisIFStartMM = kaliAirmonStartMM;
        thisIFStartMM.push(interF);
        let mmStartParams = kaliPLinkBase.concat(thisIFStartMM), mmStartData = null;
        return new Promise(async (resolve) => {
            const mmStartProc = airmonChild('plink', mmStartParams, { encoding: 'utf8' });
            mmStartProc.stdout.on('data', (stdoutData) => { if (stdoutData) {
                mmStartData += stdoutData.toString();
            } });
            mmStartProc.stderr.on('data', (stderrData) => { stderrData = stderrData; resolve(false); });
            mmStartProc.on('close', (code) => {
                if (String(code) !== '0') {
                    resolve(false);
                }
                else {
                    if (mmStartData !== null && mmStartData && mmStartData.length > 0) {
                        let sLines = mmStartData.split('\n');
                        const enabledLinesArr = sLines.filter((l) => l.includes('monitor mode already enabled') || l.includes('monitor mode enabled'));
                        if (enabledLinesArr.length < 1) {
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    }
                    else {
                        resolve(false);
                    }
                    ;
                }
            });
        });
    };
    //------------
    const mmStop = async (interF) => {
        let thisIFStopMM = kaliAirmonStopMM;
        thisIFStopMM.push(interF);
        let mmStopParams = kaliPLinkBase.concat(thisIFStopMM), mmStopData = null;
        return new Promise(async (resolve) => {
            const mmStopProc = airmonChild('plink', mmStopParams, { encoding: 'utf8' });
            mmStopProc.stdout.on('data', (stdoutData) => { if (stdoutData) {
                mmStopData += stdoutData.toString();
            } });
            mmStopProc.stderr.on('data', (stderrData) => { stderrData = stderrData; resolve(false); });
            mmStopProc.on('close', (code) => {
                if (String(code) !== '0') {
                    resolve(false);
                }
                else {
                    if (mmStopData !== null && mmStopData && mmStopData.length > 0) {
                        let sLines = mmStopData.split('\n');
                        const disabledLinesArr = sLines.filter((l) => l.includes('monitor mode disabled'));
                        if (disabledLinesArr.length < 1) {
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    }
                    else {
                        resolve(false);
                    }
                    ;
                }
            });
        });
    };
    //-----------
    if (ss === 'start') {
        if (iF === 'all' && Object.values(monModes).every((mmV) => mmV === true)) {
            return Promise.resolve(true);
        }
        ;
        if (monModes[iF] === true) {
            return Promise.resolve(true);
        }
        ;
        const iwModesRes = await mmIW();
        let doStartIFArr = [];
        if (iwModesRes === false) {
            if (iF === 'all') {
                doStartIFArr = Object.keys(monModes);
            }
            else {
                doStartIFArr.push(iF);
            }
        }
        else {
            monModes = iwModesRes;
            if (iF === 'all') {
                if (iwModesRes.wlan0 === true && iwModesRes.wlan1 === true) {
                    return Promise.resolve(true);
                }
                else {
                    for (const [k, v] of Object.entries(iwModesRes)) {
                        if (!v) {
                            doStartIFArr.push(k);
                        }
                    }
                }
            }
            else {
                if (iwModesRes[iF] === true) {
                    return Promise.resolve(true);
                }
                else {
                    doStartIFArr.push(iF);
                }
            }
            ;
        }
        ;
        let ttlMMReqs = doStartIFArr.length, goodMMReqs = 0;
        for (let sifi = 0; sifi < doStartIFArr.length; sifi++) {
            const thisMMReqRes = await mmStart(doStartIFArr[sifi]);
            monModes[doStartIFArr[sifi]] = thisMMReqRes;
            if (thisMMReqRes) {
                goodMMReqs++;
            }
        }
        ;
        if (ttlMMReqs === goodMMReqs) {
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    else if (ss === 'stop') {
        if (iF === 'all' && Object.values(monModes).every((mmV) => mmV === false)) {
            return Promise.resolve(true);
        }
        ;
        if (monModes[iF] === false) {
            return Promise.resolve(true);
        }
        ;
        const iwModesRes = await mmIW();
        let doStopIFArr = [];
        if (iwModesRes === false) {
            if (iF === 'all') {
                doStopIFArr = Object.keys(monModes);
            }
            else {
                doStopIFArr.push(iF);
            }
        }
        else {
            monModes = iwModesRes;
            if (iF === 'all') {
                if (iwModesRes.wlan0 === false && iwModesRes.wlan1 === false) {
                    return Promise.resolve(true);
                }
                else {
                    for (const [k, v] of Object.entries(iwModesRes)) {
                        if (v) {
                            doStopIFArr.push(k);
                        }
                    }
                }
            }
            else {
                if (iwModesRes[iF] === true) {
                    return Promise.resolve(true);
                }
                else {
                    doStopIFArr.push(iF);
                }
            }
            ;
        }
        ;
        let ttlMMReqs = doStopIFArr.length, goodMMReqs = 0;
        for (let sifi = 0; sifi < doStopIFArr.length; sifi++) {
            const thisMMReqRes = await mmStop(doStopIFArr[sifi]);
            monModes[doStopIFArr[sifi]] = thisMMReqRes;
            if (thisMMReqRes) {
                goodMMReqs++;
            }
        }
        ;
        if (ttlMMReqs === goodMMReqs) {
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
    }
    else {
        return Promise.resolve(false);
    }
}
;
//------------------------------------------------
// DumpMode - airodump-ng
//------------------------------------------------
electron_1.ipcMain.handle('toggleDumpNGPaused', (e, args) => {
    dumpIsPaused = args[0];
    return Promise.resolve(dumpIsPaused);
});
//------------------------------------------------
electron_1.ipcMain.on('toggleDumpNG', async (e, args) => { startStopDumpNG(args[0]); });
//------------------------------------------------
async function readDumpCSV() {
    if (!(await exists(dumpCSVFPath))) {
        return Promise.resolve(false);
    }
    ;
    try {
        const readRes = await fs.promises.readFile(dumpCSVFPath, { encoding: 'utf-8' });
        if (readRes && readRes.trim().length > 0) {
            return Promise.resolve(readRes);
        }
        else {
            return Promise.resolve(false);
        }
        ;
    }
    catch (e) {
        return Promise.resolve(false);
    }
}
//------------------------------------------------
async function processDumpCSV(rawData) {
    const fTyp = { isDate: ['first', 'last'], isString: ['mac', 'priv', 'ciph', 'auth', 'ip', 'id'], isNumber: ['chan', 'spd', 'tx', 'bcs', 'data', 'idLen'] };
    const macRX = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    const swMAC = (l) => { return (macRX.test(l.split(',')[0])); };
    const str2D = (s, f) => { try {
        return (0, date_fns_1.parse)(s, f, new Date());
    }
    catch (e) {
        return new Date();
    } };
    let allDevsObj = { justRouters: [], clientRouters: [], allClients: [], assClients: [], unassClients: [] };
    let apDevObj = { mac: '', first: new Date(), last: new Date(), chan: 0, spd: 0, priv: '', ciph: '', auth: '', tx: 0, bcs: 0, data: 0, ip: '', idLen: 0, id: '', clients: [] };
    let clDevObj = { mac: '', first: new Date(), last: new Date(), tx: 0, data: 0, apMac: '', probeIDs: [] };
    // Raw Arrs ------------
    const apclArr = rawData.split('Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs');
    const apLsArr = apclArr[0].split('\n').filter((l) => l.trim().length > 0 && (swMAC(l)));
    const clLsArr = apclArr[1].split('\n').filter((l) => l.trim().length > 0 && (swMAC(l)));
    // Routers ------------
    let newJustRouters = [];
    for (let api = 0; api < apLsArr.length; api++) {
        const apDLArr = apLsArr[api].split(', ');
        let apDObj = {}, fI = 0;
        for (const k of Object.keys(apDevObj)) {
            if (fTyp.isDate.includes(k)) {
                apDLArr[fI] && typeof apDLArr[fI] === 'string' && apDLArr[fI].trim().length > 0 ? apDObj[k] = (str2D(apDLArr[fI].trim().split(' ')[1], 'hh:mm:ss')) : apDObj[k] = new Date();
            }
            else if (fTyp.isString.includes(k)) {
                apDLArr[fI] && typeof apDLArr[fI] === 'string' && apDLArr[fI].trim().length > 0 ? apDObj[k] = String(apDLArr[fI].trim()) : apDObj[k] = '-';
                if (String(k) === 'ip') {
                    apDObj[k] = apDObj[k].replace(/\s/g, '');
                }
            }
            else if (fTyp.isNumber.includes(k)) {
                apDLArr[fI] && typeof apDLArr[fI] === 'string' && apDLArr[fI].trim().length > 0 ? apDObj[k] = Number(apDLArr[fI].trim()) : apDObj[k] = 0;
            }
            ;
            fI++;
        }
        ;
        apDObj['clients'] = [];
        newJustRouters.push(apDObj);
    }
    ;
    if (newJustRouters.length > 0) {
        const ordNJR = _.orderBy(newJustRouters, ['tx', 'bcs', 'data'], ['desc', 'desc', 'desc']);
        allDevsObj.justRouters = ordNJR;
        allDevsObj.clientRouters = ordNJR;
    }
    ;
    // Clients ------------
    let newAllClients = [];
    for (let cli = 0; cli < clLsArr.length; cli++) {
        const clDLArr = clLsArr[cli].split(', ');
        let clDObj = {}, fI = 0;
        for (const k of Object.keys(clDevObj)) {
            if (String(k) === 'apMac') {
                if (clDLArr[fI] && typeof clDLArr[fI] === 'string' && clDLArr[fI].trim().length > 0) {
                    if (clDLArr[fI].trim().startsWith('(not associated) ,')) {
                        clDObj.apMac = '-';
                        clDObj.probeIDs = clDLArr[fI].trim().replace('(not associated) ,', '').split(',').map((id) => id.trim()).filter((id) => id && id.length > 0);
                    }
                    else if (clDLArr[fI].trim().endsWith(',') && (macRX.test(clDLArr[fI].trim().replace(',', '')))) {
                        clDObj.apMac = clDLArr[fI].trim().replace(',', '');
                        clDObj.probeIDs = [];
                    }
                    else {
                        clDObj.apMac = '-';
                        clDObj.probeIDs = [];
                    }
                    ;
                }
                else {
                    clDObj.apMac = '-';
                    clDObj.probeIDs = [];
                }
                ;
            }
            else if (fTyp.isDate.includes(k)) {
                clDLArr[fI] && typeof clDLArr[fI] === 'string' && clDLArr[fI].trim().length > 0 ? clDObj[k] = (str2D(clDLArr[fI].trim().split(' ')[1], 'hh:mm:ss')) : clDObj[k] = new Date();
            }
            else if (fTyp.isString.includes(k)) {
                clDLArr[fI] && typeof clDLArr[fI] === 'string' && clDLArr[fI].trim().length > 0 ? clDObj[k] = String(clDLArr[fI].trim()) : clDObj[k] = '-';
            }
            else if (fTyp.isNumber.includes(k)) {
                clDLArr[fI] && typeof clDLArr[fI] === 'string' && clDLArr[fI].trim().length > 0 ? clDObj[k] = Number(clDLArr[fI].trim()) : clDObj[k] = 0;
            }
            ;
            fI++;
        }
        ;
        newAllClients.push(clDObj);
    }
    ;
    if (newAllClients.length > 0) {
        const ordNAC = _.orderBy(newAllClients, ['tx', 'data', 'probeIDs'], ['desc', 'desc', 'desc']);
        allDevsObj.allClients = ordNAC;
        allDevsObj.assClients = ordNAC.filter((clO) => (macRX.test(clO.apMac)));
        allDevsObj.unassClients = ordNAC.filter((clO) => clO.apMac === '-');
    }
    ;
    // Combine Rs+Cls ------------
    for (let assci = 0; assci < allDevsObj.assClients.length; assci++) {
        if ((macRX.test(allDevsObj.assClients[assci].apMac))) {
            const cmatchMac = allDevsObj.assClients[assci].apMac;
            for (let cri = 0; cri < allDevsObj.clientRouters.length; cri++) {
                if (allDevsObj.clientRouters[cri].mac === cmatchMac) {
                    const existI = allDevsObj.clientRouters[cri].clients.findIndex((cO) => cO.mac === allDevsObj.assClients[assci].mac);
                    if (existI === -1) {
                        allDevsObj.clientRouters[cri].clients.push(allDevsObj.assClients[assci]);
                    }
                    ;
                }
            }
        }
    }
    ;
    //-------------------------
    return Promise.resolve(allDevsObj);
    //-------------------------
}
//------------------------------------------------
async function startStopDumpNG(startStop) {
    const mwIndex = await getMWBrwsr('wifing');
    const clearDump = async () => {
        if (dumpNGProcess.dumpINT !== null) {
            clearInterval(dumpNGProcess.dumpINT);
            dumpNGProcess.dumpINT = null;
        }
        ;
        if (dumpNGProcess.inprog) {
            dumpNGProcess.inprog = false;
        }
        ;
        if (mwIndex !== false && moreWins[mwIndex] && moreWins[mwIndex].webContents) {
            moreWins[mwIndex].webContents.send('wifingDumpNGInProg', [dumpNGProcess.inprog]);
        }
        ;
        if (dumpNGProcess.pid !== -1) {
            dumpNGProcess.pid = -1;
        }
        ;
        if (dumpNGProcess.prevDD) {
            dumpNGProcess.prevDD = null;
        }
        ;
        return Promise.resolve(true);
    };
    const doDump = async () => {
        if (mwIndex !== false && moreWins[mwIndex] && moreWins[mwIndex].webContents) {
            moreWins[mwIndex].webContents.send('wifingDumpTimer', ['start']);
        }
        ;
        if (dumpNGProcess.inprog) {
            if (!dumpIsPaused) {
                const readCSVRes = await readDumpCSV();
                if (readCSVRes !== false) {
                    if (dumpNGProcess.prevDD !== readCSVRes) {
                        dumpNGProcess.prevDD = readCSVRes;
                        const processCSVRes = await processDumpCSV(readCSVRes);
                        if (dumpNGProcess.inprog && dumpNGProcess.prevDD !== null && mwIndex !== false && moreWins[mwIndex] && moreWins[mwIndex].webContents) {
                            moreWins[mwIndex].webContents.send('wifingDumpNGData', [processCSVRes]);
                        }
                        ;
                    }
                }
                ;
            }
            ;
        }
        else {
            clearDump();
        }
        ;
        return Promise.resolve(true);
    };
    //------------
    if (startStop === 'start') {
        if (dumpNGProcess.inprog) {
            if (mwIndex !== false && moreWins[mwIndex] && moreWins[mwIndex].webContents) {
                moreWins[mwIndex].webContents.send('wifingDumpNGInProg', [dumpNGProcess.inprog]);
            }
            ;
            return;
        }
        else {
            if ((await exists(dumpCSVFPath))) {
                try {
                    await (0, promises_1.unlink)(dumpCSVFPath);
                }
                catch (e) {
                    e = e;
                }
            }
            ;
            let ssDumpParams = kaliPLinkBase.concat(kaliDumpStart);
            const dumpNGChild = require('child_process').spawn;
            dumpNGProcess.proc = dumpNGChild('plink', ssDumpParams, { encoding: 'utf8' });
            if (dumpNGProcess.proc && dumpNGProcess.proc.pid && typeof dumpNGProcess.proc.pid === 'number') {
                dumpNGProcess.proc.stderr.on('data', (stderrData) => { stderrData = stderrData; });
                dumpNGProcess.proc.on('close', (code, signal) => {
                    availCons('DumpNGLoop', 'ONCLOSE: Closed ' + (code ? '(code): ' + String(code) : ' ') + (signal ? '(signal): ' + String(signal) : ''));
                    clearDump();
                });
                dumpNGProcess.pid = dumpNGProcess.proc.pid;
                dumpNGProcess.inprog = true;
                if (mwIndex !== false && moreWins[mwIndex] && moreWins[mwIndex].webContents) {
                    moreWins[mwIndex].webContents.send('wifingDumpNGInProg', [dumpNGProcess.inprog]);
                }
                ;
                await doDump();
                dumpNGProcess.dumpINT = setInterval(async () => { await doDump(); }, 6000);
            }
            else {
                availCons('startStopDumpNG', 'ERROR: Failed to START Dump-ng');
                clearDump();
            }
        }
    }
    else {
        if (dumpNGProcess.proc) {
            try {
                dumpNGProcess.proc.kill('SIGHUP');
            }
            catch (e) {
                e = e;
            }
        }
        ;
        clearDump();
    }
    ;
}
////////////////////////////////////////////////////////////////
// MONGODB FNS
////////////////////////////////////////////////////////////////
let mdbIsInit = false;
let mdbClient = null;
let mdbDB = null;
let mdbC = null;
let mdbConnURL = 'mongodb://localhost:27017';
let mdbConnOpts = { monitorCommands: true, retryReads: true, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 10000, appName: 'wifiCUE', maxPoolSize: 200, maxConnecting: 20, minPoolSize: 20 };
let mdbDBName = 'ytCaps';
let mdbColName = 'caps';
let mdbListenOn = false;
let mdbMWIndex = -1;
let capsDocCount = -1;
////////////////////////////////////////////////////////////////
electron_1.ipcMain.handle('initMDB', async (e, args) => { const doInitRes = await initMDB(); return Promise.resolve(doInitRes); });
//--------------------------------------------------------------
async function initMDB() {
    availCons('initMDB', '()...');
    const awaitMWIndex = async () => { return new Promise(async (resolve) => { let checkICount = 0, checkIINT = setInterval(async () => { const mwIndex = await getMWBrwsr('ytdl'); if (mwIndex !== false) {
        clearInterval(checkIINT);
        mdbMWIndex = mwIndex;
        resolve(mwIndex);
    }
    else {
        if (checkICount < 20) {
            checkICount++;
        }
        else {
            availCons('initMDB', 'ERROR: Timeout Waiting for MWIndex');
            clearInterval(checkIINT);
            resolve(false);
        }
    } }, 250); }); };
    if (mdbIsInit && mdbClient !== null) {
        availCons('initMDB', 'MDB Already Init - Skipped');
        return Promise.resolve(capsDocCount);
    }
    ;
    if (!mdbIsInit && mdbClient !== null) {
        mdbIsInit = true;
        availCons('initMDB', 'MDB Already Init - Skipped');
        return Promise.resolve(capsDocCount);
    }
    ;
    if (mdbClient === null) {
        mdbClient = new mdb.MongoClient(mdbConnURL, mdbConnOpts);
    }
    ;
    try {
        await awaitMWIndex();
        if (!mdbListenOn) {
            await addRemoveMDBListeners('add');
        }
        ;
        await mdbClient.connect();
        mdbDB = mdbClient.db(mdbDBName), mdbC = mdbDB.collection(mdbColName), mdbIsInit = true;
        if (capsDocCount === -1) {
            capsDocCount = await mdbC.countDocuments({}, { hint: '_id_' });
        }
        ;
        return Promise.resolve(capsDocCount);
    }
    catch (e) {
        availCons('initMDB', 'ERROR: Connection/Db/Collection: FAILED');
        mdbClient = null;
        mdbDB = null;
        mdbC = null, mdbIsInit = false;
        if (mdbListenOn) {
            await addRemoveMDBListeners('remove');
        }
        ;
        return Promise.resolve(false);
    }
    ;
}
;
////////////////////////////////////////////////////////////////
electron_1.ipcMain.handle('addRemoveMDBListeners', async (e, args) => { const aRRes = await addRemoveMDBListeners(args[0]); return Promise.resolve(aRRes); });
//--------------------------------------------------------------
async function addRemoveMDBListeners(addRemoveOnce) {
    availCons('addRemoveMDBListeners', '(' + addRemoveOnce + ')...');
    if (mdbMWIndex < 0) {
        await getMWBrwsr('ytdl');
    }
    ;
    const doEvCons = async (t, e) => { moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent', [t, e]); };
    const cTS = ['Started', 'Succeeded', 'Failed'];
    if (addRemoveOnce === 'add') {
        for (let ctsi = 0; ctsi < cTS.length; ctsi++) {
            mdbClient.on('command' + cTS[ctsi], async (e) => { doEvCons(cTS[ctsi].toLowerCase(), e); });
        }
        ;
        mdbListenOn = true;
    }
    else if (addRemoveOnce === 'once') {
        for (let ctsi = 0; ctsi < cTS.length; ctsi++) {
            mdbClient.once('command' + cTS[ctsi], async (e) => { doEvCons(cTS[ctsi].toLowerCase(), e); });
        }
    }
    else {
        mdbClient.removeAllListeners();
        mdbListenOn = false;
    }
    ;
    return Promise.resolve(true);
}
////////////////////////////////////////////////////////////////
electron_1.ipcMain.handle('doMDBQuery', async (e, args) => {
    const dMDBQRes = await doMDBQuery(args[0], (args[1] ? args[1] : null));
    return Promise.resolve(dMDBQRes);
});
//--------------------------------------------------------------
async function doMDBQuery(qType, qParams) {
    availCons('doMDBQuery', '(' + qType + ',dataObj|null)...');
    if (!mdbIsInit) {
        await initMDB();
        if (!mdbIsInit) {
            availCons('IPCMAIN|doMDBQuery', 'ERROR: mdbIsInit===FALSE!');
            return Promise.resolve({ r: false, d: 'MDB Not Initialized' });
        }
    }
    ;
    let qResult = { r: false, d: null };
    switch (qType) {
        case 'ping':
            if (mdbDB) {
                const pingRes = await mdbDB.command(qParams);
                if (pingRes.hasOwnProperty('ok')) {
                    qResult = { r: true, d: pingRes.ok };
                }
                else {
                    qResult = { r: false, d: 'Unknown Error' };
                }
            }
            else {
                availCons('IPCMAIN|doMDBQuery', 'ERROR: NULL mdbDB Object');
                qResult = { r: false, d: 'NULL mdbDB Object' };
            }
            ;
            break;
        case 'ftsExact':
            if (typeof qParams !== 'string') {
                qResult = { r: false, d: 'typeof Param!==string' };
            }
            else {
                if (!mdbC) {
                    availCons('IPCMAIN|doMDBQuery', 'ERROR: NULL mdbC Object');
                    qResult = { r: false, d: 'NULL mdbC Object' };
                }
                else {
                    if (mdbListenOn) {
                        await addRemoveMDBListeners('remove');
                    }
                    ;
                    moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent', ['started', { requestId: 0, commandName: 'ftsExact' }]);
                    //------------
                    let exactMatchDocsArr = [];
                    const runFTS = async () => {
                        try {
                            const ftsExactQuery = { $text: { $search: `"` + qParams + `"` } };
                            const ftsExactProj = { _id: 0, caps_data: 0 };
                            const ftsExactCursor = mdbC.find(ftsExactQuery, { projection: ftsExactProj, batchSize: 1 });
                            for await (const doc of ftsExactCursor) {
                                exactMatchDocsArr.push(doc);
                                moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent', [doc]);
                            }
                            ;
                            ftsExactCursor.close();
                            moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent', ['succeeded', { requestId: 0, commandName: 'ftsExact' }]);
                            return Promise.resolve(exactMatchDocsArr);
                        }
                        catch (e) {
                            e = e;
                            moreWins[mdbMWIndex].webContents.send('mdbCMDMonEvent', ['failed', { requestId: 0, commandName: 'ftsExact' }]);
                            return Promise.resolve(exactMatchDocsArr);
                        }
                    };
                    //------------
                    const ftsRes = await runFTS();
                    if (!ftsRes) {
                        qResult.d = 'Unknown DB/Query Error';
                    }
                    else {
                        qResult = { r: true, d: ftsRes };
                    }
                    ;
                    if (!mdbListenOn) {
                        await addRemoveMDBListeners('add');
                    }
                    ;
                }
                ;
            }
            ;
            break;
        default:
            availCons('IPCMAIN|doMDBQuery', 'ERROR: UNKNOWN queryType (' + qType + ')');
            qResult = { r: false, d: 'Unknown queryType' };
            break;
    }
    ;
    return Promise.resolve(qResult);
}
;
//////////////////////////////////////////////////
// TEST FUNCTION
//////////////////////////////////////////////////
electron_1.ipcMain.handle('sendTest', async (e, args) => {
    availCons('sendTest', '()...');
});
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//# sourceMappingURL=main.js.map