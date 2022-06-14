import { Writable } from 'node:stream'

export class InMemoryWritable extends Writable {
  data = ''
  public _write = (
    chunk: unknown,
    encoding: BufferEncoding,
    next: () => void
  ): void => {
    this.data += chunk
    next()
  }
}
