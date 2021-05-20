import * as D from 'fp-ts/lib/Date'
import { _keepTwoDays } from './rain-store'

describe('rain-store', () => {
  it('keep two days filters events older than two days ago', () => {
    const now = D.now()
    const oneDay = 3600000 * 24
    const rainStore = {
      [now - 3 * oneDay - 1000]: 1,
      [now - 3 * oneDay]: 2,
      [now - 2 * oneDay - 1000]: 3,
      [now - 2 * oneDay]: 4,
      [now - oneDay]: 5,
      [now - oneDay + 1000]: 6,
      [now]: 7,
    }

    expect(_keepTwoDays(now)(rainStore)).toStrictEqual({
      [now - 2 * oneDay]: 4,
      [now - oneDay]: 5,
      [now - oneDay + 1000]: 6,
      [now]: 7,
    })
  })
})
