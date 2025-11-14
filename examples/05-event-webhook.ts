/**
 * Example 5: Event Webhook Server
 * 
 * This example demonstrates how to:
 * - Create a simple HTTP server to receive webhooks
 * - Monitor device events
 * - Send webhook notifications when events occur
 * - Handle different event types
 */

import { Host } from '../src/api/host';
import * as http from 'http';

interface WebhookConfig {
  url: string;
  events: string[];
}

async function eventWebhookServer() {
  // UPDATE THESE VALUES FOR YOUR CAMERA/NVR
  const host = new Host('192.168.1.100', 'admin', 'your_password');
  
  // Webhook configuration
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3001/webhook';
  const webhookPort = 3001;

  try {
    console.log('🔌 Connecting to device...');
    await host.getHostData();
    console.log('✅ Connected!\n');

    // Create webhook server
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const event = JSON.parse(body);
            console.log(`📨 Received webhook: ${event.type} on channel ${event.channel}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true }));
          } catch (err) {
            console.error('Error parsing webhook:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(webhookPort, () => {
      console.log(`🌐 Webhook server listening on http://localhost:${webhookPort}/webhook`);
      console.log(`📡 Configure device webhook to: http://your-server:${webhookPort}/webhook\n`);
    });

    // Monitor events
    console.log('🔔 Monitoring events...');
    console.log('   (Press Ctrl+C to stop)\n');

    await host.baichuan.subscribeEvents();

    // Track previous states to detect changes
    const previousStates = new Map<number, {
      motion: boolean;
      person: boolean;
      vehicle: boolean;
      visitor: boolean;
    }>();

    // Initialize previous states
    await host.getStates();
    for (const channel of host.channelsValue) {
      previousStates.set(channel, {
        motion: host.motionDetected(channel),
        person: host.aiDetected(channel, 'person'),
        vehicle: host.aiDetected(channel, 'vehicle'),
        visitor: host.visitorDetected(channel),
      });
    }

    // Check for state changes
    const checkInterval = setInterval(async () => {
      try {
        await host.getStates();
        
        for (const channel of host.channelsValue) {
          const current = {
            motion: host.motionDetected(channel),
            person: host.aiDetected(channel, 'person'),
            vehicle: host.aiDetected(channel, 'vehicle'),
            visitor: host.visitorDetected(channel),
          };
          
          const previous = previousStates.get(channel);
          if (!previous) {
            previousStates.set(channel, current);
            continue;
          }

          // Detect changes
          const events: string[] = [];
          if (current.motion && !previous.motion) events.push('motion_start');
          if (!current.motion && previous.motion) events.push('motion_end');
          if (current.person && !previous.person) events.push('person_detected');
          if (current.vehicle && !previous.vehicle) events.push('vehicle_detected');
          if (current.visitor && !previous.visitor) events.push('visitor_detected');

          // Send webhook for each event
          for (const eventType of events) {
            const payload = {
              type: eventType,
              channel: channel,
              channelName: host.cameraName(channel),
              timestamp: new Date().toISOString(),
              device: {
                name: host.nvrName,
                model: host.cameraModel(channel),
              }
            };

            console.log(`📤 Sending webhook: ${eventType} on channel ${channel}`);
            
            // In a real implementation, you would send HTTP POST to webhookUrl
            // For this example, we'll just log it
            console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
            
            // Example: Send actual webhook
            // try {
            //   const response = await fetch(webhookUrl, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            //   });
            //   console.log(`   ✅ Webhook sent: ${response.status}`);
            // } catch (err) {
            //   console.log(`   ❌ Webhook failed: ${err}`);
            // }
          }

          previousStates.set(channel, current);
        }
      } catch (err) {
        console.error('Error checking states:', err);
      }
    }, 2000); // Check every 2 seconds

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      clearInterval(checkInterval);
      server.close();
      await host.baichuan.unsubscribeEvents();
      await host.logout();
      console.log('👋 Disconnected');
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {}); // Run indefinitely

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  eventWebhookServer().catch(console.error);
}

export { eventWebhookServer };

