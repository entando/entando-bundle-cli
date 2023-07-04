import path = require('node:path')
import * as fs from 'node:fs'
import {
  YamlEnvironmentVariable,
  YamlPluginDescriptorV1
} from '../../models/yaml-bundle-descriptor'
import * as YAML from 'yaml'
import { debugFactory } from '../debug-factory-service'
import { MicroserviceStack } from '../../models/component'
import {
  EnvironmentVariable,
  Microservice,
  SecretEnvironmentVariable,
  SimpleEnvironmentVariable
} from '../../models/bundle-descriptor'
import { CliUx } from '@oclif/core'
import { ConstraintsValidatorService } from '../constraints-validator-service'
import { YAML_PLUGIN_DESCRIPTOR_CONSTRAINTS_V1 } from '../../models/yaml-bundle-descriptor-constraints'
import { MicroserviceService } from '../microservice-service'

const DELIMITER = '-'.repeat(process.stdout.columns ?? '10')
const PLUGIN_TO_MICROSERVICE_DESCRIPTION =
  'CONVERSION FROM PLUGINS TO MICROSERVICES'

export class PluginConverter {
  private static debug = debugFactory(PluginConverter)

  public static convertPluginToMicroServices(
    bundlePath: string,
    outDir: string,
    pluginPaths: string[]
  ): string[] {
    const report: string[] = []
    report.push(`\n${PLUGIN_TO_MICROSERVICE_DESCRIPTION}`)

    for (const pluginPath of pluginPaths) {
      report.push(DELIMITER, `Start conversion of ${path.basename(pluginPath)}`)

      // read the plugin descriptor
      if (!fs.existsSync(path.resolve(bundlePath, pluginPath))) {
        const msg = `Plugin descriptor for plugin ${path.basename(
          pluginPath
        )} not found. It will be skipped.`
        PluginConverter.debug(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }

      // read the plugin descriptor
      const plugin = PluginConverter.parsePluginDescriptor(
        path.resolve(bundlePath, pluginPath)
      )
      if (plugin instanceof Error) {
        PluginConverter.debug(`${plugin.message}\nIt will be skipped.`)
        report.push(`${plugin.message}\nCheck it if you want to include it`)
        continue
      }

      // validate the plugin descriptor
      try {
        ConstraintsValidatorService.validateObjectConstraints(
          plugin,
          YAML_PLUGIN_DESCRIPTOR_CONSTRAINTS_V1
        )
      } catch (error) {
        const microserviceId =
          plugin.name ?? path.basename(pluginPath).split('.').shift()
        const msg = `The microservice ${microserviceId} is invalid.\n${
          (error as Error).message
        }.\nIts conversion will be skipped.`
        PluginConverter.debug(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }

      // mapping from plugin to microservice
      const {
        name,
        roles,
        dbms,
        healthCheckPath,
        permissions,
        environmentVariables,
        securityLevel,
        resources,
        ingressPath,
        image
      } = plugin
      const microservice = {
        name: name ?? PluginConverter.getNameFromImage(image),
        roles,
        dbms,
        healthCheckPath,
        permissions,
        env: environmentVariables
          ? PluginConverter.generateEnvVarFromEnvYaml(environmentVariables)
          : undefined,
        securityLevel,
        resources,
        ingressPath,
        stack: MicroserviceStack.Custom,
        commands: {}
      } as Microservice

      // add the microservice
      const microserviceService: MicroserviceService = new MicroserviceService(
        outDir
      )

      CliUx.ux.action.start(`Adding a new microservice ${microservice.name}`)
      microserviceService.addMicroservice(microservice)
      CliUx.ux.action.stop()

      report.push(
        `The conversion of microservice ${microservice.name} was successful`
      )
    }

    report.push(DELIMITER)
    return report
  }

  private static getNameFromImage(image: string): string {
    const delimiter = image.includes('@') ? '@' : ':'
    return path.basename(image).split(delimiter).shift()!
  }

  private static generateEnvVarFromEnvYaml(
    yamlEnvVars: YamlEnvironmentVariable[]
  ): EnvironmentVariable[] {
    return yamlEnvVars.map(yamlEnvVar => {
      const { name, valueFrom, value } = yamlEnvVar as {
        name: string
        valueFrom?: { secretKeyRef: { key: string; name: string } }
        value?: string
      }
      return valueFrom
        ? ({
            name,
            secretKeyRef: valueFrom.secretKeyRef
          } as SecretEnvironmentVariable)
        : ({ name, value } as SimpleEnvironmentVariable)
    })
  }

  private static parsePluginDescriptor(
    pluginPath: string
  ): YamlPluginDescriptorV1 | Error {
    try {
      const pluginYaml = fs.readFileSync(pluginPath, 'utf-8')
      return YAML.parse(pluginYaml)
    } catch (error) {
      return new Error(
        `Failed to parse plugin descriptor: ${(error as Error).message}`
      )
    }
  }
}
