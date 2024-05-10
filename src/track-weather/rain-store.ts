import * as J from 'fp-ts/Json'
import * as D from 'fp-ts/lib/Date'
import * as E from 'fp-ts/lib/Either'
import { constVoid, pipe } from 'fp-ts/lib/function'
import * as R from 'fp-ts/lib/Record'
import * as TE from 'fp-ts/lib/TaskEither'
import * as fs from 'fs'
import { decodeWith } from '../tools/utils'
import { RainStoreReadError, RainStoreWriteError } from './errors'
import { RainStore } from './types'

export const getRainStore = (fileName = 'rain.json') =>
  pipe(
    readFile(fileName),
    TE.chain(TE.fromEitherK(parseFile)),
    TE.map(_keepTwoDays(D.now()))
  )

export const storeRain1hMm = (fileName = 'rain.json') => (rain1hmm: number) =>
  pipe(
    getRainStore(fileName),
    TE.map(store => ({
      ...store,
      [D.now()]: rain1hmm,
    })),
    TE.chainW(writeFile(fileName))
  )

export const _keepTwoDays = (nowTimestamp: number) => (store: RainStore): RainStore =>
  pipe(
    store,
    // Remove any data 2 days old
    R.filterWithIndex(
      (timestamp, r) => Number(timestamp) >= nowTimestamp - 3600000 * 24 * 2
    )
  )

const readFile = (fileName = 'rain.json') =>
  pipe(
    TE.taskify(fs.readFile),
    read => read(fileName),
    TE.map(buffer => buffer.toString()),
    TE.orElse(l =>
      l.code === 'ENOENT'
        ? TE.right('')
        : TE.left(new RainStoreReadError(`Error reading ${fileName}`, l))
    )
  )

const parseFile = (raw: string) =>
  pipe(
    raw !== ''
      ? pipe(
          J.parse(raw),
          E.mapLeft(err => new RainStoreReadError(`Error parsing file`, E.toError(err)))
        )
      : E.right({}),
    E.chain(decodeWith(RainStore, RainStoreReadError))
  )

const writeFile = (fileName = 'rain.json') => (rainStore: RainStore) =>
  pipe(
    J.stringify(rainStore),
    E.mapLeft(e => new RainStoreWriteError(`Error writing ${fileName}`, E.toError(e))),
    TE.fromEither,
    TE.chain(raw =>
      pipe(
        TE.taskify(fs.writeFile),
        write => write(fileName, raw),
        TE.mapLeft(
          l => new RainStoreWriteError(`Error writing ${fileName}`, l)
        ),
        TE.map(constVoid)
      )
    )
  )
