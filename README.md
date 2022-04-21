# oclif-hello-world

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g entando-bundle-cli
$ entando-bundle-cli COMMAND
running command...
$ entando-bundle-cli (--version)
entando-bundle-cli/0.0.1 linux-x64 node-v14.19.0
$ entando-bundle-cli --help [COMMAND]
USAGE
  $ entando-bundle-cli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`entando-bundle-cli help [COMMAND]`](#entando-bundle-cli-help-command)
- [`entando-bundle-cli plugins`](#entando-bundle-cli-plugins)
- [`entando-bundle-cli plugins:install PLUGIN...`](#entando-bundle-cli-pluginsinstall-plugin)
- [`entando-bundle-cli plugins:inspect PLUGIN...`](#entando-bundle-cli-pluginsinspect-plugin)
- [`entando-bundle-cli plugins:install PLUGIN...`](#entando-bundle-cli-pluginsinstall-plugin-1)
- [`entando-bundle-cli plugins:link PLUGIN`](#entando-bundle-cli-pluginslink-plugin)
- [`entando-bundle-cli plugins:uninstall PLUGIN...`](#entando-bundle-cli-pluginsuninstall-plugin)
- [`entando-bundle-cli plugins:uninstall PLUGIN...`](#entando-bundle-cli-pluginsuninstall-plugin-1)
- [`entando-bundle-cli plugins:uninstall PLUGIN...`](#entando-bundle-cli-pluginsuninstall-plugin-2)
- [`entando-bundle-cli plugins update`](#entando-bundle-cli-plugins-update)

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

## `entando-bundle-cli plugins`

List installed plugins.

```
USAGE
  $ entando-bundle-cli plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ entando-bundle-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/index.ts)_

## `entando-bundle-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ entando-bundle-cli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ entando-bundle-cli plugins add

EXAMPLES
  $ entando-bundle-cli plugins:install myplugin

  $ entando-bundle-cli plugins:install https://github.com/someuser/someplugin

  $ entando-bundle-cli plugins:install someuser/someplugin
```

## `entando-bundle-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ entando-bundle-cli plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ entando-bundle-cli plugins:inspect myplugin
```

## `entando-bundle-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ entando-bundle-cli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ entando-bundle-cli plugins add

EXAMPLES
  $ entando-bundle-cli plugins:install myplugin

  $ entando-bundle-cli plugins:install https://github.com/someuser/someplugin

  $ entando-bundle-cli plugins:install someuser/someplugin
```

## `entando-bundle-cli plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ entando-bundle-cli plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ entando-bundle-cli plugins:link myplugin
```

## `entando-bundle-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ entando-bundle-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ entando-bundle-cli plugins unlink
  $ entando-bundle-cli plugins remove
```

## `entando-bundle-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ entando-bundle-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ entando-bundle-cli plugins unlink
  $ entando-bundle-cli plugins remove
```

## `entando-bundle-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ entando-bundle-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ entando-bundle-cli plugins unlink
  $ entando-bundle-cli plugins remove
```

## `entando-bundle-cli plugins update`

Update installed plugins.

```
USAGE
  $ entando-bundle-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

<!-- commandsstop -->
