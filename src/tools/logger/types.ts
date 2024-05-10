import * as t from "io-ts"
import { BooleanFromString } from "io-ts-types"
import * as L from "logging-ts/lib/IO"

export const Level = t.keyof({
  Debug: t.void,
  Info: t.void,
  Warning: t.void,
  Error: t.void
})
export type Level = t.TypeOf<typeof Level>

export interface Entry {
  message: string
  metadata?: object | Error
  level: Level
}

export interface DisplayOptions {
  displayLevel: boolean
  displayMetadata: boolean
  displayTimestamps: boolean
}

export type Serializer = (entry: Entry) => string

export const LoggerConfig = t.strict({
  LOG_LEVEL: Level,
  LOG_DISPLAY_LEVEL: BooleanFromString,
  LOG_DISPLAY_METADATA: BooleanFromString,
  LOG_DISPLAY_TIMESTAMPS: BooleanFromString
})
export type LoggerConfig = t.TypeOf<typeof LoggerConfig>

export type Logger = L.LoggerIO<Entry>
