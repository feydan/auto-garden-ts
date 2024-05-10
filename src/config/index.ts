import { flow, pipe } from 'fp-ts/lib/function'
import * as t from 'io-ts'
import { decodeWith } from '../tools/utils'
import { ConfigError } from './errors'

export const getConfig = <T, A>(codec: t.Type<T, A>) =>
  pipe(process.env, decodeWith(codec, ConfigError))
