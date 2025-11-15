import { Host } from '../api/host';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Streaming Methods', () => {
  let host: Host;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios.create to return a mocked axios instance
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };
    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

    // Create host instance
    host = new Host('192.168.1.10', 'admin', 'password123', null, false, 'rtsp', 'sub');
    
    // Mock internal properties
    (host as any).channels = [0, 1];
    (host as any).streamChannels = [0, 1];
    (host as any).rtspPort = 554;
    (host as any).rtmpPort = 1935;
    (host as any).token = 'test-token';
    (host as any).encSettings = new Map([
      [0, {
        mainStream: { vType: 'h265', width: 1920, height: 1080 },
        subStream: { vType: 'h264', width: 640, height: 480 }
      }],
      [1, {
        mainStream: { vType: 'h264', width: 2560, height: 1440 },
        subStream: { vType: 'h264', width: 896, height: 512 }
      }]
    ]);
  });

  describe('getStreamSource', () => {
    beforeEach(() => {
      // Mock login to prevent actual HTTP calls
      jest.spyOn(host as any, 'login').mockResolvedValue(undefined);
    });

    it('should return RTSP URL when protocol is rtsp', async () => {
      const url = await host.getStreamSource(0);
      expect(url).toBeTruthy();
      expect(url).toContain('rtsp://');
      expect(url).toContain('192.168.1.10');
    });

    it('should return RTMP URL when protocol is rtmp', async () => {
      const rtmpHost = new Host('192.168.1.10', 'admin', 'password123', null, false, 'rtmp', 'sub');
      (rtmpHost as any).channels = [0];
      (rtmpHost as any).streamChannels = [0];
      (rtmpHost as any).rtmpPort = 1935;
      (rtmpHost as any).token = 'test-token';

      const url = rtmpHost.getRtmpStreamSource(0);
      expect(url).toBeTruthy();
      expect(url).toContain('rtmp://');
      expect(url).toContain('channel0_sub.bcs');
    });

    it('should return FLV URL when protocol is flv', async () => {
      const flvHost = new Host('192.168.1.10', 'admin', 'password123', null, false, 'flv', 'sub');
      (flvHost as any).channels = [0];
      (flvHost as any).streamChannels = [0];
      (flvHost as any).rtmpPort = 1935;

      const url = flvHost.getFlvStreamSource(0);
      expect(url).toBeTruthy();
      expect(url).toContain('http://');
      expect(url).toContain('/flv?');
      expect(url).toContain('channel0_sub.bcs');
    });

    it('should return null for invalid stream type', async () => {
      const url = await host.getStreamSource(0, 'invalid_stream');
      expect(url).toBeNull();
    });

    it('should use default stream if not specified', async () => {
      const url = await host.getStreamSource(0);
      expect(url).toBeTruthy();
      expect(url).toContain('sub'); // default stream is 'sub'
    });
  });

  describe('getRtspStreamSource', () => {
    it('should generate correct RTSP URL for main stream', async () => {
      const url = await host.getRtspStreamSource(0, 'main');
      expect(url).toBe('rtsp://admin:password123@192.168.1.10:554/h265Preview_01_main');
    });

    it('should generate correct RTSP URL for sub stream', async () => {
      const url = await host.getRtspStreamSource(0, 'sub');
      expect(url).toBe('rtsp://admin:password123@192.168.1.10:554/h264Preview_01_sub');
    });

    it('should handle autotrack stream', async () => {
      const url = await host.getRtspStreamSource(0, 'autotrack');
      expect(url).toBe('rtsp://admin:password123@192.168.1.10:554/Preview_01_autotrack');
    });

    it('should map autotrack_main to autotrack', async () => {
      const url = await host.getRtspStreamSource(0, 'autotrack_main');
      expect(url).toBe('rtsp://admin:password123@192.168.1.10:554/Preview_01_autotrack');
    });

    it('should map telephoto_main to autotrack', async () => {
      const url = await host.getRtspStreamSource(0, 'telephoto_main');
      expect(url).toBe('rtsp://admin:password123@192.168.1.10:554/Preview_01_autotrack');
    });

    it('should format channel with zero-padding', async () => {
      const url = await host.getRtspStreamSource(0, 'sub');
      expect(url).toContain('Preview_01_');
      
      const url2 = await host.getRtspStreamSource(1, 'sub');
      expect(url2).toContain('Preview_02_');
    });

    it('should return null for invalid channel', async () => {
      const url = await host.getRtspStreamSource(99, 'sub');
      expect(url).toBeNull();
    });

    it('should throw error if RTSP port not available', async () => {
      (host as any).rtspPort = null;
      await expect(host.getRtspStreamSource(0, 'sub')).rejects.toThrow('RTSP port not available');
    });

    it('should URL-encode password in RTSP URL', async () => {
      const specialHost = new Host('192.168.1.10', 'admin', 'p@ss:word!', null, false, 'rtsp', 'sub');
      (specialHost as any).channels = [0];
      (specialHost as any).streamChannels = [0];
      (specialHost as any).rtspPort = 554;
      (specialHost as any).encSettings = new Map([[0, { subStream: { vType: 'h264' } }]]);

      const url = await specialHost.getRtspStreamSource(0, 'sub');
      expect(url).toContain('p%40ss%3Aword!');
      expect(url).not.toContain('p@ss:word!');
    });
  });

  describe('getRtmpStreamSource', () => {
    it('should generate correct RTMP URL with password auth', () => {
      const url = host.getRtmpStreamSource(0, 'sub');
      expect(url).toBe('rtmp://192.168.1.10:1935/bcs/channel0_sub.bcs?channel=0&stream=1&user=admin&password=password123');
    });

    it('should generate correct RTMP URL with token auth', () => {
      const tokenHost = new Host('192.168.1.10', 'admin', 'password123', null, false, 'rtmp', 'sub', 60, 'token');
      (tokenHost as any).channels = [0];
      (tokenHost as any).streamChannels = [0];
      (tokenHost as any).rtmpPort = 1935;
      (tokenHost as any).token = 'test-token-123';

      const url = tokenHost.getRtmpStreamSource(0, 'sub');
      expect(url).toBe('rtmp://192.168.1.10:1935/bcs/channel0_sub.bcs?channel=0&stream=1&token=test-token-123');
      expect(url).not.toContain('password');
    });

    it('should use stream type 1 for sub stream', () => {
      const url = host.getRtmpStreamSource(0, 'sub');
      expect(url).toContain('stream=1');
    });

    it('should use stream type 1 for autotrack_sub', () => {
      const url = host.getRtmpStreamSource(0, 'autotrack_sub');
      expect(url).toContain('stream=1');
    });

    it('should use stream type 1 for telephoto_sub', () => {
      const url = host.getRtmpStreamSource(0, 'telephoto_sub');
      expect(url).toContain('stream=1');
    });

    it('should use stream type 0 for main stream', () => {
      const url = host.getRtmpStreamSource(0, 'main');
      expect(url).toContain('stream=0');
    });

    it('should use stream type 0 for autotrack_main', () => {
      const url = host.getRtmpStreamSource(0, 'autotrack_main');
      expect(url).toContain('stream=0');
    });

    it('should return null if RTMP port not available', () => {
      (host as any).rtmpPort = null;
      const url = host.getRtmpStreamSource(0, 'sub');
      expect(url).toBeNull();
    });

    it('should return null for invalid channel', () => {
      const url = host.getRtmpStreamSource(99, 'sub');
      expect(url).toBeNull();
    });

    it('should not URL-encode password in RTMP URL', () => {
      const specialHost = new Host('192.168.1.10', 'admin', 'p@ss:word!', null, false, 'rtmp', 'sub');
      (specialHost as any).channels = [0];
      (specialHost as any).streamChannels = [0];
      (specialHost as any).rtmpPort = 1935;

      const url = specialHost.getRtmpStreamSource(0, 'sub');
      expect(url).toContain('password=p@ss:word!');
    });
  });

  describe('getFlvStreamSource', () => {
    it('should generate correct FLV URL with HTTP', () => {
      const url = host.getFlvStreamSource(0, 'sub');
      expect(url).toBe('http://192.168.1.10:80/flv?port=1935&app=bcs&stream=channel0_sub.bcs&user=admin&password=password123');
    });

    it('should generate correct FLV URL with HTTPS', () => {
      const httpsHost = new Host('192.168.1.10', 'admin', 'password123', 443, true, 'flv', 'sub');
      (httpsHost as any).channels = [0];
      (httpsHost as any).streamChannels = [0];
      (httpsHost as any).rtmpPort = 1935;

      const url = httpsHost.getFlvStreamSource(0, 'sub');
      expect(url).toBe('https://192.168.1.10:443/flv?port=1935&app=bcs&stream=channel0_sub.bcs&user=admin&password=password123');
    });

    it('should use custom HTTP port', () => {
      const customPortHost = new Host('192.168.1.10', 'admin', 'password123', 8080, false, 'flv', 'sub');
      (customPortHost as any).channels = [0];
      (customPortHost as any).streamChannels = [0];
      (customPortHost as any).rtmpPort = 1935;

      const url = customPortHost.getFlvStreamSource(0, 'sub');
      expect(url).toContain(':8080/flv');
    });

    it('should return null if RTMP port not available', () => {
      (host as any).rtmpPort = null;
      const url = host.getFlvStreamSource(0, 'sub');
      expect(url).toBeNull();
    });

    it('should return null for invalid channel', () => {
      const url = host.getFlvStreamSource(99, 'sub');
      expect(url).toBeNull();
    });

    it('should not URL-encode password in FLV URL', () => {
      const specialHost = new Host('192.168.1.10', 'admin', 'p@ss:word!', null, false, 'flv', 'sub');
      (specialHost as any).channels = [0];
      (specialHost as any).streamChannels = [0];
      (specialHost as any).rtmpPort = 1935;

      const url = specialHost.getFlvStreamSource(0, 'sub');
      expect(url).toContain('password=p@ss:word!');
    });
  });

  describe('getEncoding and encoding', () => {
    it('should return encoding from cache for main stream', async () => {
      const encoding = await host.getEncoding(0, 'main');
      expect(encoding).toBe('h265');
    });

    it('should return encoding from cache for sub stream', async () => {
      const encoding = await host.getEncoding(0, 'sub');
      expect(encoding).toBe('h264');
    });

    it('should return h264 for channel 1 main stream', async () => {
      const encoding = await host.getEncoding(1, 'main');
      expect(encoding).toBe('h264');
    });

    it('should default to h264 for sub stream if not in cache', async () => {
      (host as any).encSettings = new Map();
      const encoding = await host.getEncoding(0, 'sub');
      expect(encoding).toBe('h264');
    });

    it('should default to h264 for main stream if not in cache', async () => {
      (host as any).encSettings = new Map();
      const encoding = await host.getEncoding(0, 'main');
      expect(encoding).toBe('h264');
    });

    it('should use synchronous encoding method', () => {
      const encoding = host.encoding(0, 'main');
      expect(encoding).toBe('h265');
    });
  });

  describe('getSnapshot', () => {
    beforeEach(() => {
      // Mock the send method
      jest.spyOn(host as any, 'send').mockResolvedValue(Buffer.from('fake-jpeg-data'));
    });

    it('should capture snapshot for main stream', async () => {
      const snapshot = await host.getSnapshot(0, 'main');
      expect(snapshot).toBeInstanceOf(Buffer);
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          cmd: 'Snap',
          channel: 0,
          snapType: 'main'
        }),
        'image/jpeg'
      );
    });

    it('should capture snapshot for sub stream', async () => {
      const snapshot = await host.getSnapshot(0, 'sub');
      expect(snapshot).toBeInstanceOf(Buffer);
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          cmd: 'Snap',
          channel: 0,
          snapType: 'sub',
          width: 640,
          height: 480
        }),
        'image/jpeg'
      );
    });

    it('should default to main stream if not specified', async () => {
      const snapshot = await host.getSnapshot(0);
      expect(snapshot).toBeInstanceOf(Buffer);
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          snapType: 'main'
        }),
        'image/jpeg'
      );
    });

    it('should handle autotrack stream with iLogicChannel', async () => {
      await host.getSnapshot(0, 'autotrack_main');
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          iLogicChannel: 1,
          snapType: 'main'
        }),
        'image/jpeg'
      );
    });

    it('should handle telephoto stream with iLogicChannel', async () => {
      await host.getSnapshot(0, 'telephoto_sub');
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          iLogicChannel: 1,
          snapType: 'sub'
        }),
        'image/jpeg'
      );
    });

    it('should strip snapshots_ prefix', async () => {
      await host.getSnapshot(0, 'snapshots_main');
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          snapType: 'main'
        }),
        'image/jpeg'
      );
    });

    it('should default invalid stream type to main', async () => {
      await host.getSnapshot(0, 'invalid');
      expect((host as any).send).toHaveBeenCalledWith(
        [{}],
        expect.objectContaining({
          snapType: 'main'
        }),
        'image/jpeg'
      );
    });

    it('should return null for invalid channel', async () => {
      const snapshot = await host.getSnapshot(99);
      expect(snapshot).toBeNull();
      expect((host as any).send).not.toHaveBeenCalled();
    });

    it('should return null on send error', async () => {
      jest.spyOn(host as any, 'send').mockRejectedValue(new Error('Network error'));
      const snapshot = await host.getSnapshot(0);
      expect(snapshot).toBeNull();
    });

    it('should return null for empty response', async () => {
      jest.spyOn(host as any, 'send').mockResolvedValue(Buffer.from(''));
      const snapshot = await host.getSnapshot(0);
      expect(snapshot).toBeNull();
    });
  });
});
