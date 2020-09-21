import * as D from 'fp-ts/lib/Date'
import { didRainInPastTwoDays } from './index'

describe('track-weather', () => {
  it('returns true when calling didRainInPastTwoDays is called rain data that meets the threshold', () => {
    const now = D.now()
    const oneHour = 3600000
    const oneDay = oneHour * 24
    const rainStore = {
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
      [now - oneDay + 5 * oneHour + 2]: 0,
    } // Sum 17

    expect(didRainInPastTwoDays(rainStore)(16)).toBe(true)
    expect(didRainInPastTwoDays(rainStore)(17)).toBe(true)
    expect(didRainInPastTwoDays(rainStore)(18)).toBe(false)
  })
})
