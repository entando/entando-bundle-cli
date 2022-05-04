import { Command, Flags } from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BundleDescriptor, MicroFrontend } from '../../models/bundle-descriptor'
import BundleDescriptorManager from '../../services/bundle-descriptor-manager'

enum Stack {
  React = 'react',
  Angular = 'angular',
}

export default class Add extends Command {
  static description = 'Performs microfrontend operations in the current bundle'

  static examples = [
    '$ entando-bundle-cli mfe add my-mfe',
  ]

  static flags = {
    stack: Flags.string({
      description: 'frontend stack',
      options: [Stack.React, Stack.Angular],
      default: Stack.React,
    }),
  }

  static args = [
    {
      name: 'name',
      description: 'name of the microfrontend component',
      required: true,
    },
  ]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Add)

    // TODO: check if dir is an initialized bundle project

    const newMfeDir: string = path.resolve(process.cwd(), 'microfrontends', args.name)
    fs.mkdirSync(newMfeDir)

    const bundleDescriptorManager: BundleDescriptorManager = new BundleDescriptorManager(process.cwd())
    const bundleDescriptor: BundleDescriptor = bundleDescriptorManager.getBundleDescriptor();
    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: [...bundleDescriptor.microfrontends, <MicroFrontend>{ name: args.name, stack: flags.stack }]
    }

    bundleDescriptorManager.writeBundleDescriptor(updatedBundleDescriptor)
  }
}
