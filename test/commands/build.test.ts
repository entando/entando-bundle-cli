import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROFRONTENDS_FOLDER, MICROSERVICES_FOLDER } from '../../src/paths'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroServiceStack
} from '../../src/models/component'

describe('build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const msNameSpringBoot = 'test-ms-spring-boot'
  const mfeNameReact = 'test-mfe-react'

  const msSpringBoot: Component<ComponentType> = {
    name: msNameSpringBoot,
    stack: MicroServiceStack.SpringBoot,
    type: ComponentType.MICROSERVICE
  }

  const mfeReact: Component<ComponentType.MICROFRONTEND> = {
    name: mfeNameReact,
    stack: MicroFrontendStack.React,
    type: ComponentType.MICROFRONTEND
  }

  let executeProcessStub: sinon.SinonStub

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['build', 'test-ms-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('build spring-boot microservice folder not exists')

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-ms'
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msNameSpringBoot),
        { recursive: true }
      )
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['build', msNameSpringBoot])
    .it('build spring-boot Microservice', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn test'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', msNameSpringBoot])
    .exit(5)
    .it('build spring-boot microservice exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', msNameSpringBoot])
    .exit(1)
    .it('build spring-boot microservice exits with code 1')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['build', 'test-mfe-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('build react micro frontend folder not exists')

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-mfe'
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROFRONTENDS_FOLDER, mfeNameReact),
        { recursive: true }
      )
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['build', mfeNameReact])
    .it('build react micro frontend', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'npm install && npm run build'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', mfeNameReact])
    .exit(5)
    .it('build react micro frontend exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', mfeNameReact])
    .exit(1)
    .it('build react micro frontend exits with code 1')
})
