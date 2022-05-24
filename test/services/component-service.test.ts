import { expect, test } from '@oclif/test'

import { ComponentService } from '../../src/services/component-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { bundleDescriptor } from '../helpers/mocks/component-service-test/bundle-descriptor'
import { CLIError } from '@oclif/errors'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import TempDirHelper from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'

describe('component-service', () => {
  let componentService: ComponentService
  const tempDirHelper = new TempDirHelper(__filename)

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
      const allComponents = componentService.getAllComponents()
      expect(allComponents.length).to.be.eq(4)
    })
})
