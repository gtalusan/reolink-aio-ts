import axios, { AxiosInstance } from "axios";
import { Baichuan } from "../baichuan/baichuan";
import { DEFAULT_PROTOCOL, DEFAULT_RTMP_AUTH_METHOD, DEFAULT_STREAM, DEFAULT_TIMEOUT, UNKNOWN } from "../constants";
import { DEFAULT_BC_PORT } from "../baichuan/util";
import {
  ApiError,
  CredentialsInvalidError,
  InvalidContentTypeError,
  InvalidParameterError,
  LoginError,
  LoginPrivacyModeError,
  NoDataError,
  NotSupportedError,
  ReolinkError
} from "../exceptions";
import { VodRequestType } from "../enums";
import { datetimeToReolinkTime } from "../utils";
import type { ReolinkJson } from "../types";
import { VODFile, VODSearchStatus } from "../types";

const DEBUG_ENABLED = Boolean(process?.env?.REOLINK_AIO_DEBUG);

function debugLog(message: string, ...args: Array<unknown>): void {
  if (DEBUG_ENABLED) {
    // eslint-disable-next-line no-console
    console.debug(`[reolink-aio][host] ${message}`, ...args);
  }
}

/**
 * Reolink network API class
 */
export class Host {
  // Public properties
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly port: number | null;
  readonly useHttps: boolean | null;
  readonly protocol: string;
  readonly stream: string;
  readonly timeout: number;
  readonly rtmpAuthMethod: string;
  readonly baichuanOnly: boolean;

  // Baichuan protocol
  public baichuan: Baichuan;

  // Private properties
  private url: string = "";
  private rtspPort: number | null = null;
  private rtmpPort: number | null = null;
  private onvifPort: number | null = null;
  private rtspEnabled: boolean | null = null;
  private rtmpEnabled: boolean | null = null;
  private onvifEnabled: boolean | null = null;
  private macAddress: string | null = null;

  // Login session
  private encPassword: string;
  private token: string | null = null;
  private leaseTime: Date | null = null;
  private httpClient: AxiosInstance;

  // NVR (host-level) attributes
  private isNvr: boolean = false;
  private isHub: boolean = false;
  private numChannels: number = 0;

  // Combined attributes
  private name: Map<number | null, string> = new Map();
  private model: Map<number | null, string> = new Map();
  private hwVersion: Map<number | null, string> = new Map();
  private uid: Map<number | null, string> = new Map();
  private macAddressMap: Map<number | null, string> = new Map();
  private serial: Map<number | null, string> = new Map();
  private swVersion: Map<number | null, string> = new Map();

  // Channels
  private channels: Array<number> = [];
  private streamChannels: Array<number> = [];

  // States
  private motionDetectionStates: Map<number, boolean> = new Map();
  private aiDetectionStates: Map<number, Map<string, boolean>> = new Map();
  private visitorStates: Map<number, boolean> = new Map();

  // Settings
  private hostDataRaw: Map<string, any> = new Map();
  private hddInfo: Array<any> = [];
  private irSettings: Map<number, any> = new Map();

  // Mutexes for async operations
  private sendMutex: Promise<void> = Promise.resolve();
  private loginMutex: Promise<void> = Promise.resolve();

  constructor(
    host: string,
    username: string,
    password: string,
    port: number | null = null,
    useHttps: boolean | null = null,
    protocol: string = DEFAULT_PROTOCOL,
    stream: string = DEFAULT_STREAM,
    timeout: number = DEFAULT_TIMEOUT,
    rtmpAuthMethod: string = DEFAULT_RTMP_AUTH_METHOD,
    bcPort: number = DEFAULT_BC_PORT,
    bcOnly: boolean = false
  ) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.port = port;
    this.useHttps = useHttps;
    this.protocol = protocol;
    this.stream = stream;
    this.timeout = timeout;
    this.rtmpAuthMethod = rtmpAuthMethod;
    this.baichuanOnly = bcOnly;

    this.encPassword = encodeURIComponent(this.password);

    // Initialize HTTP client with SSL verification disabled (like Python version)
    const https = require('https');
    this.httpClient = axios.create({
      timeout: this.timeout * 1000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      validateStatus: () => true // Don't throw on HTTP error status
    });

    // Initialize Baichuan
    this.baichuan = new Baichuan(host, username, password, this, bcPort);

    this.refreshBaseUrl();
  }

  private refreshBaseUrl(): void {
    const protocol = this.useHttps === false ? "http" : this.useHttps === true ? "https" : "http";
    const port = this.port ? `:${this.port}` : "";
    this.url = `${protocol}://${this.host}${port}`;
  }

  /**
   * Get host data and capabilities
   */
  async getHostData(): Promise<void> {
    const body: ReolinkJson = [
      { cmd: "GetChannelstatus" },
      { cmd: "GetDevInfo", action: 0, param: {} },
      { cmd: "GetLocalLink", action: 0, param: {} },
      { cmd: "GetNetPort", action: 0, param: {} },
      { cmd: "GetP2p", action: 0, param: {} },
      { cmd: "GetHddInfo", action: 0, param: {} },
      { cmd: "GetUser", action: 0, param: {} },
      { cmd: "GetNtp", action: 0, param: {} },
      { cmd: "GetTime", action: 0, param: {} },
      { cmd: "GetPushCfg", action: 0, param: {} },
      { cmd: "GetAbility", action: 0, param: { User: { userName: this.username } } }
    ];

    try {
      const jsonData = await this.send(body, null, "json");
      this.hostDataRaw.set("host", jsonData);
      this.mapHostJsonResponse(jsonData);
    } catch (err) {
      if (err instanceof LoginPrivacyModeError) {
        if (!this.hostDataRaw.has("host")) {
          throw err;
        }
        debugLog(`Using old host data for ${this.host} because privacy mode is enabled`);
        const jsonData = this.hostDataRaw.get("host");
        this.mapHostJsonResponse(jsonData);
      } else {
        throw err;
      }
    }

    // Now get channel-specific data for each channel
    if (this.channels.length > 0) {
      await this.getChannelData();
    }

    // Get Baichuan capabilities
    await this.baichuan.getHostData();
  }

  /**
   * Get channel-specific data for all channels
   */
  private async getChannelData(): Promise<void> {
    const body: ReolinkJson = [];
    const channelMapping: Array<number> = []; // Maps each command to its channel

    // Build commands for each channel
    for (const channel of this.channels) {
      const chBody: ReolinkJson = [
        { cmd: "GetChnTypeInfo", action: 0, param: { channel: channel } },
        { cmd: "GetMdState", action: 0, param: { channel: channel } },
        { cmd: "GetAiState", action: 0, param: { channel: channel } },
        { cmd: "GetEvents", action: 0, param: { channel: channel } },
        { cmd: "GetIsp", action: 0, param: { channel: channel } },
        { cmd: "GetIrLights", action: 0, param: { channel: channel } },
        { cmd: "GetWhiteLed", action: 0, param: { channel: channel } },
        { cmd: "GetOsd", action: 0, param: { channel: channel } }
      ];

      body.push(...chBody);
      channelMapping.push(...new Array(chBody.length).fill(channel));
    }

    if (body.length === 0) {
      return;
    }

    try {
      const jsonData = await this.send(body, null, "json");
      this.hostDataRaw.set("channel", jsonData);
      this.mapChannelJsonResponse(jsonData, channelMapping);
    } catch (err) {
      debugLog(`Error getting channel data: ${err}`);
      // Continue even if channel data fails
    }
  }

  /**
   * Map channel JSON response to internal state
   */
  private mapChannelJsonResponse(jsonData: ReolinkJson, channelMapping: Array<number>): void {
    if (jsonData.length !== channelMapping.length) {
      debugLog(`Warning: Received ${jsonData.length} responses but expected ${channelMapping.length}`);
      return;
    }

    for (let i = 0; i < jsonData.length; i++) {
      const data = jsonData[i];
      const channel = channelMapping[i];

      if (data.code !== 0) {
        // Skip error responses
        continue;
      }

      try {
        if (data.cmd === "GetChnTypeInfo" && data.value) {
          const typeInfo = data.value.typeInfo;
          if (typeInfo && typeInfo !== "") {
            this.model.set(channel, typeInfo);
          }
          if (data.value.firmVer && data.value.firmVer !== "") {
            this.swVersion.set(channel, data.value.firmVer);
          }
          if (data.value.boardInfo && data.value.boardInfo !== "") {
            this.hwVersion.set(channel, data.value.boardInfo);
          }
        } else if (data.cmd === "GetMdState" && data.value) {
          this.motionDetectionStates.set(channel, data.value.state === 1);
        } else if (data.cmd === "GetAiState" && data.value) {
          // Parse AI state - can be old format (int) or new format (object with support/alarm_state)
          const aiStates = this.aiDetectionStates.get(channel) || new Map<string, boolean>();
          
          for (const [key, value] of Object.entries(data.value)) {
            if (key === "channel") {
              continue;
            }
            
            if (typeof value === "number") {
              // Old format: direct int value
              aiStates.set(key, value === 1);
            } else if (typeof value === "object" && value !== null) {
              // New format: { support: 0|1, alarm_state: 0|1 }
              const supported = (value as any).support === 1;
              if (supported) {
                aiStates.set(key, (value as any).alarm_state === 1);
              }
            }
          }
          
          this.aiDetectionStates.set(channel, aiStates);
        } else if (data.cmd === "GetEvents" && data.value) {
          // Parse events which may contain md, ai, visitor
          if (data.value.md && data.value.md.support === 1) {
            this.motionDetectionStates.set(channel, data.value.md.alarm_state === 1);
          }
          
          if (data.value.ai) {
            const aiStates = this.aiDetectionStates.get(channel) || new Map<string, boolean>();
            for (const [key, value] of Object.entries(data.value.ai)) {
              if (key === "other" && (value as any).support === 1) {
                // Battery cams use PIR detection with "other" item
                this.motionDetectionStates.set(channel, (value as any).alarm_state === 1);
              } else if ((value as any).support === 1) {
                aiStates.set(key, (value as any).alarm_state === 1);
              }
            }
            this.aiDetectionStates.set(channel, aiStates);
          }
          
          if (data.value.visitor) {
            const visitor = data.value.visitor;
            if (visitor.support === 1) {
              this.visitorStates.set(channel, visitor.alarm_state === 1);
            }
          }
        } else if (data.cmd === "GetIrLights" && data.value) {
          this.irSettings.set(channel, data.value);
        } else if (data.cmd === "GetOsd" && data.value && data.value.Osd) {
          const osd = data.value.Osd;
          if (osd.osdChannel && osd.osdChannel.name) {
            this.name.set(channel, osd.osdChannel.name);
          }
        }
      } catch (err) {
        debugLog(`Error parsing channel response for ${data.cmd} on channel ${channel}: ${err}`);
      }
    }
  }

  /**
   * Refresh motion/AI/visitor states for all channels.
   * Currently implemented via polling the HTTP API since the Baichuan socket
   * layer is not wired up yet. Once Baichuan state streaming lands we can
   * switch this back to the lower-level implementation.
   */
  async getStates(_cmdList?: any, _wake?: Map<number, boolean>): Promise<void> {
    if (this.channels.length === 0) {
      return;
    }

    for (const channel of this.channels) {
      const body: ReolinkJson = [];
      const channelMapping: Array<number> = [];
      const commands: Array<string> = ["GetEvents", "GetMdState", "GetAiState"];

      for (const cmd of commands) {
        body.push({ cmd, action: 0, param: { channel } });
        channelMapping.push(channel);
      }

      if (body.length === 0) {
        continue;
      }

      try {
        const jsonData = await this.send(body, null, "json");
        this.mapChannelJsonResponse(jsonData, channelMapping);
      } catch (err) {
        debugLog(`Error refreshing channel ${channel} states: ${err}`);
      }
    }
  }

  /**
   * Send HTTP request to device
   */
  private async send(
    body: ReolinkJson,
    param: Record<string, any> | null = null,
    expectedResponseType: "json" = "json"
  ): Promise<any> {
    // Acquire send mutex
    await this.sendMutex;
    let releaseMutex: () => void;
    this.sendMutex = new Promise((resolve) => {
      releaseMutex = resolve;
    });

    try {
      // Ensure logged in
      if (!this.token || !this.leaseTime || this.leaseTime <= new Date()) {
        await this.login();
      }

      const url = `${this.url}/api.cgi`;
      
      // Build params
      if (!param) {
        param = {};
      }
      if (this.token) {
        param.token = this.token;
      }

      // Use POST with JSON body (like Python version)
      const response = await this.httpClient.post(url, body, { params: param });

      if (response.status === 300) {
        throw new ApiError(
          `API returned HTTP status ERROR code ${response.status}, this may happen if you use HTTP and the camera expects HTTPS`,
          "",
          response.status
        );
      }

      if (response.status >= 400) {
        throw new ApiError(`API returned HTTP status ERROR code ${response.status}`, "", response.status);
      }

      // Parse response
      let data: any;
      if (typeof response.data === 'string') {
        // Check for HTML error responses
        if (response.data.length < 500 && response.headers['content-type']?.includes('text/html')) {
          const loginErr = response.data.includes('"detail" : "please login first"');
          const credErr =
            response.data.includes('"detail" : "invalid user"') ||
            response.data.includes('"detail" : "login failed"') ||
            response.data.includes('"detail" : "password wrong"') ||
            response.data.includes("Login has been locked");
          
          if (loginErr || credErr) {
            this.token = null;
            this.leaseTime = null;
            if (credErr) {
              throw new CredentialsInvalidError(`Invalid credentials: ${response.data}`);
            }
            throw new LoginError(`Login error: ${response.data}`);
          }
        }
        
        try {
          data = JSON.parse(response.data);
        } catch {
          throw new InvalidContentTypeError(`Failed to parse JSON response: ${response.data.substring(0, 200)}`);
        }
      } else {
        data = response.data;
      }

      if (Array.isArray(data) && data.length > 0) {
        // Check for error codes
        for (const item of data) {
          if (item.code !== 0) {
            if (item.code === 1) {
              throw new CredentialsInvalidError(`Invalid credentials: ${item.detail || ""}`);
            }
            throw new ApiError(`API error: ${item.detail || item.code}`, "", item.code);
          }
        }
        return data;
      }

      throw new NoDataError(`Host ${this.host}:${this.port} returned no data`);
    } finally {
      releaseMutex!();
    }
  }

  /**
   * Login to device
   */
  async login(): Promise<void> {
    await this.loginMutex;
    let releaseMutex: () => void;
    this.loginMutex = new Promise((resolve) => {
      releaseMutex = resolve;
    });

    try {
      // Check if already logged in
      if (this.token && this.leaseTime && this.leaseTime > new Date(Date.now() + 300000)) {
        return; // Already logged in with valid token
      }

      const url = `${this.url}/api.cgi`;
      const body: ReolinkJson = [
        {
          cmd: "Login",
          action: 0,
          param: {
            User: {
              userName: this.username,
              password: this.password
            }
          }
        }
      ];

      // For login, token should be "null" in params
      const params: Record<string, string> = {
        cmd: "Login",
        token: "null"
      };

      debugLog(`Login request URL: ${url}`);
      debugLog(`Login request body: ${JSON.stringify(body)}`);
      debugLog(`Login request params: ${JSON.stringify(params)}`);

      // Use POST with JSON body (like Python version)
      const response = await this.httpClient.post(url, body, { 
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      debugLog(`Login response status: ${response.status}, content-type: ${response.headers['content-type']}`);
      debugLog(`Login response data (first 500 chars): ${typeof response.data === 'string' ? response.data.substring(0, 500) : JSON.stringify(response.data).substring(0, 500)}`);

      if (response.status === 300) {
        throw new ApiError(
          `API returned HTTP status ERROR code ${response.status}, this may happen if you use HTTP and the camera expects HTTPS`,
          "",
          response.status
        );
      }

      if (response.status >= 400) {
        throw new LoginError(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response - Reolink API returns JSON as text/html content type
      let data: any;
      if (typeof response.data === 'string') {
        debugLog(`Login response is string, length: ${response.data.length}`);
        debugLog(`Login response content: ${response.data.substring(0, 1000)}`);
        
        // Check for credential errors in HTML response
        if (response.data.includes('"detail" : "invalid user"') ||
            response.data.includes('"detail" : "login failed"') ||
            response.data.includes('"detail" : "password wrong"') ||
            response.data.includes("Login has been locked")) {
          debugLog("Detected credential error in response");
          throw new CredentialsInvalidError("Invalid credentials");
        }
        
        try {
          data = JSON.parse(response.data);
        } catch (parseErr) {
          debugLog(`Failed to parse JSON, response was: ${response.data}`);
          throw new LoginError(`Failed to parse login response: ${response.data.substring(0, 200)}`);
        }
      } else {
        data = response.data;
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new LoginError("No data received from login");
      }

      const loginResponse = data[0];
      if (loginResponse.code !== 0) {
        if (loginResponse.code === 1) {
          throw new CredentialsInvalidError("Invalid credentials");
        }
        throw new LoginError(`Login failed: ${loginResponse.detail || loginResponse.code}`);
      }

      this.token = loginResponse.value?.Token?.name || null;
      if (!this.token) {
        throw new LoginError("No token received from login");
      }

      // Calculate lease time (typically 3600 seconds)
      const leaseTime = loginResponse.value?.Token?.leaseTime || 3600;
      this.leaseTime = new Date(Date.now() + leaseTime * 1000);

      debugLog(`Logged in successfully, token expires at ${this.leaseTime}`);
    } finally {
      releaseMutex!();
    }
  }

  /**
   * Logout from device
   */
  async logout(): Promise<void> {
    if (this.baichuan.subscribedValue) {
      await this.baichuan.unsubscribeEvents();
    }

    if (this.token) {
      try {
        const url = `${this.url}/api.cgi`;
        const body: ReolinkJson = [
          {
            cmd: "Logout",
            action: 0,
            param: {}
          }
        ];

        const params = {
          token: this.token
        };

        await this.httpClient.post(url, body, { params });
      } catch (err) {
        debugLog(`Logout error: ${err}`);
      }
    }

    this.token = null;
    this.leaseTime = null;
  }

  /**
   * Map host JSON response to internal state
   */
  private mapHostJsonResponse(jsonData: ReolinkJson): void {
    for (const item of jsonData) {
      if (item.cmd === "GetDevInfo" && item.value) {
        const devInfo = item.value.DevInfo;
        if (devInfo) {
          this.name.set(null, devInfo.devName || UNKNOWN);
          this.model.set(null, devInfo.type || UNKNOWN);
          this.hwVersion.set(null, devInfo.hardwareVersion || UNKNOWN);
          this.uid.set(null, devInfo.UID || UNKNOWN);
          
          // Determine if this is an NVR
          const exactType = devInfo.exactType || 'IPC';
          const type = devInfo.type || 'IPC';
          this.isNvr = ['NVR', 'WIFI_NVR', 'HOMEHUB'].includes(exactType) || 
                       ['NVR', 'WIFI_NVR', 'HOMEHUB'].includes(type);
        }
      } else if (item.cmd === "GetNetPort" && item.value) {
        const netPort = item.value.NetPort;
        if (netPort) {
          this.rtspPort = netPort.rtspPort || null;
          this.rtmpPort = netPort.rtmpPort || null;
          this.onvifPort = netPort.onvifPort || null;
          this.rtspEnabled = netPort.rtspEnable === 1;
          this.rtmpEnabled = netPort.rtmpEnable === 1;
          this.onvifEnabled = netPort.onvifEnable === 1;
        }
      } else if (item.cmd === "GetLocalLink" && item.value) {
        const localLink = item.value.LocalLink;
        if (localLink) {
          this.macAddress = localLink.mac || null;
        }
      } else if (item.cmd === "GetChannelstatus" && item.value) {
        // Python version uses: data["value"]["status"] and data["value"]["count"]
        const status = item.value.status;
        const count = item.value.count;
        
        if (count !== undefined && count > 0) {
          this.numChannels = count;
        }
        
        if (status && Array.isArray(status)) {
          this.channels = [];
          for (const chInfo of status) {
            // Only add online channels (online === 1)
            if (chInfo.online === 1 && chInfo.channel !== undefined) {
              const curChannel = chInfo.channel;
              this.channels.push(curChannel);
              
              // Store model if available
              if (chInfo.typeInfo) {
                this.model.set(curChannel, chInfo.typeInfo);
              }
              
              // Store UID if available
              if (chInfo.uid && chInfo.uid !== "") {
                this.uid.set(curChannel, chInfo.uid);
              }
            }
          }
          
          // If count wasn't provided, use length of channels array
          if (this.numChannels === 0 && this.channels.length > 0) {
            this.numChannels = this.channels.length;
          }
        }
      }
    }
  }

  // Property getters
  get onvifPortValue(): number | null {
    return this.onvifPort;
  }

  get rtmpPortValue(): number | null {
    return this.rtmpPort;
  }

  get rtspPortValue(): number | null {
    return this.rtspPort;
  }

  get onvifEnabledValue(): boolean | null {
    return this.onvifEnabled;
  }

  get rtmpEnabledValue(): boolean | null {
    return this.rtmpEnabled;
  }

  get rtspEnabledValue(): boolean | null {
    return this.rtspEnabled;
  }

  get macAddressValue(): string {
    if (this.macAddress === null) {
      throw new NoDataError("Mac address not yet retrieved");
    }
    return this.macAddress;
  }

  get isNvrValue(): boolean {
    return this.isNvr;
  }

  get isHubValue(): boolean {
    return this.isHub;
  }

  get nvrName(): string {
    return this.cameraName(null);
  }

  get numChannel(): number {
    return this.numChannels;
  }

  get channelsValue(): Array<number> {
    return this.channels;
  }

  get sessionActive(): boolean {
    if (this.baichuanOnly) {
      return this.baichuan.sessionActive;
    }
    if (this.token && this.leaseTime && this.leaseTime > new Date(Date.now() + 5000)) {
      return true;
    }
    return false;
  }

  // Channel-level getters
  cameraName(channel: number | null): string {
    return this.name.get(channel) || UNKNOWN;
  }

  cameraModel(channel: number | null): string {
    return this.model.get(channel) || UNKNOWN;
  }

  cameraHardwareVersion(channel: number | null): string {
    return this.hwVersion.get(channel) || UNKNOWN;
  }

  cameraSwVersion(channel: number | null): string {
    return this.swVersion.get(channel) || UNKNOWN;
  }

  // State getters
  motionDetected(channel: number): boolean {
    return this.motionDetectionStates.get(channel) || false;
  }

  aiDetected(channel: number, objectType: string): boolean {
    const aiVal = this.aiDetectionStates.get(channel)?.get(objectType);
    return aiVal || false;
  }

  visitorDetected(channel: number): boolean {
    return this.visitorStates.get(channel) || false;
  }

  irEnabled(channel: number): boolean {
    const irSettings = this.irSettings.get(channel);
    return irSettings?.IrLights?.state === "Auto";
  }

  // State setters (simplified - full implementation needed)
  async setIrLights(channel: number, enabled: boolean): Promise<void> {
    throw new NotSupportedError("setIrLights not yet implemented");
  }

  async setSpotlight(channel: number, enabled: boolean): Promise<void> {
    throw new NotSupportedError("setSpotlight not yet implemented");
  }

  async setSiren(channel: number, enabled: boolean): Promise<void> {
    throw new NotSupportedError("setSiren not yet implemented");
  }

  // Subscription methods (simplified)
  async subscribe(webhookUrl: string): Promise<void> {
    throw new NotSupportedError("subscribe not yet implemented");
  }

  renewTimer(): number {
    return 0;
  }

  async renew(): Promise<void> {
    throw new NotSupportedError("renew not yet implemented");
  }

  // Expose private properties for Baichuan integration
  get _isNvr(): boolean {
    return this.isNvr;
  }

  set _isNvr(value: boolean) {
    this.isNvr = value;
  }

  get _isHub(): boolean {
    return this.isHub;
  }

  set _isHub(value: boolean) {
    this.isHub = value;
  }

  get _numChannels(): number {
    return this.numChannels;
  }

  set _numChannels(value: number) {
    this.numChannels = value;
  }

  get _channels(): Array<number> {
    return this.channels;
  }

  set _channels(value: Array<number>) {
    this.channels = value;
  }

  get _streamChannels(): Array<number> {
    return this.streamChannels;
  }

  set _streamChannels(value: Array<number>) {
    this.streamChannels = value;
  }

  get _motionDetectionStates(): Map<number, boolean> {
    return this.motionDetectionStates;
  }

  get _visitorStates(): Map<number, boolean> {
    return this.visitorStates;
  }

  get _aiDetectionStates(): Map<number, Map<string, boolean>> {
    return this.aiDetectionStates;
  }

  get _updating(): boolean {
    return false;
  }

  /**
   * Request VOD files for a specific channel and time range
   */
  async requestVodFiles(
    channel: number,
    start: Date,
    end: Date,
    statusOnly: boolean = false,
    stream?: string,
    splitTime?: number, // milliseconds
    trigger?: any // VODTrigger - not implemented yet
  ): Promise<[VODSearchStatus[], VODFile[]]> {
    // Use channels if streamChannels is empty (for standalone cameras)
    const validChannels = this.streamChannels.length > 0 ? this.streamChannels : this.channels;
    if (!validChannels.includes(channel)) {
      throw new InvalidParameterError(`Request VOD files: no camera connected to channel '${channel}'`);
    }
    if (start > end) {
      throw new InvalidParameterError(`Request VOD files: start date '${start}' needs to be before end date '${end}'`);
    }

    if (!stream) {
      stream = this.stream;
    }

    // Build search body
    const body: ReolinkJson = [];
    const searchBody: ReolinkJson[0] = {
      cmd: "Search",
      action: 0,
      param: {
        Search: {
          channel: channel,
          onlyStatus: statusOnly ? 1 : 0,
          streamType: stream,
          StartTime: datetimeToReolinkTime(start),
          EndTime: datetimeToReolinkTime(end)
        }
      }
    };
    body.push(searchBody);

    try {
      const jsonData = await this.send(body, { cmd: "Search" }, "json");
      
      const statuses: VODSearchStatus[] = [];
      const vodFiles: VODFile[] = [];

      for (const data of jsonData) {
        if (data.code !== 0) {
          throw new ApiError(
            `Host: ${this.host}:${this.port}: Request VOD files: API returned error code ${data.code || -1}`,
            "",
            data.code || -1
          );
        }

        const searchResult = data.value?.SearchResult;
        if (!searchResult) {
          continue;
        }

        // Parse statuses
        if (searchResult.Status && Array.isArray(searchResult.Status)) {
          for (const status of searchResult.Status) {
            statuses.push(new VODSearchStatus(status));
          }
        }

        if (statusOnly) {
          continue;
        }

        // Parse files
        if (searchResult.File && Array.isArray(searchResult.File)) {
          for (const file of searchResult.File) {
            vodFiles.push(new VODFile(file));
          }
        }
      }

      // Sort files by start time (newest first)
      vodFiles.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      return [statuses, vodFiles];
    } catch (err) {
      if (err instanceof InvalidContentTypeError) {
        throw new InvalidContentTypeError(`Request VOD files error: ${err.message}`);
      }
      if (err instanceof NoDataError) {
        throw new NoDataError(`Request VOD files error: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Prepare NVR download by calling NvrDownload command
   * Returns the filename to use for the Download command
   */
  private async prepareNvrDownload(
    startTime: Date,
    endTime: Date,
    channel: number,
    stream: string
  ): Promise<string> {
    // Convert dates to Reolink time object format
    const dateToReolinkTime = (d: Date) => ({
      year: d.getFullYear(),
      mon: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      min: d.getMinutes(),
      sec: d.getSeconds(),
    });

    const start = dateToReolinkTime(startTime);
    const end = dateToReolinkTime(endTime);
    
    let iLogicChannel = 0;
    let streamType = stream;
    if (stream.startsWith('autotrack_') || stream.startsWith('telephoto_')) {
      iLogicChannel = 1;
      streamType = stream.replace('autotrack_', '').replace('telephoto_', '');
    }

    const body = [
      {
        cmd: 'NvrDownload',
        action: 1,
        param: {
          NvrDownload: {
            channel: channel,
            iLogicChannel: iLogicChannel,
            streamType: streamType,
            StartTime: start,
            EndTime: end,
          },
        },
      },
    ];

    const jsonData = await this.send(body);

    if (jsonData[0].code !== 0) {
      throw new ApiError(
        `NvrDownload failed with code ${jsonData[0].code}`,
        'NvrDownload',
        jsonData[0].code
      );
    }

    // Find largest file from the list
    const fileList = jsonData[0].value.fileList;
    if (!fileList || fileList.length === 0) {
      throw new NoDataError('NvrDownload returned no files');
    }

    let maxFilesize = 0;
    let filename = '';
    for (const file of fileList) {
      const filesize = parseInt(file.fileSize, 10);
      if (filesize > maxFilesize) {
        maxFilesize = filesize;
        filename = file.fileName;
      }
    }

    return filename;
  }

  /**
   * Download a VOD file to memory
   * For NVRs, this uses the two-step process: NvrDownload then Download
   */
  async downloadVod(
    channel: number,
    startTime: Date,
    endTime: Date,
    stream: string = 'sub'
  ): Promise<{ data: ArrayBuffer; filename: string }> {
    // Ensure logged in
    await this.login();

    let filename: string;
    
    // For NVRs, prepare the download first
    if (this.isNvr) {
      filename = await this.prepareNvrDownload(startTime, endTime, channel, stream);
    } else {
      throw new InvalidParameterError('downloadVod: currently only supported for NVRs');
    }

    // Now download using the prepared filename
    const param = {
      cmd: 'Download',
      source: filename,
      output: filename.replace(/\//g, '_'),
      token: this.token,
    };

    // Make the download request using GET with query parameters (not POST)
    const url = `${this.url}/api.cgi`;
    const response = await this.httpClient.get(url, {
      params: param,
      responseType: 'arraybuffer',
    });

    if (response.status >= 400) {
      throw new ApiError(`Download failed with HTTP ${response.status}`, 'Download', response.status);
    }

    return {
      data: response.data,
      filename: param.output,
    };
  }

  /**
   * Get VOD source URL for playback or download
   */
  async getVodSource(
    channel: number,
    filename: string,
    stream?: string,
    requestType: VodRequestType = VodRequestType.FLV
  ): Promise<[string, string]> {
    // Use channels if streamChannels is empty (for standalone cameras)
    const validChannels = this.streamChannels.length > 0 ? this.streamChannels : this.channels;
    if (!validChannels.includes(channel)) {
      throw new InvalidParameterError(`get_vod_source: no camera connected to channel '${channel}'`);
    }

    // Ensure logged in
    await this.login();

    if (!stream) {
      stream = this.stream;
    }

    // Determine stream type
    let streamType = 0;
    if (stream === "sub") {
      streamType = 1;
    } else if (stream === "autotrack_sub" || stream === "telephoto_sub") {
      streamType = 3;
    } else if (stream === "autotrack_main" || stream === "telephoto_main") {
      streamType = 2;
    }

    // Determine credentials and mime type
    let mime: string;
    let credentials: string;
    if (requestType === VodRequestType.FLV || requestType === VodRequestType.RTMP || requestType === VodRequestType.DOWNLOAD) {
      mime = requestType === VodRequestType.DOWNLOAD ? "video/mp4" : "application/x-mpegURL";
      credentials = `&user=${this.username}&password=${this.password}`;
    } else {
      mime = "video/mp4";
      credentials = `&token=${this.token}`;
    }

    // Build URL based on request type
    let url: string;
    const protocol = this.useHttps === false ? "http" : this.useHttps === true ? "https" : "http";
    const port = this.port ? `:${this.port}` : "";

    if (requestType === VodRequestType.RTMP) {
      if (!this.rtmpPort) {
        throw new InvalidParameterError("RTMP port not available");
      }
      url = `rtmp://${this.host}:${this.rtmpPort}/vod/${filename.replace(/\//g, "%20")}?channel=${channel}&stream=${streamType}`;
    } else if (requestType === VodRequestType.FLV) {
      if (!this.rtmpPort) {
        throw new InvalidParameterError("RTMP port not available");
      }
      url = `${protocol}://${this.host}${port}/flv?port=${this.rtmpPort}&app=bcs&stream=playback.bcs&channel=${channel}&type=${streamType}&start=${filename}&seek=0`;
    } else if (requestType === VodRequestType.PLAYBACK || requestType === VodRequestType.DOWNLOAD) {
      // Extract time from filename for start parameter
      const match = filename.match(/.*Rec\w{3}(?:_|_DST)(\d{8})_(\d{6})_.*/);
      let timeStart = "";
      let startTime = "";
      if (match) {
        timeStart = `${match[1]}${match[2]}`;
        startTime = `&start=${timeStart}`;
      }
      const cmd = requestType;
      url = `${protocol}://${this.host}${port}?cmd=${cmd}&channel=${channel}&source=${filename.replace(/ /g, "%20")}&output=ha_playback_${timeStart}.mp4${startTime}`;
    } else {
      throw new InvalidParameterError(`get_vod_source: unsupported request_type '${requestType}'`);
    }

    return [mime, `${url}${credentials}`];
  }
}
