import * as D from "fp-ts/lib/Date"
import { didRainInPastTwoDays } from "./index"

describe("track-weather", () => {
  it("returns true when calling didRainInPastTwoDays is called rain data that meets the threshold", () => {
    const now = D.now()
    const oneHour = 3600000
    const oneDay = oneHour * 24
    const rainStore = {
      rainStore: {
        // Average 10
        [now - oneDay]: 10,
        [now - oneDay + 1]: 5,
        [now - oneDay + 2]: 15,

        // Average 5
        [now - oneDay + oneHour]: 5,
        [now - oneDay + oneHour + 1]: 10,
        [now - oneDay + oneHour + 2]: 0,

        // Average 2
        [now - oneDay + 5 * oneHour]: 2,
        [now - oneDay + 5 * oneHour + 1]: 4,
        [now - oneDay + 5 * oneHour + 2]: 0
      }
    } // Sum 17

    expect(didRainInPastTwoDays(16)(rainStore)).toBe(true)
    expect(didRainInPastTwoDays(17)(rainStore)).toBe(true)
    expect(didRainInPastTwoDays(18)(rainStore)).toBe(false)
  })

  it("does not collapse readings that are 12 hours apart into the same bucket", () => {
    const now = D.now()
    const twelveHours = 3600000 * 12

    // Two readings exactly 12 hours apart: 10mm rain, then 0mm
    // With 12-hour clock format (hh) these would share a key and average to 5mm
    // With 24-hour clock format (HH) they are separate and sum to 10mm
    const rainStore = {
      rainStore: {
        [now - twelveHours]: 10,
        [now]: 0
      }
    }

    // 10mm total: should prevent watering at 6mm threshold
    expect(didRainInPastTwoDays(6)(rainStore)).toBe(true)
  })
})
