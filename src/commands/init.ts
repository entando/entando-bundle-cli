import { CliUx, Command, Flags } from "@oclif/core"
import BundleProjectInitializer from "../services/initializer"

const DEFAULT_VERSION = "0.0.1"

export default class Init extends Command {
  static description =
    "Performs the scaffolding of a bundle project (we'll add the possibility to init from hub later)"

  static examples = [
    "$ entando-bundle-cli init my-bundle",
    "$ entando-bundle-cli init my-bundle --version=0.0.1"
  ]

  static args = [{ name: "name", description: "project name", required: true }]

  static flags = {
    version: Flags.string({ description: "project version" })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init)

    const initializer = new BundleProjectInitializer({
      parentDirectory: process.cwd(),
      name: args.name as string,
      version: flags.version ?? DEFAULT_VERSION
    })

    // Displaying spinner while performing the scaffolding
    CliUx.ux.action.start(`Initializing a new bundle project ${args.name}`)
    await initializer.performScaffolding()
    CliUx.ux.action.stop()
  }
}
