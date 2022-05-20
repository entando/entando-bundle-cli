import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import InitializerService from '../../src/services/initializer-service'
import { GitService } from '../../src/services/git-service'
import * as sinon from 'sinon'

export default class TempDirHelper {
  sandbox: sinon.SinonSandbox = sinon.createSandbox()

  tmpDir: string = os.tmpdir()

  constructor(dirname: string) {
    before(() => {
      // creating a temporary directory
      this.tmpDir = path.resolve(os.tmpdir(), dirname)
      fs.mkdirSync(this.tmpDir)
    })

    beforeEach(() => {
      // setting the temporary directory as current working directory
      process.chdir(this.tmpDir)
    })

    after(() => {
      // temporary directory cleanup
      fs.rmSync(path.resolve(this.tmpDir), { recursive: true, force: true })
    })
  }

  public createInitializedBundleDir(bundleName: string): void {
    const sandbox = sinon.createSandbox()
    sandbox.stub(GitService.prototype, 'initRepo')

    const initializerService = new InitializerService({
      name: bundleName,
      parentDirectory: this.tmpDir,
      version: '0.0.1'
    })
    initializerService.performBundleInit()

    sandbox.restore()

    const bundleDir = path.resolve(this.tmpDir, bundleName)
    process.chdir(bundleDir)
  }
}
