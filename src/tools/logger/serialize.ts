import * as E from "fp-ts/Either"
import * as IO from "fp-ts/IO"
import * as J from "fp-ts/Json"
import { pipe } from "fp-ts/lib/function"
import { DisplayOptions, Entry, Serializer } from "./types"

export const serialize = (options: DisplayOptions) => (
  time: IO.IO<number>
): Serializer => (entry: Entry) => {
  const level = options.displayLevel ? `[${entry.level}]` : ""
  const timestamp = options.displayTimestamps
    ? new Date(time()).toLocaleString()
    : ""
  const meta = options.displayMetadata
    ? pipe(
        J.stringify(entry.metadata),
        E.getOrElse(l => String(l))
      )
    : ""
  return `${level} ${timestamp} ${entry.message} ${meta}`
}
