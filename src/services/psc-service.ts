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
    for (const subFolder of fs.readdirSync(PSC_FOLDER)) {
      if (!isSupportedPSC(subFolder)) {
        invalidFolders.push(subFolder)
      }
    }

    return invalidFolders
  }

  public static copyPSCFiles(): PSCDescriptors {
    const destination = path.join(...DESCRIPTORS_OUTPUT_FOLDER)
    const descriptorsMap: PSCDescriptors = {}

    if (fs.existsSync(PSC_FOLDER)) {
      for (const subFolder of fs.readdirSync(PSC_FOLDER)) {
        if (isSupportedPSC(subFolder)) {
          const source = path.join(PSC_FOLDER, subFolder)
          const descriptors = fs
            .readdirSync(source)
            .filter(name => name.match(DESCRIPTOR_EXTENSIONS_REGEX))
          descriptorsMap[subFolder] = descriptors.map(
            descriptor => `${subFolder}/${descriptor}`
          )
          PSCService.copyRecursive(source, path.join(destination, subFolder))
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
