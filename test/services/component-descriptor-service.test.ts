import { expect, test } from '@oclif/test'
import { ComponentType, MicroFrontendStack } from '../../src/models/component'
import { ComponentDescriptorService } from '../../src/services/component-descriptor-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

describe('ComponentDescriptorService', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  test
    .do(() => {
      tempDirHelper.createUninitializedBundleDir('mfe-no-version')
      const componentDescriptorService = new ComponentDescriptorService()
      componentDescriptorService.getComponentVersion({
        name: 'mfe-no-version',
        type: ComponentType.MICROFRONTEND,
        stack: MicroFrontendStack.Angular
      })
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to determine version for component mfe-no-version'
      )
    })
    .it('Throw error if component version not found')
})
