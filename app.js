const express = require('express');
const db = require('./db/db.js');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



/* GET */

// all
app.get('/api/v1/waitTimes', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'wait times retrieved successfully',
    data: db
  });
});

// for n guests
app.get('/api/v1/waitTimes/:guests', (req, res) => {
  const guests = parseInt(req.params.guests);
  const results = db.map(waitTime => {
    waitTime.guests === guests;
  });
  if (results.length !== 0) {
    return res.status(200).send({
      success: 'true',
      message: `wait times for a guest count of ${guests} retrieved successfully`,
      data: results
    });
  } else {
    return res.status(404).send({
      success: 'false',
      message: `there are no wait times for a guest count of ${guests}`
    });
  }
});



/* POST */

// add a new entry
app.post('/api/v1/waitTimes', (req, res) => {
  if (!req.body.guests) {
    return res.status(400).send({
      success: 'false',
      message: 'guest count required'
    });
  }
  if (!req.body.timestamp) {
    return res.status(400).send({
      success: 'false',
      message: 'timestamp is required'
    });
  }
  if (!req.body.table) {
    return res.status(400).send({
      success: 'false',
      message: 'table number is required'
    });
  }

  const newEntry = {
    guests: parseInt(req.body.guests),
    timestamp: req.body.timestamp,
    table: req.body.table
  };
  db.push(newEntry);
  return res.status(201).send({
    success: 'true',
    message: 'entry added successfully',
    data: newEntry
  });
});



/* PUT */

// update an entry
app.put('/api/v1/waitTimes/:guests', (req, res) => {
  console.log(req.params)
  const guests = parseInt(req.params.guests);
  const timestamp = parseInt(req.query.timestamp);
  let foundIndex = -1;

  for (let i = 0; i < db.length; i++) {
    if (db[i].guests === guests && db[i].timestamp === timestamp) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    return res.status(404).send({
      success: 'false',
      message: `no entry found for a guest count of ${guests} and a timestamp of ${timestamp}`
    });
  }
  if (!req.body.table) {
    return res.status(400).send({
      success: 'false',
      message: 'table number is required'
    });
  }

  const updatedEntry = {
    guests: guests,
    timestamp: timestamp,
    table: parseInt(req.body.table)
  };
  db.splice(foundIndex, 1, updatedEntry);
  res.status(201).send({
    success: 'true',
    messasge: `entry with a guest count of ${guests} and a timestamp of ${timestamp} updated to have table ${req.body.table}`,
    data: updatedEntry
  });
});



app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
