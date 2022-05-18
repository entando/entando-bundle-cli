import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { CLIError } from '@oclif/core/lib/errors'
import { CONFIG_FOLDER, CONFIG_FILE } from '../paths'

export default class ConfigService {
  private _config: { [key: string]: string } = {}

  private readConfigFile = (): void => {
    const configFile = fs.readFileSync(path.join(CONFIG_FOLDER, CONFIG_FILE), {
      encoding: 'utf-8'
    })
    this._config = JSON.parse(configFile)
  }

  private writeConfigFile = (): void => {
    const filePath = path.join(CONFIG_FOLDER)

    fs.writeFileSync(
      path.join(filePath, CONFIG_FILE),
      JSON.stringify(this._config, null, 2) + os.EOL,
      'utf8'
    )
  }

  hasProperty = (key: string): boolean => {
    this.readConfigFile()
    const configElement = this._config[key]
    return configElement !== undefined
  }

  getProperty = (key: string): string => {
    this.readConfigFile()

    const configElement = this._config[key]
    if (configElement === undefined) {
      throw new CLIError(`Property ${key} not found`)
    }

    return configElement
  }

  addProperty = (key: string, value: string): void => {
    this.readConfigFile()

    if (this._config[key] === undefined) {
      this._config[key] = value
    } else {
      throw new CLIError(`Add property error, ${key} already exists`)
    }

    this.writeConfigFile()
  }

  updateProperty = (key: string, value: string): void => {
    this.readConfigFile()

    if (this._config[key] === undefined) {
      throw new CLIError(`Update property error, ${key} not exists`)
    } else {
      this._config[key] = value
    }

    this.writeConfigFile()
  }

  deleteProperty = (key: string): void => {
    this.readConfigFile()

    if (this._config[key] === undefined) {
      throw new CLIError(`Delete property error, ${key} not exists`)
    } else {
      delete this._config[key]
    }

    this.writeConfigFile()
  }
}
