import { CLIError } from '@oclif/errors'

// Extracts the type wrapped by an array type
type TypeOfArray<T> = T extends Array<infer A>
  ? A extends string
    ? 'string'
    : A
  : never

// Type used to validate expected typeof
type TypeOf<T> = T extends string
  ? 'string'
  : T extends boolean
  ? 'boolean'
  : T extends number
  ? 'number'
  : T extends any[]
  ? TypeOfArray<T>
  : 'object'

type Primitive = string | boolean | number

export type JsonPath = Array<string | number>

export class JsonValidationError extends CLIError {
  public readonly jsonPath: string

  constructor(message: string, jsonPath: JsonPath) {
    const formattedJsonPath = JsonValidationError.formatJsonPath(jsonPath)
    super(`${message}\nPosition: ${formattedJsonPath}`)
    this.jsonPath = formattedJsonPath
  }

  static formatJsonPath(jsonPath: JsonPath): string {
    let format = '$'
    for (const path of jsonPath) {
      format += typeof path === 'string' ? `.${path}` : `[${path}]`
    }

    return format
  }
}

class PrioritizedValidationError extends JsonValidationError {}

export const UNION_TYPE_ERROR_MESSAGE = 'Fix one of the following errors:'
class UnionTypeError extends CLIError {
  constructor(errors: JsonValidationError[]) {
    // Removing duplicates
    const uniqueErrorMessages = [...new Set(errors.map(e => e.message))]
    if (uniqueErrorMessages.length === 1) {
      super(uniqueErrorMessages[0])
    } else {
      const messageArr = [UNION_TYPE_ERROR_MESSAGE]
      for (const errorMessage of uniqueErrorMessages) {
        messageArr.push(`* ${errorMessage.split('\n').join('\n  ')}`)
      }

      super(messageArr.join('\n'))
    }
  }
}

// Type that is equal to true if an object property is required and false otherwise.
// It is used to enforce the required value, so that it is not possible to set it to true
// if the constrained property is optional and vice-versa
type IsRequired<T, K extends keyof T> = undefined extends T[K] ? false : true

type Field = { key: string; value?: any }

// function that throws a JsonValidationError if the field doesn't match the constraint
export type Validator = (key: string, field: any, jsonPath: JsonPath) => void

export type UnionTypeValidator = (object: any, jsonPath: JsonPath) => void

// Represents validation constraints on a type
export type ObjectConstraints<T = any> = {
  [K in keyof Required<T>]: Exclude<T[K], undefined> extends any[]
    ? ArrayConstraints<T, K>
    : Exclude<T[K], undefined> extends Primitive
    ? PrimitiveConstraints<T, K>
    : ChildObjectConstraints<T, K>
}

// Constraints for union types (e.g. <A | B>)
export type UnionTypeConstraints<T> = {
  constraints: Array<ObjectConstraints<T>>
  validators?: UnionTypeValidator[]
}

// Constraints for nested object types
type ChildObjectConstraints<T, K extends keyof T> = {
  required: IsRequired<T, K>
  children: Exclude<
    ObjectConstraints<T[K]> | UnionTypeConstraints<T[K]>,
    undefined
  >
  validators?: Validator[]
}

type PrimitiveConstraints<T, K extends keyof T> = {
  required: IsRequired<T, K>
  type: TypeOf<T[K]>
  validators?: Validator[]
}

type BaseArrayConstraints<T, K extends keyof T> = {
  isArray: true
  required: IsRequired<T, K>
}

type PrimitiveArrayConstraints<T, K extends keyof T> =
  | BaseArrayConstraints<T, K> & PrimitiveConstraints<T, K>

type ObjectArrayConstraints<T, K extends keyof T> =
  | BaseArrayConstraints<T, K> & {
      children:
        | ObjectConstraints<TypeOfArray<T[K]>>
        | UnionTypeConstraints<TypeOfArray<T[K]>>
    }

type ArrayConstraints<T, K extends keyof T> =
  | PrimitiveArrayConstraints<T, K>
  | ObjectArrayConstraints<T, K>

// Validators

export function regexp(regexp: RegExp, message: string): Validator {
  return function (key: string, field: any, jsonPath: JsonPath): void {
    if (!regexp.test(field)) {
      throw new PrioritizedValidationError(
        `Field "${key}" is not valid. ${message}`,
        jsonPath
      )
    }
  }
}

export function values(
  iterable: { [s: string]: unknown } | ArrayLike<unknown>
): Validator {
  return function (key: string, field: any, jsonPath: JsonPath): void {
    if (!Object.values(iterable).includes(field)) {
      throw new JsonValidationError(
        `Field "${key}" is not valid. Allowed values are: ${Object.values(
          iterable
        ).join(', ')}`,
        jsonPath
      )
    }
  }
}

export function isMapOfStrings(
  key: string,
  field: unknown,
  jsonPath: JsonPath
): void {
  for (const [index, value] of Object.entries(field as any)) {
    if (typeof index !== 'string' || typeof value !== 'string') {
      throw new JsonValidationError(
        `Field "${key}" is not valid. Should be a key-value map of strings`,
        jsonPath
      )
    }
  }
}

export function fieldDependsOn(
  field: Field,
  dependsOnField: Field
): UnionTypeValidator {
  return function (object: any, jsonPath: JsonPath) {
    if (
      (field.value !== undefined && object[field.key] === field.value) ||
      (field.value === undefined && object[field.key] !== undefined)
    ) {
      let message = `Field "${field.key}"`
      if (field.value) message += ` with value "${field.value}"`

      if (dependsOnField.value === undefined) {
        if (object[dependsOnField.key] === undefined) {
          message += ` requires field "${dependsOnField.key}" to have a value`
          throw new PrioritizedValidationError(message, jsonPath)
        }
      } else if (object[dependsOnField.key] !== dependsOnField.value) {
        message += ` requires field "${dependsOnField.key}" to have value: ${dependsOnField.value}`
        throw new PrioritizedValidationError(message, jsonPath)
      }
    }
  }
}

export function mutualDependency(
  field1: Field,
  field2: Field
): UnionTypeValidator {
  return function (...args) {
    fieldDependsOn(field1, field2)(...args)
    fieldDependsOn(field2, field1)(...args)
  }
}

export class ConstraintsValidatorService {
  public static validateObjectConstraints<T>(
    parsedObject: unknown,
    constraints: ObjectConstraints<T>
  ): T {
    validateConstraints(parsedObject, constraints)
    return parsedObject as T
  }
}

function validateConstraints<T>(
  parsedObject: any,
  constraints: ObjectConstraints<T> | UnionTypeConstraints<T>,
  jsonPath: JsonPath = []
): void {
  if (isUnionTypeConstraints(constraints)) {
    validateUnionTypeConstraints(parsedObject, constraints, jsonPath)
  } else {
    validateObjectTypeConstraints(parsedObject, constraints, jsonPath)
  }
}

function validateObjectTypeConstraints<T>(
  parsedObject: any,
  constraints: ObjectConstraints<T>,
  jsonPath: JsonPath
): void {
  for (const [key, unknownConstraint] of Object.entries(constraints)) {
    const constraint = unknownConstraint as
      | PrimitiveConstraints<T, keyof T>
      | ArrayConstraints<T, keyof T>
      | ChildObjectConstraints<T, keyof T>

    const newJsonPath = [...jsonPath, key]

    const value: any = parsedObject[key]

    if (value === undefined) {
      if (constraint.required) {
        throw new JsonValidationError(`Field "${key}" is required`, newJsonPath)
      }

      continue
    }

    if (isArrayConstraints(constraint)) {
      validateArrayConstraints(key, value, constraint, newJsonPath)
    } else if (isPrimitiveConstraints(constraint)) {
      validatePrimitiveConstraints(key, value, constraint, newJsonPath)
    } else {
      applyValidators(key, value, constraint, newJsonPath)
      validateConstraints(value, constraint.children, newJsonPath)
    }
  }
}

function validateUnionTypeConstraints<T>(
  parsedObject: any,
  { constraints, validators }: UnionTypeConstraints<T>,
  jsonPath: JsonPath
): void {
  if (validators) {
    for (const validator of validators) validator(parsedObject, jsonPath)
  }

  const errors: JsonValidationError[] = []
  const matchedKeyCounts: number[] = []
  let maxMatchedKeyCount = 0

  for (const constraint of constraints) {
    let matchedKeyCount = 0
    for (const key of Object.keys(constraint)) {
      if (parsedObject[key] !== undefined) {
        matchedKeyCount++
      }
    }

    if (maxMatchedKeyCount < matchedKeyCount) {
      maxMatchedKeyCount = matchedKeyCount
    }

    matchedKeyCounts.push(matchedKeyCount)
  }

  let matchedConstraintCount = 0

  // Includes only errors that match the constraint objects with the most number of keys
  // that exist in the parsed object
  for (const [idx, matchedKeyCount] of matchedKeyCounts.entries()) {
    if (matchedKeyCount === maxMatchedKeyCount) {
      try {
        validateConstraints(parsedObject, constraints[idx], jsonPath)
      } catch (error) {
        if (error instanceof PrioritizedValidationError) {
          throw error
        }

        if (error instanceof UnionTypeError) {
          // avoid nested union type errors
          throw error
        }

        errors.push(error as JsonValidationError)
      }

      matchedConstraintCount++
    }
  }

  // Checks if validation failed for all allowed types
  if (errors.length > 0 && errors.length === matchedConstraintCount) {
    // Validation failed for all allowed types
    throw new UnionTypeError(errors)
  }
}

function validatePrimitiveConstraints<T>(
  key: string,
  value: any,
  constraint: PrimitiveConstraints<T, keyof T>,
  jsonPath: JsonPath
): void {
  if (value !== undefined && typeof value !== constraint.type) {
    throw new JsonValidationError(
      `Field "${key}" is not valid. Should be a ${constraint.type}`,
      jsonPath
    )
  }

  applyValidators(key, value, constraint, jsonPath)
}

function applyValidators<T>(
  key: string,
  value: any,
  constraint:
    | PrimitiveConstraints<T, keyof T>
    | ChildObjectConstraints<T, keyof T>,
  jsonPath: JsonPath
): void {
  if (constraint.validators) {
    for (const validator of constraint.validators) {
      validator(key, value, jsonPath)
    }
  }
}

function validateArrayConstraints<T>(
  key: string,
  value: any,
  constraint: ArrayConstraints<T, keyof T>,
  jsonPath: JsonPath
): void {
  if (Array.isArray(value)) {
    for (const [index, element] of Object.entries(value)) {
      const arrayPath = [...jsonPath, Number.parseInt(index, 10)]
      if (isObjectArrayConstraints(constraint)) {
        validateConstraints(element, constraint.children, arrayPath)
      } else {
        validatePrimitiveConstraints(key, element, constraint, arrayPath)
      }
    }
  } else {
    throw new JsonValidationError(`Field "${key}" should be an array`, jsonPath)
  }
}

// type guards

function isUnionTypeConstraints<T>(
  constraints: ObjectConstraints<T> | UnionTypeConstraints<T>
): constraints is UnionTypeConstraints<T> {
  return Array.isArray((constraints as UnionTypeConstraints<T>).constraints)
}

function isPrimitiveConstraints<T>(
  constraints:
    | PrimitiveConstraints<T, keyof T>
    | ArrayConstraints<T, keyof T>
    | ChildObjectConstraints<T, keyof T>
): constraints is PrimitiveConstraints<T, keyof T> {
  return (constraints as PrimitiveConstraints<T, keyof T>).type !== undefined
}

function isObjectArrayConstraints<T>(
  constraint: ArrayConstraints<T, keyof T>
): constraint is ObjectArrayConstraints<T, keyof T> {
  return (
    (constraint as ObjectArrayConstraints<T, keyof T>).children !== undefined
  )
}

function isArrayConstraints<T>(
  constraint:
    | PrimitiveConstraints<T, keyof T>
    | ArrayConstraints<T, keyof T>
    | ChildObjectConstraints<T, keyof T>
): constraint is ArrayConstraints<T, keyof T> {
  return (constraint as ArrayConstraints<T, keyof T>).isArray === true
}
