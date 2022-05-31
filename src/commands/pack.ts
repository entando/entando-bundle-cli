import { CliUx, Flags } from '@oclif/core'
import { ComponentType } from '../models/component'
import { BundleDescriptorConverterService } from '../services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import { ComponentService } from '../services/component-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../services/config-service'
import { debugFactory } from '../services/debug-factory-service'
import {
  DEFAULT_DOCKERFILE_NAME,
  DockerBuildOptions,
  DockerService
} from '../services/docker-service'
import { BaseBuildCommand } from './base-build'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../paths'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { Phase } from '../services/command-factory-service'
import { color } from '@oclif/color'
import * as fs from 'node:fs'

export default class Pack extends BaseBuildCommand {
  static description = 'Generates the bundle Docker image'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --org=my-org'
  ]

  static flags = {
    build: Flags.boolean({
      char: 'b',
      description: 'Builds all bundle components before creating the package'
    }),
    org: Flags.string({
      char: 'o',
      description: 'Docker organization name'
    }),
    file: Flags.string({
      char: 'f',
      description: 'Bundle Dockerfile (default is Dockerfile)',
      required: false
    })
  }

  private static debug = debugFactory(Pack)

  configService = new ConfigService()

  public async run(): Promise<void> {
    const bundleDir = process.cwd()
    BundleService.verifyBundleInitialized(bundleDir)

    const { flags } = await this.parse(Pack)

    const bundleDescriptorService = new BundleDescriptorService(bundleDir)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    if (flags.build) {
      await this.buildAllComponents(Phase.Package)
    }

    const dockerOrganization = await this.getDockerOrganization(flags.org)

    await this.buildMicroServicesDockerImages(dockerOrganization)

    await this.buildBundleDockerImage(
      bundleDir,
      bundleDescriptor,
      dockerOrganization
    )
  }

  private async getDockerOrganization(flagOrganization: string | undefined) {
    const configuredOrganization = this.configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )

    if (flagOrganization) {
      this.configService.addOrUpdateProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        flagOrganization
      )
      return flagOrganization
    }

    if (configuredOrganization) {
      return configuredOrganization
    }

    const newOrganization: string = await CliUx.ux.prompt(
      'Enter Docker organization'
    )
    this.configService.addProperty(
      DOCKER_ORGANIZATION_PROPERTY,
      newOrganization
    )
    return newOrganization
  }

  private async buildMicroServicesDockerImages(dockerOrganization: string) {
    const componentService = new ComponentService()
    const microServices = componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )

    this.log(color.bold.blue('Building microservices Docker images...'))

    const buildOptions: DockerBuildOptions[] = []

    for (const microService of microServices) {
      const msPath = path.resolve(MICROSERVICES_FOLDER, microService.name)

      const logFile = this.getBuildOutputLogFile(
        microService,
        MICROSERVICES_FOLDER
      )

      const msDockerfile = path.resolve(msPath, DEFAULT_DOCKERFILE_NAME)

      if (!fs.existsSync(msDockerfile)) {
        this.error(
          `Dockerfile not found for microservice ${microService.name}. Please provide one in order to proceed with the bundle packaging`
        )
      }

      if (!microService.version) {
        this.error(
          `Unable to determine version for microservice ${microService.name}`
        )
      }

      buildOptions.push({
        name: microService.name,
        organization: dockerOrganization,
        path: msPath,
        tag: microService.version,
        outputStream: logFile
      })
    }

    const executorService =
      DockerService.getDockerImagesExecutorService(buildOptions)

    await this.parallelBuild(executorService, microServices)
  }

  private async buildBundleDockerImage(
    bundleDir: string,
    bundleDescriptor: BundleDescriptor,
    dockerOrganization: string
  ) {
    this.log(color.bold.blue('Creating bundle package...'))
    CliUx.ux.action.start('Building Bundle Docker image')

    const bundleDescriptorConverterService =
      new BundleDescriptorConverterService(bundleDir, dockerOrganization)
    bundleDescriptorConverterService.generateYamlDescriptors()

    const result = await DockerService.buildDockerImage({
      name: bundleDescriptor.name,
      organization: dockerOrganization,
      path: '.',
      tag: bundleDescriptor.version,
      // Docker build output will be visible only in debug mode
      outputStream: Pack.debug.outputStream
    })

    if (result === 0) {
      CliUx.ux.action.stop(
        `Docker image ${DockerService.getDockerImageName(
          dockerOrganization,
          bundleDescriptor.name,
          bundleDescriptor.version
        )} built`
      )
    } else if (typeof result === 'number') {
      this.error(
        `Docker build failed with exit code ${result}. Enable debug mode to see docker build output`,
        { exit: false }
      )
      this.exit(result as number)
    } else {
      this.error(
        `Docker build failed with cause: ${this.getErrorMessage(result)}`
      )
    }
  }
}
