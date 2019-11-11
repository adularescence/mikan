declare module "requestValidator.ts" {
  export function checkerConstraintsFactory(
    body?: {
      acceptableValues: string[],
      isNumber: boolean,
      key: string,
      value: any
    }[],
    params?: {
      acceptableValues: string[],
      isNumber: boolean,
      key: string,
      value: any
    }[],
    query?: {
      acceptableValues: string[],
      isNumber: boolean,
      key: string,
      value: any
    }[]
  ): CheckerConstraints

  export function preCheckerConstraintsFactory(
    bodyMin: number, bodyMax: number,
    paramMin: number, paramMax: number,
    queryMin: number, queryMax: number
  ): PreCheckerConstraints

  export function requestPreChecker(
    req: Request,
    constraints: PreCheckerConstraints
  ): string

  export function requestChecker(
    req: Request,
    constraints: CheckerConstraints
  ): string
}

declare interface PreCheckerConstraint {
  maxLength: number,
  minLength: number
}

declare interface PreCheckerConstraints {
  body: PreCheckerConstraint,
  params: PreCheckerConstraint,
  query: PreCheckerConstraint
}

declare interface CheckerConstraint {
  acceptableValues: Array<string>,
  isNumber: boolean,
  key: string,
  value: any
}

declare interface CheckerConstraints {
  body?: CheckerConstraint[],
  params?: CheckerConstraint[],
  query?: CheckerConstraint[]
}
