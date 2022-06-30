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
import {
  BundleThumbnailService,
  ThumbnailStatusMessage
} from '../services/bundle-thumbnail-service'

export default class Pack extends BaseBuildCommand {
  static description = 'Generate the bundle Docker images'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --org=my-org'
  ]

  static flags = {
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
    BundleService.isValidBundleProject()

    const { flags } = await this.parse(Pack)

    const bundleDescriptorService = new BundleDescriptorService()
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

    await this.buildAllComponents(Phase.Package)

    const dockerOrganization = await this.getDockerOrganization(flags.org)

    await this.buildMicroservicesDockerImages(dockerOrganization)

    await this.buildBundleDockerImage(
      bundleDescriptor,
      dockerOrganization,
      flags.file
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

  private async buildMicroservicesDockerImages(dockerOrganization: string) {
    const componentService = new ComponentService()
    const microservices = componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )

    this.log(color.bold.blue('Building microservices Docker images...'))

    const buildOptions: DockerBuildOptions[] = []

    for (const microservice of microservices) {
      const msPath = path.resolve(MICROSERVICES_FOLDER, microservice.name)

      const msDockerfile = path.resolve(msPath, DEFAULT_DOCKERFILE_NAME)

      if (!fs.existsSync(msDockerfile)) {
        this.error(
          `Dockerfile not found for microservice ${microservice.name}. Please provide one in order to proceed with the bundle packaging`
        )
      }

      const logFile = this.getBuildOutputLogFile(microservice)

      buildOptions.push({
        name: microservice.name,
        organization: dockerOrganization,
        path: msPath,
        tag: microservice.version,
        outputStream: logFile
      })
    }

    const executorService =
      DockerService.getDockerImagesExecutorService(buildOptions)

    await this.parallelBuild(executorService, microservices)
  }

  private async buildBundleDockerImage(
    bundleDescriptor: BundleDescriptor,
    dockerOrganization: string,
    dockerfile?: string
  ) {
    this.log(color.bold.blue('Creating bundle package...'))
    CliUx.ux.action.start('Building Bundle Docker image')

    const bundleDescriptorConverterService =
      new BundleDescriptorConverterService(dockerOrganization)

    const thumbnailService = new BundleThumbnailService()
    thumbnailService.processThumbnail()
    const thumbnailInfo = thumbnailService.getThumbnailInfo()

    if (thumbnailInfo.status !== ThumbnailStatusMessage.OK) {
      switch (thumbnailInfo.status) {
        case ThumbnailStatusMessage.FILESIZE_EXCEEDED:
          this.log(
            `${color.bold.red('Warning:')} ${color.red(thumbnailInfo.status)}`
          )
          break
        case ThumbnailStatusMessage.NO_THUMBNAIL:
        default:
          this.log(color.blue(thumbnailInfo.status))
      }
    }

    bundleDescriptorConverterService.generateYamlDescriptors(thumbnailInfo)

    const result = await DockerService.buildDockerImage({
      name: bundleDescriptor.name,
      organization: dockerOrganization,
      path: '.',
      tag: bundleDescriptor.version,
      dockerfile,
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
