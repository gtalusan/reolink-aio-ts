/**
 * Test Siren Control (without getHostData)
 * 
 * Test siren control while avoiding the Baichuan getHostData() bug.
 */

import { Host } from './src';

async function main() {
  const cameraIp = '192.168.0.79';
  const username = 'admin';
  const password = 'password';
  const channel = 0;

  console.log('🚨 Testing Siren Control (Direct)\n');
  console.log('=' .repeat(50));

  const host = new Host(cameraIp, username, password);
  
  try {
    // Skip getHostData() to avoid Baichuan bug - just get states via HTTP
    console.log(`\n📡 Connecting to ${cameraIp} (HTTP only)...`);
    await host.getStates();
    console.log(`✅ Connected via HTTP`);

    console.log('\n🔊 Testing Siren via Baichuan...');
    console.log('-'.repeat(50));
    
    // Login to Baichuan manually
    console.log('   Logging into Baichuan...');
    await host.baichuan.login();
    console.log('   ✅ Baichuan logged in');
    
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
