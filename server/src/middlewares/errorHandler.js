// Express 5 async errors khud yaha bhej deta hai — controllers me try/catch ki zarurat nahi
export const notFound = (req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export const errorHandler = (err, req, res, next) => {
    const status = err.status || (err.name === "MulterError" ? 400 : 500);
    if (status >= 500) {
        console.error("Unhandled error:", err);
    }
    res.status(status).json({
        success: false,
        message: status >= 500 ? "Internal server error" : err.message,
    });
}
