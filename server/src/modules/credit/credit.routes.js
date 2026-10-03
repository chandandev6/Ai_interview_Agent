import express from "express";
import isAuth from "../../middlewares/isAuth.js";
import validate from "../../middlewares/validate.js";
import { transactionsQuerySchema } from "./credit.schema.js";
import { listTransactions } from "./credit.controller.js";

const creditRouter = express.Router();

creditRouter.get("/transactions", isAuth, validate({ query: transactionsQuerySchema }), listTransactions);

export default creditRouter;
