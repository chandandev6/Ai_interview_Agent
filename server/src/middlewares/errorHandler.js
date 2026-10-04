import AppError from "../utils/AppError.js";

// Express 5 async errors khud yaha bhej deta hai — controllers me try/catch ki zarurat nahi
export const notFound = (req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// 4 params zaruri hai — Express isi se pehchanta hai ki ye error handler hai (_next use nahi hota)
export const errorHandler = (err, req, res, _next) => {
    const isAppError = err instanceof AppError;
    const status = err.status || (err.name === "MulterError" ? 400 : 500);
    if (status >= 500) {
        // pino-http response wali log line me ye error (stack ke saath) daal deta hai — reqId ke saath, alag log ki zarurat nahi
        res.err = err;
    }
    res.status(status).json({
        success: false,
        // AppError ka message humne khud likha hai (5xx bhi) — dikhana safe; baaki 500 ka andar ka detail chhupao
        message: isAppError || status < 500 ? err.message : "Internal server error",
        ...(isAppError && err.code && { code: err.code }),
        requestId: req.id, // user support ko ye bataye → hum logs me turant dhoondh le
    });
};
