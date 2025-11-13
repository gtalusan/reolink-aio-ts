import { Host } from './src/api/host';
import { VodRequestType } from './src/enums';

async function testDevice() {
  console.log('Testing Reolink device connection...');
  console.log('Host: 192.168.0.79');
  console.log('Username: admin');
  console.log('');

  const host = new Host('192.168.0.79', 'admin', 'ABC123abc');

  try {
    console.log('Step 1: Connecting and getting host data...');
    await host.getHostData();
    console.log('✓ Successfully connected and retrieved host data');
    console.log('');

    console.log('Device Information:');
    console.log(`  Name: ${host.nvrName}`);
    console.log(`  Model: ${host.cameraModel(null)}`);
    console.log(`  Hardware Version: ${host.cameraHardwareVersion(null)}`);
    console.log(`  Software Version: ${host.cameraSwVersion(null)}`);
    console.log(`  Is NVR: ${host.isNvrValue}`);
    console.log(`  Is Hub: ${host.isHubValue}`);
    console.log(`  Number of Channels: ${host.numChannel}`);
    console.log(`  Channels: ${host.channelsValue.join(', ')}`);
    console.log('');

    try {
      const macAddress = host.macAddressValue;
      console.log(`  MAC Address: ${macAddress}`);
    } catch (err) {
      console.log(`  MAC Address: Not available (${err instanceof Error ? err.message : String(err)})`);
    }

    try {
      console.log(`  ONVIF Port: ${host.onvifPortValue || 'Not available'}`);
      console.log(`  RTSP Port: ${host.rtspPortValue || 'Not available'}`);
      console.log(`  RTMP Port: ${host.rtmpPortValue || 'Not available'}`);
      console.log(`  ONVIF Enabled: ${host.onvifEnabledValue ?? 'Unknown'}`);
      console.log(`  RTSP Enabled: ${host.rtspEnabledValue ?? 'Unknown'}`);
      console.log(`  RTMP Enabled: ${host.rtmpEnabledValue ?? 'Unknown'}`);
    } catch (err) {
      console.log(`  Port information: Error retrieving (${err instanceof Error ? err.message : String(err)})`);
    }

    console.log('');
    console.log('Step 2: Getting device states...');
    try {
      await host.getStates();
      console.log('✓ Successfully retrieved device states');
      console.log('');

      if (host.channelsValue.length > 0) {
        for (const channel of host.channelsValue) {
          console.log(`Channel ${channel} States:`);
          console.log(`  Name: ${host.cameraName(channel)}`);
          console.log(`  Model: ${host.cameraModel(channel)}`);
          console.log(`  IR Enabled: ${host.irEnabled(channel)}`);
          console.log(`  Motion Detected: ${host.motionDetected(channel)}`);
          console.log(`  Visitor Detected: ${host.visitorDetected(channel)}`);
          console.log(`  AI Detected (person): ${host.aiDetected(channel, 'person')}`);
          console.log(`  AI Detected (vehicle): ${host.aiDetected(channel, 'vehicle')}`);
          console.log(`  AI Detected (pet): ${host.aiDetected(channel, 'pet')}`);
          console.log('');
        }
      }
    } catch (err) {
      console.log(`⚠ Error getting states: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log('');
    console.log('Step 3: Testing Baichuan protocol...');
    try {
      console.log(`  Baichuan Session Active: ${host.baichuan.sessionActive}`);
      console.log(`  Baichuan Subscribed: ${host.baichuan.subscribedValue}`);
    } catch (err) {
      console.log(`  Baichuan info: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log('');
    console.log('Step 4: Getting last 5 video clips from each camera...');
    try {
      if (host.channelsValue.length > 0) {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

        for (const channel of host.channelsValue) {
          console.log(`\nChannel ${channel} (${host.cameraName(channel)}):`);
          try {
            const [statuses, vodFiles] = await host.requestVodFiles(channel, startTime, endTime);
            
            // Get last 5 clips (already sorted by newest first)
            const last5Clips = vodFiles.slice(0, 5);
            
            if (last5Clips.length === 0) {
              console.log(`  No video clips found in the last 7 days`);
            } else {
              console.log(`  Found ${vodFiles.length} total clips, showing last 5:`);
              for (let i = 0; i < last5Clips.length; i++) {
                const clip = last5Clips[i];
                const durationSec = Math.round(clip.duration / 1000);
                const startTimeStr = clip.startTime.toLocaleString();
                const endTimeStr = clip.endTime.toLocaleString();
                
                console.log(`  ${i + 1}. ${startTimeStr} - ${endTimeStr} (${durationSec}s)`);
                console.log(`     Filename: ${clip.fileName}`);
                console.log(`     Size: ${(clip.size / 1024 / 1024).toFixed(2)} MB`);
                
                // Get playback URL
                try {
                  const [mimeType, url] = await host.getVodSource(channel, clip.fileName, 'sub', VodRequestType.FLV);
                  console.log(`     Playback URL: ${url.substring(0, 255)}...`);
                } catch (urlErr) {
                  console.log(`     Playback URL: Error getting URL (${urlErr instanceof Error ? urlErr.message : String(urlErr)})`);
                }
              }
            }
          } catch (err) {
            console.log(`  Error getting clips: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      } else {
        console.log('  No channels available');
      }
    } catch (err) {
      console.log(`⚠ Error getting video clips: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log('');
    console.log('Step 5: Logging out...');
    await host.logout();
    console.log('✓ Successfully logged out');
    console.log('');

    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('');
    console.error('❌ Test failed with error:');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      console.error(`  Type: ${error.constructor.name}`);
      if (error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`  Error: ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run the test
testDevice().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

