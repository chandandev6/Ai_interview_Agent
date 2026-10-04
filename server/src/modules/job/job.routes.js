import express from "express";
import isAuth from "../../middlewares/isAuth.js";
import validate from "../../middlewares/validate.js";
import { jobIdParamsSchema } from "./job.schema.js";
import { getJob } from "./job.controller.js";

const jobRouter = express.Router();

// polling route — sasta read hai, global limiter kaafi (aiLimiter nahi, warna har 2s ka poll AI limit kha jaata)
jobRouter.get("/:id", isAuth, validate({ params: jobIdParamsSchema }), getJob);

export default jobRouter;
