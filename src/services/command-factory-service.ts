import { Component, ComponentType, StackFor } from '../models/component'

export enum Phase {
  Clean = 'clean',
  Build = 'build',
  Package = 'package'
}

export type CommandOptions = {
  command: string
  arguments: string[]
}

type CommandsDefinition = {
  [type in ComponentType]: {
    [stack in StackFor<type>]: {
      [phase in Phase]: CommandOptions
    }
  }
}

const DEFAULT_COMMANDS: CommandsDefinition = {
  microfrontend: {
    angular: {
      clean: {
        command: 'npm',
        arguments: ['run', 'clean']
      },
      build: {
        command: 'npm',
        arguments: ['run', 'build']
      },
      package: {
        command: 'npm',
        arguments: ['run', 'build']
      }
    },
    react: {
      clean: {
        command: 'npm',
        arguments: ['run', 'clean']
      },
      build: {
        command: 'npm',
        arguments: ['run', 'build']
      },
      package: {
        command: 'npm',
        arguments: ['run', 'build']
      }
    }
  },
  microservice: {
    'spring-boot': {
      clean: {
        command: 'mvn',
        arguments: ['clean']
      },
      build: {
        command: 'mvn',
        arguments: ['clean', 'test']
      },
      package: {
        command: 'mvn',
        arguments: ['clean', 'package', '-DskipTests']
      }
    },
    node: {
      clean: {
        command: 'npm',
        arguments: ['run', 'clean']
      },
      build: {
        command: 'npm',
        arguments: ['run', 'build']
      },
      package: {
        command: 'npm',
        arguments: ['run', 'build']
      }
    }
  }
}

export class CommandFactoryService {
  public static getCommand<T extends ComponentType>(
    component: Component<T>,
    phase: Phase
  ): CommandOptions {
    return DEFAULT_COMMANDS[component.type][component.stack][phase]
  }
}
