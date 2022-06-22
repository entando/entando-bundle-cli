export interface MfeConfig {
  systemParams?: {
    api?: {
      [apiClaim: string]: {
        url: string
      }
    }
  }
  contextParams?: Record<string, string>
  params?: Record<string, string>
}
