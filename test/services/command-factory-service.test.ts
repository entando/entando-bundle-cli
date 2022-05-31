import { expect, test } from '@oclif/test'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroServiceStack
} from '../../src/models/component'

import {
  CommandFactoryService,
  Phase
} from '../../src/services/command-factory-service'

describe('CommandFactoryService', () => {
  test.it('Maven build command', () => {
    const component: Component<ComponentType.MICROSERVICE> = {
      name: 'test-ms',
      stack: MicroServiceStack.SpringBoot,
      type: ComponentType.MICROSERVICE
    }

    const commandOptions = CommandFactoryService.getCommand(
      component,
      Phase.Build
    )

    expect(commandOptions).to.eql('mvn clean test')
  })

  test.it('React build command', () => {
    const component: Component<ComponentType.MICROFRONTEND> = {
      name: 'test-mfe',
      stack: MicroFrontendStack.React,
      type: ComponentType.MICROFRONTEND
    }

    const commandOptions = CommandFactoryService.getCommand(
      component,
      Phase.Build
    )

    expect(commandOptions).to.eql('npm install && npm run build')
  })
})
