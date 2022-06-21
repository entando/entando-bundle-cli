import { WidgetContextParam } from './bundle-descriptor'

export interface MfeConfig {
  systemParams?: {
    api?: {
      [apiClaim: string]: {
        url: string
      }
    }
  }
  contextParams?: Partial<Record<WidgetContextParam, string>>
  params?: Record<string, string>
}
