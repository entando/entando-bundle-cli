import { expect, test } from '@oclif/test'
import * as cp from 'node:child_process'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'

describe('svc start', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: ['postgresql', 'mysql']
    })
  })

  test
    .stdout()
    .stub(cp, 'execSync', sinon.stub().returns('docker-compose executed'))
    .command(['svc start', '--all'])
    .it('start active services successfully', () => {
      const runStub = cp.execSync as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(2)
      expect(runStub.args[0][0]).to.contain('docker-compose -p sample-bundle')
      expect(runStub.args[0][0]).to.contain(
        `${bundleDirectory}/svc/postgresql.yml`
      )
      expect(runStub.args[0][0]).to.contain(
        `${bundleDirectory}/svc/mysql.yml up --build -d`
      )
    })

  test
    .stdout()
    .stub(cp, 'execSync', sinon.stub().returns('docker-compose executed'))
    .command(['svc start', 'mysql'])
    .it('start specific service mysql', () => {
      const runStub = cp.execSync as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(2)
      expect(runStub.args[0][0]).to.contain('docker-compose -p sample-bundle')
      expect(runStub.args[0][0]).to.contain(
        `${bundleDirectory}/svc/mysql.yml up --build -d`
      )
    })

  test
    .stderr()
    .command(['svc start'])
    .catch(error => {
      expect(error.message).to.contain('At least 1 service name is required.')
    })
    .it('start without any arguments and flags')

  test
    .stderr()
    .command(['svc start', 'win98'])
    .catch(error => {
      expect(error.message).to.contain('Service win98 is not enabled.')
    })
    .it('start an unlisted service')
})
