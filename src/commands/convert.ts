import { CliUx, Command, Flags } from "@oclif/core"
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CLIError } from "@oclif/errors"
import { DEFAULT_VERSION } from "../models/component"
import { InitializerService } from "../services/initializer-service"
import { BUNDLE_DESCRIPTOR_FILE_NAME, LOGS_FOLDER } from "../paths"
import { writeFileSyncRecursive } from "../utils"
import { YamlBundleDescriptorV1 } from "../models/yaml-bundle-descriptor"
import { ConstraintsValidatorService } from "../services/constraints-validator-service"
import { YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS_V1 } from "../models/yaml-bundle-descriptor-constraints"

const DESCRIPTOR_NOT_FOUND = 'Bundle descriptor not found. Is this a v1 Bundle project?'
const DESCRIPTOR_INVALID = 'Bundle descriptor invalid. Is this a v1 Bundle project?'
const DESCRIPTOR_V5_FOUND = 'The Bundle is already a v5'

export default class Convert extends Command {
  static description = 'Perform bundle conversion from v1 to v5'

  static flags = {
    'bundle-path': Flags.string({
      description: 'the root folder is the one containing the descriptor.yaml file'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Convert)
    const { "bundle-path": bundlePath = process.cwd() } = flags;
    const register: string[] = [];

    this.isBundleDescriptorV5(bundlePath)
    const descriptorV1 = this.readDescriptorV1(bundlePath);
    const parsedDescriptor = this.parseDescriptorV1(descriptorV1)

    const { code: oldName } = parsedDescriptor
    const newName = `${oldName}-v5`
    const { dir: parentDirectory } = path.parse(path.resolve(bundlePath))
    const outDir = path.join(parentDirectory, newName)

    const options = { name: newName, parentDirectory, version: DEFAULT_VERSION }
    const initializer = new InitializerService(options)

    register.push(`Starting conversion ${oldName} to v5`)

    CliUx.ux.action.start(`Starting conversion ${oldName} to v5`)
    await initializer.performBundleInit()
    CliUx.ux.action.stop()

    register.push(
      `Initializing an empty bundle project named ${newName}... done`,
      `${'*'.repeat(5)} Manually steps to do ${'*'.repeat(5)}`,
      `Add the source files in new folders microservices, microfrontends`,
      `If you want to change the bundle name, edit the folder name and entando.json`
    )


    const logsFolder = path.resolve(outDir, ...LOGS_FOLDER)
    const logsFile = path.join(logsFolder, `conversion-${oldName}-v1-to-v5.log`)

    writeFileSyncRecursive(logsFile, register.join('\n'))

    this.log(`You can find the details at ${logsFile}.\nYou can find the new bundle v5 with name ${newName} at ${outDir}`)

  }


  private readDescriptorV1(bundlePath: string): string {
    try {
      return fs.readFileSync(path.join(bundlePath, "descriptor.yaml"), 'utf-8')
    } catch (error) {
      throw new CLIError(`${DESCRIPTOR_NOT_FOUND}\n${(error as Error).message}`)
    }
  }

  private parseDescriptorV1(descriptor: string): YamlBundleDescriptorV1 {
    try {
      const parsedDescriptorV1 = YAML.parse(descriptor)
      return ConstraintsValidatorService.validateObjectConstraints(
        parsedDescriptorV1,
        YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS_V1
      )
    } catch (error) {
      throw new CLIError(`${DESCRIPTOR_INVALID}\n${(error as Error).message}`)
    }

  }

  private isBundleDescriptorV5(bundlePath: string) {
    if (fs.existsSync(path.resolve(bundlePath, BUNDLE_DESCRIPTOR_FILE_NAME))) {
      throw new CLIError(DESCRIPTOR_V5_FOUND)
    }
  }

}