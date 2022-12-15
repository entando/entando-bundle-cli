# entando-bundle-cli

Entando Bundle CLI, a tool to create and publish Entando bundles.

[![entando](https://img.shields.io/badge/entando-doc-brightgreen.svg)](https://dev.entando.org)
[![Build Status](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg)](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg?branch=develop)

<!-- toc -->

- [entando-bundle-cli](#entando-bundle-cli)
- [Usage](#usage)
- [Commands](#commands)
- [Environment variables](#environment-variables)
- [Development environment setup](#development-environment-setup)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @entando/entando-bundle-cli
$ entando-bundle-cli COMMAND
running command...
$ entando-bundle-cli (--version)
@entando/entando-bundle-cli/1.0.1 linux-x64 node-v14.19.1
$ entando-bundle-cli --help [COMMAND]
USAGE
  $ entando-bundle-cli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`entando-bundle-cli api add MFENAME CLAIMNAME`](#entando-bundle-cli-api-add-mfename-claimname)
- [`entando-bundle-cli api add-ext MFENAME CLAIMNAME`](#entando-bundle-cli-api-add-ext-mfename-claimname)
- [`entando-bundle-cli api rm MFENAME CLAIMNAME`](#entando-bundle-cli-api-rm-mfename-claimname)
- [`entando-bundle-cli build [component...] [--all-ms | --all-mfe | --all]`](#entando-bundle-cli-build-component---all-ms----all-mfe----all)
- [`entando-bundle-cli generate-cr`](#entando-bundle-cli-generate-cr)
- [`entando-bundle-cli help [COMMAND]`](#entando-bundle-cli-help-command)
- [`entando-bundle-cli images`](#entando-bundle-cli-images)
- [`entando-bundle-cli info`](#entando-bundle-cli-info)
- [`entando-bundle-cli init NAME`](#entando-bundle-cli-init-name)
- [`entando-bundle-cli list`](#entando-bundle-cli-list)
- [`entando-bundle-cli mfe add NAME`](#entando-bundle-cli-mfe-add-name)
- [`entando-bundle-cli mfe rm NAME`](#entando-bundle-cli-mfe-rm-name)
- [`entando-bundle-cli ms add NAME`](#entando-bundle-cli-ms-add-name)
- [`entando-bundle-cli ms rm NAME`](#entando-bundle-cli-ms-rm-name)
- [`entando-bundle-cli pack`](#entando-bundle-cli-pack)
- [`entando-bundle-cli publish`](#entando-bundle-cli-publish)
- [`entando-bundle-cli run [component...] [--all-ms | --all-mfe | --all]`](#entando-bundle-cli-run-component---all-ms----all-mfe----all)
- [`entando-bundle-cli svc disable SERVICENAME`](#entando-bundle-cli-svc-disable-servicename)
- [`entando-bundle-cli svc enable SERVICENAME`](#entando-bundle-cli-svc-enable-servicename)
- [`entando-bundle-cli svc list`](#entando-bundle-cli-svc-list)
- [`entando-bundle-cli svc logs [service...] [--all]`](#entando-bundle-cli-svc-logs-service---all)
- [`entando-bundle-cli svc restart [service...] [--all]`](#entando-bundle-cli-svc-restart-service---all)
- [`entando-bundle-cli svc start [service...] [--all]`](#entando-bundle-cli-svc-start-service---all)
- [`entando-bundle-cli svc stop [service...] [--all]`](#entando-bundle-cli-svc-stop-service---all)

## `entando-bundle-cli api add MFENAME CLAIMNAME`

Add an internal API claim to the specified MFE component

```
USAGE
  $ entando-bundle-cli api add [MFENAME] [CLAIMNAME] --serviceName <value> --serviceUrl <value>

ARGUMENTS
  MFENAME    Name of the Micro Frontend component
  CLAIMNAME  Name of the API claim

FLAGS
  --serviceName=<value>  (required) Microservice name within the Bundle
  --serviceUrl=<value>   (required) Local microservice URL

DESCRIPTION
  Add an internal API claim to the specified MFE component

EXAMPLES
  $ entando-bundle-cli api add mfe1 ms1-api --serviceName ms1 --serviceUrl http://localhost:8080
```

## `entando-bundle-cli api add-ext MFENAME CLAIMNAME`

Add an external API claim to the specified MFE component

```
USAGE
  $ entando-bundle-cli api add-ext [MFENAME] [CLAIMNAME] [--serviceName <value> --bundle <value>]

ARGUMENTS
  MFENAME    Name of the Micro Frontend component
  CLAIMNAME  Name of the API claim

FLAGS
  --bundle=<value>       Target Bundle Docker repository with the format [docker://]<organization>/<repository> or
                         [docker://]<registry>/<organization>/<repository>
  --serviceName=<value>  Microservice name within the target Bundle

DESCRIPTION
  Add an external API claim to the specified MFE component

EXAMPLES
  $ entando-bundle-cli api add-ext mfe1 ms1-api --bundle registry.hub.docker.com/my-org/my-bundle --serviceName ms1
```

## `entando-bundle-cli api rm MFENAME CLAIMNAME`

Remove an API claim from the specified MFE component

```
USAGE
  $ entando-bundle-cli api rm [MFENAME] [CLAIMNAME]

ARGUMENTS
  MFENAME    Name of the Micro Frontend component
  CLAIMNAME  Name of the API claim

DESCRIPTION
  Remove an API claim from the specified MFE component

EXAMPLES
  $ entando-bundle-cli api rm my-mfe my-api-claim
```

## `entando-bundle-cli build [component...] [--all-ms | --all-mfe | --all]`

Build bundle components

```
USAGE
  $ entando-bundle-cli build [component...] [--all-ms | --all-mfe | --all]

FLAGS
  --all                   Build all the bundle components
  --all-mfe               Build all the bundle micro frontends
  --all-ms                Build all the bundle microservices
  --max-parallel=<value>  Maximum number of processes running at the same time. Default value is 3
  --stdout                Print build output to stdout instead of files

DESCRIPTION
  Build bundle components

EXAMPLES
  $ entando-bundle-cli build my-component

  $ entando-bundle-cli build my-component-1 my-component-2

  $ entando-bundle-cli build --all-ms

  $ entando-bundle-cli build --all-mfe

  $ entando-bundle-cli build --all
```

_See code: [dist/commands/build.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/build.ts)_

## `entando-bundle-cli generate-cr`

Generate the Entando Custom Resource (CR) for a bundle project

```
USAGE
  $ entando-bundle-cli generate-cr [-i <value>] [-d] [-f -o <value>]

FLAGS
  -d, --digest          Include Docker images digests
  -f, --force           Suppress the confirmation prompt in case of file overwrite
  -i, --image=<value>   Name of the bundle Docker image with the format [docker://]<organization>/<repository> or
                        [docker://]<registry>/<organization>/<repository>
  -o, --output=<value>  Write the result to the specified output file

DESCRIPTION
  Generate the Entando Custom Resource (CR) for a bundle project

EXAMPLES
  $ entando-bundle-cli generate-cr

  $ entando-bundle-cli generate-cr --image=my-org/my-bundle

  $ entando-bundle-cli generate-cr -i my-registry/my-org/my-bundle

  $ entando-bundle-cli generate-cr --image=my-org/my-bundle --digest

  $ entando-bundle-cli generate-cr -o my-cr.yml
```

_See code: [dist/commands/generate-cr.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/generate-cr.ts)_

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

## `entando-bundle-cli images`

List the Docker images and their corresponding tags that are included in the bundle, taking into account organization and registry previously set using the "pack" command.

```
USAGE
  $ entando-bundle-cli images

DESCRIPTION
  List the Docker images and their corresponding tags that are included in the bundle, taking into account organization
  and registry previously set using the "pack" command.
```

_See code: [dist/commands/images.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/images.ts)_

## `entando-bundle-cli info`

Show status information for the bundle project

```
USAGE
  $ entando-bundle-cli info

DESCRIPTION
  Show status information for the bundle project

EXAMPLES
  $ entando-bundle-cli info
```

_See code: [dist/commands/info.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/info.ts)_

## `entando-bundle-cli init NAME`

Perform the scaffolding of a bundle project

```
USAGE
  $ entando-bundle-cli init [NAME] [--version <value>] [--hub-url <value> --from-hub]

ARGUMENTS
  NAME  Bundle project name

FLAGS
  --from-hub         Initializes a bundle project from the Entando Hub
  --hub-url=<value>  Custom Entando Hub url
  --version=<value>  Project version

DESCRIPTION
  Perform the scaffolding of a bundle project

EXAMPLES
  $ entando-bundle-cli init my-bundle

  $ entando-bundle-cli init my-bundle --version=0.0.1

  $ entando-bundle-cli init my-bundle --from-hub
```

_See code: [dist/commands/init.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/init.ts)_

## `entando-bundle-cli list`

List the available components in the bundle

```
USAGE
  $ entando-bundle-cli list [--ms] [--mfe]

FLAGS
  --mfe  List only Micro Frontend components
  --ms   List only microservice components

DESCRIPTION
  List the available components in the bundle

EXAMPLES
  $ entando-bundle-cli list

  $ entando-bundle-cli list --ms

  $ entando-bundle-cli list --ms --mfe
```

_See code: [dist/commands/list.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/list.ts)_

## `entando-bundle-cli mfe add NAME`

Add a Micro Frontend component to the bundle

```
USAGE
  $ entando-bundle-cli mfe add [NAME] [--stack react|angular|custom] [--type
    app-builder|widget|widget-config] [--slot primary-header|primary-menu|content]

ARGUMENTS
  NAME  Name of the Micro Frontend component

FLAGS
  --slot=<option>   Micro Frontend App Builder slot (only if type=app-builder)
                    <options: primary-header|primary-menu|content>
  --stack=<option>  [default: react] Micro Frontend stack
                    <options: react|angular|custom>
  --type=<option>   [default: widget] Micro Frontend type
                    <options: app-builder|widget|widget-config>

DESCRIPTION
  Add a Micro Frontend component to the bundle

EXAMPLES
  $ entando-bundle-cli mfe add my-mfe

  $ entando-bundle-cli mfe add my-mfe --stack react
```

## `entando-bundle-cli mfe rm NAME`

Remove a Micro Frontend component to the bundle

```
USAGE
  $ entando-bundle-cli mfe rm [NAME]

ARGUMENTS
  NAME  Name of the Micro Frontend component

DESCRIPTION
  Remove a Micro Frontend component to the bundle

EXAMPLES
  $ entando-bundle-cli mfe rm my-mfe
```

## `entando-bundle-cli ms add NAME`

Add a microservice component to the bundle

```
USAGE
  $ entando-bundle-cli ms add [NAME] [--stack node|spring-boot|custom]

ARGUMENTS
  NAME  Name of the microservice component

FLAGS
  --stack=<option>  [default: spring-boot] Microservice stack
                    <options: node|spring-boot|custom>

DESCRIPTION
  Add a microservice component to the bundle

EXAMPLES
  $ entando-bundle-cli ms add my-ms

  $ entando-bundle-cli ms add my-ms --stack spring-boot
```

## `entando-bundle-cli ms rm NAME`

Remove a microservice component from the current bundle

```
USAGE
  $ entando-bundle-cli ms rm [NAME]

ARGUMENTS
  NAME  Microservice name

DESCRIPTION
  Remove a microservice component from the current bundle

EXAMPLES
  $ entando-bundle-cli ms rm my-microservice
```

## `entando-bundle-cli pack`

Generate the bundle Docker images

```
USAGE
  $ entando-bundle-cli pack [-o <value>] [-r <value>] [-f <value>] [--stdout] [--max-parallel <value>] [-s]

FLAGS
  -f, --file=<value>       Bundle Dockerfile (by default it is automatically generated)
  -o, --org=<value>        Docker organization name
  -r, --registry=<value>   Docker registry (default is registry.hub.docker.com)
  -s, --skip-docker-build  Skip the building of Docker images
  --max-parallel=<value>   Maximum number of processes running at the same time. Default value is 3
  --stdout                 Log build output to standard output

DESCRIPTION
  Generate the bundle Docker images

EXAMPLES
  $ entando-bundle-cli pack

  $ entando-bundle-cli pack --org=my-org

  $ entando-bundle-cli pack -f my-Dockerfile
```

_See code: [dist/commands/pack.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/pack.ts)_

## `entando-bundle-cli publish`

Publish bundle Docker images

```
USAGE
  $ entando-bundle-cli publish [-r <value>] [-o <value>]

FLAGS
  -o, --org=<value>       Docker organization name
  -r, --registry=<value>  Docker registry (default is registry.hub.docker.com)

DESCRIPTION
  Publish bundle Docker images

EXAMPLES
  $ entando-bundle-cli publish --registry registry.hub.docker.com --org my-docker-organization
```

_See code: [dist/commands/publish.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/publish.ts)_

## `entando-bundle-cli run [component...] [--all-ms | --all-mfe | --all]`

Run bundle components

```
USAGE
  $ entando-bundle-cli run [component...] [--all-ms | --all-mfe | --all]

FLAGS
  --all      Run all the bundle components
  --all-mfe  Run all the bundle micro frontends
  --all-ms   Run all the bundle microservices

DESCRIPTION
  Run bundle components

EXAMPLES
  $ entando-bundle-cli run my-component

  $ entando-bundle-cli run my-component-1 my-component-2

  $ entando-bundle-cli run --all-ms

  $ entando-bundle-cli run --all-mfe

  $ entando-bundle-cli run --all
```

_See code: [dist/commands/run.ts](https://github.com/entando/entando-bundle-cli/blob/v1.0.1/dist/commands/run.ts)_

## `entando-bundle-cli svc disable SERVICENAME`

Disable auxiliary services

```
USAGE
  $ entando-bundle-cli svc disable [SERVICENAME] [-r]

ARGUMENTS
  SERVICENAME  Name of an available service

FLAGS
  -r, --[no-]remove  Remove service configuration and data in svc folder

DESCRIPTION
  Disable auxiliary services

EXAMPLES
  $ entando-bundle-cli svc disable external-service

  $ entando-bundle-cli svc disable external-service --remove

  $ entando-bundle-cli svc disable external-service --no-remove
```

## `entando-bundle-cli svc enable SERVICENAME`

Enable auxiliary services

```
USAGE
  $ entando-bundle-cli svc enable [SERVICENAME]

ARGUMENTS
  SERVICENAME  Name of an available service

DESCRIPTION
  Enable auxiliary services

EXAMPLES
  $ entando-bundle-cli svc enable external-service
```

## `entando-bundle-cli svc list`

List auxiliary services

```
USAGE
  $ entando-bundle-cli svc list [--available]

FLAGS
  --available  List all available services

DESCRIPTION
  List auxiliary services

EXAMPLES
  $ entando-bundle-cli svc list
```

## `entando-bundle-cli svc logs [service...] [--all]`

Display running auxiliary services logs

```
USAGE
  $ entando-bundle-cli svc logs [service...] [--all]

FLAGS
  --all  Display logs of all enabled services in the bundle descriptor

DESCRIPTION
  Display running auxiliary services logs

EXAMPLES
  $ entando-bundle-cli svc logs --all

  $ entando-bundle-cli svc logs ext-service

  $ entando-bundle-cli svc logs ext-service1 ext-service2
```

## `entando-bundle-cli svc restart [service...] [--all]`

Restart running auxiliary services

```
USAGE
  $ entando-bundle-cli svc restart [service...] [--all]

FLAGS
  --all  Restarts all enabled services in the bundle descriptor

DESCRIPTION
  Restart running auxiliary services

EXAMPLES
  $ entando-bundle-cli svc restart --all

  $ entando-bundle-cli svc restart ext-service

  $ entando-bundle-cli svc restart ext-service1 ext-service2
```

## `entando-bundle-cli svc start [service...] [--all]`

Start enabled auxiliary services

```
USAGE
  $ entando-bundle-cli svc start [service...] [--all]

FLAGS
  --all  Starts all enabled services in the bundle descriptor

DESCRIPTION
  Start enabled auxiliary services

EXAMPLES
  $ entando-bundle-cli svc start --all

  $ entando-bundle-cli svc start ext-service

  $ entando-bundle-cli svc start ext-service1 ext-service2
```

## `entando-bundle-cli svc stop [service...] [--all]`

Stop running auxiliary services

```
USAGE
  $ entando-bundle-cli svc stop [service...] [--all]

FLAGS
  --all  Stops all enabled services in the bundle descriptor

DESCRIPTION
  Stop running auxiliary services

EXAMPLES
  $ entando-bundle-cli svc stop --all

  $ entando-bundle-cli svc stop ext-service

  $ entando-bundle-cli svc stop ext-service1 ext-service2
```

<!-- commandsstop -->

# Environment variables

- `ENTANDO_BUNDLE_CLI_BIN_NAME`: customizes CLI name that appears in `USAGE` and `EXAMPLES` sections of the help (`entando-bundle-cli` by default)
- `ENTANDO_BUNDLE_CLI_INIT_SUPPRESS_NO_ENTANDO_JSON_WARNING`: Disables the warning about missing entando.json in bundles initialized from Hub (`false` by default)
- `ENTANDO_CLI_BASE_URL`: Entando app base URL
- `ENTANDO_CLI_CRANE_BIN`: path to the crane executable
- `ENTANDO_CLI_DEBUG`: boolean flag (`true`|`false`) used to enable debug logging (`false` by default)
- `ENTANDO_CLI_DEFAULT_DOCKER_REGISTRY`: Default Docker registry (`registry.hub.docker.com` by default)
- `ENTANDO_CLI_DEFAULT_HUB`: default domain of your Entando Hub - default sets to `https://entando.com/entando-hub-api`
- `ENTANDO_CLI_ECR_TOKEN`: ECR/CM API authentication token
- `ENTANDO_CLI_ECR_URL`: URL of ECR/CM API

# Development environment setup

It is suggested to install [nvm](https://github.com/nvm-sh/nvm). From the project root folder run:

```sh-session
nvm install
nvm use
```

If you are receiving `command not found` errors while executing pre-commit hooks with Husky using `nvm`, please refer to https://typicode.github.io/husky/#/?id=command-not-found

## Debugging

To print debug information define a static `debug` function using the `debugFactory`:

```
private static debug = debugFactory(MyClass)
```

Debug output can be enabled using the following environment variable:

```
ENTANDO_CLI_DEBUG=true
```

Debug output is sent to stderr, so you can redirect it to a file in the following way:

```
entando-bundle-cli command 2>log.txt
```
