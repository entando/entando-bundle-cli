import * as fs from "node:fs"
import * as path from "node:path"
import { CLIError } from "@oclif/core/lib/errors"

const DEFAULT_CONFIG_PATH = path.resolve(__dirname)
const DEFAULT_CONFIG_FILE = "default-config.json"
const CONFIG_FOLDER = ".ent"
const CONFIG_FILE = "config.json"

export default class ConfigService {
  private readonly _config: any

  constructor(filePath = DEFAULT_CONFIG_PATH) {
    this._config = this.readConfigFile(filePath)
  }

  get config(): any {
    return this._config
  }

  readConfigFile = (filePath: string): any => {
    const templateFileContent = fs.readFileSync(
      path.join(filePath, DEFAULT_CONFIG_FILE),
      {
        encoding: "utf-8"
      }
    )

    return JSON.parse(templateFileContent)
  }

  writeConfigFile = (bundlePath: string, fileFolder = CONFIG_FOLDER): void => {
    const filePath = path.join(bundlePath, fileFolder)
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true })
    }

    fs.writeFileSync(
      path.join(filePath, CONFIG_FILE),
      JSON.stringify(this._config, null, 2),
      "utf8"
    )
  }

  addProperty = (key: string, value: string): void => {
    if (this._config[key] === undefined) {
      this._config[key] = value
    } else {
      throw new CLIError(`Add property error, ${key} already exists`)
    }
  }

  updateProperty = (key: string, value: string): void => {
    if (this._config[key] === undefined) {
      throw new CLIError(`Update property error, ${key} not exists`)
    } else {
      this._config[key] = value
    }
  }

  deleteProperty = (key: string): void => {
    if (this._config[key] === undefined) {
      throw new CLIError(`Delete property error, ${key} not exists`)
    } else {
      delete this._config[key]
    }
  }
}
