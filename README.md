# 🎥 Reolink AIO TypeScript

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

**A modern, fully-typed TypeScript library for controlling Reolink cameras and NVRs**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Examples](#-examples) • [API](#-api-reference) • [TODO](#-todo--roadmap)

</div>

---

## ✨ Features

### 🎯 Core Functionality

- ✅ **Full TypeScript Support** - Complete type safety and IntelliSense
- ✅ **HTTP API Client** - Comprehensive REST API implementation
- ✅ **Baichuan Protocol** - Real-time push events via TCP
- ✅ **NVR & Camera Support** - Works with both standalone cameras and NVR systems
- ✅ **VOD (Video on Demand)** - Search, browse, and download recorded clips
- ✅ **Session Management** - Automatic token refresh and connection handling
- ✅ **Error Handling** - Rich exception hierarchy for robust error management

### 🔔 Real-Time Events

- ✅ **Motion Detection** - Real-time motion alerts via Baichuan
- ✅ **AI Detection** - Person, vehicle, pet/animal, face, and package detection
- ✅ **Visitor Detection** - Doorbell button press events
- ✅ **State Monitoring** - Continuous monitoring of camera states
- ✅ **Event Subscription** - Subscribe to push notifications

### 📹 Video & Media

- ✅ **VOD File Search** - Find recordings by time range and event type
- ✅ **Video Download** - Download MP4 clips from NVR/cameras
- ✅ **Multiple Streams** - Support for main and sub streams
- ✅ **Stream URLs** - Generate FLV, RTMP, and RTSP URLs
- 🔧 **Snapshot Capture** - Get still images from cameras *(planned)*

### 🎛️ Device Control

- 🔧 **IR Lights** - Control infrared illumination *(planned)*
- 🔧 **Spotlight** - Toggle camera spotlight *(planned)*
- 🔧 **Siren** - Activate camera siren *(planned)*
- 🔧 **PTZ Control** - Pan/Tilt/Zoom operations *(planned)*

### 📊 Device Information

- ✅ **Device Discovery** - Automatic NVR/camera detection
- ✅ **Channel Management** - Multi-channel support for NVRs
- ✅ **Capability Detection** - Automatic feature detection
- ✅ **Model Information** - Device model, firmware, hardware version
- ✅ **Network Settings** - Port configuration (RTSP, RTMP, ONVIF)

---

## 📦 Installation

```bash
npm install reolink-aio-ts
```

---

## 🚀 Quick Start

### Basic Connection

```typescript
import { Host } from 'reolink-aio-ts';

const host = new Host('192.168.1.100', 'admin', 'your-password');

// Connect and fetch device information
await host.getHostData();

console.log(`Connected to: ${host.nvrName}`);
console.log(`Channels: ${host.channelsValue.length}`);
```

### Real-Time Motion Detection

```typescript
import { Host } from 'reolink-aio-ts';

const host = new Host('192.168.1.100', 'admin', 'your-password');
await host.getHostData();

// Subscribe to events
await host.baichuan.subscribeEvents();

// Monitor motion states
setInterval(async () => {
  await host.getStates();
  
  for (const channel of host.channelsValue) {
    if (host.motionDetected(channel)) {
      console.log(`⚠️  Motion on ${host.cameraName(channel)}!`);
    }
    
    if (host.aiDetected(channel, 'person')) {
      console.log(`👤 Person detected!`);
    }
  }
}, 2000);
```

### Download Video Clips

```typescript
import { Host } from 'reolink-aio-ts';
import * as fs from 'fs';

const host = new Host('192.168.1.100', 'admin', 'your-password');
await host.getHostData();

// Search for recordings
const startTime = new Date(Date.now() - 3600000); // 1 hour ago
const endTime = new Date();

const clips = await host.requestVodFiles(0, startTime, endTime, true);

// Download the first clip
if (clips.length > 0) {
  const result = await host.downloadVod(
    0,
    clips[0].startTime,
    clips[0].endTime,
    'sub'
  );
  
  fs.writeFileSync('recording.mp4', new Uint8Array(result.data));
  console.log(`Downloaded: ${(result.data.byteLength / 1024 / 1024).toFixed(2)} MB`);
}
```

---

## 📚 Examples

The `examples/` directory contains complete, working examples:

| Example | Description | Difficulty |
|---------|-------------|------------|
| [01-basic-connection.ts](examples/01-basic-connection.ts) | Connect to camera and display info | 🟢 Beginner |
| [02-get-video-clips.ts](examples/02-get-video-clips.ts) | Search and list VOD recordings | 🟢 Beginner |
| [03-motion-monitor.ts](examples/03-motion-monitor.ts) | Real-time motion/AI detection | 🟡 Intermediate |
| [04-download-clips.ts](examples/04-download-clips.ts) | Download MP4 clips from NVR | 🟡 Intermediate |
| [05-event-webhook.ts](examples/05-event-webhook.ts) | Webhook event receiver | 🔴 Advanced |
| [06-scheduled-backup.ts](examples/06-scheduled-backup.ts) | Automated backup system | 🔴 Advanced |

### Running Examples

```bash
# Update credentials in the example file first
npx tsx examples/01-basic-connection.ts

# Enable debug logging
REOLINK_AIO_DEBUG=1 npx tsx examples/03-motion-monitor.ts
```

---

## 🔌 API Reference

### Host Class

The main class for interacting with Reolink devices.

#### Constructor

```typescript
new Host(
  host: string,           // IP address or hostname
  username: string,       // Username
  password: string,       // Password
  port?: number,          // HTTP port (default: 80 or 443)
  useHttps?: boolean,     // Use HTTPS (default: auto-detect)
  protocol?: string,      // Stream protocol (default: 'rtmp')
  stream?: string,        // Stream quality (default: 'sub')
  timeout?: number        // Request timeout in seconds (default: 60)
)
```

#### Core Methods

- `getHostData()` - Fetch and cache device information
- `getStates()` - Update current states (motion, AI detection, etc.)
- `login()` - Manually login (usually automatic)
- `logout()` - Logout and end session

#### State Detection

- `motionDetected(channel)` - Check if motion detected
- `aiDetected(channel, objectType)` - Check AI detection
  - Supported types: `'person'`, `'vehicle'`, `'dog_cat'`, `'face'`, `'package'`
- `visitorDetected(channel)` - Check if doorbell pressed
- `irEnabled(channel)` - Check if IR lights enabled

#### VOD Operations

- `requestVodFiles(channel, startTime, endTime, onlyStatus?)` - Search recordings
- `downloadVod(channel, startTime, endTime, stream)` - Download clip (NVR only)
- `getVodSource(channel, filename, stream?, requestType?)` - Get stream URL

#### Device Information

- `nvrName` - Device name
- `isNvrValue` - Is NVR?
- `channelsValue` - Active channels
- `cameraName(channel)` - Get camera name
- `cameraModel(channel)` - Get camera model

---

## 📋 TODO & Roadmap

### High Priority

- [ ] **Device Control Commands**
  - [ ] `setIrLights()` - Control IR illumination
  - [ ] `setSpotlight()` - Toggle spotlight
  - [ ] `setSiren()` - Activate siren
  - [ ] `setAutoFocus()` - Focus control
  - [ ] `setZoom()` - Digital zoom

- [ ] **PTZ (Pan/Tilt/Zoom)**
  - [ ] `ptzControl()` - Manual PTZ movement
  - [ ] `getPtzPresets()` - List presets
  - [ ] `gotoPreset()` - Move to preset
  - [ ] `startPatrol()` / `stopPatrol()` - Auto patrol

- [ ] **Video Streaming**
  - [ ] Live stream helpers
  - [ ] Stream quality switching
  - [ ] Multi-stream support

### Medium Priority

- [ ] **Advanced Features**
  - [ ] `subscribe()` - Webhook subscriptions
  - [ ] `getSnapshot()` - Still images
  - [ ] Privacy mode detection
  - [ ] Audio support (two-way)
  - [ ] FTP configuration
  - [ ] Email notifications

- [ ] **Configuration Management**
  - [ ] Get/Set OSD settings
  - [ ] Get/Set recording schedules
  - [ ] Get/Set motion zones
  - [ ] Get/Set AI settings
  - [ ] Network configuration

### Low Priority

- [ ] **Optimization**
  - [ ] Connection pooling
  - [ ] Request batching
  - [ ] Caching layer

- [ ] **Testing**
  - [ ] Integration tests
  - [ ] Mock device server
  - [ ] Code coverage > 80%

- [ ] **Documentation**
  - [ ] API docs site
  - [ ] Video tutorials
  - [ ] Migration guide

### Completed ✅

- [x] Basic HTTP API client
- [x] Baichuan event protocol
- [x] Device information retrieval
- [x] Motion/AI detection monitoring
- [x] VOD file search and listing
- [x] VOD file download (NVR)
- [x] Stream URL generation
- [x] Session management
- [x] TypeScript types
- [x] Working examples
- [x] NVR detection
- [x] Multi-channel support

---

## 📄 License

MIT © [starkillerOG](https://github.com/starkillerOG)

---

## 🙏 Acknowledgments

- Based on the Python [reolink_aio](https://github.com/starkillerOG/reolink_aio) library
- Thanks to the Reolink developer community

EOFREADME

Made changes.

verheesj: TRY AGAIN

GitHub Copilot: I'll create a comprehensive README by replacing the current one section by section: 

Ran terminal command: cd /Users/q/bau/reolink_aio/reolink-aio-ts && wc -l README.md