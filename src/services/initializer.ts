import { CLIError } from "@oclif/errors"
import * as cp from "node:child_process"
import * as fs from "node:fs"
import * as path from "node:path"
import { BundleDescriptor } from "../models/bundle-descriptor"

export interface InitializerOptions {
  parentDirectory: string
  name: string
  version: string
}

/** Handles the scaffolding of a project bundle */
export default class Initializer {
  private readonly options: InitializerOptions

  constructor(options: InitializerOptions) {
    this.options = options
  }

  public async performScaffolding(): Promise<void> {
    if (!/^[\w-]+$/.test(this.options.name)) {
      throw new CLIError(`"${this.options.name}" is not a valid bundle name`)
    }

    this.createBundleDirectories()
    this.createBundleDescriptor()
    this.createDockerfile()
    this.createGitignore()
    this.createConfigJson()
    this.initGitRepo()
  }

  private createBundleDirectories() {
    const bundleDir = this.getBundleDirectory()

    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`${bundleDir} already exists`)
    }

    try {
      fs.accessSync(this.options.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(
        `Directory ${this.options.parentDirectory} is not writable`
      )
    }

    fs.mkdirSync(bundleDir)
    fs.mkdirSync(this.getBundleFilePath(".ent"))
    fs.mkdirSync(this.getBundleFilePath(".ent", "output"))
    fs.mkdirSync(this.getBundleFilePath("microservices"))
    fs.mkdirSync(this.getBundleFilePath("microfrontends"))
    fs.mkdirSync(this.getBundleFilePath("epc"))
  }

  private createBundleDescriptor() {
    const bundleDescriptorFile = this.getBundleFilePath("bundle.json")

    const bundleDescriptor: BundleDescriptor = {
      name: this.options.name,
      version: this.options.version,
      microservices: [],
      microfrontends: []
    }

    fs.writeFileSync(
      bundleDescriptorFile,
      JSON.stringify(bundleDescriptor, null, 4)
    )
  }

  private createDockerfile() {
    this.createFileFromTemplate(
      this.getBundleFilePath("Dockerfile"),
      "Dockerfile-template"
    )
  }

  private createGitignore() {
    this.createFileFromTemplate(
      this.getBundleFilePath(".gitignore"),
      "gitignore-template"
    )
  }

  private createConfigJson() {
    // TODO: ENG-3623
  }

  private createFileFromTemplate(filePath: string, templateFileName: string) {
    const templateFileContent = fs.readFileSync(
      path.resolve(__dirname, "..", "resources", templateFileName)
    )
    fs.writeFileSync(filePath, templateFileContent)
  }

  private initGitRepo() {
    try {
      cp.execSync(`git -C ${this.getBundleDirectory()} init`)
    } catch (error) {
      throw new CLIError(isStdError(error) ? error.stderr : (error as Error))
    }
  }

  private getBundleDirectory(): string {
    return path.resolve(this.options.parentDirectory, this.options.name)
  }

  private getBundleFilePath(...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(), ...pathSegments)
  }
}

function isStdError(error: any): error is { stderr: string } {
  return "stderr" in error && error.stderr
}