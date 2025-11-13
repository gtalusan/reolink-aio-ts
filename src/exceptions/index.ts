export class ReolinkError extends Error {
  readonly translationKey: string;

  constructor(message: string, translationKey = "") {
    super(message);
    this.name = new.target.name;
    this.translationKey = translationKey;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends ReolinkError {
  readonly rspCode: number | null;

  constructor(message: string, translationKey = "", rspCode: number | null = null) {
    super(message, translationKey);
    this.rspCode = rspCode;
  }
}

export class InvalidContentTypeError extends ReolinkError {}

export class CredentialsInvalidError extends ReolinkError {}

export class LoginError extends ReolinkError {}

export class LoginPrivacyModeError extends LoginError {}

export class LoginFirmwareError extends LoginError {}

export class NoDataError extends ReolinkError {}

export class UnexpectedDataError extends ReolinkError {}

export class InvalidParameterError extends ReolinkError {}

export class NotSupportedError extends ReolinkError {}

export class SubscriptionError extends ReolinkError {}

export class ReolinkConnectionError extends ReolinkError {}

export class ReolinkTimeoutError extends ReolinkError {
  readonly isTimeout: true = true;
}

