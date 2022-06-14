import { CLIError } from '@oclif/errors'

// Extracts the type wrapped by an array type
type TypeOfArray<T> = T extends Array<infer A> ? A : never

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

class PropertyDependencyError extends JsonValidationError {
  constructor(message: string, jsonPath: JsonPath) {
    super(message.replace(/\n/g, '\n\t'), jsonPath)
  }
}

// Type that is equal to true if an object property is required and false otherwise.
// It is used to enforce the required value, so that it is not possible to set it to true
// if the constrained property is optional and vice-versa
type IsRequired<T, K extends keyof T> = undefined extends T[K] ? false : true

// Type with each property having a key that exists in `T` except `K`, and each value a `Validator[]`.
// i.e. `K` depends on one or more properties of `T` excluding itself
type DependsOn<T, K extends keyof T> = {
  [H in keyof Required<Omit<T, K>>]?: Validator[]
}

// function that throws a JsonValidationError if the field doesn't match the constraint
export type Validator = (key: string, field: any, jsonPath: JsonPath) => void

// Represents validation constraints on a type
export type ObjectConstraints<T = any> = {
  [K in keyof Required<T>]: Exclude<T[K], undefined> extends any[]
    ? ArrayConstraints<T, K>
    : Exclude<T[K], undefined> extends Primitive
    ? PrimitiveConstraints<T, K>
    : ChildObjectConstraints<T, K>
}

// Constraints for union types (e.g. <A | B>)
export type UnionTypeConstraints<T> = Array<ObjectConstraints<T>>

// Constraints for nested object types
type ChildObjectConstraints<T, K extends keyof T> = {
  required: IsRequired<T, K>
  children: Exclude<
    ObjectConstraints<T[K]> | UnionTypeConstraints<T[K]>,
    undefined
  >
  validators?: Validator[]
  dependsOn?: DependsOn<T, K>
}

type PrimitiveConstraints<T, K extends keyof T> = {
  required: IsRequired<T, K>
  type: TypeOf<T[K]>
  validators?: Validator[]
  dependsOn?: DependsOn<T, K>
}

type BaseArrayConstraints<T, K extends keyof T> = {
  isArray: true
  required: IsRequired<T, K>
  dependsOn?: DependsOn<T, K>
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
      throw new JsonValidationError(
        `Field "${key}" is not valid. ${message}`,
        jsonPath
      )
    }
  }
}

export function required(
  key: string,
  field: unknown,
  jsonPath: JsonPath
): void {
  if (field === undefined) {
    throw new JsonValidationError(`Field "${key}" is required`, jsonPath)
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
  const errors: JsonValidationError[] = []

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

    try {
      if (isArrayConstraints(constraint)) {
        validateArrayConstraints(key, value, constraint, newJsonPath)
      } else if (isPrimitiveConstraints(constraint)) {
        validatePrimitiveConstraints(key, value, constraint, newJsonPath)
      } else {
        applyValidators(key, value, constraint, newJsonPath)
        validateConstraints(value, constraint.children, newJsonPath)
      }

      if (constraint.dependsOn) {
        applyDependsOnValidators(
          parsedObject,
          key,
          constraint.dependsOn,
          jsonPath
        )
      }
    } catch (error) {
      if (error instanceof PropertyDependencyError) {
        throw error
      }

      errors.push(error as JsonValidationError)
    }
  }

  if (errors.length > 0) throw errors[0]
}

function validateUnionTypeConstraints<T>(
  parsedObject: any,
  constraints: UnionTypeConstraints<T>,
  jsonPath: JsonPath
): void {
  const errors: JsonValidationError[] = []

  for (const constraint of constraints) {
    try {
      validateConstraints(parsedObject, constraint, jsonPath)
    } catch (error) {
      if (error instanceof PropertyDependencyError) {
        throw error
      }

      errors.push(error as JsonValidationError)
    }
  }

  if (errors.length > 0 && errors.length === constraints.length) {
    // validation failed for all allowed types
    const messageArr = [`Fix one of the following errors:`]
    for (const error of errors) {
      messageArr.push(`* ${error.message.split('\n').join('\n  ')}`)
    }

    // formats error message by removing duplicates
    const formattedMessage = [...new Set(messageArr)].join('\n')

    throw new CLIError(formattedMessage)
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

function applyDependsOnValidators<T>(
  parsedObject: any,
  key: string,
  dependsOn: DependsOn<T, keyof T>,
  jsonPath: JsonPath
): void {
  const dependsOnKeys = Object.keys(dependsOn) as Array<keyof typeof dependsOn>

  for (const dependsOnKey of dependsOnKeys) {
    const validators: Validator[] = dependsOn[dependsOnKey] || []
    for (const validator of validators) {
      try {
        validator(dependsOnKey, parsedObject[dependsOnKey], [
          ...jsonPath,
          dependsOnKey
        ])
      } catch (error) {
        throw new PropertyDependencyError(
          `Field "${key}" depends on field "${dependsOnKey}" with validation:\n${
            (error as JsonValidationError).message
          }`,
          [...jsonPath, key]
        )
      }
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
  return Array.isArray(constraints as UnionTypeConstraints<T>)
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
