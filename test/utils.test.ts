import { expect } from '@oclif/test'
import { InMemoryWritable } from '../src/utils'

describe('Utilities', () => {
  it('InMemoryWritable', () => {
    const writable = new InMemoryWritable()
    writable.write('some data\n')
    writable.write('some other data')
    expect(writable.data).eq('some data\nsome other data')
  })
})
