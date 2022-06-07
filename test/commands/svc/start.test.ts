import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'

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
    .stub(
      ProcessExecutorService,
      'executeProcess',
      sinon.stub().returns('docker-compose executed')
    )
    .command(['svc start', '--all'])
    .it('start active services successfully', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/postgresql.yml -f svc/mysql.yml up --build -d'
      )
    })

  test
    .stdout()
    .stub(
      ProcessExecutorService,
      'executeProcess',
      sinon.stub().returns('docker-compose executed')
    )
    .command(['svc start', 'mysql'])
    .it('start specific service mysql', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/mysql.yml up --build -d'
      )
    })

  test
    .stderr()
    .command(['svc start'])
    .catch(error => {
      expect(error.message).to.contain('At least one service name is required.')
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
