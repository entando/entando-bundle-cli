import { expect, test } from '@oclif/test'

import { ComponentService } from '../../src/services/component-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { bundleDescriptor } from '../helpers/mocks/component-service-test/bundle-descriptor'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import { ProcessExecutorService } from '../../src/services/process-executor-service'

describe('component-service', () => {
  let componentService: ComponentService
  const tempDirHelper = new TempDirHelper(__filename)
  const msSpringBoot = 'test-ms-spring-boot-1'

  before(() => {
    const bundleDir = tempDirHelper.createInitializedBundleDir()
    const bundleDescriptorService = new BundleDescriptorService(bundleDir)
    bundleDescriptorService.createBundleDescriptor(
      bundleDescriptor as BundleDescriptor
    )
  })

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor as BundleDescriptor)
    })
    .it('get component', () => {
      componentService = new ComponentService()
      expect(
        componentService.getComponent('test-ms-spring-boot-1').stack
      ).to.be.eq('spring-boot')
      expect(
        componentService.getComponent('test-ms-spring-boot-2').stack
      ).to.be.eq('spring-boot')
      expect(componentService.getComponent('test-mfe-1').stack).to.be.eq(
        'react'
      )
      expect(componentService.getComponent('test-mfe-2').stack).to.be.eq(
        'react'
      )
    })

  test
    .do(() => {
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor as BundleDescriptor)
    })
    .it('get component that not exists', () => {
      componentService = new ComponentService()
      expect(() => componentService.getComponent('test-ms-3')).to.throw(
        CLIError
      )
    })

  test
    .do(() => {
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor as BundleDescriptor)
    })
    .it('get all components', () => {
      componentService = new ComponentService()
      const allComponents = componentService.getComponents()
      expect(allComponents.length).to.be.eq(4)
    })

  test
    .do(() => {
      const bundleDir =
        tempDirHelper.createInitializedBundleDir('test-build-service')
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msSpringBoot),
        { recursive: true }
      )
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor as BundleDescriptor)
      sinon.stub(fs, 'existsSync').returns(true)
    })
    .it('Builds spring-boot Microservice', async () => {
      const executeProcessStub = sinon.stub(
        ProcessExecutorService,
        'executeProcess'
      )
      await componentService.build(msSpringBoot)

      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn test'
        })
      )
    })
})
