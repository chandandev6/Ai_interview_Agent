import multer from "multer";

// resume ko memory me rakho — parse karke text DB me save karenge, disk pe file nahi chahiye
// (multiple servers pe local disk share nahi hoti)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== "application/pdf") {
            const error = new Error("Only PDF resumes are allowed");
            error.status = 400;
            return cb(error);
        }
        cb(null, true);
    },
});

export default upload;
