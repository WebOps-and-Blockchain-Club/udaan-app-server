import "reflect-metadata";
import express from "express";
import AppDataSource from "./config";
import { eventsRoutes } from "./events/routes";
import { authRoutes } from "./auth/routes";

import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./entities/user";
import verifyJwt from "./middleware/jwt";
import Cadet from "./entities/cadet";

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

//////////////////////MAP////////////////////////////////

const simulatedCadetLocations = [
    { id: 1, latitude: 18.922557, longitude: 72.834432 },
    { id: 2, latitude: 26.621055, longitude: 80.850662 },
    { id: 3, latitude: 18.398745, longitude: 76.563557 },
];

const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {// calculating the distance between two locations
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =// just math
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(2); // Distance rounded to 2 decimal places
};

const deg2rad = (degrees: any) => {// converts degree into radian
    return degrees * (Math.PI / 180);
};

const distance = calculateDistance(//passing arguments(user location and cadet location) to the distance calulating function
    simulatedCadetLocations[0].latitude,
    simulatedCadetLocations[0].longitude,
    simulatedCadetLocations[1].latitude,
    simulatedCadetLocations[1].longitude,
);

console.log(distance)

let cadets: any = [];

const nearestCadet = (user: User) => {
    let shortestDistance = Number.MAX_SAFE_INTEGER;
    let index = 0;
    for (var i = 0; i < cadets.length; i++) {
        let user_lat = JSON.parse(user.coordinates).latitude;
        let user_long = JSON.parse(user.coordinates).longitude;
        let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
        let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
        let distance = parseFloat(calculateDistance(user_lat, user_long, cadet_lat, cadet_long));

        if (distance < shortestDistance) {
            shortestDistance = distance;
            index = i;
        }
    }
    cadets.sort()
    return cadets;
}

app.get('/getCadet/:userId', async (req, res) => {

    const userRepo = AppDataSource.getRepository(User)
    const userId = req.params.userId;
    const user = await userRepo.findOne({
        where: { user_id: userId }
    });

    const cadetRepo = AppDataSource.getRepository(Cadet)
    cadets = await cadetRepo.find({
        where: { city: user?.city }
    });

    const nearestCadets = await nearestCadet(user as User)
    console.log(nearestCadets)
    let cadetArray = [];
    for(let i = 0; i < nearestCadets.length; i++) {
        cadetArray.push(nearestCadets[i].cadet_id)
    }
    res.send({
        user: userId,
        cadet_ids: cadetArray
    })
})

app.post('/addCadet', async(req, res) => {
    const cadetRepo = AppDataSource.getRepository(Cadet)
    let newCadet = {...req.body}
    newCadet.coordinates = req.body.coordinates
    let cadetInserted = await cadetRepo.save(newCadet)
    res.send(cadetInserted)
})

app.post('/addUser', async(req, res) => {
    const userRepo = AppDataSource.getRepository(User)
    let newUser = {...req.body}
    let userInserted = await userRepo.save(newUser)
    res.send(userInserted)
})

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
        console.log(`application is running on port ${port}.`);
    })
}).catch((err: any) => console.log("error", err));
