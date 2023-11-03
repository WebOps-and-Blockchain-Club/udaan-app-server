import { Router } from "express";
import {controller} from "./controller";
export const sosNotificationRoutes = Router();


sosNotificationRoutes.post("/",controller.sendSOS);
sosNotificationRoutes.post("/",controller.acceptRequest);

