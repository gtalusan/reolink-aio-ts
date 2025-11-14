import { Host } from './src';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('Skipping Baichuan by only calling HTTP methods');
  
  // Don't call getHostData which triggers Baichuan
  await host.login();
  console.log('✅ Logged in via HTTP');
  
  // Manually set channels
  (host as any)._channels = [0, 1, 2, 3, 4];
  (host as any).channels = [0, 1, 2, 3, 4];
  
  console.log('\nCalling getStates...');
  await host.getStates();
  console.log('✅ States retrieved');
  
  await host.logout();
  console.log('\n✅ Done');
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
