/**
 * Example 2: Get Video Clips
 * 
 * This example demonstrates how to:
 * - Search for video clips in a time range
 * - Filter clips by event type (motion, person, vehicle, etc.)
 * - Get playback URLs for clips
 * - Display clip information
 */

import { Host } from '../src/api/host';
import { VodRequestType } from '../src/enums';
import { VODTrigger } from '../src/types';

async function getVideoClips() {
  const host = new Host('192.168.1.100', 'admin', 'your_password');

  try {
    console.log('🔌 Connecting to device...');
    await host.getHostData();
    console.log('✅ Connected!\n');

    // Define time range (last 24 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    console.log(`🔍 Searching for video clips from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}\n`);

    // Get clips for each channel
    for (const channel of host.channelsValue) {
      console.log(`\n📹 Channel ${channel} (${host.cameraName(channel)}):`);
      
      try {
        const [statuses, vodFiles] = await host.requestVodFiles(channel, startTime, endTime);
        
        console.log(`   Found ${vodFiles.length} video clips`);

        if (vodFiles.length === 0) {
          console.log('   No clips found in this time range');
          continue;
        }

        // Filter by event type
        const motionClips = vodFiles.filter(f => (f.triggers & VODTrigger.MOTION) !== 0);
        const personClips = vodFiles.filter(f => (f.triggers & VODTrigger.PERSON) !== 0);
        const vehicleClips = vodFiles.filter(f => (f.triggers & VODTrigger.VEHICLE) !== 0);
        const animalClips = vodFiles.filter(f => (f.triggers & VODTrigger.ANIMAL) !== 0);
        const doorbellClips = vodFiles.filter(f => (f.triggers & VODTrigger.DOORBELL) !== 0);

        console.log(`\n   Event Summary:`);
        console.log(`      Motion: ${motionClips.length} clips`);
        console.log(`      Person: ${personClips.length} clips`);
        console.log(`      Vehicle: ${vehicleClips.length} clips`);
        console.log(`      Animal: ${animalClips.length} clips`);
        console.log(`      Doorbell: ${doorbellClips.length} clips`);

        // Show last 5 clips
        const last5Clips = vodFiles.slice(0, 5);
        console.log(`\n   Last 5 Clips:`);
        
        for (let i = 0; i < last5Clips.length; i++) {
          const clip = last5Clips[i];
          const durationSec = Math.round(clip.duration / 1000);
          const triggers: string[] = [];
          
          if (clip.triggers & VODTrigger.MOTION) triggers.push('Motion');
          if (clip.triggers & VODTrigger.PERSON) triggers.push('Person');
          if (clip.triggers & VODTrigger.VEHICLE) triggers.push('Vehicle');
          if (clip.triggers & VODTrigger.ANIMAL) triggers.push('Animal');
          if (clip.triggers & VODTrigger.DOORBELL) triggers.push('Doorbell');
          if (clip.triggers & VODTrigger.PACKAGE) triggers.push('Package');
          if (triggers.length === 0) triggers.push('Timer');

          console.log(`\n   ${i + 1}. ${clip.startTime.toLocaleString()}`);
          console.log(`      Duration: ${durationSec}s`);
          console.log(`      Size: ${(clip.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      Events: ${triggers.join(', ')}`);
          
          // Get playback URL
          try {
            const [mimeType, url] = await host.getVodSource(channel, clip.fileName, 'sub', VodRequestType.FLV);
            console.log(`      Playback URL: ${url.substring(0, 100)}...`);
          } catch (urlErr) {
            console.log(`      Playback URL: Error - ${urlErr instanceof Error ? urlErr.message : String(urlErr)}`);
          }
        }
      } catch (err) {
        console.log(`   Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await host.logout();
    console.log('\n👋 Disconnected');
  }
}

// Run the example
if (require.main === module) {
  getVideoClips().catch(console.error);
}

export { getVideoClips };

