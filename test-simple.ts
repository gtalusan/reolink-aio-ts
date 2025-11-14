import { Host } from './src';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('Test 1: Get host data');
  await host.getHostData();
  console.log(`✅ Connected`);
  
  console.log('\nTest 2: DIRECT getStates call');
  await host.getStates();
  console.log(`✅ States retrieved`);
  
  await host.logout();
  console.log('\n✅ Done');
}

test().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
