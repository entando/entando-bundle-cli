import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack
} from '../../src/models/component'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'

import {
  CommandFactoryService,
  Phase
} from '../../src/services/command-factory-service'

describe('CommandFactoryService', () => {
  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microservices: [{ name: 'test-ms' }]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('Maven build command', () => {
      const component: Component<ComponentType.MICROSERVICE> = {
        name: 'test-ms',
        stack: MicroserviceStack.SpringBoot,
        type: ComponentType.MICROSERVICE
      }

      const commandOptions = CommandFactoryService.getCommand(
        component,
        Phase.Build
      )

      expect(commandOptions).to.eql('mvn test')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microfrontends: [{ name: 'test-mfe' }]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('React build command', () => {
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

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microservices: [
          {
            name: 'my-ms',
            commands: { build: 'custommsbuild' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('Microservice custom build command', () => {
      const component: Component<ComponentType.MICROSERVICE> = {
        name: 'my-ms',
        stack: MicroserviceStack.SpringBoot,
        type: ComponentType.MICROSERVICE
      }

      const commandOptions = CommandFactoryService.getCommand(
        component,
        Phase.Build
      )

      expect(commandOptions).to.eql('custommsbuild')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microfrontends: [
          {
            name: 'my-mfe',
            commands: { build: 'custommfebuild' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('MicroFrontend custom build command', () => {
      const component: Component<ComponentType.MICROFRONTEND> = {
        name: 'my-mfe',
        stack: MicroFrontendStack.React,
        type: ComponentType.MICROFRONTEND
      }

      const commandOptions = CommandFactoryService.getCommand(
        component,
        Phase.Build
      )

      expect(commandOptions).to.eql('custommfebuild')
    })
})
