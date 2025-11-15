/**
 * Example 08: PTZ (Pan-Tilt-Zoom) Control
 * 
 * This example demonstrates how to:
 * - Check if PTZ is supported
 * - List available presets and patrols
 * - Control PTZ movement (pan, tilt, zoom)
 * - Navigate to preset positions
 * - Start/stop patrols
 * - Configure guard positions
 * - Set up auto-tracking
 * 
 * Prerequisites:
 * - A Reolink camera with PTZ support
 * - PTZ presets already configured on the camera
 */

import { Host } from '../src';
import { PtzEnum, GuardEnum } from '../src/enums';

// Configuration
const CAMERA_IP = '192.168.0.79';  // Change to your camera's IP
const USERNAME = 'admin';
const PASSWORD = 'password';    // Change to your password
const CHANNEL = 0;                   // Channel number (0 for standalone cameras)

async function demonstratePTZ() {
  console.log('🎥 Reolink PTZ Control Example\n');

  // Create and connect to the camera
  const host = new Host(CAMERA_IP, USERNAME, PASSWORD);
  
  try {
    console.log('Connecting to camera...');
    await host.getHostData();
    console.log(`✓ Connected to: ${host.nvrName}\n`);

    // Verify channel exists
    if (!host.channelsValue.includes(CHANNEL)) {
      console.log(`❌ Error: Channel ${CHANNEL} not found on this device.`);
      console.log(`   Available channels: ${host.channelsValue.join(', ')}`);
      console.log('\n💡 Tip: Update the CHANNEL constant in this file to match your device.\n');
      return;
    }

    // ===== Check PTZ Support =====
    console.log('🔍 Checking PTZ Support:');
    const presets = host.getPtzPresets(CHANNEL);
    const patrols = host.getPtzPatrols(CHANNEL);
    const panPos = host.getPtzPanPosition(CHANNEL);
    const tiltPos = host.getPtzTiltPosition(CHANNEL);
    
    // Determine if camera has PTZ support
    const hasPtzPosition = panPos !== null && tiltPos !== null;
    const hasPtzPresets = Object.keys(presets).length > 0;
    const hasPtzPatrols = Object.keys(patrols).length > 0;
    const hasPtzSupport = hasPtzPosition || hasPtzPresets || hasPtzPatrols;
    
    if (!hasPtzSupport) {
      console.log('❌ This camera does not support PTZ functionality.');
      console.log('   PTZ features require a camera with Pan/Tilt/Zoom capabilities.');
      console.log('\n💡 Tip: This example is designed for PTZ cameras like:');
      console.log('   - Reolink RLC-823A (PTZ)');
      console.log('   - Reolink E1 Zoom');
      console.log('   - Reolink Trackmix series');
      console.log('   And other models with mechanical PTZ or digital pan/tilt.\n');
      return;
    }
    
    console.log('✓ PTZ support detected!\n');

    // ===== Check PTZ Presets =====
    console.log('📍 PTZ Presets:');
    if (!hasPtzPresets) {
      console.log('  No presets configured');
    } else {
      for (const [name, id] of Object.entries(presets)) {
        console.log(`  ${name}: ID ${id}`);
      }
    }
    console.log();

    // ===== Check PTZ Patrols =====
    console.log('🚶 PTZ Patrols:');
    if (!hasPtzPatrols) {
      console.log('  No patrols configured');
    } else {
      for (const [name, id] of Object.entries(patrols)) {
        console.log(`  ${name}: ID ${id}`);
      }
    }
    console.log();

    // ===== Check Current Position =====
    console.log('📐 Current PTZ Position:');
    if (hasPtzPosition) {
      console.log(`  Pan: ${panPos} (0-3600)`);
      console.log(`  Tilt: ${tiltPos} (0-900)`);
    } else {
      console.log('  Position not available');
    }
    console.log();

    // ===== Basic PTZ Movement =====
    console.log('🔄 PTZ Movement Demo:');
    
    console.log('  Moving left...');
    await host.ptzControl(CHANNEL, PtzEnum.left);
    await delay(2000);
    
    console.log('  Moving right...');
    await host.ptzControl(CHANNEL, PtzEnum.right);
    await delay(2000);
    
    console.log('  Moving up...');
    await host.ptzControl(CHANNEL, PtzEnum.up);
    await delay(2000);
    
    console.log('  Moving down...');
    await host.ptzControl(CHANNEL, PtzEnum.down);
    await delay(2000);
    
    console.log('  Stopping movement...');
    await host.ptzControl(CHANNEL, PtzEnum.stop);
    console.log();

    // ===== PTZ with Speed Control =====
    console.log('⚡ PTZ Movement with Speed:');
    console.log('  Moving right with speed 32...');
    await host.ptzControl(CHANNEL, PtzEnum.right, undefined, 32);
    await delay(2000);
    
    console.log('  Stopping...');
    await host.ptzControl(CHANNEL, PtzEnum.stop);
    console.log();

    // ===== Zoom Control =====
    console.log('🔍 Zoom Control:');
    console.log('  Zooming in...');
    await host.ptzControl(CHANNEL, PtzEnum.zoomin);
    await delay(2000);
    
    console.log('  Zooming out...');
    await host.ptzControl(CHANNEL, PtzEnum.zoomout);
    await delay(2000);
    
    console.log('  Stopping zoom...');
    await host.ptzControl(CHANNEL, PtzEnum.stop);
    console.log();

    // ===== Focus Control =====
    console.log('🎯 Focus Control:');
    try {
      console.log('  Setting focus to 128 (mid-range)...');
      await host.setFocus(CHANNEL, 128);
      await delay(2000);
      
      console.log('  Setting focus to 200 (far)...');
      await host.setFocus(CHANNEL, 200);
      await delay(2000);
      
      console.log('  Resetting focus to 64 (near)...');
      await host.setFocus(CHANNEL, 64);
      console.log('  ✓ Focus control complete');
    } catch (error) {
      console.log('  ⚠️  Focus control not supported on this camera');
    }
    console.log();

    // ===== Navigate to Preset =====
    if (hasPtzPresets) {
      const firstPresetName = Object.keys(presets)[0];
      console.log(`📌 Going to preset "${firstPresetName}"...`);
      await host.gotoPreset(CHANNEL, firstPresetName);
      await delay(3000);
      console.log('  ✓ Arrived at preset\n');
    }

    // ===== PTZ Guard Position =====
    console.log('🛡️  PTZ Guard Position:');
    const guardEnabled = host.isPtzGuardEnabled(CHANNEL);
    const guardTime = host.getPtzGuardTime(CHANNEL);
    
    console.log(`  Guard enabled: ${guardEnabled}`);
    console.log(`  Guard return time: ${guardTime} seconds`);
    
    // Set current position as guard position
    console.log('  Setting current position as guard...');
    await host.setPtzGuard(CHANNEL, GuardEnum.set, true, 60);
    console.log('  ✓ Guard position set (60 second timeout)\n');

    // ===== Auto-Tracking =====
    console.log('🎯 Auto-Tracking:');
    const trackingEnabled = host.isAutoTrackingEnabled(CHANNEL);
    const disappearTime = host.getAutoTrackDisappearTime(CHANNEL);
    const stopTime = host.getAutoTrackStopTime(CHANNEL);
    const trackMethod = host.getAutoTrackMethod(CHANNEL);
    
    console.log(`  Tracking enabled: ${trackingEnabled}`);
    console.log(`  Disappear time: ${disappearTime}s`);
    console.log(`  Stop time: ${stopTime}s`);
    console.log(`  Track method: ${trackMethod}`);
    
    // Enable auto-tracking if not already enabled
    if (!trackingEnabled) {
      console.log('  Enabling auto-tracking...');
      await host.setAutoTracking(CHANNEL, true, 10, 20);
      console.log('  ✓ Auto-tracking enabled\n');
    } else {
      console.log();
    }

    // ===== Auto-Tracking Limits =====
    console.log('📏 Auto-Tracking Limits:');
    const leftLimit = host.getAutoTrackLimitLeft(CHANNEL);
    const rightLimit = host.getAutoTrackLimitRight(CHANNEL);
    
    console.log(`  Left limit: ${leftLimit} ${leftLimit === -1 ? '(disabled)' : ''}`);
    console.log(`  Right limit: ${rightLimit} ${rightLimit === -1 ? '(disabled)' : ''}`);
    
    // Set tracking limits (optional)
    // await host.setAutoTrackLimit(CHANNEL, 100, 2600);
    console.log();

    // ===== PTZ Patrol =====
    if (hasPtzPatrols) {
      console.log('🚶 Starting PTZ Patrol...');
      await host.startPatrol(CHANNEL);
      console.log('  Patrol running (will run for 10 seconds)...');
      await delay(10000);
      
      console.log('  Stopping patrol...');
      await host.stopPatrol(CHANNEL);
      console.log('  ✓ Patrol stopped\n');
    }

    // ===== PTZ Calibration =====
    console.log('🔧 PTZ Calibration:');
    console.log('  You can calibrate PTZ if it becomes unaligned:');
    console.log('  await host.ptzCalibrate(CHANNEL);');
    console.log('  (Skipping in this demo)\n');

    console.log('✨ PTZ demonstration complete!');
    console.log('\nTip: Configure presets via the Reolink app for easier navigation.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Logout
    try {
      await host.logout();
    } catch {
      // Ignore logout errors
    }
  }
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the example
if (require.main === module) {
  demonstratePTZ().catch(console.error);
}

export { demonstratePTZ };
