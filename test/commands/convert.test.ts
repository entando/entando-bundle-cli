import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import {
    CONFIG_FOLDER,
    CONFIG_FILE,
    BUNDLE_DESCRIPTOR_FILE_NAME,
    SVC_FOLDER,
    GITKEEP_FILE,
    MICROFRONTENDS_FOLDER,
    MICROSERVICES_FOLDER,
    PSC_FOLDER,
    LOGS_FOLDER
} from '../../src/paths'
import { expect, test } from '@oclif/test'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import { YamlBundleDescriptorV1 } from "../../src/models/yaml-bundle-descriptor"
import * as YAML from 'yaml'

describe('convert', () => {
    const tempDirHelper = new TempDirHelper(__filename)
    const testFolder = path.dirname(__dirname)
    const descriptorV1FilePath = path.resolve(testFolder, "resources/bundle-sample/descriptor.yaml")
    let descV1Json: YamlBundleDescriptorV1;

    beforeEach(() => {
        // creating a subfolder for testing the bundle-sample conversion
        fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, 'bundle-sample'))
        // copy descriptor v1 in tmpDir
        fs.copyFileSync(
            descriptorV1FilePath,
            path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'descriptor.yaml')
        )
        descV1Json = YAML.parse(fs.readFileSync(descriptorV1FilePath, 'utf-8'))
    })

    afterEach(() => {
        const filesToRemove = ['bundle-sample', 'bundle-sample-v5']
        filesToRemove.map(fileName => {
            return fs.rmSync(path.resolve(tempDirHelper.tmpDir, fileName), {
                recursive: true,
                force: true
            })
        })
    })

    after(() => {
        fs.rmSync(path.resolve(tempDirHelper.tmpDir), {
            recursive: true,
            force: true
        })
    })

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .command(['convert', '--bundle-path', `bundle-sample`])
        .it('runs convert bundle ', () => {
            const bundleName = 'bundle-sample-v5'
            checkFoldersStructure(bundleName)
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)
            const bundleDescriptor = parseBundleDescriptor(bundleName)
            expect(bundleDescriptor.name).to.eq(bundleName)
            expect(bundleDescriptor.version).to.eq('0.0.1')
            expect(bundleDescriptor.description).to.eq(
                'bundle-sample-v5 description'
            )
            expect(bundleDescriptor.type).to.eq('bundle')
        })

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
        })
        .command(['convert'])
        .it('runs convert bundle without --bundle-path', () => {
            const bundleName = 'bundle-sample-v5'
            checkFoldersStructure(bundleName)
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)

            const bundleDescriptor = parseBundleDescriptor(bundleName)
            expect(bundleDescriptor.name).to.eq(bundleName)
            expect(bundleDescriptor.version).to.eq('0.0.1')
            expect(bundleDescriptor.description).to.eq(
                'bundle-sample-v5 description'
            )
            expect(bundleDescriptor.type).to.eq('bundle')
        })
    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            const localDescV1Json = descV1Json as any
            delete localDescV1Json.descriptorVersion
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), YAML.stringify(localDescV1Json)
            )
        })
        .command(['convert'])
        .it('runs convert bundle without --bundle-path and without descriptorVersion in descriptor', () => {
            const bundleName = 'bundle-sample-v5'
            checkFoldersStructure(bundleName)
            expect(
                (ProcessExecutorService.executeProcess as sinon.SinonStub).called
            ).to.equal(true)

            const bundleDescriptor = parseBundleDescriptor(bundleName)
            expect(bundleDescriptor.name).to.eq(bundleName)
            expect(bundleDescriptor.version).to.eq('0.0.1')
            expect(bundleDescriptor.description).to.eq(
                'bundle-sample-v5 description'
            )
            expect(bundleDescriptor.type).to.eq('bundle')
        })

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), "key: value\nkey: value2"
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor invalid. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 is invalid YAML')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            const localDescV1Json = descV1Json as any
            delete localDescV1Json.code
            localDescV1Json.name = "bundle-sample"
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), YAML.stringify(localDescV1Json)
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor invalid. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 has no code')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            const localDescV1Json = descV1Json as any
            delete localDescV1Json.components
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), YAML.stringify(localDescV1Json)
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor invalid. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 has no components')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            const localDescV1Json = descV1Json as any
            localDescV1Json.descriptorVersion = "v5"
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), YAML.stringify(localDescV1Json)
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor invalid. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 has descriptorVersion v5')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            const localDescV1Json = descV1Json as any
            localDescV1Json["bundle-type"] = "invalid-type"
            fs.writeFileSync(
                path.resolve('descriptor.yaml'), YAML.stringify(localDescV1Json)
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor invalid. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 has bundle-type invalid')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            fs.rmSync(
                path.resolve('descriptor.yaml')
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'Bundle descriptor not found. Is this a v1 Bundle project?'
            )
        })
        .it('throws an error when descriptor of bundle v1 is not found')

    test
        .stdout()
        .stderr()
        .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
        .do(() => {
            process.chdir("bundle-sample")
            fs.writeFileSync(
                path.resolve('entando.json'), '{"name": "bundle-sample"}'
            )
            fs.rmSync(
                path.resolve('descriptor.yaml')
            )
        })
        .command(['convert'])
        .catch(error => {
            expect(error.message).to.contain(
                'The Bundle is already a v5'
            )
        })
        .it('throws an error when descriptor is a v5')



    function checkFoldersStructure(bundleName: string) {
        checkBundleFile(bundleName, CONFIG_FOLDER)
        checkBundleFile(bundleName, CONFIG_FOLDER, CONFIG_FILE)
        checkBundleFile(bundleName, ...LOGS_FOLDER, "conversion-bundle-sample-v1-to-v5.log")
        checkBundleFile(bundleName, BUNDLE_DESCRIPTOR_FILE_NAME)
        checkBundleFile(bundleName, MICROSERVICES_FOLDER, GITKEEP_FILE)
        checkBundleFile(bundleName, MICROFRONTENDS_FOLDER, GITKEEP_FILE)
        checkBundleFile(bundleName, PSC_FOLDER, GITKEEP_FILE)
        checkBundleFile(bundleName, '.gitignore')
        checkBundleFile(bundleName, SVC_FOLDER)
    }

    function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
        const filePath = path.resolve(
            tempDirHelper.tmpDir,
            bundleName,
            ...pathSegments
        )
        expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
    }

    function parseBundleDescriptor(bundleName: string): BundleDescriptor {
        return new BundleDescriptorService(
            path.resolve(tempDirHelper.tmpDir, bundleName)
        ).getBundleDescriptor()
    }
})