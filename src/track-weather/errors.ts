import { AbstractError } from '../errors'

export class TrackWeatherError extends AbstractError {
  public readonly type = 'TRACK_WEATHER_ERROR'
}