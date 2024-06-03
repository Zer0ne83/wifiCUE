"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomST = exports.getWledNoteSegs = exports.twtAuthHTML = exports.getLang = exports.ytdlMDGetBaseSubURL = exports.baseMDSubsList = exports.defCamAudio = exports.kodiPLItemAllFields = exports.defDebI = exports.defPDSI = exports.defRPII = exports.defTwtChatStates = exports.defWCData = exports.getCUESessionStatus = exports.getCUEErrorStatus = exports.CUESS2Status = exports.defSIInfo = exports.SSD2VerStr = exports.wifingMyMacs = exports.defWifingSaveData = void 0;
const _ = require("lodash");
exports.defWifingSaveData = {
    routers: {
        fnBtns: {
            unknownOnly: { active: true, param: null },
            recentOnly: { active: false, param: 1 },
            activeOnly: { active: false, param: 10 },
            clientsOnly: { active: false, param: 1 },
            strongsigOnly: { active: false, param: -75 }
        },
        optBools: {
            sel2Top: false
        },
        vizTogs: { routers: 'max', clients: 'min' },
        selectedRouters: [],
        selectedClients: []
    },
    deauths: {},
    handshakes: {},
    cracks: {}
};
exports.wifingMyMacs = ['B0:95:75:D0:66:71', 'D8:BB:C1:DD:9B:9F', '00:0C:29:48:F0:29', 'B0:D3:9D:6E:93:72', '00:0C:29:36:6C:D8', 'DC:A6:32:02:F5:A3', '48:3F:DA:60:EA:AB', 'EC:FA:BC:75:2F:1D', 'C8:2B:96:23:20:BD', '50:02:91:D8:DE:03', 'DC:4F:22:42:DB:62', 'A0:20:A6:16:03:F7', 'BC:DD:C2:0C:2C:62', 'A4:4B:D5:C9:EB:60'];
//------------------------------------------------
const SSD2VerStr = (ds) => {
    let newVs = { clientVersion: '', serverVersion: '', serverHostVersion: '' };
    for (const [k, v] of Object.entries(ds)) {
        newVs[k] = String(v.major) + '.' + String(v.minor) + '.' + String(v.patch);
    }
    ;
    return newVs;
};
exports.SSD2VerStr = SSD2VerStr;
exports.defSIInfo = { dfSize: null, usb: null, netStats: null };
//------------------------------------------------
function CUESS2Status(sdkStatus, sSEvent) {
    let newStatus = sdkStatus;
    if (sSEvent.hasOwnProperty('error') && !_.isEmpty(sSEvent.error) && Number(sSEvent) !== sdkStatus.error.code) {
        newStatus.error = getCUESessionStatus(Number(sSEvent.error));
    }
    ;
    if (sSEvent.hasOwnProperty('data') && !_.isEmpty(sSEvent.data)) {
        if (sSEvent.data.hasOwnProperty('details') && !_.isEmpty(sSEvent.data.details)) {
            const nD = (0, exports.SSD2VerStr)(sSEvent.data.details);
            if (!_.isEqual(nD, sdkStatus.versions)) {
                newStatus.versions = nD;
            }
        }
        ;
        if (sSEvent.data.hasOwnProperty('state') && sSEvent.data.state !== sdkStatus.session.code) {
            newStatus.session = getCUESessionStatus(Number(sSEvent.data.state));
        }
        ;
    }
    ;
    return Promise.resolve(newStatus);
}
exports.CUESS2Status = CUESS2Status;
function getCUEErrorStatus(e) {
    const eCodes = {
        69: { code: 69, str: 'NIL_Response', msg: 'ERROR: SDK is Dead' },
        0: { code: 0, str: 'CE_Success', msg: 'No Errors' },
        1: { code: 1, str: 'CE_NotConnected', msg: 'ERROR: Not Connected' },
        2: { code: 2, str: 'CE_NoControl', msg: 'ERROR: No Control' },
        3: { code: 3, str: 'CE_IncompatibleProtocol', msg: 'ERROR: Bad Protocol' },
        4: { code: 4, str: 'CE_InvalidArguments', msg: 'ERROR: Bad Args/Params' },
        5: { code: 5, str: 'CE_InvalidOperation', msg: 'ERROR: Bad Operation' },
        6: { code: 6, str: 'CE_DeviceNotFound', msg: 'ERROR: Device Not Found' },
        7: { code: 7, str: 'CE_NotAllowed', msg: 'ERROR: Not Allowed' }
    };
    if (eCodes.hasOwnProperty(e)) {
        return eCodes[e];
    }
    else {
        return eCodes[69];
    }
    ;
}
exports.getCUEErrorStatus = getCUEErrorStatus;
;
function getCUESessionStatus(c) {
    const sSCodes = {
        0: { code: 0, str: 'CSS_Invalid', msg: 'No Status' },
        1: { code: 1, str: 'CSS_Closed', msg: 'Disconnected' },
        2: { code: 2, str: 'CSS_Connecting', msg: 'Connecting' },
        3: { code: 3, str: 'CSS_Timeout', msg: 'Timeout' },
        4: { code: 4, str: 'CSS_ConnectionRefused', msg: 'Refused' },
        5: { code: 5, str: 'CSS_ConnectionLost', msg: 'Lost' },
        6: { code: 6, str: 'CSS_Connected', msg: 'Connected' }
    };
    if (sSCodes.hasOwnProperty(c)) {
        return sSCodes[c];
    }
    else {
        return sSCodes[0];
    }
    ;
}
exports.getCUESessionStatus = getCUESessionStatus;
;
//------------------------------------------------
exports.defWCData = {
    syncStates: { audioSync: false, sshotSync: false },
    isListen: true,
    isSleep: false,
    tree: [],
    treeStates: {},
    lastColor: { r: 255, g: 255, b: 255, a: 255 },
    wledBrightness: [204, 204, 204, 204, 204],
    settings: {
        controlRequests: { autoResponder: { isOn: true, response: 'grant' }, timeout: 10 },
        timedFunctions: { recurringChime: { isOn: true, interval: 15 }, autoSleepWake: { isOn: true, sleep: '10:00PM', wake: '8:00AM' } },
        syncAnimations: { audioSyncTime: 5, sshotSyncTime: 5 }
    },
    wcWinSizePos: { display: { width: 0, height: 0 }, x: 0, y: 0, width: 300, height: 700, snaps: { top: false, right: true, bottom: true, left: false } },
    childWinSizePos: { display: { width: 0, height: 0 }, x: 0, y: 0, width: 300, height: 542, snaps: { top: false, right: true, bottom: false, left: false } },
    moreWins: [],
    twtSaveData: { toggles: { bpmLoopOn: true, bpmReqOn: false, tuneReqOn: true, welcomeOn: false, tySubOn: false, tyBitsOn: false, rahRahOn: true, greetOn: false }, data: { didGreet: [], lastTrigger: null, sessionTriggers: [] } },
    pirStates: { power: true, sound: true },
    lastUpdate: 0
};
function defTwtChatStates(c) {
    return { channel: c, room: { emoteonly: false, followersonly: false, subsonly: false }, me: { bits: 0, mod: false, sub: false }, users: [] };
}
exports.defTwtChatStates = defTwtChatStates;
exports.defRPII = {
    cpu: { l: 'pl', v: -100, s: '-', fx: '%' },
    ram: { l: 'rm', v: -100, s: '-/-', fx: '%' },
    disk: { l: 'df', v: -100, s: '-/-', fx: '%' },
    temp: { l: 'tm', v: -100, s: '-', fx: '°C' },
    txp: { l: 'tx', v: -100, s: '-', fx: 'dBm' }
};
exports.defPDSI = { name: '-', make: '-', model: '-', os: '-', power: { charging: false, level: { perc: 0, str: '-' } }, wifi: { ssid: '-', tx: 0 }, cpu: { perc: 0, str: '-' }, mem: { perc: 0, str: '-' }, disk: { perc: 0, str: '-' } };
exports.defDebI = {
    cpu: { l: 'pl', v: -100, s: '-', fx: '%' },
    ram: { l: 'rm', v: -100, s: '-/-', fx: '%' },
    disk: { l: 'df', v: -100, s: '-/-', fx: '%' }
};
exports.kodiPLItemAllFields = ['title', 'artist', 'albumartist', 'genre', 'year', 'rating', 'album', 'track', 'duration', 'comment', 'lyrics', 'musicbrainztrackid', 'musicbrainzartistid', 'musicbrainzalbumid', 'musicbrainzalbumartistid', 'playcount', 'fanart', 'director', 'trailer', 'tagline', 'plot', 'plotoutline', 'originaltitle', 'lastplayed', 'writer', 'studio', 'mpaa', 'cast', 'country', 'imdbnumber', 'premiered', 'productioncode', 'runtime', 'set', 'showlink', 'streamdetails', 'top250', 'votes', 'firstaired', 'season', 'episode', 'showtitle', 'thumbnail', 'file', 'resume', 'artistid', 'albumid', 'tvshowid', 'setid', 'watchedepisodes', 'disc', 'tag', 'art', 'genreid', 'displayartist', 'albumartistid', 'description', 'theme', 'mood', 'style', 'albumlabel', 'sorttitle', 'episodeguide', 'uniqueid', 'dateadded', 'channel', 'channeltype', 'hidden', 'locked', 'channelnumber', 'subchannelnumber', 'starttime', 'endtime', 'specialsortseason', 'specialsortepisode', 'compilation', 'releasetype', 'albumreleasetype', 'contributors', 'displaycomposer', 'displayconductor', 'displayorchestra', 'displaylyricist', 'userrating', 'sortartist', 'musicbrainzreleasegroupid', 'mediapath', 'dynpath', 'isboxset', 'totaldiscs', 'disctitle', 'releasedate', 'originaldate', 'bpm', 'bitrate', 'samplerate', 'channels', 'albumstatus', 'datemodified', 'datenew', 'customproperties', 'albumduration'];
exports.defCamAudio = {
    dca: {
        l: { path: 'assets/dca-l.mp3', audio: null, playing: false },
        k: { path: 'assets/dca-k.mp3', audio: null, playing: false },
        t: { path: 'assets/dca-t.mp3', audio: null, playing: false },
        b: { path: 'assets/dca-b.mp3', audio: null, playing: false }
    },
    dcop: {
        c: { path: 'assets/dcop-c.mp3', audio: null, playing: false },
        p: { path: 'assets/dcop-p.mp3', audio: null, playing: false },
        u: { path: 'assets/dcop-u.mp3', audio: null, playing: false }
    }
};
exports.baseMDSubsList = [
    { id: 'UC-2YHgc363EdcusLIBbgxzg', title: 'JoeScott' },
    { id: 'UC-7nELDbJEPF3muAzSeT74g', title: 'Disrupt' },
    { id: 'UC-NFpbEfXicJ-Y8ZNVukLFQ', title: 'EchoRose' },
    { id: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', title: 'PewDiePie' },
    { id: 'UC0PXqiud6dbwOAk8RvslgpQ', title: '1320video' },
    { id: 'UC0QdW-H7_l0zh_CoNhlwoBw', title: 'ParallaxNick' },
    { id: 'UC0e3QhIYukixgh5VVpKHH9Q', title: 'CodeBullet' },
    { id: 'UC0v-tlzsn0QZwJnkiaUSJVQ', title: 'REACT' },
    { id: 'UC0w0uBbJJr4KJMq-hTk4hoA', title: 'Skellytn' },
    { id: 'UC0woBco6Dgcxt0h8SwyyOmw', title: 'Megaprojects' },
    { id: 'UC11j-ApkeIcxSTFtBYBMq3g', title: 'lara6683' },
    { id: 'UC1Gx91y2m8hLFurXVYzVxsA', title: 'TheCatOfWar' },
    { id: 'UC1IocYhHcmBkdvOKbncLb0w', title: 'PeterBuka' },
    { id: 'UC1pACXxUjIWNDuU-kY1OX0Q', title: 'Kosmo' },
    { id: 'UC2-i3KuYoODXsM99Z3-Gm0A', title: 'friendlyjordies' },
    { id: 'UC29ju8bIPH5as8OGnQzwJyA', title: 'TraversyMedia' },
    { id: 'UC2Bz8MkHXZgCdi6voGQ0v0Q', title: 'BeyondEvil' },
    { id: 'UC2IYWWifoIht9T47z1Z5lJw', title: 'DeadMeat' },
    { id: 'UC2t-COfa9R0rFsoLdEMr5FA', title: 'DarkFootage' },
    { id: 'UC3-SAhrk6C9AF4Klf3d_vkw', title: 'Nickxar' },
    { id: 'UC3Wn3dABlgESm8Bzn8Vamgg', title: 'Sideprojects' },
    { id: 'UC3adc3KUUT88oEk11Fg5FFA', title: 'BrandonCraft' },
    { id: 'UC3cpN6gcJQqcCM6mxRUo_dA', title: 'Wendigoon' },
    { id: 'UC3jdnIP2u5hCJpVZ-TuDrCg', title: 'Whang!' },
    { id: 'UC3s0BtrBJpwNDaflRSoiieQ', title: 'Hak5' },
    { id: 'UC43NNGKNN6I3KqT963L6o6Q', title: 'thisisMONSTERS' },
    { id: 'UC4JZc3JBkKzvSKk_r8Xk2pQ', title: 'Bazoobi' },
    { id: 'UC4vT3qTr8fwVS7IsPgqaGCQ', title: 'TylerWard' },
    { id: 'UC58IKuPHnZkdCZ6T5mSRGCg', title: 'NightMind' },
    { id: 'UC59ZRYCHev_IqjUhremZ8Tg', title: 'HarryMack' },
    { id: 'UC5G1ThclVYLp2YFQUodTNnA', title: 'Timbah.On.Toast' },
    { id: 'UC5HXHBQGn_LCMvDImau2vYw', title: 'VEELA' },
    { id: 'UC5NBhV8O5WzFeehb1tnN9Vw', title: 'TrevorTrolls' },
    { id: 'UC5nc_ZtjKW1htCVZVRxlQAQ', title: 'MrSuicideSheep' },
    { id: 'UC64UiPJwM_e9AqAd7RiD7JA', title: 'TodayIFoundOut' },
    { id: 'UC6nSFpj9HTCZ5t-N3Rm3-HA', title: 'Vsauce' },
    { id: 'UC7GMT3ohvYEAJFDenzj9EMQ', title: 'MickMake' },
    { id: 'UC7GVv-K0ChSJ127dfe3TCAQ', title: 'Bassment' },
    { id: 'UC7_gcs09iThXybpVgjHZ_7g', title: 'PBSSpaceTime' },
    { id: 'UC7dHBh9QmYF1L0TOeGIzZgw', title: 'LazyMasquerade' },
    { id: 'UC8Q7XEy86Q7T-3kNpNjYgwA', title: 'IncognitoMode' },
    { id: 'UC8X4WT5_lUXqMjeN8bGFk9w', title: 'KanePixels' },
    { id: 'UC8XjmAEDVZSCQjI150cb4QA', title: 'KnowingBetter' },
    { id: 'UC8butISFwT-Wl7EV0hUK0BQ', title: 'freeCodeCamp.org' },
    { id: 'UC95SKPAm1NVZV077Jkpqpog', title: 'caitlinbethany98' },
    { id: 'UC9BMWLruGWsr1nTzFqmMfHw', title: 'TheMemeSheep' },
    { id: 'UC9PIn6-XuRKZ5HmYeu46AIw', title: 'BarelySociable' },
    { id: 'UC9VX0KXNH20x9MCH3xGjisg', title: 'DOPEorNOPE' },
    { id: 'UC9gFih9rw0zNCK3ZtoKQQyA', title: 'JennaMarbles' },
    { id: 'UCAxrWZL0yDWqWssCcq3xKhQ', title: 'GooseWayne' },
    { id: 'UCBJycsmduvYEL83R_U4JriQ', title: 'MarquesBrownlee' },
    { id: 'UCBNHHEoiSF8pcLgqLKVugOw', title: 'MarcusHouse' },
    { id: 'UCBobKKmkDPL_5Vr9-OxveZQ', title: 'ReacThing' },
    { id: 'UCC552Sd-3nyi_tk2BudLUzA', title: 'AsapSCIENCE' },
    { id: 'UCCsj3Uk-cuVQejdoX-Pc_Lg', title: 'MagicofRahat' },
    { id: 'UCCv0oaUB9Azt8vyUbdnWKEw', title: 'ElvisReviews' },
    { id: 'UCDKJdFer1phQI95UinPZehw', title: 'TurkeyTom' },
    { id: 'UCDT1meaKQ_D1HjhTGULNbew', title: 'StreamersReloaded' },
    { id: 'UCDlQwv99CovKafGvxyaiNDA', title: 'JonathanMorrison' },
    { id: 'UCEOXxzW2vU0P-0THehuIIeg', title: 'CaptainDisillusion' },
    { id: 'UCEsDd41iuXlWXfidji53qlA', title: 'diffr3nt' },
    { id: 'UCEszlI8-W79IsU8LSAiRbDg', title: 'JohnMichaelGodier' },
    { id: 'UCFKIgvMmcJtxTS9pdpCFwfg', title: 'CynicSnacks' },
    { id: 'UCFXad0mx4WxY1fXdbvtg0CQ', title: 'FascinatingHorror' },
    { id: 'UCG-qQe1mnh4JVKhuJkdh8KA', title: 'dreading(crimeandpsychology)' },
    { id: 'UCG39Z0fcVe_EVSeYy2Y5sIQ', title: 'Prism' },
    { id: 'UCGAY8t6KCq0tXyBFfjXeHZw', title: 'EdBassmaster' },
    { id: 'UCGHDQtN_vzFYJaq_Fx1eikg', title: 'Qxir' },
    { id: 'UCGHZpIpAWJQ-Jy_CeCdXhMA', title: 'CoolWorlds' },
    { id: 'UCGwruZaVBlp2AwbdUdNaLPQ', title: 'SteveKardynal' },
    { id: 'UCGwu0nbY2wSkW8N-cghnLpA', title: 'JaidenAnimations' },
    { id: 'UCH2_Jj8m4Zbe26UMlGG_LVA', title: 'KevinTalbot' },
    { id: 'UCHEf6T_gVq4tlW5i91ESiWg', title: 'PeopleVsFood' },
    { id: 'UCHKRfxkMTqiiv4pF99qGKIw', title: 'Geographics' },
    { id: 'UCHVvm5ZSNuUV5wVas0mhTLA', title: 'TheDisturbingTruth' },
    { id: 'UCHXJ0dhS3NpTBFg7lR_5w8Q', title: 'AlsoFitz' },
    { id: 'UCI0FFlhBubMmpESz0zAB7pQ', title: 'PSX666' },
    { id: 'UCIO080bapMP_jmlD781tGIA', title: 'webmastersuidesk' },
    { id: 'UCIZ5ZOeiXYbmKTl_85ghNPw', title: 'PhysicsExplained' },
    { id: 'UCIeYK5FLRnvZQbTjahERi5A', title: 'Andromedik' },
    { id: 'UCJ7eFTLJArvkgDBae1hbllw', title: 'OfficialAnonymousTV1' },
    { id: 'UCJdS6u5UWS2jiR5NKdC8gmg', title: 'Hunta' },
    { id: 'UCK85ttp6fAVE90DuuRI1jUA', title: 'DnBPortal' },
    { id: 'UCKGotXje-f5e4olh1vawwHQ', title: 'Talmon♪' },
    { id: 'UCKMgYyhm-_zuuGx0KQX-a1A', title: 'TimeIsButaWindow' },
    { id: 'UCKPLvnWhN1Qo51IDDZsmq1g', title: 'SparkFunElectronics' },
    { id: 'UCKQFFUBLNh0bCLY21ST8MWQ', title: 'maxmoefoetwo' },
    { id: 'UCKe5oaHwJG54MugJgc1uOdg', title: 'ScammerHotline' },
    { id: 'UCKhK5Ysw9DpHNNEVSAu0yIA', title: 'RyanIsDriving' },
    { id: 'UCKnBNM0_8P87KomLAAqVxNw', title: 'RobLandes' },
    { id: 'UCL3XrA4SheRl6y0NsRhGjRA', title: 'maxmoefoegames' },
    { id: 'UCL44k-cLrlsdr7PYuMU4yIw', title: 'ThatChapter' },
    { id: 'UCLHsZ4X7YemjxRrvq0AI4LA', title: 'LeonLush' },
    { id: 'UCLvOECEOTRMTGbKY7ucGjYw', title: 'REVDrum&Bass' },
    { id: 'UCM0V8r4kuIWIl6Sy-NHj2lg', title: 'QuintonReviews' },
    { id: 'UCMTk_R_Y49jvq-HQXDmKI0Q', title: 'TheRightOpinion' },
    { id: 'UCMZgonFYA2tdwSWP-G5SQVw', title: 'Sal' },
    { id: 'UCMiJRAwDNSNzuYeN2uWa0pA', title: 'Mrwhosetheboss' },
    { id: 'UCNLjdaXWdB7bx9Da4qZvcaA', title: 'DjCotts' },
    { id: 'UCNUu9E0ZZbf53NVkPjTk7sw', title: 'MistaGG' },
    { id: 'UCNXvmGafmrtJ7VPSqjRRbwg', title: 'ScaryInteresting' },
    { id: 'UCNYrK4tc5i1-eL8TXesH2pg', title: 'schmoyoho' },
    { id: 'UCNbo_wIXXSbeJC5VoauEeVg', title: 'TrueCrimeRecaps' },
    { id: 'UCO2x-p9gg9TLKneXlibGR7w', title: 'SnazzyLabs' },
    { id: 'UCOKHwx1VCdgnxwbjyb9Iu1g', title: 'BlenderGuru' },
    { id: 'UCOm_yyvOKRFtYbZYYdfokUw', title: 'NefariousTV' },
    { id: 'UCPDis9pjXuqyI7RYLJ-TTSA', title: 'FailArmy' },
    { id: 'UCPcFg7aBbaVzXoIKSNqwaww', title: 'jacksfilms' },
    { id: 'UCQ-hpFPF4nOKoKPEAZM_THw', title: 'TopTenz' },
    { id: 'UCQ4FyiI_1mWI2AtLS5ChdPQ', title: 'Boyinaband' },
    { id: 'UCQ7Gu28ETT3Wk4ZEt7Um6NQ', title: 'DavidThorne' },
    { id: 'UCQJ8D7gkhMCqP1qtusqmfgg', title: 'officialfranklin' },
    { id: 'UCR1D15p_vdP3HkrH8wgjQRw', title: 'InternetHistorian' },
    { id: 'UCR1IuLEqb6UEA_zQ81kwXfg', title: 'RealEngineering' },
    { id: 'UCRQebyNJm9YRyO5h0eWEVhw', title: 'Dark5' },
    { id: 'UCS5N071pemIOCaxN80szTRw', title: 'DJAphrodite' },
    { id: 'UCS8qaVCHrsVS4-EHwepihVg', title: 'IyulEverlong' },
    { id: 'UCSJbGtTlrDami-tDGPUV9-w', title: 'Academind' },
    { id: 'UCSOpcUkE-is7u7c4AkLgqTw', title: 'MrMobile[MichaelFisher]' },
    { id: 'UCSXm6c-n6lsjtyjvdD0bFVw', title: 'Liquicity' },
    { id: 'UCShHFwKyhcDo3g7hr4f1R8A', title: 'WorldScienceFestival' },
    { id: 'UCSpFnDQr88xCZ80N-X7t0nQ', title: 'CorridorCrew' },
    { id: 'UCT3v6vL2H5HK4loLMc8pmCw', title: 'VisualPolitikEN' },
    { id: 'UCTrtA2LyW7gie0o8hY4efXw', title: 'ImprovEverywhere' },
    { id: 'UCUVX1Hhc2f-aJhOPpxD4vvg', title: 'MrTechnicalDifficult' },
    { id: 'UCUexdPr9h6C_jTBMv95tw7Q', title: 'MissOctopus' },
    { id: 'UCV2jY6p6mZuC8bfLILJhOZw', title: 'LiveleakVideos' },
    { id: 'UCV9_KinVpV-snHe3C3n1hvA', title: 'shane' },
    { id: 'UCVTlvUkGslCV_h-nSAId8Sw', title: 'LearnCode.academy' },
    { id: 'UCVWifhNM3tx877Z7h3ovtRA', title: 'FoundFlix' },
    { id: 'UCVXKabRhXSQXh_U0au5JSzQ', title: 'EWUCrimeStorytime' },
    { id: 'UCVYamHliCI9rw1tHR1xbkfw', title: 'Dave2D' },
    { id: 'UCVtFOytbRpEvzLjvqGG5gxQ', title: 'KSI' },
    { id: 'UCVyRiMvfUNMA1UPlDPzG5Ow', title: 'DesignCourse' },
    { id: 'UCW5YeuERMmlnqo4oq8vwUpg', title: 'TheNetNinja' },
    { id: 'UCW6xlqxSY3gGur4PkGPEUeA', title: 'Seytonic' },
    { id: 'UCX3l3PzU1hIbsQKauQefh3g', title: 'ZiReviewsTech' },
    { id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', title: 'MrBeast' },
    { id: 'UCXBcDYUr89ImtOLYaHPiiPg', title: 'MarcusVeltri' },
    { id: 'UCXQg1vUmgxXPPTzHtaX9JUA', title: 'n0psa' },
    { id: 'UCXohF8w0OMZZmd2IIoO64qw', title: 'PaulGroseclose' },
    { id: 'UCXuqSBlHAE6Xw-yeJA0Tunw', title: 'LinusTechTips' },
    { id: 'UCXv-co3EYHF7aOH4A93qAHQ', title: 'LewLater' },
    { id: 'UCYK1TyKyMxyDQU8c6zF8ltg', title: 'FunnyPetVideos' },
    { id: 'UCYO_jab_esuFRV4b17AJtAw', title: '3Blue1Brown' },
    { id: 'UCYUZ0gWRp_HQCVEz0OovuAg', title: 'MattOrchard-CrimeandSociety' },
    { id: 'UCYY5GWf7MHFJ6DZeHreoXgw', title: 'BrainBlaze' },
    { id: 'UCYju6cJkaQafQvKE9q-vMWQ', title: 'Netsky' },
    { id: 'UCYwVxWpjeKFWwu8TML-Te9A', title: 'JCS-CriminalPsychology' },
    { id: 'UCYxrnDjNQZIs_aAcdhqSveg', title: 'RobGavagan' },
    { id: 'UCYzPXprvl5Y-Sf0g4vX-m6g', title: 'jacksepticeye' },
    { id: 'UCZD5sZhuEw7stVgtkyTj3KQ', title: 'NickxarNick' },
    { id: 'UCZFipeZtQM5CKUjx6grh54g', title: 'IsaacArthur' },
    { id: 'UCZZPgUIorPao48a1tBYSDgg', title: 'SimonGrimm' },
    { id: 'UCZzR7tqZKAXWT8uOi-RHuVA', title: 'FootofaFerret' },
    { id: 'UC_0CVCfC_3iuHqmyClu59Uw', title: 'ETAPRIME' },
    { id: 'UC_0r3EheCnp-wVvndYDGviQ', title: 'BanijayCrime-CrimeDocumentary' },
    { id: 'UC_1awbvccFZOnVRjAIkCG7Q', title: 'SamBeckman' },
    { id: 'UC_jxnWLGJ2eQK4en3UblKEw', title: 'MixHound' },
    { id: 'UC_luiBQ-9hfg3xBv8hYx9Ow', title: 'IAmSophieSeries' },
    { id: 'UC_lwWoS8qNNagi2BFiJRKHQ', title: 'djstrongarmtom' },
    { id: 'UCa5yPMr5aP_UF_94xii-5Rw', title: 'TopMysteries' },
    { id: 'UCaGev0JRG7Dp5c_R4ROADLw', title: 'DavidFirth' },
    { id: 'UCb1arr9-ox5kzW9DlzRfJGw', title: 'MitrasDrum&Bass' },
    { id: 'UCbFixBQbOLNCxdJw0HkDeFg', title: 'SodlingProductions' },
    { id: 'UCbT9KeTO_xETnqqsp5oQ3UA', title: 'SorrowTV' },
    { id: 'UCbVZdLngJH6KOJvpAOO3qTw', title: 'JoshuaMorony' },
    { id: 'UCbWcXB0PoqOsAvAdfzWMf0w', title: 'FredrikKnudsen' },
    { id: 'UCbxzdZTDn4YB4Z-ukch2ivw', title: 'FrontEndCenter' },
    { id: 'UCc3csYiKDHu_GrX_FMbExow', title: 'Nopsclips' },
    { id: 'UCcUf33cEPky2GiWBgOP-jQA', title: 'CoffeehouseCrime' },
    { id: 'UCcV40gnTH9-T8yw3FHjzWZQ', title: 'PhillyD' },
    { id: 'UCcem9I78ybZLHLRUlkUO3sw', title: 'TheProperPeople' },
    { id: 'UCchWU8ta6L-Dy3rGIxPINzw', title: 'ReignBot' },
    { id: 'UCcnAEyz9VnlBL1DiQqliJkQ', title: 'HarryMackClips' },
    { id: 'UCcvfHa-GHSOHFAjU0-Ie57A', title: 'AdamSomething' },
    { id: 'UCdqIfmEq3DQEzwJ6SGHCSgQ', title: 'danpatel1' },
    { id: 'UCeE3lj6pLX_gCd0Yvns517Q', title: 'OzzyManReviews' },
    { id: 'UCebpq6lNn_oV_Y2XiRzR3Vg', title: 'EmmaBlackery' },
    { id: 'UCelXvXZDvx8_TdOOffevzGg', title: 'EllieinSpace' },
    { id: 'UCf-U0uPVQZtcqXUWa_Hl4Mw', title: 'IntotheShadows' },
    { id: 'UCf5POn4NNKIIGmXOu6qhbsQ', title: 'InsideAMind' },
    { id: 'UCf_h1ETJ1EzPXWC2oltONQQ', title: 'KalaClips' },
    { id: 'UCg4vDcovXPJTcTcYxQ9iCrw', title: 'wavywebsurf' },
    { id: 'UCgJRL30YS6XFxq9Ga8W2J3A', title: 'MightyCarMods' },
    { id: 'UCgJjd8J5moTQSwnCIx4WSIw', title: 'PD' },
    { id: 'UChIs72whgZI9w6d6FhwGGHA', title: 'GamersNexus' },
    { id: 'UChc-m3saf8K2oJHDSsnsj_A', title: 'ElvisTheAlien' },
    { id: 'UChu7KDvlOVIOsGhqoN8S90g', title: 'ZoelVicazo' },
    { id: 'UCihh2UPbN4IWy-rWFFqqAUw', title: 'Horton' },
    { id: 'UCimiUgDLbi6P17BdaCZpVbg', title: 'exurb1a' },
    { id: 'UCircJf-FlToBNjuy9xG-i5A', title: 'Watcher' },
    { id: 'UCiuVKpxoSvKlM58OFaP1kRw', title: 'Zonua' },
    { id: 'UCj37jo4leidjnbg-eNbfGZQ', title: 'HayleyLegg' },
    { id: 'UCkMLMMLyaYAhCgrwB6UUxUQ', title: 'Dave\'sLemonade-CrimeDocumentary' },
    { id: 'UCktXW3AQVjtZOFVjjiZRQpw', title: 'Fainted' },
    { id: 'UCl2mFZoRqjw_ELax4Yisf6w', title: 'LouisRossmann' },
    { id: 'UCl3SuH2Ue044b7ACX1syk4A', title: 'DarkDocs' },
    { id: 'UClFSU9_bUb4Rc6OYfTt5SPw', title: 'PhilipDeFranco' },
    { id: 'UClW44KG_EKETupl-3BlnLSQ', title: 'Top15s' },
    { id: 'UClnDI2sdehVm1zm_LmUHsjQ', title: 'Biographics' },
    { id: 'UCmPSwsooZq8an7xOLQQhAdw', title: 'RémiGAILLARD' },
    { id: 'UCmu9PVIZBk-ZCi-Sk2F2utA', title: '3kliksphilip' },
    { id: 'UCn8OYopT9e8tng-CGEWzfmw', title: 'AtrocityGuide' },
    { id: 'UCnKOTwXjtCnXSEqLiThhhng', title: 'OwnagePranksExtras' },
    { id: 'UCnQeUXQFuTDadzQzCcombzg', title: 'DarkSpace' },
    { id: 'UCnXN1WZ57YHaSgIKbDHEnDw', title: 'DJRavine' },
    { id: 'UCnb-VTwBHEV3gtiB9di9DZQ', title: 'HighlightHistory' },
    { id: 'UCnrEqQxFLslp7TCLMgVfDNw', title: 'JohnMartinez' },
    { id: 'UCnsiAZZEiA-5eKkIbp_c7fQ', title: 'datelinemystery' },
    { id: 'UCny_vGt2N7_QJ5qBOAHxlcw', title: 'maxmoefoe' },
    { id: 'UCoxfCAfBTeL9P7R3vgAx98Q', title: 'NearlyMedia' },
    { id: 'UCp1tsmksyf6TgKFMdt8-05Q', title: 'TheCasualCriminalist' },
    { id: 'UCp68_FLety0O-n9QU6phsgw', title: 'colinfurze' },
    { id: 'UCpFFItkfZz1qz5PpHpqzYBw', title: 'Nexpo' },
    { id: 'UCpLB7kBu9O5dbBKhaIOmqcQ', title: 'PDSNewsClips' },
    { id: 'UCphlppLaedKn0BgXAszs5dQ', title: 'RyanHollinger' },
    { id: 'UCpnkp_D4FLPCiXOmDhoAeYA', title: 'UnusualVideos' },
    { id: 'UCpqYfSWEcyBGorRGvPsHkgg', title: 'KyleRobinsonYoung' },
    { id: 'UCq54nlcoX-0pLcN5RhxHyug', title: 'SeaNannersGamingChannel' },
    { id: 'UCqi721JsXlf0wq3Z_cNA_Ew', title: 'JoeScott-TMI' },
    { id: 'UCqxboEhVoWNmgPvXqVEMMAw', title: 'nBURD' },
    { id: 'UCr3cBLTYmIK9kY0F_OdFWFQ', title: 'CasuallyExplained' },
    { id: 'UCr8oc-LOaApCXWLjL7vdsgw', title: 'UKFDrum&Bass' },
    { id: 'UCrD4ZCPF3DVn2TUjGYEJFRg', title: 'MisterGG' },
    { id: 'UCs3iFCPtX0gzkKxCrobO4ig', title: 'CriminallyListed' },
    { id: 'UCsDl6A77CrbkSJLtxQFVDGw', title: 'JackVale' },
    { id: 'UCsT0YIqwnpJCM-mx7-gSA4Q', title: 'TEDxTalks' },
    { id: 'UCsTcErHg8oDvUnTzoqsYeNw', title: 'UnboxTherapy' },
    { id: 'UCsVIQ2ipmCbua6s8ThFLo5A', title: 'ShroudedHand' },
    { id: 'UCsXVk37bltHxD1rDPwtNM8Q', title: 'Kurzgesagt–InaNutshell' },
    { id: 'UCtPrkXdtCM5DACLufB9jbsA', title: 'MrBallen' },
    { id: 'UCtZXhZTxETDbRPzG0Hh7WBA', title: 'RazShifrin' },
    { id: 'UCtb8P4rf_1n8KS8eZk_lNNw', title: 'Fitz' },
    { id: 'UCtxCXg-UvSnTKPOzLH4wJaQ', title: 'CodingTech' },
    { id: 'UCuriCa9loP_OsH75_5j8M5w', title: 'JablinskiGames' },
    { id: 'UCvlj0IzjSnNoduQF0l3VGng', title: 'SomeMoreNews' },
    { id: 'UCvrLvII5oxSWEMEkszrxXEA', title: 'N-O-D-E' },
    { id: 'UCw49uOTAJjGUdoAeUcp7tOg', title: 'HospitalRecords' },
    { id: 'UCw4ccFtBN7dhQBcHmE0qylg', title: 'SlappedHam' },
    { id: 'UCwdmPCVOhTW2u_fKpxRLMdA', title: 'CatGhost' },
    { id: 'UCwgURKfUA7e0Z7_qE3TvBFQ', title: 'devinsupertramp' },
    { id: 'UCwp0KmeZ-B4c4EZPmIp0L4g', title: 'StopDrop&Retro' },
    { id: 'UCwpHKudUkP5tNgmMdexB3ow', title: 'MentourPilot' },
    { id: 'UCwx8xyh6ZlDI5ZQpbIWKnUg', title: 'DarkSkies' },
    { id: 'UCx5ATEoCZHd0ljo35VE_REQ', title: 'HighTeaMusic' },
    { id: 'UCxMYYfhs8BqYmJLBHmgsXLw', title: 'JasmineThompson' },
    { id: 'UCxOGHW-aqciBe5Wjq8ltzOg', title: 'OwnagePranks' },
    { id: 'UCxsQFG_8Dbt1sZhLReL2mUw', title: 'NerdCity' },
    { id: 'UCy9mMkGtYmvIufC73jhGQvg', title: 'zipperfilms' },
    { id: 'UCyZVCV9xhrCyz4hPehvb4Wg', title: 'InternetToday' },
    { id: 'UCz3qvETKooktNgCvvheuQDw', title: 'EventHorizon' },
    { id: 'UCz5wnzqxdlrhdpaVoRwKe2A', title: 'TimMinchin' },
    { id: 'UCz6KLlSVw2OmVeiC7Y2Z_Gg', title: 'EZTutorials' },
    { id: 'UCzEYCjO0HGcJ_MQixPEbHBQ', title: 'TLRacing' },
    { id: 'UCzIiTeduaanyEboRfwJJznA', title: 'boxxybabee' },
    { id: 'UCzjQHubuI2z95VCTESuUl2A', title: 'MisFire' },
    { id: 'UCzofNVHFCdD_4Jxs5dVqtAA', title: 'TEAMSUPERTRAMP' }
];
//-----------------------------------------------
function ytdlMDGetBaseSubURL(idOrTitle) {
    const subI = exports.baseMDSubsList.findIndex((bsObj) => bsObj.id === idOrTitle || bsObj.title === idOrTitle);
    if (subI === -1) {
        return { r: false, d: null };
    }
    else {
        return { r: true, d: { sub: exports.baseMDSubsList[subI], index: subI, url: 'http://www.youtube.com/channel/' + exports.baseMDSubsList[subI].id } };
    }
    ;
}
exports.ytdlMDGetBaseSubURL = ytdlMDGetBaseSubURL;
;
//-----------------------------------------------
/////////////////////////////////////////////////
const getLang = (code) => {
    const c2NameArr = [
        { code: 'aa', name: 'Afar' },
        { code: 'ab', name: 'Abkhazian' },
        { code: 'ae', name: 'Avestan' },
        { code: 'af', name: 'Afrikaans' },
        { code: 'ak', name: 'Akan' },
        { code: 'am', name: 'Amharic' },
        { code: 'an', name: 'Aragonese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'as', name: 'Assamese' },
        { code: 'av', name: 'Avaric' },
        { code: 'ay', name: 'Aymara' },
        { code: 'az', name: 'Azerbaijani' },
        { code: 'ba', name: 'Bashkir' },
        { code: 'be', name: 'Belarusian' },
        { code: 'bg', name: 'Bulgarian' },
        { code: 'bh', name: 'Bihari' },
        { code: 'bi', name: 'Bislama' },
        { code: 'bm', name: 'Bambara' },
        { code: 'bn', name: 'Bengali' },
        { code: 'bo', name: 'Tibetan' },
        { code: 'br', name: 'Breton' },
        { code: 'bs', name: 'Bosnian' },
        { code: 'ca', name: 'Catalan, Valencian' },
        { code: 'ce', name: 'Chechen' },
        { code: 'ch', name: 'Chamorro' },
        { code: 'co', name: 'Corsican' },
        { code: 'cr', name: 'Cree' },
        { code: 'cs', name: 'Czech' },
        { code: 'cu', name: 'Church Slavic, Old Slavonic, Church Slavonic, Old Bulgarian, Old Church Slavonic' },
        { code: 'cv', name: 'Chuvash' },
        { code: 'cy', name: 'Welsh' },
        { code: 'da', name: 'Danish' },
        { code: 'de', name: 'German' },
        { code: 'dv', name: 'Divehi, Dhivehi, Maldivian' },
        { code: 'dz', name: 'Dzongkha' },
        { code: 'ee', name: 'Ewe' },
        { code: 'el', name: 'Modern Greek' },
        { code: 'en', name: 'English' },
        { code: 'eo', name: 'Esperanto' },
        { code: 'es', name: 'Spanish, Castilian' },
        { code: 'et', name: 'Estonian' },
        { code: 'eu', name: 'Basque' },
        { code: 'fa', name: 'Persian' },
        { code: 'ff', name: 'Fulah' },
        { code: 'fi', name: 'Finnish' },
        { code: 'fj', name: 'Fijian' },
        { code: 'fo', name: 'Faroese' },
        { code: 'fr', name: 'French' },
        { code: 'fy', name: 'Western Frisian' },
        { code: 'ga', name: 'Irish' },
        { code: 'gd', name: 'Gaelic, Scottish Gaelic' },
        { code: 'gl', name: 'Galician' },
        { code: 'gn', name: 'Guaraní' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'gv', name: 'Manx' },
        { code: 'ha', name: 'Hausa' },
        { code: 'he', name: 'Modern Hebrew' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ho', name: 'Hiri Motu' },
        { code: 'hr', name: 'Croatian' },
        { code: 'ht', name: 'Haitian, Haitian Creole' },
        { code: 'hu', name: 'Hungarian' },
        { code: 'hy', name: 'Armenian' },
        { code: 'hz', name: 'Herero' },
        { code: 'ia', name: 'Interlingua (International Auxiliary Language Association)' },
        { code: 'id', name: 'Indonesian' },
        { code: 'ie', name: 'Interlingue, Occidental' },
        { code: 'ig', name: 'Igbo' },
        { code: 'ii', name: 'Sichuan Yi, Nuosu' },
        { code: 'ik', name: 'Inupiaq' },
        { code: 'io', name: 'Ido' },
        { code: 'is', name: 'Icelandic' },
        { code: 'it', name: 'Italian' },
        { code: 'iu', name: 'Inuktitut' },
        { code: 'ja', name: 'Japanese' },
        { code: 'jv', name: 'Javanese' },
        { code: 'ka', name: 'Georgian' },
        { code: 'kg', name: 'Kongo' },
        { code: 'ki', name: 'Kikuyu, Gikuyu' },
        { code: 'kj', name: 'Kwanyama, Kuanyama' },
        { code: 'kk', name: 'Kazakh' },
        { code: 'kl', name: 'Kalaallisut, Greenlandic' },
        { code: 'km', name: 'Central Khmer' },
        { code: 'kn', name: 'Kannada' },
        { code: 'ko', name: 'Korean' },
        { code: 'kr', name: 'Kanuri' },
        { code: 'ks', name: 'Kashmiri' },
        { code: 'ku', name: 'Kurdish' },
        { code: 'kv', name: 'Komi' },
        { code: 'kw', name: 'Cornish' },
        { code: 'ky', name: 'Kirghiz, Kyrgyz' },
        { code: 'la', name: 'Latin' },
        { code: 'lb', name: 'Luxembourgish, Letzeburgesch' },
        { code: 'lg', name: 'Ganda' },
        { code: 'li', name: 'Limburgish, Limburgan, Limburger' },
        { code: 'ln', name: 'Lingala' },
        { code: 'lo', name: 'Lao' },
        { code: 'lt', name: 'Lithuanian' },
        { code: 'lu', name: 'Luba-Katanga' },
        { code: 'lv', name: 'Latvian' },
        { code: 'mg', name: 'Malagasy' },
        { code: 'mh', name: 'Marshallese' },
        { code: 'mi', name: 'Māori' },
        { code: 'mk', name: 'Macedonian' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'mn', name: 'Mongolian' },
        { code: 'mr', name: 'Marathi' },
        { code: 'ms', name: 'Malay' },
        { code: 'mt', name: 'Maltese' },
        { code: 'my', name: 'Burmese' },
        { code: 'na', name: 'Nauru' },
        { code: 'nb', name: 'Norwegian Bokmål' },
        { code: 'nd', name: 'North Ndebele' },
        { code: 'ne', name: 'Nepali' },
        { code: 'ng', name: 'Ndonga' },
        { code: 'nl', name: 'Dutch, Flemish' },
        { code: 'nn', name: 'Norwegian Nynorsk' },
        { code: 'no', name: 'Norwegian' },
        { code: 'nr', name: 'South Ndebele' },
        { code: 'nv', name: 'Navajo, Navaho' },
        { code: 'ny', name: 'Chichewa, Chewa, Nyanja' },
        { code: 'oc', name: 'Occitan (after 1500)' },
        { code: 'oj', name: 'Ojibwa' },
        { code: 'om', name: 'Oromo' },
        { code: 'or', name: 'Oriya' },
        { code: 'os', name: 'Ossetian, Ossetic' },
        { code: 'pa', name: 'Panjabi, Punjabi' },
        { code: 'pi', name: 'Pāli' },
        { code: 'pl', name: 'Polish' },
        { code: 'ps', name: 'Pashto, Pushto' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'qu', name: 'Quechua' },
        { code: 'rm', name: 'Romansh' },
        { code: 'rn', name: 'Rundi' },
        { code: 'ro', name: 'Romanian, Moldavian, Moldovan' },
        { code: 'ru', name: 'Russian' },
        { code: 'rw', name: 'Kinyarwanda' },
        { code: 'sa', name: 'Sanskrit' },
        { code: 'sc', name: 'Sardinian' },
        { code: 'sd', name: 'Sindhi' },
        { code: 'se', name: 'Northern Sami' },
        { code: 'sg', name: 'Sango' },
        { code: 'si', name: 'Sinhala, Sinhalese' },
        { code: 'sk', name: 'Slovak' },
        { code: 'sl', name: 'Slovene' },
        { code: 'sm', name: 'Samoan' },
        { code: 'sn', name: 'Shona' },
        { code: 'so', name: 'Somali' },
        { code: 'sq', name: 'Albanian' },
        { code: 'sr', name: 'Serbian' },
        { code: 'ss', name: 'Swati' },
        { code: 'st', name: 'Southern Sotho' },
        { code: 'su', name: 'Sundanese' },
        { code: 'sv', name: 'Swedish' },
        { code: 'sw', name: 'Swahili' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'tg', name: 'Tajik' },
        { code: 'th', name: 'Thai' },
        { code: 'ti', name: 'Tigrinya' },
        { code: 'tk', name: 'Turkmen' },
        { code: 'tl', name: 'Tagalog' },
        { code: 'tn', name: 'Tswana' },
        { code: 'to', name: 'Tonga (Tonga Islands)' },
        { code: 'tr', name: 'Turkish' },
        { code: 'ts', name: 'Tsonga' },
        { code: 'tt', name: 'Tatar' },
        { code: 'tw', name: 'Twi' },
        { code: 'ty', name: 'Tahitian' },
        { code: 'ug', name: 'Uighur, Uyghur' },
        { code: 'uk', name: 'Ukrainian' },
        { code: 'ur', name: 'Urdu' },
        { code: 'uz', name: 'Uzbek' },
        { code: 've', name: 'Venda' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'vo', name: 'Volapük' },
        { code: 'wa', name: 'Walloon' },
        { code: 'wo', name: 'Wolof' },
        { code: 'xh', name: 'Xhosa' },
        { code: 'yi', name: 'Yiddish' },
        { code: 'yo', name: 'Yoruba' },
        { code: 'za', name: 'Zhuang, Chuang' },
        { code: 'zh', name: 'Chinese' },
        { code: 'zu', name: 'Zulu' }
    ];
    let matchArr = c2NameArr.filter(o => o.code.toLowerCase() === code.toLowerCase());
    if (matchArr.length > 0) {
        let matchName = matchArr[0].name;
        if (matchName.includes(',')) {
            matchName = matchName.split(',')[0].trim();
        }
        ;
        return Promise.resolve(matchName);
    }
    else {
        return Promise.resolve(code.toUpperCase());
    }
};
exports.getLang = getLang;
/////////////////////////////////////////////////
exports.twtAuthHTML = `
<html>
  <body style="background:#121212;color:#878787;font-size:14px;font-family:Arial;display:flex;align-items:center">
    <div style="display:block;margin:auto">
      <div style="font-weight:600;font-size:16px" id="code-div"></div>
      <div style="color:#aaa" id="msg-div"></div>
    </div>
  </body>
</html>
<script>
  const cD=document.getElementById('code-div');
  const mD=document.getElementById('msg-div');
  let head={'Content-Type': 'application/json'};
  let data={};
  const rUrl=document.location.href;
  if(rUrl.includes('error')){
    data['r']=false;
    data['d']={error:rUrl.split('?error=')[1].split('&error_description=')[0],msg:rUrl.split('&error_description=')[1].split('&state=')[0].replace(/\\+/g,' ')};
    cD.style.color='red';
    cD.textContent='ERROR';
    mD.textContent=data.d.error+' - '+data.d.msg;
    head['error']='true';
  }else{
    data['r']=true;
    data['d']=rUrl.split('?code=')[1].split('&')[0];
    cD.style.color='green';
    cD.textContent='SUCCESS';
    mD.textContent=data.d;
    head['access']=data.d;
  };
  fetch("http://localhost:3333", {
    method:'POST',
    headers:head,
    body:JSON.stringify(data)
  }).then(res=>{
    setTimeout(()=>{window.close()},1000);
  }).catch(e=>{
    cD.style.color='red';
    cD.textContent='ERROR';
    mD.textContent='POST ERROR!';
  });
</script>
`;
//////////////////////////////////////////////////
function getWledNoteSegs(type, length) {
    const hlC = { whatsapp: [37, 211, 102, 0], gmail: [199, 22, 16, 0], sms: [0, 87, 203, 0] };
    const baseSegsArr = [
        { id: 0, start: 0, stop: length, length: length, grouping: 1, spacing: 0, offset: 0, on: true, brightness: 204, cct: 128, colors: [[255, 255, 255, 0], [0, 0, 0, 0], [0, 0, 0, 0]], effectId: 0, effectSpeed: 255, effectIntensity: 127, paletteId: 0, selected: true, reverse: false, mirror: false },
        { id: 1, start: 0, stop: length, length: length, grouping: 30, spacing: 30, offset: 0, on: true, brightness: 204, cct: 128, colors: [hlC[type], [0, 0, 0, 0], [0, 0, 0, 0]], effectId: 0, effectSpeed: 255, effectIntensity: 127, paletteId: 0, selected: true, reverse: false, mirror: false }
    ];
    return Promise.resolve(baseSegsArr);
}
exports.getWledNoteSegs = getWledNoteSegs;
/////////////////////////////////////////////////
const randomST = () => {
    let rwArr = ['abacus', 'abdomen', 'abdominal', 'abide', 'abiding', 'ability', 'ablaze', 'able', 'abnormal', 'abrasion', 'abrasive', 'abreast', 'abridge', 'abroad', 'abruptly', 'absence', 'absentee', 'absently', 'absinthe', 'absolute', 'absolve', 'abstain', 'abstract', 'absurd', 'accent', 'acclaim', 'acclimate', 'accompany', 'account', 'accuracy', 'accurate', 'accustom', 'acetone', 'achiness', 'aching', 'acid', 'acorn', 'acquaint', 'acquire', 'acre', 'acrobat', 'acronym', 'acting', 'action', 'activate', 'activator', 'active', 'activism', 'activist', 'activity', 'actress', 'acts', 'acutely', 'acuteness', 'aeration', 'aerobics', 'aerosol', 'aerospace', 'afar', 'affair', 'affected', 'affecting', 'affection', 'affidavit', 'affiliate', 'affirm', 'affix', 'afflicted', 'affluent', 'afford', 'affront', 'aflame', 'afloat', 'aflutter', 'afoot', 'afraid', 'afterglow', 'afterlife', 'aftermath', 'aftermost', 'afternoon', 'aged', 'ageless', 'agency', 'agenda', 'agent', 'aggregate', 'aghast', 'agile', 'agility', 'aging', 'agnostic', 'agonize', 'agonizing', 'agony', 'agreeable', 'agreeably', 'agreed', 'agreeing', 'agreement', 'aground', 'ahead', 'ahoy', 'aide', 'aids', 'aim', 'ajar', 'alabaster', 'alarm', 'albatross', 'album', 'alfalfa', 'algebra', 'algorithm', 'alias', 'alibi', 'alienable', 'alienate', 'aliens', 'alike', 'alive', 'alkaline', 'alkalize', 'almanac', 'almighty', 'almost', 'aloe', 'aloft', 'aloha', 'alone', 'alongside', 'aloof', 'alphabet', 'alright', 'although', 'altitude', 'alto', 'aluminum', 'alumni', 'always', 'amaretto', 'amaze', 'amazingly', 'amber', 'ambiance', 'ambiguity', 'ambiguous', 'ambition', 'ambitious', 'ambulance', 'ambush', 'amendable', 'amendment', 'amends', 'amenity', 'amiable', 'amicably', 'amid', 'amigo', 'amino', 'amiss', 'ammonia', 'ammonium', 'amnesty', 'amniotic', 'among', 'amount', 'amperage', 'ample', 'amplifier', 'amplify', 'amply', 'amuck', 'amulet', 'amusable', 'amused', 'amusement', 'amuser', 'amusing', 'anaconda', 'anaerobic', 'anagram', 'anatomist', 'anatomy', 'anchor', 'anchovy', 'ancient', 'android', 'anemia', 'anemic', 'aneurism', 'anew', 'angelfish', 'angelic', 'anger', 'angled', 'angler', 'angles', 'angling', 'angrily', 'angriness', 'anguished', 'angular', 'animal', 'animate', 'animating', 'animation', 'animator', 'anime', 'animosity', 'ankle', 'annex', 'annotate', 'announcer', 'annoying', 'annually', 'annuity', 'anointer', 'another', 'answering', 'antacid', 'antarctic', 'anteater', 'antelope', 'antennae', 'anthem', 'anthill', 'anthology', 'antibody', 'antics', 'antidote', 'antihero', 'antiquely', 'antiques', 'antiquity', 'antirust', 'antitoxic', 'antitrust', 'antiviral', 'antivirus', 'antler', 'antonym', 'antsy', 'anvil', 'anybody', 'anyhow', 'anymore', 'anyone', 'anyplace', 'anything', 'anytime', 'anyway', 'anywhere', 'aorta', 'apache', 'apostle', 'appealing', 'appear', 'appease', 'appeasing', 'appendage', 'appendix', 'appetite', 'appetizer', 'applaud', 'applause', 'apple', 'appliance', 'applicant', 'applied', 'apply', 'appointee', 'appraisal', 'appraiser', 'apprehend', 'approach', 'approval', 'approve', 'apricot', 'april', 'apron', 'aptitude', 'aptly', 'aqua', 'aqueduct', 'arbitrary', 'arbitrate', 'ardently', 'area', 'arena', 'arguable', 'arguably', 'argue', 'arise', 'armadillo', 'armband', 'armchair', 'armed', 'armful', 'armhole', 'arming', 'armless', 'armoire', 'armored', 'armory', 'armrest', 'army', 'aroma', 'arose', 'around', 'arousal', 'arrange', 'array', 'arrest', 'arrival', 'arrive', 'arrogance', 'arrogant', 'arson', 'art', 'ascend', 'ascension', 'ascent', 'ascertain', 'ashamed', 'ashen', 'ashes', 'ashy', 'aside', 'askew', 'asleep', 'asparagus', 'aspect', 'aspirate', 'aspire', 'aspirin', 'astonish', 'astound', 'astride', 'astrology', 'astronaut', 'astronomy', 'astute', 'atlantic', 'atlas', 'atom', 'atonable', 'atop', 'atrium', 'atrocious', 'atrophy', 'attach', 'attain', 'attempt', 'attendant', 'attendee', 'attention', 'attentive', 'attest', 'attic', 'attire', 'attitude', 'attractor', 'attribute', 'atypical', 'auction', 'audacious', 'audacity', 'audible', 'audibly', 'audience', 'audio', 'audition', 'augmented', 'august', 'authentic', 'author', 'autism', 'autistic', 'autograph', 'automaker', 'automated', 'automatic', 'autopilot', 'available', 'avalanche', 'avatar', 'avenge', 'avenging', 'avenue', 'average', 'aversion', 'avert', 'aviation', 'aviator', 'avid', 'avoid', 'await', 'awaken', 'award', 'aware', 'awhile', 'awkward', 'awning', 'awoke', 'awry', 'axis', 'babble', 'babbling', 'babied', 'baboon', 'backache', 'backboard', 'backboned', 'backdrop', 'backed', 'backer', 'backfield', 'backfire', 'backhand', 'backing', 'backlands', 'backlash', 'backless', 'backlight', 'backlit', 'backlog', 'backpack', 'backpedal', 'backrest', 'backroom', 'backshift', 'backside', 'backslid', 'backspace', 'backspin', 'backstab', 'backstage', 'backtalk', 'backtrack', 'backup', 'backward', 'backwash', 'backwater', 'backyard', 'bacon', 'bacteria', 'bacterium', 'badass', 'badge', 'badland', 'badly', 'badness', 'baffle', 'baffling', 'bagel', 'bagful', 'baggage', 'bagged', 'baggie', 'bagginess', 'bagging', 'baggy', 'bagpipe', 'baguette', 'baked', 'bakery', 'bakeshop', 'baking', 'balance', 'balancing', 'balcony', 'balmy', 'balsamic', 'bamboo', 'banana', 'banish', 'banister', 'banjo', 'bankable', 'bankbook', 'banked', 'banker', 'banking', 'banknote', 'bankroll', 'banner', 'bannister', 'banshee', 'banter', 'barbecue', 'barbed', 'barbell', 'barber', 'barcode', 'barge', 'bargraph', 'barista', 'baritone', 'barley', 'barmaid', 'barman', 'barn', 'barometer', 'barrack', 'barracuda', 'barrel', 'barrette', 'barricade', 'barrier', 'barstool', 'bartender', 'barterer', 'bash', 'basically', 'basics', 'basil', 'basin', 'basis', 'basket', 'batboy', 'batch', 'bath', 'baton', 'bats', 'battalion', 'battered', 'battering', 'battery', 'batting', 'battle', 'bauble', 'bazooka', 'blabber', 'bladder', 'blade', 'blah', 'blame', 'blaming', 'blanching', 'blandness', 'blank', 'blaspheme', 'blasphemy', 'blast', 'blatancy', 'blatantly', 'blazer', 'blazing', 'bleach', 'bleak', 'bleep', 'blemish', 'blend', 'bless', 'blighted', 'blimp', 'bling', 'blinked', 'blinker', 'blinking', 'blinks', 'blip', 'blissful', 'blitz', 'blizzard', 'bloated', 'bloating', 'blob', 'blog', 'bloomers', 'blooming', 'blooper', 'blot', 'blouse', 'blubber', 'bluff', 'bluish', 'blunderer', 'blunt', 'blurb', 'blurred', 'blurry', 'blurt', 'blush', 'blustery', 'boaster', 'boastful', 'boasting', 'boat', 'bobbed', 'bobbing', 'bobble', 'bobcat', 'bobsled', 'bobtail', 'bodacious', 'body', 'bogged', 'boggle', 'bogus', 'boil', 'bok', 'bolster', 'bolt', 'bonanza', 'bonded', 'bonding', 'bondless', 'boned', 'bonehead', 'boneless', 'bonelike', 'boney', 'bonfire', 'bonnet', 'bonsai', 'bonus', 'bony', 'boogeyman', 'boogieman', 'book', 'boondocks', 'booted', 'booth', 'bootie', 'booting', 'bootlace', 'bootleg', 'boots', 'boozy', 'borax', 'boring', 'borough', 'borrower', 'borrowing', 'boss', 'botanical', 'botanist', 'botany', 'botch', 'both', 'bottle', 'bottling', 'bottom', 'bounce', 'bouncing', 'bouncy', 'bounding', 'boundless', 'bountiful', 'bovine', 'boxcar', 'boxer', 'boxing', 'boxlike', 'boxy', 'breach', 'breath', 'breeches', 'breeching', 'breeder', 'breeding', 'breeze', 'breezy', 'brethren', 'brewery', 'brewing', 'briar', 'bribe', 'brick', 'bride', 'bridged', 'brigade', 'bright', 'brilliant', 'brim', 'bring', 'brink', 'brisket', 'briskly', 'briskness', 'bristle', 'brittle', 'broadband', 'broadcast', 'broaden', 'broadly', 'broadness', 'broadside', 'broadways', 'broiler', 'broiling', 'broken', 'broker', 'bronchial', 'bronco', 'bronze', 'bronzing', 'brook', 'broom', 'brought', 'browbeat', 'brownnose', 'browse', 'browsing', 'bruising', 'brunch', 'brunette', 'brunt', 'brush', 'brussels', 'brute', 'brutishly', 'bubble', 'bubbling', 'bubbly', 'buccaneer', 'bucked', 'bucket', 'buckle', 'buckshot', 'buckskin', 'bucktooth', 'buckwheat', 'buddhism', 'buddhist', 'budding', 'buddy', 'budget', 'buffalo', 'buffed', 'buffer', 'buffing', 'buffoon', 'buggy', 'bulb', 'bulge', 'bulginess', 'bulgur', 'bulk', 'bulldog', 'bulldozer', 'bullfight', 'bullfrog', 'bullhorn', 'bullion', 'bullish', 'bullpen', 'bullring', 'bullseye', 'bullwhip', 'bully', 'bunch', 'bundle', 'bungee', 'bunion', 'bunkbed', 'bunkhouse', 'bunkmate', 'bunny', 'bunt', 'busboy', 'bush', 'busily', 'busload', 'bust', 'busybody', 'buzz', 'cabana', 'cabbage', 'cabbie', 'cabdriver', 'cable', 'caboose', 'cache', 'cackle', 'cacti', 'cactus', 'caddie', 'caddy', 'cadet', 'cadillac', 'cadmium', 'cage', 'cahoots', 'cake', 'calamari', 'calamity', 'calcium', 'calculate', 'calculus', 'caliber', 'calibrate', 'calm', 'caloric', 'calorie', 'calzone', 'camcorder', 'cameo', 'camera', 'camisole', 'camper', 'campfire', 'camping', 'campsite', 'campus', 'canal', 'canary', 'cancel', 'candied', 'candle', 'candy', 'cane', 'canine', 'canister', 'cannabis', 'canned', 'canning', 'cannon', 'cannot', 'canola', 'canon', 'canopener', 'canopy', 'canteen', 'canyon', 'capable', 'capably', 'capacity', 'cape', 'capillary', 'capital', 'capitol', 'capped', 'capricorn', 'capsize', 'capsule', 'caption', 'captivate', 'captive', 'captivity', 'capture', 'caramel', 'carat', 'caravan', 'carbon', 'cardboard', 'carded', 'cardiac', 'cardigan', 'cardinal', 'cardstock', 'carefully', 'caregiver', 'careless', 'caress', 'caretaker', 'cargo', 'caring', 'carless', 'carload', 'carmaker', 'carnage', 'carnation', 'carnival', 'carnivore', 'carol', 'carpenter', 'carpentry', 'carpool', 'carport', 'carried', 'carrot', 'carrousel', 'carry', 'cartel', 'cartload', 'carton', 'cartoon', 'cartridge', 'cartwheel', 'carve', 'carving', 'carwash', 'cascade', 'case', 'cash', 'casing', 'casino', 'casket', 'cassette', 'casually', 'casualty', 'catacomb', 'catalog', 'catalyst', 'catalyze', 'catapult', 'cataract', 'catatonic', 'catcall', 'catchable', 'catcher', 'catching', 'catchy', 'caterer', 'catering', 'catfight', 'catfish', 'cathedral', 'cathouse', 'catlike', 'catnap', 'catnip', 'catsup', 'cattail', 'cattishly', 'cattle', 'catty', 'catwalk', 'caucasian', 'caucus', 'causal', 'causation', 'cause', 'causing', 'cauterize', 'caution', 'cautious', 'cavalier', 'cavalry', 'caviar', 'cavity', 'cedar', 'celery', 'celestial', 'celibacy', 'celibate', 'celtic', 'cement', 'census', 'ceramics', 'ceremony', 'certainly', 'certainty', 'certified', 'certify', 'cesarean', 'cesspool', 'chafe', 'chaffing', 'chain', 'chair', 'chalice', 'challenge', 'chamber', 'chamomile', 'champion', 'chance', 'change', 'channel', 'chant', 'chaos', 'chaperone', 'chaplain', 'chapped', 'chaps', 'chapter', 'character', 'charbroil', 'charcoal', 'charger', 'charging', 'chariot', 'charity', 'charm', 'charred', 'charter', 'charting', 'chase', 'chasing', 'chaste', 'chastise', 'chastity', 'chatroom', 'chatter', 'chatting', 'chatty', 'cheating', 'cheddar', 'cheek', 'cheer', 'cheese', 'cheesy', 'chef', 'chemicals', 'chemist', 'chemo', 'cherisher', 'cherub', 'chess', 'chest', 'chevron', 'chevy', 'chewable', 'chewer', 'chewing', 'chewy', 'chief', 'chihuahua', 'childcare', 'childhood', 'childish', 'childless', 'childlike', 'chili', 'chill', 'chimp', 'chip', 'chirping', 'chirpy', 'chitchat', 'chivalry', 'chive', 'chloride', 'chlorine', 'choice', 'chokehold', 'choking', 'chomp', 'chooser', 'choosing', 'choosy', 'chop', 'chosen', 'chowder', 'chowtime', 'chrome', 'chubby', 'chuck', 'chug', 'chummy', 'chump', 'chunk', 'churn', 'chute', 'cider', 'cilantro', 'cinch', 'cinema', 'cinnamon', 'circle', 'circling', 'circular', 'circulate', 'circus', 'citable', 'citadel', 'citation', 'citizen', 'citric', 'citrus', 'city', 'civic', 'civil', 'clad', 'claim', 'clambake', 'clammy', 'clamor', 'clamp', 'clamshell', 'clang', 'clanking', 'clapped', 'clapper', 'clapping', 'clarify', 'clarinet', 'clarity', 'clash', 'clasp', 'class', 'clatter', 'clause', 'clavicle', 'claw', 'clay', 'clean', 'clear', 'cleat', 'cleaver', 'cleft', 'clench', 'clergyman', 'clerical', 'clerk', 'clever', 'clicker', 'client', 'climate', 'climatic', 'cling', 'clinic', 'clinking', 'clip', 'clique', 'cloak', 'clobber', 'clock', 'clone', 'cloning', 'closable', 'closure', 'clothes', 'clothing', 'cloud', 'clover', 'clubbed', 'clubbing', 'clubhouse', 'clump', 'clumsily', 'clumsy', 'clunky', 'clustered', 'clutch', 'clutter', 'coach', 'coagulant', 'coastal', 'coaster', 'coasting', 'coastland', 'coastline', 'coat', 'coauthor', 'cobalt', 'cobbler', 'cobweb', 'cocoa', 'coconut', 'cod', 'coeditor', 'coerce', 'coexist', 'coffee', 'cofounder', 'cognition', 'cognitive', 'cogwheel', 'coherence', 'coherent', 'cohesive', 'coil', 'coke', 'cola', 'cold', 'coleslaw', 'coliseum', 'collage', 'collapse', 'collar', 'collected', 'collector', 'collide', 'collie', 'collision', 'colonial', 'colonist', 'colonize', 'colony', 'colossal', 'colt', 'coma', 'come', 'comfort', 'comfy', 'comic', 'coming', 'comma', 'commence', 'commend', 'comment', 'commerce', 'commode', 'commodity', 'commodore', 'common', 'commotion', 'commute', 'commuting', 'compacted', 'compacter', 'compactly', 'compactor', 'companion', 'company', 'compare', 'compel', 'compile', 'comply', 'component', 'composed', 'composer', 'composite', 'compost', 'composure', 'compound', 'compress', 'comprised', 'computer', 'computing', 'comrade', 'concave', 'conceal', 'conceded', 'concept', 'concerned', 'concert', 'conch', 'concierge', 'concise', 'conclude', 'concrete', 'concur', 'condense', 'condiment', 'condition', 'condone', 'conducive', 'conductor', 'conduit', 'cone', 'confess', 'confetti', 'confidant', 'confident', 'confider', 'confiding', 'configure', 'confined', 'confining', 'confirm', 'conflict', 'conform', 'confound', 'confront', 'confused', 'confusing', 'confusion', 'congenial', 'congested', 'congrats', 'congress', 'conical', 'conjoined', 'conjure', 'conjuror', 'connected', 'connector', 'consensus', 'consent', 'console', 'consoling', 'consonant', 'constable', 'constant', 'constrain', 'constrict', 'construct', 'consult', 'consumer', 'consuming', 'contact', 'container', 'contempt', 'contend', 'contented', 'contently', 'contents', 'contest', 'context', 'contort', 'contour', 'contrite', 'control', 'contusion', 'convene', 'convent', 'copartner', 'cope', 'copied', 'copier', 'copilot', 'coping', 'copious', 'copper', 'copy', 'coral', 'cork', 'cornball', 'cornbread', 'corncob', 'cornea', 'corned', 'corner', 'cornfield', 'cornflake', 'cornhusk', 'cornmeal', 'cornstalk', 'corny', 'coronary', 'coroner', 'corporal', 'corporate', 'corral', 'correct', 'corridor', 'corrode', 'corroding', 'corrosive', 'corsage', 'corset', 'cortex', 'cosigner', 'cosmetics', 'cosmic', 'cosmos', 'cosponsor', 'cost', 'cottage', 'cotton', 'couch', 'cough', 'could', 'countable', 'countdown', 'counting', 'countless', 'country', 'county', 'courier', 'covenant', 'cover', 'coveted', 'coveting', 'coyness', 'cozily', 'coziness', 'cozy', 'crabbing', 'crabgrass', 'crablike', 'crabmeat', 'cradle', 'cradling', 'crafter', 'craftily', 'craftsman', 'craftwork', 'crafty', 'cramp', 'cranberry', 'crane', 'cranial', 'cranium', 'crank', 'crate', 'crave', 'craving', 'crawfish', 'crawlers', 'crawling', 'crayfish', 'crayon', 'crazed', 'crazily', 'craziness', 'crazy', 'creamed', 'creamer', 'creamlike', 'crease', 'creasing', 'creatable', 'create', 'creation', 'creative', 'creature', 'credible', 'credibly', 'credit', 'creed', 'creme', 'creole', 'crepe', 'crept', 'crescent', 'crested', 'cresting', 'crestless', 'crevice', 'crewless', 'crewman', 'crewmate', 'crib', 'cricket', 'cried', 'crier', 'crimp', 'crimson', 'cringe', 'cringing', 'crinkle', 'crinkly', 'crisped', 'crisping', 'crisply', 'crispness', 'crispy', 'criteria', 'critter', 'croak', 'crock', 'crook', 'croon', 'crop', 'cross', 'crouch', 'crouton', 'crowbar', 'crowd', 'crown', 'crucial', 'crudely', 'crudeness', 'cruelly', 'cruelness', 'cruelty', 'crumb', 'crummiest', 'crummy', 'crumpet', 'crumpled', 'cruncher', 'crunching', 'crunchy', 'crusader', 'crushable', 'crushed', 'crusher', 'crushing', 'crust', 'crux', 'crying', 'cryptic', 'crystal', 'cubbyhole', 'cube', 'cubical', 'cubicle', 'cucumber', 'cuddle', 'cuddly', 'cufflink', 'culinary', 'culminate', 'culpable', 'culprit', 'cultivate', 'cultural', 'culture', 'cupbearer', 'cupcake', 'cupid', 'cupped', 'cupping', 'curable', 'curator', 'curdle', 'cure', 'curfew', 'curing', 'curled', 'curler', 'curliness', 'curling', 'curly', 'curry', 'curse', 'cursive', 'cursor', 'curtain', 'curtly', 'curtsy', 'curvature', 'curve', 'curvy', 'cushy', 'cusp', 'cussed', 'custard', 'custodian', 'custody', 'customary', 'customer', 'customize', 'customs', 'cut', 'cycle', 'cyclic', 'cycling', 'cyclist', 'cylinder', 'cymbal', 'cytoplasm', 'cytoplast', 'dab', 'dad', 'daffodil', 'dagger', 'daily', 'daintily', 'dainty', 'dairy', 'daisy', 'dallying', 'dance', 'dancing', 'dandelion', 'dander', 'dandruff', 'dandy', 'danger', 'dangle', 'dangling', 'daredevil', 'dares', 'daringly', 'darkened', 'darkening', 'darkish', 'darkness', 'darkroom', 'darling', 'darn', 'dart', 'darwinism', 'dash', 'dastardly', 'data', 'datebook', 'dating', 'daughter', 'daunting', 'dawdler', 'dawn', 'daybed', 'daybreak', 'daycare', 'daydream', 'daylight', 'daylong', 'dayroom', 'daytime', 'dazzler', 'dazzling', 'deacon', 'deafening', 'deafness', 'dealer', 'dealing', 'dealmaker', 'dealt', 'dean', 'debatable', 'debate', 'debating', 'debit', 'debrief', 'debtless', 'debtor', 'debug', 'debunk', 'decade', 'decaf', 'decal', 'decathlon', 'decay', 'deceased', 'deceit', 'deceiver', 'deceiving', 'december', 'decency', 'decent', 'deception', 'deceptive', 'decibel', 'decidable', 'decimal', 'decimeter', 'decipher', 'deck', 'declared', 'decline', 'decode', 'decompose', 'decorated', 'decorator', 'decoy', 'decrease', 'decree', 'dedicate', 'dedicator', 'deduce', 'deduct', 'deed', 'deem', 'deepen', 'deeply', 'deepness', 'deface', 'defacing', 'defame', 'default', 'defeat', 'defection', 'defective', 'defendant', 'defender', 'defense', 'defensive', 'deferral', 'deferred', 'defiance', 'defiant', 'defile', 'defiling', 'define', 'definite', 'deflate', 'deflation', 'deflator', 'deflected', 'deflector', 'defog', 'deforest', 'defraud', 'defrost', 'deftly', 'defuse', 'defy', 'degraded', 'degrading', 'degrease', 'degree', 'dehydrate', 'deity', 'dejected', 'delay', 'delegate', 'delegator', 'delete', 'deletion', 'delicacy', 'delicate', 'delicious', 'delighted', 'delirious', 'delirium', 'deliverer', 'delivery', 'delouse', 'delta', 'deluge', 'delusion', 'deluxe', 'demanding', 'demeaning', 'demeanor', 'demise', 'democracy', 'democrat', 'demote', 'demotion', 'demystify', 'denatured', 'deniable', 'denial', 'denim', 'denote', 'dense', 'density', 'dental', 'dentist', 'denture', 'deny', 'deodorant', 'deodorize', 'departed', 'departure', 'depict', 'deplete', 'depletion', 'deplored', 'deploy', 'deport', 'depose', 'depraved', 'depravity', 'deprecate', 'depress', 'deprive', 'depth', 'deputize', 'deputy', 'derail', 'deranged', 'derby', 'derived', 'desecrate', 'deserve', 'deserving', 'designate', 'designed', 'designer', 'designing', 'deskbound', 'desktop', 'deskwork', 'desolate', 'despair', 'despise', 'despite', 'destiny', 'destitute', 'destruct', 'detached', 'detail', 'detection', 'detective', 'detector', 'detention', 'detergent', 'detest', 'detonate', 'detonator', 'detoxify', 'detract', 'deuce', 'devalue', 'deviancy', 'deviant', 'deviate', 'deviation', 'deviator', 'device', 'devious', 'devotedly', 'devotee', 'devotion', 'devourer', 'devouring', 'devoutly', 'dexterity', 'dexterous', 'diabetes', 'diabetic', 'diabolic', 'diagnoses', 'diagnosis', 'diagram', 'dial', 'diameter', 'diaper', 'diaphragm', 'diary', 'dice', 'dicing', 'dictate', 'dictation', 'dictator', 'difficult', 'diffused', 'diffuser', 'diffusion', 'diffusive', 'dig', 'dilation', 'diligence', 'diligent', 'dill', 'dilute', 'dime', 'diminish', 'dimly', 'dimmed', 'dimmer', 'dimness', 'dimple', 'diner', 'dingbat', 'dinghy', 'dinginess', 'dingo', 'dingy', 'dining', 'dinner', 'diocese', 'dioxide', 'diploma', 'dipped', 'dipper', 'dipping', 'directed', 'direction', 'directive', 'directly', 'directory', 'direness', 'dirtiness', 'disabled', 'disagree', 'disallow', 'disarm', 'disarray', 'disaster', 'disband', 'disbelief', 'disburse', 'discard', 'discern', 'discharge', 'disclose', 'discolor', 'discount', 'discourse', 'discover', 'discuss', 'disdain', 'disengage', 'disfigure', 'disgrace', 'dish', 'disinfect', 'disjoin', 'disk', 'dislike', 'disliking', 'dislocate', 'dislodge', 'disloyal', 'dismantle', 'dismay', 'dismiss', 'dismount', 'disobey', 'disorder', 'disown', 'disparate', 'disparity', 'dispatch', 'dispense', 'dispersal', 'dispersed', 'disperser', 'displace', 'display', 'displease', 'disposal', 'dispose', 'disprove', 'dispute', 'disregard', 'disrupt', 'dissuade', 'distance', 'distant', 'distaste', 'distill', 'distinct', 'distort', 'distract', 'distress', 'district', 'distrust', 'ditch', 'ditto', 'ditzy', 'dividable', 'divided', 'dividend', 'dividers', 'dividing', 'divinely', 'diving', 'divinity', 'divisible', 'divisibly', 'division', 'divisive', 'divorcee', 'dizziness', 'dizzy', 'doable', 'docile', 'dock', 'doctrine', 'document', 'dodge', 'dodgy', 'doily', 'doing', 'dole', 'dollar', 'dollhouse', 'dollop', 'dolly', 'dolphin', 'domain', 'domelike', 'domestic', 'dominion', 'dominoes', 'donated', 'donation', 'donator', 'donor', 'donut', 'doodle', 'doorbell', 'doorframe', 'doorknob', 'doorman', 'doormat', 'doornail', 'doorpost', 'doorstep', 'doorstop', 'doorway', 'doozy', 'dork', 'dormitory', 'dorsal', 'dosage', 'dose', 'dotted', 'doubling', 'douche', 'dove', 'down', 'dowry', 'doze', 'drab', 'dragging', 'dragonfly', 'dragonish', 'dragster', 'drainable', 'drainage', 'drained', 'drainer', 'drainpipe', 'dramatic', 'dramatize', 'drank', 'drapery', 'drastic', 'draw', 'dreaded', 'dreadful', 'dreadlock', 'dreamboat', 'dreamily', 'dreamland', 'dreamless', 'dreamlike', 'dreamt', 'dreamy', 'drearily', 'dreary', 'drench', 'dress', 'drew', 'dribble', 'dried', 'drier', 'drift', 'driller', 'drilling', 'drinkable', 'drinking', 'dripping', 'drippy', 'drivable', 'driven', 'driver', 'driveway', 'driving', 'drizzle', 'drizzly', 'drone', 'drool', 'droop', 'drop-down', 'dropbox', 'dropkick', 'droplet', 'dropout', 'dropper', 'drove', 'drown', 'drowsily', 'drudge', 'drum', 'dry', 'dubbed', 'dubiously', 'duchess', 'duckbill', 'ducking', 'duckling', 'ducktail', 'ducky', 'duct', 'dude', 'duffel', 'dugout', 'duh', 'duke', 'duller', 'dullness', 'duly', 'dumping', 'dumpling', 'dumpster', 'duo', 'dupe', 'duplex', 'duplicate', 'duplicity', 'durable', 'durably', 'duration', 'duress', 'during', 'dusk', 'dust', 'dutiful', 'duty', 'duvet', 'dwarf', 'dweeb', 'dwelled', 'dweller', 'dwelling', 'dwindle', 'dwindling', 'dynamic', 'dynamite', 'dynasty', 'dyslexia', 'dyslexic', 'each', 'eagle', 'earache', 'eardrum', 'earflap', 'earful', 'earlobe', 'early', 'earmark', 'earmuff', 'earphone', 'earpiece', 'earplugs', 'earring', 'earshot', 'earthen', 'earthlike', 'earthling', 'earthly', 'earthworm', 'earthy', 'earwig', 'easeful', 'easel', 'easiest', 'easily', 'easiness', 'easing', 'eastbound', 'eastcoast', 'easter', 'eastward', 'eatable', 'eaten', 'eatery', 'eating', 'eats', 'ebay', 'ebony', 'ebook', 'ecard', 'eccentric', 'echo', 'eclair', 'eclipse', 'ecologist', 'ecology', 'economic', 'economist', 'economy', 'ecosphere', 'ecosystem', 'edge', 'edginess', 'edging', 'edgy', 'edition', 'editor', 'educated', 'education', 'educator', 'eel', 'effective', 'effects', 'efficient', 'effort', 'eggbeater', 'egging', 'eggnog', 'eggplant', 'eggshell', 'egomaniac', 'egotism', 'egotistic', 'either', 'eject', 'elaborate', 'elastic', 'elated', 'elbow', 'eldercare', 'elderly', 'eldest', 'electable', 'election', 'elective', 'elephant', 'elevate', 'elevating', 'elevation', 'elevator', 'eleven', 'elf', 'eligible', 'eligibly', 'eliminate', 'elite', 'elitism', 'elixir', 'elk', 'ellipse', 'elliptic', 'elm', 'elongated', 'elope', 'eloquence', 'eloquent', 'elsewhere', 'elude', 'elusive', 'elves', 'email', 'embargo', 'embark', 'embassy', 'embattled', 'embellish', 'ember', 'embezzle', 'emblaze', 'emblem', 'embody', 'embolism', 'emboss', 'embroider', 'emcee', 'emerald', 'emergency', 'emission', 'emit', 'emote', 'emoticon', 'emotion', 'empathic', 'empathy', 'emperor', 'emphases', 'emphasis', 'emphasize', 'emphatic', 'empirical', 'employed', 'employee', 'employer', 'emporium', 'empower', 'emptier', 'emptiness', 'empty', 'emu', 'enable', 'enactment', 'enamel', 'enchanted', 'enchilada', 'encircle', 'enclose', 'enclosure', 'encode', 'encore', 'encounter', 'encourage', 'encroach', 'encrust', 'encrypt', 'endanger', 'endeared', 'endearing', 'ended', 'ending', 'endless', 'endnote', 'endocrine', 'endorphin', 'endorse', 'endowment', 'endpoint', 'endurable', 'endurance', 'enduring', 'energetic', 'energize', 'energy', 'enforced', 'enforcer', 'engaged', 'engaging', 'engine', 'engorge', 'engraved', 'engraver', 'engraving', 'engross', 'engulf', 'enhance', 'enigmatic', 'enjoyable', 'enjoyably', 'enjoyer', 'enjoying', 'enjoyment', 'enlarged', 'enlarging', 'enlighten', 'enlisted', 'enquirer', 'enrage', 'enrich', 'enroll', 'enslave', 'ensnare', 'ensure', 'entail', 'entangled', 'entering', 'entertain', 'enticing', 'entire', 'entitle', 'entity', 'entomb', 'entourage', 'entrap', 'entree', 'entrench', 'entrust', 'entryway', 'entwine', 'enunciate', 'envelope', 'enviable', 'enviably', 'envious', 'envision', 'envoy', 'envy', 'enzyme', 'epic', 'epidemic', 'epidermal', 'epidermis', 'epidural', 'epilepsy', 'epileptic', 'epilogue', 'epiphany', 'episode', 'equal', 'equate', 'equation', 'equator', 'equinox', 'equipment', 'equity', 'equivocal', 'eradicate', 'erasable', 'erased', 'eraser', 'erasure', 'ergonomic', 'errand', 'errant', 'erratic', 'error', 'erupt', 'escalate', 'escalator', 'escapable', 'escapade', 'escapist', 'escargot', 'eskimo', 'esophagus', 'espionage', 'espresso', 'esquire', 'essay', 'essence', 'essential', 'establish', 'estate', 'esteemed', 'estimate', 'estimator', 'estranged', 'estrogen', 'etching', 'eternal', 'eternity', 'ethanol', 'ether', 'ethically', 'ethics', 'euphemism', 'evacuate', 'evacuee', 'evade', 'evaluate', 'evaluator', 'evaporate', 'evasion', 'evasive', 'even', 'everglade', 'evergreen', 'everybody', 'everyday', 'everyone', 'evict', 'evidence', 'evident', 'evil', 'evoke', 'evolution', 'evolve', 'exact', 'exalted', 'example', 'excavate', 'excavator', 'exceeding', 'exception', 'excess', 'exchange', 'excitable', 'exciting', 'exclaim', 'exclude', 'excluding', 'exclusion', 'exclusive', 'excretion', 'excretory', 'excursion', 'excusable', 'excusably', 'excuse', 'exemplary', 'exemplify', 'exemption', 'exerciser', 'exert', 'exes', 'exfoliate', 'exhale', 'exhaust', 'exhume', 'exile', 'existing', 'exit', 'exodus', 'exonerate', 'exorcism', 'exorcist', 'expand', 'expanse', 'expansion', 'expansive', 'expectant', 'expedited', 'expediter', 'expel', 'expend', 'expenses', 'expensive', 'expert', 'expire', 'expiring', 'explain', 'expletive', 'explicit', 'explode', 'exploit', 'explore', 'exploring', 'exponent', 'exporter', 'exposable', 'expose', 'exposure', 'express', 'expulsion', 'exquisite', 'extended', 'extending', 'extent', 'extenuate', 'exterior', 'external', 'extinct', 'extortion', 'extradite', 'extras', 'extrovert', 'extrude', 'extruding', 'exuberant', 'fable', 'fabric', 'fabulous', 'facebook', 'facecloth', 'facedown', 'faceless', 'facelift', 'faceplate', 'faceted', 'facial', 'facility', 'facing', 'facsimile', 'faction', 'factoid', 'factor', 'factsheet', 'factual', 'faculty', 'fade', 'fading', 'failing', 'falcon', 'fall', 'false', 'falsify', 'fame', 'familiar', 'family', 'famine', 'famished', 'fanatic', 'fancied', 'fanciness', 'fancy', 'fanfare', 'fang', 'fanning', 'fantasize', 'fantastic', 'fantasy', 'fascism', 'fastball', 'faster', 'fasting', 'fastness', 'faucet', 'favorable', 'favorably', 'favored', 'favoring', 'favorite', 'fax', 'feast', 'federal', 'fedora', 'feeble', 'feed', 'feel', 'feisty', 'feline', 'felt-tip', 'feminine', 'feminism', 'feminist', 'feminize', 'femur', 'fence', 'fencing', 'fender', 'ferment', 'fernlike', 'ferocious', 'ferocity', 'ferret', 'ferris', 'ferry', 'fervor', 'fester', 'festival', 'festive', 'festivity', 'fetal', 'fetch', 'fever', 'fiber', 'fiction', 'fiddle', 'fiddling', 'fidelity', 'fidgeting', 'fidgety', 'fifteen', 'fifth', 'fiftieth', 'fifty', 'figment', 'figure', 'figurine', 'filing', 'filled', 'filler', 'filling', 'film', 'filter', 'filth', 'filtrate', 'finale', 'finalist', 'finalize', 'finally', 'finance', 'financial', 'finch', 'fineness', 'finer', 'finicky', 'finished', 'finisher', 'finishing', 'finite', 'finless', 'finlike', 'fiscally', 'fit', 'five', 'flaccid', 'flagman', 'flagpole', 'flagship', 'flagstick', 'flagstone', 'flail', 'flakily', 'flaky', 'flame', 'flammable', 'flanked', 'flanking', 'flannels', 'flap', 'flaring', 'flashback', 'flashbulb', 'flashcard', 'flashily', 'flashing', 'flashy', 'flask', 'flatbed', 'flatfoot', 'flatly', 'flatness', 'flatten', 'flattered', 'flatterer', 'flattery', 'flattop', 'flatware', 'flatworm', 'flavored', 'flavorful', 'flavoring', 'flaxseed', 'fled', 'fleshed', 'fleshy', 'flick', 'flier', 'flight', 'flinch', 'fling', 'flint', 'flip', 'flirt', 'float', 'flock', 'flogging', 'flop', 'floral', 'florist', 'floss', 'flounder', 'flyable', 'flyaway', 'flyer', 'flying', 'flyover', 'flypaper', 'foam', 'foe', 'fog', 'foil', 'folic', 'folk', 'follicle', 'follow', 'fondling', 'fondly', 'fondness', 'fondue', 'font', 'food', 'fool', 'footage', 'football', 'footbath', 'footboard', 'footer', 'footgear', 'foothill', 'foothold', 'footing', 'footless', 'footman', 'footnote', 'footpad', 'footpath', 'footprint', 'footrest', 'footsie', 'footsore', 'footwear', 'footwork', 'fossil', 'foster', 'founder', 'founding', 'fountain', 'fox', 'foyer', 'fraction', 'fracture', 'fragile', 'fragility', 'fragment', 'fragrance', 'fragrant', 'frail', 'frame', 'framing', 'frantic', 'fraternal', 'frayed', 'fraying', 'frays', 'freckled', 'freckles', 'freebase', 'freebee', 'freebie', 'freedom', 'freefall', 'freehand', 'freeing', 'freeload', 'freely', 'freemason', 'freeness', 'freestyle', 'freeware', 'freeway', 'freewill', 'freezable', 'freezing', 'freight', 'french', 'frenzied', 'frenzy', 'frequency', 'frequent', 'fresh', 'fretful', 'fretted', 'friction', 'friday', 'fridge', 'fried', 'friend', 'frighten', 'frightful', 'frigidity', 'frigidly', 'frill', 'fringe', 'frisbee', 'frisk', 'fritter', 'frivolous', 'frolic', 'from', 'front', 'frostbite', 'frosted', 'frostily', 'frosting', 'frostlike', 'frosty', 'froth', 'frown', 'frozen', 'fructose', 'frugality', 'frugally', 'fruit', 'frustrate', 'frying', 'gab', 'gaffe', 'gag', 'gainfully', 'gaining', 'gains', 'gala', 'gallantly', 'galleria', 'gallery', 'galley', 'gallon', 'gallows', 'gallstone', 'galore', 'galvanize', 'gambling', 'game', 'gaming', 'gamma', 'gander', 'gangly', 'gangrene', 'gangway', 'gap', 'garage', 'garbage', 'garden', 'gargle', 'garland', 'garlic', 'garment', 'garnet', 'garnish', 'garter', 'gas', 'gatherer', 'gathering', 'gating', 'gauging', 'gauntlet', 'gauze', 'gave', 'gawk', 'gazing', 'gear', 'gecko', 'geek', 'geiger', 'gem', 'gender', 'generic', 'generous', 'genetics', 'genre', 'gentile', 'gentleman', 'gently', 'gents', 'geography', 'geologic', 'geologist', 'geology', 'geometric', 'geometry', 'geranium', 'gerbil', 'geriatric', 'germicide', 'germinate', 'germless', 'germproof', 'gestate', 'gestation', 'gesture', 'getaway', 'getting', 'getup', 'giant', 'gibberish', 'giblet', 'giddily', 'giddiness', 'giddy', 'gift', 'gigabyte', 'gigahertz', 'gigantic', 'giggle', 'giggling', 'giggly', 'gigolo', 'gilled', 'gills', 'gimmick', 'girdle', 'giveaway', 'given', 'giver', 'giving', 'gizmo', 'gizzard', 'glacial', 'glacier', 'glade', 'gladiator', 'gladly', 'glamorous', 'glamour', 'glance', 'glancing', 'glandular', 'glare', 'glaring', 'glass', 'glaucoma', 'glazing', 'gleaming', 'gleeful', 'glider', 'gliding', 'glimmer', 'glimpse', 'glisten', 'glitch', 'glitter', 'glitzy', 'gloater', 'gloating', 'gloomily', 'gloomy', 'glorified', 'glorifier', 'glorify', 'glorious', 'glory', 'gloss', 'glove', 'glowing', 'glowworm', 'glucose', 'glue', 'gluten', 'glutinous', 'glutton', 'gnarly', 'gnat', 'goal', 'goatskin', 'goes', 'goggles', 'going', 'goldfish', 'goldmine', 'goldsmith', 'golf', 'goliath', 'gonad', 'gondola', 'gone', 'gong', 'good', 'gooey', 'goofball', 'goofiness', 'goofy', 'google', 'goon', 'gopher', 'gore', 'gorged', 'gorgeous', 'gory', 'gosling', 'gossip', 'gothic', 'gotten', 'gout', 'gown', 'grab', 'graceful', 'graceless', 'gracious', 'gradation', 'graded', 'grader', 'gradient', 'grading', 'gradually', 'graduate', 'graffiti', 'grafted', 'grafting', 'grain', 'granddad', 'grandkid', 'grandly', 'grandma', 'grandpa', 'grandson', 'granite', 'granny', 'granola', 'grant', 'granular', 'grape', 'graph', 'grapple', 'grappling', 'grasp', 'grass', 'gratified', 'gratify', 'grating', 'gratitude', 'gratuity', 'gravel', 'graveness', 'graves', 'graveyard', 'gravitate', 'gravity', 'gravy', 'gray', 'grazing', 'greasily', 'greedily', 'greedless', 'greedy', 'green', 'greeter', 'greeting', 'grew', 'greyhound', 'grid', 'grief', 'grievance', 'grieving', 'grievous', 'grill', 'grimace', 'grimacing', 'grime', 'griminess', 'grimy', 'grinch', 'grinning', 'grip', 'gristle', 'grit', 'groggily', 'groggy', 'groin', 'groom', 'groove', 'grooving', 'groovy', 'grope', 'ground', 'grouped', 'grout', 'grove', 'grower', 'growing', 'growl', 'grub', 'grudge', 'grudging', 'grueling', 'gruffly', 'grumble', 'grumbling', 'grumbly', 'grumpily', 'grunge', 'grunt', 'guacamole', 'guidable', 'guidance', 'guide', 'guiding', 'guileless', 'guise', 'gulf', 'gullible', 'gully', 'gulp', 'gumball', 'gumdrop', 'gumminess', 'gumming', 'gummy', 'gurgle', 'gurgling', 'guru', 'gush', 'gusto', 'gusty', 'gutless', 'guts', 'gutter', 'guy', 'guzzler', 'gyration', 'habitable', 'habitant', 'habitat', 'habitual', 'hacked', 'hacker', 'hacking', 'hacksaw', 'had', 'haggler', 'haiku', 'half', 'halogen', 'halt', 'halved', 'halves', 'hamburger', 'hamlet', 'hammock', 'hamper', 'hamster', 'hamstring', 'handbag', 'handball', 'handbook', 'handbrake', 'handcart', 'handclap', 'handclasp', 'handcraft', 'handcuff', 'handed', 'handful', 'handgrip', 'handgun', 'handheld', 'handiness', 'handiwork', 'handlebar', 'handled', 'handler', 'handling', 'handmade', 'handoff', 'handpick', 'handprint', 'handrail', 'handsaw', 'handset', 'handsfree', 'handshake', 'handstand', 'handwash', 'handwork', 'handwoven', 'handwrite', 'handyman', 'hangnail', 'hangout', 'hangover', 'hangup', 'hankering', 'hankie', 'hanky', 'haphazard', 'happening', 'happier', 'happiest', 'happily', 'happiness', 'happy', 'harbor', 'hardcopy', 'hardcore', 'hardcover', 'harddisk', 'hardened', 'hardener', 'hardening', 'hardhat', 'hardhead', 'hardiness', 'hardly', 'hardness', 'hardship', 'hardware', 'hardwired', 'hardwood', 'hardy', 'harmful', 'harmless', 'harmonica', 'harmonics', 'harmonize', 'harmony', 'harness', 'harpist', 'harsh', 'harvest', 'hash', 'hassle', 'haste', 'hastily', 'hastiness', 'hasty', 'hatbox', 'hatchback', 'hatchery', 'hatchet', 'hatching', 'hatchling', 'hate', 'hatless', 'hatred', 'haunt', 'haven', 'hazard', 'hazelnut', 'hazily', 'haziness', 'hazing', 'hazy', 'headache', 'headband', 'headboard', 'headcount', 'headdress', 'headed', 'header', 'headfirst', 'headgear', 'heading', 'headlamp', 'headless', 'headlock', 'headphone', 'headpiece', 'headrest', 'headroom', 'headscarf', 'headset', 'headsman', 'headstand', 'headstone', 'headway', 'headwear', 'heap', 'heat', 'heave', 'heavily', 'heaviness', 'heaving', 'hedge', 'hedging', 'heftiness', 'hefty', 'helium', 'helmet', 'helper', 'helpful', 'helping', 'helpless', 'helpline', 'hemlock', 'hemstitch', 'hence', 'henchman', 'henna', 'herald', 'herbal', 'herbicide', 'herbs', 'heritage', 'hermit', 'heroics', 'heroism', 'herring', 'herself', 'hertz', 'hesitancy', 'hesitant', 'hesitate', 'hexagon', 'hexagram', 'hubcap', 'huddle', 'huddling', 'huff', 'hug', 'hula', 'hulk', 'hull', 'human', 'humble', 'humbling', 'humbly', 'humid', 'humiliate', 'humility', 'humming', 'hummus', 'humongous', 'humorist', 'humorless', 'humorous', 'humpback', 'humped', 'humvee', 'hunchback', 'hundredth', 'hunger', 'hungrily', 'hungry', 'hunk', 'hunter', 'hunting', 'huntress', 'huntsman', 'hurdle', 'hurled', 'hurler', 'hurling', 'hurray', 'hurricane', 'hurried', 'hurry', 'hurt', 'husband', 'hush', 'husked', 'huskiness', 'hut', 'hybrid', 'hydrant', 'hydrated', 'hydration', 'hydrogen', 'hydroxide', 'hyperlink', 'hypertext', 'hyphen', 'hypnoses', 'hypnosis', 'hypnotic', 'hypnotism', 'hypnotist', 'hypnotize', 'hypocrisy', 'hypocrite', 'ibuprofen', 'ice', 'iciness', 'icing', 'icky', 'icon', 'icy', 'idealism', 'idealist', 'idealize', 'ideally', 'idealness', 'identical', 'identify', 'identity', 'ideology', 'idiocy', 'idiom', 'idly', 'igloo', 'ignition', 'ignore', 'iguana', 'illicitly', 'illusion', 'illusive', 'image', 'imaginary', 'imagines', 'imaging', 'imbecile', 'imitate', 'imitation', 'immature', 'immerse', 'immersion', 'imminent', 'immobile', 'immodest', 'immorally', 'immortal', 'immovable', 'immovably', 'immunity', 'immunize', 'impaired', 'impale', 'impart', 'impatient', 'impeach', 'impeding', 'impending', 'imperfect', 'imperial', 'impish', 'implant', 'implement', 'implicate', 'implicit', 'implode', 'implosion', 'implosive', 'imply', 'impolite', 'important', 'importer', 'impose', 'imposing', 'impotence', 'impotency', 'impotent', 'impound', 'imprecise', 'imprint', 'imprison', 'impromptu', 'improper', 'improve', 'improving', 'improvise', 'imprudent', 'impulse', 'impulsive', 'impure', 'impurity', 'iodine', 'iodize', 'ion', 'ipad', 'iphone', 'ipod', 'irate', 'irk', 'iron', 'irregular', 'irrigate', 'irritable', 'irritably', 'irritant', 'irritate', 'islamic', 'islamist', 'isolated', 'isolating', 'isolation', 'isotope', 'issue', 'issuing', 'italicize', 'italics', 'item', 'itinerary', 'itunes', 'ivory', 'ivy', 'jab', 'jackal', 'jacket', 'jackknife', 'jackpot', 'jailbird', 'jailbreak', 'jailer', 'jailhouse', 'jalapeno', 'jam', 'janitor', 'january', 'jargon', 'jarring', 'jasmine', 'jaundice', 'jaunt', 'java', 'jawed', 'jawless', 'jawline', 'jaws', 'jaybird', 'jaywalker', 'jazz', 'jeep', 'jeeringly', 'jellied', 'jelly', 'jersey', 'jester', 'jet', 'jiffy', 'jigsaw', 'jimmy', 'jingle', 'jingling', 'jinx', 'jitters', 'jittery', 'job', 'jockey', 'jockstrap', 'jogger', 'jogging', 'john', 'joining', 'jokester', 'jokingly', 'jolliness', 'jolly', 'jolt', 'jot', 'jovial', 'joyfully', 'joylessly', 'joyous', 'joyride', 'joystick', 'jubilance', 'jubilant', 'judge', 'judgingly', 'judicial', 'judiciary', 'judo', 'juggle', 'juggling', 'jugular', 'juice', 'juiciness', 'juicy', 'jujitsu', 'jukebox', 'july', 'jumble', 'jumbo', 'jump', 'junction', 'juncture', 'june', 'junior', 'juniper', 'junkie', 'junkman', 'junkyard', 'jurist', 'juror', 'jury', 'justice', 'justifier', 'justify', 'justly', 'justness', 'juvenile', 'kabob', 'kangaroo', 'karaoke', 'karate', 'karma', 'kebab', 'keenly', 'keenness', 'keep', 'keg', 'kelp', 'kennel', 'kept', 'kerchief', 'kerosene', 'kettle', 'kick', 'kiln', 'kilobyte', 'kilogram', 'kilometer', 'kilowatt', 'kilt', 'kimono', 'kindle', 'kindling', 'kindly', 'kindness', 'kindred', 'kinetic', 'kinfolk', 'king', 'kinship', 'kinsman', 'kinswoman', 'kissable', 'kisser', 'kissing', 'kitchen', 'kite', 'kitten', 'kitty', 'kiwi', 'kleenex', 'knapsack', 'knee', 'knelt', 'knickers', 'knoll', 'koala', 'kooky', 'kosher', 'krypton', 'kudos', 'kung', 'labored', 'laborer', 'laboring', 'laborious', 'labrador', 'ladder', 'ladies', 'ladle', 'ladybug', 'ladylike', 'lagged', 'lagging', 'lagoon', 'lair', 'lake', 'lance', 'landed', 'landfall', 'landfill', 'landing', 'landlady', 'landless', 'landline', 'landlord', 'landmark', 'landmass', 'landmine', 'landowner', 'landscape', 'landside', 'landslide', 'language', 'lankiness', 'lanky', 'lantern', 'lapdog', 'lapel', 'lapped', 'lapping', 'laptop', 'lard', 'large', 'lark', 'lash', 'lasso', 'last', 'latch', 'late', 'lather', 'latitude', 'latrine', 'latter', 'latticed', 'launch', 'launder', 'laundry', 'laurel', 'lavender', 'lavish', 'laxative', 'lazily', 'laziness', 'lazy', 'lecturer', 'left', 'legacy', 'legal', 'legend', 'legged', 'leggings', 'legible', 'legibly', 'legislate', 'lego', 'legroom', 'legume', 'legwarmer', 'legwork', 'lemon', 'lend', 'length', 'lens', 'lent', 'leotard', 'lesser', 'letdown', 'lethargic', 'lethargy', 'letter', 'lettuce', 'level', 'leverage', 'levers', 'levitate', 'levitator', 'liability', 'liable', 'liberty', 'librarian', 'library', 'licking', 'licorice', 'lid', 'life', 'lifter', 'lifting', 'liftoff', 'ligament', 'likely', 'likeness', 'likewise', 'liking', 'lilac', 'lilly', 'lily', 'limb', 'limeade', 'limelight', 'limes', 'limit', 'limping', 'limpness', 'line', 'lingo', 'linguini', 'linguist', 'lining', 'linked', 'linoleum', 'linseed', 'lint', 'lion', 'lip', 'liquefy', 'liqueur', 'liquid', 'lisp', 'list', 'litigate', 'litigator', 'litmus', 'litter', 'little', 'livable', 'lived', 'lively', 'liver', 'livestock', 'lividly', 'living', 'lizard', 'lubricant', 'lubricate', 'lucid', 'luckily', 'luckiness', 'luckless', 'lucrative', 'ludicrous', 'lugged', 'lukewarm', 'lullaby', 'lumber', 'luminance', 'luminous', 'lumpiness', 'lumping', 'lumpish', 'lunacy', 'lunar', 'lunchbox', 'luncheon', 'lunchroom', 'lunchtime', 'lung', 'lurch', 'lure', 'luridness', 'lurk', 'lushly', 'lushness', 'luster', 'lustfully', 'lustily', 'lustiness', 'lustrous', 'lusty', 'luxurious', 'luxury', 'lying', 'lyrically', 'lyricism', 'lyricist', 'lyrics', 'macarena', 'macaroni', 'macaw', 'mace', 'machine', 'machinist', 'magazine', 'magenta', 'maggot', 'magical', 'magician', 'magma', 'magnesium', 'magnetic', 'magnetism', 'magnetize', 'magnifier', 'magnify', 'magnitude', 'magnolia', 'mahogany', 'maimed', 'majestic', 'majesty', 'majorette', 'majority', 'makeover', 'maker', 'makeshift', 'making', 'malformed', 'malt', 'mama', 'mammal', 'mammary', 'mammogram', 'manager', 'managing', 'manatee', 'mandarin', 'mandate', 'mandatory', 'mandolin', 'manger', 'mangle', 'mango', 'mangy', 'manhandle', 'manhole', 'manhood', 'manhunt', 'manicotti', 'manicure', 'manifesto', 'manila', 'mankind', 'manlike', 'manliness', 'manly', 'manmade', 'manned', 'mannish', 'manor', 'manpower', 'mantis', 'mantra', 'manual', 'many', 'map', 'marathon', 'marauding', 'marbled', 'marbles', 'marbling', 'march', 'mardi', 'margarine', 'margarita', 'margin', 'marigold', 'marina', 'marine', 'marital', 'maritime', 'marlin', 'marmalade', 'maroon', 'married', 'marrow', 'marry', 'marshland', 'marshy', 'marsupial', 'marvelous', 'marxism', 'mascot', 'masculine', 'mashed', 'mashing', 'massager', 'masses', 'massive', 'mastiff', 'matador', 'matchbook', 'matchbox', 'matcher', 'matching', 'matchless', 'material', 'maternal', 'maternity', 'math', 'mating', 'matriarch', 'matrimony', 'matrix', 'matron', 'matted', 'matter', 'maturely', 'maturing', 'maturity', 'mauve', 'maverick', 'maximize', 'maximum', 'maybe', 'mayday', 'mayflower', 'moaner', 'moaning', 'mobile', 'mobility', 'mobilize', 'mobster', 'mocha', 'mocker', 'mockup', 'modified', 'modify', 'modular', 'modulator', 'module', 'moisten', 'moistness', 'moisture', 'molar', 'molasses', 'mold', 'molecular', 'molecule', 'molehill', 'mollusk', 'mom', 'monastery', 'monday', 'monetary', 'monetize', 'moneybags', 'moneyless', 'moneywise', 'mongoose', 'mongrel', 'monitor', 'monkhood', 'monogamy', 'monogram', 'monologue', 'monopoly', 'monorail', 'monotone', 'monotype', 'monoxide', 'monsieur', 'monsoon', 'monstrous', 'monthly', 'monument', 'moocher', 'moodiness', 'moody', 'mooing', 'moonbeam', 'mooned', 'moonlight', 'moonlike', 'moonlit', 'moonrise', 'moonscape', 'moonshine', 'moonstone', 'moonwalk', 'mop', 'morale', 'morality', 'morally', 'morbidity', 'morbidly', 'morphine', 'morphing', 'morse', 'mortality', 'mortally', 'mortician', 'mortified', 'mortify', 'mortuary', 'mosaic', 'mossy', 'most', 'mothball', 'mothproof', 'motion', 'motivate', 'motivator', 'motive', 'motocross', 'motor', 'motto', 'mountable', 'mountain', 'mounted', 'mounting', 'mourner', 'mournful', 'mouse', 'mousiness', 'moustache', 'mousy', 'mouth', 'movable', 'move', 'movie', 'moving', 'mower', 'mowing', 'much', 'muck', 'mud', 'mug', 'mulberry', 'mulch', 'mule', 'mulled', 'mullets', 'multiple', 'multiply', 'multitask', 'multitude', 'mumble', 'mumbling', 'mumbo', 'mummified', 'mummify', 'mummy', 'mumps', 'munchkin', 'mundane', 'municipal', 'muppet', 'mural', 'murkiness', 'murky', 'murmuring', 'muscular', 'museum', 'mushily', 'mushiness', 'mushroom', 'mushy', 'music', 'musket', 'muskiness', 'musky', 'mustang', 'mustard', 'muster', 'mustiness', 'musty', 'mutable', 'mutate', 'mutation', 'mute', 'mutilated', 'mutilator', 'mutiny', 'mutt', 'mutual', 'muzzle', 'myself', 'myspace', 'mystified', 'mystify', 'myth', 'nacho', 'nag', 'nail', 'name', 'naming', 'nanny', 'nanometer', 'nape', 'napkin', 'napped', 'napping', 'nappy', 'narrow', 'nastily', 'nastiness', 'national', 'native', 'nativity', 'natural', 'nature', 'naturist', 'nautical', 'navigate', 'navigator', 'navy', 'nearby', 'nearest', 'nearly', 'nearness', 'neatly', 'neatness', 'nebula', 'nebulizer', 'nectar', 'negate', 'negation', 'negative', 'neglector', 'negligee', 'negligent', 'negotiate', 'nemeses', 'nemesis', 'neon', 'nephew', 'nerd', 'nervous', 'nervy', 'nest', 'net', 'neurology', 'neuron', 'neurosis', 'neurotic', 'neuter', 'neutron', 'never', 'next', 'nibble', 'nickname', 'nicotine', 'niece', 'nifty', 'nimble', 'nimbly', 'nineteen', 'ninetieth', 'ninja', 'nintendo', 'ninth', 'nuclear', 'nuclei', 'nucleus', 'nugget', 'nullify', 'number', 'numbing', 'numbly', 'numbness', 'numeral', 'numerate', 'numerator', 'numeric', 'numerous', 'nuptials', 'nursery', 'nursing', 'nurture', 'nutcase', 'nutlike', 'nutmeg', 'nutrient', 'nutshell', 'nuttiness', 'nutty', 'nuzzle', 'nylon', 'oaf', 'oak', 'oasis', 'oat', 'obedience', 'obedient', 'obituary', 'object', 'obligate', 'obliged', 'oblivion', 'oblivious', 'oblong', 'obnoxious', 'oboe', 'obscure', 'obscurity', 'observant', 'observer', 'observing', 'obsessed', 'obsession', 'obsessive', 'obsolete', 'obstacle', 'obstinate', 'obstruct', 'obtain', 'obtrusive', 'obtuse', 'obvious', 'occultist', 'occupancy', 'occupant', 'occupier', 'occupy', 'ocean', 'ocelot', 'octagon', 'octane', 'october', 'octopus', 'ogle', 'oil', 'oink', 'ointment', 'okay', 'old', 'olive', 'olympics', 'omega', 'omen', 'ominous', 'omission', 'omit', 'omnivore', 'onboard', 'oncoming', 'ongoing', 'onion', 'online', 'onlooker', 'only', 'onscreen', 'onset', 'onshore', 'onslaught', 'onstage', 'onto', 'onward', 'onyx', 'oops', 'ooze', 'oozy', 'opacity', 'opal', 'open', 'operable', 'operate', 'operating', 'operation', 'operative', 'operator', 'opium', 'opossum', 'opponent', 'oppose', 'opposing', 'opposite', 'oppressed', 'oppressor', 'opt', 'opulently', 'osmosis', 'other', 'otter', 'ouch', 'ought', 'ounce', 'outage', 'outback', 'outbid', 'outboard', 'outbound', 'outbreak', 'outburst', 'outcast', 'outclass', 'outcome', 'outdated', 'outdoors', 'outer', 'outfield', 'outfit', 'outflank', 'outgoing', 'outgrow', 'outhouse', 'outing', 'outlast', 'outlet', 'outline', 'outlook', 'outlying', 'outmatch', 'outmost', 'outnumber', 'outplayed', 'outpost', 'outpour', 'output', 'outrage', 'outrank', 'outreach', 'outright', 'outscore', 'outsell', 'outshine', 'outshoot', 'outsider', 'outskirts', 'outsmart', 'outsource', 'outspoken', 'outtakes', 'outthink', 'outward', 'outweigh', 'outwit', 'oval', 'ovary', 'oven', 'overact', 'overall', 'overarch', 'overbid', 'overbill', 'overbite', 'overblown', 'overboard', 'overbook', 'overbuilt', 'overcast', 'overcoat', 'overcome', 'overcook', 'overcrowd', 'overdraft', 'overdrawn', 'overdress', 'overdrive', 'overdue', 'overeager', 'overeater', 'overexert', 'overfed', 'overfeed', 'overfill', 'overflow', 'overfull', 'overgrown', 'overhand', 'overhang', 'overhaul', 'overhead', 'overhear', 'overheat', 'overhung', 'overjoyed', 'overkill', 'overlabor', 'overlaid', 'overlap', 'overlay', 'overload', 'overlook', 'overlord', 'overlying', 'overnight', 'overpass', 'overpay', 'overplant', 'overplay', 'overpower', 'overprice', 'overrate', 'overreach', 'overreact', 'override', 'overripe', 'overrule', 'overrun', 'overshoot', 'overshot', 'oversight', 'oversized', 'oversleep', 'oversold', 'overspend', 'overstate', 'overstay', 'overstep', 'overstock', 'overstuff', 'oversweet', 'overtake', 'overthrow', 'overtime', 'overtly', 'overtone', 'overture', 'overturn', 'overuse', 'overvalue', 'overview', 'overwrite', 'owl', 'oxford', 'oxidant', 'oxidation', 'oxidize', 'oxidizing', 'oxygen', 'oxymoron', 'oyster', 'ozone', 'paced', 'pacemaker', 'pacific', 'pacifier', 'pacifism', 'pacifist', 'pacify', 'padded', 'padding', 'paddle', 'paddling', 'padlock', 'pagan', 'pager', 'paging', 'pajamas', 'palace', 'palatable', 'palm', 'palpable', 'palpitate', 'paltry', 'pampered', 'pamperer', 'pampers', 'pamphlet', 'panama', 'pancake', 'pancreas', 'panda', 'pandemic', 'pang', 'panhandle', 'panic', 'panning', 'panorama', 'panoramic', 'panther', 'pantomime', 'pantry', 'pants', 'pantyhose', 'paparazzi', 'papaya', 'paper', 'paprika', 'papyrus', 'parabola', 'parachute', 'parade', 'paradox', 'paragraph', 'parakeet', 'paralegal', 'paralyses', 'paralysis', 'paralyze', 'paramedic', 'parameter', 'paramount', 'parasail', 'parasite', 'parasitic', 'parcel', 'parched', 'parchment', 'pardon', 'parish', 'parka', 'parking', 'parkway', 'parlor', 'parmesan', 'parole', 'parrot', 'parsley', 'parsnip', 'partake', 'parted', 'parting', 'partition', 'partly', 'partner', 'partridge', 'party', 'passable', 'passably', 'passage', 'passcode', 'passenger', 'passerby', 'passing', 'passion', 'passive', 'passivism', 'passover', 'passport', 'password', 'pasta', 'pasted', 'pastel', 'pastime', 'pastor', 'pastrami', 'pasture', 'pasty', 'patchwork', 'patchy', 'paternal', 'paternity', 'path', 'patience', 'patient', 'patio', 'patriarch', 'patriot', 'patrol', 'patronage', 'patronize', 'pauper', 'pavement', 'paver', 'pavestone', 'pavilion', 'paving', 'pawing', 'payable', 'payback', 'paycheck', 'payday', 'payee', 'payer', 'paying', 'payment', 'payphone', 'payroll', 'pebble', 'pebbly', 'pecan', 'pectin', 'peculiar', 'peddling', 'pediatric', 'pedicure', 'pedigree', 'pedometer', 'pegboard', 'pelican', 'pellet', 'pelt', 'pelvis', 'penalize', 'penalty', 'pencil', 'pendant', 'pending', 'penholder', 'penknife', 'pennant', 'penniless', 'penny', 'penpal', 'pension', 'pentagon', 'pentagram', 'pep', 'perceive', 'percent', 'perch', 'percolate', 'perennial', 'perfected', 'perfectly', 'perfume', 'periscope', 'perish', 'perjurer', 'perjury', 'perkiness', 'perky', 'perm', 'peroxide', 'perpetual', 'perplexed', 'persecute', 'persevere', 'persuaded', 'persuader', 'pesky', 'peso', 'pessimism', 'pessimist', 'pester', 'pesticide', 'petal', 'petite', 'petition', 'petri', 'petroleum', 'petted', 'petticoat', 'pettiness', 'petty', 'petunia', 'phantom', 'phobia', 'phoenix', 'phonebook', 'phoney', 'phonics', 'phoniness', 'phony', 'phosphate', 'photo', 'phrase', 'phrasing', 'placard', 'placate', 'placidly', 'plank', 'planner', 'plant', 'plasma', 'plaster', 'plastic', 'plated', 'platform', 'plating', 'platinum', 'platonic', 'platter', 'platypus', 'plausible', 'plausibly', 'playable', 'playback', 'player', 'playful', 'playgroup', 'playhouse', 'playing', 'playlist', 'playmaker', 'playmate', 'playoff', 'playpen', 'playroom', 'playset', 'plaything', 'playtime', 'plaza', 'pleading', 'pleat', 'pledge', 'plentiful', 'plenty', 'plethora', 'plexiglas', 'pliable', 'plod', 'plop', 'plot', 'plow', 'ploy', 'pluck', 'plug', 'plunder', 'plunging', 'plural', 'plus', 'plutonium', 'plywood', 'poach', 'pod', 'poem', 'poet', 'pogo', 'pointed', 'pointer', 'pointing', 'pointless', 'pointy', 'poise', 'poison', 'poker', 'poking', 'polar', 'police', 'policy', 'polio', 'polish', 'politely', 'polka', 'polo', 'polyester', 'polygon', 'polygraph', 'polymer', 'poncho', 'pond', 'pony', 'popcorn', 'pope', 'poplar', 'popper', 'poppy', 'popsicle', 'populace', 'popular', 'populate', 'porcupine', 'pork', 'porous', 'porridge', 'portable', 'portal', 'portfolio', 'porthole', 'portion', 'portly', 'portside', 'poser', 'posh', 'posing', 'possible', 'possibly', 'possum', 'postage', 'postal', 'postbox', 'postcard', 'posted', 'poster', 'posting', 'postnasal', 'posture', 'postwar', 'pouch', 'pounce', 'pouncing', 'pound', 'pouring', 'pout', 'powdered', 'powdering', 'powdery', 'power', 'powwow', 'pox', 'praising', 'prance', 'prancing', 'pranker', 'prankish', 'prankster', 'prayer', 'praying', 'preacher', 'preaching', 'preachy', 'preamble', 'precinct', 'precise', 'precision', 'precook', 'precut', 'predator', 'predefine', 'predict', 'preface', 'prefix', 'preflight', 'preformed', 'pregame', 'pregnancy', 'pregnant', 'preheated', 'prelaunch', 'prelaw', 'prelude', 'premiere', 'premises', 'premium', 'prenatal', 'preoccupy', 'preorder', 'prepaid', 'prepay', 'preplan', 'preppy', 'preschool', 'prescribe', 'preseason', 'preset', 'preshow', 'president', 'presoak', 'press', 'presume', 'presuming', 'preteen', 'pretended', 'pretender', 'pretense', 'pretext', 'pretty', 'pretzel', 'prevail', 'prevalent', 'prevent', 'preview', 'previous', 'prewar', 'prewashed', 'prideful', 'pried', 'primal', 'primarily', 'primary', 'primate', 'primer', 'primp', 'princess', 'print', 'prior', 'prism', 'prison', 'prissy', 'pristine', 'privacy', 'private', 'privatize', 'prize', 'proactive', 'probable', 'probably', 'probation', 'probe', 'probing', 'probiotic', 'problem', 'procedure', 'process', 'proclaim', 'procreate', 'procurer', 'prodigal', 'prodigy', 'produce', 'product', 'profane', 'profanity', 'professed', 'professor', 'profile', 'profound', 'profusely', 'progeny', 'prognosis', 'program', 'progress', 'projector', 'prologue', 'prolonged', 'promenade', 'prominent', 'promoter', 'promotion', 'prompter', 'promptly', 'prone', 'prong', 'pronounce', 'pronto', 'proofing', 'proofread', 'proofs', 'propeller', 'properly', 'property', 'proponent', 'proposal', 'propose', 'props', 'prorate', 'protector', 'protegee', 'proton', 'prototype', 'protozoan', 'protract', 'protrude', 'proud', 'provable', 'proved', 'proven', 'provided', 'provider', 'providing', 'province', 'proving', 'provoke', 'provoking', 'provolone', 'prowess', 'prowler', 'prowling', 'proximity', 'proxy', 'prozac', 'prude', 'prudishly', 'prune', 'pruning', 'pry', 'psychic', 'public', 'publisher', 'pucker', 'pueblo', 'pug', 'pull', 'pulmonary', 'pulp', 'pulsate', 'pulse', 'pulverize', 'puma', 'pumice', 'pummel', 'punch', 'punctual', 'punctuate', 'punctured', 'pungent', 'punisher', 'punk', 'pupil', 'puppet', 'puppy', 'purchase', 'pureblood', 'purebred', 'purely', 'pureness', 'purgatory', 'purge', 'purging', 'purifier', 'purify', 'purist', 'puritan', 'purity', 'purple', 'purplish', 'purposely', 'purr', 'purse', 'pursuable', 'pursuant', 'pursuit', 'purveyor', 'pushcart', 'pushchair', 'pusher', 'pushiness', 'pushing', 'pushover', 'pushpin', 'pushup', 'pushy', 'putdown', 'putt', 'puzzle', 'puzzling', 'pyramid', 'pyromania', 'python', 'quack', 'quadrant', 'quail', 'quaintly', 'quake', 'quaking', 'qualified', 'qualifier', 'qualify', 'quality', 'qualm', 'quantum', 'quarrel', 'quarry', 'quartered', 'quarterly', 'quarters', 'quartet', 'quench', 'query', 'quicken', 'quickly', 'quickness', 'quicksand', 'quickstep', 'quiet', 'quill', 'quilt', 'quintet', 'quintuple', 'quirk', 'quit', 'quiver', 'quizzical', 'quotable', 'quotation', 'quote', 'rabid', 'race', 'racing', 'racism', 'rack', 'racoon', 'radar', 'radial', 'radiance', 'radiantly', 'radiated', 'radiation', 'radiator', 'radio', 'radish', 'raffle', 'raft', 'rage', 'ragged', 'raging', 'ragweed', 'raider', 'railcar', 'railing', 'railroad', 'railway', 'raisin', 'rake', 'raking', 'rally', 'ramble', 'rambling', 'ramp', 'ramrod', 'ranch', 'rancidity', 'random', 'ranged', 'ranger', 'ranging', 'ranked', 'ranking', 'ransack', 'ranting', 'rants', 'rare', 'rarity', 'rascal', 'rash', 'rasping', 'ravage', 'raven', 'ravine', 'raving', 'ravioli', 'ravishing', 'reabsorb', 'reach', 'reacquire', 'reaction', 'reactive', 'reactor', 'reaffirm', 'ream', 'reanalyze', 'reappear', 'reapply', 'reappoint', 'reapprove', 'rearrange', 'rearview', 'reason', 'reassign', 'reassure', 'reattach', 'reawake', 'rebalance', 'rebate', 'rebel', 'rebirth', 'reboot', 'reborn', 'rebound', 'rebuff', 'rebuild', 'rebuilt', 'reburial', 'rebuttal', 'recall', 'recant', 'recapture', 'recast', 'recede', 'recent', 'recess', 'recharger', 'recipient', 'recital', 'recite', 'reckless', 'reclaim', 'recliner', 'reclining', 'recluse', 'reclusive', 'recognize', 'recoil', 'recollect', 'recolor', 'reconcile', 'reconfirm', 'reconvene', 'recopy', 'record', 'recount', 'recoup', 'recovery', 'recreate', 'rectal', 'rectangle', 'rectified', 'rectify', 'recycled', 'recycler', 'recycling', 'reemerge', 'reenact', 'reenter', 'reentry', 'reexamine', 'referable', 'referee', 'reference', 'refill', 'refinance', 'refined', 'refinery', 'refining', 'refinish', 'reflected', 'reflector', 'reflex', 'reflux', 'refocus', 'refold', 'reforest', 'reformat', 'reformed', 'reformer', 'reformist', 'refract', 'refrain', 'refreeze', 'refresh', 'refried', 'refueling', 'refund', 'refurbish', 'refurnish', 'refusal', 'refuse', 'refusing', 'refutable', 'refute', 'regain', 'regalia', 'regally', 'reggae', 'regime', 'region', 'register', 'registrar', 'registry', 'regress', 'regretful', 'regroup', 'regular', 'regulate', 'regulator', 'rehab', 'reheat', 'rehire', 'rehydrate', 'reimburse', 'reissue', 'reiterate', 'rejoice', 'rejoicing', 'rejoin', 'rekindle', 'relapse', 'relapsing', 'relatable', 'related', 'relation', 'relative', 'relax', 'relay', 'relearn', 'release', 'relenting', 'reliable', 'reliably', 'reliance', 'reliant', 'relic', 'relieve', 'relieving', 'relight', 'relish', 'relive', 'reload', 'relocate', 'relock', 'reluctant', 'rely', 'remake', 'remark', 'remarry', 'rematch', 'remedial', 'remedy', 'remember', 'reminder', 'remindful', 'remission', 'remix', 'remnant', 'remodeler', 'remold', 'remorse', 'remote', 'removable', 'removal', 'removed', 'remover', 'removing', 'rename', 'renderer', 'rendering', 'rendition', 'renegade', 'renewable', 'renewably', 'renewal', 'renewed', 'renounce', 'renovate', 'renovator', 'rentable', 'rental', 'rented', 'renter', 'reoccupy', 'reoccur', 'reopen', 'reorder', 'repackage', 'repacking', 'repaint', 'repair', 'repave', 'repaying', 'repayment', 'repeal', 'repeated', 'repeater', 'repent', 'rephrase', 'replace', 'replay', 'replica', 'reply', 'reporter', 'repose', 'repossess', 'repost', 'repressed', 'reprimand', 'reprint', 'reprise', 'reproach', 'reprocess', 'reproduce', 'reprogram', 'reps', 'reptile', 'reptilian', 'repugnant', 'repulsion', 'repulsive', 'repurpose', 'reputable', 'reputably', 'request', 'require', 'requisite', 'reroute', 'rerun', 'resale', 'resample', 'rescuer', 'reseal', 'research', 'reselect', 'reseller', 'resemble', 'resend', 'resent', 'reset', 'reshape', 'reshoot', 'reshuffle', 'residence', 'residency', 'resident', 'residual', 'residue', 'resigned', 'resilient', 'resistant', 'resisting', 'resize', 'resolute', 'resolved', 'resonant', 'resonate', 'resort', 'resource', 'respect', 'resubmit', 'result', 'resume', 'resupply', 'resurface', 'resurrect', 'retail', 'retainer', 'retaining', 'retake', 'retaliate', 'retention', 'rethink', 'retinal', 'retired', 'retiree', 'retiring', 'retold', 'retool', 'retorted', 'retouch', 'retrace', 'retract', 'retrain', 'retread', 'retreat', 'retrial', 'retrieval', 'retriever', 'retry', 'return', 'retying', 'retype', 'reunion', 'reunite', 'reusable', 'reuse', 'reveal', 'reveler', 'revenge', 'revenue', 'reverb', 'revered', 'reverence', 'reverend', 'reversal', 'reverse', 'reversing', 'reversion', 'revert', 'revisable', 'revise', 'revision', 'revisit', 'revivable', 'revival', 'reviver', 'reviving', 'revocable', 'revoke', 'revolt', 'revolver', 'revolving', 'reward', 'rewash', 'rewind', 'rewire', 'reword', 'rework', 'rewrap', 'rewrite', 'rhyme', 'ribbon', 'ribcage', 'rice', 'riches', 'richly', 'richness', 'rickety', 'ricotta', 'riddance', 'ridden', 'ride', 'riding', 'rifling', 'rift', 'rigging', 'rigid', 'rigor', 'rimless', 'rimmed', 'rind', 'rink', 'rinse', 'rinsing', 'riot', 'ripcord', 'ripeness', 'ripening', 'ripping', 'ripple', 'rippling', 'riptide', 'rise', 'rising', 'risk', 'risotto', 'ritalin', 'ritzy', 'rival', 'riverbank', 'riverbed', 'riverboat', 'riverside', 'riveter', 'riveting', 'roamer', 'roaming', 'roast', 'robbing', 'robe', 'robin', 'robotics', 'robust', 'rockband', 'rocker', 'rocket', 'rockfish', 'rockiness', 'rocking', 'rocklike', 'rockslide', 'rockstar', 'rocky', 'rogue', 'roman', 'romp', 'rope', 'roping', 'roster', 'rosy', 'rotten', 'rotting', 'rotunda', 'roulette', 'rounding', 'roundish', 'roundness', 'roundup', 'roundworm', 'routine', 'routing', 'rover', 'roving', 'royal', 'rubbed', 'rubber', 'rubbing', 'rubble', 'rubdown', 'ruby', 'ruckus', 'rudder', 'rug', 'ruined', 'rule', 'rumble', 'rumbling', 'rummage', 'rumor', 'runaround', 'rundown', 'runner', 'running', 'runny', 'runt', 'runway', 'rupture', 'rural', 'ruse', 'rush', 'rust', 'rut', 'sabbath', 'sabotage', 'sacrament', 'sacred', 'sacrifice', 'sadden', 'saddlebag', 'saddled', 'saddling', 'sadly', 'sadness', 'safari', 'safeguard', 'safehouse', 'safely', 'safeness', 'saffron', 'saga', 'sage', 'sagging', 'saggy', 'said', 'saint', 'sake', 'salad', 'salami', 'salaried', 'salary', 'saline', 'salon', 'saloon', 'salsa', 'salt', 'salutary', 'salute', 'salvage', 'salvaging', 'salvation', 'same', 'sample', 'sampling', 'sanction', 'sanctity', 'sanctuary', 'sandal', 'sandbag', 'sandbank', 'sandbar', 'sandblast', 'sandbox', 'sanded', 'sandfish', 'sanding', 'sandlot', 'sandpaper', 'sandpit', 'sandstone', 'sandstorm', 'sandworm', 'sandy', 'sanitary', 'sanitizer', 'sank', 'santa', 'sapling', 'sappiness', 'sappy', 'sarcasm', 'sarcastic', 'sardine', 'sash', 'sasquatch', 'sassy', 'satchel', 'satiable', 'satin', 'satirical', 'satisfied', 'satisfy', 'saturate', 'saturday', 'sauciness', 'saucy', 'sauna', 'savage', 'savanna', 'saved', 'savings', 'savior', 'savor', 'saxophone', 'say', 'scabbed', 'scabby', 'scalded', 'scalding', 'scale', 'scaling', 'scallion', 'scallop', 'scalping', 'scam', 'scandal', 'scanner', 'scanning', 'scant', 'scapegoat', 'scarce', 'scarcity', 'scarecrow', 'scared', 'scarf', 'scarily', 'scariness', 'scarring', 'scary', 'scavenger', 'scenic', 'schedule', 'schematic', 'scheme', 'scheming', 'schilling', 'schnapps', 'scholar', 'science', 'scientist', 'scion', 'scoff', 'scolding', 'scone', 'scoop', 'scooter', 'scope', 'scorch', 'scorebook', 'scorecard', 'scored', 'scoreless', 'scorer', 'scoring', 'scorn', 'scorpion', 'scotch', 'scoundrel', 'scoured', 'scouring', 'scouting', 'scouts', 'scowling', 'scrabble', 'scraggly', 'scrambled', 'scrambler', 'scrap', 'scratch', 'scrawny', 'screen', 'scribble', 'scribe', 'scribing', 'scrimmage', 'script', 'scroll', 'scrooge', 'scrounger', 'scrubbed', 'scrubber', 'scruffy', 'scrunch', 'scrutiny', 'scuba', 'scuff', 'sculptor', 'sculpture', 'scurvy', 'scuttle', 'secluded', 'secluding', 'seclusion', 'second', 'secrecy', 'secret', 'sectional', 'sector', 'secular', 'securely', 'security', 'sedan', 'sedate', 'sedation', 'sedative', 'sediment', 'seduce', 'seducing', 'segment', 'seismic', 'seizing', 'seldom', 'selected', 'selection', 'selective', 'selector', 'self', 'seltzer', 'semantic', 'semester', 'semicolon', 'semifinal', 'seminar', 'semisoft', 'semisweet', 'senate', 'senator', 'send', 'senior', 'senorita', 'sensation', 'sensitive', 'sensitize', 'sensually', 'sensuous', 'sepia', 'september', 'septic', 'septum', 'sequel', 'sequence', 'sequester', 'series', 'sermon', 'serotonin', 'serpent', 'serrated', 'serve', 'service', 'serving', 'sesame', 'sessions', 'setback', 'setting', 'settle', 'settling', 'setup', 'sevenfold', 'seventeen', 'seventh', 'seventy', 'severity', 'shabby', 'shack', 'shaded', 'shadily', 'shadiness', 'shading', 'shadow', 'shady', 'shaft', 'shakable', 'shakily', 'shakiness', 'shaking', 'shaky', 'shale', 'shallot', 'shallow', 'shame', 'shampoo', 'shamrock', 'shank', 'shanty', 'shape', 'shaping', 'share', 'sharpener', 'sharper', 'sharpie', 'sharply', 'sharpness', 'shawl', 'sheath', 'shed', 'sheep', 'sheet', 'shelf', 'shell', 'shelter', 'shelve', 'shelving', 'sherry', 'shield', 'shifter', 'shifting', 'shiftless', 'shifty', 'shimmer', 'shimmy', 'shindig', 'shine', 'shingle', 'shininess', 'shining', 'shiny', 'ship', 'shirt', 'shivering', 'shock', 'shone', 'shoplift', 'shopper', 'shopping', 'shoptalk', 'shore', 'shortage', 'shortcake', 'shortcut', 'shorten', 'shorter', 'shorthand', 'shortlist', 'shortly', 'shortness', 'shorts', 'shortwave', 'shorty', 'shout', 'shove', 'showbiz', 'showcase', 'showdown', 'shower', 'showgirl', 'showing', 'showman', 'shown', 'showoff', 'showpiece', 'showplace', 'showroom', 'showy', 'shrank', 'shrapnel', 'shredder', 'shredding', 'shrewdly', 'shriek', 'shrill', 'shrimp', 'shrine', 'shrink', 'shrivel', 'shrouded', 'shrubbery', 'shrubs', 'shrug', 'shrunk', 'shucking', 'shudder', 'shuffle', 'shuffling', 'shun', 'shush', 'shut', 'shy', 'siamese', 'siberian', 'sibling', 'siding', 'sierra', 'siesta', 'sift', 'sighing', 'silenced', 'silencer', 'silent', 'silica', 'silicon', 'silk', 'silliness', 'silly', 'silo', 'silt', 'silver', 'similarly', 'simile', 'simmering', 'simple', 'simplify', 'simply', 'sincere', 'sincerity', 'singer', 'singing', 'single', 'singular', 'sinister', 'sinless', 'sinner', 'sinuous', 'sip', 'siren', 'sister', 'sitcom', 'sitter', 'sitting', 'situated', 'situation', 'sixfold', 'sixteen', 'sixth', 'sixties', 'sixtieth', 'sixtyfold', 'sizable', 'sizably', 'size', 'sizing', 'sizzle', 'sizzling', 'skater', 'skating', 'skedaddle', 'skeletal', 'skeleton', 'skeptic', 'sketch', 'skewed', 'skewer', 'skid', 'skied', 'skier', 'skies', 'skiing', 'skilled', 'skillet', 'skillful', 'skimmed', 'skimmer', 'skimming', 'skimpily', 'skincare', 'skinhead', 'skinless', 'skinning', 'skinny', 'skintight', 'skipper', 'skipping', 'skirmish', 'skirt', 'skittle', 'skydiver', 'skylight', 'skyline', 'skype', 'skyrocket', 'skyward', 'slab', 'slacked', 'slacker', 'slacking', 'slackness', 'slacks', 'slain', 'slam', 'slander', 'slang', 'slapping', 'slapstick', 'slashed', 'slashing', 'slate', 'slather', 'slaw', 'sled', 'sleek', 'sleep', 'sleet', 'sleeve', 'slept', 'sliceable', 'sliced', 'slicer', 'slicing', 'slick', 'slider', 'slideshow', 'sliding', 'slighted', 'slighting', 'slightly', 'slimness', 'slimy', 'slinging', 'slingshot', 'slinky', 'slip', 'slit', 'sliver', 'slobbery', 'slogan', 'sloped', 'sloping', 'sloppily', 'sloppy', 'slot', 'slouching', 'slouchy', 'sludge', 'slug', 'slum', 'slurp', 'slush', 'sly', 'small', 'smartly', 'smartness', 'smasher', 'smashing', 'smashup', 'smell', 'smelting', 'smile', 'smilingly', 'smirk', 'smite', 'smith', 'smitten', 'smock', 'smog', 'smoked', 'smokeless', 'smokiness', 'smoking', 'smoky', 'smolder', 'smooth', 'smother', 'smudge', 'smudgy', 'smuggler', 'smuggling', 'smugly', 'smugness', 'snack', 'snagged', 'snaking', 'snap', 'snare', 'snarl', 'snazzy', 'sneak', 'sneer', 'sneeze', 'sneezing', 'snide', 'sniff', 'snippet', 'snipping', 'snitch', 'snooper', 'snooze', 'snore', 'snoring', 'snorkel', 'snort', 'snout', 'snowbird', 'snowboard', 'snowbound', 'snowcap', 'snowdrift', 'snowdrop', 'snowfall', 'snowfield', 'snowflake', 'snowiness', 'snowless', 'snowman', 'snowplow', 'snowshoe', 'snowstorm', 'snowsuit', 'snowy', 'snub', 'snuff', 'snuggle', 'snugly', 'snugness', 'speak', 'spearfish', 'spearhead', 'spearman', 'spearmint', 'species', 'specimen', 'specked', 'speckled', 'specks', 'spectacle', 'spectator', 'spectrum', 'speculate', 'speech', 'speed', 'spellbind', 'speller', 'spelling', 'spendable', 'spender', 'spending', 'spent', 'spew', 'sphere', 'spherical', 'sphinx', 'spider', 'spied', 'spiffy', 'spill', 'spilt', 'spinach', 'spinal', 'spindle', 'spinner', 'spinning', 'spinout', 'spinster', 'spiny', 'spiral', 'spirited', 'spiritism', 'spirits', 'spiritual', 'splashed', 'splashing', 'splashy', 'splatter', 'spleen', 'splendid', 'splendor', 'splice', 'splicing', 'splinter', 'splotchy', 'splurge', 'spoilage', 'spoiled', 'spoiler', 'spoiling', 'spoils', 'spoken', 'spokesman', 'sponge', 'spongy', 'sponsor', 'spoof', 'spookily', 'spooky', 'spool', 'spoon', 'spore', 'sporting', 'sports', 'sporty', 'spotless', 'spotlight', 'spotted', 'spotter', 'spotting', 'spotty', 'spousal', 'spouse', 'spout', 'sprain', 'sprang', 'sprawl', 'spray', 'spree', 'sprig', 'spring', 'sprinkled', 'sprinkler', 'sprint', 'sprite', 'sprout', 'spruce', 'sprung', 'spry', 'spud', 'spur', 'sputter', 'spyglass', 'squabble', 'squad', 'squall', 'squander', 'squash', 'squatted', 'squatter', 'squatting', 'squeak', 'squealer', 'squealing', 'squeamish', 'squeegee', 'squeeze', 'squeezing', 'squid', 'squiggle', 'squiggly', 'squint', 'squire', 'squirt', 'squishier', 'squishy', 'stability', 'stabilize', 'stable', 'stack', 'stadium', 'staff', 'stage', 'staging', 'stagnant', 'stagnate', 'stainable', 'stained', 'staining', 'stainless', 'stalemate', 'staleness', 'stalling', 'stallion', 'stamina', 'stammer', 'stamp', 'stand', 'stank', 'staple', 'stapling', 'starboard', 'starch', 'stardom', 'stardust', 'starfish', 'stargazer', 'staring', 'stark', 'starless', 'starlet', 'starlight', 'starlit', 'starring', 'starry', 'starship', 'starter', 'starting', 'startle', 'startling', 'startup', 'starved', 'starving', 'stash', 'state', 'static', 'statistic', 'statue', 'stature', 'status', 'statute', 'statutory', 'staunch', 'stays', 'steadfast', 'steadier', 'steadily', 'steadying', 'steam', 'steed', 'steep', 'steerable', 'steering', 'steersman', 'stegosaur', 'stellar', 'stem', 'stench', 'stencil', 'step', 'stereo', 'sterile', 'sterility', 'sterilize', 'sterling', 'sternness', 'sternum', 'stew', 'stick', 'stiffen', 'stiffly', 'stiffness', 'stifle', 'stifling', 'stillness', 'stilt', 'stimulant', 'stimulate', 'stimuli', 'stimulus', 'stinger', 'stingily', 'stinging', 'stingray', 'stingy', 'stinking', 'stinky', 'stipend', 'stipulate', 'stir', 'stitch', 'stock', 'stoic', 'stoke', 'stole', 'stomp', 'stonewall', 'stoneware', 'stonework', 'stoning', 'stony', 'stood', 'stooge', 'stool', 'stoop', 'stoplight', 'stoppable', 'stoppage', 'stopped', 'stopper', 'stopping', 'stopwatch', 'storable', 'storage', 'storeroom', 'storewide', 'storm', 'stout', 'stove', 'stowaway', 'stowing', 'straddle', 'straggler', 'strained', 'strainer', 'straining', 'strangely', 'stranger', 'strangle', 'strategic', 'strategy', 'stratus', 'straw', 'stray', 'streak', 'stream', 'street', 'strength', 'strenuous', 'strep', 'stress', 'stretch', 'strewn', 'stricken', 'strict', 'stride', 'strife', 'strike', 'striking', 'strive', 'striving', 'strobe', 'strode', 'stroller', 'strongbox', 'strongly', 'strongman', 'struck', 'structure', 'strudel', 'struggle', 'strum', 'strung', 'strut', 'stubbed', 'stubble', 'stubbly', 'stubborn', 'stucco', 'stuck', 'student', 'studied', 'studio', 'study', 'stuffed', 'stuffing', 'stuffy', 'stumble', 'stumbling', 'stump', 'stung', 'stunned', 'stunner', 'stunning', 'stunt', 'stupor', 'sturdily', 'sturdy', 'styling', 'stylishly', 'stylist', 'stylized', 'stylus', 'suave', 'subarctic', 'subatomic', 'subdivide', 'subdued', 'subduing', 'subfloor', 'subgroup', 'subheader', 'subject', 'sublease', 'sublet', 'sublevel', 'sublime', 'submarine', 'submerge', 'submersed', 'submitter', 'subpanel', 'subpar', 'subplot', 'subprime', 'subscribe', 'subscript', 'subsector', 'subside', 'subsiding', 'subsidize', 'subsidy', 'subsoil', 'subsonic', 'substance', 'subsystem', 'subtext', 'subtitle', 'subtly', 'subtotal', 'subtract', 'subtype', 'suburb', 'subway', 'subwoofer', 'subzero', 'succulent', 'such', 'suction', 'sudden', 'sudoku', 'suds', 'sufferer', 'suffering', 'suffice', 'suffix', 'suffocate', 'suffrage', 'sugar', 'suggest', 'suing', 'suitable', 'suitably', 'suitcase', 'suitor', 'sulfate', 'sulfide', 'sulfite', 'sulfur', 'sulk', 'sullen', 'sulphate', 'sulphuric', 'sultry', 'superbowl', 'superglue', 'superhero', 'superior', 'superjet', 'superman', 'supermom', 'supernova', 'supervise', 'supper', 'supplier', 'supply', 'support', 'supremacy', 'supreme', 'surcharge', 'surely', 'sureness', 'surface', 'surfacing', 'surfboard', 'surfer', 'surgery', 'surgical', 'surging', 'surname', 'surpass', 'surplus', 'surprise', 'surreal', 'surrender', 'surrogate', 'surround', 'survey', 'survival', 'survive', 'surviving', 'survivor', 'sushi', 'suspect', 'suspend', 'suspense', 'sustained', 'sustainer', 'swab', 'swaddling', 'swagger', 'swampland', 'swan', 'swapping', 'swarm', 'sway', 'swear', 'sweat', 'sweep', 'swell', 'swept', 'swerve', 'swifter', 'swiftly', 'swiftness', 'swimmable', 'swimmer', 'swimming', 'swimsuit', 'swimwear', 'swinger', 'swinging', 'swipe', 'swirl', 'switch', 'swivel', 'swizzle', 'swooned', 'swoop', 'swoosh', 'swore', 'sworn', 'swung', 'sycamore', 'sympathy', 'symphonic', 'symphony', 'symptom', 'synapse', 'syndrome', 'synergy', 'synopses', 'synopsis', 'synthesis', 'synthetic', 'syrup', 'system', 't-shirt', 'tabasco', 'tabby', 'tableful', 'tables', 'tablet', 'tableware', 'tabloid', 'tackiness', 'tacking', 'tackle', 'tackling', 'tacky', 'taco', 'tactful', 'tactical', 'tactics', 'tactile', 'tactless', 'tadpole', 'taekwondo', 'tag', 'tainted', 'take', 'taking', 'talcum', 'talisman', 'tall', 'talon', 'tamale', 'tameness', 'tamer', 'tamper', 'tank', 'tanned', 'tannery', 'tanning', 'tantrum', 'tapeless', 'tapered', 'tapering', 'tapestry', 'tapioca', 'tapping', 'taps', 'tarantula', 'target', 'tarmac', 'tarnish', 'tarot', 'tartar', 'tartly', 'tartness', 'task', 'tassel', 'taste', 'tastiness', 'tasting', 'tasty', 'tattered', 'tattle', 'tattling', 'tattoo', 'taunt', 'tavern', 'thank', 'that', 'thaw', 'theater', 'theatrics', 'thee', 'theft', 'theme', 'theology', 'theorize', 'thermal', 'thermos', 'thesaurus', 'these', 'thesis', 'thespian', 'thicken', 'thicket', 'thickness', 'thieving', 'thievish', 'thigh', 'thimble', 'thing', 'think', 'thinly', 'thinner', 'thinness', 'thinning', 'thirstily', 'thirsting', 'thirsty', 'thirteen', 'thirty', 'thong', 'thorn', 'those', 'thousand', 'thrash', 'thread', 'threaten', 'threefold', 'thrift', 'thrill', 'thrive', 'thriving', 'throat', 'throbbing', 'throng', 'throttle', 'throwaway', 'throwback', 'thrower', 'throwing', 'thud', 'thumb', 'thumping', 'thursday', 'thus', 'thwarting', 'thyself', 'tiara', 'tibia', 'tidal', 'tidbit', 'tidiness', 'tidings', 'tidy', 'tiger', 'tighten', 'tightly', 'tightness', 'tightrope', 'tightwad', 'tigress', 'tile', 'tiling', 'till', 'tilt', 'timid', 'timing', 'timothy', 'tinderbox', 'tinfoil', 'tingle', 'tingling', 'tingly', 'tinker', 'tinkling', 'tinsel', 'tinsmith', 'tint', 'tinwork', 'tiny', 'tipoff', 'tipped', 'tipper', 'tipping', 'tiptoeing', 'tiptop', 'tiring', 'tissue', 'trace', 'tracing', 'track', 'traction', 'tractor', 'trade', 'trading', 'tradition', 'traffic', 'tragedy', 'trailing', 'trailside', 'train', 'traitor', 'trance', 'tranquil', 'transfer', 'transform', 'translate', 'transpire', 'transport', 'transpose', 'trapdoor', 'trapeze', 'trapezoid', 'trapped', 'trapper', 'trapping', 'traps', 'trash', 'travel', 'traverse', 'travesty', 'tray', 'treachery', 'treading', 'treadmill', 'treason', 'treat', 'treble', 'tree', 'trekker', 'tremble', 'trembling', 'tremor', 'trench', 'trend', 'trespass', 'triage', 'trial', 'triangle', 'tribesman', 'tribunal', 'tribune', 'tributary', 'tribute', 'triceps', 'trickery', 'trickily', 'tricking', 'trickle', 'trickster', 'tricky', 'tricolor', 'tricycle', 'trident', 'tried', 'trifle', 'trifocals', 'trillion', 'trilogy', 'trimester', 'trimmer', 'trimming', 'trimness', 'trinity', 'trio', 'tripod', 'tripping', 'triumph', 'trivial', 'trodden', 'trolling', 'trombone', 'trophy', 'tropical', 'tropics', 'trouble', 'troubling', 'trough', 'trousers', 'trout', 'trowel', 'truce', 'truck', 'truffle', 'trump', 'trunks', 'trustable', 'trustee', 'trustful', 'trusting', 'trustless', 'truth', 'try', 'tubby', 'tubeless', 'tubular', 'tucking', 'tuesday', 'tug', 'tuition', 'tulip', 'tumble', 'tumbling', 'tummy', 'turban', 'turbine', 'turbofan', 'turbojet', 'turbulent', 'turf', 'turkey', 'turmoil', 'turret', 'turtle', 'tusk', 'tutor', 'tutu', 'tux', 'tweak', 'tweed', 'tweet', 'tweezers', 'twelve', 'twentieth', 'twenty', 'twerp', 'twice', 'twiddle', 'twiddling', 'twig', 'twilight', 'twine', 'twins', 'twirl', 'twistable', 'twisted', 'twister', 'twisting', 'twisty', 'twitch', 'twitter', 'tycoon', 'tying', 'tyke', 'udder', 'ultimate', 'ultimatum', 'ultra', 'umbilical', 'umbrella', 'umpire', 'unabashed', 'unable', 'unadorned', 'unadvised', 'unafraid', 'unaired', 'unaligned', 'unaltered', 'unarmored', 'unashamed', 'unaudited', 'unawake', 'unaware', 'unbaked', 'unbalance', 'unbeaten', 'unbend', 'unbent', 'unbiased', 'unbitten', 'unblended', 'unblessed', 'unblock', 'unbolted', 'unbounded', 'unboxed', 'unbraided', 'unbridle', 'unbroken', 'unbuckled', 'unbundle', 'unburned', 'unbutton', 'uncanny', 'uncapped', 'uncaring', 'uncertain', 'unchain', 'unchanged', 'uncharted', 'uncheck', 'uncivil', 'unclad', 'unclaimed', 'unclamped', 'unclasp', 'uncle', 'unclip', 'uncloak', 'unclog', 'unclothed', 'uncoated', 'uncoiled', 'uncolored', 'uncombed', 'uncommon', 'uncooked', 'uncork', 'uncorrupt', 'uncounted', 'uncouple', 'uncouth', 'uncover', 'uncross', 'uncrown', 'uncrushed', 'uncured', 'uncurious', 'uncurled', 'uncut', 'undamaged', 'undated', 'undaunted', 'undead', 'undecided', 'undefined', 'underage', 'underarm', 'undercoat', 'undercook', 'undercut', 'underdog', 'underdone', 'underfed', 'underfeed', 'underfoot', 'undergo', 'undergrad', 'underhand', 'underline', 'underling', 'undermine', 'undermost', 'underpaid', 'underpass', 'underpay', 'underrate', 'undertake', 'undertone', 'undertook', 'undertow', 'underuse', 'underwear', 'underwent', 'underwire', 'undesired', 'undiluted', 'undivided', 'undocked', 'undoing', 'undone', 'undrafted', 'undress', 'undrilled', 'undusted', 'undying', 'unearned', 'unearth', 'unease', 'uneasily', 'uneasy', 'uneatable', 'uneaten', 'unedited', 'unelected', 'unending', 'unengaged', 'unenvied', 'unequal', 'unethical', 'uneven', 'unexpired', 'unexposed', 'unfailing', 'unfair', 'unfasten', 'unfazed', 'unfeeling', 'unfiled', 'unfilled', 'unfitted', 'unfitting', 'unfixable', 'unfixed', 'unflawed', 'unfocused', 'unfold', 'unfounded', 'unframed', 'unfreeze', 'unfrosted', 'unfrozen', 'unfunded', 'unglazed', 'ungloved', 'unglue', 'ungodly', 'ungraded', 'ungreased', 'unguarded', 'unguided', 'unhappily', 'unhappy', 'unharmed', 'unhealthy', 'unheard', 'unhearing', 'unheated', 'unhelpful', 'unhidden', 'unhinge', 'unhitched', 'unholy', 'unhook', 'unicorn', 'unicycle', 'unified', 'unifier', 'uniformed', 'uniformly', 'unify', 'unimpeded', 'uninjured', 'uninstall', 'uninsured', 'uninvited', 'union', 'uniquely', 'unisexual', 'unison', 'unissued', 'unit', 'universal', 'universe', 'unjustly', 'unkempt', 'unkind', 'unknotted', 'unknowing', 'unknown', 'unlaced', 'unlatch', 'unlawful', 'unleaded', 'unlearned', 'unleash', 'unless', 'unleveled', 'unlighted', 'unlikable', 'unlimited', 'unlined', 'unlinked', 'unlisted', 'unlit', 'unlivable', 'unloaded', 'unloader', 'unlocked', 'unlocking', 'unlovable', 'unloved', 'unlovely', 'unloving', 'unluckily', 'unlucky', 'unmade', 'unmanaged', 'unmanned', 'unmapped', 'unmarked', 'unmasked', 'unmasking', 'unmatched', 'unmindful', 'unmixable', 'unmixed', 'unmolded', 'unmoral', 'unmovable', 'unmoved', 'unmoving', 'unnamable', 'unnamed', 'unnatural', 'unneeded', 'unnerve', 'unnerving', 'unnoticed', 'unopened', 'unopposed', 'unpack', 'unpadded', 'unpaid', 'unpainted', 'unpaired', 'unpaved', 'unpeeled', 'unpicked', 'unpiloted', 'unpinned', 'unplanned', 'unplanted', 'unpleased', 'unpledged', 'unplowed', 'unplug', 'unpopular', 'unproven', 'unquote', 'unranked', 'unrated', 'unraveled', 'unreached', 'unread', 'unreal', 'unreeling', 'unrefined', 'unrelated', 'unrented', 'unrest', 'unretired', 'unrevised', 'unrigged', 'unripe', 'unrivaled', 'unroasted', 'unrobed', 'unroll', 'unruffled', 'unruly', 'unrushed', 'unsaddle', 'unsafe', 'unsaid', 'unsalted', 'unsaved', 'unsavory', 'unscathed', 'unscented', 'unscrew', 'unsealed', 'unseated', 'unsecured', 'unseeing', 'unseemly', 'unseen', 'unselect', 'unselfish', 'unsent', 'unsettled', 'unshackle', 'unshaken', 'unshaved', 'unshaven', 'unsheathe', 'unshipped', 'unsightly', 'unsigned', 'unskilled', 'unsliced', 'unsmooth', 'unsnap', 'unsocial', 'unsoiled', 'unsold', 'unsolved', 'unsorted', 'unspoiled', 'unspoken', 'unstable', 'unstaffed', 'unstamped', 'unsteady', 'unsterile', 'unstirred', 'unstitch', 'unstopped', 'unstuck', 'unstuffed', 'unstylish', 'unsubtle', 'unsubtly', 'unsuited', 'unsure', 'unsworn', 'untagged', 'untainted', 'untaken', 'untamed', 'untangled', 'untapped', 'untaxed', 'unthawed', 'unthread', 'untidy', 'untie', 'until', 'untimed', 'untimely', 'untitled', 'untoasted', 'untold', 'untouched', 'untracked', 'untrained', 'untreated', 'untried', 'untrimmed', 'untrue', 'untruth', 'unturned', 'untwist', 'untying', 'unusable', 'unused', 'unusual', 'unvalued', 'unvaried', 'unvarying', 'unveiled', 'unveiling', 'unvented', 'unviable', 'unvisited', 'unvocal', 'unwanted', 'unwarlike', 'unwary', 'unwashed', 'unwatched', 'unweave', 'unwed', 'unwelcome', 'unwell', 'unwieldy', 'unwilling', 'unwind', 'unwired', 'unwitting', 'unwomanly', 'unworldly', 'unworn', 'unworried', 'unworthy', 'unwound', 'unwoven', 'unwrapped', 'unwritten', 'unzip', 'upbeat', 'upchuck', 'upcoming', 'upcountry', 'update', 'upfront', 'upgrade', 'upheaval', 'upheld', 'uphill', 'uphold', 'uplifted', 'uplifting', 'upload', 'upon', 'upper', 'upright', 'uprising', 'upriver', 'uproar', 'uproot', 'upscale', 'upside', 'upstage', 'upstairs', 'upstart', 'upstate', 'upstream', 'upstroke', 'upswing', 'uptake', 'uptight', 'uptown', 'upturned', 'upward', 'upwind', 'uranium', 'urban', 'urchin', 'urethane', 'urgency', 'urgent', 'urging', 'urologist', 'urology', 'usable', 'usage', 'useable', 'used', 'uselessly', 'user', 'usher', 'usual', 'utensil', 'utility', 'utilize', 'utmost', 'utopia', 'utter', 'vacancy', 'vacant', 'vacate', 'vacation', 'vagabond', 'vagrancy', 'vagrantly', 'vaguely', 'vagueness', 'valiant', 'valid', 'valium', 'valley', 'valuables', 'value', 'vanilla', 'vanish', 'vanity', 'vanquish', 'vantage', 'vaporizer', 'variable', 'variably', 'varied', 'variety', 'various', 'varmint', 'varnish', 'varsity', 'varying', 'vascular', 'vaseline', 'vastly', 'vastness', 'veal', 'vegan', 'veggie', 'vehicular', 'velcro', 'velocity', 'velvet', 'vendetta', 'vending', 'vendor', 'veneering', 'vengeful', 'venomous', 'ventricle', 'venture', 'venue', 'venus', 'verbalize', 'verbally', 'verbose', 'verdict', 'verify', 'verse', 'version', 'versus', 'vertebrae', 'vertical', 'vertigo', 'very', 'vessel', 'vest', 'veteran', 'veto', 'vexingly', 'viability', 'viable', 'vibes', 'vice', 'vicinity', 'victory', 'video', 'viewable', 'viewer', 'viewing', 'viewless', 'viewpoint', 'vigorous', 'village', 'villain', 'vindicate', 'vineyard', 'vintage', 'violate', 'violation', 'violator', 'violet', 'violin', 'viper', 'viral', 'virtual', 'virtuous', 'virus', 'visa', 'viscosity', 'viscous', 'viselike', 'visible', 'visibly', 'vision', 'visiting', 'visitor', 'visor', 'vista', 'vitality', 'vitalize', 'vitally', 'vitamins', 'vivacious', 'vividly', 'vividness', 'vixen', 'vocalist', 'vocalize', 'vocally', 'vocation', 'voice', 'voicing', 'void', 'volatile', 'volley', 'voltage', 'volumes', 'voter', 'voting', 'voucher', 'vowed', 'vowel', 'voyage', 'wackiness', 'wad', 'wafer', 'waffle', 'waged', 'wager', 'wages', 'waggle', 'wagon', 'wake', 'waking', 'walk', 'walmart', 'walnut', 'walrus', 'waltz', 'wand', 'wannabe', 'wanted', 'wanting', 'wasabi', 'washable', 'washbasin', 'washboard', 'washbowl', 'washcloth', 'washday', 'washed', 'washer', 'washhouse', 'washing', 'washout', 'washroom', 'washstand', 'washtub', 'wasp', 'wasting', 'watch', 'water', 'waviness', 'waving', 'wavy', 'whacking', 'whacky', 'wham', 'wharf', 'wheat', 'whenever', 'whiff', 'whimsical', 'whinny', 'whiny', 'whisking', 'whoever', 'whole', 'whomever', 'whoopee', 'whooping', 'whoops', 'why', 'wick', 'widely', 'widen', 'widget', 'widow', 'width', 'wieldable', 'wielder', 'wife', 'wifi', 'wikipedia', 'wildcard', 'wildcat', 'wilder', 'wildfire', 'wildfowl', 'wildland', 'wildlife', 'wildly', 'wildness', 'willed', 'willfully', 'willing', 'willow', 'willpower', 'wilt', 'wimp', 'wince', 'wincing', 'wind', 'wing', 'winking', 'winner', 'winnings', 'winter', 'wipe', 'wired', 'wireless', 'wiring', 'wiry', 'wisdom', 'wise', 'wish', 'wisplike', 'wispy', 'wistful', 'wizard', 'wobble', 'wobbling', 'wobbly', 'wok', 'wolf', 'wolverine', 'womanhood', 'womankind', 'womanless', 'womanlike', 'womanly', 'womb', 'woof', 'wooing', 'wool', 'woozy', 'word', 'work', 'worried', 'worrier', 'worrisome', 'worry', 'worsening', 'worshiper', 'worst', 'wound', 'woven', 'wow', 'wrangle', 'wrath', 'wreath', 'wreckage', 'wrecker', 'wrecking', 'wrench', 'wriggle', 'wriggly', 'wrinkle', 'wrinkly', 'wrist', 'writing', 'written', 'wrongdoer', 'wronged', 'wrongful', 'wrongly', 'wrongness', 'wrought', 'xbox', 'xerox', 'yahoo', 'yam', 'yanking', 'yapping', 'yard', 'yarn', 'yeah', 'yearbook', 'yearling', 'yearly', 'yearning', 'yeast', 'yelling', 'yelp', 'yen', 'yesterday', 'yiddish', 'yield', 'yin', 'yippee', 'yo-yo', 'yodel', 'yoga', 'yogurt', 'yonder', 'yoyo', 'yummy', 'zap', 'zealous', 'zebra', 'zen', 'zeppelin', 'zero', 'zestfully', 'zesty', 'zigzagged', 'zipfile', 'zipping', 'zippy', 'zips', 'zit', 'zodiac', 'zombie', 'zone', 'zoning', 'zookeeper', 'zoologist', 'zoology', 'zoom'];
    const rmSymbArr = ['-', '/', '(', ')', '.'];
    for (let ri = 0; ri < rmSymbArr.length; ri++) {
        rwArr = rwArr.filter(w => !w.includes(rmSymbArr[ri]));
    }
    ;
    rwArr = rwArr.filter(w => w.length > 5);
    const c = rwArr.length;
    const word1 = rwArr[(Math.floor(Math.random() * c))];
    rwArr = rwArr.filter(w => w !== word1);
    const word2 = rwArr[(Math.floor(Math.random() * c))];
    rwArr = rwArr.filter(w => w !== word2);
    const word3 = rwArr[(Math.floor(Math.random() * c))];
    const rand3WordStr = word1 + ' ' + word2 + ' ' + word3;
    return Promise.resolve(rand3WordStr);
};
exports.randomST = randomST;
//# sourceMappingURL=appTypes.js.map