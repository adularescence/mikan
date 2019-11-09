declare module "requestValidator.ts" {
  export function constraintsFactory(
    bodyMin: number, bodyMax: number,
    paramMin: number, paramMax: number,
    queryMin: number, queryMax: number
  ): RequestConstraints

  export function requestPreCheck(
    req: Request,
    constraints: RequestConstraints
  ): string
}

declare type RequestConstraints = {
  body: {
    maxLength: number,
    minLength: number
  },
  params: {
    maxLength: number,
    minLength: number
  },
  query: {
    maxLength: number,
    minLength: number
  }
}