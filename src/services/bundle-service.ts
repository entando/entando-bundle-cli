import { BundleDescriptorService } from './bundle-descriptor-service'
import * as crypto from 'node:crypto'
import * as path from 'node:path'
import { FSService } from './fs-service'
import { DockerService } from './docker-service'
import {
  ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP,
  DOCKER_PREFIX
} from '../models/bundle-descriptor-constraints'

export class BundleService {
  public static isValidBundleProject(): void {
    new BundleDescriptorService().validateBundleDescriptor()

    const fsService = new FSService(
      path.basename(process.cwd()),
      path.dirname(process.cwd())
    )

    fsService.createEmptySubdirectoriesForGitIfNotExist()
  }

  public static generateBundleId(bundle: string): string {
    if (bundle.startsWith(DOCKER_PREFIX)) {
      bundle = bundle.slice(DOCKER_PREFIX.length)
    }

    if (bundle.match(ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP) !== null) {
      bundle = DockerService.getDefaultDockerRegistry() + '/' + bundle
    }

    const sha256 = crypto.createHash('sha256').update(bundle).digest('hex')
    return sha256.slice(0, 8)
  }
}
