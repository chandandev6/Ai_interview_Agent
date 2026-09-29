// jaan-bujh ke bheja gaya error (400/401/404...) — errorHandler iska message user ko dikhata hai
// code (optional) = frontend ke liye fixed naam, e.g. "EMAIL_NOT_VERIFIED" — message badle to bhi frontend ka if na toote
class AppError extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export default AppError;
