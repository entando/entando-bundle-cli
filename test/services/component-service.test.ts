import { expect, test } from '@oclif/test'

import { ComponentService } from '../../src/services/component-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { CLIError } from '@oclif/errors'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import { ComponentHelper } from '../helpers/mocks/component-helper'
import { BundleDescriptorVersion, MicroFrontendType } from '../../src/models/bundle-descriptor'

describe('component-service', () => {
  let componentService: ComponentService
  const tempDirHelper = new TempDirHelper(__filename)
  const msSpringBoot = 'test-ms-spring-boot-1'
  const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()

  before(() => {
    const bundleDir = tempDirHelper.createInitializedBundleDir()
    const bundleDescriptorService = new BundleDescriptorService(bundleDir)
    bundleDescriptorService.createBundleDescriptor(bundleDescriptor)
  })

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
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
        .returns(bundleDescriptor)
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
        .returns(bundleDescriptor)
    })
    .it('get all components', () => {
      componentService = new ComponentService()
      const allComponents = componentService.getComponents()
      expect(allComponents.length).to.be.eq(5)
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
        .returns(bundleDescriptor)
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

  test
    .do(() => {
      const bundleDir =
        tempDirHelper.createInitializedBundleDir('test-run-service')
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msSpringBoot),
        { recursive: true }
      )
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
      sinon.stub(fs, 'existsSync').returns(true)
    })
    .it('Run spring-boot Microservice', async () => {
      const executeProcessStub = sinon.stub(
        ProcessExecutorService,
        'executeProcess'
      )
      await componentService.run(msSpringBoot)

      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn spring-boot:run'
        })
      )
    })

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microfrontends = [
        ComponentHelper.newMicroFrontend('same-name')
      ]
      bundleDescriptor.microservices = [
        ComponentHelper.newMicroservice('same-name')
      ]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
      componentService.checkDuplicatedComponentNames()
    })
    .catch(error => {
      expect(error.message).contain(
        'Components names should be unique. Duplicates found: same-name'
      )
    })
    .it('Checks for duplicate component names')

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microfrontends = [
        ComponentHelper.newMicroFrontend('mfe-name-1', {
          type: MicroFrontendType.Widget,
          configMfe: 'mfe-not-found'
        }),
        ComponentHelper.newMicroFrontend('mfe-conf', {
          type: MicroFrontendType.Widget
        })
      ]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
      componentService.checkConfigMfes()
    })
    .catch(error => {
      expect(error.message).contain(
        'configMfe value mfe-not-found for MFE mfe-name-1 must be an existing widget-config MFE'
      )
    })
    .it(
      'Checks for config MFE that has invalid requirements with non-existent mfe name'
    )

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.bundleDescriptorVersion = BundleDescriptorVersion.v5
      bundleDescriptor.microservices = [
        ComponentHelper.newMicroservice('ms-name-1', {
          resources: {
            cpu: '100m',
            memory: '20gb',
            storage: '10gb'
          }
        })
      ]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
      componentService.checkDescriptorFieldsCompatibility()
    })
    .catch(error => {
      expect(error.message).contain(
        'Incompatible "resources" field for the microservice ms-name-1, this field can\'t be set in v5 bundle version'
      )
    })
    .it(
      'Check bundle v5 fields compatibility'
    )

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microfrontends = [
        ComponentHelper.newMicroFrontend('mfe-name-1', {
          type: MicroFrontendType.Widget,
          configMfe: 'mfe-conf'
        }),
        ComponentHelper.newMicroFrontend('mfe-conf', {
          type: MicroFrontendType.Widget
        })
      ]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
      componentService.checkConfigMfes()
    })
    .catch(error => {
      expect(error.message).contain(
        'configMfe value mfe-conf for MFE mfe-name-1 must be an existing widget-config MFE in the project or a platform provided config MFE, defined with the global:<name> syntax'
      )
    })
    .it(
      'Checks for config MFE that has invalid requirements with wrong widget type'
    )

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microfrontends = [
        ComponentHelper.newMicroFrontend('mfe-name-1', {
          type: MicroFrontendType.Widget,
          configMfe: 'global:mfe-conf'
        }),
        ComponentHelper.newMicroFrontend('mfe-conf', {
          type: MicroFrontendType.Widget
        })
      ]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)
    })
    .it('Checks for config MFE that has global prefix', () => {
      expect(() => componentService.checkConfigMfes()).not.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      const mfe = ComponentHelper.newMicroFrontend('mfe-conf', {
        type: MicroFrontendType.Widget
      })
      mfe.version = '0.0.6'
      bundleDescriptor.microfrontends = [mfe]
      bundleDescriptor.microservices = []

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)

      const versionedComponents = componentService.getVersionedComponents()
      expect(versionedComponents[0].version).eq('0.0.6')
    })
    .it('Returns version override')
})
