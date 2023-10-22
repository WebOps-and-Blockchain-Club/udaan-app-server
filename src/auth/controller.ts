import AppDataSource from "../config";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../entities/user";

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
  const user = await userRepo.findOne({
    where: { email: req.body.email },
  });

  if (user) {
    res
      .status(203)
      .json({
        message: "User already Registered, Please Login to your account",
      });
  } else {
    let user = { ...req.body };
    const hashedpassword = await bcrypt.hash(user.password, 12);
    user.password = hashedpassword;

    const newUser = await userRepo.save(user);

    const id = newUser.id;
    res.status(200).json({ message: "User Registered", newUser: newUser });
  }
};

const logout = (req: any, res: any) => {
  const refreshToken = req.body.token;
  refreshTokens = null;
  return res.json({ message: "User logged out" });
};

export const controller = {
  refresh,
  login,
  register,
  logout,
};
