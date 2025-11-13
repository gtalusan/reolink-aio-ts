import { UNKNOWN } from "./constants";
import { UnexpectedDataError } from "./exceptions";

const DEFAULT_VERSION_DATE = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));

const versionRegex = /^v(?<major>\d+)\.(?<middle>\d+)\.(?<minor>\d+)\.(?<build>\d+)(?:_(?<date>\d+))?$/i;
const versionRegexLong = /^v(?<major>\d+)\.(?<middle>\d+)\.(?<minor>\d+)\.(?<build>\d+)_(?<unknown>\d+)_(?<date>\d+)$/i;
const versionRegexOldFormat = /^(?<unknown>\d+)_(?<date>\d+)_v(?<major>\d+)\.(?<middle>\d+)\.(?<minor>\d+)\.(?<build>\d+)$/i;

function parseVersionDate(dateStr?: string): Date {
  if (!dateStr) {
    return DEFAULT_VERSION_DATE;
  }
  const digits = dateStr.replace(/\D+/g, "");
  if (digits.length < 6) {
    return DEFAULT_VERSION_DATE;
  }

  const yy = Number.parseInt(digits.slice(0, 2), 10);
  const month = Number.parseInt(digits.slice(2, 4), 10);
  const day = Number.parseInt(digits.slice(4, 6), 10);
  const hour = digits.length >= 8 ? Number.parseInt(digits.slice(6, 8), 10) : 0;
  const minute = digits.length >= 10 ? Number.parseInt(digits.slice(8, 10), 10) : 0;

  if (Number.isNaN(yy) || Number.isNaN(month) || Number.isNaN(day)) {
    return DEFAULT_VERSION_DATE;
  }

  const year = 2000 + (yy % 100);
  const safeMonth = Math.min(Math.max(month, 1), 12) - 1;
  const safeDay = Math.min(Math.max(day, 1), 31);

  return new Date(Date.UTC(year, safeMonth, safeDay, hour % 24, minute % 60));
}

export class SoftwareVersion {
  readonly versionString: string;
  readonly isUnknown: boolean;
  readonly major: number;
  readonly middle: number;
  readonly minor: number;
  readonly build: number;
  readonly date: Date;

  constructor(versionString: string | null | undefined) {
    this.isUnknown = false;
    this.major = 0;
    this.middle = 0;
    this.minor = 0;
    this.build = 0;
    this.date = DEFAULT_VERSION_DATE;

    if (versionString == null) {
      this.isUnknown = true;
      this.versionString = UNKNOWN;
      return;
    }

    this.versionString = versionString.toLowerCase();

    if (this.versionString === UNKNOWN) {
      this.isUnknown = true;
      return;
    }

    const parsed = this.parseVersionString(this.versionString);
    if (!parsed) {
      throw new UnexpectedDataError(`version_string has invalid version format: ${versionString}`);
    }

    this.major = parsed.major;
    this.middle = parsed.middle;
    this.minor = parsed.minor;
    this.build = parsed.build ?? 0;
    this.date = parsed.date ?? DEFAULT_VERSION_DATE;
  }

  private parseVersionString(value: string):
    | { major: number; middle: number; minor: number; build?: number; date?: Date }
    | null {
    let match = value.match(versionRegexLong);
    if (match?.groups) {
      return {
        major: Number(match.groups.major),
        middle: Number(match.groups.middle),
        minor: Number(match.groups.minor),
        build: Number(match.groups.build),
        date: parseVersionDate(match.groups.date)
      };
    }

    match = value.match(versionRegex);
    if (match?.groups) {
      return {
        major: Number(match.groups.major),
        middle: Number(match.groups.middle),
        minor: Number(match.groups.minor),
        build: Number(match.groups.build),
        date: parseVersionDate(match.groups.date)
      };
    }

    match = value.match(versionRegexOldFormat);
    if (match?.groups) {
      return {
        major: Number(match.groups.major),
        middle: Number(match.groups.middle),
        minor: Number(match.groups.minor),
        build: Number(match.groups.build),
        date: parseVersionDate(match.groups.date)
      };
    }

    return null;
  }

  isGreaterThan(target: SoftwareVersion): boolean {
    if (this.hasNewerDateThan(target)) {
      return true;
    }
    return (
      (this.major > target.major) ||
      (this.major === target.major && this.middle > target.middle) ||
      (this.major === target.major && this.middle === target.middle && this.minor > target.minor) ||
      (this.major === target.major &&
        this.middle === target.middle &&
        this.minor === target.minor &&
        this.build > target.build)
    );
  }

  isGreaterOrEqualThan(target: SoftwareVersion): boolean {
    return this.isGreaterThan(target) || this.equals(target);
  }

  isLowerThan(target: SoftwareVersion): boolean {
    return !this.isGreaterOrEqualThan(target);
  }

  isLowerOrEqualThan(target: SoftwareVersion): boolean {
    return !this.isGreaterThan(target);
  }

  equals(target: SoftwareVersion): boolean {
    return (
      this.major === target.major &&
      this.middle === target.middle &&
      this.minor === target.minor &&
      this.build === target.build &&
      (this.date.getTime() === target.date.getTime() ||
        this.date.getTime() === DEFAULT_VERSION_DATE.getTime() ||
        target.date.getTime() === DEFAULT_VERSION_DATE.getTime())
    );
  }

  generateStringFromNumbers(): string {
    return `${this.major}.${this.middle}.${this.minor}-${this.build}`;
  }

  private hasNewerDateThan(target: SoftwareVersion): boolean {
    const selfDate = this.date.getTime();
    const targetDate = target.date.getTime();
    if (selfDate === DEFAULT_VERSION_DATE.getTime() || targetDate === DEFAULT_VERSION_DATE.getTime()) {
      return false;
    }
    return selfDate > targetDate;
  }
}

export class NewSoftwareVersion extends SoftwareVersion {
  readonly downloadUrl?: string | null;
  readonly releaseNotes: string;
  readonly lastCheck: number;
  readonly onlineUpdateAvailable: boolean;

  constructor(
    versionString: string | null | undefined,
    downloadUrl: string | null = null,
    releaseNotes = "",
    lastCheck = 0,
    onlineUpdateAvailable = false
  ) {
    super(versionString);
    this.downloadUrl = downloadUrl ?? null;
    this.releaseNotes = releaseNotes;
    this.lastCheck = lastCheck;
    this.onlineUpdateAvailable = onlineUpdateAvailable;
  }
}

export { DEFAULT_VERSION_DATE };

