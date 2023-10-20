const getEvents = "SELECT * FROM events";
const getEventById = "SELECT * FROM events WHERE eventid=$1";
const checkRegistraionLinkExists ="SELECT e FROM events e WHERE e.registrationlink = $1";
const addEvent="INSERt INTO events ( eventname, eventdescription,eventdate, starttime, endtime, location, registrationlink) VALUES ($1,$2,$3,$4,$5,$6,$7)";
const removeEvent="DELETE FROM events WHERE eventid=$1";
const updateEvent= "UPDATE events SET eventdate=$1 ,starttime= $2,endtime =$3 ,location =$4 WHERE id=$5"
module.exports = {
  getEvents,
  getEventById,
  checkRegistraionLinkExists,
  addEvent,
  removeEvent,
  updateEvent,
};
