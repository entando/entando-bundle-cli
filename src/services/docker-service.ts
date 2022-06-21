import {
  COMMAND_NOT_FOUND_EXIT_CODE,
  ParallelProcessExecutorService,
  ProcessExecutionOptions,
  ProcessExecutionResult,
  ProcessExecutorService
} from './process-executor-service'
import { Writable } from 'node:stream'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BUILD_FOLDER,
  CONFIG_FOLDER,
  DOCKER_CONFIG_FOLDER,
  MICROFRONTENDS_FOLDER,
  WIDGETS_FOLDER
} from '../paths'
import { ComponentType } from '../models/component'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { ComponentService } from './component-service'
import { CLIError } from '@oclif/errors'
import { debugFactory } from './debug-factory-service'
import { InMemoryWritable } from '../utils'

export const DEFAULT_DOCKERFILE_NAME = 'Dockerfile'
export const DEFAULT_DOCKER_REGISTRY = 'registry.hub.docker.com'
export const DOCKER_COMMAND = 'docker'
const CRANE_BIN_NAME = 'crane'

export type DockerBuildOptions = {
  path: string
  organization: string
  name: string
  tag: string
  dockerfile?: string
  outputStream?: Writable
}

export class DockerService {
  private static debug = debugFactory(DockerService)

  public static async buildDockerImage(
    options: DockerBuildOptions
  ): Promise<ProcessExecutionResult> {
    return ProcessExecutorService.executeProcess({
      command: DockerService.getDockerBuildCommand(options),
      outputStream: options.outputStream,
      errorStream: options.outputStream,
      workDir: options.path
    })
  }

  public static getDockerImagesExecutorService(
    dockerOptions: DockerBuildOptions[]
  ): ParallelProcessExecutorService {
    const executionOptions: ProcessExecutionOptions[] = []

    for (const options of dockerOptions) {
      executionOptions.push({
        command: DockerService.getDockerBuildCommand(options),
        outputStream: options.outputStream,
        errorStream: options.outputStream,
        workDir: options.path
      })
    }

    return new ParallelProcessExecutorService(executionOptions)
  }

  private static getDockerBuildCommand(options: DockerBuildOptions): string {
    const dockerfile = options.dockerfile ?? DEFAULT_DOCKERFILE_NAME
    const dockerImageName = DockerService.getDockerImageName(
      options.organization,
      options.name,
      options.tag
    )
    return `${DOCKER_COMMAND} build --platform "linux/amd64" -f ${dockerfile} -t ${dockerImageName} .`
  }

  public static getDockerImageName(
    organization: string,
    name: string,
    tag: string
  ): string {
    return `${organization}/${name}:${tag}`
  }

  public static addMicroFrontEndToDockerfile(
    bundleDir: string,
    microFrontEndName: string
  ): void {
    DockerService.updateDockerfile(bundleDir, oldFileContent => {
      return (
        oldFileContent +
        DockerService.getMicroFrontendDockerAddCommand(microFrontEndName)
      )
    })
  }

  public static removeMicroFrontendFromDockerfile(
    bundleDir: string,
    microFrontEndName: string
  ): void {
    DockerService.updateDockerfile(bundleDir, oldFileContent => {
      return oldFileContent.replace(
        DockerService.getMicroFrontendDockerAddCommand(microFrontEndName),
        ''
      )
    })
  }

  private static updateDockerfile(
    bundleDir: string,
    dockerfileUpdater: (oldFileContent: string) => string
  ) {
    const dockerfilePath = path.resolve(bundleDir, DEFAULT_DOCKERFILE_NAME)
    const oldFileContent = fs.readFileSync(dockerfilePath).toString()
    const newDockerfileContent = dockerfileUpdater(oldFileContent)
    fs.writeFileSync(dockerfilePath, newDockerfileContent)
  }

  private static getMicroFrontendDockerAddCommand(microFrontEndName: string) {
    const microFrontendFromPath = path.posix.join(
      MICROFRONTENDS_FOLDER,
      microFrontEndName,
      BUILD_FOLDER
    )
    const microFrontendToPath = path.posix.join(
      WIDGETS_FOLDER,
      microFrontEndName
    )
    return `ADD ${microFrontendFromPath} ${microFrontendToPath}\n`
  }

  public static async bundleImagesExists(
    bundleDescriptor: BundleDescriptor,
    organization: string
  ): Promise<boolean> {
    const images = DockerService.getBundleDockerImages(
      bundleDescriptor,
      organization
    )

    // Listing all the expected images
    let command = DOCKER_COMMAND + ' image ls'
    for (const image of images) {
      command += ` --filter 'reference=${image}'`
    }

    command += " --format='{{.Repository}}:{{.Tag}}'"

    const outputStream = new InMemoryWritable()

    const result = await ProcessExecutorService.executeProcess({
      command,
      errorStream: DockerService.debug.outputStream,
      outputStream
    })

    if (result !== 0) {
      DockerService.debug(outputStream.data)
      throw new CLIError(
        'Unable to check Docker images. Enable debug mode to see failed command and its error stream'
      )
    }

    const foundImages = outputStream.data.trim().split('\n')

    for (const image of images) {
      if (!foundImages.includes(image)) {
        return false
      }
    }

    return true
  }

  public static getBundleDockerImages(
    bundleDescriptor: BundleDescriptor,
    organization: string
  ): string[] {
    const images = [
      DockerService.getDockerImageName(
        organization,
        bundleDescriptor.name,
        bundleDescriptor.version
      )
    ]

    const componentService = new ComponentService()

    for (const microservice of componentService.getVersionedComponents(
      ComponentType.MICROSERVICE
    )) {
      images.push(
        DockerService.getDockerImageName(
          organization,
          microservice.name,
          microservice.version
        )
      )
    }

    return images
  }

  public static async login(
    registry: string = DEFAULT_DOCKER_REGISTRY
  ): Promise<void> {
    const command =
      DOCKER_COMMAND +
      ' --config ' +
      path.join(...DOCKER_CONFIG_FOLDER) +
      ' login ' +
      registry

    const tryLogin = await ProcessExecutorService.executeProcess({
      command
    })

    if (tryLogin !== 0) {
      const result = await ProcessExecutorService.executeProcess({
        command,
        // prompt is shown to the user
        stdio: 'inherit'
      })

      if (result !== 0) {
        throw new CLIError('Docker login failed')
      }
    }
  }

  public static async updateImagesOrganization(
    bundleDescriptor: BundleDescriptor,
    oldOrganization: string,
    newOrganization: string
  ): Promise<string[]> {
    return DockerService.createTags(
      bundleDescriptor,
      oldOrganization,
      (sourceImage: string) => {
        return sourceImage.replace(
          new RegExp('^' + oldOrganization + '/'),
          newOrganization + '/'
        )
      }
    )
  }

  public static async setImagesRegistry(
    bundleDescriptor: BundleDescriptor,
    organization: string,
    registry: string
  ): Promise<string[]> {
    return DockerService.createTags(
      bundleDescriptor,
      organization,
      (sourceImage: string) => {
        return registry + '/' + sourceImage
      }
    )
  }

  private static async createTags(
    bundleDescriptor: BundleDescriptor,
    organization: string,
    getTargetImage: (sourgeImage: string) => string
  ): Promise<string[]> {
    const sourceImages = DockerService.getBundleDockerImages(
      bundleDescriptor,
      organization
    )

    const targetImages: string[] = []
    const options: ProcessExecutionOptions[] = []
    for (const sourceImage of sourceImages) {
      const targetImage = getTargetImage(sourceImage)
      targetImages.push(targetImage)
      const command = `${DOCKER_COMMAND} tag ${sourceImage} ${targetImage}`
      options.push({
        command,
        errorStream: DockerService.debug.outputStream,
        outputStream: DockerService.debug.outputStream
      })
    }

    const results = await new ParallelProcessExecutorService(options).execute()

    if (results.some(result => result !== 0)) {
      throw new CLIError(
        'Unable to create Docker image tag. Enable debug mode to see output of failed command.'
      )
    }

    return targetImages
  }

  public static async pushImage(image: string): Promise<string> {
    const command =
      DOCKER_COMMAND +
      ' --config ' +
      path.join(...DOCKER_CONFIG_FOLDER) +
      ' push ' +
      image
    const outputStream = new InMemoryWritable()
    const result = await ProcessExecutorService.executeProcess({
      command,
      errorStream: DockerService.debug.outputStream,
      outputStream
    })
    const output = outputStream.data
    if (result !== 0) {
      DockerService.debug(output)
      throw new CLIError(
        'Unable to push Docker image. Enable debug mode to see output of failed command.'
      )
    }

    const sha = output.match(/digest:\s(\S*)/)
    if (sha) {
      return sha[1]
    }

    return ''
  }

  public static async getTagsWithDigests(
    imageName: string
  ): Promise<Map<string, string>> {
    const tagsWithDigests = new Map<string, string>()

    const tags = await DockerService.listTags(imageName)

    const options: ProcessExecutionOptions[] = []
    const outputStreams: InMemoryWritable[] = []
    for (const tag of tags) {
      const outputStream = new InMemoryWritable()
      outputStreams.push(outputStream)
      options.push({
        ...DockerService.getCraneExecutionOptions(`digest ${imageName}:${tag}`),
        errorStream: DockerService.debug.outputStream,
        outputStream
      })
    }

    const parallelExecutorService = new ParallelProcessExecutorService(options)

    const results = await parallelExecutorService.execute()

    if (results.some(r => r !== 0)) {
      throw new CLIError(
        `Unable to retrieve digests for Docker image ${imageName}. Enable debug mode to see output of failed command.`
      )
    }

    for (const [index, tag] of tags.entries()) {
      const digest = outputStreams[index].data.trim()
      tagsWithDigests.set(tag, digest)
    }

    return tagsWithDigests
  }

  private static async listTags(imageName: string): Promise<string[]> {
    const outputStream = new InMemoryWritable()
    const errorStream = new InMemoryWritable()
    const result = await ProcessExecutorService.executeProcess({
      ...DockerService.getCraneExecutionOptions(`ls ${imageName}`),
      errorStream,
      outputStream
    })

    const output = outputStream.data
    const error = errorStream.data

    if (result === 0) {
      return output.trim().split('\n').reverse() // listing the most recent images first
    }

    if (result === COMMAND_NOT_FOUND_EXIT_CODE) {
      throw new CLIError('Command crane not found')
    } else if (error.includes('NAME_UNKNOWN')) {
      throw new CLIError(`Image ${imageName} not found`)
    } else if (error.includes('UNAUTHORIZED')) {
      throw new CLIError(
        `Registry required authentication. This may also be caused by searching for a non-existing image.\nPlease verify that ${imageName} exists.`
      )
    } else {
      DockerService.debug(output)
      DockerService.debug(error)
      throw new CLIError(
        `Unable to list tags for Docker image ${imageName}. Enable debug mode to see output of failed command.`
      )
    }
  }

  private static getCraneExecutionOptions(
    craneCommand: string
  ): ProcessExecutionOptions {
    const baseCommand = process.env.ENTANDO_CLI_CRANE_BIN ?? CRANE_BIN_NAME
    return {
      command: `${baseCommand} ${craneCommand}`,
      env: {
        // setting config folder as home since crane looks at ~/.docker/config.json for authenticating
        HOME: CONFIG_FOLDER
      }
    }
  }
}
