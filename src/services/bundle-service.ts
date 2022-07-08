import { BundleDescriptorService } from './bundle-descriptor-service'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import {
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER
} from '../paths'
import { Errors } from '@oclif/core'

export class BundleService {
  public static isValidBundleProject(): void {
    new BundleDescriptorService().validateBundleDescriptor()

    if (!fs.existsSync(PSC_FOLDER)) {
      Errors.warn(`Folder ${PSC_FOLDER} is missing`)
    }

    if (!fs.existsSync(MICROFRONTENDS_FOLDER)) {
      Errors.warn(`Folder ${MICROFRONTENDS_FOLDER} is missing`)
    }

    if (!fs.existsSync(MICROSERVICES_FOLDER)) {
      Errors.warn(`Folder ${MICROSERVICES_FOLDER} is missing`)
    }
  }

  public static generateBundleId(bundle: string): string {
    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }
}
