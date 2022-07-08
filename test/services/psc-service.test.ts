import { expect } from '@oclif/test'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { DESCRIPTORS_OUTPUT_FOLDER, PSC_FOLDER } from '../../src/paths'
import { PSCService } from '../../src/services/psc-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

describe('PSC Service', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  it('Detects invalid folder', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir(
      'test-invalid-folder'
    )
    const pscFolder = path.resolve(bundleDir, PSC_FOLDER)
    const pageModelsFolder = path.join(pscFolder, 'pageModels')
    fs.mkdirSync(pageModelsFolder)
    const invalidFolder = path.join(pscFolder, 'invalid')
    fs.mkdirSync(invalidFolder)

    const invalidFolders = PSCService.checkInvalidFolders()

    expect(invalidFolders).deep.eq(['invalid'])
  })

  it('Copies PSC files', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir('test-psc-copy')
    const pscFolder = path.resolve(bundleDir, PSC_FOLDER)

    const pageModelsFolder = path.join(pscFolder, 'pageModels')
    fs.mkdirSync(pageModelsFolder)
    const pageModelDescriptor = path.join(
      pageModelsFolder,
      'my-page-model-descriptor.yaml'
    )
    const pageModelFtl = path.join(pageModelsFolder, 'my-page-model.ftl')
    fs.writeFileSync(pageModelDescriptor, '')
    fs.writeFileSync(pageModelFtl, '')

    const pageModelSubFolder = path.join(pageModelsFolder, 'a', 'b')
    fs.mkdirSync(pageModelSubFolder, { recursive: true })
    fs.writeFileSync(path.join(pageModelSubFolder, 'test.txt'), '')

    const groupsFolder = path.join(pscFolder, 'groups')
    fs.mkdirSync(groupsFolder)
    fs.writeFileSync(path.join(groupsFolder, 'my-group-1-descriptor.yml'), '')
    fs.writeFileSync(path.join(groupsFolder, 'my-group-2-descriptor.yml'), '')

    const invalidFolder = path.join(pscFolder, 'invalid')
    fs.mkdirSync(invalidFolder)
    fs.writeFileSync(path.join(invalidFolder, 'my-descriptor.yaml'), '')

    const descriptors = PSCService.copyPSCFiles()

    expect(descriptors.groups!.length).eq(2)
    expect(descriptors.groups).includes('groups/my-group-1-descriptor.yml')
    expect(descriptors.groups).includes('groups/my-group-2-descriptor.yml')
    expect(descriptors.pageModels).deep.eq([
      'pageModels/my-page-model-descriptor.yaml'
    ])
    expect((descriptors as any).invalid).undefined

    verifyCopy('pageModels', 'my-page-model-descriptor.yaml')
    verifyCopy('pageModels', 'my-page-model.ftl')
    verifyCopy('pageModels', 'a', 'b', 'test.txt')
  })

  it('Handles unexisting platform folder', () => {
    tempDirHelper.createUninitializedBundleDir()
    PSCService.copyPSCFiles()
  })
})

function verifyCopy(...source: string[]) {
  const copiedFile = path.join(...DESCRIPTORS_OUTPUT_FOLDER, ...source)
  expect(fs.existsSync(copiedFile), copiedFile + ' is missing').true
}
