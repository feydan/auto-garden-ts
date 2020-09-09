import { AbstractError } from '../errors'

export class TrackWeatherError extends AbstractError {
  public readonly type = 'TRACK_WEATHER_ERROR'
}

export class RainStoreReadError extends AbstractError {
  public readonly type = 'RAIN_STORE_READ_ERROR'
}

export class RainStoreWriteError extends AbstractError {
  public readonly type = 'RAIN_STORE_WRITE_ERROR'
}
