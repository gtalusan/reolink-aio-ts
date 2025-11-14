/**
 * Test Siren Control
 * 
 * Simple test to verify siren control works via Baichuan protocol.
 */

import { Host } from './src';

async function main() {
  const cameraIp = '192.168.0.79';
  const username = 'admin';
  const password = 'password';
  const channel = 0;

  console.log('🚨 Testing Siren Control\n');
  console.log('=' .repeat(50));

  const host = new Host(cameraIp, username, password);
  
  try {
    console.log(`\n📡 Connecting to ${cameraIp}...`);
    await host.getHostData();
    console.log(`✅ Connected to: ${host.nvrName}`);
    console.log(`   Model: ${host.cameraModel(channel)}`);
    console.log(`   Firmware: ${host.cameraSwVersion(channel)}`);

    console.log('\n🔊 Testing Siren...');
    console.log('-'.repeat(50));
    
    console.log('   Activating siren for 2 seconds...');
    await host.setSiren(channel, true, 2);
    console.log('   ✅ Siren activated (should sound now)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('   Stopping siren...');
    await host.setSiren(channel, false);
    console.log('   ✅ Siren stopped');

    console.log('\n✅ Siren test completed successfully!');
    
  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    console.log('\n🔌 Disconnecting...');
    await host.logout();
    console.log('✅ Done!\n');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
