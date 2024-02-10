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
import io from "../app";

var serviceAccount = require(`${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
});

const sendNotification = async (
  fcmToken: any,
  userMessage: any,
  sosId: any
) => {
  const receivedToken = fcmToken;
  console.log(receivedToken);

  const message = {
    notification: {
      title: "Urgent help required!",
      body: userMessage,
    },
    data: {
      sosId: sosId,
    },
    token: receivedToken,
  };

  getMessaging()
    .send(message)
    .then((response) => {
      // res.status(200).json({
      //   message: "Successfully sent message",
      //   token: receivedToken,
      // });

      console.log("Successfully sent message:", response);
    })
    .catch((err) => {
      console.error(err);
    });
};

interface CadetInfo {
  user_id: string;
  coordinates: string;
  distance: number;
}

const sendSOS = async (req: any, res: any) => {
  const data = req.data;
  const userID = data.user_id;
  const cadet_ids: CadetInfo[][] = data.cadets;

  const userMessage: string = req.body.userMessage;
  const cadetRepo = AppDataSource.getRepository(User);
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const createdAt = Date.now().toString();
  const sosData = {
    userID: userID,
    userMessage: userMessage,
    createdAt: createdAt,
  };

  const sosSavedData = await sosRequestRepo.save(sosData);
  const sosId = sosSavedData.sosRequest_ID;

  let isAccepted = sosSavedData.isAccepted;

  let iterator = 0;
  while (iterator < cadet_ids.length && !isAccepted) {
    let index = 0;
    while (index < cadet_ids[iterator].length && !isAccepted) {
      const cadet = await cadetRepo.findOne({
        where: { user_id: cadet_ids[iterator][index].user_id },
      });

      if (cadet) {
        sendNotification(cadet.fcmToken, userMessage, sosId);
      }

      if (isAccepted) {
        return res.json({ status: "Successful", sosID: sosId ,cadetID: cadet?.user_id});
      }

      index++;
    }
    setTimeout(() => {
      // setting a timer for 30 sec and then allowing other set cadets to get notified
    }, 30 * 10e3);

    iterator++;
  }

  return res.json({
    data: {
      "5km": req.data.cadets[0],
      "10km": req.data.cadets[1],
      more: req.data.cadets[2],
    },
    message:
      "message can be sent successfully now, need to integrate notification",
  });
};

// A data base can be made for the sos request containing the
const acceptRequest = async (req: any, res: any) => {
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const sosData = await sosRequestRepo.findOne({
    where: { sosRequest_ID: req.sosID },
  });
  const userID = sosData?.userID;
  sosData!.cadetID = req.user_id;
  sosData!.acceptedAt = Date.now().toString();
  sosData!.isAccepted = true;
  await sosRequestRepo.update(req.sosID, sosData!);
  res.json({ status: "successful", userID: userID });
};

// SOCKET IO CODE ////////////
interface Map {
  [key: string]: string | object;
}

let client: Map = {};

io.on("connection", (socket: any) => {
  console.log("connected");
  console.log(`client connected with id :${socket.id}`);
  socket.on("sos", (msg: string) => {
    console.log(msg);
    // let msgData= JSON.parse(msg);
    // client[msgData["fromId"]] = socket;
    // console.log(client);
  });
});

/// SOCKET IO CODE ENDS HERE ///////////////////////

export const controller = {
  sendSOS,
  acceptRequest,
  sendNotification,
};
