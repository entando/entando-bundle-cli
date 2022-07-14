import * as fs from 'node:fs'
import * as path from 'node:path'
import { debugFactory } from './debug-factory-service'
import {
  GITKEEP_FILE,
  RESOURCES_FOLDER,
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER,
  SVC_FOLDER
} from '../paths'

const JSON_INDENTATION_SPACES = 4

interface TemplateVariables {
  [key: string]: string
}

export class FSService {
  private static debug = debugFactory(FSService)

  private readonly bundleFolder: string
  private readonly parentDirectory: string

  constructor(folderName: string, parentDirectory: string) {
    this.bundleFolder = folderName
    this.parentDirectory = parentDirectory
  }

  public getBundleDirectory(): string {
    return path.resolve(this.parentDirectory, this.bundleFolder)
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

  public createEmptySubdirectoriesForGitIfNotExist(): void {
    this.createEmptySubDirectoryForGitIfNotExist(MICROSERVICES_FOLDER)
    this.createEmptySubDirectoryForGitIfNotExist(MICROFRONTENDS_FOLDER)
    this.createEmptySubDirectoryForGitIfNotExist(PSC_FOLDER)
    this.createEmptySubDirectoryForGitIfNotExist(SVC_FOLDER)
  }

  public createEmptySubDirectoryForGitIfNotExist(
    ...subDirectories: string[]
  ): void {
    const directoryPath = this.createSubDirectoryIfNotExist(...subDirectories)
    if (fs.readdirSync(directoryPath).length === 0) {
      FSService.addGitKeepFile(directoryPath)
    }
  }

  public static copyFolderRecursiveSync(
    sourceFolder: string,
    destFolder: string
  ): void {
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder)
    }

    const files = fs.readdirSync(sourceFolder)
    for (const file of files) {
      const currSource = path.join(sourceFolder, file)
      const currTarget = path.join(destFolder, file)
      if (fs.lstatSync(currSource).isDirectory()) {
        FSService.copyFolderRecursiveSync(currSource, currTarget)
      } else {
        fs.copyFileSync(currSource, currTarget)
      }
    }
  }

  public static addGitKeepFile(directoryPath: string): void {
    const gitKeepFile = path.join(directoryPath, GITKEEP_FILE)
    if (!fs.existsSync(gitKeepFile)) {
      fs.writeFileSync(gitKeepFile, '')
    }
  }

  public static removeGitKeepFile(directoryPath: string): void {
    const gitKeepFile = path.join(directoryPath, GITKEEP_FILE)
    if (fs.existsSync(gitKeepFile)) {
      fs.rmSync(gitKeepFile)
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
