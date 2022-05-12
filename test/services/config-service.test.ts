import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  CONFIG_FOLDER,
  RESOURCES_FOLDER,
  DEFAULT_CONFIG_FILE,
  CONFIG_FILE,
  TMP_TEST_FOLDER
} from '../../src/paths'
import ConfigService from '../../src/services/config-service'

const configService = new ConfigService()

let tmpDir: string

beforeEach(() => {
  tmpDir = path.resolve(os.tmpdir(), TMP_TEST_FOLDER)

  fs.mkdirSync(tmpDir)
  fs.mkdirSync(path.join(tmpDir, CONFIG_FOLDER))

  // setting the temporary directory as current working directory
  process.chdir(tmpDir)

  // create config from template file
  const defaultConfig = fs.readFileSync(
    path.resolve(__dirname, '..', '..', RESOURCES_FOLDER, DEFAULT_CONFIG_FILE),
    {
      encoding: 'utf-8'
    }
  )

  const defaultConfigParsed = JSON.parse(defaultConfig)

  const filePath = path.join(tmpDir, CONFIG_FOLDER)

  fs.writeFileSync(
    path.join(filePath, CONFIG_FILE),
    JSON.stringify(defaultConfigParsed, null, 2),
    'utf8'
  )
})

afterEach(() => {
  // temporary directory cleanup
  fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
})

describe('config-service', () => {
  test.it('get properties', () => {
    expect(configService.getProperty('key1')).to.be.eq('val1')
    expect(configService.getProperty('key2')).to.be.eq('val2')
  })

  test.it('add a property', () => {
    const key = 'test-key'
    const value = 'test-value'
    configService.addProperty(key, value)
    expect(configService.getProperty('key1')).to.be.eq('val1')
    expect(configService.getProperty('key2')).to.be.eq('val2')
    expect(configService.getProperty(key)).to.be.eq(value)
  })

  test.it('add a property that already exists should throw an error', () => {
    const key = 'key1'
    const value = 'value1'
    expect(() => configService.addProperty(key, value)).to.throw()
  })

  test.it('delete a property', () => {
    const key = 'key1'
    configService.deleteProperty(key)
    expect(() => configService.getProperty(key)).to.throw()
    expect(configService.getProperty('key2')).to.be.eq('val2')
  })

  test.it('delete a property that not exists should throw an error', () => {
    const key = 'key3'
    expect(() => configService.deleteProperty(key)).to.throw()
  })

  test.it('get a property that not exists should throw an error', () => {
    const key = 'keyA'
    expect(() => configService.getProperty(key)).to.throw()
  })

  test.it('update a property', () => {
    const key = 'key1'
    const value = 'test-value'
    configService.updateProperty(key, value)
    expect(configService.getProperty(key)).to.be.eq(value)
  })

  test.it('update a property that not exists should throw an error', () => {
    const key = 'key3'
    const value = 'test-value'
    expect(() => configService.updateProperty(key, value)).to.throw()
  })
})
