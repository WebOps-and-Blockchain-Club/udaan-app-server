import "reflect-metadata";
import AppDataSource from "../config";
import User from "../entities/user";
import SOSRequestInfo from "../entities/sosRequest";
import { compareSync } from "bcrypt";

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import express, { json } from "express";
import cors from "cors";
import admin from "firebase-admin";

// const app = express();
// app.use(express.json());

// app.use(
//   cors({
//     origin: "*",
//   })
// );

// app.use(
//   cors({
//     methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
//   })
// );

// app.use(function (req, res, next) {
//   res.setHeader("Content-Type", "application/json");
//   next();
// });

var serviceAccount = require(`${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ncc-udaan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ncc-udaan",
});


// process.env.GOOGLE_APPLICATION_CREDENTIALS
// initializeApp({
//   credential: applicationDefault(),
//   projectId: "ncc-udaan",
  
// });

const sendNotification = async(req:any , res:any) => {
  const receivedToken = req.body.fcmToken;
  console.log(receivedToken);

  const message = {
    notification: {
      title: "Notification",
      body: "This is a Test Notification",
    },
    token: receivedToken,
  };

  getMessaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: "Successfully sent message",
        token: receivedToken,
      });
      console.log("Successfully sent message:", response);
    })
    .catch(err => {
      console.error(err)
    });
};


const sendNotificationToCadets = (h: string, f: any, l: string) => {
  return console.log("erjkghfuytg")
}





////////////////////////////////////////////
interface CadetInfo {
  user_id: string;
  coordinates: string;
  distance: number;
}

const sendSOS = async (req: any, res: any) => {
  const data = req.data;
  const userID = data.user_id
  const cadet_ids: CadetInfo[][] = data.cadets

  const userMessage = req.body.userMessage;
  const cadetRepo = AppDataSource.getRepository(User);
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const createdAt = (Date.now()).toString();
  const sosData = { userID: userID, userMessage: userMessage, createdAt: createdAt };

  const sosSavedData = await sosRequestRepo.save(sosData);
  const sosId = sosSavedData.sosRequest_ID;

  let isAccepted = sosSavedData.isAccepted;

  let iterator = 0;
  while (iterator < cadet_ids.length && !isAccepted) {

    let index = 0;
    while (index < cadet_ids[iterator].length && !isAccepted) {
      const cadet = await cadetRepo.findOne({ where: { user_id: cadet_ids[iterator][index].user_id } });
      sendNotificationToCadets(cadet!.fcmToken, userMessage, sosId);

      if (isAccepted) {
        return res.send("Request Send Successfully");
      }

      index++;
    }
    setTimeout(() => {
      // setting a timer for 30 sec and then allowing other set cadets to get notified
    }, 30 * 10e3);

    iterator++;
  }

  return res.json({
    data: req.data.cadets,
    message: "message can be sent successfully now, need to integrate notification"
  })
}

// A data base can be made for the sos request containing the

const acceptRequest = async (req: any, res: any) => {
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const cadetID = req.user_id;
  const acceptedAt = (Date.now()).toString();
  const isAccepted = true;

  // let sosData = {};
  // sosData.

  // const sosSavedData= await sosRequestRepo.update(req.body.sosId,sosData);
  // res.send(sosSavedData);

  // TODO SET UP A SOCKET 
};

export const controller = {
  sendSOS,
  acceptRequest,
  sendNotification
};









//   const sosSavedData2 = await sosRequestRepo.findOne({
//     where: { sosRequest_ID: sosId },
//   });
//   let isAccepted = sosSavedData2?.isAccepted;
//   if (!isAccepted) {
//     for (const cadet_id in cadet_ids[1]) {
//       const cadet = await cadetRepo.findOne({ where: { user_id: cadet_id } });
//       sendNotificationToCadets(cadet!.fcmToken, userMessage, sosId);
//     }
//   } else {
//     res.send("Request Send Successfully");
//   }

//   setTimeout(() => {
//     // setting a timer for 30 sec and then allowing other set cadets to get notified
//   }, 30 * 10e3);

//   const sosSavedData3 = await sosRequestRepo.findOne({
//     where: { sosRequest_ID: sosId },
//   });
//   isAccepted = sosSavedData3?.isAccepted;
//   console.log(cadet_ids);
//   if (!isAccepted) {
//     for (const cadet_id in cadet_ids[2]) {
//       const cadet = await cadetRepo.findOne({ where: { user_id: cadet_id } });

//       sendNotificationToCadets(cadet!.fcmToken, userMessage, sosId);
//     }
//   } else {
//     res.send("Request Send Successfully");
//   }
// }