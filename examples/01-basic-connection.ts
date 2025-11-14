/**
 * Example 1: Basic Connection and Device Information
 * 
 * This example demonstrates how to:
 * - Connect to a Reolink device
 * - Get device information (name, model, channels, etc.)
 * - Display device capabilities
 */

import { Host } from '../src/api/host';

async function basicConnection() {
  // Initialize connection
  // UPDATE THESE VALUES FOR YOUR CAMERA/NVR
  const host = new Host('192.168.1.100', 'admin', 'your_password');

  try {
    console.log('🔌 Connecting to device...');
    await host.getHostData();
    console.log('✅ Connected successfully!\n');

    // Display device information
    console.log('📱 Device Information:');
    console.log(`   Name: ${host.nvrName}`);
    console.log(`   Model: ${host.cameraModel(null)}`);
    console.log(`   Hardware Version: ${host.cameraHardwareVersion(null)}`);
    console.log(`   Software Version: ${host.cameraSwVersion(null)}`);
    console.log(`   Is NVR: ${host.isNvrValue}`);
    console.log(`   Is Hub: ${host.isHubValue}`);
    console.log(`   Number of Channels: ${host.numChannel}`);
    console.log(`   Channels: ${host.channelsValue.join(', ')}`);

    // Display network ports
    console.log('\n🌐 Network Ports:');
    console.log(`   ONVIF Port: ${host.onvifPortValue || 'Not available'}`);
    console.log(`   RTSP Port: ${host.rtspPortValue || 'Not available'}`);
    console.log(`   RTMP Port: ${host.rtmpPortValue || 'Not available'}`);
    console.log(`   ONVIF Enabled: ${host.onvifEnabledValue ?? 'Unknown'}`);
    console.log(`   RTSP Enabled: ${host.rtspEnabledValue ?? 'Unknown'}`);
    console.log(`   RTMP Enabled: ${host.rtmpEnabledValue ?? 'Unknown'}`);

    // Display channel information
    if (host.channelsValue.length > 0) {
      console.log('\n📹 Channel Information:');
      for (const channel of host.channelsValue) {
        console.log(`\n   Channel ${channel}:`);
        console.log(`      Name: ${host.cameraName(channel)}`);
        console.log(`      Model: ${host.cameraModel(channel)}`);
        console.log(`      Hardware: ${host.cameraHardwareVersion(channel)}`);
        console.log(`      Software: ${host.cameraSwVersion(channel)}`);
      }
    }

    // Display MAC address if available
    try {
      const macAddress = host.macAddressValue;
      console.log(`\n🔗 MAC Address: ${macAddress}`);
    } catch (err) {
      // MAC address not available
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
  basicConnection().catch(console.error);
}

export { basicConnection };

