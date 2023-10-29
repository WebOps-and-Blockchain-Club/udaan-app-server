import AppDataSource from "../config";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../entities/user";
import OtpVerify from "../entities/otpVerify";
import nodemailer from "nodemailer";

const generateAccessToken = (user: User): String => {
  const id = user.user_id;
  return jwt.sign({ id: id }, process.env.TOKEN_SECRET || "", {
    expiresIn: "20s",
  });
};

const generateRefreshToken = (user: User): String => {
  const id = user.user_id;
  return jwt.sign({ id: id }, process.env.REFRESH_TOKEN_SECRET || "");
};

// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   auth: {
//     user: process.env.AUTH_EMAIL,
//     pass: process.env.AUTH_PASSWORD,
//   },
// });

let refreshTokens: any = [];

const refresh = async (req: any, res: any) => {
  const refreshToken = req.body.token;

  if (!refreshToken)
    return res.status(401).json({ message: "You are not authenticated." });
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: "Refresh token is not valid." });
  }
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET || "",
    (err: any, user: any) => {
      err && console.log(err);
      refreshTokens = refreshTokens.filter((token: any) => {
        token !== refreshToken;
      });
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      refreshTokens.push(newRefreshToken);

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }
  );
};

const login = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (!user || !user.verified) {
    res.status(404).json({ error: "User not found, Please Register." });
  } else {
    const matchPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!matchPassword) {
      res.status(404).json({ error: "Invalid Credentials" });
    } else {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      refreshTokens.push(refreshToken);
      res.status(200).json({
        message: "User Logged In",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    }
  }
};

const register = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User)

  const user = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (user) {
    if (user.verified) {
      res.status(203).json({
        message: "User already Registered, Please Login to your account",
      });
    } else {
      res.status(202).json({
        message: "User already exist, please verify",
      });
      const otp_Sent = sendOtp(user, res)
      console.log(otp_Sent)
    }

  } else {
    let user = { ...req.body };
    const hashedpassword = await bcrypt.hash(user.password, 12);
    user.password = hashedpassword;
    await sendOtp(user, res)
  }
};

const logout = (req: any, res: any) => {
  const refreshToken = req.body.token;
  refreshTokens = null;
  return res.json({ message: "User logged out" });
};

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});


// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//       user: 'dawson.rempel85@ethereal.email',
//       pass: 'NzauPxaYP9wA5j9SqJ'
//   }
// });

const sendOtp = async (user: any, res: any) => {
  // console.log(user)
  const otpRepo = AppDataSource.getRepository(OtpVerify)

  let userExist = await otpRepo.findOne({
    where: { email: user.email }
  })

  if (userExist) {
    await otpRepo.delete({email: user.email})
  }

  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: 'Verification Email',
      text: 'This is a test email sent from Node.js using Nodemailer.',
      html: `<p>Enter ${otp}</p>`
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

    // console.log(newOtp)
    try {
      const otpsaved = await otpRepo.save(newOtp)
    } catch (err) {
      console.log(err)
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // transporter.sendMail(mailOptions)

    res.json({
      status: "Pending",
      message: "otp sent",
      data: {
        userId: user.user_id,
        email: user.email
      }
    })

  } catch {
    res.json({
      status: "Failed",
      message: "otp sent"
    })
  }
}


const verifyOTP = async (req: any, res: any) => {
  const userRepo = AppDataSource.getRepository(User);

  try {
    let user = req.body.user;
    console.log(user)
    let inputEmail = user.email;
    let inputOtp = req.body.otp

    console.log(inputEmail)
    console.log(inputOtp)
    if (!inputEmail || !inputOtp) {
      throw Error("empty otp details not allowed")
    } else {
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
            await otpRepo.delete({ email: inputEmail })
            await userRepo.save(user);

            res.send({
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
  refresh,
  login,
  register,
  logout,
  verifyOTP,
  resendOTPVerificationCode,
};
