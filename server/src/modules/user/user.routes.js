import express from "express";
import { getCurrentUser } from "./user.controller.js";
import isAuth from "../../middlewares/isAuth.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrentUser);

export default userRouter;
