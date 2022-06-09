import { MicroFrontend, Microservice } from '../models/bundle-descriptor'
import { Component, ComponentType, StackFor } from '../models/component'
import { BundleDescriptorService } from './bundle-descriptor-service'

export enum Phase {
  Clean = 'clean',
  Build = 'build',
  Package = 'package'
}

type CommandsDefinition = {
  [type in ComponentType]: {
    [stack in StackFor<type>]: {
      [phase in Phase]: string
    }
  }
}

const DEFAULT_COMMANDS: CommandsDefinition = {
  microfrontend: {
    angular: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      package: 'npm install && npm run build'
    },
    react: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      package: 'npm install && npm run build'
    }
  },
  microservice: {
    'spring-boot': {
      clean: 'mvn clean',
      build: 'mvn test',
      package: 'mvn clean package -DskipTests'
    },
    node: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      package: 'npm install && npm run build'
    }
  }
}

export class CommandFactoryService {
  public static getCommand<T extends ComponentType>(
    component: Component<T>,
    phase: Phase
  ): string {
    const customCommand: string | undefined =
      CommandFactoryService.getCustomCommand(component, phase)

    return (
      customCommand || DEFAULT_COMMANDS[component.type][component.stack][phase]
    )
  }

  private static getCustomCommand<T extends ComponentType>(
    component: Component<T>,
    phase: Phase
  ): string | undefined {
    const bundleDescriptorService: BundleDescriptorService =
      new BundleDescriptorService()
    const comps: Array<Microservice | MicroFrontend> =
      bundleDescriptorService.getBundleDescriptor()[`${component.type}s`]
    const commands = comps.find(({ name }) => name === component.name)?.commands

    // Currently, only `build` is a property of `commands`
    return commands && commands[phase as Phase.Build]
  }
}
