type ExtraVars =
  | string
  | number
  | Error
  | {
      [key: string]: string | number | Error | ExtraVars | ExtraVars[]
      [key: number]: string | number | Error | ExtraVars | ExtraVars[]
    }

export type AbstractErrorConstructor<L extends AbstractError> = new (
  message?: string,
  extraVars?: ExtraVars
) => L

export abstract class AbstractError extends Error {
  public abstract readonly type: string
  constructor(message?: string, public readonly extraVars?: ExtraVars) {
    super(message)
  }
}
