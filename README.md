# entando-bundle-cli

Entando Bundle CLI, a tool to create and publish Entando bundles.

[![entando](https://img.shields.io/badge/entando-doc-brightgreen.svg)](https://dev.entando.org)
[![Build Status](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg)](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg?branch=develop)

<!-- toc -->

- [entando-bundle-cli](#entando-bundle-cli)
- [Usage](#usage)
- [Commands](#commands)
- [Development environment setup](#development-environment-setup)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g entando-bundle-cli
$ entando-bundle-cli COMMAND
running command...
$ entando-bundle-cli (--version)
entando-bundle-cli/0.0.1-SNAPSHOT darwin-x64 node-v14.19.1
$ entando-bundle-cli --help [COMMAND]
USAGE
  $ entando-bundle-cli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`entando-bundle-cli hello PERSON`](#entando-bundle-cli-hello-person)
- [`entando-bundle-cli hello world`](#entando-bundle-cli-hello-world)
- [`entando-bundle-cli help [COMMAND]`](#entando-bundle-cli-help-command)

## `entando-bundle-cli hello PERSON`

Say hello

```
USAGE
  $ entando-bundle-cli hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Whom is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/entando/entando-bundle-cli/blob/v0.0.1-SNAPSHOT/dist/commands/hello/index.ts)_

## `entando-bundle-cli hello world`

Say hello world

```
USAGE
  $ entando-bundle-cli hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ oex hello world
  hello world! (./src/commands/hello/world.ts)
```

## `entando-bundle-cli help [COMMAND]`

Display help for entando-bundle-cli.

```
USAGE
  $ entando-bundle-cli help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for entando-bundle-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

<!-- commandsstop -->

# Development environment setup

It is suggested to install [nvm](https://github.com/nvm-sh/nvm). From the project root folder run:

```sh-session
nvm install
nvm use
```

If you are receiving `command not found` errors while executing pre-commit hooks with Husky using `nvm`, please refer to https://typicode.github.io/husky/#/?id=command-not-found
