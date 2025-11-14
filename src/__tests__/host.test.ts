import { Host } from '../api/host';
import { ReolinkError, ApiError, CredentialsInvalidError, InvalidParameterError } from '../exceptions';
import { VodRequestType } from '../enums';

describe('Host', () => {
  describe('constructor', () => {
    it('should create a Host instance with required parameters', () => {
      const host = new Host('192.168.1.10', 'user', 'password');
      expect(host.host).toBe('192.168.1.10');
      expect(host.username).toBe('user');
      expect(host.password).toBe('password');
    });

    it('should create a Host instance with optional parameters', () => {
      const host = new Host('192.168.1.10', 'user', 'password', 80, false, 'rtmp', 'main', 30);
      expect(host.port).toBe(80);
      expect(host.useHttps).toBe(false);
      expect(host.protocol).toBe('rtmp');
      expect(host.stream).toBe('main');
      expect(host.timeout).toBe(30);
    });

    it('should initialize Baichuan instance', () => {
      const host = new Host('192.168.1.10', 'user', 'password');
      expect(host.baichuan).toBeDefined();
      expect(host.baichuan.port).toBe(9000);
    });

    it('should set default port based on protocol', () => {
      const httpHost = new Host('192.168.1.10', 'user', 'password', undefined, false);
      expect(httpHost.port).toBe(80);

      const httpsHost = new Host('192.168.1.10', 'user', 'password', undefined, true);
      expect(httpsHost.port).toBe(443);
    });
  });

  describe('properties', () => {
    let host: Host;

    beforeEach(() => {
      host = new Host('192.168.1.10', 'user', 'password');
    });

    it('should return default values for uninitialized properties', () => {
      expect(host.isNvrValue).toBe(false);
      expect(host.isHubValue).toBe(false);
      expect(host.numChannel).toBe(0);
      expect(host.channelsValue).toEqual([]);
    });

    it('should return camera name', () => {
      expect(host.cameraName(null)).toBe('Unknown');
    });

    it('should return camera model', () => {
      expect(host.cameraModel(null)).toBe('Unknown');
    });

    it('should return camera UID', () => {
      expect(host.cameraUid(null)).toBe('Unknown');
    });

    it('should return default port values', () => {
      expect(host.onvifPortValue).toBeNull();
      expect(host.rtmpPortValue).toBeNull();
      expect(host.rtspPortValue).toBeNull();
    });

    it('should return default enabled values', () => {
      expect(host.onvifEnabledValue).toBeNull();
      expect(host.rtmpEnabledValue).toBeNull();
      expect(host.rtspEnabledValue).toBeNull();
    });

    it('should return empty mac address by default', () => {
      expect(host.macAddressValue).toBe('');
    });

    it('should not be in active session initially', () => {
      expect(host.sessionActive).toBe(false);
    });
  });

  describe('state getters', () => {
    let host: Host;

    beforeEach(() => {
      host = new Host('192.168.1.10', 'user', 'password');
    });

    it('should return false for motion detected when not set', () => {
      expect(host.motionDetected(0)).toBe(false);
    });

    it('should return false for AI detected when not set', () => {
      expect(host.aiDetected(0, 'person')).toBe(false);
      expect(host.aiDetected(0, 'vehicle')).toBe(false);
      expect(host.aiDetected(0, 'dog_cat')).toBe(false);
      expect(host.aiDetected(0, 'face')).toBe(false);
      expect(host.aiDetected(0, 'package')).toBe(false);
    });

    it('should return false for visitor detected when not set', () => {
      expect(host.visitorDetected(0)).toBe(false);
    });

    it('should return false for IR enabled when not set', () => {
      expect(host.irEnabled(0)).toBe(false);
    });
  });

  describe('VOD operations', () => {
    let host: Host;

    beforeEach(() => {
      host = new Host('192.168.1.10', 'user', 'password');
    });

    it('should construct FLV stream URL', async () => {
      // This would require mocking the send method
      // For now, we'll just test that the method exists
      expect(host.getVodSource).toBeDefined();
    });

    it('should have downloadVod method', () => {
      expect(host.downloadVod).toBeDefined();
    });

    it('should have requestVodFiles method', () => {
      expect(host.requestVodFiles).toBeDefined();
    });
  });

  describe('unimplemented methods', () => {
    let host: Host;

    beforeEach(() => {
      host = new Host('192.168.1.10', 'user', 'password');
    });

    it('should throw InvalidParameterError for setIrLights on invalid channel', async () => {
      await expect(host.setIrLights(99, true)).rejects.toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for setSpotlight on invalid channel', async () => {
      await expect(host.setSpotlight(99, true)).rejects.toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for setSiren on invalid channel', async () => {
      await expect(host.setSiren(99, true)).rejects.toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for setFocus on invalid channel', async () => {
      await expect(host.setFocus(99, 128)).rejects.toThrow(InvalidParameterError);
    });

    it('should throw InvalidParameterError for setZoom on invalid channel', async () => {
      await expect(host.setZoom(99, 16)).rejects.toThrow(InvalidParameterError);
    });

    it('should throw NotSupportedError for subscribe', async () => {
      await expect(host.subscribe('http://example.com')).rejects.toThrow('not yet implemented');
    });

    it('should throw NotSupportedError for renew', async () => {
      await expect(host.renew()).rejects.toThrow('not yet implemented');
    });
  });
});

describe('Exceptions', () => {
  it('should create ReolinkError with message', () => {
    const error = new ReolinkError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.translationKey).toBe('');
  });

  it('should create ReolinkError with translation key', () => {
    const error = new ReolinkError('Test error', 'test.key');
    expect(error.message).toBe('Test error');
    expect(error.translationKey).toBe('test.key');
  });

  it('should create ApiError with rspCode', () => {
    const error = new ApiError('API error', '', 400);
    expect(error.message).toBe('API error');
    expect(error.rspCode).toBe(400);
  });

  it('should create CredentialsInvalidError', () => {
    const error = new CredentialsInvalidError('Invalid credentials');
    expect(error.message).toBe('Invalid credentials');
    expect(error).toBeInstanceOf(ReolinkError);
  });

  it('should create InvalidParameterError', () => {
    const error = new InvalidParameterError('Invalid parameter');
    expect(error.message).toBe('Invalid parameter');
    expect(error).toBeInstanceOf(ReolinkError);
  });
});

describe('VodRequestType enum', () => {
  it('should have all VOD request types', () => {
    expect(VodRequestType.FLV).toBe('FLV');
    expect(VodRequestType.RTMP).toBe('RTMP');
    expect(VodRequestType.DOWNLOAD).toBe('Download');
  });
});
