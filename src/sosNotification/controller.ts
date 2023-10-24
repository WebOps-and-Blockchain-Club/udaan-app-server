import "reflect-metadata";
import AppDataSource from "../config";
import User from "../entities/user";
import Cadet from "../entities/cadet";
import SOSRequestInfo from "../entities/sosRequest";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { compareSync } from "bcrypt";

// For recieving and sending SOS notification
process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp({
  credential: applicationDefault(),
  projectId: "ncc-udaan",
});

const deg2rad = (degrees: any) => {
  // converts degree into radian
  return degrees * (Math.PI / 180);
};

const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
  // calculating the distance between two locations
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a = // just math
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance.toFixed(2); // Distance rounded to 2 decimal places
};

//Function to get the Nearest Cadets with respect to a given user
const nearestCadet = (user: User) => {
  let cadets: any = [];
  let shortestDistance = Number.MAX_SAFE_INTEGER;
  let index = 0;
  for (var i = 0; i < cadets.length; i++) {
    let user_lat = JSON.parse(user.coordinates).latitude;
    let user_long = JSON.parse(user.coordinates).longitude;
    let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
    let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
    let dist = parseFloat(
      calculateDistance(user_lat, user_long, cadet_lat, cadet_long)
    );

    if (dist < shortestDistance) {
      shortestDistance = dist;
      index = i;
    }
    cadets[i].distance = dist;
  }
  // cadets.sort()
  return cadets;
};

const getCadetUserId = async (userId: string) => {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { user_id: userId },
  });

  const cadetRepo = AppDataSource.getRepository(Cadet);
  const cadets = await cadetRepo.find({
    where: { city: user?.city },
  });

  const nearestCadets = await nearestCadet(user as User);
  console.log(nearestCadets);

  let firstBatch: any = [];
  let secondBatch: any = [];
  let thirdBatch: any = [];
  for (let i = 0; i < nearestCadets.length; i++) {
    if (nearestCadets[i].distance <= 5) {
      firstBatch.push(nearestCadets[i].cadet_id);
    } else if (
      nearestCadets[i].distance > 5 &&
      nearestCadets[i].distance <= 10
    ) {
      secondBatch.push(nearestCadets[i].cadet_id);
    } else {
      thirdBatch.push(nearestCadets[i].cadet_id);
    }
  }

  console.log(nearestCadets);
  console.log(firstBatch, secondBatch, thirdBatch);

  return [firstBatch, secondBatch, thirdBatch];
};

const sendNotificationToCadets = async (
  registrationToken: string,
  userMessage: string
) => {
  // This registration token comes from the client FCM SDKs.
  console.log(registrationToken);
  const message = {
    notification: {
      title: "SOS HELP REQUIRED",
      body: `${userMessage == "" ? "URGENT HELP REQUIRED." : userMessage}`,
    },

    // data: {
    //   score: "850",
    //   time: "2:45",
    // },
    token: registrationToken,
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  getMessaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

const sendSOS = async (req: any, res: any) => {
  const userID: string = req.body.userID;
  const userMessage: string = req.body.userMessage;
  const cadetRepo = AppDataSource.getRepository(Cadet);
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const createdAt: number = Date.now();
  const sosData = { userID, userMessage, createdAt };
  const sosSavedData1 = await sosRequestRepo.save(sosData);
  const sosId = sosSavedData1.sosRequest_ID;

  let [firstBatch, secondBatch, thirdBatch] = await getCadetUserId(userID);

  for (const cadet_id in firstBatch) {
    const cadet = await cadetRepo.findOne({ where: { cadet_id: cadet_id } });
    sendNotificationToCadets(cadet!.fcmToken, userMessage);
  }
  await setTimeout(() => {
    // setting a timer for 30 sec and then allowing other set cadets to get notified
  }, 30 * 10e3);

  const sosSavedData2 = await sosRequestRepo.findOne({
    where: { sosRequest_ID: sosId },
  });
  let isAccepted = sosSavedData2?.isAccepted;
  if (!isAccepted) {
    for (const cadet_id in secondBatch) {
      const cadet = await cadetRepo.findOne({ where: { cadet_id: cadet_id } });
      sendNotificationToCadets(cadet!.fcmToken, userMessage);
    }
  } else {
    res.send("Request Send Successfully");
  }

  await setTimeout(() => {
    // setting a timer for 30 sec and then allowing other set cadets to get notified
  }, 30 * 10e3);

  const sosSavedData3 = await sosRequestRepo.findOne({
    where: { sosRequest_ID: sosId },
  });
  isAccepted = sosSavedData3?.isAccepted;
  if (!isAccepted) {
    for (const cadet_id in thirdBatch) {
      const cadet = await cadetRepo.findOne({ where: { cadet_id: cadet_id } });
      sendNotificationToCadets(cadet!.fcmToken, userMessage);
    }
  } else {
    res.send("Request Send Successfully");
  }
};

// A data base can be made for the sos request containing the

const acceptRequest = async (req: any, res: any) => {};

export const controller = {
  sendSOS,
};
