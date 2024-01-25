import "reflect-metadata";
import AppDataSource from "../config";
import User from "../entities/user";
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

const sendNotificationToCadets = async (
  registrationToken: string,
  userMessage: string,
  sosId:string
) => {
  // This registration token comes from the client FCM SDKs.
  console.log(registrationToken);
  const message = {
    // notification: {
    //   title: "SOS HELP REQUIRED",
    //   body: `${userMessage == "" ? "URGENT HELP REQUIRED." : userMessage}`,
    // },

    data: {
        title: "SOS HELP REQUIRED",
        body: `${userMessage == "" ? "URGENT HELP REQUIRED." : userMessage}`,
        sosRequest_ID:sosId,
    },
    token: registrationToken,
  }

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

interface CadetInfo {
  user_id: string;
  coordinates: string;
  distance: number;
}

const sendSOS = async (req: any, res: any) => {
  const data = req.data;
  const userID = data.user_id
  const cadet_ids: CadetInfo[][] = data.cadet_ids

  const userMessage = req.body.userMessage;
  const cadetRepo = AppDataSource.getRepository(User);
  const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
  const createdAt = (Date.now()).toString();
  const sosData = { userID: userID, userMessage: userMessage, createdAt: createdAt };
  
  const sosSavedData1 = await sosRequestRepo.save(sosData);
  const sosId = sosSavedData1.sosRequest_ID;

  console.log(`in sos notification`)
  console.log(`userMessage: ${userMessage}`)
  // return ;
  // console.log(cadet_ids[0][0])
  // for(let )
  let index = 0;
  while(index < cadet_ids[0].length){
    console.log(cadet_ids[0][index].user_id);
    const cadet = await cadetRepo.findOne({ where: { user_id: cadet_ids[0][index].user_id } });
    sendNotificationToCadets(cadet!.fcmToken, userMessage,sosId);
    index++;
  }  
  return res.json({message: "ekfjkgukyg"});
  setTimeout(() => {
    // setting a timer for 30 sec and then allowing other set cadets to get notified
  }, 30 * 10e3);
  // return;
  const sosSavedData2 = await sosRequestRepo.findOne({
    where: { sosRequest_ID: sosId },
  });
  let isAccepted = sosSavedData2?.isAccepted;
  if (!isAccepted) {
    for (const cadet_id in cadet_ids[1]) {
      const cadet = await cadetRepo.findOne({ where: { user_id: cadet_id } });
      sendNotificationToCadets(cadet!.fcmToken, userMessage,sosId);
    }
  } else {
    res.send("Request Send Successfully");
  }

  setTimeout(() => {
    // setting a timer for 30 sec and then allowing other set cadets to get notified
  }, 30 * 10e3);

  const sosSavedData3 = await sosRequestRepo.findOne({
    where: { sosRequest_ID: sosId },
  });
  isAccepted = sosSavedData3?.isAccepted;
  console.log(cadet_ids);
  if (!isAccepted) {
    for (const cadet_id in cadet_ids[2]) {
      const cadet = await cadetRepo.findOne({ where: { user_id: cadet_id } });
      
      sendNotificationToCadets(cadet!.fcmToken, userMessage,sosId);
    }
  } else {
    res.send("Request Send Successfully");
  }
};

// A data base can be made for the sos request containing the

const acceptRequest = async (req: any, res: any) => {
    const sosRequestRepo = AppDataSource.getRepository(SOSRequestInfo);
    const cadetID = req.user_id;
    const acceptedAt = (Date.now()).toString();
    const isAccepted=true;

    const sosData = {cadetID: cadetID,isAccepted: isAccepted,acceptedAt: acceptedAt}

    const sosSavedData= await sosRequestRepo.update(req.body.sosId,sosData);
    res.send(sosSavedData);

    // TODO SET UP A SOCKET 
};

export const controller = {
  sendSOS,
  acceptRequest,
};