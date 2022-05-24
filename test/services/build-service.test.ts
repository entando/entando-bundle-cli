import { test } from '@oclif/test'

import ProcessExecutorService from '../../src/services/process-executor-service'
import * as sinon from 'sinon'
import { BuildService } from '../../src/services/build-service'
import * as fs from 'node:fs'
import { bundleDescriptor } from '../helpers/mocks/component-service-test/bundle-descriptor'
import * as path from 'node:path'
import TempDirHelper from '../helpers/temp-dir-helper'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'

describe('build-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const msSpringBoot = 'test-ms-spring-boot-1'

  afterEach(function () {
    sinon.restore()
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
      await BuildService.build(msSpringBoot)

      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn',
          arguments: ['clean', 'test']
        })
      )
    })
})
