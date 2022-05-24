import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import debugFactory from './debug-factory-service'

import { MICROSERVICES_FOLDER } from '../paths'
import ProcessExecutorService from './process-executor-service'
import { ComponentService } from './component-service'

export class BuildService {
  private static debug = debugFactory(BuildService)

  public static async build(name: string): Promise<any> {
    const componentService = new ComponentService()
    const component = componentService.getComponent(name)

    const { type, stack } = component

    let componentPath: string
    let buildCmd = ''
    let buildCmdArgs: string[] = []

    if (type === 'microservice' && stack === 'spring-boot') {
      componentPath = path.resolve(MICROSERVICES_FOLDER, name)
      buildCmd = 'mvn'
      buildCmdArgs = ['clean', 'test']
    } else {
      throw new CLIError(`${stack} ${type} build not implemented`)
    }

    BuildService.debug(
      `Building ${name} using ${buildCmd} ${buildCmdArgs.join(' ').trim()}`
    )
    BuildService.debug(`Component Path ${componentPath}`)

    if (!fs.existsSync(componentPath)) {
      throw new CLIError(`Directory ${componentPath} not exists`)
    }

    process.chdir(componentPath)

    return ProcessExecutorService.executeProcess({
      command: buildCmd,
      arguments: buildCmdArgs,
      // Build output will be visible only in debug mode
      outputStream: BuildService.debug.outputStream,
      errorStream: BuildService.debug.outputStream
    })
  }
}
