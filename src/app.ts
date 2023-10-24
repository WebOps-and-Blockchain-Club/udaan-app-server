import "reflect-metadata";
import express from "express";
import AppDataSource from "./config";
import { eventsRoutes } from "./events/routes";
import { authRoutes } from "./auth/routes";
import { mappingRoutes } from "./mapping/routes";
import cors from "cors";
import dotenv from "dotenv"
import axios from "axios";


const app = express();
app.use(express.json());
const port = 3000;
app.use(
  cors({
    origin: "*",
  })
);


dotenv.config();
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/mapping", mappingRoutes);


AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`application is running on port ${port}.`);
    })
  }).catch((err: any) => console.log("error", err));