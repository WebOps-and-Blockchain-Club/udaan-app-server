import "reflect-metadata";
import express, { json } from "express"
import AppDataSource from "./config"
import { eventsRoutes } from "./events/routes";
import { authRoutes } from "./auth/routes";
import { sosNotificationRoutes } from "./sos/routes";
import cors from "cors";
import dotenv from "dotenv";
import User from "./entities/user";

import bcrypt from "bcrypt";

const app = express();
app.use(express.json());
const port = 8000;

app.use(
  cors({
    origin: "*",
  })
);

dotenv.config();

app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sos",sosNotificationRoutes);


app.put('/update', async(req:any, res:any) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({
    where: { user_id: "407ccfb5-f12c-413e-9f07-b983e23cbcb2" }
  })

  if(user){
    const location = {latitude: 12.993006, longitude: 80.232651}
    user.coordinates = JSON.stringify(location)
    await userRepo.save(user)

    res.json({user})
  }

})

app.post('/adduser', async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const data = req.body;

  for (let i = 0; i < data.length; i++) {
    let user = data[i];

    user.coordinates = JSON.stringify(user.coordinates);
    user.password = await bcrypt.hash(user.password, 12)
    await userRepo.save(user);
    console.log(`added user: ${i}`)
  }

  res.status(200).json({ message: `Added ${data.length} users` });
});



AppDataSource.initialize()
  .then(() => {
    app.listen(port, '0.0.0.0',  () => {
      console.log(`Server is running on http://65.2.38.110:${port}`);
    });
  })
  .catch((err: any) => console.log("error", err));
