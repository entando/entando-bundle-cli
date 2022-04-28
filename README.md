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
entando-bundle-cli/0.0.1-SNAPSHOT linux-x64 node-v14.19.1
$ entando-bundle-cli --help [COMMAND]
USAGE
  $ entando-bundle-cli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`entando-bundle-cli help [COMMAND]`](#entando-bundle-cli-help-command)
- [`entando-bundle-cli init NAME`](#entando-bundle-cli-init-name)

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

## `entando-bundle-cli init NAME`

performs the scaffolding of an empty bundle project

```
USAGE
  $ entando-bundle-cli init [NAME] [--version <value>]

ARGUMENTS
  NAME  project name

FLAGS
  --version=<value>  project version

DESCRIPTION
  performs the scaffolding of an empty bundle project

EXAMPLES
  $ entando-bundle-cli init my-bundle

  $ entando-bundle-cli init my-bundle --version=0.0.1
```

_See code: [dist/commands/init.ts](https://github.com/entando/entando-bundle-cli/blob/v0.0.1-SNAPSHOT/dist/commands/init.ts)_

<!-- commandsstop -->

# Development environment setup

It is suggested to install [nvm](https://github.com/nvm-sh/nvm). From the project root folder run:

```sh-session
nvm install
nvm use
```

If you are receiving `command not found` errors while executing pre-commit hooks with Husky using `nvm`, please refer to https://typicode.github.io/husky/#/?id=command-not-found
