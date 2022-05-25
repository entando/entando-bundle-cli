import { ProcessExecutorService } from './process-executor-service'
import debugFactory from './debug-factory-service'

export type DockerBuildOptions = {
  path: string
  organization: string
  name: string
  tag: string
  dockerfile?: string
}

export default class DockerService {
  private static debug = debugFactory(DockerService)

  public static async buildDockerImage(
    options: DockerBuildOptions
  ): Promise<any> {
    const dockerfile = options.dockerfile ?? 'Dockerfile'
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
}
