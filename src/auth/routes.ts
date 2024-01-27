import { Router } from "express";
import {controller} from "./controller";

export const authRoutes = Router();

authRoutes.post('/login',controller.login);
authRoutes.post('/register',controller.register);
authRoutes.post('/verifyotp',controller.verifyOTP);
authRoutes.post('/resendotp',controller.resendOTPVerificationCode);