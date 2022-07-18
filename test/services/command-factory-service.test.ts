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

      const command = CommandFactoryService.getCommand(component, Phase.Build)

      expect(command).to.eql('mvn test')
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

      const command = CommandFactoryService.getCommand(component, Phase.Build)

      expect(command).to.eql('npm install && npm run build')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microservices: [
          {
            name: 'my-ms',
            commands: { build: 'custom-ms-build' }
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

      const command = CommandFactoryService.getCommand(component, Phase.Build)

      expect(command).to.eql('custom-ms-build')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microfrontends: [
          {
            name: 'my-mfe',
            commands: { build: 'custom-mfe-build' }
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

      const command = CommandFactoryService.getCommand(component, Phase.Build)

      expect(command).to.eql('custom-mfe-build')
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
    .it('Maven run command', () => {
      const component: Component<ComponentType.MICROSERVICE> = {
        name: 'test-ms',
        stack: MicroserviceStack.SpringBoot,
        type: ComponentType.MICROSERVICE
      }

      const command = CommandFactoryService.getCommand(component, Phase.Run)

      expect(command).to.eql('mvn spring-boot:run')
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
    .it('React run command', () => {
      const component: Component<ComponentType.MICROFRONTEND> = {
        name: 'test-mfe',
        stack: MicroFrontendStack.React,
        type: ComponentType.MICROFRONTEND
      }

      const command = CommandFactoryService.getCommand(component, Phase.Run)

      expect(command).to.eql('npm install && npm start')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microservices: [
          {
            name: 'my-ms',
            commands: { run: 'custom-ms-run' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('Microservice custom run command', () => {
      const component: Component<ComponentType.MICROSERVICE> = {
        name: 'my-ms',
        stack: MicroserviceStack.SpringBoot,
        type: ComponentType.MICROSERVICE
      }

      const command = CommandFactoryService.getCommand(component, Phase.Run)

      expect(command).to.eql('custom-ms-run')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microfrontends: [
          {
            name: 'my-mfe',
            commands: { run: 'custom-mfe-run' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('MicroFrontend custom run command', () => {
      const component: Component<ComponentType.MICROFRONTEND> = {
        name: 'my-mfe',
        stack: MicroFrontendStack.React,
        type: ComponentType.MICROFRONTEND
      }

      const command = CommandFactoryService.getCommand(component, Phase.Run)

      expect(command).to.eql('custom-mfe-run')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microfrontends: [
          {
            name: 'my-mfe',
            commands: { pack: 'custom-mfe-pack' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('MicroFrontend custom pack command', () => {
      const component: Component<ComponentType.MICROFRONTEND> = {
        name: 'my-mfe',
        stack: MicroFrontendStack.React,
        type: ComponentType.MICROFRONTEND
      }

      const command = CommandFactoryService.getCommand(component, Phase.Pack)

      expect(command).to.eql('custom-mfe-pack')
    })

  test
    .do(() => {
      const bundleDescriptor = <BundleDescriptor>{
        microservices: [
          {
            name: 'my-ms',
            commands: { pack: 'custom-ms-pack' }
          }
        ]
      }

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('Microservice custom pack command', () => {
      const component: Component<ComponentType.MICROSERVICE> = {
        name: 'my-ms',
        stack: MicroserviceStack.SpringBoot,
        type: ComponentType.MICROSERVICE
      }

      const command = CommandFactoryService.getCommand(component, Phase.Pack)

      expect(command).to.eql('custom-ms-pack')
    })
})
