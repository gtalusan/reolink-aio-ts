/**
 * Subscription type for event notifications
 */
export enum SubType {
  /** Push notification subscription */
  push = "push",
  /** Long polling subscription */
  long_poll = "long_poll",
  /** All subscription types */
  all = "all"
}

/**
 * Video-on-Demand (VOD) request types for playback and download
 */
export enum VodRequestType {
  /** RTMP streaming protocol */
  RTMP = "RTMP",
  /** Standard playback */
  PLAYBACK = "Playback",
  /** FLV streaming format */
  FLV = "FLV",
  /** Direct file download */
  DOWNLOAD = "Download",
  /** NVR-specific download */
  NVR_DOWNLOAD = "NvrDownload"
}

/**
 * Video encoding formats supported by Reolink cameras
 */
export enum EncodingEnum {
  /** H.264 codec */
  h264 = "h264",
  /** H.265/HEVC codec */
  h265 = "h265"
}

/**
 * Camera exposure modes
 */
export enum ExposureEnum {
  /** Automatic exposure adjustment */
  auto = "Auto",
  /** Low noise mode for better image quality in low light */
  lownoise = "LowNoise",
  /** Anti-smearing mode for fast-moving objects */
  antismearing = "Anti-Smearing",
  /** Manual exposure control */
  manual = "Manual"
}

/**
 * Spotlight operation modes
 */
export enum SpotlightModeEnum {
  /** Spotlight always off */
  off = 0,
  /** Automatic activation based on motion */
  auto = 1,
  /** On only at night */
  onatnight = 2,
  /** Scheduled operation */
  schedule = 3,
  /** Auto-adaptive based on environment */
  autoadaptive = 4,
  /** Adaptive mode */
  adaptive = 5
}

/**
 * Spotlight event trigger modes
 */
export enum SpotlightEventModeEnum {
  /** Spotlight off on events */
  off = "off",
  /** Keep spotlight on during events */
  on = "keepOn",
  /** Flash/flicker on events */
  flash = "flicker"
}

/**
 * Status LED operation modes
 */
export enum StatusLedEnum {
  /** LED always off */
  stayoff = "KeepOff",
  /** Auto mode - LED indicates status */
  auto = "Off",
  /** LED always on at night only */
  alwaysonatnight = "On",
  /** LED always on */
  always = "Always",
  /** LED always on (alternative) */
  alwayson = "KeepOn"
}

/**
 * Day/Night mode settings for camera image processing
 */
export enum DayNightEnum {
  /** Automatic day/night switching */
  auto = "Auto",
  /** Force color mode */
  color = "Color",
  /** Force black and white/IR mode */
  blackwhite = "Black&White"
}

/**
 * High Dynamic Range (HDR) settings
 */
export enum HDREnum {
  /** HDR disabled */
  off = 0,
  /** Automatic HDR */
  auto = 1,
  /** HDR always enabled */
  on = 2
}

/**
 * Pixel binning mode for improved low-light performance
 */
export enum BinningModeEnum {
  /** Binning disabled */
  off = 0,
  /** Automatic binning */
  auto = 1,
  /** Binning always enabled */
  on = 2
}

/**
 * Pan-Tilt-Zoom (PTZ) camera movement commands
 */
export enum PtzEnum {
  /** Stop all movement */
  stop = "Stop",
  /** Pan left */
  left = "Left",
  /** Pan right */
  right = "Right",
  /** Tilt up */
  up = "Up",
  /** Tilt down */
  down = "Down",
  /** Zoom in */
  zoomin = "ZoomInc",
  /** Zoom out */
  zoomout = "ZoomDec"
}

/**
 * PTZ guard position commands
 */
export enum GuardEnum {
  /** Set guard position */
  set = "setPos",
  /** Go to guard position */
  goto = "toPos"
}

/**
 * AI tracking methods for PTZ cameras
 */
export enum TrackMethodEnum {
  /** Digital tracking only */
  digital = 2,
  /** Digital tracking preferred */
  digitalfirst = 3,
  /** Pan-tilt tracking preferred */
  pantiltfirst = 4
}

/**
 * Battery charging status
 */
export enum BatteryEnum {
  /** Battery discharging */
  discharging = 0,
  /** Battery charging */
  charging = 1,
  /** Charge complete */
  chargecomplete = 2
}

/**
 * Doorbell chime tone options
 */
export enum ChimeToneEnum {
  /** Chime disabled */
  off = -1,
  /** City bird tone */
  citybird = 0,
  /** Original tune */
  originaltune = 1,
  /** Piano key tone */
  pianokey = 2,
  /** Loop tone */
  loop = 3,
  /** Attraction tone */
  attraction = 4,
  /** Hop hop tone */
  hophop = 5,
  /** Good day tone */
  goodday = 6,
  /** Operetta tone */
  operetta = 7,
  /** Moonlight tone */
  moonlight = 8,
  /** Way back home tone */
  waybackhome = 9
}

/**
 * Hub alarm tone options
 */
export enum HubToneEnum {
  /** Alarm tone */
  alarm = -1,
  /** City bird tone */
  citybird = 0,
  /** Original tune */
  originaltune = 1,
  /** Piano key tone */
  pianokey = 2,
  /** Loop tone */
  loop = 3,
  /** Attraction tone */
  attraction = 4,
  /** Hop hop tone */
  hophop = 5,
  /** Good day tone */
  goodday = 6,
  /** Operetta tone */
  operetta = 7,
  /** Moonlight tone */
  moonlight = 8,
  /** Way back home tone */
  waybackhome = 9
}

/**
 * Hardwired chime types for doorbells
 */
export enum HardwiredChimeTypeEnum {
  /** No hardwired chime */
  none = "none",
  /** Mechanical chime */
  mechanical = "machine",
  /** Digital chime with negative wave */
  digital1 = "negativeWave",
  /** Digital chime with positive wave */
  digital2 = "positiveWave"
}
