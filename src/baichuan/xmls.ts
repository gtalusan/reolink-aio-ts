export const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" ?>\n';

type TemplateParams = Record<string, string | number | boolean>;

function format(template: string, params: TemplateParams = {}): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      return "";
    }
    return String(value);
  });
}

const LOGIN_XML_TEMPLATE = `${XML_HEADER}<body>
<LoginUser version="1.1">
<userName>{userName}</userName>
<password>{password}</password>
<userVer>1</userVer>
</LoginUser>
<LoginNet version="1.1">
<type>LAN</type>
<udpPort>0</udpPort>
</LoginNet>
</body>
`;

const LOGOUT_XML_TEMPLATE = `${XML_HEADER}<body>
<LoginUser version="1.1">
<userName>{userName}</userName>
<password>{password}</password>
<userVer>1</userVer>
</LoginUser>
</body>
`;

const CHANNEL_EXTENSION_XML_TEMPLATE = `${XML_HEADER}<Extension version="1.1">
<channelId>{channel}</channelId>
</Extension>
`;

const DING_DONG_OPT_1_TEMPLATE = `${XML_HEADER}<body>
<dingdongDeviceOpt version="1.1">
<opt>delDevice</opt>
<id>{chime_id}</id>
</dingdongDeviceOpt>
</body>
`;

const DING_DONG_OPT_2_TEMPLATE = `${XML_HEADER}<body>
<dingdongDeviceOpt version="1.1">
<id>{chime_id}</id>
<opt>getParam</opt>
</dingdongDeviceOpt>
</body>
`;

const DING_DONG_OPT_3_TEMPLATE = `${XML_HEADER}<body>
<dingdongDeviceOpt version="1.1">
<opt>setParam</opt>
<id>{chime_id}</id>
<volLevel>{vol}</volLevel>
<ledState>{led}</ledState>
<name>{name}</name>
</dingdongDeviceOpt>
</body>
`;

const DING_DONG_OPT_4_TEMPLATE = `${XML_HEADER}<body>
<dingdongDeviceOpt version="1.1">
<id>{chime_id}</id>
<opt>ringWithMusic</opt>
<musicId>{tone_id}</musicId>
</dingdongDeviceOpt>
</body>
`;

const SET_DING_DONG_CFG_TEMPLATE = `${XML_HEADER}<body>
<dingdongCfg version="1.1">
<deviceCfg>
<id>{chime_id}</id>
<alarminCfg>
<valid>{state}</valid>
<musicId>{tone_id}</musicId>
<type>{event_type}</type>
</alarminCfg>
</deviceCfg>
</dingdongCfg>
</body>
`;

const DING_DONG_SILENT_TEMPLATE = `${XML_HEADER}<body>
<dingdongSilentMode version="1.1">
<id>{chime_id}</id>
</dingdongSilentMode>
</body>
`;

const SET_DING_DONG_SILENT_TEMPLATE = `${XML_HEADER}<body>
<dingdongSilentMode version="1.1">
<id>{chime_id}</id>
<time>{time}</time>
<type>63</type>
</dingdongSilentMode>
</body>
`;

const GET_DING_DONG_CTRL_TEMPLATE = `${XML_HEADER}<body>
<dingdongCtrl version="1.1">
<opt>machineStateGet</opt>
</dingdongCtrl>
</body>
`;

const SET_DING_DONG_CTRL_TEMPLATE = `${XML_HEADER}<body>
<dingdongCtrl version="1.1">
<opt>machineStateSet</opt>
<type>{chime_type}</type>
<bopen>{enabled}</bopen>
<bsave>1</bsave>
<time>{time}</time>
</dingdongCtrl>
</body>
`;

const QUICK_REPLY_PLAY_TEMPLATE = `${XML_HEADER}<body>
<audioFileInfo version="1.1">
<channelId>{channel}</channelId>
<id>{file_id}</id>
<timeout>0</timeout>
</audioFileInfo>
</body>
`;

const SET_REC_ENABLE_TEMPLATE = `${XML_HEADER}<body>
<Record version="1.1">
<channelId>{channel}</channelId>
<enable>{enable}</enable>
</Record>
</body>
`;

const SET_PRIVACY_MODE_TEMPLATE = `${XML_HEADER}<body>
<sleepState version="1.1">
<operate>2</operate>
<sleep>{enable}</sleep>
</sleepState>
</body>`;

const GET_SCENE_INFO_TEMPLATE = `${XML_HEADER}<body>
<sceneCfg version="1.1">
<id>{scene_id}</id>
</sceneCfg>
</body>`;

const DISABLE_SCENE_TEMPLATE = `${XML_HEADER}<body>
<sceneModeCfg version="1.1">
<enable>0</enable>
</sceneModeCfg>
</body>`;

const SET_SCENE_TEMPLATE = `${XML_HEADER}<body>
<sceneModeCfg version="1.1">
<enable>1</enable>
<curSceneId>{scene_id}</curSceneId>
</sceneModeCfg>
</body>`;

const FILE_INFO_LIST_OPEN_TEMPLATE = `${XML_HEADER}<body>
<FileInfoList version="1.1">
<FileInfo>
<uid>{uid}</uid>
<searchAITrack>1</searchAITrack>
<channelId>{channel}</channelId>
<logicChnBitmap>255</logicChnBitmap>
<streamType>mainStream</streamType>
<recordType>manual, sched, io, md, people, face, vehicle, dog_cat, visitor, other, package</recordType>
<startTime>
<year>{start_year}</year>
<month>{start_month}</month>
<day>{start_day}</day>
<hour>{start_hour}</hour>
<minute>{start_minute}</minute>
<second>{start_second}</second>
</startTime>
<endTime>
<year>{end_year}</year>
<month>{end_month}</month>
<day>{end_day}</day>
<hour>{end_hour}</hour>
<minute>{end_minute}</minute>
<second>{end_second}</second>
</endTime>
</FileInfo>
</FileInfoList>
</body>`;

const FILE_INFO_LIST_TEMPLATE = `${XML_HEADER}<body>
<FileInfoList version="1.1">
<FileInfo>
<channelId>{channel}</channelId>
<uid>{uid}</uid>
<searchAITrack>1</searchAITrack>
<handle>{handle}</handle>
</FileInfo>
</FileInfoList>
</body>`;

const FIND_REC_VIDEO_OPEN_TEMPLATE = `${XML_HEADER}<body>
<findAlarmVideo version="1.1">
<channelId>{channel}</channelId>
<uid>{uid}</uid>
<logicChnBitmap>255</logicChnBitmap>
<streamType>{stream_type}</streamType>
<notSearchVideo>0</notSearchVideo>
<startTime>
<year>{start_year}</year>
<month>{start_month}</month>
<day>{start_day}</day>
<hour>{start_hour}</hour>
<minute>{start_minute}</minute>
<second>{start_second}</second>
</startTime>
<endTime>
<year>{end_year}</year>
<month>{end_month}</month>
<day>{end_day}</day>
<hour>{end_hour}</hour>
<minute>{end_minute}</minute>
<second>{end_second}</second>
</endTime>
<alarmType>md, pir, io, people, face, vehicle, dog_cat, visitor, other, package, cry, crossline, intrusion, loitering, legacy, loss</alarmType>
</findAlarmVideo>
</body>`;

const FIND_REC_VIDEO_TEMPLATE = `${XML_HEADER}<body>
<findAlarmVideo version="1.1">
<channelId>{channel}</channelId>
<fileHandle>{fileHandle}</fileHandle>
</findAlarmVideo>
</body>`;

const USER_LIST_TEMPLATE = `${XML_HEADER}<Extension version="1.1">
<userName>{username}</userName>
</Extension>`;

const SET_WHITE_LED_TEMPLATE = `${XML_HEADER}<body>
<FloodlightManual version="1.1">
<channelId>{channel}</channelId>
<status>{state}</status>
<duration>180</duration>
</FloodlightManual>
</body>`;

const WIFI_SSID_TEMPLATE = `${XML_HEADER}<body>
<Wifi version="1.1">
<scanAp>0</scanAp>
</Wifi>
</body>`;

const PRE_RECORD_TEMPLATE = `${XML_HEADER}<body>
<longRunModeCfg version="1.1">
<enable>{enable}</enable>
<value>{batteryStop}</value>
<preTime>{preTime}</preTime>
<usePlanList>{schedule}</usePlanList>
<fps>{fps}</fps>
</longRunModeCfg>
</body>`;

const SIREN_MANUAL_TEMPLATE = `${XML_HEADER}<body>
<audioPlayInfo version="1.1">
<channelId>{channel}</channelId>
<playMode>2</playMode>
<playDuration>10</playDuration>
<playTimes>1</playTimes>
<onOff>{enable}</onOff>
</audioPlayInfo>
</body>`;

const SIREN_TIMES_TEMPLATE = `${XML_HEADER}<body>
<audioPlayInfo version="1.1">
<channelId>{channel}</channelId>
<playMode>0</playMode>
<playDuration>10</playDuration>
<playTimes>{times}</playTimes>
<onOff>1</onOff>
</audioPlayInfo>
</body>`;

const SIREN_HUB_MANUAL_TEMPLATE = `${XML_HEADER}<body>
<audioPlayInfo version="1.1">
<playMode>2</playMode>
<playDuration>10</playDuration>
<playTimes>1</playTimes>
<onOff>{enable}</onOff>
</audioPlayInfo>
</body>`;

const SIREN_HUB_TIMES_TEMPLATE = `${XML_HEADER}<body>
<audioPlayInfo version="1.1">
<playMode>0</playMode>
<playDuration>10</playDuration>
<playTimes>{times}</playTimes>
<onOff>1</onOff>
</audioPlayInfo>
</body>`;

const GET_RULE_TEMPLATE = `${XML_HEADER}<body>
<IFTTTList version="1.1">
<id>{rule_id}</id>
</IFTTTList>
</body>`;

const SET_AUTO_FOCUS_TEMPLATE = `${XML_HEADER}<body>
<AutoFocus version="1.1">
<channelId>{channel}</channelId>
<disable>{disable}</disable>
</AutoFocus>
</body>`;

export const BaichuanXml = {
  LOGIN_XML_TEMPLATE,
  LOGOUT_XML_TEMPLATE,
  CHANNEL_EXTENSION_XML_TEMPLATE,
  DING_DONG_OPT_1_TEMPLATE,
  DING_DONG_OPT_2_TEMPLATE,
  DING_DONG_OPT_3_TEMPLATE,
  DING_DONG_OPT_4_TEMPLATE,
  SET_DING_DONG_CFG_TEMPLATE,
  DING_DONG_SILENT_TEMPLATE,
  SET_DING_DONG_SILENT_TEMPLATE,
  GET_DING_DONG_CTRL_TEMPLATE,
  SET_DING_DONG_CTRL_TEMPLATE,
  QUICK_REPLY_PLAY_TEMPLATE,
  SET_REC_ENABLE_TEMPLATE,
  SET_PRIVACY_MODE_TEMPLATE,
  GET_SCENE_INFO_TEMPLATE,
  DISABLE_SCENE_TEMPLATE,
  SET_SCENE_TEMPLATE,
  FILE_INFO_LIST_OPEN_TEMPLATE,
  FILE_INFO_LIST_TEMPLATE,
  FIND_REC_VIDEO_OPEN_TEMPLATE,
  FIND_REC_VIDEO_TEMPLATE,
  USER_LIST_TEMPLATE,
  SET_WHITE_LED_TEMPLATE,
  WIFI_SSID_TEMPLATE,
  PRE_RECORD_TEMPLATE,
  SIREN_MANUAL_TEMPLATE,
  SIREN_TIMES_TEMPLATE,
  SIREN_HUB_MANUAL_TEMPLATE,
  SIREN_HUB_TIMES_TEMPLATE,
  GET_RULE_TEMPLATE,
  SET_AUTO_FOCUS_TEMPLATE
} as const;

export function buildBaichuanXml(template: string, params: TemplateParams = {}): string {
  return format(template, params);
}

export function buildLoginXml(params: TemplateParams): string {
  return buildBaichuanXml(LOGIN_XML_TEMPLATE, params);
}

export function buildLogoutXml(params: TemplateParams): string {
  return buildBaichuanXml(LOGOUT_XML_TEMPLATE, params);
}

export function buildChannelExtensionXml(params: TemplateParams): string {
  return buildBaichuanXml(CHANNEL_EXTENSION_XML_TEMPLATE, params);
}

export type { TemplateParams as BaichuanTemplateParams };

