export const WAKING_COMMANDS = new Set<string>([
  "GetEnc",
  "GetWhiteLed",
  "GetZoomFocus",
  "GetAudioCfg",
  "GetPtzGuard",
  "GetAutoReply",
  "GetPtzTraceSection",
  "GetAiCfg",
  "GetAiAlarm",
  "GetPtzCurPos",
  "GetAudioAlarm",
  "GetDingDongList",
  "GetDingDongCfg",
  "DingDongOpt",
  "GetPerformance",
  "GetMask",
  "296",
  "483"
]);

export const NONE_WAKING_COMMANDS = new Set<string>([
  "GetIsp",
  "GetEvents",
  "GetMdState",
  "GetAiState",
  "GetIrLights",
  "GetBatteryInfo",
  "GetPirInfo",
  "GetPowerLed",
  "GetAutoFocus",
  "GetDeviceAudioCfg",
  "GetManualRec",
  "GetImage",
  "GetBuzzerAlarmV20",
  "GetEmailV20",
  "GetEmail",
  "GetPushV20",
  "GetPush",
  "GetFtpV20",
  "GetFtp",
  "GetRecV20",
  "GetRec",
  "GetAudioAlarmV20",
  "GetMdAlarm",
  "GetAlarm",
  "GetStateLight",
  "GetHddInfo",
  "GetChannelstatus",
  "GetPushCfg",
  "GetScene",
  "115",
  "208",
  "594"
]);

export const UNKNOWN = "Unknown";

export const MIN_COLOR_TEMP = 3000;
export const MAX_COLOR_TEMP = 6000;

export const AI_DETECT_CONVERSION: Readonly<Record<string, string>> = Object.freeze({
  person: "people",
  pet: "dog_cat"
});

export const YOLO_CONVERSION: Readonly<Record<string, string>> = Object.freeze({
  person: "people",
  "motor vehicle": "vehicle",
  animal: "dog_cat"
});

export const YOLO_DETECTS = new Set<string>(["people", "vehicle", "package", "non-motor vehicle", "dog_cat"]);

export const YOLO_DETECT_TYPES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  people: ["man", "woman"],
  vehicle: ["sedan", "suv", "pickup_truck", "bus", "motorcycle"],
  dog_cat: ["dog", "cat"],
  package: ["package"],
  "non-motor vehicle": ["bicycle"]
});

export const DEFAULT_STREAM = "sub";
export const DEFAULT_PROTOCOL = "rtmp";
export const DEFAULT_TIMEOUT = 30; // seconds
export const DEFAULT_RTMP_AUTH_METHOD = "PASSWORD";
export const DEFAULT_BC_PORT = 9000;

