import { CliUx, Command, Flags } from "@oclif/core"
import * as YAML from 'yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CLIError } from "@oclif/errors"
import { DEFAULT_VERSION } from "../models/component"
import { InitializerService } from "../services/initializer-service"

const DESCRIPTOR_ERROR = 'Bundle descriptor not found or invalid. Is this an Bundle project?'

export default class Migration extends Command {
  static description = 'Perform bundle migration from v1 to v5'

  static flags = {
    'bundle-path': Flags.string({
      description: 'path of bundle v1 to migrate'
    })
  }


  public async run(): Promise<void> {
    const { flags } = await this.parse(Migration)
    const { "bundle-path": bundlePath = process.cwd() } = flags;
    const register: string[] = [];

    const parsedDescriptor = this.parseDescriptor(bundlePath)

    const { code: name } = parsedDescriptor
    const { dir } = path.parse(bundlePath)
    const options = { name: `${name}-v5`, parentDirectory: dir, version: DEFAULT_VERSION }
    const initializer = new InitializerService(options)

    register.push(`Initializing an empty bundle project named ${name}-v5`)
    CliUx.ux.action.start(`Initializing an empty bundle project named ${name}-v5`)
    await initializer.performBundleInit()
    CliUx.ux.action.stop()
    register.push(
      `Initializing an empty bundle project named ${name}-v5... done`,
      `Manually step to do`,
      `Add the source files in new folders microservices, microfrontends`
    )

    fs.writeFileSync(`${dir}/migration-${name}-v5-log.txt`, register.join('\n'));
    this.log(`You can find the details at ${dir}/migration-${name}-v5-log.txt`)

  }

  private parseDescriptor(bundlePath: string) {
    try {
      const descriptor = fs.readFileSync(path.join(bundlePath, "descriptor.yaml"), 'utf-8')
      // TODO: you can add validation here
      return YAML.parse(descriptor)
    } catch {
      throw new CLIError(DESCRIPTOR_ERROR)
    }

  }

}