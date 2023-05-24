import { Writable } from 'node:stream'

export class FakeStream extends Writable {
  _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    callback()
  }

  end(cb?: () => void): this {
    return super.end(cb)
  }
}
