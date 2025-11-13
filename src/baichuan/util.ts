import { createHash } from "node:crypto";
import { InvalidParameterError } from "../exceptions";

export const DEFAULT_BC_PORT = 9000;
export const HEADER_MAGIC = "f0debc0a";

export const XML_KEY = [0x1f, 0x2d, 0x3c, 0x4b, 0x5a, 0x69, 0x78, 0xff];
export const AES_IV = Buffer.from("0123456789abcdef", "utf8");

export enum EncType {
  BC = "bc",
  AES = "aes"
}

export enum PortType {
  http = "http",
  https = "https",
  rtmp = "rtmp",
  rtsp = "rtsp",
  onvif = "onvif"
}

/**
 * Decrypt a received message using the baichuan protocol
 */
export function decryptBaichuan(buf: Buffer, offset: number): string {
  offset = offset % 256;
  let decrypted = "";
  for (let idx = 0; idx < buf.length; idx++) {
    const key = XML_KEY[(offset + idx) % XML_KEY.length];
    const char = buf[idx] ^ key ^ offset;
    decrypted += String.fromCharCode(char);
  }
  return decrypted;
}

/**
 * Encrypt a message using the baichuan protocol before sending
 */
export function encryptBaichuan(buf: string, offset: number): Buffer {
  if (offset > 255) {
    throw new InvalidParameterError(`Baichuan encryption offset ${offset} can not be larger than 255`);
  }

  const encrypted = Buffer.allocUnsafe(buf.length);
  for (let idx = 0; idx < buf.length; idx++) {
    const key = XML_KEY[(offset + idx) % XML_KEY.length];
    const byte = buf.charCodeAt(idx) ^ key ^ offset;
    encrypted[idx] = byte;
  }
  return encrypted;
}

/**
 * Get the MD5 hex hash of a string according to the baichuan protocol
 */
export function md5StrModern(string: string): string {
  const encStr = Buffer.from(string, "utf8");
  const md5Bytes = createHash("md5").update(encStr).digest();
  const md5Hex = md5Bytes.toString("hex").slice(0, 31);
  return md5Hex.toUpperCase();
}

/**
 * Decorator to mark methods as HTTP commands
 */
export function httpCmd(cmd: string | string[]): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const cmds = Array.isArray(cmd) ? cmd : [cmd];
    if (!descriptor.value.httpCmds) {
      descriptor.value.httpCmds = [];
    }
    descriptor.value.httpCmds.push(...cmds);
    return descriptor;
  };
}

