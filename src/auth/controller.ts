import AppDataSource from "../config";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../entities/user";
import nodemailer from "nodemailer";

const generateAccessToken = (user_id: String) => {
  const id = user_id;
  return jwt.sign({ id: id }, process.env.TOKEN_SECRET || "", {
    expiresIn: "2h",
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

const login = async (req: any, res: any) => {
  // res.status(200).json({statusCode: 200, accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcyYmFhN2E2LWFiZGUtNDhiMS05MmE1LTM4NjM1NjE1YmQ0ZSIsImlhdCI6MTcwNjI2OTEyNCwiZXhwIjoxNzA2Mjc2MzI0fQ.R1jOPAj_swV4vI8etsBFjQ3BNLQd8Zry1XWNj7USeM4"})

  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({
    where: { email: req.body.email },
  });
  console.log(req.body)
  if (!user) {
    res.status(404).json({ error: "User not found, Please Register." });
  } else {
    console.log(req.body)
    const matchPassword = await bcrypt.compare(req.body.password, user.password);
    if (!matchPassword) {
      res.status(401).json({ error: "Invalid Credentials" });
    } else {
      let latitude = req.body.coordinates.split(" ")[0];
      let longitude = req.body.coordinates.split(" ")[1];
      user.coordinates = JSON.stringify({ latitude: latitude, longitude: longitude });
      const accessToken = generateAccessToken(user.user_id);
      await userRepo.update(user.user_id, user);

      return res.status(200).json({
        message: "User Logged In",
        accessToken: accessToken,
      });
    }
  }
};

const register = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);

  const existingUser = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (existingUser) {
    return res.status(409).json({
      error: "User already exists. Please login.",
    });
  } else {
    let email = req.body.email;
    await sendOtp(email, res);
  }
};

const sendOtp = async (email: any, res: any) => {

  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: 'Verification Email',
      text: `Enter the code: ${otp}​. This is OTP will expire in 1 hrs`,
      html: `<p>Enter the code: <strong>${otp}</strong></p>
      <p>This is OTP will <strong>expire in 1 hrs</strong></p>`
    };

    const saltRounds = 10
    const hashedOtp = await bcrypt.hash(otp, saltRounds)

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    console.log(`otp has been sent successfully`);

    return res.status(200).json({
      otp: hashedOtp,
      now: Date.now()
    })

  } catch {
    return res.status(401).json({
      status: "Failed",
      message: "otp sent"
    })
  }
}

const verifyOTP = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);

  const data = req.body;
  const user: User = { ...data };
  
  try {
    if (!user) {
      throw Error("empty otp details not allowed")
    } else {
      
      try {
        let latitude = data.coordinates.split(" ")[0];
        let longitude = data.coordinates.split(" ")[1];
        user.coordinates = JSON.stringify({ latitude: latitude, longitude: longitude });
        
        await userRepo.save(user);

        const accessToken = generateAccessToken(user.user_id);

        res.status(201).send({
          status: "verified",
          message: ({ message: "User Registered" }),
          accessToken: accessToken,
        })
      } catch (error) {
        return res.status(500).json({
          message: "Failed to save user."
        })
      }
    }
  } catch (error) {
    res.json({
      status: "Failed"
    })
  }
}

const resendOTPVerificationCode = async (req: any, res: any) => {
  try {
    let userId = req.body.userId
    let inputEmail = req.body.inputEmail

    const token = req.body.jwt;
    const payload: JwtPayload = jwt.verify(token, process.env.OTP_SECRET!) as JwtPayload
    const user: User = { ...payload.user };

    if (!userId || !inputEmail) {
      throw Error("empty otp details not allowed")
    } else {
      await sendOtp(user.email, res);
    }
  } catch (error) {
    res.json({
      status: "failed"
    })
  }
}

export const controller = {
  login,
  register,
  verifyOTP,
  resendOTPVerificationCode,
};

