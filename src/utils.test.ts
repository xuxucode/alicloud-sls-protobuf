import { describe, expect, it } from 'bun:test'
import { convertObjectToKeyValueArray } from './utils'

describe('convertObjectToKeyValueArray', () => {
  it('converts object entries to key/value array', () => {
    expect(
      convertObjectToKeyValueArray({ level: 'debug', message: 'foo', duration: 10 }),
    ).toEqual([
      { Key: 'level', Value: 'debug' },
      { Key: 'message', Value: 'foo' },
      { Key: 'duration', Value: '10' },
    ])
  })
})
