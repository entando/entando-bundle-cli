import { BundleDescriptor } from '../models/bundle-descriptor'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { FSService } from './fs-service'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../paths'
import { CLIError } from '@oclif/errors'
import { ConstraintsValidatorService } from './constraints-validator-service'
import { BUNDLE_DESCRIPTOR_CONSTRAINTS } from '../models/bundle-descriptor-constraints'
import { ComponentService } from './component-service'

export const MISSING_DESCRIPTOR_ERROR =
  'Bundle descriptor not found. Is this an initialized Bundle project?'

type MandatoryBundleFields = { name: string; version: string; type: string }

export class BundleDescriptorService {
  private readonly bundleFilePath: string

  constructor(bundleDirectory: string = process.cwd()) {
    this.bundleFilePath = path.resolve(
      bundleDirectory,
      BUNDLE_DESCRIPTOR_FILE_NAME
    )
  }

  public createBundleDescriptor(
    fieldsToAdd: Partial<BundleDescriptor> & MandatoryBundleFields
  ): void {
    const defaultValues = {
      microservices: [],
      microfrontends: [],
      svc: []
    }
    const bundleDescriptor = { ...defaultValues, ...fieldsToAdd }
    this.writeBundleDescriptor(bundleDescriptor)
  }

  public getBundleDescriptor(): BundleDescriptor {
    return JSON.parse(
      fs.readFileSync(this.bundleFilePath, 'utf-8')
    ) as BundleDescriptor
  }

  public writeBundleDescriptor(bundleDescriptor: BundleDescriptor): void {
    FSService.writeJSON(this.bundleFilePath, bundleDescriptor)
  }

  public writeDescriptor(msg: string): void {
    fs.writeFileSync(this.bundleFilePath, msg)
  }

  public validateBundleDescriptor(): BundleDescriptor {
    if (!fs.existsSync(this.bundleFilePath)) {
      throw new CLIError(MISSING_DESCRIPTOR_ERROR)
    }

    const descriptorFileContent = fs.readFileSync(this.bundleFilePath, 'utf-8')
    const parsedDescriptor = this.parseData(descriptorFileContent)

    try {
      const bundleDescriptor =
        ConstraintsValidatorService.validateObjectConstraints(
          parsedDescriptor,
          BUNDLE_DESCRIPTOR_CONSTRAINTS
        )
      const componentService = new ComponentService()
      componentService.checkDuplicatedComponentNames()
      componentService.checkConfigMfes()
      return bundleDescriptor
    } catch (error) {
      throw new CLIError(
        BUNDLE_DESCRIPTOR_FILE_NAME +
          ' is not valid.\n' +
          (error as Error).message
      )
    }
  }

  private parseData(descriptorFileContent: string): any {
    try {
      const parsedDescriptor = JSON.parse(descriptorFileContent)
      return parsedDescriptor
    } catch (error) {
      if (error instanceof SyntaxError) {
        const matchPositionInfo = error.message.match(/position +\d+/m)

        if (matchPositionInfo === null) {
          throw new CLIError(
            BUNDLE_DESCRIPTOR_FILE_NAME +
              ' is not valid.\n' +
              (error as Error).message
          )
        }

        const indexCharError = Number(matchPositionInfo[0].split(' ').pop())
        const infoError = this.displayError(
          indexCharError,
          descriptorFileContent
        )
        throw new CLIError(infoError)
      } else {
        throw new CLIError(
          BUNDLE_DESCRIPTOR_FILE_NAME +
            ' is not valid.\n' +
            (error as Error).message
        )
      }
    }
  }

  private displayError(indexCharPosition: number, text: string): string {
    const tmp = text.slice(0, indexCharPosition)
    const lineNumber = tmp.split('\n').length - 1

    if (text.includes('\n') === false) {
      return (
        BUNDLE_DESCRIPTOR_FILE_NAME +
        ' is not valid.\n' +
        'Malformed JSON at line ' +
        lineNumber +
        ' and column ' +
        indexCharPosition
      )
    }

    const textArray = text.split('\n')
    const toReplace = textArray[lineNumber]
    const replaced = text.replace(toReplace, `>>>>>> ${toReplace}`)

    const displayError = replaced
      .split('\n')
      .slice(lineNumber > 0 ? lineNumber - 1 : 0, lineNumber + 2)
      .join('\n')

    return (
      BUNDLE_DESCRIPTOR_FILE_NAME +
      ' is not valid.\n' +
      'Malformed JSON at line ' +
      lineNumber +
      '\n' +
      displayError
    )
  }
}
