/**
 * Example: Live Video Streaming
 * 
 * This example demonstrates how to:
 * 1. Get live stream URLs (RTSP, RTMP, FLV)
 * 2. Capture snapshot images
 * 3. Detect video encoding
 * 4. Use different stream types (main, sub, autotrack)
 */

import { Host } from '../src/api/host';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  host: process.env.REOLINK_NVR_HOST ?? '192.168.0.79',
  username: process.env.REOLINK_NVR_USER ?? 'admin',
  password: process.env.REOLINK_NVR_PASS ?? 'password',
  port: null,  // null for auto-detect
  useHttps: false,
};

async function liveStreamingDemo() {
  console.log('🎥 Reolink Live Streaming Demo\n');

  // Create host instance with RTSP protocol (default is RTMP)
  const host = new Host(
    CONFIG.host,
    CONFIG.username,
    CONFIG.password,
    CONFIG.port,
    CONFIG.useHttps,
    'rtsp',  // Protocol: 'rtsp', 'rtmp', or 'flv'
    'sub'    // Default stream quality: 'main' or 'sub'
  );

  try {
    // Connect and get device info
    console.log('📡 Connecting to camera...');
    await host.getHostData();
    console.log(`✅ Connected to: ${host.nvrName}\n`);

    // Display available channels
    console.log('📹 Available Channels:');
    for (const channel of host.channelsValue) {
      console.log(`   Channel ${channel}: ${host.cameraName(channel)}`);
    }
    console.log();

    // Use first channel for examples
    const channel = host.channelsValue[0];
    if (channel === undefined) {
      console.log('❌ No channels available');
      return;
    }

    console.log(`🎬 Working with Channel ${channel}: ${host.cameraName(channel)}\n`);

    // ========== Get Stream URLs ==========
    console.log('📺 Stream URLs:\n');

    // Get RTSP URL (default protocol for this host instance)
    const rtspUrl = await host.getStreamSource(channel);
    if (rtspUrl) {
      console.log('   RTSP URL (default):');
      console.log(`   ${rtspUrl}`);
      console.log();
    }

    // Get RTSP URL for main stream
    const rtspMainUrl = await host.getRtspStreamSource(channel, 'main');
    if (rtspMainUrl) {
      console.log('   RTSP URL (main stream):');
      console.log(`   ${rtspMainUrl}`);
      console.log();
    }

    // Get RTSP URL for sub stream
    const rtspSubUrl = await host.getRtspStreamSource(channel, 'sub');
    if (rtspSubUrl) {
      console.log('   RTSP URL (sub stream):');
      console.log(`   ${rtspSubUrl}`);
      console.log();
    }

    // Get RTMP URL
    const rtmpUrl = host.getRtmpStreamSource(channel, 'sub');
    if (rtmpUrl) {
      console.log('   RTMP URL:');
      console.log(`   ${rtmpUrl}`);
      console.log();
    }

    // Get FLV URL
    const flvUrl = host.getFlvStreamSource(channel, 'sub');
    if (flvUrl) {
      console.log('   FLV URL:');
      console.log(`   ${flvUrl}`);
      console.log();
    }

    // ========== Video Encoding ==========
    console.log('🎞️  Video Encoding:\n');

    const mainEncoding = await host.getEncoding(channel, 'main');
    console.log(`   Main stream encoding: ${mainEncoding}`);

    const subEncoding = await host.getEncoding(channel, 'sub');
    console.log(`   Sub stream encoding: ${subEncoding}`);
    console.log();

    // ========== Capture Snapshot ==========
    console.log('📸 Capturing Snapshots:\n');

    // Capture main stream snapshot
    const mainSnapshot = await host.getSnapshot(channel, 'main');
    if (mainSnapshot) {
      const filename = `snapshot_ch${channel}_main_${Date.now()}.jpg`;
      const filepath = path.join(__dirname, '..', 'downloads', filename);
      
      // Ensure downloads directory exists
      const downloadsDir = path.join(__dirname, '..', 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      fs.writeFileSync(filepath, mainSnapshot);
      console.log(`   ✅ Main stream snapshot saved: ${filename}`);
      console.log(`      Size: ${(mainSnapshot.length / 1024).toFixed(2)} KB`);
    } else {
      console.log('   ❌ Failed to capture main stream snapshot');
    }

    // Capture sub stream snapshot
    const subSnapshot = await host.getSnapshot(channel, 'sub');
    if (subSnapshot) {
      const filename = `snapshot_ch${channel}_sub_${Date.now()}.jpg`;
      const filepath = path.join(__dirname, '..', 'downloads', filename);
      fs.writeFileSync(filepath, subSnapshot);
      console.log(`   ✅ Sub stream snapshot saved: ${filename}`);
      console.log(`      Size: ${(subSnapshot.length / 1024).toFixed(2)} KB`);
    } else {
      console.log('   ❌ Failed to capture sub stream snapshot');
    }
    console.log();

    // ========== Usage Examples ==========
    console.log('💡 Usage Examples:\n');
    console.log('   1. View RTSP stream with VLC:');
    console.log(`      vlc "${rtspSubUrl}"`);
    console.log();
    console.log('   2. View RTSP stream with ffplay:');
    console.log(`      ffplay -rtsp_transport tcp "${rtspSubUrl}"`);
    console.log();
    console.log('   3. Record stream with ffmpeg:');
    console.log(`      ffmpeg -i "${rtspSubUrl}" -c copy output.mp4`);
    console.log();
    console.log('   4. View FLV stream in browser:');
    console.log(`      Use a web player that supports FLV over HTTP`);
    console.log(`      ${flvUrl}`);
    console.log();

    // ========== Port Information ==========
    console.log('🔌 Streaming Ports:\n');
    console.log(`   RTSP Port: ${host.rtspPortValue || 'Not available'}`);
    console.log(`   RTMP Port: ${host.rtmpPortValue || 'Not available'}`);
    console.log(`   RTSP Enabled: ${host.rtspEnabledValue ?? 'Unknown'}`);
    console.log(`   RTMP Enabled: ${host.rtmpEnabledValue ?? 'Unknown'}`);
    console.log();

    // Logout
    await host.logout();
    console.log('👋 Demo complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the demo
if (require.main === module) {
  liveStreamingDemo().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { liveStreamingDemo };
