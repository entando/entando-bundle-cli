import {
  Commands,
  MicroFrontend,
  Microservice
} from '../models/bundle-descriptor'
import { Component, ComponentType, StackFor } from '../models/component'
import { BundleDescriptorService } from './bundle-descriptor-service'

export enum Phase {
  Clean = 'clean',
  Build = 'build',
  Pack = 'pack',
  Run = 'run'
}

type CommandsDefinition = {
  [type in ComponentType]: {
    [stack in Exclude<StackFor<type>, 'custom'>]: {
      [phase in Phase]: string
    }
  }
}

const DEFAULT_COMMANDS: CommandsDefinition = {
  microfrontend: {
    angular: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      pack: 'npm install && npm run build',
      run: 'npm install && npm start'
    },
    react: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      pack: 'npm install && npm run build',
      run: 'npm install && npm start'
    }
  },
  microservice: {
    'spring-boot': {
      clean: 'mvn clean',
      build: 'mvn test',
      pack: 'mvn clean package -DskipTests',
      run: 'mvn spring-boot:run'
    },
    node: {
      clean: 'npm run clean',
      build: 'npm install && npm run build',
      pack: 'npm install && npm run build',
      run: 'npm install && npm start'
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

    const stack = component.stack as Exclude<StackFor<T>, 'custom'>

    return customCommand || DEFAULT_COMMANDS[component.type][stack][phase]
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

    return commands && commands[phase as keyof Commands]
  }
}
