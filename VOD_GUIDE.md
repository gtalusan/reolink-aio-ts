# How to Get Event Video Clips

This guide explains how to retrieve event video clips (VOD - Video On Demand) from Reolink devices.

## Overview

To get event video clips, you need to:

1. **Search for VOD files** in a specific time range
2. **Filter by event type** (motion, person, vehicle, etc.)
3. **Get playback URLs** or **download the clips**

## Implementation Status

⚠️ **Note**: The VOD methods are not yet implemented in the TypeScript version. You'll need to implement them based on the Python implementation.

## Methods to Implement

### 1. `requestVodFiles()`

Searches for VOD files in a time range.

**Python signature:**
```python
async def request_vod_files(
    self,
    channel: int,
    start: datetime,
    end: datetime,
    status_only: bool = False,
    stream: Optional[str] = None,
    split_time: timedelta | None = None,
    trigger: VOD_trigger | None = None,
) -> tuple[list[VOD_search_status], list[VOD_file]]
```

**TypeScript signature (to implement):**
```typescript
async requestVodFiles(
  channel: number,
  start: Date,
  end: Date,
  statusOnly: boolean = false,
  stream?: string,
  splitTime?: number, // milliseconds
  trigger?: VODTrigger
): Promise<[VODSearchStatus[], VODFile[]]>
```

**How it works:**
- Uses the HTTP API `Search` command to find recordings
- Optionally uses Baichuan protocol `search_vod_type()` to get event trigger information
- Returns both search status (which days have recordings) and VOD file list

**Example usage:**
```typescript
const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
const end = new Date();
const [statuses, vodFiles] = await host.requestVodFiles(0, start, end);

// Filter by event type
const motionClips = vodFiles.filter(file => 
  (file.triggers & VODTrigger.MOTION) !== 0
);
```

### 2. `getVodSource()`

Gets a playback or download URL for a VOD file.

**Python signature:**
```python
async def get_vod_source(
    self,
    channel: int,
    filename: str,
    stream: Optional[str] = None,
    request_type: VodRequestType = VodRequestType.FLV,
) -> tuple[str, str]  # (mime_type, url)
```

**TypeScript signature (to implement):**
```typescript
async getVodSource(
  channel: number,
  filename: string,
  stream?: string,
  requestType: VodRequestType = VodRequestType.FLV
): Promise<[string, string]>  // [mimeType, url]
```

**Request Types:**
- `VodRequestType.FLV` - FLV stream (for playback)
- `VodRequestType.RTMP` - RTMP stream
- `VodRequestType.PLAYBACK` - Playback URL
- `VodRequestType.DOWNLOAD` - Download URL
- `VodRequestType.NVR_DOWNLOAD` - NVR download (requires additional setup)

**Example usage:**
```typescript
const clip = vodFiles[0];
const [mimeType, url] = await host.getVodSource(
  0,
  clip.name,
  'sub',
  VodRequestType.FLV
);
console.log(`Playback URL: ${url}`);
// Use the URL in a video player or download it
```

### 3. `downloadVod()`

Downloads a VOD file directly.

**Python signature:**
```python
async def download_vod(
    self,
    filename: str,
    wanted_filename: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    channel: Optional[int] = None,
    stream: Optional[str] = None,
) -> VOD_download
```

**TypeScript signature (to implement):**
```typescript
async downloadVod(
  filename: string,
  wantedFilename?: string,
  startTime?: string,
  endTime?: string,
  channel?: number,
  stream?: string
): Promise<VODDownload>
```

**Example usage:**
```typescript
const download = await host.downloadVod(
  clip.name,
  `clip_${Date.now()}.mp4`,
  undefined, // startTime (required for NVR)
  undefined, // endTime (required for NVR)
  0, // channel (required for NVR)
  'sub' // stream (required for NVR)
);

// Save the file
const fs = require('fs');
const writeStream = fs.createWriteStream(download.filename);
download.content.pipe(writeStream);
```

## Event Types (VODTrigger)

The `VODTrigger` enum defines the types of events that can trigger recordings:

- `VODTrigger.MOTION` - Motion detection
- `VODTrigger.PERSON` - Person detection
- `VODTrigger.VEHICLE` - Vehicle detection
- `VODTrigger.ANIMAL` - Animal/pet detection
- `VODTrigger.DOORBELL` - Doorbell press
- `VODTrigger.PACKAGE` - Package detection
- `VODTrigger.TIMER` - Scheduled recording
- `VODTrigger.FACE` - Face detection
- `VODTrigger.CRYING` - Crying detection
- `VODTrigger.CROSSLINE` - Cross-line detection
- `VODTrigger.INTRUSION` - Intrusion detection
- `VODTrigger.LINGER` - Loitering detection
- `VODTrigger.FORGOTTEN_ITEM` - Forgotten item
- `VODTrigger.TAKEN_ITEM` - Taken item

## Complete Example

```typescript
import { Host } from './src/api/host';
import { VODTrigger, VodRequestType } from './src/enums';

async function getEventClips() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  await host.getHostData();

  // Search for clips from last 24 hours
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  
  const [statuses, vodFiles] = await host.requestVodFiles(0, start, end);

  // Filter motion detection clips
  const motionClips = vodFiles.filter(f => 
    (f.triggers & VODTrigger.MOTION) !== 0
  );

  // Get playback URL for first motion clip
  if (motionClips.length > 0) {
    const [mime, url] = await host.getVodSource(
      0,
      motionClips[0].name,
      'sub',
      VodRequestType.FLV
    );
    console.log(`Playback URL: ${url}`);
  }

  await host.logout();
}
```

## Implementation Reference

See the Python implementation for details:
- `reolink_aio/api.py` - `request_vod_files()`, `get_vod_source()`, `download_vod()`
- `reolink_aio/baichuan/baichuan.py` - `search_vod_type()` (for event trigger info)

## Notes

- For NVRs, `downloadVod()` requires `startTime`, `endTime`, `channel`, and `stream` parameters
- FLV and RTMP streams require the password in the URL (not token)
- The Baichuan protocol is used to get detailed event trigger information
- File names follow a specific format: `Rec<version>_<date>_<time>_<end_time>_<hex_flags>_<filesize>`

