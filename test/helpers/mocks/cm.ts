import * as sinon from 'sinon'

export const MOCK_CM_URL = 'http://test-cm.eng-entando.com'
export const MOCK_CM_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSl'

export const MOCK_BUNDLES = [
  {
    id: '479195a1-670d-4191-a838-098c8e19640e',
    bundleId: '1aafa497',
    bundleName: 'myapp2mysql',
    componentTypes: ['widget', 'plugin', 'bundle'],
    installed: true,
    publicationUrl: 'docker://docker.io/gigiozzz/myapp2mysql-bundle'
  }
]

export const MOCK_BUNDLE_PLUGINS = [
  {
    id: 'f90100c6-ec40-4041-a46b-28b40a12ff7b',
    bundleId: '1aafa497',
    pluginId: 'c7b80698',
    pluginName: 'lcorsettientando-myapp-2-mysql',
    pluginCode: 'pn-1aafa497-c7b80698-lcorsettientando-myapp-2-mysql',
    ingressPath: '/lcorsettientando/myapp-2-mysql',
    roles: ['myapp2mysql-admin', 'point-2-d-admin']
  }
]

export function setCmEnv(): void {
  sinon.stub(process, 'env').value({
    ...process.env,
    ENTANDO_CLI_ECR_URL: MOCK_CM_URL,
    ENTANDO_CLI_ECR_TOKEN: MOCK_CM_TOKEN
  })
}
