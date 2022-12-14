import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'
import { SVC_FOLDER } from '../../../src/paths'
import { CliUx } from '@oclif/core'
import { CLIError } from '@oclif/errors'

describe('svc disable', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)
  let keycloakYaml: string

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
    keycloakYaml = path.resolve(bundleDirectory, SVC_FOLDER, 'keycloak.yml')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: ['keycloak', 'postgresql']
    })
  })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(() => {
      fs.writeFileSync(keycloakYaml, '')
    })
    .command(['svc disable', '--remove', 'keycloak'])
    .it('disable a service successfully', () => {
      verifyKeycloakDisabledSuccessfully()
      expect(fs.existsSync(keycloakYaml)).false
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(() => {
      fs.writeFileSync(keycloakYaml, '')
    })
    .command(['svc disable', '--no-remove', 'keycloak'])
    .it('disable a service successfully without removing its data', () => {
      verifyKeycloakDisabledSuccessfully()
      expect(fs.existsSync(keycloakYaml)).true
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(() => {
      fs.writeFileSync(keycloakYaml, '')
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(true))
    .command(['svc disable', 'keycloak'])
    .it(
      'disable a service successfully asking for removal and user answers "yes"',
      () => {
        verifyKeycloakDisabledSuccessfully()
        expect(fs.existsSync(keycloakYaml)).false
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(() => {
      fs.writeFileSync(keycloakYaml, '')
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
    .command(['svc disable', 'keycloak'])
    .it(
      'disable a service successfully asking for removal and user answers "no"',
      () => {
        verifyKeycloakDisabledSuccessfully()
        expect(fs.existsSync(keycloakYaml)).true
      }
    )

  test
    .stderr()
    .command(['svc disable', '--remove', 'win386'])
    .catch(error => {
      expect(error.message).to.contain('Service win386 does not exist')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('disable a service that is unavailable')

  test
    .stderr()
    .command(['svc disable', '--remove', 'mysql'])
    .catch(error => {
      expect(error.message).to.contain('Service mysql is not enabled')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('disable a service that is not enabled')

  test
    .command(['svc disable', '--remove'])
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('serviceName')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if required argument is missing')

  function verifyKeycloakDisabledSuccessfully() {
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    expect(bundleDescriptor.svc).to.have.length(1)
    expect(bundleDescriptor.svc).to.deep.equal(['postgresql'])

    const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
    expect(runStub.called).to.equal(true)
    expect(runStub.args[0]).to.have.length(1)
    expect(runStub.getCall(1).args[0]).to.haveOwnProperty(
      'command',
      'docker compose -p sample-bundle -f svc/keycloak.yml rm -f -s keycloak'
    )
  }
})
