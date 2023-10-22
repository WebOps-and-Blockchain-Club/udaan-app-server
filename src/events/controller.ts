import AppDataSource from "../config";
import { Events } from "../entities/events";

// for getting all the event records  from the database
const getEvents = async (req: any, res: any) => {
  try {
    const eventRepo = AppDataSource.getRepository(Events);
    const allRecord = await eventRepo.find();
    res.status(200).json(allRecord);
  } catch (error) {
    res.status(500).send("Some error occored");
  }
};

// for getting the specific event records  from the database according the the id of the  event
const getEventById = async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const eventRepo = AppDataSource.getRepository(Events);
    const record = await eventRepo.findOne({ where: { id: id } });
    if (record) {
      res.status(200).json(record);
    }else{
      res.status(404).send("Event does not exist in database")
    }
  } catch (err) {
    res.status(500).send("Some error occored");
  }
};

// for adding the event in the database
const addEvent = async (req: any, res: any) => {
  try {
    const eventRepo = AppDataSource.getRepository(Events);
    let event: Events = new Events();
    event = { ...req.body };

    const record = await eventRepo.findOne({
      where: { registrationlink: event.registrationlink },
    });
    // check if registration link exists
    if (record) {
      res.status(400).json({ error: "the registraition link already exists" });
    } else {
      const newEvent = await eventRepo.save(event);
      res.status(200).json(newEvent);
    }
  } catch (error) {
    res.status(500).send("Some error occored");
  }
};

const removeEvent = async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const eventRepo = AppDataSource.getRepository(Events);
    const record = await eventRepo.findOne({ where: { id: id } });
    if (record) {
      await eventRepo.delete(id);
      res.status(200).send("Event  removed successfully");
    } else {
      res.status(400).send("Event does not exists in the database");
    }
  } catch (error) {
    res.status(500).send("Some error occored");
  }
};

const updateEvent = async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const eventRepo = AppDataSource.getRepository(Events);
    const record = await eventRepo.findOne({ where: { id: id } });
    if (record) {
      await eventRepo.update(id, { ...req.body });
      res.status(200).send("Event Successfully Updated");
    } else {
      res.status(400).send("Event does not exists in the database");
    }
  } catch (error) {
    res.status(500).send("Some error occored");
  }
};

export const controller = {
  getEvents,
  getEventById,
  addEvent,
  removeEvent,
  updateEvent,
};
