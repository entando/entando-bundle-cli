import { CliUx, Command, Flags } from '@oclif/core'
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CLIError } from '@oclif/errors'
import { DEFAULT_VERSION } from '../models/component'
import { InitializerService } from '../services/initializer-service'
import {
  BUNDLE_DESCRIPTOR_FILE_NAME,
  LOGS_FOLDER,
  PSC_FOLDER,
  SVC_FOLDER
} from '../paths'
import { YamlBundleDescriptorV1 } from '../models/yaml-bundle-descriptor'
import { ConstraintsValidatorService } from '../services/constraints-validator-service'
import { YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS_V1 } from '../models/yaml-bundle-descriptor-constraints'
import { PSCService } from '../services/psc-service'
import { WidgetConverter } from '../services/convert/widget-converter'
import { PluginConverter } from '../services/convert/plugin-converter'
import { ServiceConverter } from '../services/convert/service-converter'
import { FSService } from '../services/fs-service'

const DESCRIPTION_CONVERT_LOG_FILE = 'CONVERSION LOG'
const DESCRIPTOR_NOT_FOUND =
  'Bundle descriptor not found. Is this a v1 Bundle project?'
const DESCRIPTOR_INVALID =
  'Bundle descriptor invalid. Is this a v1 Bundle project?'
const DESCRIPTOR_V5_FOUND = 'The Bundle is already a v5'
const MANUALLY_STEPS_DESCRIPTION = 'MANUALLY STEPS TO DO'
const SERVICE_FILES_DESCRIPTION = 'CONVERSION OF SERVICE FILES'
const PLATFORM_FILES_DESCRIPTION = 'CONVERSION OF PLATFORM FILES'

export default class Convert extends Command {
  static description = 'Perform bundle conversion from v1 to v5'

  static flags = {
    'bundle-path': Flags.string({
      description:
        'the root folder is the one containing the descriptor.yaml file'
    }),
    'svc-path': Flags.string({
      description:
        'the services folder is the one containing the Docker Compose files',
      required: false
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Convert)
    const { 'bundle-path': bundlePath = process.cwd() } = flags
    let { 'svc-path': servicePath } = flags
    const register: string[] = []

    this.isBundleDescriptorV5(bundlePath)
    const descriptorV1 = this.readDescriptorV1(bundlePath)
    const parsedDescriptor = this.parseDescriptorV1(descriptorV1)

    const { code: oldName } = parsedDescriptor
    const newName = `${oldName}-v5`
    const { dir: parentDirectory } = path.parse(path.resolve(bundlePath))
    const outDir = path.join(parentDirectory, newName)

    register.push(
      `${DESCRIPTION_CONVERT_LOG_FILE}\n`,
      `Starting conversion ${oldName} to v5`
    )

    const options = { name: newName, parentDirectory, version: DEFAULT_VERSION }
    const initializer = new InitializerService(options)

    // init phase
    CliUx.ux.action.start(`Starting conversion ${oldName} to v5`)
    await initializer.performBundleInit()
    CliUx.ux.action.stop()

    register.push(
      `Initializing an empty bundle project named ${newName}... done`
    )

    const {
      components: { plugins, widgets }
    } = parsedDescriptor

    // adds microservices
    if (plugins) {
      const msStatus = PluginConverter.convertPluginToMicroServices(
        bundlePath,
        outDir,
        plugins
      )
      register.push(...msStatus)
    }

    // convert widgets -> mfe or platform files
    if (widgets) {
      const widgetsToConvert = await WidgetConverter.getWidgetsToConvert(
        widgets
      )
      const widgetToMfeStatus = WidgetConverter.convertWidgetsToMicrofrontends(
        bundlePath,
        outDir,
        widgetsToConvert.mfes
      )
      const widgetToPscStatus = WidgetConverter.convertWidgetsToPlatformFiles(
        bundlePath,
        outDir,
        widgetsToConvert.widgets
      )
      register.push(...widgetToMfeStatus, ...widgetToPscStatus)
    }

    // adds services
    servicePath =
      servicePath ??
      (await CliUx.ux.prompt('Services path (optional)', { required: false }))

    if (servicePath) {
      ServiceConverter.convertServiceFiles(this.config.bin, servicePath, outDir)
      register.push(
        `\n${SERVICE_FILES_DESCRIPTION}`,
        'The service files have been converted as possible, ' +
          `evaluate the output files that are available in ${path.resolve(
            outDir,
            SVC_FOLDER
          )}`
      )
    }

    // import platform files
    CliUx.ux.action.start(`Starting import platform files`)
    const platformDescReport = PSCService.copyPSCFilesFromDirToAnother(
      bundlePath,
      path.resolve(outDir, PSC_FOLDER)
    )
    register.push(
      `\n${PLATFORM_FILES_DESCRIPTION}`,
      'Report of platform files and their descriptors',
      JSON.stringify(platformDescReport, null, 2)
    )
    CliUx.ux.action.stop()

    register.push(
      `\n${MANUALLY_STEPS_DESCRIPTION}`,
      'Add the source files in new folders microservices, microfrontends',
      'Check that you have in your docker compose files a service name corresponding to the service filename',
      'If you want to change the bundle name, edit the folder name and entando.json\n'
    )

    const logsFolder = path.resolve(outDir, ...LOGS_FOLDER)
    const logsFile = path.join(logsFolder, `conversion-${oldName}-v1-to-v5.log`)

    FSService.writeFileSyncRecursive(logsFile, register.join('\n'))

    this.log(
      `You can find the details at ${logsFile}\nYou can find the new bundle v5 with name ${newName} at ${outDir}`
    )
  }

  private readDescriptorV1(bundlePath: string): string {
    try {
      return fs.readFileSync(path.join(bundlePath, 'descriptor.yaml'), 'utf-8')
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
