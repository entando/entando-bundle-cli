import fs from "node:fs"
import path from "node:path"
import { CLIError } from "@oclif/core/lib/errors"

const DEFAULT_CONFIG_PATH = "src/services/config/"
const DEFAULT_CONFIG_FILE = "default-config.json"
const CONFIG_FOLDER = ".ent"
const CONFIG_FILE = "config.json"

export default class ConfigService {
  private readonly _config: any

  constructor(filePath = DEFAULT_CONFIG_PATH) {
    this._config = this.readDefaultConfigFile(filePath)
  }

  get config(): any {
    return this._config
  }

  readDefaultConfigFile = (filePath: string) : any => {
    const dirContents = fs.readdirSync(filePath)
    console.log(dirContents)
    const fileContents = fs.readFileSync(path.join(filePath, DEFAULT_CONFIG_FILE), {
      encoding: "utf-8"
    })
    console.log("Default Config successfully read from disk")
    return JSON.parse(fileContents)
  }

  writeConfigFile = (bundlePath: string, fileFolder = CONFIG_FOLDER) : void => {
    const filePath = bundlePath.endsWith("/") ?
      `${bundlePath}${fileFolder}` :
      `${bundlePath}/${fileFolder}`
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true })
    }

    fs.writeFileSync(
      path.join(filePath, CONFIG_FILE),
      JSON.stringify(this._config, null, 2),
      "utf8"
    )
    console.log("Config successfully saved to disk")
  }

  addProperty = (key: string, value: string) : void => {
    console.log(`Add Property to config -> ${JSON.stringify(this._config)}`)

    if (this._config[key] === undefined) {
      this._config[key] = value
      console.log(`${key} Property Added to the config file`)
    } else {
      throw new CLIError(`Add property error, ${key} already exists`)
    }
  }

  updateProperty = (key: string, value: string) : void => {
    console.log(`Update Property to config -> ${JSON.stringify(this._config)}`)

    if (this._config[key] === undefined) {
      throw new CLIError(`Update property error, ${key} not exists`)
    } else {
      this._config[key] = value
      console.log(`${key} Property Updated to the config file`)
    }
  }

  deleteProperty = (key: string) : void => {
    if (this._config[key] === undefined) {
      throw new CLIError(`Delete property error, ${key} not exists`)
    } else {
      delete this._config[key]
      console.log(`${key} Property deleted from the config file`)
    }
  }
}
