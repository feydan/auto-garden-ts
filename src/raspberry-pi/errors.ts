import { AbstractError } from '../errors'

export class RaspberryPiSetupError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_SETUP_ERROR'
  constructor(public readonly error: Error, message ?: string) {
    super(message)
  }
}

export class RaspberryPiReadError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_READ_ERROR'
  constructor(public readonly error: Error, message ?: string) {
    super(message)
  }
}

export class RaspberryPiWriteError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_WRITE_ERROR'
  constructor(public readonly error: Error, message ?: string) {
    super(message)
  }
}

export class RaspberryPiDestroyError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_DESTROY_ERROR'
  constructor(public readonly error: Error, message ?: string) {
    super(message)
  }
}
