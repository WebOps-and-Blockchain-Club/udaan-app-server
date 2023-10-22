import { Router } from "express";
import {controller} from "./controller";

export const eventsRoutes = Router();

eventsRoutes.get('/',controller.getEvents)
eventsRoutes.post('/',controller.addEvent);
eventsRoutes.get('/:id',controller.getEventById);
eventsRoutes.delete('/:id',controller.removeEvent);
eventsRoutes.put('/:id',controller.updateEvent);
