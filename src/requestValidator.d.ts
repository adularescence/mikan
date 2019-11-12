import { ParamsDictionary, Request } from "express-serve-static-core";

declare module "requestValidator.ts" {
  export function checkerConstraintsFactory(base: {
    body?: CheckerConstraint,
    params?: CheckerConstraint,
    query?: CheckerConstraint
  }): CheckerConstraints

  export function requestChecker(
    req: Request<ParamsDictionary>,
    constraints: CheckerConstraints
  ): string
}

declare interface CheckerConstraint {
  arguments: Array<{
    acceptableValues: string[],
    isNumber: boolean,
    isRequired: boolean,
    key: string
  }>,
  min: number,
  max: number
}

declare interface CheckerConstraints {
  body?: CheckerConstraint;
  params?: CheckerConstraint;
  query?: CheckerConstraint;
}
