import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { gpio } from '../tools/raspberry-pi/gpio'

pipe(
  gpio(26, 'out'),
  TE.chainFirstW(g => g.write(true)),
  TE.chainFirstW(g => T.delay(2)(g.write(false))),
  TE.bimap(console.dir, console.dir)
)()