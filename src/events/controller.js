const { json } = require("express/lib/response");
const pool = require("../../db");
const queries = require("./queries");

const getEvents = (req, res) => {
  pool.query(queries.getEvents, (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

const getEventById = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getEventById, [id], (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

const addEvent = (req, res) => {
  const {
    eventname,
    eventdescription,
    eventdate,
    starttime,
    endtime,
    location,
    registrationlink,
  } = req.body;

  // check if registration link exists
  pool.query(
    queries.checkRegistraionLinkExists,
    [registrationlink],
    (error, results) => {
      if (results.rows.length) {
        res.send("Registration Link already Exists");
      }

      // add event to db
      pool.query(
        queries.addEvent,
        [
          eventname,
          eventdescription,
          eventdate,
          starttime,
          endtime,
          location,
          registrationlink,
        ],
        (error, results) => {
          if (error) throw error;
          res.status(201).send("Event Created Successfully");
        }
      );
    }
  );
};

const removeEvent = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query(queries.getEventById, [id], (error, results) => {
    const noEventFound = !results.rows.length;
    if (noEventFound) {
      res.send("Event does not exists in the database");
    }
    pool.query(queries.removeEvent, [id], (error, results) => {
      if (error) throw error; // to do  throws an error
      res.status(200).send("Event  removed successfully");
    });
  });
};

const updateEvent = (req, res) => {
  const id = parseInt(req.params.id);
  const { eventdate, starttime, endtime, location } = req.body;
  pool.query(queries.getEventById, [id], (error, results) => {
    const noEventFound = !results.rows.length;
    if (noEventFound) {
      res.send("Event does not exists in the database");
    }

    // todo if event name and event description is to be changed 

    pool.query(queries.updateEvent,[eventdate,starttime,endtime,location,id],(error,results)=>{
        if(error) throw error;
        res.status(200).send("Event Successfully Updated");
    })
  });
};
module.exports = {
  getEvents,
  getEventById,
  addEvent,
  removeEvent,
  updateEvent
};
