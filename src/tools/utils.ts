import * as IO from "fp-ts/IO"
import * as E from "fp-ts/lib/Either"
import { flow, pipe } from "fp-ts/lib/function"
import * as t from "io-ts"
import reporter from "io-ts-reporters"
import { AbstractError, AbstractErrorConstructor } from "../errors"

export const decodeWith = <L extends AbstractError, A, O, I>(
  codec: t.Type<A, O, I>,
  error: AbstractErrorConstructor<L>,
  errorMessage?: string
) =>
  flow(
    codec.decode,
    E.mapLeft(
      e =>
        new error(errorMessage, {
          ioTsValidationErrors: reporter.report(E.left(e))
        })
    )
  )

export const observe = <S, T>(f: (a: S) => T) => (a: S) => pipe(f(a), () => a)
export const observeIO = <S, T>(f: (a: S) => IO.IO<T>) => (a: S) =>
  pipe(
    f(a),
    IO.map(() => a)
  )
