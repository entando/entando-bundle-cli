oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g cli-boilerplate
$ cli-boilerplate COMMAND
running command...
$ cli-boilerplate (--version)
cli-boilerplate/0.0.0 linux-x64 node-v14.19.0
$ cli-boilerplate --help [COMMAND]
USAGE
  $ cli-boilerplate COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cli-boilerplate help [COMMAND]`](#cli-boilerplate-help-command)
* [`cli-boilerplate plugins`](#cli-boilerplate-plugins)
* [`cli-boilerplate plugins:install PLUGIN...`](#cli-boilerplate-pluginsinstall-plugin)
* [`cli-boilerplate plugins:inspect PLUGIN...`](#cli-boilerplate-pluginsinspect-plugin)
* [`cli-boilerplate plugins:install PLUGIN...`](#cli-boilerplate-pluginsinstall-plugin-1)
* [`cli-boilerplate plugins:link PLUGIN`](#cli-boilerplate-pluginslink-plugin)
* [`cli-boilerplate plugins:uninstall PLUGIN...`](#cli-boilerplate-pluginsuninstall-plugin)
* [`cli-boilerplate plugins:uninstall PLUGIN...`](#cli-boilerplate-pluginsuninstall-plugin-1)
* [`cli-boilerplate plugins:uninstall PLUGIN...`](#cli-boilerplate-pluginsuninstall-plugin-2)
* [`cli-boilerplate plugins update`](#cli-boilerplate-plugins-update)

## `cli-boilerplate help [COMMAND]`

Display help for cli-boilerplate.

```
USAGE
  $ cli-boilerplate help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cli-boilerplate.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `cli-boilerplate plugins`

List installed plugins.

```
USAGE
  $ cli-boilerplate plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ cli-boilerplate plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/index.ts)_

## `cli-boilerplate plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cli-boilerplate plugins:install PLUGIN...

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
  $ cli-boilerplate plugins add

EXAMPLES
  $ cli-boilerplate plugins:install myplugin 

  $ cli-boilerplate plugins:install https://github.com/someuser/someplugin

  $ cli-boilerplate plugins:install someuser/someplugin
```

## `cli-boilerplate plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ cli-boilerplate plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ cli-boilerplate plugins:inspect myplugin
```

## `cli-boilerplate plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cli-boilerplate plugins:install PLUGIN...

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
  $ cli-boilerplate plugins add

EXAMPLES
  $ cli-boilerplate plugins:install myplugin 

  $ cli-boilerplate plugins:install https://github.com/someuser/someplugin

  $ cli-boilerplate plugins:install someuser/someplugin
```

## `cli-boilerplate plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ cli-boilerplate plugins:link PLUGIN

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
  $ cli-boilerplate plugins:link myplugin
```

## `cli-boilerplate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cli-boilerplate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cli-boilerplate plugins unlink
  $ cli-boilerplate plugins remove
```

## `cli-boilerplate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cli-boilerplate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cli-boilerplate plugins unlink
  $ cli-boilerplate plugins remove
```

## `cli-boilerplate plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cli-boilerplate plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cli-boilerplate plugins unlink
  $ cli-boilerplate plugins remove
```

## `cli-boilerplate plugins update`

Update installed plugins.

```
USAGE
  $ cli-boilerplate plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
