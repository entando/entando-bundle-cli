import * as path from 'node:path'
import * as fs from 'node:fs'
import { DESCRIPTORS_OUTPUT_FOLDER, PSC_FOLDER } from '../paths'
import {
  SupportedPSC,
  SUPPORTED_PSC_TYPES
} from '../models/yaml-bundle-descriptor'

const DESCRIPTOR_EXTENSIONS_REGEX = /\.ya?ml$/

export type PSCDescriptors = {
  [key in SupportedPSC]?: string[]
}

export class PSCService {
  public static checkInvalidFolders(): string[] {
    const invalidFolders: string[] = []
    for (const subFolder of fs
      .readdirSync(PSC_FOLDER, { withFileTypes: true })
      .filter(file => file.isDirectory())) {
      if (!isSupportedPSC(subFolder.name)) {
        invalidFolders.push(subFolder.name)
      }
    }

    return invalidFolders
  }

  public static copyPSCFiles(): PSCDescriptors {
    const destination = path.join(...DESCRIPTORS_OUTPUT_FOLDER)
    const descriptorsMap: PSCDescriptors = {}

    if (fs.existsSync(PSC_FOLDER)) {
      for (const subFolder of fs
        .readdirSync(PSC_FOLDER, { withFileTypes: true })
        .filter(file => file.isDirectory())) {
        const subFolderName = subFolder.name
        if (isSupportedPSC(subFolderName)) {
          const source = path.join(PSC_FOLDER, subFolderName)
          const descriptors = fs
            .readdirSync(source)
            .filter(name => name.match(DESCRIPTOR_EXTENSIONS_REGEX))
          descriptorsMap[subFolderName] = descriptors.map(
            descriptor => `${subFolderName}/${descriptor}`
          )
          PSCService.copyRecursive(
            source,
            path.join(destination, subFolderName)
          )
        }
      }
    }

    return descriptorsMap
  }

  private static copyRecursive(source: string, destination: string) {
    if (fs.statSync(source).isDirectory()) {
      fs.mkdirSync(destination, { recursive: true })
      for (const file of fs.readdirSync(source)) {
        PSCService.copyRecursive(
          path.join(source, file),
          path.join(destination, file)
        )
      }
    } else {
      fs.copyFileSync(source, destination)
    }
  }
}

function isSupportedPSC(value: string): value is SupportedPSC {
  const types: string[] = SUPPORTED_PSC_TYPES as unknown as string[]
  return types.includes(value)
}
