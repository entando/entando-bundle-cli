import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import { Component } from '../../src/models/component'
import { ComponentType } from '../../src/models/component'

describe('Build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const msNameSpringBoot = 'test-ms-spring-boot'
  const msNameNotImplementedStack = 'test-not-implemented-stack'

  const microserviceSpringBoot: Component = {
    name: msNameSpringBoot,
    stack: 'spring-boot',
    type: ComponentType.MICROSERVICE
  }

  const microserviceNotImplementedStack: Component = {
    name: msNameNotImplementedStack,
    stack: 'test',
    type: ComponentType.MICROSERVICE
  }
  let executeProcessStub: sinon.SinonStub

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      const bundleDir =
        tempDirHelper.createInitializedBundleDir('test-build-command')
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msNameSpringBoot),
        { recursive: true }
      )
      executeProcessStub = sinon.stub(ProcessExecutorService, 'executeProcess')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(microserviceSpringBoot)
    })
    .command(['build', msNameSpringBoot])
    .it('build spring-boot Microservice', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn',
          arguments: ['clean', 'test']
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
      executeProcessStub = sinon.stub(ProcessExecutorService, 'executeProcess')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(microserviceSpringBoot)
    })
    .command(['build', 'test-ms-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('build spring-boot Microservice folder not exists')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
      executeProcessStub = sinon.stub(ProcessExecutorService, 'executeProcess')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(microserviceNotImplementedStack)
    })
    .command(['build', msNameNotImplementedStack])
    .catch(error => {
      expect(error.message).to.contain('build not implemented')
    })
    .it('build Microservice with not implemented build stack')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
      executeProcessStub = sinon.stub(ProcessExecutorService, 'executeProcess')
      sinon
        .stub(ComponentService.prototype, 'build')
        .rejects(new Error(`Command failed due to error: error`))
    })
    .command(['build', msNameSpringBoot])
    .catch(error => {
      expect(error.message).to.contain('Command failed due to error')
    })
    .it('build spring-boot Microservice build error')
})
