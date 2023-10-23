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

app.get("/", async (req, resp) => {});
// app.post('/registration', async (req, resp) => {

// });

const generateAccessToken = (user: User): String => {
    const id = user.user_id;
    return jwt.sign(
        { id: id },
        process.env.TOKEN_SECRET || "",
        { expiresIn: "20h" }
    )
}

const generateRefreshToken = (user: User): String => {
    const id = user.user_id;
    return jwt.sign(
        { id: id },
        process.env.REFRESH_TOKEN_SECRET || "",
    )
}

let refreshTokens: any = [];

app.post('/api/refresh', (req, res) => {
    const refreshToken = req.body.token;

    if (!refreshToken) return res.status(401).json({ message: "You are not authenticated." });
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: "Refresh token is not valid." });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "", (err: any, user: any) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter((token: any) => {
            token !== refreshToken
        })
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.push(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    })
})

app.post('/api/login', async (req, res) => {
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({
        where: { email: req.body.email }
    })

    if (!user) {
        res.status(404).json({ error: 'User not found' })
    } else {
        const matchPassword = await bcrypt.compare(req.body.password, user.password);
        if (!matchPassword) {
            res.status(404).json({ error: "Invalid Credentials" })
        } else {
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)

            refreshTokens.push(refreshToken);
            res.status(200).json({
                message: "User Logged In",
                accessToken: accessToken,
                refreshToken: refreshToken
            })
        }
    }
})

app.post('/api/register', async (req, res) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
        where: { email: req.body.email }
    })

    if (user) {
        res.status(203).json({ message: 'User already Registered, Please Login to your account' })
    } else {
        let user = { ...req.body }
        const hashedpassword = await bcrypt.hash(user.password, 12)
        user.password = hashedpassword;

        const newUser = await userRepo.save(user)

        const id = newUser.id;
        res.status(200).json({ message: "User Registered", newUser: newUser })
    }
})

app.post("/api/logout", verifyJwt, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = null;
    return res.json({ message: "User logged out" });
});

//////////////////////MAP////////////////////////////////


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


let cadets: any = [];

const nearestCadet = (user: User) => {
    let shortestDistance = Number.MAX_SAFE_INTEGER;
    let index = 0;
    for (var i = 0; i < cadets.length; i++) {
        let user_lat = JSON.parse(user.coordinates).latitude;
        let user_long = JSON.parse(user.coordinates).longitude;
        let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
        let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
        let dist = parseFloat(calculateDistance(user_lat, user_long, cadet_lat, cadet_long));

        if (dist < shortestDistance) {
            shortestDistance = dist;
            index = i;
        }
        cadets[i].distance = dist;
    }
    // cadets.sort()
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

    let firstBatch:any = []
    let secondBatch:any = []
    let thirdBatch:any = []
    for(let i = 0; i < nearestCadets.length; i++){
        if(nearestCadets[i].distance <= 5){
            firstBatch.push(nearestCadets[i].cadet_id)
        }else if(nearestCadets[i].distance > 5 && (nearestCadets[i].distance <= 10)){
            secondBatch.push(nearestCadets[i].cadet_id)
        }else{
            thirdBatch.push(nearestCadets[i].cadet_id)
        }
    }

    console.log(nearestCadets)
    console.log(firstBatch, secondBatch, thirdBatch)

    res.send({
        user: userId,
        cadet_ids: {
            "5km": firstBatch,
            "10km": secondBatch,
            "more": thirdBatch
        }
    })

})

app.post('/addCadet', async(req, res) => {
    const cadetRepo = AppDataSource.getRepository(Cadet)
    let newCadet = {...req.body}
    newCadet.isAvailable = true
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