import "reflect-metadata"
import express from 'express';
import AppDataSource from "./config";
import cors from "cors";
import dotenv from "dotenv"
import bcrypt from "bcrypt";
import * as jwt from 'jsonwebtoken'
import verifyJwt from "./middleware/jwt";
import User from './entities/user'
import Cadet from "./entities/cadet";
import OtpVerify from "./entities/otpVerify";
import nodemailer from 'nodemailer'

import axios from 'axios'
import { request } from "http";


const app = express();
app.use(express.json());
const port = 3000;
app.use(
    cors({
        origin: "*",
    })
);
dotenv.config();
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

        const id = newUser.user_id;
        // res.status(200).json({ message: "User Registered", newUser: newUser })
        const inputEmail = newUser.Email
        
        sendOtp(newUser, res)
    }
})

app.post("/api/logout", verifyJwt, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = null;
    return res.json({ message: "User logged out" });
});

//////////////////////MAP////////////////////////////////

// const simulatedCadetLocations = [
//     { id: 1, latitude: 18.922557, longitude: 72.834432 },
//     { id: 2, latitude: 26.621055, longitude: 80.850662 },
//     { id: 3, latitude: 18.398745, longitude: 76.563557 },
// ];

// const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {// calculating the distance between two locations
//     const R = 6371; // Radius of the Earth in kilometers
//     const dLat = deg2rad(lat2 - lat1);
//     const dLon = deg2rad(lon2 - lon1);

//     const a =// just math
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;

//     return distance.toFixed(2); // Distance rounded to 2 decimal places
// };

// const deg2rad = (degrees: any) => {// converts degree into radian
//     return degrees * (Math.PI / 180);
// };

// const distance = calculateDistance(//passing arguments(user location and cadet location) to the distance calulating function
//     simulatedCadetLocations[0].latitude,
//     simulatedCadetLocations[0].longitude,
//     simulatedCadetLocations[1].latitude,
//     simulatedCadetLocations[1].longitude,
// );

// console.log(distance)

// let cadets: any = [];

// const nearestCadet = (user: User) => {
//     let shortestDistance = Number.MAX_SAFE_INTEGER;
//     let index = 0;
//     for (var i = 0; i < cadets.length; i++) {
//         let user_lat = JSON.parse(user.coordinates).latitude;
//         let user_long = JSON.parse(user.coordinates).longitude;
//         let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
//         let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
//         let distance = parseFloat(calculateDistance(user_lat, user_long, cadet_lat, cadet_long));

//         if (distance < shortestDistance) {
//             shortestDistance = distance;
//             index = i;
//         }
//     }
//     return cadets[index].cadet_id;
// }

// app.get('/getCadet/:userId', async (req, res) => {

//     const userRepo = AppDataSource.getRepository(User)
//     const userId = req.params.userId;
//     const user = await userRepo.findOne({
//         where: { user_id: userId }
//     });

//     const cadetRepo = AppDataSource.getRepository(Cadet)
//     cadets = await cadetRepo.find({
//         where: { city: user?.city }
//     });

//     const nearestCadet_id = await nearestCadet(user as User)
//     res.json({ "cadet": nearestCadet_id, "user id": userId })
// })

// app.post('/addCadet', async (req, res) => {
//     const cadetRepo = AppDataSource.getRepository(Cadet)
//     let newCadet = { ...req.body }
//     newCadet.coordinates = JSON.stringify(req.body.coordinates)
//     let cadetInserted = await cadetRepo.save(newCadet)
//     res.send(cadetInserted)
// })

// app.post('/addUser', async (req, res) => {
//     const userRepo = AppDataSource.getRepository(User)
//     let newUser = { ...req.body }
//     let userInserted = await userRepo.save(newUser)
//     res.send(userInserted)
// })

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    }
});

const sendOtp = async (user: any, res: any) => {
    // console.log(user)
    const otpRepo = AppDataSource.getRepository(OtpVerify)
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: 'ce22b052@gmail.com',
            subject: 'Hello from Node.js!',
            text: 'This is a test email sent from Node.js using Nodemailer.',
            html: `<p>Enter ${otp}</p>`
        };

        const saltRounds = 10
        const hashedOtp = await bcrypt.hash(otp, saltRounds)
        let newOtp = new OtpVerify();
        newOtp = {
            user_id:user.user_id,
            email: user.email,
            otp: hashedOtp,
            createdAt: new Date(Date.now()),
            expiresAt: new Date(Date.now() + 3600000)
        }

        // console.log(newOtp)
        try{
            const otpsaved = await otpRepo.save(newOtp)
        }catch(err){
            console.log(err)
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        transporter.sendMail(mailOptions)

        res.json({
            status: "Pending",
            message: "otp sent",
            data: {
                userId: user.user_id,
                email:user.email
            }
        })

    } catch {
        res.json({
            status: "Failed",
            message: "otp sent"
        })
    }
}


app.post("/api/verifyOtp", async (req, res) => {
    try {
        let { inputEmail, inputOtp } = req.body
        if (!inputEmail || !inputOtp) {
            throw Error("empty otp details not allowed")
        } else {
            const userRepo = AppDataSource.getRepository(User)
            const otpRepo = AppDataSource.getRepository(OtpVerify)

            const userOtpVerification = await otpRepo.findOne({
                where: { email: inputEmail }
            })
            console.log(userOtpVerification)

            if (!userOtpVerification) {
                throw new Error("Account record doesn't exist or verified")
            } else {
                console.log("hh")
                const expiresAt = userOtpVerification.expiresAt
                // const hashedOtp = userOtpVerification[0].otp
                const otp = userOtpVerification.otp

                console.log(otp)


                if (expiresAt < new Date(Date.now())) {
                    // await userOtpVerification.delete({ user_id:userId })
                    await otpRepo.delete({ email: inputEmail })

                    // throw new Error("Code expired")
                    return res.json(
                        { error: "OTP Expired" }
                    )
                } else {
                    const validOtp = await bcrypt.compare(inputOtp, otp)
                    console.log(validOtp)
                    if (!validOtp) {
                        return res.json(
                            { error: "Invalid code passed" }
                        )
                    } else {
                        console.log("h")
                        console.log(inputEmail)
                        const dummy=await userRepo.update({email:inputEmail}, { verified: true })
                        console.log(dummy)
                        console.log(userRepo)
                        await otpRepo.delete({ email:inputEmail })
                        res.json({
                            status: "verified",
                            message: ({ message: "User Registered" })
                        })
                    }
                }
            }
        }
    } catch (error) {
        res.json({
            status: "Failed"
        })
    }
})

app.post('/api/resendVerifyOtp', async (req, res) => {
    try {
        let userId = req.body.userId
        let inputEmail = req.body.inputEmail

        if (!userId || !inputEmail) {
            throw Error("empty otp details not allowed")
        } else {
            const otpRepo = AppDataSource.getRepository(OtpVerify)
            await otpRepo.delete({ email:inputEmail })
            const user={
                user_id:userId,
                email:inputEmail
            }
            console.log(user)
            await sendOtp(user, res)
        }
    } catch (error) {
        res.json({
            status: "failed"
        })
    }
})

AppDataSource.initialize().then(() => {
    app.listen(port, () => {
        console.log(`application is running on port ${port}.`);
    })
}).catch((err: any) => console.log("error", err));