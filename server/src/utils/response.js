// har success response ka ek hi shape: { success, message, data }
export const sendSuccess = (res, { status = 200, message = "OK", data = null } = {}) => {
    return res.status(status).json({ success: true, message, data });
}
