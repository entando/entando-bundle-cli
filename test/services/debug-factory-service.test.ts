import { expect, test } from "@oclif/test"

import Init from "../../src/commands/init"
import debugFactory from "../../src/services/debug-factory-service"

describe("debugFactory", () => {
  test
    .stderr()
    .env({ ENTANDO_CLI_DEBUG: "false" })
    .do(() => {
      const debug = debugFactory("disabled")
      debug("should not appear")
    })
    .it("debugger disabled", ctx => {
      expect(ctx.stderr).to.eq("")
    })

  test
    .stderr()
    .env({ ENTANDO_CLI_DEBUG: "true" })
    .do(() => {
      const debug = debugFactory(Init)
      debug("simple message")
    })
    .it("debugger enabled using -d uses class name", ctx => {
      expect(ctx.stderr).to.contain("entando-bundle-cli:Init simple message")
    })

  test
    .stderr()
    .env({ ENTANDO_CLI_DEBUG: "true" })
    .do(() => {
      const debug = debugFactory("test-namespace")
      debug("%s message", "formatted")
    })
    .it("debugger enabled using -d prints formatted message", ctx => {
      expect(ctx.stderr).to.contain(
        "entando-bundle-cli:test-namespace formatted message"
      )
    })
})
