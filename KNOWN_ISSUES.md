# Known Issues

## Baichuan TCP Connection Reset

**Status:** Known Issue  
**Severity:** High  
**Affected:** All operations that call `getHostData()`

### Symptoms

When calling `getHostData()`, the Baichuan TCP connection is initiated. After the initial connection, subsequent HTTP API calls may fail with:

```
Error: read ECONNRESET
  at TCP.onStreamRead (node:internal/stream_base_commons:216:20)
  errno: -54,
  code: 'ECONNRESET',
  syscall: 'read'
```

### Root Cause

The Baichuan protocol implementation has an issue with the TCP connection that causes connection resets. This appears to be an unhandled error in the background TCP connection.

### Workaround

For now, you can use the HTTP API directly without initializing Baichuan:

```typescript
import { Host } from 'reolink-aio-ts';

const host = new Host('192.168.1.100', 'admin', 'password');

// Login directly (skip getHostData to avoid Baichuan)
await host.login();

// Manually set channels if needed
(host as any)._channels = [0]; // Adjust based on your setup
(host as any).channels = [0];

// Now you can use device control features
await host.setIrLights(0, true);
await host.setSpotlight(0, true, 75);
await host.setZoom(0, 10);

await host.logout();
```

### Status

This issue is being investigated. The device control features (IR lights, spotlight, zoom, focus) all work correctly when Baichuan is not initialized.

**Note:** The `setSiren()` method is fully implemented using the Baichuan `AudioAlarmPlay` command (cmd_id 546), but cannot be tested until the Baichuan TCP connection issue is resolved. The implementation follows the Python reference library and should work once the connection bug is fixed.

### Related

- Device control features (HTTP-based) are fully functional
- Siren control (Baichuan-based) is implemented but untestable
- HTTP API works correctly
- Issue is isolated to Baichuan TCP protocol implementation
