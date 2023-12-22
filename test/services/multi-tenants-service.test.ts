import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { MultiTenantsService } from '../../src/services/multi-tenants-service'

describe('multi-tenants-service', () => {
  const entandoTenantsJSONSubsetString = '[{"tenantCode":"tenant1"},{"tenantCode":"tenant1"},{"tenantCode":"tenant1"}]'
  const envCliDebugInitialValue = process.env.ENTANDO_CLI_DEBUG
  const entandoDeBundleJSONSubsetString = "apiVersion: entando.org/v1\n" +
    "kind: EntandoDeBundle\n" +
    "metadata:\n" +
    "  name: myBundle-c03c36b3\n" +
    "  annotations:\n" +
    "    entando.org/tenants: tenant2"


  afterEach(() => {
    sinon.restore()
      // reset debug env var option to the initial value
      process.env.ENTANDO_CLI_DEBUG = envCliDebugInitialValue

  })


  test.it('runs validateTenantList passing an existing tenant', async () => {
    const executeProcessStub = sinon
      .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
            options.outputStream!.write(Buffer.from(entandoTenantsJSONSubsetString).toString('base64'))
            return Promise.resolve(0)
        })

        await MultiTenantsService.validateTenantList(['tenant1'])

        sinon.assert.calledWith(
            executeProcessStub,
            sinon.match({
                command: `ent k get secret entando-tenants-secret -o jsonpath="{.data.ENTANDO_TENANTS}"`
            })
        )
    })

    test.it('runs validateTenantList passing the primary tenant', async () => {
        const executeProcessStub = sinon
            .stub(ProcessExecutorService, 'executeProcess')
            .callsFake(options => {
                options.outputStream!.write(Buffer.from(entandoTenantsJSONSubsetString).toString('base64'))
                return Promise.resolve(0)
            })

        await MultiTenantsService.validateTenantList(['primary'])

        sinon.assert.calledWith(
            executeProcessStub,
            sinon.match({
                command: `ent k get secret entando-tenants-secret -o jsonpath="{.data.ENTANDO_TENANTS}"`
            })
        )
    })

  test
      .env({ ENTANDO_CLI_DEBUG: 'false' })
      .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(() => {
            return Promise.resolve(1)
        })
        await MultiTenantsService.validateTenantList(['tenant1'])
    })
    .catch(error => {
      expect(error.message).contain('Get entando-tenants-secret failed.')
      expect(error.message).contain('Enable debug mode to see more details')
    })

    .it('runs validateTenantList but throws not found secret error with debug not enabled', () => {
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })

    test
        .env({ ENTANDO_CLI_DEBUG: 'true' })
        .do(async () => {
            sinon
                .stub(ProcessExecutorService, 'executeProcess')
                .callsFake(() => {
                    return Promise.resolve(1)
                })
            await MultiTenantsService.validateTenantList(['tenant1'])
        })
        .catch(error => {
            expect(error.message).contain('Get entando-tenants-secret failed.')
            expect(error.message).not.contain('Enable debug mode to see more details')
        })

        .it('runs validateTenantList but throws not found secret error with debug enabled', () => {
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)
        })


    test
        .do(async () => {
            sinon
                .stub(ProcessExecutorService, 'executeProcess')
                .callsFake(options => {
                    options.outputStream!.write("")
                    return Promise.resolve(0)
                })
            await MultiTenantsService.validateTenantList(['tenant1'])
        })
         .catch(error => {
                 expect(error.message).contain('Get entando-tenants-secret failed')
         })

        .it('runs validateTenantList but throws not found secret error (empty)', () => {
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)
        })

    test
        .do(async () => {
            sinon
                .stub(ProcessExecutorService, 'executeProcess')
                .callsFake(options => {
                    options.outputStream!.write(Buffer.from(entandoTenantsJSONSubsetString).toString('base64'))
                    return Promise.resolve(0)
                })
            await MultiTenantsService.validateTenantList(['test'])
        })
        .catch(error => {
            expect(error.message).contain('Tenant test not found')
        })

        .it('runs validateTenantList but throws tenant not found error', () => {
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)
        })


  test.it('runs getEntandoDeBundleTenants should return the list of tenants', async () => {
    const executeProcessStub = sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .callsFake(options => {
        options.outputStream!.write(entandoDeBundleJSONSubsetString)
        return Promise.resolve(0)
      })

      const tenants = await MultiTenantsService.getEntandoDeBundleTenants("myBundle", "docker://entando/test-repo");

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: `ent k get entandoDeBundle myBundle-c03c36b3 -o jsonpath="{.metadata.annotations.entando\\.org/tenants}"`
      })
    )

    expect(tenants[0]).contain('tenant2')

  })
  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.errorStream!.write("Generic error")
          return Promise.resolve(1)
        })
      await MultiTenantsService.getEntandoDeBundleTenants("myBundle", "docker://entando/test-repo")
    })
    .catch(error => {
      expect(error.message).contain('Generic error')
    })

    .it('runs getEntandoDeBundleTenants throws a generic error', () => {
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })

  test
    .env({ ENTANDO_CLI_DEBUG: 'false' })
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(() => {
          return Promise.resolve(1)
        })
      await MultiTenantsService.getEntandoDeBundleTenants("myBundle", "docker://entando/test-repo");

    })
    .catch(error => {
      expect(error.message).contain('Error retrieving the EndendoDeBundle.')
      expect(error.message).contain('Enable debug mode to see more details.')
    })

    .it('runs getEntandoDeBundleTenants throws an error retrieving the EndendoDeBundle whit debug not enabled', () => {
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })

  test
    .env({ ENTANDO_CLI_DEBUG: 'true' })
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(() => {
          return Promise.resolve(1)
        })
      await MultiTenantsService.getEntandoDeBundleTenants("myBundle", "docker://entando/test-repo");

    })
    .catch(error => {
      expect(error.message).contain('Error retrieving the EndendoDeBundle.')
      expect(error.message).not.contain('Enable debug mode to see more details')
    })

    .it('runs getEntandoDeBundleTenants throws an error retrieving the EndendoDeBundle whit debug enabled', () => {
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })
})
