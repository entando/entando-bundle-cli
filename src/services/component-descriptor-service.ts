import { ComponentType } from '../models/component'

export class ComponentDescriptorService {
  // TODO: implement proper way of getting a component's version
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentVersion(name: string, type: ComponentType): string {
    return '0.0.1'
  }
}
