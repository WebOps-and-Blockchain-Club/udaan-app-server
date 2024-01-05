import "reflect-metadata";
import express, { json } from "express";
import AppDataSource from "./config";
import { eventsRoutes } from "./events/routes";
import { authRoutes } from "./auth/routes";
import { mappingRoutes } from "./mapping/routes";
import { sosNotificationRoutes } from "./sosNotification/routes";
import cors from "cors";
import dotenv from "dotenv";



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
app.use("api/v1/SOSNotification",sosNotificationRoutes);



AppDataSource.initialize()
  .then(() => {
    // app.listen(port, () => {
      // console.log(`application is running on port ${port}.`);
    // });
    // const port = 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on http://65.2.38.110:${port}`);
    });
  })
  .catch((err: any) => console.log("error", err));
