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

/* DELETE */

// delete an entry
// app.delete(`/api/v1/waitTimes/:guests`, (req, res) => {
//   const guests = parseInt(req.params.guests, 10);
//   const timestamp = parseInt(req.query.timestamp, 10);

//   for (let i = 0; i < waitTimes.length; i++) {
//     if (db[i].guests === guests && db[i].timestamp === timestamp) {
//       const removedEntry = waitTimes.splice(i, 1);
//       return res.status(200).send({
//         data: removedEntry,
//         message: `deleted entry with a guest count of ${guests} and a timestamp of ${timestamp} successfully`,
//         success: `true`
//       });
//     }
//   }

//   return res.status(404).send({
//     message: `no entry found for a guest count of ${guests} and a timestamp of ${timestamp}`,
//     success: false
//   });
// });

/* GET */

// all
// app.get(`/api/v1/waitTimes`, (req, res) => {
//   res.status(200).send({
//     data: waitTimes,
//     message: `wait times retrieved successfully`,
//     success: `true`
//   });
// });

// for n guests
// app.get(`/api/v1/waitTimes/:guests`, (req, res) => {
//   const guests = parseInt(req.params.guests, 10);
//   // the code i copied was ancient so have a placeholder
//   const results = [];
//   if (results.length !== 0) {
//     return res.status(200).send({
//       data: results,
//       message: `wait times for a guest count of ${guests} retrieved successfully`,
//       success: `true`,
//     });
//   } else {
//     return res.status(404).send({
//       message: `there are no wait times for a guest count of ${guests}`,
//       success: false
//     });
//   }
// });

// guest list
// app.get(`/api/v1/guestList`, (req, res) => {
//   res.status(200).send({
//     data: guestList,
//     message: `guest list retrieved successfully`,
//     success: `true`
//   });
// });

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

  // if bad "vacant" query argument
  const vacancyQuery = req.query.vacant;
  if (vacancyQuery !== undefined && (vacancyQuery !== `false` && vacancyQuery !== `true`)) {
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

// add a new entry
// app.post(`/api/v1/waitTimes`, (req, res) => {
//   if (!req.body.guests) {
//     return res.status(400).send({
//       message: `guest count required`,
//       success: false
//     });
//   }
//   if (!req.body.timestamp) {
//     return res.status(400).send({
//       message: `timestamp is required`,
//       success: false
//     });
//   }
//   if (!req.body.table) {
//     return res.status(400).send({
//       message: `table number is required`,
//       success: false
//     });
//   }

//   const newEntry = {
//     guests: parseInt(req.body.guests, 10),
//     table: req.body.table,
//     timestamp: req.body.timestamp
//   };
//   waitTimes.push(newEntry);
//   return res.status(201).send({
//     data: newEntry,
//     message: `entry added successfully`,
//     success: `true`
//   });
// });

// add to guest list
// app.post(`/api/v1/guestList`, (req, res) => {
//   if (!req.body.name) {
//     return res.status(400).send({
//       message: `guest name is required`,
//       success: false
//     });
//   }
//   if (!req.body.count) {
//     return res.status(400).send({
//       message: `number of guests is required`,
//       success: false
//     });
//   }
//   if (!req.body.adults) {
//     return res.status(400).send({
//       message: `number of adults is required`,
//       success: false
//     });
//   }
//   if (!req.body.children) {
//     return res.status(400).send({
//       message: `number of children is required`,
//       success: false
//     });
//   }

//   const newGuest = {
//     adults: req.body.adults,
//     children: req.body.children,
//     count: req.body.count,
//     name: req.body.name
//   };
//   guestList.push(newGuest);
//   return res.status(201).send({
//     data: newGuest,
//     message: `added ${req.body.name} to guest list, position ${guestList.length + 1}`,
//     success: `true`
//   });
// });

/* PUT */

// update a guest entry
// app.put(`/api/v1/waitTimes/:guests`, (req, res) => {
//   const guests = parseInt(req.params.guests, 10);
//   const timestamp = parseInt(req.query.timestamp, 10);
//   let foundIndex = -1;

//   for (let i = 0; i < db.length; i++) {
//     if (db[i].guests === guests && db[i].timestamp === timestamp) {
//       foundIndex = i;
//       break;
//     }
//   }

//   if (foundIndex === -1) {
//     return res.status(404).send({
//       message: `no entry found for a guest count of ${guests} and a timestamp of ${timestamp}`,
//       success: false
//     });
//   }
//   if (!req.body.table) {
//     return res.status(400).send({
//       message: `table number is required`,
//       success: false
//     });
//   }

//   const updatedEntry = {
//     guests,
//     table: parseInt(req.body.table, 10),
//     timestamp,
//   };
//   db.waitTimes.splice(foundIndex, 1, updatedEntry);
//   res.status(201).send({
//     data: updatedEntry,
//     messasge: `entry with a guest count of ${guests} and a
//       timestamp of ${timestamp} updated to have table ${req.body.table}`,
//     success: `true`
//   });
// });

// seat guests at a table
// bad api endpoint naming, update later lmao
// probably need to pass in a guest later
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
