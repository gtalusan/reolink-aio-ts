/**
 * Test utilities and helpers for Reolink AIO tests
 */

import { Host } from '../../api/host';
import { MockHttpServer, MockHttpServerOptions } from '../../__mocks__/http-server';
import { MockBaichuanServer, MockBaichuanServerOptions } from '../../__mocks__/baichuan-server';
import type { DeviceProfile } from '../../__mocks__/fixtures/devices';
import { SINGLE_CAMERA } from '../../__mocks__/fixtures/devices';

export interface TestServerContext {
  http: MockHttpServer;
  baichuan: MockBaichuanServer;
  host: Host;
}

/**
 * Create a mock Host instance with injected test data
 */
export function createMockHost(options?: {
  host?: string;
  username?: string;
  password?: string;
  channels?: number[];
  isNvr?: boolean;
  hasPtz?: boolean;
  token?: string;
}): Host {
  const host = new Host(
    options?.host || 'localhost',
    options?.username || 'admin',
    options?.password || 'password'
  );

  // Inject test data if provided
  if (options?.channels) {
    (host as any).channels = options.channels;
  }
  if (options?.isNvr !== undefined) {
    (host as any).isNvr = options.isNvr;
  }
  if (options?.token) {
    (host as any).token = options.token;
  }

  return host;
}

/**
 * Start mock servers and create a Host instance for integration testing
 */
export async function withMockServers(
  testFn: (context: TestServerContext) => Promise<void>,
  options?: {
    httpPort?: number;
    baichuanPort?: number;
    device?: DeviceProfile;
    username?: string;
    password?: string;
  }
): Promise<void> {
  const httpPort = options?.httpPort || 18080;
  const baichuanPort = options?.baichuanPort || 19000;
  const device = options?.device || SINGLE_CAMERA;
  const username = options?.username || 'admin';
  const password = options?.password || 'password';

  const httpServer = new MockHttpServer({
    port: httpPort,
    device,
    username,
    password,
  });

  const baichuanServer = new MockBaichuanServer({
    port: baichuanPort,
    username,
    password,
  });

  await httpServer.start();
  await baichuanServer.start();

  const host = new Host(`localhost:${httpPort}`, username, password);

  try {
    await testFn({ http: httpServer, baichuan: baichuanServer, host });
  } finally {
    await host.logout().catch(() => {/* ignore */});
    await httpServer.stop();
    await baichuanServer.stop();
  }
}

/**
 * Create a mock API response
 */
export function mockApiResponse(cmd: string, data: any, code: number = 0) {
  return [{
    cmd,
    code,
    value: data,
  }];
}

/**
 * Create a mock error response
 */
export function mockApiError(cmd: string, code: number = -1, detail?: string) {
  return [{
    cmd,
    code,
    error: {
      detail: detail || 'Unknown error',
      rspCode: code,
    },
  }];
}

/**
 * Wait for a condition to be true (with timeout)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assertion helpers
 */

export function expectValidToken(token: string): void {
  expect(token).toBeDefined();
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(0);
}

export function expectValidChannel(channel: number, host: Host): void {
  expect(host.channelsValue).toContain(channel);
}

export function expectApiSuccess(response: any): void {
  expect(response).toBeDefined();
  expect(Array.isArray(response)).toBe(true);
  expect(response[0].code).toBe(0);
}

export function expectApiError(response: any, expectedCode?: number): void {
  expect(response).toBeDefined();
  expect(Array.isArray(response)).toBe(true);
  expect(response[0].code).not.toBe(0);
  if (expectedCode !== undefined) {
    expect(response[0].code).toBe(expectedCode);
  }
}

/**
 * Create a Date object from SearchTime format
 */
export function searchTimeToDate(time: {
  year: number;
  mon: number;
  day: number;
  hour: number;
  min: number;
  sec: number;
}): Date {
  return new Date(time.year, time.mon - 1, time.day, time.hour, time.min, time.sec);
}

/**
 * Mock axios for unit tests
 */
export function createMockAxios() {
  return {
    post: jest.fn(),
    get: jest.fn(),
    defaults: {
      timeout: 30000,
    },
  };
}

/**
 * Spy on private method
 */
export function spyOnPrivateMethod<T extends object>(
  obj: T,
  methodName: string
): jest.SpyInstance {
  return jest.spyOn(obj as any, methodName);
}

/**
 * Get private property value
 */
export function getPrivateProperty<T>(obj: any, propertyName: string): T {
  return obj[propertyName] as T;
}

/**
 * Set private property value
 */
export function setPrivateProperty(obj: any, propertyName: string, value: any): void {
  obj[propertyName] = value;
}
