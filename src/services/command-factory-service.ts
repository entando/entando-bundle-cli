import { Component, ComponentType, StackFor } from '../models/component'

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
    return DEFAULT_COMMANDS[component.type][component.stack][phase]
  }
}
