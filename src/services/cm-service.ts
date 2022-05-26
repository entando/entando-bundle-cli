export class CMService {
  public getBundleMicroserviceUrl(
    bundleId: string,
    serviceName: string
  ): string {
    // eslint-disable-next-line no-warning-comments
    // TODO: ENG-3708
    return `http://mock-${bundleId}-${serviceName}`
  }
}
