import { CliUx, Command, Flags } from "@oclif/core"
import Initializer from "../services/initializer"

export default class Init extends Command {
  static description = "performs the scaffolding of an empty bundle project"

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

    const initializer = new Initializer({
      parentDirectory: process.cwd(),
      name: args.name as string,
      version: flags.version ?? "0.0.1"
    })

    // Displaying spinner while performing the scaffolding
    CliUx.ux.action.start(`Initializing new bundle project ${args.name}`)
    await initializer.performScaffolding()
    CliUx.ux.action.stop()
  }
}
