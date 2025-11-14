/**
 * Example 6: Scheduled Video Backup
 * 
 * This example demonstrates how to:
 * - Schedule periodic backups of video clips
 * - Filter clips by event type
 * - Organize backups by date and event type
 * - Clean up old backups
 */

import { Host } from '../src/api/host';
import { VodRequestType } from '../src/enums';
import { VODTrigger } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  eventTypes: VODTrigger[];
  scheduleInterval: number; // minutes
}

async function scheduledBackup() {
    // UPDATE THESE VALUES FOR YOUR NVR
  const host = new Host('192.168.1.100', 'admin', 'your_password');
  
  const config: BackupConfig = {
    backupDir: './backups',
    retentionDays: 7, // Keep backups for 7 days
    eventTypes: [VODTrigger.MOTION, VODTrigger.PERSON, VODTrigger.VEHICLE],
    scheduleInterval: 60, // Run every 60 minutes
  };

  try {
    console.log('🔌 Connecting to device...');
    await host.getHostData();
    console.log('✅ Connected!\n');

    // Create backup directory structure
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }

    console.log(`📁 Backup directory: ${path.resolve(config.backupDir)}`);
    console.log(`⏰ Schedule: Every ${config.scheduleInterval} minutes`);
    console.log(`🗑️  Retention: ${config.retentionDays} days\n`);

    const performBackup = async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - config.scheduleInterval * 60 * 1000);
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`\n🔄 Starting backup at ${now.toLocaleString()}`);
      console.log(`   Time range: ${startTime.toLocaleString()} to ${now.toLocaleString()}`);

      let totalClips = 0;
      let backedUpClips = 0;

      for (const channel of host.channelsValue) {
        const channelName = host.cameraName(channel).replace(/[^a-z0-9]/gi, '_');
        const channelDir = path.join(config.backupDir, dateStr, `channel_${channel}_${channelName}`);
        
        if (!fs.existsSync(channelDir)) {
          fs.mkdirSync(channelDir, { recursive: true });
        }

        try {
          const [statuses, vodFiles] = await host.requestVodFiles(channel, startTime, now);
          totalClips += vodFiles.length;

          // Filter by event types
          const clipsToBackup = vodFiles.filter(f => {
            return config.eventTypes.some(trigger => (f.triggers & trigger) !== 0);
          });

          console.log(`\n   Channel ${channel} (${host.cameraName(channel)}):`);
          console.log(`      Found: ${vodFiles.length} clips`);
          console.log(`      To backup: ${clipsToBackup.length} clips`);

          for (const clip of clipsToBackup) {
            const triggers: string[] = [];
            if (clip.triggers & VODTrigger.MOTION) triggers.push('motion');
            if (clip.triggers & VODTrigger.PERSON) triggers.push('person');
            if (clip.triggers & VODTrigger.VEHICLE) triggers.push('vehicle');
            
            const timestamp = clip.startTime.toISOString().replace(/[:.]/g, '-');
            const filename = `${triggers.join('_')}_${timestamp}.mp4`;
            const filepath = path.join(channelDir, filename);

            try {
              // Get download URL
              const [mimeType, url] = await host.getVodSource(
                channel,
                clip.fileName,
                'sub',
                VodRequestType.DOWNLOAD
              );
              
              // Log backup info (actual download would happen here)
              console.log(`      📦 ${filename} (${(clip.size / 1024 / 1024).toFixed(2)} MB)`);
              console.log(`         URL: ${url.substring(0, 60)}...`);
              
              // TODO: Implement actual download
              // const download = await host.downloadVod(clip.fileName, filename);
              // const writeStream = fs.createWriteStream(filepath);
              // download.content.pipe(writeStream);
              // await new Promise((resolve, reject) => {
              //   writeStream.on('finish', resolve);
              //   writeStream.on('error', reject);
              // });
              
              backedUpClips++;
            } catch (err) {
              console.log(`      ❌ Error backing up: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        } catch (err) {
          console.log(`   Error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      console.log(`\n✅ Backup complete: ${backedUpClips}/${totalClips} clips backed up`);

      // Clean up old backups
      await cleanupOldBackups(config.backupDir, config.retentionDays);
    };

    // Perform initial backup
    await performBackup();

    // Schedule periodic backups
    const intervalMs = config.scheduleInterval * 60 * 1000;
    const backupInterval = setInterval(performBackup, intervalMs);
    
    console.log(`\n⏰ Scheduled backups every ${config.scheduleInterval} minutes`);
    console.log('   (Press Ctrl+C to stop)\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping scheduled backup...');
      clearInterval(backupInterval);
      await host.logout();
      console.log('👋 Disconnected');
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {}); // Run indefinitely

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function cleanupOldBackups(backupDir: string, retentionDays: number): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const entries = fs.readdirSync(backupDir);
    let deletedCount = 0;

    for (const entry of entries) {
      const entryPath = path.join(backupDir, entry);
      const stat = fs.statSync(entryPath);
      
      if (stat.isDirectory()) {
        const dirDate = new Date(entry);
        if (dirDate < cutoffDate) {
          fs.rmSync(entryPath, { recursive: true, force: true });
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${entry}`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`   Cleaned up ${deletedCount} old backup(s)`);
    }
  } catch (err) {
    console.error('Error cleaning up backups:', err);
  }
}

// Run the example
if (require.main === module) {
  scheduledBackup().catch(console.error);
}

export { scheduledBackup };

