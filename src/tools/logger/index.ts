import * as RIO from "fp-ts/ReaderIO"
import * as L from "logging-ts/lib/IO"
import { Entry, Level } from "./types"

export const log = (level: Level) => (
  message: string,
  metadata?: object | Error
): RIO.ReaderIO<{ logger: L.LoggerIO<Entry> }, void> => ({ logger }) =>
  logger({ message, metadata, level })

export const debug = log("Debug")
export const info = log("Info")
export const warn = log("Warning")
export const error = log("Error")
