import * as path from 'node:path'
import * as fs from 'node:fs'
import { MICROFRONTENDS_FOLDER } from '../paths'
import { MfeConfig } from '../models/mfe-config'
import { CLIError } from '@oclif/errors'

const MFE_CONFIG_FILE_NAME = 'mfe-config.json'
const MFE_CONFIG_INDENTATION_SPACES = 4

export class MfeConfigService {
  public createMfeConfig(mfeName: string, mfeConfig: MfeConfig = {}): void {
    if (fs.existsSync(this.getMfeConfigPath(mfeName))) {
      throw new CLIError(`${this.getMfeConfigPath(mfeName)} already exists`)
    }

    this.writeMfeConfig(mfeName, mfeConfig)
  }

  public writeMfeConfig(mfeName: string, mfeConfig: MfeConfig): void {
    fs.writeFileSync(
      this.getMfeConfigPath(mfeName),
      JSON.stringify(
        mfeConfig,
        null,
        MFE_CONFIG_INDENTATION_SPACES
      )
    )
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
