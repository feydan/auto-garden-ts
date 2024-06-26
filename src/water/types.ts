import * as t from "io-ts"
import { NumberFromString } from "io-ts-types/NumberFromString"
import { commaSeparatedNumberList } from "../tools/io-ts-types"

export const WaterEnvConfig = t.strict({
  GPIO_PINS: commaSeparatedNumberList,
  GPIO_DIRECTION: t.keyof({
    in: true,
    out: true
  }),
  HOURS_JANUARY: NumberFromString,
  HOURS_FEBRUARY: NumberFromString,
  HOURS_MARCH: NumberFromString,
  HOURS_APRIL: NumberFromString,
  HOURS_MAY: NumberFromString,
  HOURS_JUNE: NumberFromString,
  HOURS_JULY: NumberFromString,
  HOURS_AUGUST: NumberFromString,
  HOURS_SEPTEMBER: NumberFromString,
  HOURS_OCTOBER: NumberFromString,
  HOURS_NOVEMBER: NumberFromString,
  HOURS_DECEMBER: NumberFromString,
  DAYS_PER_WEEK: NumberFromString
})
export type WaterEnvConfig = t.TypeOf<typeof WaterEnvConfig>
