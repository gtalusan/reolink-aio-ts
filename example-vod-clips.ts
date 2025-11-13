/**
 * Example: How to get event video clips from Reolink device
 * 
 * This example demonstrates how to:
 * 1. Search for VOD (Video On Demand) files in a time range
 * 2. Filter by event type (motion, person, vehicle, etc.)
 * 3. Get playback URLs for the clips
 * 4. Download video clips
 */

import { Host } from './src/api/host';
import { VODTrigger, VodRequestType } from './src/enums';
import { VODFile, VODSearchStatus } from './src/types';

async function getEventVideoClips() {
  const host = new Host('192.168.0.79', 'admin', 'ABC123abc');

  try {
    // Step 1: Connect and get host data
    await host.getHostData();
    console.log('✓ Connected to device');

    // Step 2: Define time range to search (last 24 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Step 3: Search for VOD files
    // Note: This method needs to be implemented in the Host class
    // const [statuses, vodFiles] = await host.requestVodFiles(
    //   0, // channel
    //   startTime,
    //   endTime,
    //   false, // statusOnly
    //   'sub', // stream type
    //   undefined, // splitTime
    //   undefined // trigger filter
    // );

    // Step 4: Filter by event type
    // const motionClips = vodFiles.filter(file => 
    //   (file.triggers & VODTrigger.MOTION) !== 0
    // );
    // const personClips = vodFiles.filter(file => 
    //   (file.triggers & VODTrigger.PERSON) !== 0
    // );
    // const vehicleClips = vodFiles.filter(file => 
    //   (file.triggers & VODTrigger.VEHICLE) !== 0
    // );

    // Step 5: Get playback URL for a clip
    // const clip = vodFiles[0];
    // const [mimeType, url] = await host.getVodSource(
    //   0, // channel
    //   clip.name, // filename
    //   'sub', // stream
    //   VodRequestType.FLV // request type
    // );
    // console.log(`Playback URL: ${url}`);

    // Step 6: Download a clip
    // const download = await host.downloadVod(
    //   clip.name,
    //   `clip_${clip.startTime.getTime()}.mp4`, // output filename
    //   undefined, // startTime (for NVR)
    //   undefined, // endTime (for NVR)
    //   0, // channel (for NVR)
    //   'sub' // stream (for NVR)
    // );
    // console.log(`Downloaded ${download.filename}, size: ${download.size} bytes`);

    console.log('\n⚠️  VOD methods need to be implemented in the Host class');
    console.log('See the Python implementation in reolink_aio/api.py:');
    console.log('  - request_vod_files() - Search for VOD files');
    console.log('  - get_vod_source() - Get playback/download URL');
    console.log('  - download_vod() - Download video file');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await host.logout();
  }
}

// Example usage
if (require.main === module) {
  getEventVideoClips().catch(console.error);
}

export { getEventVideoClips };

