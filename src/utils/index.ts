import type { SearchTime } from "../types";
import type { ReolinkJson } from "../types";
import type { ReolinkTimezone } from "../types";

type ReolinkTimeInput = SearchTime | string;

type ReolinkTimezoneLike = Pick<ReolinkTimezone, "utcoffset">;

/**
 * Time dictionary matching Reolink's time format
 */
interface TimeDictionary {
  year: number;
  mon: number;
  day: number;
  hour: number;
  min: number;
  sec: number;
  [key: string]: number;
}

/**
 * Parses a Reolink time string (YYYYMMDDhhmmss) into a time dictionary
 * @param time - Time string in format YYYYMMDDhhmmss (at least 14 characters)
 * @returns Parsed time dictionary
 * @throws Error if time string is less than 14 characters
 * @example
 * ```typescript
 * const time = parseTimeString("20231115143025");
 * // Returns: { year: 2023, mon: 11, day: 15, hour: 14, min: 30, sec: 25 }
 * ```
 */

function parseTimeString(time: string): TimeDictionary {
  if (time.length < 14) {
    throw new Error(`Invalid Reolink time string: ${time}`);
  }
  return {
    year: Number(time.slice(0, 4)),
    mon: Number(time.slice(4, 6)),
    day: Number(time.slice(6, 8)),
    hour: Number(time.slice(8, 10)),
    min: Number(time.slice(10, 12)),
    sec: Number(time.slice(12, 14))
  };
}

function normalizeTimeInput(time: ReolinkTimeInput): TimeDictionary {
  if (typeof time === "string") {
    return parseTimeString(time);
  }
  return {
    year: time.year,
    mon: time.mon,
    day: time.day,
    hour: time.hour,
    min: time.min,
    sec: time.sec
  };
}

/**
 * Converts Reolink time format to a JavaScript Date object
 * @param time - Time in Reolink format (SearchTime object or YYYYMMDDhhmmss string)
 * @param tzinfo - Optional timezone information for proper conversion
 * @returns JavaScript Date object in UTC
 * @example
 * ```typescript
 * const date = reolinkTimeToDate("20231115143025");
 * const dateWithTz = reolinkTimeToDate({ year: 2023, mon: 11, day: 15, hour: 14, min: 30, sec: 25 }, timezone);
 * ```
 */
export function reolinkTimeToDate(time: ReolinkTimeInput, tzinfo?: ReolinkTimezoneLike): Date {
  const parsed = normalizeTimeInput(time);
  const utcMs = Date.UTC(parsed.year, parsed.mon - 1, parsed.day, parsed.hour, parsed.min, parsed.sec);
  if (!tzinfo) {
    return new Date(utcMs);
  }

  const naiveDate = new Date(utcMs);
  const offsetMs = tzinfo.utcoffset(naiveDate);
  return new Date(utcMs - offsetMs);
}

/**
 * Converts a JavaScript Date to Reolink time dictionary format
 * @param time - Date object or Reolink time string
 * @returns Time dictionary with year, mon, day, hour, min, sec
 * @example
 * ```typescript
 * const reolinkTime = datetimeToReolinkTime(new Date());
 * // Returns: { year: 2023, mon: 11, day: 15, hour: 14, min: 30, sec: 25 }
 * ```
 */
export function datetimeToReolinkTime(time: Date | string): TimeDictionary {
  if (typeof time === "string") {
    return parseTimeString(time);
  }

  return {
    year: time.getUTCFullYear(),
    mon: time.getUTCMonth() + 1,
    day: time.getUTCDate(),
    hour: time.getUTCHours(),
    min: time.getUTCMinutes(),
    sec: time.getUTCSeconds()
  };
}

/**
 * Converts Reolink time to a compact string ID format (YYYYMMDDhhmmss)
 * @param time - Time in various formats (SearchTime, Date, or string)
 * @returns String ID in format YYYYMMDDhhmmss
 * @example
 * ```typescript
 * const id = toReolinkTimeId(new Date());
 * // Returns: "20231115143025"
 * ```
 */
export function toReolinkTimeId(time: ReolinkTimeInput | Date): string {
  const parsed = time instanceof Date ? datetimeToReolinkTime(time) : normalizeTimeInput(time);
  return `${parsed.year}${parsed.mon.toString().padStart(2, "0")}${parsed.day
    .toString()
    .padStart(2, "0")}${parsed.hour.toString().padStart(2, "0")}${parsed.min
    .toString()
    .padStart(2, "0")}${parsed.sec.toString().padStart(2, "0")}`;
}

/**
 * Strips model annotations from a string (removes text in parentheses and extra spaces)
 * @param value - String to clean
 * @returns Cleaned string without parenthetical content or extra whitespace
 * @example
 * ```typescript
 * stripModelStr("RLC-810A (V2)"); // Returns: "RLC-810A"
 * stripModelStr("Model  Name  (Extra)"); // Returns: "ModelName"
 * ```
 */
export function stripModelStr(value: string): string {
  return value.replace(/\(.*?\)/g, "").replace(/（.*?）/g, "").replace(/\s+/g, "");
}

/**
 * Searches for channel number in a Reolink JSON response body
 * @param body - Reolink JSON response array
 * @returns Channel number if found, null otherwise
 * @example
 * ```typescript
 * const channel = searchChannel([{ param: { channel: 0 } }]);
 * // Returns: 0
 * ```
 */
export function searchChannel(body: ReolinkJson): number | null {
  if (!Array.isArray(body) || body.length === 0) {
    return null;
  }
  try {
    const param = body[0]?.param as Record<string, any> | undefined;
    if (!param) {
      return null;
    }
    if (param.channel != null) {
      const channel = Number(param.channel);
      return Number.isNaN(channel) ? null : channel;
    }
    const nested = Object.values(param)[0] as Record<string, any> | undefined;
    if (nested && nested.channel != null) {
      const channel = Number(nested.channel);
      return Number.isNaN(channel) ? null : channel;
    }
  } catch {
    return null;
  }
  return null;
}

export type { TimeDictionary as ReolinkTimeDictionary };

