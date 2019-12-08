import { ParamsDictionary, Request } from "express-serve-static-core";

declare interface CheckerConstraint {
  arguments: Array<{
    acceptableValues: string[],
    dependencies: {
      body?: Array<{
        condition: any,
        dependency: string
      }>,
      params?: Array<{
        condition: any,
        dependency: string
      }>,
      query?: Array<{
        condition: any,
        dependency: string
      }>,
    },
    isNumber: boolean,
    isRequired: boolean,
    key: string
  }>;
  min: number;
  max: number;
}

declare interface CheckerConstraints {
  body?: CheckerConstraint;
  params?: CheckerConstraint;
  query?: CheckerConstraint;
}

const constraintsFactory = (base: {
  body?: CheckerConstraint,
  params?: CheckerConstraint,
  query?: CheckerConstraint
}): CheckerConstraints => {
  const checkerConstraints: CheckerConstraints = {};
  if (base.body) {
    checkerConstraints.body = base.body;
  }
  if (base.params) {
    checkerConstraints.params = base.params;
  }
  if (base.query) {
    checkerConstraints.query = base.query;
  }
  return checkerConstraints;
};

const requestChecker = (req: Request<ParamsDictionary>, constraints: CheckerConstraints): string => {
  let verdict = ``;
  const dependencyTracker: {
    body: {},
    params: {},
    query: {}
  }
   = {
    body: {},
    params: {},
    query: {}
  };
  const collector: {
    body: {
      badArguments: string[],
      badCount: string
    },
    params: {
      badArguments: string[],
      badCount: string
    },
    query: {
      badArguments: string[],
      badCount: string
    },
  } = {
    body: {
      badArguments: [],
      badCount: ``
    },
    params:  {
      badArguments: [],
      badCount: ``
    },
    query:  {
      badArguments: [],
      badCount: ``
    }
  };
  Object.keys(constraints).forEach((masterKey) => {
    let badCount = collector[`${masterKey}`].badCount;
    const badArguments = collector[`${masterKey}`].badArguments;
    if (constraints.hasOwnProperty(masterKey)) {
      const constraint: CheckerConstraint = constraints[`${masterKey}`];
      const requestValues = Object.values(req[`${masterKey}`]);
      if (requestValues.length < constraint.min) {
        badCount = `The number of ${masterKey} arguments is less than the alloted amount (${requestValues.length} vs ${constraint.min}). `;
      } else if (requestValues.length > constraint.max) {
        badCount = `The number of ${masterKey} arguments is more than the alloted amount (${requestValues.length} vs ${constraint.max}). `;
      }
      constraint.arguments.forEach((arg) => {
        const value = req[`${masterKey}`][`${arg.key}`];
        if (value === undefined) {
          if (arg.isRequired) {
            badArguments.push(`${arg.key}=${value} (required)`);
          }
        } else {
          const badArgumentCount = badArguments.length;
          if (arg.isNumber) {
            if (isNaN(parseInt(value, 10))) {
              badArguments.push(`${arg.key}=${value} (NaN)`);
            }
          } else {
            let foundAcceptableValue = arg.acceptableValues.length === 0;
            for (const acceptableValue of arg.acceptableValues) {
              if (value === acceptableValue) {
                foundAcceptableValue = true;
                break;
              }
            }
            if (!foundAcceptableValue) {
              badArguments.push(`${arg.key}=${value} (acceptable: ${arg.acceptableValues.join(`, `)})`);
            }
          }
          if (badArguments.length === badArgumentCount) {
            Object.keys(arg.dependencies).forEach((argumentType) => {
              arg.dependencies[`${argumentType}`].forEach((dependencyObject: { dependency: string, condition: any}) => {
                if (value === dependencyObject.condition) {
                  dependencyTracker[`${argumentType}`][`${dependencyObject.dependency}`] = arg.key;
                }
              });
            });
          }
        }
      });
    }
    verdict = `${verdict}${badCount}`;
    if (badArguments.length !== 0) {
      verdict = `${verdict}Bad ${masterKey} arguments: ${badArguments.join(`, `)}. `;
    }
  });
  Object.keys(dependencyTracker).forEach((argumentType) => {
    Object.keys(dependencyTracker[`${argumentType}`]).forEach((dependency: string) => {
      // weirdo Request<ParamsDictionary> doesn't have Object.hasOwnProperty(), so this comparison will do
      if (req[`${argumentType}`][`${dependency}`] === undefined) {
        verdict = `${verdict}${dependencyTracker[`${argumentType}`][`${dependency}`]} is dependent on the existance of the ${argumentType} argument of ${dependency}. `;
      }
    });
  });
  return verdict.trim();
};

export default {
  constraintsFactory,
  requestChecker
};
