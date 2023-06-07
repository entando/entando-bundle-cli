import { CliUx, Command, Flags } from "@oclif/core"
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CLIError } from "@oclif/errors"
import { DEFAULT_VERSION } from "../models/component"
import { InitializerService } from "../services/initializer-service"
import { LOGS_FOLDER } from "../paths"
import { writeFileSyncRecursive } from "../utils"

const DESCRIPTOR_ERROR = 'Bundle descriptor not found or invalid. Is this a v1 Bundle project?'

export default class Convert extends Command {
  static description = 'Perform bundle conversion from v1 to v5'

  static flags = {
    'bundle-path': Flags.string({
      description: 'path of bundle v1 to convert'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Convert)
    const { "bundle-path": bundlePath = process.cwd() } = flags;
    const register: string[] = [];

    const parsedDescriptor = this.parseDescriptorV1(bundlePath)

    const { code: name } = parsedDescriptor
    const { dir } = path.parse(path.resolve(bundlePath))
    const outDir = path.join(dir, `${name}-v5`)

    const options = { name: `${name}-v5`, parentDirectory: dir, version: DEFAULT_VERSION }
    const initializer = new InitializerService(options)

    register.push(`Starting conversion ${name} to v5`)

    CliUx.ux.action.start(`Starting conversion ${name} to v5`)
    await initializer.performBundleInit()
    CliUx.ux.action.stop()

    register.push(
      `Initializing an empty bundle project named ${name}-v5... done`,
      `${'*'.repeat(5)} Manually steps to do ${'*'.repeat(5)}`,
      `Add the source files in new folders microservices, microfrontends`,
      `If you want to change the bundle name, edit the folder name and entando.json`
    )


    const logsFolder = path.resolve(outDir, ...LOGS_FOLDER)
    const logsFile = path.join(logsFolder, `conversion-${name}-v1-to-v5.log`)

    writeFileSyncRecursive(logsFile, register.join('\n'))

    this.log(`You can find the details at ${logsFile}`)

  }

  private parseDescriptorV1(bundlePath: string) {
    try {
      const descriptor = fs.readFileSync(path.join(bundlePath, "descriptor.yaml"), 'utf-8')
      // TODO: you can add validation here
      return YAML.parse(descriptor)

    } catch {
      throw new CLIError(DESCRIPTOR_ERROR)
    }

  }

}