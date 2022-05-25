import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import TempDirHelper from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import ProcessExecutorService from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import { Component } from '../../src/models/component'
import { ComponentType } from '../../src/models/component'

describe('Build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const msSpringBoot = 'test-ms-spring-boot'
  const msNotImplementedStack = 'test-not-implemented-stack'

  const microserviceSpringBoot: Component = {
    name: msSpringBoot,
    stack: 'spring-boot',
    type: ComponentType.MICROSERVICE
  }

  const microserviceNotImplementedStack: Component = {
    name: msNotImplementedStack,
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
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msSpringBoot),
        { recursive: true }
      )
      executeProcessStub = sinon.stub(ProcessExecutorService, 'executeProcess')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(microserviceSpringBoot)
    })
    .command(['build', msSpringBoot])
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
    .command(['build', msNotImplementedStack])
    .catch(error => {
      expect(error.message).to.contain('build not implemented')
    })
    .it('build Microservice with not implemented build stack')
})
