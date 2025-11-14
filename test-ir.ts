import { Host } from './src';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('Connecting...');
  await host.getHostData();
  console.log(`Connected to: ${host.nvrName}`);
  console.log(`Channels: ${host.channelsValue}`);
  
  console.log('\nTesting IR lights...');
  try {
    await host.setIrLights(0, true);
    console.log('✅ IR lights enabled');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
  
  await host.logout();
  console.log('Done');
}

test().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
