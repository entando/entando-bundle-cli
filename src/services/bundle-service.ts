import { BundleDescriptorService } from './bundle-descriptor-service'

export class BundleService {
  public static isValidBundleProject(): void {
    new BundleDescriptorService().validateBundleDescriptor()
  }
}
