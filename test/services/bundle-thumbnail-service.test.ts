import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as sinon from 'sinon'
import * as path from 'node:path'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import {
  BundleThumbnailService,
  ThumbnailStatusMessage
} from '../../src/services/bundle-thumbnail-service'

describe('bundle thumbnail service', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let bundleDir: string
  let stubExistsSync: sinon.SinonStub

  before(() => {
    bundleDir = path.resolve(tempDirHelper.tmpDir, 'test-bundle')
    fs.mkdirSync(bundleDir, { recursive: true })
    fs.writeFileSync(`${bundleDir}/thumbnail.png`, 'this is a thumbnail')
  })

  beforeEach(() => {
    process.chdir(bundleDir)
    stubExistsSync = sinon.stub(fs, 'existsSync').returns(true)
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .stub(fs, 'statSync', sinon.stub().returns({ size: 47_000 }))
    .stub(fs, 'readFileSync', sinon.stub().returns('string_here'))
    .stub(
      Buffer,
      'from',
      sinon.stub().returns({ toString: () => 'base64_string_here' })
    )
    .it('processThumbnail method successful', () => {
      const thumbnailService = new BundleThumbnailService()
      thumbnailService.processThumbnail()
      const thumbnail = thumbnailService.getThumbnailInfo()
      sinon.assert.called(stubExistsSync)
      expect(thumbnail).to.haveOwnProperty('path')
      expect(thumbnail.path).to.contain(`${bundleDir}/thumbnail.png`)
      expect(thumbnail).to.deep.contains({
        size: 47_000 / 1024,
        status: ThumbnailStatusMessage.OK,
        base64: 'data:image/png;base64,base64_string_here'
      })
    })

  test
    .stub(fs, 'statSync', sinon.stub().returns({ size: 120_000 }))
    .stub(fs, 'readFileSync', sinon.stub().returns('string_here'))
    .it(
      'processThumbnail method reads over the limit thumbnail filesize',
      () => {
        const thumbnailService = new BundleThumbnailService()
        thumbnailService.processThumbnail()
        const thumbnail = thumbnailService.getThumbnailInfo()
        expect(thumbnail).to.haveOwnProperty('path')
        expect(thumbnail.path).to.contain(`${bundleDir}/thumbnail.png`)
        expect(thumbnail).to.deep.contains({
          size: 120_000 / 1024,
          status: ThumbnailStatusMessage.FILESIZE_EXCEEDED,
          base64: ''
        })
      }
    )

  test
    .stub(fs, 'existsSync', sinon.stub().returns(false))
    .it('processThumbnail method cannot find thumbnail', () => {
      const thumbnailService = new BundleThumbnailService()
      thumbnailService.processThumbnail()
      const thumbnail = thumbnailService.getThumbnailInfo()
      expect(thumbnail).to.haveOwnProperty('path')
      expect(thumbnail).to.deep.eq({
        path: '',
        size: 0,
        status: ThumbnailStatusMessage.NO_THUMBNAIL,
        base64: ''
      })
    })
})
