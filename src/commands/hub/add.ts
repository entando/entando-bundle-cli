import { CliUx, Command, Flags } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import path = require('node:path')

const OWNER_READ_WRITE_PERMISSION = 0o600
const HUB_CREDENTIALS_PATH = "/hub/credentials"

export default class Add extends Command {
    static description = 'Add credentials for HUB'

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --name my-hub --hub-url http://my-hub.com'
    ]

    static flags = {
        name: Flags.string({
            description: 'name of the hub',
            required: false
        }),
        "hub-url": Flags.string({
            description: 'url of the hub',
            required: false
        }),
        "hub-api-key": Flags.string({
            description: 'api key for the hub',
            required: false
        })

    }

    public async run(): Promise<void> {
        const { flags } = await this.parse(Add)

        if (!process.env.ENTANDO_BUNDLE_CLI_ETC) {
            throw new CLIError(
                'Environment variable "ENTANDO_BUNDLE_CLI_ETC" should have a value'
            )
        }

        const etcFolder = process.env.ENTANDO_BUNDLE_CLI_ETC;

        let { name, "hub-url": url, "hub-api-key": apiKey } = flags

        if (!name) name = await CliUx.ux.prompt('Hub name')
        if (!url) url = await CliUx.ux.prompt('Hub url')
        if (!apiKey) {
            apiKey = await CliUx.ux.prompt(
                'Hub apiKey (optional)',
                { type: 'hide', required: false }
            )
        }

        url = this.validateUrl(url!)

        const hub = { name, url, ...(apiKey && { apiKey }) }

        const filePath = path.join(etcFolder, HUB_CREDENTIALS_PATH, `${hub.name!}.json`)
        const { dir } = path.parse(filePath)

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(
            filePath,
            JSON.stringify(hub, null, 2),
            { mode: OWNER_READ_WRITE_PERMISSION }
        );
    }


    private validateUrl(url: string): string {
        try {
            const urlParsed = new URL(url)
            return urlParsed.href
        } catch {
            throw new CLIError(`${url} is not a valid URL`)
        }
    }

}