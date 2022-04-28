import { expect, test } from "@oclif/test"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import * as sinon from "sinon"
import { BundleDescriptor } from "../../src/models/bundle-descriptor"
import * as cp from "node:child_process"

describe("init", () => {
  let tmpDir: string

  before(() => {
    // creating a temporary directory
    tmpDir = path.resolve(os.tmpdir(), "bundle-cli-init-test")
    fs.mkdirSync(tmpDir)

    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tmpDir, "existing-bundle"))

    // setting the temporary directory as current working directory
    process.chdir(tmpDir)
  })

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .stub(cp, "execSync", sinon.stub().returns("Initialized git repo"))
    .command(["init", "bundle-with-version", "--version=0.0.2"])
    .it("runs init bundle-with-version --version=0.0.2", () => {
      const bundleName = "bundle-with-version"

      checkFoldersStructure(bundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq("0.0.2")
    })

  test
    .stub(cp, "execSync", sinon.stub().returns("Initialized git repo"))
    .command(["init", "bundle-no-version"])
    .it("runs init bundle-no-version", () => {
      const bundleName = "bundle-no-version"

      checkFoldersStructure(bundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq("0.0.1")
    })

  test
    .stderr()
    .command(["init"])
    .catch(error => {
      expect(error.message).to.contain("required")
    })
    .it("validates required argument")

  test
    .stderr()
    .command(["init", "existing-bundle"])
    .catch(error => {
      expect(error.message).to.contain("existing-bundle already exists")
    })
    .it("exits if bundle folder already exists")

  test
    .stderr()
    .command(["init", "invalid name"])
    .catch(error => {
      expect(error.message).to.contain("not a valid bundle name")
    })
    .it("validates bundle name")

  test
    .stderr()
    .stub(
      fs,
      "accessSync",
      sinon.stub().throws({ stderr: "permission denied" })
    )
    .command(["init", "bundle-no-permission"])
    .catch(error => {
      expect(error.message).to.contain("is not writable")
    })
    .it("handles parent directory not writable")

  test
    .stderr()
    .stub(cp, "execSync", sinon.stub().throws({ stderr: "git init error" }))
    .command(["init", "bundle-no-git"])
    .catch(error => {
      expect(error.message).to.contain("git init error")
    })
    .it("handles git command error")

  test
    .stderr()
    .stub(cp, "execSync", sinon.stub().throws(new Error("exec error")))
    .command(["init", "bundle-exec-error"])
    .catch(error => {
      expect(error.message).to.contain("exec error")
    })
    .it("handles exec error")

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, ".ent")
    checkBundleFile(bundleName, "bundle.json")
    checkBundleFile(bundleName, "microservices")
    checkBundleFile(bundleName, "microfrontends")
    checkBundleFile(bundleName, "Dockerfile")
    checkBundleFile(bundleName, ".gitignore")
  }

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(tmpDir, bundleName, ...pathSegments)
    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  }

  function parseBundleDescriptor(bundleName: string): BundleDescriptor {
    return JSON.parse(
      fs.readFileSync(path.resolve(tmpDir, bundleName, "bundle.json"), "utf-8")
    ) as BundleDescriptor
  }
})
