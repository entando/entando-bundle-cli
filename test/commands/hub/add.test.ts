import { CliUx } from '@oclif/core'
import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as sinon from 'sinon'

describe('hub add', () => {
    let writeFileSyncStub: sinon.SinonStub

    beforeEach(() => {
        process.env.ENTANDO_BUNDLE_CLI_ETC = "/tmp/mock-etc"
        sinon.stub(fs, 'mkdirSync')
        writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
    })

    afterEach(() => {
        sinon.restore()
    })

    test
        .env({ ENTANDO_BUNDLE_CLI_ETC: undefined })
        .command(['hub add'])
        .catch(error => {
            expect(error.message).to.contain(
                'Environment variable "ENTANDO_BUNDLE_CLI_ETC" should have a value'
            )
        })
        .it('throws an error when one of required env variables has no value')

    test
        .command(['hub add',
            '--name', 'my-hub',
            '--hub-url', 'http://www.entandohub.com/api',
            '--hub-api-key', '987654321'])
        .it('should store the hub credentials', () => {
            const expected = {
                name: 'my-hub',
                url: 'http://www.entandohub.com/api',
                apiKey: '987654321'
            };

            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args[0]).to.be.equal('/tmp/mock-etc/hub/credentials/my-hub.json');
            expect(writeFileSyncStub.firstCall.args[1]).to.be.equal(JSON.stringify(expected, null, 2));
        })

    test
        .command(['hub add',
            '--name', 'my-hub',
            '--hub-url', 'invalid-url',
            '--hub-api-key', '987654321'])
        .catch(error => expect(error.message).to.be.equal('invalid-url is not a valid URL'))
        .it('throws an error when url is invalid')


    test
        .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
        .command(['hub add',
            '--name', 'my-hub',
            '--hub-url', 'http://www.entandohub.com/api'
        ])
        .it('should store the hub credentials without apiKey', () => {
            const expected = {
                name: 'my-hub',
                url: 'http://www.entandohub.com/api'
            };

            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args[0]).to.be.equal('/tmp/mock-etc/hub/credentials/my-hub.json');
            expect(writeFileSyncStub.firstCall.args[1]).to.be.equal(JSON.stringify(expected, null, 2));
        })

    test
        .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves("my-hub"))
        .command(['hub add',
            '--hub-url', 'http://www.entandohub.com/api',
            '--hub-api-key', '987654321'
        ])
        .it('should store the hub credentials when the hub name is provided in interactive mode', () => {
            const expected = {
                name: 'my-hub',
                url: 'http://www.entandohub.com/api',
                apiKey: '987654321'
            };

            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args[0]).to.be.equal('/tmp/mock-etc/hub/credentials/my-hub.json');
            expect(writeFileSyncStub.firstCall.args[1]).to.be.equal(JSON.stringify(expected, null, 2));
        })

    test
        .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves("http://www.entandohub.com/api"))
        .command(['hub add',
            '--name', 'my-hub',
            '--hub-api-key', '987654321'
        ])
        .it('should store the hub credentials when the url is provided in interactive mode', () => {
            const expected = {
                name: 'my-hub',
                url: 'http://www.entandohub.com/api',
                apiKey: '987654321'
            };

            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args[0]).to.be.equal('/tmp/mock-etc/hub/credentials/my-hub.json');
            expect(writeFileSyncStub.firstCall.args[1]).to.be.equal(JSON.stringify(expected, null, 2));
        })

    test
        .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves('987654321'))
        .command(['hub add',
            '--name', 'my-hub',
            '--hub-url', 'http://www.entandohub.com/api'
        ])
        .it('should store the hub credentials when the apiKey is provided in interactive mode', () => {
            const expected = {
                name: 'my-hub',
                url: 'http://www.entandohub.com/api',
                apiKey: '987654321'
            };

            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args[0]).to.be.equal('/tmp/mock-etc/hub/credentials/my-hub.json');
            expect(writeFileSyncStub.firstCall.args[1]).to.be.equal(JSON.stringify(expected, null, 2));
        })

})