import { Socket } from "node:net";
import { EventEmitter } from "node:events";
import {
  ApiError,
  InvalidContentTypeError,
  ReolinkConnectionError,
  ReolinkError,
  ReolinkTimeoutError,
  UnexpectedDataError
} from "../exceptions";
import { HEADER_MAGIC } from "./util";

const DEBUG_ENABLED = Boolean(process?.env?.REOLINK_AIO_DEBUG);

function debugLog(message: string, ...args: Array<unknown>): void {
  if (DEBUG_ENABLED) {
    // eslint-disable-next-line no-console
    console.debug(`[reolink-aio][tcp-protocol] ${message}`, ...args);
  }
}

type PushCallback = (cmdId: number, dataChunk: Buffer, headerLength: number) => void;
type CloseCallback = () => void;

interface ReceiveFuture {
  promise: Promise<[Buffer, number]>;
  resolve: (value: [Buffer, number]) => void;
  reject: (error: Error) => void;
}

/**
 * Reolink Baichuan TCP protocol implementation
 */
export class BaichuanTcpClientProtocol extends EventEmitter {
  private readonly host: string;
  private data: Buffer = Buffer.alloc(0);
  private dataChunk: Buffer = Buffer.alloc(0);
  private receiveFutures: Map<number, Map<number, ReceiveFuture>> = new Map();
  private closeFuture: { promise: Promise<boolean>; resolve: (value: boolean) => void; reject: (error: Error) => void };
  private readonly pushCallback?: PushCallback;
  private readonly closeCallback?: CloseCallback;
  private timeRecv: number = 0;
  private timeConnect: number = 0;
  private logOnce: Set<string> = new Set();
  private socket?: Socket;

  constructor(host: string, pushCallback?: PushCallback, closeCallback?: CloseCallback) {
    super();
    this.host = host;
    this.pushCallback = pushCallback;
    this.closeCallback = closeCallback;

    let resolveClose: (value: boolean) => void;
    let rejectClose: (error: Error) => void;
    this.closeFuture = {
      promise: new Promise<boolean>((resolve, reject) => {
        resolveClose = resolve;
        rejectClose = reject;
      }),
      resolve: resolveClose!,
      reject: rejectClose!
    };
  }

  connect(socket: Socket): void {
    this.socket = socket;
    this.timeConnect = Date.now() / 1000;
    debugLog(`Baichuan host ${this.host}: opened connection`);

    socket.on("data", (data: Buffer) => {
      this.handleData(data);
    });

    socket.on("error", (error: Error) => {
      this.handleConnectionLost(error);
    });

    socket.on("close", () => {
      this.handleConnectionLost();
    });
  }

  private handleData(data: Buffer): void {
    const magicHeader = data.slice(0, 4).toString("hex");
    if (magicHeader === HEADER_MAGIC) {
      if (this.data.length > 0) {
        debugLog(`Baichuan host ${this.host}: received magic header while there is still data in the buffer, clearing old data`);
      }
      this.data = data;
      this.timeRecv = Date.now() / 1000;
    } else {
      if (this.data.length > 0) {
        // was waiting on more data so append
        this.data = Buffer.concat([this.data, data]);
      } else {
        const headerBytes = Buffer.from(HEADER_MAGIC, "hex");
        if (data.length < 4 && headerBytes.slice(0, data.length).equals(data)) {
          this.data = data;
          debugLog(`Baichuan host ${this.host}: received start of magic header but less than 4 bytes, waiting for the rest`);
          return;
        } else {
          this.setError(`with invalid magic header: ${data.slice(0, 4).toString("hex")}`, UnexpectedDataError);
          return;
        }
      }
    }

    try {
      this.parseData();
    } catch (exc) {
      try {
        let cmdId = 0;
        let header = "<24";
        if (this.dataChunk.length > 0) {
          cmdId = this.dataChunk.readUInt32LE(4);
          header = this.dataChunk.slice(0, 24).toString("hex");
        } else if (this.data.length >= 8) {
          cmdId = this.data.readUInt32LE(4);
          header = this.data.slice(0, 24).toString("hex");
        }
        const logKey = `parse_data_cmd_id_${cmdId}`;
        if (!this.logOnce.has(logKey)) {
          this.logOnce.add(logKey);
          debugLog(`Baichuan host ${this.host}: error during parsing of received data, cmd_id ${cmdId}, header ${header}: ${exc}`);
        }
      } catch {
        // ignore
      }
      this.data = Buffer.alloc(0);
    }
  }

  private parseData(): void {
    if (this.data.length < 20) {
      debugLog(`Baichuan host ${this.host}: received start of header but less than 20 bytes, waiting for the rest`);
      return;
    }

    const recCmdId = this.data.readUInt32LE(4);
    const recLenBody = this.data.readUInt32LE(8);
    const recMessId = this.data.readUInt32LE(12); // mess_id = enc_offset: 0/251 = push, 250 = host, 1-100 = channel

    const messClass = this.data.slice(18, 20).toString("hex");

    let lenHeader: number;
    // check message class
    if (messClass === "1466") {
      // modern 20 byte header
      lenHeader = 20;
    } else if (messClass === "1464" || messClass === "0000") {
      // modern 24 byte header
      lenHeader = 24;
      if (this.data.length < 24) {
        debugLog(`Baichuan host ${this.host}: received start of modern header with message class ${messClass} but less than 24 bytes, waiting for the rest`);
        return;
      }
      const recPayloadOffset = this.data.readUInt32LE(20);
      if (recPayloadOffset !== 0) {
        this.setError("with a non-zero payload offset, parsing not implemented", InvalidContentTypeError, recCmdId, recMessId);
        return;
      }
    } else if (messClass === "1465") {
      // legacy 20 byte header
      lenHeader = 20;
      this.setError("with legacy message class, parsing not implemented", InvalidContentTypeError, recCmdId, recMessId);
      return;
    } else {
      this.setError(`with unknown message class '${messClass}'`, InvalidContentTypeError, recCmdId, recMessId);
      return;
    }

    // check message length
    const lenBody = this.data.length - lenHeader;
    if (lenBody < recLenBody) {
      debugLog(`Baichuan host ${this.host}: received ${lenBody} bytes in the body, while header specified ${recLenBody} bytes, waiting for the rest`);
      return;
    }

    // extract data chunk
    const lenChunk = recLenBody + lenHeader;
    this.dataChunk = this.data.slice(0, lenChunk);
    if (lenBody > recLenBody) {
      debugLog(`Baichuan host ${this.host}: received ${lenBody} bytes while header specified ${recLenBody} bytes, parsing multiple messages`);
      this.data = this.data.slice(lenChunk);
    } else {
      // lenBody == recLenBody
      this.data = Buffer.alloc(0);
    }

    // extract receive future
    const cmdFutures = this.receiveFutures.get(recCmdId);
    const receiveFuture = cmdFutures?.get(recMessId);

    try {
      // check status code
      if (lenHeader === 24) {
        const recStatusCode = this.dataChunk.readUInt16LE(16);
        if (recStatusCode !== 200 && recStatusCode !== 300) {
          if (receiveFuture) {
            let exc: ApiError;
            if (recStatusCode === 401) {
              exc = new ApiError(`Baichuan host ${this.host}: received 401 unauthorized login from cmd_id ${recCmdId}`, "", recStatusCode);
            } else {
              exc = new ApiError(`Baichuan host ${this.host}: received status code ${recStatusCode} from cmd_id ${recCmdId}`, "", recStatusCode);
            }
            receiveFuture.reject(exc);
          } else {
            debugLog(`Baichuan host ${this.host}: received unrequested message with cmd_id ${recCmdId} and status code ${recStatusCode}`);
          }
          return;
        }
      }

      if (!receiveFuture) {
        if (this.pushCallback) {
          this.pushCallback(recCmdId, this.dataChunk, lenHeader);
        } else if (this.receiveFutures.size > 0) {
          const expectedCmdIds = Array.from(this.receiveFutures.keys()).join(", ");
          debugLog(
            `Baichuan host ${this.host}: received unrequested message with cmd_id ${recCmdId} mess_id ${recMessId}, while waiting on cmd_id ${expectedCmdIds}, dropping and waiting for next data`
          );
        } else {
          debugLog(`Baichuan host ${this.host}: received unrequested message with cmd_id ${recCmdId}, dropping`);
        }
        return;
      }

      receiveFuture.resolve([this.dataChunk, lenHeader]);
    } finally {
      // if multiple messages received, parse the next also
      if (this.data.length > 0) {
        const magicHeader = this.data.slice(0, 4).toString("hex");
        if (magicHeader === HEADER_MAGIC) {
          this.parseData();
        } else if (this.data.length < 4) {
          const headerBytes = Buffer.from(HEADER_MAGIC, "hex");
          if (headerBytes.slice(0, this.data.length).equals(this.data)) {
            debugLog(`Baichuan host ${this.host}: received start of magic header but less than 4 bytes, during parsing of multiple messages, waiting for the rest`);
          } else {
            debugLog(`Baichuan host ${this.host}: got invalid magic header '${this.data.slice(0, 4).toString("hex")}' during parsing of multiple messages, dropping`);
            this.data = Buffer.alloc(0);
          }
        } else {
          debugLog(`Baichuan host ${this.host}: got invalid magic header '${magicHeader}' during parsing of multiple messages, dropping`);
          this.data = Buffer.alloc(0);
        }
      }
    }
  }

  private setError(
    errMess: string,
    excClass: typeof ReolinkError = ReolinkError,
    cmdId?: number | null,
    messId?: number | null
  ): void {
    this.data = Buffer.alloc(0);
    if (this.receiveFutures.size > 0 && (cmdId === null || cmdId === undefined || this.receiveFutures.has(cmdId))) {
      const exc = new excClass(`Baichuan host ${this.host}: received a message ${errMess}`);
      if (cmdId === null || cmdId === undefined) {
        // set error for all futures
        for (const cmdFutures of this.receiveFutures.values()) {
          for (const future of cmdFutures.values()) {
            future.reject(exc);
          }
        }
      } else if (messId === null || messId === undefined || !this.receiveFutures.get(cmdId)?.has(messId)) {
        // set error for all futures for this cmdId
        const cmdFutures = this.receiveFutures.get(cmdId);
        if (cmdFutures) {
          for (const future of cmdFutures.values()) {
            future.reject(exc);
          }
        }
      } else {
        // set error for specific future
        const future = this.receiveFutures.get(cmdId)?.get(messId);
        if (future) {
          future.reject(exc);
        }
      }
    } else {
      debugLog(`Baichuan host ${this.host}: received unrequested message ${errMess}, dropping`);
    }
  }

  private handleConnectionLost(exc?: Error): void {
    if (this.receiveFutures.size > 0) {
      let error: Error;
      if (!exc) {
        const expectedCmdIds = Array.from(this.receiveFutures.keys()).join(", ");
        error = new ReolinkConnectionError(`Baichuan host ${this.host}: lost connection while waiting for cmd_id ${expectedCmdIds}`);
      } else {
        error = exc instanceof Error ? exc : new Error(String(exc));
      }
      for (const cmdFutures of this.receiveFutures.values()) {
        for (const future of cmdFutures.values()) {
          // Reject the future - if already resolved/rejected, the error will be caught and ignored
          try {
            future.reject(error);
          } catch {
            // Already resolved/rejected, ignore
          }
        }
      }
    }
    debugLog(`Baichuan host ${this.host}: closed connection`);
    if (this.closeCallback) {
      this.closeCallback();
    }
    this.closeFuture.resolve(true);
  }

  /**
   * Wait for a response with the given command ID and message ID
   */
  waitForResponse(cmdId: number, messId: number, timeout: number = 30000): Promise<[Buffer, number]> {
    let cmdFutures = this.receiveFutures.get(cmdId);
    if (!cmdFutures) {
      cmdFutures = new Map();
      this.receiveFutures.set(cmdId, cmdFutures);
    }

    let future = cmdFutures.get(messId);
    if (future) {
      return future.promise;
    }

    let resolve: (value: [Buffer, number]) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<[Buffer, number]>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    future = { promise, resolve: resolve!, reject: reject! };
    cmdFutures.set(messId, future);

    // Set timeout
    const timeoutId = setTimeout(() => {
      cmdFutures?.delete(messId);
      if (cmdFutures.size === 0) {
        this.receiveFutures.delete(cmdId);
      }
      reject(new ReolinkTimeoutError(`Baichuan host ${this.host}: timeout waiting for response cmd_id ${cmdId} mess_id ${messId}`));
    }, timeout);

    promise.finally(() => {
      clearTimeout(timeoutId);
    });

    return promise;
  }

  /**
   * Send data through the socket
   */
  send(data: Buffer): void {
    if (!this.socket || this.socket.destroyed) {
      throw new ReolinkConnectionError(`Baichuan host ${this.host}: cannot send data, socket not connected`);
    }
    this.socket.write(data);
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.socket) {
      this.socket.destroy();
    }
  }

  /**
   * Get the close future promise
   */
  getCloseFuture(): Promise<boolean> {
    return this.closeFuture.promise;
  }

  get timeRecvValue(): number {
    return this.timeRecv;
  }

  get timeConnectValue(): number {
    return this.timeConnect;
  }
}

