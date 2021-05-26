import * as t from 'io-ts'

export const commaSeparatedList = new t.Type<string[], string>(
  'comma-separated-list',
  (u): u is string[] => true,
  (u, c) => (typeof u === 'string' ? t.success(u.split(',').map(s => s.trim())) : t.failure(u, c)),
  s => s.join(',')
)

export const commaSeparatedNumberList = new t.Type<number[], string>(
  'comma-separated-list',
  (u): u is number[] => true,
  (u, c) => (typeof u === 'string' ? t.success(u.split(',').map(s => Number(s.trim()))) : t.failure(u, c)),
  s => s.join(',')
)