import * as fs from 'node:fs'
import * as path from 'node:path'

export enum ThumbnailStatusMessage {
  FILESIZE_EXCEEDED = 'Bundle thumbnail file ignored because the file size exceeds 100 KB.',
  OK = 'passed',
  NO_THUMBNAIL = 'No bundle thumbnail found. Please provide a `thumbnail.(png|jpg|jpeg)` and place it under the root of your bundle directory.'
}

export type BundleThumbnailInfo = {
  path?: string
  size: number
  status: ThumbnailStatusMessage
  base64?: string
}

export class BundleThumbnailService {
  private readonly bundleDirectory: string
  private size: number
  private status: ThumbnailStatusMessage
  private base64?: string
  private path?: string

  constructor() {
    this.bundleDirectory = process.cwd()
    this.size = 0
    this.status = ThumbnailStatusMessage.NO_THUMBNAIL
  }

  public processThumbnail(): void {
    this.path = this.findThumbnail()
    if (this.path === '') {
      return
    }

    const stats = fs.statSync(this.path)
    this.size = stats.size / 1024
    if (this.size > 100) {
      this.status = ThumbnailStatusMessage.FILESIZE_EXCEEDED
      return
    }

    this.status = ThumbnailStatusMessage.OK
    const ext = path.extname(this.path).slice(1)

    this.base64 = `data:image/${
      ['jpg', 'jpeg'].includes(ext) ? 'jpeg' : ext
    };base64,${Buffer.from(fs.readFileSync(this.path)).toString('base64')}`
  }

  private findThumbnail(): string {
    for (const ext of ['png', 'jpg', 'jpeg']) {
      const thumb = path.resolve(this.bundleDirectory, `thumbnail.${ext}`)
      if (fs.existsSync(thumb)) {
        return thumb
      }
    }

    return ''
  }

  public getThumbnailInfo(): BundleThumbnailInfo {
    const info: BundleThumbnailInfo = {
      size: this.size,
      status: this.status
    }
    if (this.path) info.path = this.path
    if (this.base64) info.base64 = this.base64
    return info
  }
}
