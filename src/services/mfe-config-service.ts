import * as path from 'node:path'
import * as fs from 'node:fs'
import { MICROFRONTENDS_FOLDER } from '../paths'
import { MfeConfig } from '../models/mfe-config'
import { FSService } from './fs-service'

const MFE_CONFIG_FILE_NAME = 'mfe-config.json'

export class MfeConfigService {
  public writeMfeConfig(mfeName: string, mfeConfig: MfeConfig): void {
    FSService.writeJSON(this.getMfeConfigPath(mfeName), mfeConfig)
  }

  public getMfeConfig(mfeName: string): MfeConfig {
    return JSON.parse(fs.readFileSync(this.getMfeConfigPath(mfeName), 'utf-8'))
  }

  public mfeConfigExists(mfeName: string): boolean {
    return fs.existsSync(this.getMfeConfigPath(mfeName))
  }

  private getMfeConfigPath(mfeName: string): string {
    return path.resolve(MICROFRONTENDS_FOLDER, mfeName, MFE_CONFIG_FILE_NAME)
  }
}
