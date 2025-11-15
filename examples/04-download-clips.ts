/**
 * Example 4: Download Video Clips
 * 
 * This example demonstrates how to:
 * - Find video clips from a specific time range
 * - Filter clips by event type
 * - Download clips to local filesystem
 * - Organize downloads by event type
 */

import { Host } from '../src/api/host';
import { VODTrigger } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  // Filter out expected ECONNRESET errors from cmd_id 199 and cmd_id 31
  // These are normal - the device doesn't support these commands
  if (reason instanceof Error) {
    const errorCode = (reason as any).code;
    const errorMessage = reason.message;
    
    // Silently ignore expected ECONNRESET errors
    if (errorCode === 'ECONNRESET' || 
        errorMessage.includes('ECONNRESET') || 
        errorMessage.includes('cmd_id 199') || 
        errorMessage.includes('cmd_id 31')) {
      return;
    }
  }
  
  // Log unexpected errors
  console.error('❗ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
});

async function downloadClips() {
    // UPDATE THESE VALUES FOR YOUR NVR
  const host = new Host(process.env.REOLINK_NVR_HOST ?? '192.168.1.100', process.env.REOLINK_NVR_USER ?? 'admin', process.env.REOLINK_NVR_PASS ?? 'your_password');
  const downloadDir = './downloads';

  try {
    console.log('🔌 Connecting to device...');
    await host.getHostData();
    console.log('✅ Connected!\n');

    // Create download directory
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
      console.log(`📁 Created download directory: ${downloadDir}\n`);
    }

    // Define time range (last 2 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000);

    console.log(`🔍 Searching for clips from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}\n`);

    // Get clips for each channel
    for (const channel of host.channelsValue) {
      const channelName = host.cameraName(channel).replace(/[^a-z0-9]/gi, '_');
      const channelDir = path.join(downloadDir, `channel_${channel}_${channelName}`);
      
      if (!fs.existsSync(channelDir)) {
        fs.mkdirSync(channelDir, { recursive: true });
      }

      console.log(`\n📹 Channel ${channel} (${host.cameraName(channel)}):`);
      
      try {
        const [statuses, vodFiles] = await host.requestVodFiles(channel, startTime, endTime);
        
        if (vodFiles.length === 0) {
          console.log('   No clips found');
          continue;
        }

        console.log(`   Found ${vodFiles.length} clips`);

        // Filter motion detection clips
        const motionClips = vodFiles.filter(f => (f.triggers & VODTrigger.MOTION) !== 0);
        const personClips = vodFiles.filter(f => (f.triggers & VODTrigger.PERSON) !== 0);
        const vehicleClips = vodFiles.filter(f => (f.triggers & VODTrigger.VEHICLE) !== 0);

        console.log(`   Motion clips: ${motionClips.length}`);
        console.log(`   Person clips: ${personClips.length}`);
        console.log(`   Vehicle clips: ${vehicleClips.length}`);

        // Download clips (use all clips if no motion clips found)
        const clipsToDownload = motionClips.length > 0 
          ? motionClips.slice(0, 5) 
          : vodFiles.slice(0, 2); // Download first 2 clips for testing
        
        const clipType = motionClips.length > 0 ? 'motion' : 'recent';
        console.log(`\n   Downloading ${clipsToDownload.length} ${clipType} clips...`);

        for (let i = 0; i < clipsToDownload.length; i++) {
          const clip = clipsToDownload[i];
          const timestamp = clip.startTime.toISOString().replace(/[:.]/g, '-');
          const filename = `${clipType}_${timestamp}.mp4`;
          const filepath = path.join(channelDir, filename);

          try {
            console.log(`   [${i + 1}/${clipsToDownload.length}] Downloading: ${filename}...`);
            
            // Download the clip using proper NVR download method
            const result = await host.downloadVod(
              channel,
              clip.startTime,
              clip.endTime,
              'sub'
            );
            
            // Write to disk
            fs.writeFileSync(filepath, new Uint8Array(result.data));
            
            const sizeMB = (result.data.byteLength / (1024 * 1024)).toFixed(2);
            console.log(`      ✅ Downloaded: ${filepath} (${sizeMB} MB)`);
            
          } catch (err) {
            console.log(`      ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

      } catch (err) {
        console.log(`   Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`\n📁 Downloads saved to: ${path.resolve(downloadDir)}`);

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
  downloadClips().catch(console.error);
}

export { downloadClips };

