import { pg } from "auth.json";
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
          isNumber: false,
          isRequired: true,
          key: `seated`
        },
        {
          acceptableValues: [],
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
          isNumber: true,
          isRequired: true,
          key: `adults`
        },
        {
          acceptableValues: [],
          isNumber: true,
          isRequired: true,
          key: `children`
        },
        {
          acceptableValues: [],
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
          isNumber: true,
          isRequired: true,
          key: `id`
        },
      ],
      max: 1,
      min: 1
    }
  }),
  putApiV1TablesNumber: requestValidator.constraintsFactory({
    params: {
      arguments: [
        {
          acceptableValues: [],
          isNumber: true,
          isRequired: true,
          key: `number`
        }
      ],
      max: 1,
      min: 1
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

    // guest with id exists and ${target} has not been filled, so update
    const targetTimestamp = Date.now();
    const innerQueryText = `UPDATE guests SET ${target} = to_timestamp(${targetTimestamp} / 1000.0) WHERE id = ${guestId} RETURNING *`;
    pgClient.query(innerQueryText).then((dbUpdateRes) => {
      return res.status(201).send({
        data: dbUpdateRes.rows[0],
        message: `updated ${target} with timestamp of ${targetTimestamp} for guest with id #${guestId}`,
        success: true
      });
    }).catch((e: Error) => {
      return res.status(400).send({
        message: e.stack,
        query: innerQueryText,
        success: false
      });
    });
  }).catch((e: Error) => {
    return res.status(400).send({
      message: e.stack,
      query: outerQueryText,
      success: false
    });
  });
});

// seat guests at a table
// params:
//   number=(number)
app.put(`/api/v1/tables/:number`, (req, res) => {
  // ensure validity of body/params/query arguments
  const checkerVerdict = requestValidator.requestChecker(req, constraints.putApiV1TablesNumber);
  if (checkerVerdict !== ``) {
    return res.status(400).send({
      message: checkerVerdict,
      success: false
    });
  }

  const tableNumber = parseInt(req.params.number, 10);
  const outerQueryText = `SELECT vacant FROM tables WHERE number = ${tableNumber}`;
  pgClient.query(outerQueryText).then((dbRes) => {
    // table number not found
    if (dbRes.rows.length === 0) {
      return res.status(400).send({
        message: `table #${tableNumber} does not exist`,
        success: false
      });
    }

    // table is not vacant
    if (dbRes.rows[0].vacant === false) {
      return res.status(400).send({
        message: `table #${tableNumber} is not vacant`,
        success: false
      });
    }

    // table number exists and is vacant, so update
    const innerQueryText = `UPDATE tables SET vacant = false WHERE number = ${tableNumber} RETURNING *`;
    pgClient.query(innerQueryText).then((dbUpdateRes) => {
      return res.status(201).send({
        data: dbUpdateRes.rows[0],
        message: `table #${tableNumber} has been seated and is no longer vacant`,
        success: true
      });
    }).catch((e: Error) => {
      return res.status(400).send({
        message: e.stack,
        query: innerQueryText,
        success: false
      });
    });
  }).catch((e: Error) => {
    res.status(400).send({
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
