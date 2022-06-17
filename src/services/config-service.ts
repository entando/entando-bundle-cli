import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { CLIError } from '@oclif/core/lib/errors'
import { CONFIG_FOLDER, CONFIG_FILE } from '../paths'

export const DOCKER_ORGANIZATION_PROPERTY = 'docker-organization'
export const DOCKER_REGISTRY_PROPERTY = 'docker-registry'

export class ConfigService {
  private config: { [key: string]: string } = {}

  getProperty(key: string): string | undefined {
    this.readConfigFile()
    return this.config[key]
  }

  getProperties(): { [key: string]: string } {
    this.readConfigFile()
    return this.config
  }

  addProperty(key: string, value: string): void {
    this.readConfigFile()

    if (this.config[key] === undefined) {
      this.config[key] = value
    } else {
      throw new CLIError(`Add property error, ${key} already exists`)
    }

    this.writeConfigFile()
  }

  updateProperty(key: string, value: string): void {
    this.readConfigFile()

    if (this.config[key] === undefined) {
      throw new CLIError(`Update property error, ${key} not exists`)
    } else {
      this.config[key] = value
    }

    this.writeConfigFile()
  }

  addOrUpdateProperty(key: string, value: string): void {
    this.readConfigFile()
    this.config[key] = value
    this.writeConfigFile()
  }

  deleteProperty(key: string): void {
    this.readConfigFile()

    if (this.config[key] === undefined) {
      throw new CLIError(`Delete property error, ${key} not exists`)
    } else {
      delete this.config[key]
    }

    this.writeConfigFile()
  }

  private readConfigFile(): void {
    const configFilePath = path.join(CONFIG_FOLDER, CONFIG_FILE)
    if (fs.existsSync(configFilePath)) {
      const configFile = fs.readFileSync(configFilePath, {
        encoding: 'utf-8'
      })
      this.config = JSON.parse(configFile)
    }
  }

  private writeConfigFile(): void {
    if (!fs.existsSync(CONFIG_FOLDER)) {
      fs.mkdirSync(CONFIG_FOLDER)
    }

    fs.writeFileSync(
      path.join(CONFIG_FOLDER, CONFIG_FILE),
      JSON.stringify(this.config, null, 2) + os.EOL,
      'utf8'
    )
  }
}
