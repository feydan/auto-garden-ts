import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { decodeWith } from '../error-utils'
import { ConfigError } from './errors'

export const getConfig = <T>(codec: t.Type<T>) =>
  pipe(process.env, decodeWith(codec, ConfigError))
