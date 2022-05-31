import { test } from '@oclif/test'

import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { DockerService } from '../../src/services/docker-service'
import * as sinon from 'sinon'

describe('DockerService', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox()

  afterEach(function () {
    sandbox.restore()
  })

  test.it('Builds Docker image with standard Dockerfile', () => {
    const executeProcessStub = sandbox.stub(
      ProcessExecutorService,
      'executeProcess'
    )

    DockerService.buildDockerImage({
      path: '.',
      organization: 'my-org',
      name: 'bundle-name',
      tag: '0.0.1'
    })

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: 'docker build -f Dockerfile -t my-org/bundle-name:0.0.1 .'
      })
    )
  })

  test.it('Builds Docker image with custom Dockerfile', () => {
    const executeProcessStub = sandbox.stub(
      ProcessExecutorService,
      'executeProcess'
    )

    DockerService.buildDockerImage({
      path: '.',
      organization: 'my-org',
      name: 'bundle-name',
      tag: '0.0.1',
      dockerfile: 'my-Dockerfile'
    })

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: 'docker build -f my-Dockerfile -t my-org/bundle-name:0.0.1 .'
      })
    )
  })
})
