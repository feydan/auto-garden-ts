import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as rpigpio from 'rpi-gpio';
import {
  RaspberryPiDestroyError, RaspberryPiReadError, RaspberryPiSetupError,

  RaspberryPiWriteError
} from './errors';

rpigpio.setMode('mode_bcm')

const gpiop = rpigpio.promise
export type PinDirection = 'in' | 'out' | 'low' | 'high';

export const gpio = (channel: number, direction: PinDirection) =>
  pipe(
    TE.tryCatch(
      () => gpiop.setup(channel, direction), 
      e => new RaspberryPiSetupError('rpi setup error', E.toError(e))
    ),
    TE.map((): Gpio => ({
      read: () => TE.tryCatch(
        () => gpiop.read(channel), 
        e => new RaspberryPiReadError('rpi read error', E.toError(e))
      ),
      write: (value: boolean) => TE.tryCatch(
         () => gpiop.write(channel, value), 
        e => new RaspberryPiWriteError('rpi write error', E.toError(e))
      ),
      destroy: () => TE.tryCatch(
        gpiop.destroy, 
        e => new RaspberryPiDestroyError('rpi destroy error', E.toError(e))
      ),
    }))
  )

export const gpioDestroy = () => TE.tryCatch(
  gpiop.destroy, 
  e => new RaspberryPiDestroyError('rpi destroy error', E.toError(e))
)

export interface Gpio {
  read: () => TE.TaskEither<RaspberryPiReadError, boolean>
  write: (value: boolean) => TE.TaskEither<RaspberryPiWriteError, unknown>
  destroy: () => TE.TaskEither<RaspberryPiDestroyError, unknown>
}
