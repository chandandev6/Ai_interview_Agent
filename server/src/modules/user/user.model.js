import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // "Abc@Gmail.com" aur "abc@gmail.com" ek hi user
            trim: true,
        },
        // bcrypt hash — plain password kabhi save nahi hota
        // select:false = normal queries me aata hi nahi, login me .select("+password") se maangna padta hai
        // Google-only users ke liye khaali rehta hai
        password: {
            type: String,
            select: false,
        },
        // email/password users ko link click karna padta hai; Google login par Google ne email already verify kiya hota hai
        isVerified: {
            type: Boolean,
            default: false,
        },
        // verification link ka token — DB me sirf uska sha256 hash (DB leak ho to bhi koi link nahi bana sakta)
        verificationToken: {
            type: String,
            select: false,
        },
        verificationTokenExpires: {
            type: Date,
            select: false,
        },
        // "forgot password" link ka token — same idea: DB me sirf hash, 1 ghante me expire
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        credit: {
            type: Number,
            default: 500,
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
