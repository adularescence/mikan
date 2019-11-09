import { ParamsDictionary, Request } from "express-serve-static-core";

declare interface RequestConstraints {
  body: {
    maxLength: number,
    minLength: number
  };
  params: {
    maxLength: number,
    minLength: number
  };
  query: {
    maxLength: number,
    minLength: number
  };
}

const constraintsFactory = (
  bodyMin: number, bodyMax: number,
  paramMin: number, paramMax: number,
  queryMin: number, queryMax: number
): RequestConstraints => {
  return {
    body: {
      maxLength: bodyMax,
      minLength: bodyMin
    },
    params: {
      maxLength: paramMax,
      minLength: paramMin
    },
    query: {
      maxLength: queryMax,
      minLength: queryMin
    }
  };
};

const requestPreCheck = (req: Request<ParamsDictionary>, constraints: RequestConstraints): string => {
  const verdict = [];
  Object.keys(constraints).forEach((key) => {
    const count = Object.keys(req[`${key}`]).length;
    const max = constraints[`${key}`].maxLength;
    const min = constraints[`${key}`].minLength;
    if (count > max) {
      verdict.push(`The number of ${key} arguments exceeds the alloted amount (${count} vs ${max}).`);
    } else if (count < min) {
      verdict.push(`The number of ${key} arguments exceeds the alloted amount (${count} vs ${min}).`);
    }
  });
  return verdict.join(" ");
};

export default {
  constraintsFactory,
  requestPreCheck
};
