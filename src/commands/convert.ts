import { CliUx, Command, Flags } from "@oclif/core"
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CLIError } from "@oclif/errors"
import { DEFAULT_VERSION, MicroserviceStack } from "../models/component"
import { InitializerService } from "../services/initializer-service"
import { BUNDLE_DESCRIPTOR_FILE_NAME, LOGS_FOLDER, SVC_FOLDER } from "../paths"
import { writeFileSyncRecursive } from "../utils"
import { YamlBundleDescriptorV1, YamlEnvironmentVariable, YamlPluginDescriptor } from "../models/yaml-bundle-descriptor"
import { ConstraintsValidatorService } from "../services/constraints-validator-service"
import { YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS_V1, YAML_PLUGIN_DESCRIPTOR_CONSTRAINTS_V1 } from "../models/yaml-bundle-descriptor-constraints"
import { EnvironmentVariable, Microservice, SecretEnvironmentVariable, SimpleEnvironmentVariable } from "../models/bundle-descriptor"
import { MicroserviceService } from "../services/microservice-service"
import { FSService } from "../services/fs-service"
import { SvcService } from "../services/svc-service"

const DESCRIPTOR_NOT_FOUND = 'Bundle descriptor not found. Is this a v1 Bundle project?'
const DESCRIPTOR_INVALID = 'Bundle descriptor invalid. Is this a v1 Bundle project?'
const DESCRIPTOR_V5_FOUND = 'The Bundle is already a v5'

export default class Convert extends Command {
  static description = 'Perform bundle conversion from v1 to v5'

  static flags = {
    'bundle-path': Flags.string({
      description: 'the root folder is the one containing the descriptor.yaml file'
    }),
    'svc-path': Flags.string({
      description: 'the services folder is the one containing the Docker Compose files',
      required: false
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Convert)
    const { "bundle-path": bundlePath = process.cwd() } = flags;
    let { "svc-path": servicePath  } = flags;
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

    // init phase
    CliUx.ux.action.start(`Starting conversion ${oldName} to v5`)
    await initializer.performBundleInit()
    CliUx.ux.action.stop()

    register.push(
      `Initializing an empty bundle project named ${newName}... done`,
      `${'*'.repeat(5)} Manually steps to do ${'*'.repeat(5)}`,
    )

    const { components: { plugins } } = parsedDescriptor

    // adds microservices
    if (plugins) {
      const msStatus = this.convertPluginToMicroServices(bundlePath, outDir, plugins)
      register.push(...msStatus)
    }

    // adds services
    servicePath = servicePath ?? await CliUx.ux.prompt(
      'Please provide the path to the service files (optional)',
      { required: false }
    )

    if (servicePath) {
      this.convertServiceFiles(servicePath, outDir)
      register.push("The service files have been converted as possible, " +
      `evaluate the output files that are available in ${outDir}/${SVC_FOLDER}`)
    }

    register.push(
      "Add the source files in new folders microservices, microfrontends",
      "Check that you have in your docker compose files a service name corresponding to the service filename",
      "If you want to change the bundle name, edit the folder name and entando.json"
    )


    const logsFolder = path.resolve(outDir, ...LOGS_FOLDER)
    const logsFile = path.join(logsFolder, `conversion-${oldName}-v1-to-v5.log`)

    writeFileSyncRecursive(logsFile, register.join('\n'))

    this.log(`You can find the details at ${logsFile}\nYou can find the new bundle v5 with name ${newName} at ${outDir}`)

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

  private convertPluginToMicroServices(bundlePath: string, outDir: string, pluginPaths: string[]): string[] {
    const report: string [] = []
    for (const pluginPath of pluginPaths) {
      
      // read the plugin descriptor
      if (!fs.existsSync(path.resolve(bundlePath, pluginPath))){
        const msg = `Plugin descriptor for plugin ${path.basename(pluginPath)} not found. It will be skipped.`
        this.log(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }

      const pluginYaml = fs.readFileSync(path.resolve(bundlePath, pluginPath), 'utf-8')
      const plugin: YamlPluginDescriptor = YAML.parse(pluginYaml)

      // validate the plugin descriptor
      try {
        ConstraintsValidatorService.validateObjectConstraints(
          plugin,
          YAML_PLUGIN_DESCRIPTOR_CONSTRAINTS_V1
        )

      } catch (error) {
        const microserviceId = plugin.name ?? path.basename(pluginPath).split('.').shift()
        const msg = `The microservice ${microserviceId} is invalid.\n${(error as Error).message}.\nIts conversion will be skipped.`
        this.log(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }
      
      // mapping from plugin to microservice
      const { name, roles, dbms, healthCheckPath, permissions, environmentVariables, securityLevel, resources, ingressPath, image } = plugin
      const microservice = {
        name: name ?? this.getNameFromImage(image),
        roles,
        dbms,
        healthCheckPath,
        permissions,
        env: environmentVariables ? this.generateEnvVarFromEnvYaml(environmentVariables) : undefined,
        securityLevel,
        resources,
        ingressPath,
        stack: MicroserviceStack.Custom,
        commands: {}
      } as Microservice

      // add the microservice
      const microserviceService: MicroserviceService = new MicroserviceService(outDir)

      CliUx.ux.action.start(`Adding a new microservice ${microservice.name}`)
      microserviceService.addMicroservice(microservice)
      CliUx.ux.action.stop()

      report.push(`The conversion of microservice ${microservice.name} was successful`)
    }

    return report
  }


  private generateEnvVarFromEnvYaml(yamlEnvVars: YamlEnvironmentVariable[]): EnvironmentVariable[] {
    return yamlEnvVars.map(yamlEnvVar => {
      const { name, valueFrom, value } = yamlEnvVar as { name: string, valueFrom?: { secretKeyRef: { key: string, name: string } }, value?: string }
      return valueFrom
        ? { name, secretKeyRef: valueFrom.secretKeyRef } as SecretEnvironmentVariable
        : { name, value } as SimpleEnvironmentVariable
    })
  }

  private getNameFromImage(image: string): string {
    const delimiter = image.includes('@') ? '@' : ':'
    return path.basename(image).split(delimiter).shift()!
  }


  private convertServiceFiles(servicePath: string, outDir: string) {
    FSService.copyFolderRecursiveSync(
      servicePath,
      path.join(outDir, SVC_FOLDER)
    )

    const svcService: SvcService = new SvcService(this.config.bin, outDir)
    const userAvailableServices = svcService.getUserAvailableServices()
    
    for (const svc of userAvailableServices) {
      CliUx.ux.action.start(`Enabling service ${svc}`)
      svcService.enableService(svc)
      CliUx.ux.action.stop()
    }

  }

}