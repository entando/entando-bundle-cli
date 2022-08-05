import { expect } from '@oclif/test'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  GITKEEP_FILE,
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER
} from '../../src/paths'
import { BundleService } from '../../src/services/bundle-service'
import { DEFAULT_DOCKER_REGISTRY } from '../../src/services/docker-service'
import { DOCKER_PREFIX } from '../../src/models/bundle-descriptor-constraints'

describe('BundleService', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  it('Creates missing components folders', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir('no-components')

    fs.rmdirSync(path.join(bundleDir, PSC_FOLDER), { recursive: true })
    fs.rmdirSync(path.join(bundleDir, MICROSERVICES_FOLDER), {
      recursive: true
    })
    fs.rmdirSync(path.join(bundleDir, MICROFRONTENDS_FOLDER), {
      recursive: true
    })

    BundleService.isValidBundleProject()

    expect(fs.existsSync(path.join(bundleDir, PSC_FOLDER, GITKEEP_FILE))).true
    expect(
      fs.existsSync(path.join(bundleDir, MICROSERVICES_FOLDER, GITKEEP_FILE))
    ).true
    expect(
      fs.existsSync(path.join(bundleDir, MICROFRONTENDS_FOLDER, GITKEEP_FILE))
    ).true
  })

  it('Generates bundleId when bundle name has no URL scheme', () => {
    const bundleId = BundleService.generateBundleId(
      DEFAULT_DOCKER_REGISTRY + '/entando/test-bundle'
    )
    expect(bundleId).eq('c7113057')
  })

  it('Generates bundleId removing URL scheme', () => {
    const bundleId = BundleService.generateBundleId(
      DOCKER_PREFIX + DEFAULT_DOCKER_REGISTRY + '/entando/test-bundle'
    )
    expect(bundleId).eq('c7113057')
  })

  it('Generates bundleId adding the default registry', () => {
    const bundleId = BundleService.generateBundleId('entando/test-bundle')
    expect(bundleId).eq('c7113057')
  })
})
