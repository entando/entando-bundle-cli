import { Writable } from 'node:stream'
import { EOL } from 'node:os'
import color from '@oclif/color'

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

export class ColorizedWritable extends Writable {
  prefix = ''
  data = ''

  randomColor: (chunk: string) => void

  constructor(prefix: string, maxPrefixLength: number) {
    super()
    this.randomColor = color.hsl(Math.floor(Math.random() * 360), 100, 50)
    this.prefix = `${prefix.padEnd(maxPrefixLength, ' ')} |`
  }

  public _write = (
    chunk: unknown,
    encoding: BufferEncoding,
    next: () => void
  ): void => {
    const chunkString = (chunk as Buffer).toString()
    this.data += chunkString

    if (chunkString.endsWith(EOL)) {
      for (const s of this.data.trimEnd().split(EOL)) {
        process.stdout.write(`${this.randomColor(this.prefix)} ${s} ${EOL}`)
      }

      this.data = ''
    }

    next()
  }
}
