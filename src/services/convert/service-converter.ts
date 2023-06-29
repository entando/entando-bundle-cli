import path = require('node:path')
import { debugFactory } from '../debug-factory-service'
import { FSService } from '../fs-service'
import { SVC_FOLDER } from '../../paths'
import { SvcService } from '../svc-service'
import { CliUx } from '@oclif/core'

export class ServiceConverter {
  private static debug = debugFactory(ServiceConverter)

  public static convertServiceFiles(
    configBin: string,
    servicePath: string,
    outDir: string
  ): void {
    FSService.copyFolderRecursiveSync(
      servicePath,
      path.join(outDir, SVC_FOLDER)
    )

    const svcService: SvcService = new SvcService(configBin, outDir)
    const userAvailableServices = svcService.getUserAvailableServices()

    for (const svc of userAvailableServices) {
      CliUx.ux.action.start(`Enabling service ${svc}`)
      svcService.enableService(svc)
      CliUx.ux.action.stop()
    }
  }
}
