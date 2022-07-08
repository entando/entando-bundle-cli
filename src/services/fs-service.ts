import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { debugFactory } from './debug-factory-service'
import { GITKEEP_FILE, RESOURCES_FOLDER } from '../paths'
import {
  ALLOWED_NAME_REGEXP,
  INVALID_NAME_MESSAGE,
  MAX_NAME_LENGTH
} from '../models/bundle-descriptor-constraints'

const JSON_INDENTATION_SPACES = 4

interface TemplateVariables {
  [key: string]: string
}

export class FSService {
  private static debug = debugFactory(FSService)

  private readonly bundleName: string
  private readonly parentDirectory: string

  constructor(name: string, parentDirectory: string) {
    this.bundleName = name
    this.parentDirectory = parentDirectory
  }

  public checkBundleName(): void {
    FSService.debug('checking if bundle name is valid')
    if (!ALLOWED_NAME_REGEXP.test(this.bundleName)) {
      throw new CLIError(
        `'${this.bundleName}' is not a valid bundle name. ${INVALID_NAME_MESSAGE}`
      )
    }

    if (this.bundleName.length > MAX_NAME_LENGTH) {
      throw new CLIError(
        `Bundle name is too long. The maximum length is ${MAX_NAME_LENGTH}`
      )
    }
  }

  public checkBundleDirectory(): void {
    FSService.debug('checking bundle directory if we have access')
    const bundleDir = this.getBundleDirectory()

    try {
      fs.accessSync(this.parentDirectory, fs.constants.W_OK)
    } catch {
      throw new CLIError(`Directory ${this.parentDirectory} is not writable`)
    }

    FSService.debug('checking bundle directory it exists')
    if (fs.existsSync(bundleDir)) {
      throw new CLIError(`Directory ${bundleDir} already exists`)
    }
  }

  public getBundleDirectory(): string {
    return path.resolve(this.parentDirectory, this.bundleName)
  }

  public getBundleFilePath(...pathSegments: string[]): string {
    return path.resolve(this.getBundleDirectory(), ...pathSegments)
  }

  public createFileFromTemplate(
    pathSegments: string[],
    templateFileName: string,
    templateVariables?: TemplateVariables
  ): void {
    const filePath = this.getBundleFilePath(...pathSegments)
    let templateFileContent = fs.readFileSync(
      path.resolve(__dirname, '..', RESOURCES_FOLDER, templateFileName),
      templateVariables ? 'utf8' : null
    ) as string
    if (templateVariables) {
      const placeholders: string[] = Object.keys(templateVariables)
      for (const placeholder of placeholders) {
        templateFileContent = templateFileContent.replace(
          new RegExp(placeholder, 'g'),
          templateVariables[placeholder]
        )
      }
    }

    fs.writeFileSync(filePath, templateFileContent)
  }

  public createSubDirectoryIfNotExist(...subDirectories: string[]): string {
    const directoryPath = this.getBundleFilePath(...subDirectories)
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath)
    }

    return directoryPath
  }

  public createEmptySubDirectoryForGitIfNotExist(
    ...subDirectories: string[]
  ): void {
    const directoryPath = this.createSubDirectoryIfNotExist(...subDirectories)
    const gitKeepFile = path.join(directoryPath, GITKEEP_FILE)
    if (!fs.existsSync(gitKeepFile)) {
      fs.writeFileSync(gitKeepFile, '')
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static writeJSON(filePath: string, data: any): void {
    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, JSON_INDENTATION_SPACES)
    )
  }

  public static toPosix(filePath: string): string {
    return filePath.split(path.sep).join(path.posix.sep)
  }
}
