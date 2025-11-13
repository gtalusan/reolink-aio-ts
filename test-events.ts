                                                                 /**
 * Quick test script for Baichuan events
 */

process.env.REOLINK_AIO_DEBUG = '1';

import { Host } from './src/api/host';

async function testEvents() {
  const host = new Host('192.168.0.79', 'admin', 'ABC123abc');

  try {
    console.log('🔌 Connecting...');
    await host.getHostData();
    console.log('✅ Connected!\n');

    console.log('📊 Getting initial states...');
    await host.getStates();
    console.log('✅ States loaded\n');

    console.log('🔔 Subscribing to events...');
    await host.baichuan.subscribeEvents();
    console.log('✅ Subscribed!\n');

    console.log('⏳ Waiting for events (trigger motion on camera)...\n');

    // Check states every 1 second
    const interval = setInterval(async () => {
      try {
        for (const channel of host.channelsValue) {
          const motion = host.motionDetected(channel);
          const person = host.aiDetected(channel, 'person');
          const vehicle = host.aiDetected(channel, 'vehicle');
          
          if (motion || person || vehicle) {
            console.log(`\n🚨 EVENT on Channel ${channel} (${host.cameraName(channel)}):`);
            if (motion) console.log('   ⚠️  Motion detected!');
            if (person) console.log('   👤 Person detected!');
            if (vehicle) console.log('   🚗 Vehicle detected!');
          }
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }, 1000);

    // Run for 60 seconds
    setTimeout(async () => {
      console.log('\n\n🛑 Stopping...');
      clearInterval(interval);
      await host.baichuan.unsubscribeEvents();
      await host.logout();
      console.log('👋 Done');
      process.exit(0);
    }, 60000);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testEvents().catch(console.error);
