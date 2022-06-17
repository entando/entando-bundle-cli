import { Command } from '@oclif/core'
import { ConfigService } from '../services/config-service'
import { color } from '@oclif/color'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'

export default class Info extends Command {
  static description = 'Show status information for the bundle project '

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()
    this.printBundleInfo()
    this.printConfigProperties()
  }

  private printBundleInfo() {
    this.log(color.bold.blue('--- Bundle info ---'))

    const bundleDescriptorService = new BundleDescriptorService()
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    this.log(`Name: ${bundleDescriptor.name}`)
    this.log(`Description: ${bundleDescriptor.description}`)
    this.log(`Version: ${bundleDescriptor.version}`)
  }

  private printConfigProperties() {
    this.log(color.bold.blue('--- Config values ---'))

    const configService = new ConfigService()
    const properties = configService.getProperties()

    if (Object.keys(properties).length > 0) {
      for (const [key, value] of Object.entries(properties)) {
        this.log(`${key}: ${value}`)
      }
    } else {
      this.log('No values set')
    }
  }
}
