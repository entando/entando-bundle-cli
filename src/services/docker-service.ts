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
import { BUNDLE_DESCRIPTOR_NAME, OUTPUT_FOLDER } from '../paths'
import { ComponentType } from '../models/component'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { ComponentService } from './component-service'
import { CLIError } from '@oclif/errors'
import { debugFactory } from './debug-factory-service'
import { InMemoryWritable } from '../utils'
import { YamlBundleDescriptor } from '../models/yaml-bundle-descriptor'
import { ConstraintsValidatorService } from './constraints-validator-service'
import { YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS } from '../models/yaml-bundle-descriptor-constraints'
import * as YAML from 'yaml'
import { FSService } from './fs-service'
import { DEFAULT_MFE_BUILD_FOLDER } from './microfrontend-service'

export const DEFAULT_DOCKERFILE_NAME = 'Dockerfile'
export const DOCKER_COMMAND = 'docker'
const DEFAULT_DOCKER_REGISTRY = 'registry.hub.docker.com'
const CRANE_BIN_NAME = 'crane'
const ENTANDO_BUNDLE_NAME_LABEL = 'org.entando.bundle-name'

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
    dockerOptions: DockerBuildOptions[],
    parallelism: number | undefined,
    failFast: boolean
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

    return new ParallelProcessExecutorService(
      executionOptions,
      parallelism,
      failFast
    )
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

  public static getBundleDockerfile(
    bundleDescriptor: BundleDescriptor,
    customDockerfile?: string
  ): string {
    const dockerfile =
      customDockerfile ||
      path.resolve(...OUTPUT_FOLDER, DEFAULT_DOCKERFILE_NAME)

    if (!customDockerfile) {
      DockerService.debug(
        'Generating Dockerfile to ' + FSService.toPosix(dockerfile)
      )

      let generatedDockerfileContent = 'FROM scratch\n'
      generatedDockerfileContent += `LABEL org.entando.bundle-name="${bundleDescriptor.name}"\n`
      generatedDockerfileContent += 'ADD .entando/output/descriptors/ .\n'
      for (const mfe of bundleDescriptor.microfrontends) {
        const buildFolder = mfe.buildFolder || DEFAULT_MFE_BUILD_FOLDER
        generatedDockerfileContent += `ADD microfrontends/${mfe.name}/${buildFolder} widgets/${mfe.name}\n`
      }

      fs.writeFileSync(dockerfile, generatedDockerfileContent)
    }

    return dockerfile
  }

  public static async buildBundleDockerImage(
    bundleDescriptor: BundleDescriptor,
    dockerOrganization: string,
    dockerfile: string
  ): Promise<ProcessExecutionResult> {
    return DockerService.buildDockerImage({
      name: bundleDescriptor.name,
      organization: dockerOrganization,
      path: '.',
      tag: bundleDescriptor.version,
      dockerfile: FSService.toPosix(dockerfile),
      // Docker build output will be visible only in debug mode
      outputStream: DockerService.debug.outputStream
    })
  }

  public static getDockerImageName(
    organization: string,
    name: string,
    tag: string
  ): string {
    return `${organization}/${name}:${tag}`
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
      command += ` --filter "reference=${image}"`
    }

    command += ' --format="{{.Repository}}:{{.Tag}}"'

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

  public static async checkAuthentication(
    registry: string
  ): Promise<ProcessExecutionResult> {
    const command = DOCKER_COMMAND + ' login ' + registry

    return ProcessExecutorService.executeProcess({
      command
    })
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * The first version of this method let the 'docker login' command to ask username
   * and password using the stdio 'inherit' option of child_process module.
   * Unfortunately it caused ANSI color code to stop working on Windows, so the prompt
   * for credentials is now handled directly by this CLI.
   */
  public static async login(
    username: string,
    password: string,
    registry: string
  ): Promise<void> {
    const command = `${DOCKER_COMMAND} login -u ${username} --password-stdin ${registry}`
    const result = await ProcessExecutorService.executeProcess({
      command,
      stdinWriter: (stdin: Writable) => {
        stdin.write(password)
        stdin.end()
      },
      outputStream: DockerService.debug.outputStream,
      errorStream: DockerService.debug.outputStream
    })

    if (result !== 0) {
      throw new CLIError('Docker login failed')
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

  public static async pushImage(
    image: string,
    registry: string
  ): Promise<string> {
    const command = DOCKER_COMMAND + ' push ' + image
    const outputStream = new InMemoryWritable()
    const errorStream = new InMemoryWritable()
    const result = await ProcessExecutorService.executeProcess({
      command,
      errorStream,
      outputStream
    })
    const output = outputStream.data
    const error = errorStream.data
    if (result !== 0) {
      DockerService.debug(output)
      DockerService.debug(output)
      throw new CLIError(
        error.includes('denied')
          ? `Unable to push docker image ${image}. Be sure that you have write access to that repository.\nYou may also logged in with a wrong user. Please execute "docker logout ${registry}" and try again`
          : `Unable to push Docker image ${image}. Enable debug mode to see output of failed command.`
      )
    }

    const sha = output.match(/digest:\s(\S*)/)
    if (sha) {
      return sha[1]
    }

    return ''
  }

  public static getDigestsExecutor(
    imageName: string,
    tags: string[]
  ): ParallelProcessExecutorService & {
    getDigests(): Promise<Map<string, string>>
  } {
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

    const digestExecutor = new ParallelProcessExecutorService(
      options,
      6
    ) as ParallelProcessExecutorService & {
      getDigests(): Promise<Map<string, string>>
    }

    digestExecutor.getDigests = async function (): Promise<
      Map<string, string>
    > {
      const results = await digestExecutor.execute()

      if (results.some(r => r !== 0)) {
        throw new CLIError(
          `Unable to retrieve digests for Docker image ${imageName}. Enable debug mode to see output of failed command.`
        )
      }

      const tagsWithDigests = new Map<string, string>()
      for (const [index, tag] of tags.entries()) {
        const digest = outputStreams[index].data.trim()
        tagsWithDigests.set(tag, digest)
      }

      return tagsWithDigests
    }

    return digestExecutor
  }

  public static async listTags(imageName: string): Promise<string[]> {
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
      const registry = imageName.slice(0, imageName.indexOf('/'))
      throw new CLIError(
        `Docker registry ${registry} requires authentication. This may be caused by one of the following reasons:\n- You are not logged in against the given registry. Please run docker login command\n- You are using a non-existing image in that registry`
      )
    } else {
      DockerService.debug(output)
      DockerService.debug(error)
      throw new CLIError(
        `Unable to list tags for Docker image ${imageName}. Enable debug mode to see output of failed command.`
      )
    }
  }

  public static async getYamlDescriptorFromImage(
    imageName: string
  ): Promise<YamlBundleDescriptor> {
    const digest = await DockerService.getFirstLayerDigest(imageName)
    const outputStream = new InMemoryWritable()
    const errorStream = new InMemoryWritable()

    const result = await ProcessExecutorService.executeProcess({
      ...DockerService.getCraneExecutionOptions(
        `blob ${imageName}@${digest} | tar -zOxf - ${BUNDLE_DESCRIPTOR_NAME}`
      ),
      errorStream,
      outputStream
    })

    if (result === 0) {
      const output = outputStream.data
      let parsedDescriptor: any
      try {
        parsedDescriptor = YAML.parse(output)
      } catch {
        DockerService.debug(output)
        throw new CLIError(
          'Retrieved descriptor contains invalid YAML. Enable debug mode to see retrieved content.'
        )
      }

      try {
        return ConstraintsValidatorService.validateObjectConstraints(
          parsedDescriptor,
          YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS
        )
      } catch (error) {
        throw new CLIError(
          'Retrieved descriptor has an invalid format.\n' +
            (error as Error).message
        )
      }
    } else if (
      errorStream.data.includes(
        `tar: ${BUNDLE_DESCRIPTOR_NAME}: Not found in archive`
      )
    ) {
      throw new CLIError(
        `${BUNDLE_DESCRIPTOR_NAME} not found. Have you specified a valid bundle Docker image?`
      )
    } else {
      DockerService.debug(errorStream.data)
      DockerService.debug(outputStream.data)
      throw new CLIError(
        'Unable to parse YAML descriptor from bundle Docker image. Enable debug mode to see output of failed command.'
      )
    }
  }

  private static async getFirstLayerDigest(imageName: string): Promise<string> {
    let outputStream = new InMemoryWritable()
    const imageConfigResult = await ProcessExecutorService.executeProcess({
      ...DockerService.getCraneExecutionOptions(`config ${imageName}`),
      errorStream: DockerService.debug.outputStream,
      outputStream
    })

    if (imageConfigResult === 0) {
      const imageConfigOutput = outputStream.data
      const bundleNameLabel =
        JSON.parse(imageConfigOutput).config.Labels?.[ENTANDO_BUNDLE_NAME_LABEL]

      if (bundleNameLabel) {
        outputStream = new InMemoryWritable()
        const result = await ProcessExecutorService.executeProcess({
          ...DockerService.getCraneExecutionOptions(`manifest ${imageName}`),
          errorStream: DockerService.debug.outputStream,
          outputStream
        })

        if (result === 0) {
          const output = outputStream.data
          let manifest: any
          try {
            manifest = JSON.parse(output)
          } catch {
            DockerService.debug(output)
            throw new CLIError(
              'Retrieved manifest contains invalid JSON. Enable debug mode to see retrieved content.'
            )
          }

          if (
            manifest.layers &&
            manifest.layers.length > 0 &&
            manifest.layers[0].digest
          ) {
            return manifest.layers[0].digest
          }

          DockerService.debug(output)
          throw new CLIError(
            'Unable to extract digest from retrieved manifest. Have you specified a valid bundle Docker image?\nEnable debug mode to see retrieved content.'
          )
        } else {
          DockerService.debug(outputStream.data)
          throw new CLIError(
            'Unable to retrieve image manifest. Enable debug mode to see output of failed command.'
          )
        }
      } else {
        DockerService.debug(imageConfigOutput)
        throw new CLIError(
          "Given Docker image doesn't contain required label " +
            ENTANDO_BUNDLE_NAME_LABEL +
            '. Have you specified a valid bundle Docker image?\nEnable debug mode to see retrieved content.'
        )
      }
    } else {
      DockerService.debug(outputStream.data)
      throw new CLIError(
        'Unable to retrieve image metadata. Enable debug mode to see output of failed command.'
      )
    }
  }

  private static getCraneExecutionOptions(
    craneCommand: string
  ): ProcessExecutionOptions {
    const baseCommand = process.env.ENTANDO_CLI_CRANE_BIN ?? CRANE_BIN_NAME
    return {
      command: `${baseCommand} ${craneCommand}`
    }
  }

  public static getDefaultDockerRegistry(): string {
    return (
      process.env.ENTANDO_CLI_DEFAULT_DOCKER_REGISTRY ?? DEFAULT_DOCKER_REGISTRY
    )
  }
}
