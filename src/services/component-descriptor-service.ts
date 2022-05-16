import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import * as xml2js from 'xml2js'
import { ComponentType, PartialComponent, Stack } from '../models/component'

export class ComponentDescriptorService {
  public getComponentVersion(
    component: PartialComponent,
    type: ComponentType
  ): string {
    const { name, stack } = component
    const compPath: string = path.resolve(process.cwd(), `${type}s`, name)

    const version: string | undefined =
      stack === Stack.Node || stack === Stack.React || stack === Stack.Angular ?
        this.parsePackageJSON(compPath).version :
        this.parsePomXML(compPath).project?.version?.[0]

    if (!version) {
      throw new CLIError(`Failed to get version of ${name} ${type}`)
    }

    return version
  }

  private parsePackageJSON(dir: string): { version: string } {
    return JSON.parse(
      fs.readFileSync(path.resolve(dir, 'package.json'), 'utf-8')
    )
  }

  private parsePomXML(dir: string): Partial<{ project: { version: string } }> {
    let result: Partial<{ project: { version: string } }> = {}
    xml2js.parseString(
      fs.readFileSync(path.resolve(dir, 'pom.xml'), 'utf-8'),
      (err, res) => {
        result = res
      }
    )
    return result
  }
}
