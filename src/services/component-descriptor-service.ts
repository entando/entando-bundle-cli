import * as path from 'node:path'
import * as fs from 'node:fs'
import * as xml2js from 'xml2js'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack
} from '../models/component'
import { CLIError } from '@oclif/errors'

export class ComponentDescriptorService {
  public getComponentVersion(component: Component<ComponentType>): string {
    const { name, stack } = component
    const compPath: string = path.resolve(
      process.cwd(),
      `${component.type}s`,
      name
    )

    const version: string | undefined =
      stack === MicroserviceStack.Node ||
      stack === MicroFrontendStack.React ||
      stack === MicroFrontendStack.Angular
        ? this.parsePackageJSON(compPath)?.version
        : this.parsePomXML(compPath)?.project?.version?.[0]

    if (!version) {
      throw new CLIError(`Unable to determine version for component ${name}`)
    }

    return version
  }

  private parsePackageJSON(dir: string): { version: string } | undefined {
    try {
      const result = JSON.parse(
        fs.readFileSync(path.resolve(dir, 'package.json'), 'utf-8')
      )
      return result
    } catch {
      return undefined
    }
  }

  private parsePomXML(
    dir: string
  ): Partial<{ project: { version: string } }> | undefined {
    let result: Partial<{ project: { version: string } }> = {}
    try {
      xml2js.parseString(
        fs.readFileSync(path.resolve(dir, 'pom.xml'), 'utf-8'),
        (err: any, res: any) => {
          result = res
        }
      )
      return result
    } catch {
      return undefined
    }
  }
}
