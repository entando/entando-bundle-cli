import { Writable } from 'node:stream'
import { EOL } from 'node:os'
import color from '@oclif/color'
import * as spinners from 'cli-spinners'
import { CliUx } from '@oclif/core'

export const EXIT_CODES = {
  SUCCESS: 0,
  GENERIC_ERROR: 1
}

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

export function animatedProgress(): any {
  return CliUx.ux.progress({
    format(options: any, params: any, payload: any): string {
      const completed = options.barCompleteString.slice(
        0,
        Math.round(params.progress * options.barsize)
      )
      const incompleted = options.barIncompleteString.slice(
        Math.round(params.progress * options.barsize) + 1
      )

      const spinnerFrames = spinners.line.frames
      const index = payload.index ?? 0
      payload.index = (index + 1) % spinnerFrames.length

      const animation = spinnerFrames[index]

      const bar =
        params.progress === 1 ? completed : completed + animation + incompleted

      const elapsedTime = new Date(Date.now() - params.startTime)
        .toISOString()
        .slice(11, 19)

      const percentage = Math.round(params.progress * 100)

      return `progress [${bar}] ${percentage}% | ETA: ${params.eta}s | ${params.value}/${params.total} | Time: ${elapsedTime}`
    }
  })
}
