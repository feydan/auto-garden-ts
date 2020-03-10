import { AbstractError } from '../errors'

export class ConfigError extends AbstractError {
  public readonly type = 'CONFIG_ERROR'
}