// jaan-bujh ke bheja gaya error (400/401/404...) — errorHandler iska message user ko dikhata hai
class AppError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export default AppError;
