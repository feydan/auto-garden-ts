import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import * as TE from "fp-ts/lib/TaskEither"
import { pipe } from "fp-ts/lib/function"
import {
  RaspberryPiDestroyError,
  RaspberryPiReadError,
  RaspberryPiSetupError,
  RaspberryPiWriteError
} from "./errors"

const arrgpio = require("array-gpio")

export type PinDirection = "in" | "out"

/**
 *
 * @param channel This is based on RPI board's pinout diagram number 1~40
 * @param direction
 * @returns
 */
export const gpio = (channel: number, direction: PinDirection) =>
  pipe(
    E.tryCatch(
      () => arrgpio[direction](channel),
      e => new RaspberryPiSetupError("rpi setup error", E.toError(e))
    ),
    TE.fromEither,
    TE.map(
      (pin): Gpio => ({
        read: pipe(
          TE.taskify(pin.read),
          IO.map(
            TE.mapLeft(
              e => new RaspberryPiReadError("rpi read error", E.toError(e))
            )
          )
        ),
        write: (state: boolean) =>
          pipe(
            E.tryCatch(
              state ? pin.on() : pin.off(),
              e => new RaspberryPiWriteError("rpi write error", E.toError(e))
            ),
            TE.fromEither
          ),
        destroy: () =>
          pipe(
            E.tryCatch(
              pin.close(),
              e =>
                new RaspberryPiDestroyError("rpi destroy error", E.toError(e))
            ),
            TE.fromEither
          )
      })
    )
  )

export const gpioDestroy = () => async () =>
  E.tryCatch(
    arrgpio.close(),
    e => new RaspberryPiDestroyError("rpi destroy error", E.toError(e))
  )

export interface Gpio {
  read: () => TE.TaskEither<RaspberryPiReadError, unknown>
  write: (value: boolean) => TE.TaskEither<RaspberryPiWriteError, unknown>
  destroy: () => TE.TaskEither<RaspberryPiDestroyError, unknown>
}
