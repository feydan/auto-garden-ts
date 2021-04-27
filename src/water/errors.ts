import { AbstractError } from '../errors'

export class InvalidMonthError extends AbstractError {
  public readonly type = 'INVALID_MONTH_ERROR'
}