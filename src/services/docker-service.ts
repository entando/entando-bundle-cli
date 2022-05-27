import {
  ProcessExecutionResult,
  ProcessExecutorService
} from './process-executor-service'
import { debugFactory } from './debug-factory-service'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { DIST_FOLDER, MICROFRONTENDS_FOLDER, WIDGETS_FOLDER } from '../paths'

const DEFAULT_DOCKERFILE_NAME = 'Dockerfile'

export type DockerBuildOptions = {
  path: string
  organization: string
  name: string
  tag: string
  dockerfile?: string
}

export class DockerService {
  private static debug = debugFactory(DockerService)

  public static async buildDockerImage(
    options: DockerBuildOptions
  ): Promise<ProcessExecutionResult> {
    const dockerfile = options.dockerfile ?? DEFAULT_DOCKERFILE_NAME
    const dockerImageName = `${options.organization}/${options.name}:${options.tag}`

    DockerService.debug(
      `Building Docker image ${dockerImageName} using ${dockerfile}`
    )

    return ProcessExecutorService.executeProcess({
      command: 'docker',
      arguments: [
        'build',
        '-f',
        dockerfile,
        '-t',
        dockerImageName,
        options.path
      ],
      // Docker build output will be visible only in debug mode
      outputStream: DockerService.debug.outputStream,
      errorStream: DockerService.debug.outputStream
    })
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
      DIST_FOLDER
    )
    const microFrontendToPath = path.posix.join(
      WIDGETS_FOLDER,
      microFrontEndName
    )
    return `ADD ${microFrontendFromPath} ${microFrontendToPath}\n`
  }
}
