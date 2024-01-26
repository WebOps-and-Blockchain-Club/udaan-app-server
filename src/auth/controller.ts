import AppDataSource from "../config";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../entities/user";
import OtpVerify from "../entities/otpVerify";
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
  res.status(200).json({statusCode: 200, accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcyYmFhN2E2LWFiZGUtNDhiMS05MmE1LTM4NjM1NjE1YmQ0ZSIsImlhdCI6MTcwNjI2OTEyNCwiZXhwIjoxNzA2Mjc2MzI0fQ.R1jOPAj_swV4vI8etsBFjQ3BNLQd8Zry1XWNj7USeM4"})
  
  // const userRepo = AppDataSource.getRepository(User);

  // const user = await userRepo.findOne({
  //   where: { email: req.body.email },
  // });

  // if (!user) {
  //   res.status(404).json({ error: "User not found, Please Register." });
  // } else {
  //   const matchPassword = await bcrypt.compare(req.body.password, user.password);
  //   if (!matchPassword) {
  //     res.status(401).json({ error: "Invalid Credentials" });
  //   } else {
  //     const accessToken = generateAccessToken(user.user_id);

  //     return res.status(200).json({
  //       message: "User Logged In",
  //       accessToken: accessToken,
  //     });
  //   }
  // }
};

const register = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);

  const existingUser = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (existingUser) {
    res.status(409).json({
      error: "User already exists. Please login.",
    });
  } else {
    let newUser = { ...req.body };
    const hashedPassword = await bcrypt.hash(newUser.password, 12);
    newUser.password = hashedPassword;
    newUser.distance = 0;
    newUser.isAvailable = true
    newUser.fcmToken = "12345678909876tresdfghjmnbvcdertyujbvcfgh"
    console.log(`User password is hashed: ${newUser.password}`);

    await sendOtp(newUser, res);
  }
};

const sendOtp = async (user: any, res: any) => {
  console.log(`otp sent to this address: ${user}`)
  const otpRepo = AppDataSource.getRepository(OtpVerify)

  let userExist = await otpRepo.findOne({
    where: { email: user.email }
  })

  if (userExist) {
    await otpRepo.delete({ email: user.email })
  }

  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    console.log(`otp has been created: ${otp}`)

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: 'Verification Email',
      text: `Enter the code: ${otp}​. This is OTP will expire in 1 hrs`,
      html: `<p>Enter the code: <strong>${otp}</strong></p>
      <p>This is OTP will <strong>expire in 1 hrs</strong></p>`
    };

    const saltRounds = 10
    const hashedOtp = await bcrypt.hash(otp, saltRounds)
    let newOtp = new OtpVerify();
    newOtp = {
      user_id: user.user_id,
      email: user.email,
      otp: hashedOtp,
      createdAt: new Date(Date.now()),
      expiresAt: new Date(Date.now() + 3600000)
    }

    try {
      await otpRepo.save(newOtp)
    } catch (err) {
      console.error(err)
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    console.log(`otp has been sent successfully: ${user}`)

    return res.status(200).json({
      status: "Pending",
      message: "otp sent",
      user: user
    })

  } catch {
    return res.status(404).json({
      status: "Failed",
      message: "otp sent"
    })
  }
}

const verifyOTP = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);
  console.log(`data of user for verifying otp: ${req.body}`)

  try {
    let user = req.body;
    console.log(user.password)
    let inputEmail = user.email;
    let inputOtp = user.otp

    if (!inputEmail || !inputOtp) {
      throw Error("empty otp details not allowed")
    } else {
      const otpRepo = AppDataSource.getRepository(OtpVerify)

      const userOtpVerification = await otpRepo.findOne({
        where: { email: inputEmail }
      })

      console.log(`user to be verified: ${userOtpVerification}`)

      if (!userOtpVerification) {
        throw new Error("Account record doesn't exist or verified")
      } else {
        const expiresAt = userOtpVerification.expiresAt
        const otp = userOtpVerification.otp

        console.log(`otp in database: ${otp}`)


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
            await otpRepo.delete({ email: inputEmail })
            await userRepo.save(user);
            console.log(`user saved ${user}`)

            const accessToken = generateAccessToken(user.user_id);

            res.status(201).send({
              status: "verified",
              message: ({ message: "User Registered" }),
              accessToken: accessToken,
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
}

const resendOTPVerificationCode = async (req: any, res: any) => {
  try {
    let userId = req.body.userId
    let inputEmail = req.body.inputEmail

    if (!userId || !inputEmail) {
      throw Error("empty otp details not allowed")
    } else {
      const otpRepo = AppDataSource.getRepository(OtpVerify)
      await otpRepo.delete({ email: inputEmail })
      const user = {
        user_id: userId,
        email: inputEmail
      }
      console.log(user)
      await sendOtp(user, res)
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
