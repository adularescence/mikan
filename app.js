const express = require('express');
const db = require('./db/db.js');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// get all wait times
app.get('/api/v1/waitTimes', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'wait times retrieved successfully',
    waitTimes: db
  });
});

app.get('/api/v1/waitTimes/:guests', (req, res) => {
  const guests = parseInt(req.params.guests);
  const results = [];
  db.map(waitTime => {
    if (waitTime.guests === guests) {
      results.push(waitTime);
    } else {
      console.log(waitTime)
    }
  });
  if (results.length !== 0) {
    return res.status(200).send({
      success: 'true',
      message: `wait times for a guest count of ${guests} retrieved successfully`,
      results
    });
  } else {
    return res.status(404).send({
      success: 'false',
      message: `there are no wait times for a guest count of ${guests}`
    });
  }
});


// post to wait times
app.post('/api/v1/waitTimes', (req, res) => {
  if (!req.body.guests) {
    return res.status(400).send({
      success: 'false',
      message: 'guest count required'
    });
  } else if (!req.body.timestamp) {
    return res.status(400).send({
      success: 'false',
      message: 'timestamp is required'
    });
  } else if (!req.body.table) {
    return res.status(400).send({
      success: 'false',
      message: 'table number is required'
    });
  }

  const waitTime = {
    guests: parseInt(req.body.guests),
    timestamp: req.body.timestamp,
    table: req.body.table
  };
  db.push(waitTime);
  return res.status(201).send({
    success: 'true',
    message: 'todo added successfully',
    waitTime
  });
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
