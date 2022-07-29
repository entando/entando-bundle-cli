import * as path from 'node:path'
import * as fs from 'node:fs'
import { CLIError } from '@oclif/errors'
import {
  AppBuilderMicroFrontend,
  BundleDescriptor,
  MicroFrontend,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType
} from '../models/bundle-descriptor'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { MICROFRONTENDS_FOLDER } from '../paths'
import { ComponentType } from '../models/component'
import { ComponentService } from './component-service'
import {
  ALLOWED_NAME_REGEXP,
  INVALID_NAME_MESSAGE,
  MAX_NAME_LENGTH
} from '../models/bundle-descriptor-constraints'
import { FSService } from './fs-service'

export const PREFIX_INTERNAL_WIDGET = 'global:'
export const DEFAULT_MFE_BUILD_FOLDER = 'build'
const DEFAULT_PUBLIC_FOLDER = 'public'
const DEFAULT_GROUP = 'free'

export class MicroFrontendService {
  private readonly microfrontendsPath: string
  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentService: ComponentService

  constructor() {
    this.microfrontendsPath = path.resolve(process.cwd(), MICROFRONTENDS_FOLDER)
    this.bundleDescriptorService = new BundleDescriptorService()
    this.componentService = new ComponentService()
  }

  public addMicroFrontend(mfe: MicroFrontend): void {
    const componentService = new ComponentService()

    if (componentService.componentExists(mfe.name)) {
      throw new CLIError(
        `A component (microservice or micro frontend) with name ${mfe.name} already exists`
      )
    }

    if (!ALLOWED_NAME_REGEXP.test(mfe.name)) {
      throw new CLIError(
        `'${mfe.name}' is not a valid Micro Frontend name. ${INVALID_NAME_MESSAGE}`
      )
    }

    if (mfe.name.length > MAX_NAME_LENGTH) {
      throw new CLIError(
        `Micro Frontend name is too long. The maximum length is ${MAX_NAME_LENGTH}`
      )
    }

    FSService.removeGitKeepFile(this.microfrontendsPath)
    this.createMicroFrontendDirectory(mfe.name)

    this.addMicroFrontendDescriptor({
      ...mfe,
      group: DEFAULT_GROUP,
      publicFolder: DEFAULT_PUBLIC_FOLDER,
      ...(mfe.type === MicroFrontendType.Widget && {
        titles: this.getDefaultTitles(mfe.name)
      }),
      ...(mfe.type === MicroFrontendType.AppBuilder &&
        this.getAppBuilderFields(mfe))
    })
  }

  public getMicroFrontend(mfeName: string): MicroFrontend {
    const mfe = this.findMicroFrontend(mfeName)

    if (!mfe) {
      throw new CLIError(
        `${mfeName} does not exist in the microfrontends section of the Bundle descriptor`
      )
    }

    return mfe
  }

  public findMicroFrontend(mfeName: string): MicroFrontend | undefined {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    return microfrontends.find(({ name }) => name === mfeName)
  }

  private isConfigMfeSiblingWidget(mfe: MicroFrontend): boolean {
    return (
      'configMfe' in mfe &&
      mfe.configMfe !== undefined &&
      mfe.configMfe.slice(0, 9) !== PREFIX_INTERNAL_WIDGET
    )
  }

  public findWidgetConfigReferences(mfeName: string): MicroFrontend[] {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends: allMfes } = bundleDescriptor
    const allMfesWithTypes = allMfes.map(({ name, type, ...others }) => ({
      name,
      type,
      configMfe: 'configMfe' in others ? others.configMfe : undefined
    }))
    return allMfes.filter(
      mfe =>
        this.isConfigMfeSiblingWidget(mfe) &&
        allMfesWithTypes.findIndex(
          ({ type, configMfe }) =>
            mfeName === configMfe && type !== MicroFrontendType.WidgetConfig
        ) !== -1
    )
  }

  public removeMicroFrontend(mfeName: string): void {
    const mfe: MicroFrontend = this.getMicroFrontend(mfeName)

    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: bundleDescriptor.microfrontends.filter(
        ({ name }) => name !== mfe.name
      )
    }

    this.removeMicroFrontendDirectory(mfeName)

    if (updatedBundleDescriptor.microfrontends.length === 0) {
      FSService.addGitKeepFile(this.microfrontendsPath)
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)

    this.componentService.removeOutputDescriptor({
      ...mfe,
      type: ComponentType.MICROFRONTEND
    })
  }

  public getPublicFolderPath(mfeName: string): string {
    const mfe: MicroFrontend = this.getMicroFrontend(mfeName)

    return path.resolve(
      this.microfrontendsPath,
      mfeName,
      mfe.publicFolder ?? DEFAULT_PUBLIC_FOLDER
    )
  }

  private createMicroFrontendDirectory(name: string) {
    const newMfeDir: string = path.resolve(this.microfrontendsPath, name)

    if (fs.existsSync(newMfeDir)) {
      throw new CLIError(`Directory ${newMfeDir} already exists`)
    }

    fs.mkdirSync(newMfeDir)
  }

  private removeMicroFrontendDirectory(name: string) {
    const mfedir: string = path.resolve(this.microfrontendsPath, name)

    if (!fs.existsSync(mfedir)) {
      throw new CLIError(`Directory ${mfedir} does not exist`)
    }

    fs.rmSync(mfedir, { recursive: true })
  }

  private addMicroFrontendDescriptor(mfe: MicroFrontend): void {
    const bundleDescriptor: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()
    const { microfrontends } = bundleDescriptor

    const updatedBundleDescriptor: BundleDescriptor = {
      ...bundleDescriptor,
      microfrontends: [...microfrontends, mfe]
    }

    this.bundleDescriptorService.writeBundleDescriptor(updatedBundleDescriptor)
  }

  private getDefaultTitles(mfeName: string): { [lang: string]: string } {
    return { en: mfeName, it: mfeName }
  }

  private getAppBuilderFields(mfe: AppBuilderMicroFrontend):
    | {
        slot: MicroFrontendAppBuilderSlot.Content
        paths: string[]
      }
    | {
        slot: Exclude<
          MicroFrontendAppBuilderSlot,
          MicroFrontendAppBuilderSlot.Content
        >
      } {
    const slot: MicroFrontendAppBuilderSlot =
      mfe.slot || MicroFrontendAppBuilderSlot.Content

    if (slot === MicroFrontendAppBuilderSlot.Content) return { slot, paths: [] }

    return { slot }
  }
}
