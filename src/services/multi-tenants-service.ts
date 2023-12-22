import { CLIError } from '@oclif/errors'
import { debugFactory } from './debug-factory-service'
import { ProcessExecutorService } from './process-executor-service'
import { InMemoryWritable, isDebugEnabled} from '../utils'
import { PRIMARY_TENANT } from '../models/bundle-descriptor-constraints'
import { BundleService } from './bundle-service'

export class MultiTenantsService {
  private static debug = debugFactory(MultiTenantsService)

  private static readonly enableDebugMsg = 'Enable debug mode to see more details.';
  private static readonly getSecretErrMsg = 'Get entando-tenants-secret failed.'
  private static readonly getEntandoDeBundleErrMsg = "Error retrieving the EndendoDeBundle."
  private static errorTenantNotFound = (tenantCode: string) => `Tenant ${tenantCode} not found`;

  public static async getSecretTenantCodes(): Promise<string[]> {
    const debugEnabled = isDebugEnabled()

    MultiTenantsService.debug(`get tenant codes`)
    const outputStream = new InMemoryWritable()
    const errorStream = new InMemoryWritable()

    const result = await ProcessExecutorService.executeProcess({
      command: `ent k get secret entando-tenants-secret -o jsonpath="{.data.ENTANDO_TENANTS}"`,
      outputStream,
      errorStream
    })
    if ((result !== 0) || (outputStream.data === '') ){
      const errorMsg= debugEnabled ? this.getSecretErrMsg : `${this.getSecretErrMsg} ${this.enableDebugMsg}`
      throw new CLIError(
        errorMsg
      )
    }

    const entandoTenantsSecret = Buffer.from(outputStream.data.trim(), 'base64').toString()
    return JSON.parse(entandoTenantsSecret).map((item: { tenantCode: string; }) => item.tenantCode )
  }

  public static async validateTenantList(tenants: string[]): Promise<void> {
    const tenantCodes = await this.getSecretTenantCodes();
    for (const tenant of tenants) {
      if (tenant !== PRIMARY_TENANT) {
        const find = tenantCodes.find(item => item === tenant)
        if (find === undefined) {
          throw new CLIError(
            this.errorTenantNotFound(tenant)
          )
        }
      }
    }
  }

  public static async getEntandoDeBundleTenants(bundleName:string ,image: string): Promise<string[]> {
    const debugEnabled = isDebugEnabled()
    const bundleId = BundleService.generateBundleId(image)
    let deployedTenants:string[] = []
    MultiTenantsService.debug(`get deployed tenant codes`)

    const outputStream = new InMemoryWritable()
    const errorStream = new InMemoryWritable()

    const result = await ProcessExecutorService.executeProcess({
      command: `ent k get entandoDeBundle ${bundleName}-${bundleId} -o jsonpath="{.metadata.annotations.entando\\.org/tenants}"`,
      outputStream,
      errorStream
    })

    if ((result !== 0) && !errorStream.data.includes(`entandodebundles.entando.org "${bundleName}-${bundleId}" not found`)) {
      const errorMsg = debugEnabled ? this.getEntandoDeBundleErrMsg : `${this.getEntandoDeBundleErrMsg} ${this.enableDebugMsg}`
      throw new CLIError(
        errorStream.data.trim() || errorMsg
      )
      }

    if (outputStream.data.trim().length>0) {
      deployedTenants = outputStream.data.trim().split(",")
    }

    return deployedTenants;
  }
}
