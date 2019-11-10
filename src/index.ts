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

declare interface Table {
  count: number;
  number: number;
  type: string;
  vacant: boolean;
}

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* GET */

// table list
app.get(`/api/v1/tables`, (req, res) => {
  const constraints = requestValidator.constraintsFactory(0, 0, 0, 0, 0, 1);
  const preCheckVerdict = requestValidator.requestPreCheck(req, constraints);

  // if bad body/params/query arguments
  if (preCheckVerdict !== ``) {
    return res.status(400).send({
      message: preCheckVerdict,
      success: false
    });
  }

  const vacancyQuery = req.query.vacant;

  // if missing "vacant" query argument
  if (vacancyQuery === undefined) {
    const keyval = Object.entries(req.query)[0];
    return res.status(400).send({
      message: `Missing 'vacant' query argument. The request's query argument is ${keyval[0]}=${keyval[1]}`,
      success: false
    });
  }

  // if bad "vacant" query argument
  if (vacancyQuery !== `false` && vacancyQuery !== `true`) {
    return res.status(400).send({
      message: `vacant must be either 'true' or 'false' (case-sensitive)`,
      success: false
    });
  }

  // it's safe to query the database now

  // if request wants tables that are (not) vacant
  if (vacancyQuery !== undefined && (vacancyQuery === `false` || vacancyQuery === `true`)) {
    return pgClient.query(`SELECT * FROM tables WHERE vacant = ${vacancyQuery}`).then ((dbRes) => {
      res.status(200).send({
        data: dbRes.rows,
        message: `tables with vacant = '${vacancyQuery}' retrieved successfully`,
        success: `true`
      });
    }).catch((e: Error) => {
      return res.status(400).send({
        message: e.stack,
        success: false
      });
    });
  }

  // just send the table list
  pgClient.query(`SELECT * FROM tables`).then((dbRes) => {
    return res.status(200).send({
      data: dbRes.rows,
      message: `tables retrieved successfully`,
      success: `true`
    });
  }).catch((e: Error) => {
    return res.status(400).send({
      message: e.stack,
      success: false
    });
  });
});

/* POST */

// add guest

app.post(`/api/v1/newGuest`, (req, res) => {
  const constraints = requestValidator.constraintsFactory(3, 3, 0, 0, 0, 0);
  const preCheckVerdict = requestValidator.requestPreCheck(req, constraints);
  if (preCheckVerdict !== ``) {
    return res.status(400).send({
      message: preCheckVerdict,
      success: false
    });
  }

  const name = req.body.name;
  const adults = parseInt(req.body.adults, 10);
  const children = parseInt(req.body.children, 10);
  if (isNaN(adults) || isNaN(children)) {
    return res.status(400).send({
      message: `be sure to use numbers for # of adults/children (${adults}/${children})`,
      success: false
    });
  }
  // entry timestamp created here
  // or should it be created in the app?
  const entered = Date.now();

  const text = `INSERT INTO guests (name, adults, children, entered) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0)) RETURNING *`;
  const values = [name, adults, children, entered];
  pgClient.query(text, values).then((dbRes) => {
    const newGuest = dbRes.rows[0];
    return res.status(201).send({
      data: newGuest,
      message: `Guest with name ${newGuest.name}, entered at ${newGuest.entered} (epoch ${Date.parse(newGuest.entered)}), and with ${newGuest.adults} adults and ${newGuest.children} children added to the guest list`,
      success: true
    });
  });
});

/* PUT */

// seat guests at a table
app.put(`/api/v1/tables/:number`, (req, res) => {
  const constraints = requestValidator.constraintsFactory(0, 0, 1, 1, 0, 0);
  const preCheckVerdict = requestValidator.requestPreCheck(req, constraints);
  if (preCheckVerdict !== ``) {
    return res.status(400).send({
      message: preCheckVerdict,
      success: false
    });
  }

  // ensure table number is a number
  const tableNumber = parseInt(req.params.number, 10);
  if (isNaN(tableNumber)) {
    return res.status(400).send({
      message: `${req.params.number} is ${tableNumber}`,
      succes: false
    });
  }

  pgClient.query(`SELECT vacant FROM tables WHERE number = ${tableNumber}`).then((dbRes) => {
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
    pgClient.query(`UPDATE tables SET vacant = false WHERE number = ${tableNumber} RETURNING *`).then((dbUpdateRes) => {
      return res.status(201).send({
        data: dbUpdateRes.rows[0],
        message: `table #${tableNumber} has been seated and is no longer vacant`,
        success: true
      });
    }).catch((e: Error) => {
      return res.status(400).send({
        message: e.stack,
        success: false
      });
    });
  });
});

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server running on port ${port}`);
});
