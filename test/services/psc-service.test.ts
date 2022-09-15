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
    const invalidFile = path.join(pscFolder, 'invalid-file')
    fs.writeFileSync(invalidFile, '')
    const invalidFolder = path.join(pscFolder, 'invalid-folder')
    fs.mkdirSync(invalidFolder)

    const invalidFiles = PSCService.checkInvalidFiles()

    expect(invalidFiles.length).eq(2)
    expect(invalidFiles).includes('invalid-file', 'invalid-folder')
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

    const assetsFolder = path.join(pscFolder, 'assets')
    fs.mkdirSync(assetsFolder)

    const asset36Folder = path.join(assetsFolder, '36')
    fs.mkdirSync(asset36Folder)
    fs.writeFileSync(path.join(asset36Folder, '36-descriptor.yaml'), '')

    const asset42Folder = path.join(assetsFolder, '42')
    fs.mkdirSync(asset42Folder)
    fs.writeFileSync(path.join(asset42Folder, '42-descriptor.yaml'), '')
    fs.writeFileSync(path.join(asset42Folder, '42.jpg'), '')

    const invalidFolder = path.join(pscFolder, 'invalid')
    fs.mkdirSync(invalidFolder)
    fs.writeFileSync(path.join(invalidFolder, 'my-descriptor.yaml'), '')

    const widgetsFolder = path.join(pscFolder, 'widgets')
    fs.mkdirSync(widgetsFolder)
    fs.writeFileSync(path.join(widgetsFolder, 'simple-widget.yaml'), '')

    const resourcesFolder = path.join(pscFolder, 'resources')
    fs.mkdirSync(resourcesFolder)
    fs.writeFileSync(path.join(resourcesFolder, 'my-style.css'), '')

    const descriptors = PSCService.copyPSCFiles()

    expect(descriptors.groups!.length).eq(2)
    expect(descriptors.groups).includes('groups/my-group-1-descriptor.yml')
    expect(descriptors.groups).includes('groups/my-group-2-descriptor.yml')
    expect(descriptors.pageModels).deep.eq([
      'pageModels/my-page-model-descriptor.yaml'
    ])
    expect(descriptors.assets!.length).eq(2)
    expect(descriptors.assets).includes('assets/36/36-descriptor.yaml')
    expect(descriptors.assets).includes('assets/42/42-descriptor.yaml')
    expect((descriptors as any).invalid).undefined

    verifyCopy('pageModels', 'my-page-model-descriptor.yaml')
    verifyCopy('pageModels', 'my-page-model.ftl')
    verifyCopy('pageModels', 'a', 'b', 'test.txt')
    verifyCopy('assets', '36', '36-descriptor.yaml')
    verifyCopy('assets', '42', '42-descriptor.yaml')
    verifyCopy('assets', '42', '42.jpg')
    verifyCopy('widgets', 'simple-widget.yaml')
    verifyCopy('resources', 'my-style.css')
  })
})

function verifyCopy(...source: string[]) {
  const copiedFile = path.join(...DESCRIPTORS_OUTPUT_FOLDER, ...source)
  expect(fs.existsSync(copiedFile), copiedFile + ' is missing').true
}
