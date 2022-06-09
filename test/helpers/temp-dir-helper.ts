import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { InitializerService } from '../../src/services/initializer-service'
import { GitService } from '../../src/services/git-service'
import * as sinon from 'sinon'
import { ComponentType } from '../../dist/models/component'
import { Component } from '../../src/models/component'
import { ComponentService } from '../../dist/services/component-service'

/**
 * Helper class that can be used in tests to generate a temporary directory that
 * is automatically removed at the end of the tests. A unique directory name is
 * generated for each test file. The helper also provides a function to generate
 * already initialized bundle directories inside the test temporary directory.
 */
export class TempDirHelper {
  tmpDir: string = os.tmpdir()

  constructor(testFile: string) {
    // generating test temporary directory name
    let tempDirName = 'entando-bundle-cli-'
    const testParentDir = path.basename(path.dirname(testFile))
    if (testParentDir !== 'test') {
      // adding test parent directory, to avoid collision between ms-add and mfe-add and similar cases
      tempDirName += testParentDir + '-'
    }

    tempDirName += path.basename(testFile).replace('.test.ts', '-test')

    before(() => {
      // defining temporary directory for test
      this.tmpDir = path.resolve(os.tmpdir(), tempDirName)
      // removing the temporary directory if it already exists (this could happen if a previous
      // test was forcibly stopped using Ctrl+C and it didn't clean its folder properly)
      this.rmTmpDir()
      // creating a new temporary directory
      fs.mkdirSync(this.tmpDir)
    })

    beforeEach(() => {
      // setting the temporary directory as current working directory
      process.chdir(this.tmpDir)
    })

    after(() => {
      // prevents locking of temporary directory so it can be cleaned up
      process.chdir(path.resolve(this.tmpDir, '..'))
      // temporary directory cleanup
      this.rmTmpDir()
    })
  }

  private rmTmpDir() {
    fs.rmSync(path.resolve(this.tmpDir), { recursive: true, force: true })
  }

  public createInitializedBundleDir(bundleName = 'test-bundle'): string {
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
    return bundleDir
  }

  public createUninitializedBundleDir(dirName = 'empty-dir'): string {
    const emtpyDir = path.resolve(this.tmpDir, dirName)
    fs.mkdirSync(emtpyDir)
    process.chdir(emtpyDir)
    return emtpyDir
  }

  public static createComponentFolder(
    component: Component<ComponentType>
  ): void {
    fs.mkdirSync(ComponentService.getComponentPath(component), {
      recursive: true
    })
  }

  public static createComponentsFolders(
    components: Array<Component<ComponentType>>
  ): void {
    for (const comp of components) {
      this.createComponentFolder(comp)
    }
  }
}
