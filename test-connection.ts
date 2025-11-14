import { Host } from './src';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('Test 1: Get host data');
  await host.getHostData();
  console.log(`✅ Connected to: ${host.nvrName}`);
  console.log(`   Channels: ${host.channelsValue}`);
  
  console.log('\nTest 2: Get states');
  await host.getStates();
  console.log(`✅ States retrieved`);
  console.log(`   Motion on channel 0: ${host.motionDetected(0)}`);
  
  console.log('\nTest 3: Logout and reconnect');
  await host.logout();
  console.log('✅ Logged out');
  
  console.log('\nTest 4: Reconnect');
  await host.getHostData();
  console.log('✅ Reconnected');
  
  console.log('\nTest 5: Try IR lights');
  await host.setIrLights(0, true);
  console.log('✅ IR lights set');
  
  await host.logout();
  console.log('\n✅ All tests passed');
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
