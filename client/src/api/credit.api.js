// credits ki passbook (signup bonus, interview, refund, purchase)
import api from "./axios.js";

const body = (response) => response.data;

export const getTransactions = ({ page = 1, limit = 10 } = {}) =>
    api.get("/api/credits/transactions", { params: { page, limit } }).then(body);
