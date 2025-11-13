export enum SubType {
  push = "push",
  long_poll = "long_poll",
  all = "all"
}

export enum VodRequestType {
  RTMP = "RTMP",
  PLAYBACK = "Playback",
  FLV = "FLV",
  DOWNLOAD = "Download",
  NVR_DOWNLOAD = "NvrDownload"
}

export enum EncodingEnum {
  h264 = "h264",
  h265 = "h265"
}

export enum ExposureEnum {
  auto = "Auto",
  lownoise = "LowNoise",
  antismearing = "Anti-Smearing",
  manual = "Manual"
}

export enum SpotlightModeEnum {
  off = 0,
  auto = 1,
  onatnight = 2,
  schedule = 3,
  autoadaptive = 4,
  adaptive = 5
}

export enum SpotlightEventModeEnum {
  off = "off",
  on = "keepOn",
  flash = "flicker"
}

export enum StatusLedEnum {
  stayoff = "KeepOff",
  auto = "Off",
  alwaysonatnight = "On",
  always = "Always",
  alwayson = "KeepOn"
}

export enum DayNightEnum {
  auto = "Auto",
  color = "Color",
  blackwhite = "Black&White"
}

export enum HDREnum {
  off = 0,
  auto = 1,
  on = 2
}

export enum BinningModeEnum {
  off = 0,
  auto = 1,
  on = 2
}

export enum PtzEnum {
  stop = "Stop",
  left = "Left",
  right = "Right",
  up = "Up",
  down = "Down",
  zoomin = "ZoomInc",
  zoomout = "ZoomDec"
}

export enum GuardEnum {
  set = "setPos",
  goto = "toPos"
}

export enum TrackMethodEnum {
  digital = 2,
  digitalfirst = 3,
  pantiltfirst = 4
}

export enum BatteryEnum {
  discharging = 0,
  charging = 1,
  chargecomplete = 2
}

export enum ChimeToneEnum {
  off = -1,
  citybird = 0,
  originaltune = 1,
  pianokey = 2,
  loop = 3,
  attraction = 4,
  hophop = 5,
  goodday = 6,
  operetta = 7,
  moonlight = 8,
  waybackhome = 9
}

export enum HubToneEnum {
  alarm = -1,
  citybird = 0,
  originaltune = 1,
  pianokey = 2,
  loop = 3,
  attraction = 4,
  hophop = 5,
  goodday = 6,
  operetta = 7,
  moonlight = 8,
  waybackhome = 9
}

export enum HardwiredChimeTypeEnum {
  none = "none",
  mechanical = "machine",
  digital1 = "negativeWave",
  digital2 = "positiveWave"
}

