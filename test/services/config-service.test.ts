import { expect, test } from "@oclif/test"
import ConfigService from "../../src/services/config/config-service"
import fs from "node:fs";
import path from "node:path";

const TEST_TEMP_FOLDER = "test/tmp-config/"

describe("Test config-service", () => {
  test.it("Read default config file and check content", () => {
    const configService = new ConfigService()
    const config = configService.config
    expect(config.key1).to.exist.to.be.eq("val1")
    expect(config.key2).to.be.eq("val2")
  })

  test.it("Add a property", () => {
    const configService = new ConfigService()
    const key = "test-key"
    const value = "test-value"
    configService.addProperty(key, value)
    const config = configService.config
    expect(config.key1).to.be.eq("val1")
    expect(config.key2).to.be.eq("val2")
    expect(config[key]).to.be.eq(value)
  })

  test.it("Add a property that already exists should throw an error", () => {
    const configService = new ConfigService()
    const key = "key1"
    const value = "value1"
    expect(() => configService.addProperty(key, value)).to.throw();
  })

  test.it("Delete a property", () => {
    const configService = new ConfigService()
    const key = "key1"
    configService.deleteProperty(key)
    const config = configService.config
    expect(config[key]).to.be.undefined
    expect(config.key2).to.be.eq("val2")
  })

  test.it("Delete a property that not exists should throw an error", () => {
    const configService = new ConfigService()
    const key = "key3"
    expect(() => configService.deleteProperty(key)).to.throw();
  })

  test.it("Update a property", () => {
    const configService = new ConfigService()
    const key = "key1"
    const value = "test-value"
    configService.updateProperty(key, value)
    const config = configService.config
    expect(config[key]).to.be.eq(value)
  })

  test.it("Update a property that not exists should throw an error", () => {
    const configService = new ConfigService()
    const key = "key3"
    const value = "test-value"
    expect(() => configService.updateProperty(key, value)).to.throw();
  })

  test.it("Write config file with default properties", () => {
    const configService = new ConfigService()
    configService.writeConfigFile(TEST_TEMP_FOLDER);
    expect(fs.existsSync(`${TEST_TEMP_FOLDER}/.ent/config.json`)).to.be.eq(true);
    // temporary directory cleanup
    fs.rmSync(path.resolve(TEST_TEMP_FOLDER), { recursive: true, force: true })
  })
})
