import * as E from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import * as t from 'io-ts'
import { reporter } from 'io-ts-reporters'
import { AbstractError, AbstractErrorConstructor } from './errors'

export const decodeWith = <L extends AbstractError, A, O, I>(codec: t.Type<A, O, I>, error: AbstractErrorConstructor<L>, errorMessage?: string) => flow(
  codec.decode, E.mapLeft(e => new error(errorMessage, { ioTsValidationErrors: reporter(E.left(e)) }))
)