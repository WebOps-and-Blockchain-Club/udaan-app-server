import { Router } from "express";
import {controller} from "./controller";
export const sosNotificationRoutes = Router();

import FindCadets from "../mapping/algorithm";
import fetchuser from "../middleware/jwt";

sosNotificationRoutes.post("/notifycadets", fetchuser, FindCadets, controller.sendSOS);
sosNotificationRoutes.post("/accept", fetchuser, controller.acceptRequest);
sosNotificationRoutes.post("/sendnotification", controller.sendNotification);
