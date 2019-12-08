import bodyParser from "body-parser";
import express from "express";
import Postgres from "pg";
import auth = require("./auth.json");
import requestValidator from "./requestValidator";

const app = express();
const port = 5000;

const pgClient = new Postgres.Client(auth.pg);
pgClient.connect();

// Parse incoming requests' data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// for validating incoming requests' body/params/query arguments
const constraints = {
  // DELETE

  // GET
  getApiV1Guests: requestValidator.constraintsFactory({
    query: {
      arguments: [
        {
          acceptableValues: [
            `false`,
            `true`
          ],
          dependencies: {},
          isNumber: false,
          isRequired: false,
          key: `seated`
        },
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: true,
          isRequired: false,
          key: `count`
        }
      ],
      max: 2,
      min: 0
    }
  }),
  getApiV1Tables: requestValidator.constraintsFactory({
    query: {
      arguments: [
        {
          acceptableValues: [
            `false`,
            `true`
          ],
          dependencies: {},
          isNumber: false,
          isRequired: false,
          key: `vacant`
        },
      ],
      max: 1,
      min: 0
    }
  }),

  // POST
  postApiV1NewGuest: requestValidator.constraintsFactory({
    body: {
      arguments: [
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: true,
          isRequired: true,
          key: `adults`
        },
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: true,
          isRequired: true,
          key: `children`
        },
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: false,
          isRequired: true,
          key: `name`
        }
      ],
      max: 3,
      min: 3
    }
  }),

  // PUT
  putApiV1GuestsId: requestValidator.constraintsFactory({
    body: {
      arguments: [
        {
          acceptableValues: [
            `seated`,
            `ordered`,
            `served`,
            `exited`
          ],
          dependencies: {
            query: [
              {
                condition: `seated`,
                dependency: `tableNumber`
              }
            ]
          },
          isNumber: false,
          isRequired: true,
          key: `target`
        }
      ],
      max: 1,
      min: 1
    },
    params: {
      arguments: [
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: true,
          isRequired: true,
          key: `id`
        },
      ],
      max: 1,
      min: 1
    },
    query: {
      arguments: [
        {
          acceptableValues: [],
          dependencies: {},
          isNumber: true,
          isRequired: false,
          key: `tableNumber`
        }
      ],
      max: 1,
      min: 0
    }
  })
};

/* DELETE */

// nothing here yet

/* GET */

// table list
// query:
//   vacant?=(true,false)
app.get(`/api/v1/tables`, (req, res) => {
  // ensure validity of body/params/query arguments
  const checkerVerdict = requestValidator.requestChecker(req, constraints.getApiV1Tables);
  if (checkerVerdict !== ``) {
    return res.status(400).send({
      message: checkerVerdict,
      success: false
    });
  }

  let queryText = `SELECT * FROM TABLES`;
  const queryHelper = [];
  if (req.query.vacant !== undefined) {
    queryHelper.push(`vacant = ${req.query.vacant === `true`}`);
  }
  if (queryHelper.length !== 0) {
    queryText = `${queryText} WHERE ${queryHelper.join(` AND `)}`;
  }
  pgClient.query(queryText).then((dbRes) => {
    return res.status(200).send({
      data: dbRes.rows,
      message: `tables retrieved successfully`,
      success: `true`
    });
  }).catch((e: Error) => {
    return res.status(400).send({
      message: e.stack,
      query: queryText,
      success: false
    });
  });
});

// guest list
// query:
//   count?=(number)
//   seated?=(true,false)
app.get(`/api/v1/guests`, (req, res) => {
  // ensure validity of body/params/query arguments
  const checkerVerdict = requestValidator.requestChecker(req, constraints.getApiV1Guests);
  if (checkerVerdict !== ``) {
    return res.status(400).send({
      message: checkerVerdict,
      success: false
    });
  }

  let queryText = `SELECT * FROM guests`;
  const queryHelper = [];
  if (req.query.count !== undefined) {
    queryHelper.push(`(children + adults) = ${parseInt(req.query.count, 10)}`);
  }
  if (req.query.seated !== undefined) {
    queryHelper.push(`seated IS ${req.query.seated === `true` ? `NOT NULL` : `NULL`}`);
  }
  if (queryHelper.length !== 0) {
    queryText = `${queryText} WHERE ${queryHelper.join(` AND `)}`;
  }
  pgClient.query(queryText).then((dbRes) => {
    return res.status(200).send({
      data: dbRes.rows,
      message: `guest list retrieved successfully`,
      success: true
    });
  }).catch((e: Error) => {
    return res.status(400).send({
      message: e.stack,
      query: queryText,
      success: false
    });
  });
});

/* POST */

// add guest
// body:
//   adults=(number)
//   children=(number)
//   name=(any)
app.post(`/api/v1/newGuest`, (req, res) => {
  // ensure validity of body/params/query arguments
  const checkerVerdict = requestValidator.requestChecker(req, constraints.postApiV1NewGuest);
  if (checkerVerdict !== ``) {
    return res.status(400).send({
      message: checkerVerdict,
      success: false
    });
  }

  const adults = parseInt(req.body.adults, 10);
  const children = parseInt(req.body.children, 10);
  const name = req.body.name;
  // entry timestamp created here
  // or should it be created in the app?
  const entered = Date.now();

  const queryText = `INSERT INTO guests (name, adults, children, entered) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0)) RETURNING *`;
  const queryValues = [name, adults, children, entered];
  pgClient.query(queryText, queryValues).then((dbRes) => {
    const newGuest = dbRes.rows[0];
    return res.status(201).send({
      data: newGuest,
      message: `Guest with name ${newGuest.name}, entered at ${newGuest.entered} (epoch ${Date.parse(newGuest.entered)}), and with ${newGuest.adults} adults and ${newGuest.children} children added to the guest list`,
      success: true
    });
  }).catch((e: Error) => {
    res.status(400).send({
      message: e.stack,
      query: queryText,
      success: false,
      values: queryValues.join(" ")
    });
  });
});

/* PUT */

// update guest timestamp
// body:
//   target=(seated,ordered,served,exited)
// params:
//   id=(number)
// query:
//   tableNumber?(target=seated)=(number)
app.put(`/api/v1/guests/:id`, (req, res) => {
  // ensure validity of body/params/query arguments
  const checkerVerdict = requestValidator.requestChecker(req, constraints.putApiV1GuestsId);
  if (checkerVerdict !== ``) {
    return res.status(400).send({
      message: checkerVerdict,
      success: false
    });
  }

  const guestId = parseInt(req.params.id, 10);
  const target = req.body.target;
  const outerQueryText = `SELECT ${target} FROM guests WHERE id = ${guestId}`;
  pgClient.query(outerQueryText).then((dbRes) => {
    // guest with id not found
    if (dbRes.rows.length === 0) {
      return res.status(400).send({
        message: `guest with id #${guestId} not found`,
        success: false
      });
    }

    // guest's ${target} already has a timestamp
    if (dbRes.rows[0][`${target}`] !== null) {
      return res.status(400).send({
        message: `guest already has a timestamp for '${target}'`,
        success: false
      });
    }

    const updateGuest = (extraInfo?: string) => {
      // guest with id exists and ${target} has not been filled, so update
      const targetTimestamp = Date.now();
      const queryText = `UPDATE guests SET ${target} = to_timestamp(${targetTimestamp} / 1000.0) WHERE id = ${guestId} RETURNING *`;
      pgClient.query(queryText).then((dbUpdateRes) => {
        return res.status(201).send({
          data: dbUpdateRes.rows[0],
          message: `Updated ${target} with timestamp of ${targetTimestamp} for guest with id #${guestId}.${extraInfo}`,
          success: true
        });
      }).catch((e: Error) => {
        return res.status(400).send({
          message: e.stack,
          query: queryText,
          success: false
        });
      });
    };

    const updateTable = (targetVacancy: boolean) => {
      const tableUpdateQueryText = `UPDATE tables SET vacant = ${targetVacancy} WHERE number = ${tableNumber} RETURNING *`;
      pgClient.query(tableUpdateQueryText).then((tableUpdateRes) => {
        const extraInfo = targetVacancy === true ?
          ` Seated at table #${tableUpdateRes.rows[0].number}.` :
          ` Guests at table #${tableUpdateRes.rows[0].number} have left.`;
        updateGuest(extraInfo);
      }).catch((e: Error) => {
        return res.status(400).send({
          message: e.stack,
          query: tableUpdateQueryText,
          success: false
        });
      });
    };

    const tableNumber = req.query.tableNumber;
    if (target === `seated`) {
      const vacancyQueryText = `SELECT vacant FROM tables WHERE number = ${tableNumber}`;
      pgClient.query(vacancyQueryText).then((vacancyRes) => {
        if (vacancyRes.rows[0].vacant === false) {
          return res.status(400).send({
            message: `table #${tableNumber} is not vacant and guests could not be seated`,
            success: false
          });
        } else {
          updateTable(false);
        }
      }).catch((e: Error) => {
        return res.status(400).send({
          message: e.stack,
          query: vacancyQueryText,
          success: false
        });
      });
    } else if (target === `exited`) {
      if (tableNumber === undefined) {
        // lack of tableNumber indicates that guest left before being seated (maybe waited too long, or they're busy)
        // need to update guest entry only
        updateGuest(` They seem to have left before being seated.`);
      } else {
        // presence of tableNumber indicates that guest has been seated
        // need to update table and guest entries
        updateTable(true);
      }
    } else {
      updateGuest();
    }
  }).catch((e: Error) => {
    return res.status(400).send({
      message: e.stack,
      query: outerQueryText,
      success: false
    });
  });
});

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server running on port ${port}`);
});
