import type { SearchTime } from "../types";
import type { ReolinkJson } from "../types";
import type { ReolinkTimezone } from "../types";

type ReolinkTimeInput = SearchTime | string;

type ReolinkTimezoneLike = Pick<ReolinkTimezone, "utcoffset">;

interface TimeDictionary {
  year: number;
  mon: number;
  day: number;
  hour: number;
  min: number;
  sec: number;
  [key: string]: number;
}

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

export function toReolinkTimeId(time: ReolinkTimeInput | Date): string {
  const parsed = time instanceof Date ? datetimeToReolinkTime(time) : normalizeTimeInput(time);
  return `${parsed.year}${parsed.mon.toString().padStart(2, "0")}${parsed.day
    .toString()
    .padStart(2, "0")}${parsed.hour.toString().padStart(2, "0")}${parsed.min
    .toString()
    .padStart(2, "0")}${parsed.sec.toString().padStart(2, "0")}`;
}

export function stripModelStr(value: string): string {
  return value.replace(/\(.*?\)/g, "").replace(/（.*?）/g, "").replace(/\s+/g, "");
}

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

