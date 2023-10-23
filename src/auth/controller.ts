import AppDataSource from "../config";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../entities/user";
import Otp from "../entities/otpvarification";
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

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

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

  if (!user) {
    res.status(404).json({ error: "User not found" });
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
  const userRepo = AppDataSource.getRepository(User);
  const otpRepo = AppDataSource.getRepository(Otp);
  const user = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (user) {
    res.status(203).json({
      message: "User already Registered, Please Login to your account",
    });
  } else {
    let user = { ...req.body };
    const hashedpassword = await bcrypt.hash(user.password, 12);
    user.password = hashedpassword;

    const newUser = await userRepo.save(user);
    const id = newUser.id;
    const email = newUser.email;
    sendOTPVerificationEmail({ id, email }, res);
    res.status(200).json({ message: "User Registered", newUser: newUser });
  }
};

const logout = (req: any, res: any) => {
  const refreshToken = req.body.token;
  refreshTokens = null;
  return res.json({ message: "User logged out" });
};

const sendOTPVerificationEmail = async (req: any, res: any) => {
  const { id, email } = req;
  const otpRepo = AppDataSource.getRepository(Otp);
  try {
    const otp = `${Math.floor(Math.random() * 9000 + 1000)}`;
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email addreess and complete the sign up process <p> <p> This code <b>expires in 1 hrs</b></p>`,
    };

    const saltRounds = 10;

    const hashedOPT = await bcrypt.hash(otp, saltRounds);
    let otpData: Otp = new Otp();
    otpData.user_id = id;
    otpData.otp = hashedOPT;
    otpData.createdAt = Date.now();
    otpData.expiresAt = Date.now() + 3600000;

    await otpRepo.save(otpData);

    await transporter.sendMail(mailOptions);
    res.json({
      status: "PENDING",
      message: "Verification otp email sent",
      data: {
        userId: id,
        email,
      },
    });
  } catch (error: any) {
    res.json({
      status: "Failed",
      message: error.message,
    });
  }
};

const verifyOTP = async (req: any, res: any) => {
  try {
    const otpRepo = AppDataSource.getRepository(Otp);
    const userRepo = AppDataSource.getRepository(User);
    let { userId, otp } = req.body;
    if (!userId || !otp) {
      throw Error("Empty otp details are not allowed");
    } else {
      const otpData = await otpRepo.find({
        where: { user_id: userId },
      });

      if (otpData.length <= 0) {
        throw new Error(
          "Account Record doesen't exists or has been varified already . Please sign up login "
        );
      } else {
        const { expiresAt } = otpData[0];
        const hashedOPT = otpData[0].otp;

        if (expiresAt < Date.now()) {
          throw new Error("Code has expired. Please request again.");
        } else {
          const validOPT = await bcrypt.compare(otp, hashedOPT);
          if (!validOPT) {
            throw new Error("Invalid code passed . Check your inbox ");
          } else {
            await userRepo.update(userId, { varified: true });
            await otpRepo.delete(userId);
            res.json({
              status: "VARIFIED",
              message: "User email varified successfully",
            });
          }
        }
      }
    }
  } catch (error: any) {
    res.json({
      status: "Failed",
      message: error.message,
    });
  }
};

const resendOTPVerificationCode = async (req: any, res: any) => {
  try {
    const otpRepo = AppDataSource.getRepository(Otp);
    let { userId, email } = req.body;

    if (!userId || !email) {
      throw Error("Empty user details are not allowed ");
    } else {
      await otpRepo.delete(userId);
      sendOTPVerificationEmail({ userId, email }, res);
    }
  } catch (error: any) {
    res.json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const controller = {
  refresh,
  login,
  register,
  logout,
  verifyOTP,
  resendOTPVerificationCode,
};
