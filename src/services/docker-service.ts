import {
  ParallelProcessExecutorService,
  ProcessExecutionOptions,
  ProcessExecutionResult,
  ProcessExecutorService
} from './process-executor-service'
import { Writable } from 'node:stream'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUILD_FOLDER, MICROFRONTENDS_FOLDER, WIDGETS_FOLDER } from '../paths'

export const DEFAULT_DOCKERFILE_NAME = 'Dockerfile'

export type DockerBuildOptions = {
  path: string
  organization: string
  name: string
  tag: string
  dockerfile?: string
  outputStream?: Writable
}

export class DockerService {
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
    return `docker build -f ${dockerfile} -t ${dockerImageName} .`
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
}
