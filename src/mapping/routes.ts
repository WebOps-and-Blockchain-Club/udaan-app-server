import { Router } from "express";
import {controller} from "./controller";
import verifyJwt from "../middleware/jwt";

export const mappingRoutes = Router();

mappingRoutes.get('/getCadet/:userId',controller.getCadetUserId);
mappingRoutes.post('/addCadet',controller.addCadet);
mappingRoutes.post('/addUser',controller.addUser);
mappingRoutes.get('/nearbyCities/:userId',controller.nearbyCities);
