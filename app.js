const express = require(`express`);
const db = require(`./db/db.js`);
const bodyParser = require(`body-parser`);

const app = express();
const port = 5000;

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const waitTimes = db.waitTimes;
const guestList = db.guestList;
const tableList = db.tableList;



/* DELETE */

// delete an entry
app.delete(`/api/v1/waitTimes/:guests`, (req, res) => {
  const guests = parseInt(req.params.guests);
  const timestamp = parseInt(req.query.timestamp);

  for (let i = 0; i < waitTimes.length; i++) {
    if (db[i].guests === guests && db[i].timestamp === timestamp) {
      const removedEntry = waitTimes.splice(i, 1);
      return res.status(200).send({
        success: `true`,
        message: `deleted entry with a guest count of ${guests} and a timestamp of ${timestamp} successfully`,
        data: removedEntry
      });
    }
  }

  return res.status(404).send({
    success: `false`,
    message: `no entry found for a guest count of ${guests} and a timestamp of ${timestamp}`
  });
});



/* GET */

// all
app.get(`/api/v1/waitTimes`, (req, res) => {
  res.status(200).send({
    success: `true`,
    message: `wait times retrieved successfully`,
    data: waitTimes
  });
});

// for n guests
app.get(`/api/v1/waitTimes/:guests`, (req, res) => {
  const guests = parseInt(req.params.guests);
  const results = map(waitTime => {
    waitTime.guests === guests;
  });
  if (results.length !== 0) {
    return res.status(200).send({
      success: `true`,
      message: `wait times for a guest count of ${guests} retrieved successfully`,
      data: results
    });
  } else {
    return res.status(404).send({
      success: `false`,
      message: `there are no wait times for a guest count of ${guests}`
    });
  }
});

// guest list
app.get(`/api/v1/guestList`, (req, res) => {
  res.status(200).send({
    success: `true`,
    message: `guest list retrieved successfully`,
    data: guestList
  });
});

// table list
app.get(`/api/v1/tables`, (req, res) => {
  const constraints = constraintsFactory(0, 0, 0, 0, 0, 1);
  const preCheckVerdict = requestPreCheck(req, constraints);
  if (preCheckVerdict !== ``) {
    res.status(400).send({
      success: `false`,
      message: preCheckVerdict
    });
  } else if (req.query.vacant !== undefined) {
    const vacancyQuery = req.query.vacant;
    if (vacancyQuery !== `false` && vacancyQuery !== `true`) {
      res.status(400).send({
        success: `false`,
        message: `vacant must be either true or false`
      });
    } else {
      const vacantTables = tableList.filter(table => {
        return table.vacant === vacancyQuery;
      });
      res.status(200).send({
        success: `true`,
        message: `tables with vacant = '${vacancyQuery}' retrieved successfully`,
        data: vacantTables
      });
    }
  } else {
    res.status(200).send({
      success: `true`,
      message: `table list retrieved successfully`,
      data: tableList
    });
  }
});


/* POST */

// add a new entry
app.post(`/api/v1/waitTimes`, (req, res) => {
  if (!req.body.guests) {
    return res.status(400).send({
      success: `false`,
      message: `guest count required`
    });
  }
  if (!req.body.timestamp) {
    return res.status(400).send({
      success: `false`,
      message: `timestamp is required`
    });
  }
  if (!req.body.table) {
    return res.status(400).send({
      success: `false`,
      message: `table number is required`
    });
  }

  const newEntry = {
    guests: parseInt(req.body.guests),
    timestamp: req.body.timestamp,
    table: req.body.table
  };
  waitTimes.push(newEntry);
  return res.status(201).send({
    success: `true`,
    message: `entry added successfully`,
    data: newEntry
  });
});

// add to guest list
app.post(`/api/v1/guestList`, (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({
      success: `false`,
      message: `guest name is required`
    });
  }
  if (!req.body.count) {
    return res.status(400).send({
      success: `false`,
      message: `number of guests is required`
    });
  }
  if (!req.body.adults) {
    return res.status(400).send({
      success: `false`,
      message: `number of adults is required`
    });
  }
  if (!req.body.children) {
    return res.status(400).send({
      success: `false`,
      message: `number of children is required`
    });
  }

  const newGuest = {
    name: req.body.name,
    count: req.body.count,
    adults: req.body.adults,
    children: req.body.children
  };
  guestList.push(newGuest);
  return res.status(201).send({
    success: `true`,
    message: `added ${req.body.name} to guest list, position ${guestList.length + 1}`,
    data: newGuest
  });
});



/* PUT */

// update a guest entry
app.put(`/api/v1/waitTimes/:guests`, (req, res) => {
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
      success: `false`,
      message: `no entry found for a guest count of ${guests} and a timestamp of ${timestamp}`
    });
  }
  if (!req.body.table) {
    return res.status(400).send({
      success: `false`,
      message: `table number is required`
    });
  }

  const updatedEntry = {
    guests: guests,
    timestamp: timestamp,
    table: parseInt(req.body.table)
  };
  db.waitTimes.splice(foundIndex, 1, updatedEntry);
  res.status(201).send({
    success: `true`,
    messasge: `entry with a guest count of ${guests} and a timestamp of ${timestamp} updated to have table ${req.body.table}`,
    data: updatedEntry
  });
});

// seat guests at a table
// bad api endpoint naming, update later lmao
// probably need to pass in a guest later
app.put(`/api/v1/tables/:number`, (req, res) => {
  const constraints = constraintsFactory(0, 0, 1, 1, 0, 0);
  const preCheckVerdict = requestPreCheck(req, constraints);
  if (preCheckVerdict !== ``) {
    res.status(400).send({
      success: `false`,
      message: preCheckVerdict
    });
  } else {
    const tableNumber = req.params.number;

    let foundIndex = -1;
    for (let i = 0; i < tableList.length; i++) {
      // TODO when I start using a proper DB
      // ensure that tableNumber is stored as int
      // so that I can check 1 <= tableNumber <= 66
      // but what about ephemeral tables?
      if (tableList[i].number === tableNumber) {
        foundIndex = i;
        break;
      }
    }

    // table number not found
    if (foundIndex === -1) {
      return res.status(404).send({
        success: `false`,
        message: `table #${tableNumber} does not exist`
      });
    }
    
    const originalTable = tableList[foundIndex];
    if (originalTable.vacant !== `true`) {
      // may need to update this status
      // in fact I think all the statuses need a good roast
      return res.status(400).send({
        success: `false`,
        message: `table #${tableNumber} is not vacant`
      });
    }

    const updatedTable = {
      number: originalTable.number,
      type: originalTable.type,
      count: originalTable.count,
      vacant: `false`
    };
    tableList.splice(foundIndex, 1, updatedTable);
    res.status(201).send({
      success: `true`,
      message: `table #${tableNumber} has been seated and is no longer vacant`,
      data: updatedTable
    });
  }
});



// helper functions
const constraintsFactory = (
  bodyMin, bodyMax,
  paramMin, paramMax,
  queryMin, queryMax
) => {
  return {
    body: {
      minLength: bodyMin,
      maxLength: bodyMax
    },
    params: {
      minLength: paramMin,
      maxLength: paramMax
    },
    query: {
      minLength: queryMin,
      maxLength: queryMax
    }
  };
};
const requestPreCheck = (req, constraints) => {
  let verdict = ``;
  Object.keys(constraints).forEach(key => {
    const count = Object.keys(req[`${key}`]).length;
    const max = constraints[`${key}`].maxLength;
    const min = constraints[`${key}`].minLength;
    if (count > max) {
      verdict += `The number of ${key} arguments exceeds the alloted amount (${count} vs ${max}). `;
    } else if (count < min) {
      verdict += `The number of ${key} arguments exceeds the alloted amount (${count} vs ${min}). `;
    }
  });
  return verdict.trimEnd();
};


app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
