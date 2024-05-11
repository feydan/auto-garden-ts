import * as T from "fp-ts/lib/Task"
import * as TE from "fp-ts/lib/TaskEither"
import { constVoid, pipe } from "fp-ts/lib/function"
import { gpio, gpioDestroy } from "../tools/raspberry-pi/gpio"
import { observe } from "../tools/utils"

const pins = [5, 6, 13, 26]
const testSeconds = 2

const delay = (seconds: number) => () =>
  T.delay(seconds * 1000)(TE.fromIO<void, never>(constVoid))

const testPin = (pin: number) =>
  pipe(
    console.log(`testing pin ${pin}`),
    () => gpio(pin, "out"),

    TE.map(observe(() => console.log("on"))),
    TE.chainFirstW(g => g.write(true)),
    TE.chainFirstW(delay(testSeconds)),

    TE.map(observe(() => console.log("off"))),
    TE.chainFirstW(g => g.write(false)),
    TE.chainFirstW(delay(2))
  )

pipe(
  pins,
  TE.traverseSeqArray(testPin),
  TE.chainW(() => gpioDestroy()),
  TE.bimap(console.dir, console.dir)
)()
