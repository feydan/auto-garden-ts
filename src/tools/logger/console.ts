import * as C from "fp-ts/Console"
import * as L from "logging-ts/lib/IO"
import { getLogger } from "./get-logger"
import { serialize } from "./serialize"
import { Entry, LoggerConfig, Serializer } from "./types"

interface ConsoleLoggerDeps {
  serialize: Serializer
}
export const consoleLogger = (
  deps: ConsoleLoggerDeps
): L.LoggerIO<Entry> => entry => C.log(deps.serialize(entry))

export const getDefaultConsoleLogger = ({
  config,
  time
}: {
  config: LoggerConfig
  time: () => number
}) =>
  getLogger({
    loggerIO: consoleLogger({
      serialize: serialize({
        displayLevel: config.LOG_DISPLAY_LEVEL,
        displayMetadata: config.LOG_DISPLAY_METADATA,
        displayTimestamps: config.LOG_DISPLAY_TIMESTAMPS
      })(time)
    }),
    level: config.LOG_LEVEL
  })
