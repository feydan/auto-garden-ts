import { AbstractError } from '../../errors'

export class RaspberryPiSetupError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_SETUP_ERROR'
}

export class RaspberryPiReadError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_READ_ERROR'
}

export class RaspberryPiWriteError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_WRITE_ERROR'
}

export class RaspberryPiDestroyError extends AbstractError {
  public readonly type = 'RASPBERRY_PI_DESTROY_ERROR'
}
