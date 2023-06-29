import color from '@oclif/color'
import inquirer = require('inquirer')
import path = require('node:path')
import * as fs from 'node:fs'
import {
  YamlWidgetConfigDescriptorV1,
  YamlWidgetDescriptorV1
} from '../../models/yaml-bundle-descriptor'
import * as YAML from 'yaml'
import { debugFactory } from '../debug-factory-service'
import { MicroFrontendStack } from '../../models/component'
import { MicroFrontendService } from '../microfrontend-service'
import {
  MicroFrontend,
  MicroFrontendType,
  WidgetMicroFrontend
} from '../../models/bundle-descriptor'
import { CliUx } from '@oclif/core'
import {
  CUSTOM_WIDGET_TEMPLATE_EXTENSION,
  MICROFRONTENDS_FOLDER,
  PSC_FOLDER,
  WIDGETS_FOLDER
} from '../../paths'
import { ConstraintsValidatorService } from '../constraints-validator-service'
import {
  YAML_WIDGET_CONFIG_CONSTRAINTS_V1,
  YAML_WIDGET_DESCRIPTOR_CONSTRAINTS_V1
} from '../../models/yaml-bundle-descriptor-constraints'
import { writeFileSyncRecursive } from '../../utils'

const DELIMITER = '-'.repeat(process.stdout.columns ?? '10')
const WIDGET_TO_MFE_DESCRIPTION = 'CONVERSION FROM WIDGET TO MICROFRONTENDS'
const WIDGET_TO_PSC_DESCRIPTION = 'COPY THE WIDGETS TO THE PLATFORM FILES'

interface WidgetsToConvert {
  mfes: MfeToConvert[]
  widgets: string[]
}
interface MfeToConvert {
  path: string
  type: MicroFrontendType.Widget | MicroFrontendType.WidgetConfig
}

export class WidgetConverter {
  private static debug = debugFactory(WidgetConverter)

  public static async getWidgetsToConvert(
    widgetsPaths: string[]
  ): Promise<WidgetsToConvert> {
    const mfes: MfeToConvert[] = []
    const widgets: string[] = []

    for await (const widgetPath of widgetsPaths) {
      const widgetName = path.basename(widgetPath).split('.').shift()
      const { isMfe } = await inquirer.prompt([
        {
          name: 'isMfe',
          message: `is ${widgetName} a microfrontend or a widget?`,
          type: 'list',
          choices: [
            {
              name: `yes, the widget ${color.bold.blue(
                widgetName
              )} will be treated as a microfrontend`,
              value: true
            },
            {
              name: `no, the widget ${color.bold.blue(
                widgetName
              )} will be treated like platform files`,
              value: false
            }
          ]
        }
      ])

      if (isMfe) {
        const { type } = await inquirer.prompt([
          {
            name: 'type',
            message: `What is the type of microfrontend ${color.bold.blue(
              widgetName
            )}?`,
            type: 'list',
            choices: [
              { value: MicroFrontendType.Widget },
              { value: MicroFrontendType.WidgetConfig }
            ]
          }
        ])
        mfes.push({ path: widgetPath, type })
      } else {
        widgets.push(widgetPath)
      }
    }

    return { mfes, widgets }
  }

  public static convertWidgetsToMicrofrontends(
    bundlePath: string,
    outDir: string,
    microfrontends: MfeToConvert[]
  ): string[] {
    const report: string[] = []
    report.push(`\n${WIDGET_TO_MFE_DESCRIPTION}`)

    for (const mfe of microfrontends) {
      report.push(DELIMITER, `Start conversion of ${path.basename(mfe.path)}`)

      const { path: mfePath, type } = mfe
      const widgetDescriptorPath = path.resolve(bundlePath, mfePath)

      if (!fs.existsSync(widgetDescriptorPath)) {
        const msg = `Widget descriptor for widget ${path.basename(
          mfePath
        )} not found. It will be skipped.`
        WidgetConverter.debug(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }

      // read the widget descriptor
      const widget = WidgetConverter.parseWidgetDescriptor(widgetDescriptorPath)

      if (widget instanceof Error) {
        WidgetConverter.debug(`${widget.message}\nIt will be skipped.`)
        report.push(`${widget.message}\nCheck it if you want to include it`)
        continue
      }

      // assign the type chosen by the user
      widget.type = type
      // underscore allowed in v1 but not in v5
      widget.code = widget.code && widget.code.replace(/_/g, '-')

      // validate the widget descriptor
      if (!WidgetConverter.validateWidget(widget, report)) {
        continue
      }

      // mapping from widget to microfrontend
      const microfrontend = WidgetConverter.mapWidgetToMicrofrontend(widget)
      // add the microfrontend
      const microfrontendService: MicroFrontendService =
        new MicroFrontendService(outDir)
      CliUx.ux.action.start(`Adding a new microfrontend ${microfrontend.name}`)
      microfrontendService.addMicroFrontend(microfrontend)
      CliUx.ux.action.stop()

      // copy ftl
      if (widget.customUiPath) {
        CliUx.ux.action.start(
          `Custom widget template FTL found for widget ${microfrontend.name}, including it`
        )
        const outputWidgetsPath = path.resolve(
          outDir,
          MICROFRONTENDS_FOLDER,
          microfrontend.name
        )
        const customFtlName = `${microfrontend.name}${CUSTOM_WIDGET_TEMPLATE_EXTENSION}`

        WidgetConverter.copyCustomFtl(
          widgetDescriptorPath,
          outputWidgetsPath,
          widget.customUiPath,
          customFtlName
        )

        CliUx.ux.action.stop()
      }

      report.push(
        `The conversion of microfrontend ${microfrontend.name} was successful`
      )
    }

    report.push(DELIMITER)
    return report
  }

  public static convertWidgetsToPlatformFiles(
    bundlePath: string,
    outDir: string,
    widgetsPaths: string[]
  ): string[] {
    const report: string[] = []
    report.push(`\n${WIDGET_TO_PSC_DESCRIPTION}`)

    for (const widgetPath of widgetsPaths) {
      report.push(DELIMITER, `Start conversion of ${path.basename(widgetPath)}`)

      const widgetDescriptorPath = path.resolve(bundlePath, widgetPath)

      if (!fs.existsSync(widgetDescriptorPath)) {
        const msg = `Widget descriptor for widget ${path.basename(
          widgetDescriptorPath
        )} not found. It will be skipped.`
        WidgetConverter.debug(`${msg}`)
        report.push(`${msg}\nCheck it if you want to include it`)
        continue
      }

      const widget = WidgetConverter.parseWidgetDescriptor(widgetDescriptorPath)
      if (widget instanceof Error) {
        WidgetConverter.debug(`${widget.message}\nIt will be skipped.`)
        report.push(`${widget.message}\nCheck it if you want to include it`)
        continue
      }

      if (widget.customUiPath) {
        const customFtlName = path.basename(widget.customUiPath)
        const outputWidgetsPath = path.resolve(
          outDir,
          PSC_FOLDER,
          WIDGETS_FOLDER
        )

        WidgetConverter.copyCustomFtl(
          widgetDescriptorPath,
          outputWidgetsPath,
          widget.customUiPath,
          customFtlName
        )

        // set new location
        widget.customUiPath = customFtlName
      }

      writeFileSyncRecursive(
        path.resolve(
          outDir,
          PSC_FOLDER,
          WIDGETS_FOLDER,
          path.basename(widgetPath)
        ),
        YAML.stringify(widget)
      )

      report.push(
        `The conversion of widget ${widget.code} to platform files was successful`
      )
    }

    report.push(DELIMITER)
    return report
  }

  private static validateWidget(
    widget: YamlWidgetDescriptorV1 | YamlWidgetConfigDescriptorV1,
    report: string[]
  ): boolean {
    try {
      widget.type === MicroFrontendType.WidgetConfig
        ? ConstraintsValidatorService.validateObjectConstraints(
            widget,
            YAML_WIDGET_CONFIG_CONSTRAINTS_V1
          )
        : ConstraintsValidatorService.validateObjectConstraints(
            widget,
            YAML_WIDGET_DESCRIPTOR_CONSTRAINTS_V1
          )
      return true
    } catch (error) {
      const msg = `The widget ${widget.code} is invalid.\n${
        (error as Error).message
      }.\nIts conversion will be skipped.`
      WidgetConverter.debug(`${msg}`)
      report.push(`${msg}\nCheck it if you want to include it`)
      return false
    }
  }

  private static mapWidgetToMicrofrontend(
    widget: YamlWidgetDescriptorV1 | YamlWidgetConfigDescriptorV1
  ): MicroFrontend {
    const { code, group } = widget
    const microfrontend = {
      name: code,
      group,
      type: widget.type,
      stack: MicroFrontendStack.Custom,
      commands: {}
    } as MicroFrontend

    if (widget.type === MicroFrontendType.Widget) {
      const mfeWidgetRef = microfrontend as WidgetMicroFrontend
      const yamlWidgetRef = widget as YamlWidgetDescriptorV1
      mfeWidgetRef.titles = yamlWidgetRef.titles
      mfeWidgetRef.category = yamlWidgetRef.widgetCategory
    }

    return microfrontend
  }

  private static parseWidgetDescriptor(
    widgetPath: string
  ): YamlWidgetDescriptorV1 | YamlWidgetConfigDescriptorV1 | Error {
    try {
      const widgetYaml = fs.readFileSync(widgetPath, 'utf-8')
      return YAML.parse(widgetYaml)
    } catch (error) {
      return new Error(
        `Failed to parse widget descriptor: ${(error as Error).message}`
      )
    }
  }

  private static copyCustomFtl(
    from: string,
    to: string,
    customUiPath: string,
    customFtlName: string
  ) {
    let customFtlPath = customUiPath
    if (!path.isAbsolute(customUiPath)) {
      customFtlPath = path.resolve(path.parse(from).dir, customUiPath)
    }

    if (!fs.existsSync(to)) {
      fs.mkdirSync(to)
    }

    fs.copyFileSync(
      path.resolve(customFtlPath),
      path.resolve(to, customFtlName)
    )
  }
}
