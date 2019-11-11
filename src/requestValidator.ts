import { ParamsDictionary, Request } from "express-serve-static-core";

declare interface PreCheckerConstraint {
  maxLength: number;
  minLength: number;
}

declare interface PreCheckerConstraints {
  body: PreCheckerConstraint;
  params: PreCheckerConstraint;
  query: PreCheckerConstraint;
}

declare interface CheckerConstraint {
  acceptableValues: string[];
  isNumber: boolean;
  key: string;
  value: any;
}

declare interface CheckerConstraints {
  body?: CheckerConstraint[];
  params?: CheckerConstraint[];
  query?: CheckerConstraint[];
}

const preCheckerConstraintsFactory = (
  bodyMin: number, bodyMax: number,
  paramMin: number, paramMax: number,
  queryMin: number, queryMax: number
): PreCheckerConstraints => {
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

const checkerConstraintsFactory = (
  body?: Array<{
    acceptableValues: string[],
    isNumber: boolean,
    key: string,
    value: any
  }>,
  params?: Array<{
    acceptableValues: string[],
    isNumber: boolean,
    key: string,
    value: any
  }>,
  query?: Array<{
    acceptableValues: string[],
    isNumber: boolean,
    key: string,
    value: any
  }>
): CheckerConstraints => {
  const checkerConstraints: CheckerConstraints = {
    body: [],
    params: [],
    query: []
  };
  if (body) {
    checkerConstraints.body = body;
  }
  if (params) {
    checkerConstraints.params = params;
  }
  if (query) {
    checkerConstraints.query = query;
  }
  return checkerConstraints;
};

const requestPreChecker = (req: Request<ParamsDictionary>, constraints: PreCheckerConstraints): string => {
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

const requestChecker = (req: Request<ParamsDictionary>, constraints: CheckerConstraints): string => {
  const badArguments: {
    body: string[],
    params: string[],
    query: string[]
  } = {
    body: [],
    params: [],
    query: []
  };
  let verdict = ``;

  Object.keys(badArguments).forEach((masterKey) => {
    const badArgumentsList = badArguments[`${masterKey}`];
    constraints[`${masterKey}`].forEach((arg: CheckerConstraint) => {
      const thisKeyVal = `${arg.key}=${arg.value}`;
      if (arg.isNumber) {
        if (isNaN(parseInt(arg.value, 10))) {
          badArgumentsList.push(thisKeyVal);
        }
      } else {
        let foundAcceptableValue = false;
        for (const goodValue in arg.acceptableValues) {
          if (arg.value === goodValue) {
            foundAcceptableValue = true;
            break;
          }
        }
        if (!foundAcceptableValue) {
          badArgumentsList.push(thisKeyVal);
        }
      }
    });
    if (badArgumentsList.length !== 0) {
      verdict = verdict.concat(`Bad ${masterKey} arguments: ${badArgumentsList.join(`, `)}. `);
    }
  });
  return verdict.trim();
};

export default {
  checkerConstraintsFactory,
  preCheckerConstraintsFactory,
  requestChecker,
  requestPreChecker
};
