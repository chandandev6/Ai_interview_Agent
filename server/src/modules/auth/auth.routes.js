import express from "express";
import { googleAuth, logout } from "./auth.controller.js";
import validate from "../../middlewares/validate.js";
import { googleSchema } from "./auth.schema.js";

const authRouter = express.Router();

// pehle body check, phir controller
authRouter.post("/google", validate({ body: googleSchema }), googleAuth);
authRouter.post("/logout", logout);

export default authRouter;
