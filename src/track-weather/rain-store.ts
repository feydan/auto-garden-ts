import * as D from 'fp-ts/lib/Date'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import * as R from 'fp-ts/lib/Record'
import * as TE from 'fp-ts/lib/TaskEither'
import * as fs from 'fs'
import { decodeWith } from '../error-utils'
import { RainStoreReadError, RainStoreWriteError } from './errors'
import { RainStore } from './types'

export const getRainStore = (fileName = 'rain.json') =>
  pipe(
    readFile(fileName),
    TE.chain(TE.fromEitherK(parseFile)),
    TE.map(_keepTwoDays)
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

export const _keepTwoDays = (store: RainStore): RainStore =>
  pipe(D.now(), now =>
    pipe(
      store,
      // Remove any data 2 days old
      R.filterWithIndex(
        (timestamp, r) => Number(timestamp) >= now - 3600000 * 24 * 2
      )
    )
  )

const readFile = (fileName = 'rain.json') =>
  pipe(
    TE.taskify(fs.readFile),
    readfile => readfile(fileName),
    TE.map(buffer => buffer.toString()),
    TE.orElse(l =>
      l.code === 'ENOENT'
        ? TE.right('')
        : TE.left(new RainStoreReadError(`Error reading ${fileName}`, l))
    )
  )

const parseFile = (raw: string) =>
  pipe(
    raw === ''
      ? E.parseJSON(
          raw,
          err => new RainStoreReadError(`Error parsing file`, E.toError(err))
        )
      : E.right(''),
    decodeWith(RainStore, RainStoreReadError)
  )

const writeFile = (fileName = 'rain.json') => (rainStore: RainStore) =>
  pipe(
    E.stringifyJSON(
      rainStore,
      e => new RainStoreWriteError(`Error writing ${fileName}`, E.toError(e))
    ),
    TE.fromEither,
    TE.chain(raw =>
      pipe(
        TE.taskify(fs.writeFile),
        write => write(fileName, raw),
        TE.mapLeft(l => new RainStoreWriteError(`Error writing ${fileName}`, l))
      )
    )
  )
