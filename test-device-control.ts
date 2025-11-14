import { Host } from './src';

async function test() {
  const host = new Host('192.168.0.79', 'admin', 'password');
  
  console.log('🎛️  Device Control Test (without Baichuan)\n');
  console.log('='.repeat(50));
  
  // Login and setup without triggering Baichuan
  await host.login();
  (host as any)._channels = [0, 1, 2, 3, 4];
  (host as any).channels = [0, 1, 2, 3, 4];
  
  // Need to get IR settings first
  const body = [
    { cmd: "GetIrLights", action: 0, param: { channel: 0 } }
  ];
  const jsonData = await (host as any).send(body, { cmd: "GetIrLights" }, "json");
  (host as any).irSettings.set(0, jsonData[0].value);
  
  console.log('\n💡 IR Lights Control');
  console.log('-'.repeat(50));
  
  console.log('   Enabling IR lights (Auto mode)...');
  await host.setIrLights(0, true);
  console.log('   ✅ IR lights enabled');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('   Disabling IR lights...');
  await host.setIrLights(0, false);
  console.log('   ✅ IR lights disabled');
  
  console.log('\n🔦 Spotlight Control');
  console.log('-'.repeat(50));
  
  console.log('   Turning on spotlight at 50% brightness...');
  await host.setSpotlight(0, true, 50);
  console.log('   ✅ Spotlight on');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('   Turning off spotlight...');
  await host.setSpotlight(0, false);
  console.log('   ✅ Spotlight off');
  
  console.log('\n🔍 Zoom Control');
  console.log('-'.repeat(50));
  
  console.log('   Setting zoom to position 5...');
  await host.setZoom(0, 5);
  console.log('   ✅ Zoom set');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('   Resetting zoom to 0...');
  await host.setZoom(0, 0);
  console.log('   ✅ Zoom reset');
  
  await host.logout();
  console.log('\n✅ All device control tests passed!\n');
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
