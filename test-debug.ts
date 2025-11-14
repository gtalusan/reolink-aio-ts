import { Host } from './src';

// Enable debug logging
process.env.REOLINK_AIO_DEBUG = '1';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('Test 1: Get host data');
  await host.getHostData();
  console.log(`✅ Connected to: ${host.nvrName}`);
  console.log(`   Channels: ${host.channelsValue}`);
  
  console.log('\nWaiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\nTest 2: Get states');
  try {
    await host.getStates();
    console.log(`✅ States retrieved`);
  } catch (err: any) {
    console.error('❌ Error in getStates:', err.message);
    console.error('Error details:', err);
  }
  
  await host.logout();
  console.log('\n✅ Done');
}

test().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
