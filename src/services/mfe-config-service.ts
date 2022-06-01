import * as path from 'node:path'
import * as fs from 'node:fs'
import { MfeConfig } from '../models/mfe-config'
import { FSService } from './fs-service'
import { MicroFrontendService } from './microfrontend-service'

const MFE_CONFIG_FILE_NAME = 'mfe-config.json'

export class MfeConfigService {
  private readonly microFrontendService: MicroFrontendService

  constructor() {
    this.microFrontendService = new MicroFrontendService()
  }

  public writeMfeConfig(mfeName: string, mfeConfig: MfeConfig): void {
    const mfePublicFolderPath: string =
      this.microFrontendService.getPublicFolderPath(mfeName)

    if (!fs.existsSync(mfePublicFolderPath)) {
      fs.mkdirSync(mfePublicFolderPath, { recursive: true })
    }

    FSService.writeJSON(this.getMfeConfigPath(mfeName), mfeConfig)
  }

  public getMfeConfig(mfeName: string): MfeConfig {
    return JSON.parse(fs.readFileSync(this.getMfeConfigPath(mfeName), 'utf-8'))
  }

  public mfeConfigExists(mfeName: string): boolean {
    return fs.existsSync(this.getMfeConfigPath(mfeName))
  }

  public getMfeConfigPath(mfeName: string): string {
    const mfePublicFolderPath: string =
      this.microFrontendService.getPublicFolderPath(mfeName)

    return path.resolve(mfePublicFolderPath, MFE_CONFIG_FILE_NAME)
  }
}
