const express = require('express');
const db = require('./db/db.js');

const app = express();
const port = 5000;

app.get('/api/v1/wait_times', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'wait times retrieved successfully',
    wait_times: db
  });
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});