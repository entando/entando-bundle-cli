import {
  MicroFrontend,
  Microservice
} from '../../../src/models/bundle-descriptor'
import {
  MicroFrontendStack,
  MicroserviceStack
} from '../../../src/models/component'

/**
 * Helper class for instantiating valid components to use in tests
 */
export class ComponentHelper {
  public static newMicroservice(
    name: string,
    partial: Partial<Microservice> = {}
  ): Microservice {
    return {
      name: name,
      stack: MicroserviceStack.SpringBoot,
      dbms: 'mysql',
      ...partial
    }
  }

  public static newMicroFrontend(
    name: string,
    partial: Partial<MicroFrontend> = {}
  ): MicroFrontend {
    return {
      name: name,
      stack: MicroFrontendStack.React,
      group: 'group',
      publicFolder: 'public',
      titles: {
        en: 'English Title'
      },
      ...partial
    }
  }
}
