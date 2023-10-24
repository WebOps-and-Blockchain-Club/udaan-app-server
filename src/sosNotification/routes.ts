import { Router } from "express";
import {controller} from "./controller";
import verifyJwt from "../middleware/jwt";
export const sosNotificationRoutes = Router();


sosNotificationRoutes.post("/",controller.sendSOS);

