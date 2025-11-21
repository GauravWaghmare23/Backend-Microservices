const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: [true, "Username must be lowercase"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: [true, "Email must be lowercase"],
            trim: true,
            match: [
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
                "Please fill a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    try {
        this.password = await argon2.hash(this.password);
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.comparePassword = async function (password) {
    try {
        return await argon2.verify(this.password, password);
    } catch (error) {
        return await error;
    }
};

userSchema.index({ username: "text" });



const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = UserModel;
