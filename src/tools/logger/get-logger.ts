import * as R from "fp-ts/Record"
import * as L from "logging-ts/lib/IO"
import { Entry, Level, LoggerConfig } from "./types"

const levelMap: Record<Level, Partial<Record<Level, any>>> = {
  Error: { Error: "" },
  Warning: { Error: "", Warning: "" },
  Info: { Error: "", Warning: "", Info: "" },
  Debug: { Error: "", Warning: "", Info: "", Debug: "" }
}
const levelPredicate = (level: Level) => (entry: Entry) =>
  R.has(entry.level, levelMap[level] as Record<Level, any>)

interface LoggerDeps {
  loggerIO: L.LoggerIO<Entry>
  level: Level
}
export const getLogger = (deps: LoggerDeps) =>
  L.filter(deps.loggerIO, levelPredicate(deps.level))