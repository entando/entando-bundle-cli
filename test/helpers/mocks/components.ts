import {
  MicroFrontend,
  MicroService
} from '../../../src/models/bundle-descriptor'
import {
  MicroFrontendStack,
  MicroServiceStack
} from '../../../src/models/component'

/**
 * Helper class for instantiating valid components to use in tests
 */
export class ComponentHelper {
  public static newMicroService(
    name: string,
    partial: Partial<MicroService> = {}
  ): MicroService {
    return {
      name: name,
      stack: MicroServiceStack.SpringBoot,
      dbms: 'mysql',
      ...partial
    }
  }

  public static newMicroFrontEnd(
    name: string,
    partial: Partial<MicroFrontend> = {}
  ): MicroFrontend {
    return {
      name: name,
      stack: MicroFrontendStack.React,
      customUiPath: 'path/to/ui',
      group: 'group',
      publicFolder: 'public',
      titles: {
        en: 'English Title'
      },
      ...partial
    }
  }
}
