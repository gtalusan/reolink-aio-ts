/**
 * Configuration Management Example
 * 
 * This example demonstrates how to:
 * - Get and set OSD (On-Screen Display) settings
 * - Configure recording schedules
 * - Control motion detection settings
 * - Configure AI detection features
 * - Manage notification settings (FTP, Email, Push, Buzzer)
 * - Access network configuration
 */

import { Host } from "../src/api/host";

// Enable debug logging
process.env.REOLINK_AIO_DEBUG = "1";

async function main() {
  // Initialize connection
  // UPDATE THESE VALUES FOR YOUR CAMERA/NVR
  const host = new Host("192.168.0.79", "admin", "password");

  try {
    console.log("Connecting to camera...");
    await host.getHostData();
    console.log("✓ Connected successfully\n");

    const channel = 0; // Primary channel
    
    // Debug: Check if channel exists
    if (!host.channelsValue.includes(channel)) {
      console.error(`Channel ${channel} not found. Available channels: ${host.channelsValue.join(", ")}`);
      process.exit(1);
    }
    
    console.log(`Device: ${host.nvrName}`);
    console.log(`Channels: ${host.channelsValue.join(", ")}`);
    console.log(`Model: ${host.cameraModel(channel)}\n`);

    // ========== OSD Settings ==========
    console.log("=== OSD Settings ===");
    const osdSettings = host.getOsdSettings(channel);
    if (osdSettings && osdSettings.Osd) {
      console.log("Current OSD settings:");
      if (osdSettings.Osd.osdChannel) {
        console.log(`  Camera name enabled: ${osdSettings.Osd.osdChannel.enable === 1}`);
        console.log(`  Camera name position: ${osdSettings.Osd.osdChannel.pos}`);
      }
      if (osdSettings.Osd.osdTime) {
        console.log(`  Date/time enabled: ${osdSettings.Osd.osdTime.enable === 1}`);
        console.log(`  Date/time position: ${osdSettings.Osd.osdTime.pos}`);
      }
      if (osdSettings.Osd.watermark !== undefined) {
        console.log(`  Watermark enabled: ${osdSettings.Osd.watermark === 1}`);
      }

      // Set OSD parameters
      console.log("\nUpdating OSD settings...");
      await host.setOsd(
        channel,
        "Upper Left",  // Camera name position
        "Upper Right", // Date/time position
        false          // Disable watermark
      );
      console.log("✓ OSD settings updated\n");
    } else {
      console.log("OSD settings not available\n");
    }

    // ========== Recording Settings ==========
    console.log("=== Recording Settings ===");
    const recordingSettings = host.getRecordingSettings(channel);
    if (recordingSettings) {
      console.log("Current recording settings:");
      console.log(`  Enabled: ${recordingSettings.Rec.scheduleEnable === 1}`);
      console.log(`  Pre-record: ${recordingSettings.Rec.preRecord} seconds`);
      
      // Enable recording
      console.log("\nEnabling recording...");
      await host.setRecording(channel, true);
      console.log("✓ Recording enabled\n");
    } else {
      console.log("Recording settings not available\n");
    }

    // ========== Motion Detection Settings ==========
    console.log("=== Motion Detection Settings ===");
    const mdSettings = host.getMdAlarmSettings(channel);
    if (mdSettings && mdSettings.MdAlarm) {
      console.log("Current motion detection settings:");
      
      if (mdSettings.Alarm) {
        console.log(`  Enabled: ${mdSettings.Alarm.enable === 1}`);
      } else {
        console.log(`  Enabled: N/A (newer API - use recording schedule instead)`);
      }
      
      if (mdSettings.MdAlarm.useNewSens === 1 && mdSettings.MdAlarm.newSens) {
        const sensitivity = 51 - mdSettings.MdAlarm.newSens.sensDef;
        console.log(`  Sensitivity: ${sensitivity}/50`);
        
        // Set motion detection sensitivity (1-50, higher = more sensitive)
        console.log("\nSetting motion sensitivity to 30...");
        await host.setMdSensitivity(channel, 30);
        console.log("✓ Motion sensitivity updated\n");
      }
      
      // Note: SetMotionDetection (enable/disable) only works on older cameras
      // that support the GetAlarm/SetAlarm API. Newer cameras use schedules.
    } else {
      console.log("Motion detection settings not available\n");
    }

    // ========== AI Detection Settings ==========
    console.log("=== AI Detection Settings ===");
    const aiSettings = host.getAiAlarmSettings(channel);
    if (aiSettings instanceof Map && aiSettings.size > 0) {
      console.log("Available AI types:");
      for (const [aiType, settings] of aiSettings.entries()) {
        console.log(`  ${aiType}:`);
        console.log(`    Enabled: ${settings.enable === 1}`);
        console.log(`    Sensitivity: ${settings.sensitivity}/100`);
        console.log(`    Delay: ${settings.stay_time} seconds`);
      }

      // Set AI person detection sensitivity
      const personSettings = aiSettings.get("person");
      if (personSettings) {
        console.log("\nSetting person detection sensitivity to 80...");
        await host.setAiSensitivity(channel, 80, "person");
        console.log("✓ AI person sensitivity updated");

        console.log("\nSetting person detection delay to 3 seconds...");
        await host.setAiDelay(channel, 3, "person");
        console.log("✓ AI person delay updated\n");
      }
    } else {
      console.log("AI detection settings not available\n");
    }

    // ========== FTP Settings ==========
    console.log("=== FTP Settings ===");
    const ftpSettings = host.getFtpSettings(channel);
    if (ftpSettings) {
      console.log("Current FTP settings:");
      console.log(`  Enabled: ${ftpSettings.Ftp.scheduleEnable === 1}`);
      
      // Enable FTP upload
      console.log("\nEnabling FTP upload...");
      await host.setFtp(channel, true);
      console.log("✓ FTP upload enabled\n");
    } else {
      console.log("FTP settings not available\n");
    }

    // ========== Email Settings ==========
    console.log("=== Email Settings ===");
    const emailSettings = host.getEmailSettings(channel);
    if (emailSettings) {
      console.log("Current email settings:");
      console.log(`  Enabled: ${emailSettings.Email.scheduleEnable === 1}`);
      
      // Enable email notifications
      console.log("\nEnabling email notifications...");
      await host.setEmail(channel, true);
      console.log("✓ Email notifications enabled\n");
    } else {
      console.log("Email settings not available\n");
    }

    // ========== Push Notification Settings ==========
    console.log("=== Push Notification Settings ===");
    const pushSettings = host.getPushSettings(channel);
    if (pushSettings) {
      console.log("Current push settings:");
      console.log(`  Enabled: ${pushSettings.Push.scheduleEnable === 1}`);
      
      // Enable push notifications
      console.log("\nEnabling push notifications...");
      await host.setPush(channel, true);
      console.log("✓ Push notifications enabled\n");
    } else {
      console.log("Push notification settings not available\n");
    }

    // ========== Buzzer Settings ==========
    console.log("=== Buzzer Settings ===");
    const buzzerSettings = host.getBuzzerSettings(channel);
    if (buzzerSettings) {
      console.log("Current buzzer settings:");
      console.log(`  Enabled: ${buzzerSettings.Buzzer.scheduleEnable === 1}`);
      
      // Enable buzzer alarm
      console.log("\nEnabling buzzer alarm...");
      await host.setBuzzer(channel, true);
      console.log("✓ Buzzer alarm enabled\n");
    } else {
      console.log("Buzzer settings not available\n");
    }

    // ========== Network Settings ==========
    console.log("=== Network Settings ===");
    const networkSettings = host.getNetworkSettings();
    if (networkSettings) {
      console.log("Current network settings:");
      console.log(`  HTTP port: ${networkSettings.NetPort.httpPort}`);
      console.log(`  HTTPS port: ${networkSettings.NetPort.httpsPort}`);
      console.log(`  RTMP port: ${networkSettings.NetPort.rtmpPort}`);
      console.log(`  RTSP port: ${networkSettings.NetPort.rtspPort}`);
      console.log(`  ONVIF port: ${networkSettings.NetPort.onvifPort}`);
    } else {
      console.log("Network settings not available");
    }

    // Disconnect
    console.log("\nDisconnecting...");
    await host.logout();
    console.log("✓ Disconnected");

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
