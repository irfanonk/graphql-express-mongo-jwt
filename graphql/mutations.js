const { PostType, CommentType } = require("./types");

const { User } = require("../models");
const { GraphQLString } = require("graphql");
const OTPAuth = require("otpauth");
const crypto = require("crypto");

const {
  createJwtToken,
  passwordHash,
  comparePasswords,
} = require("../util/auth");
const { encode } = require("hi-base32");

const register = {
  type: GraphQLString,
  description: "Register new user",
  args: {
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    displayName: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { username, email, password, displayName } = args;

    if (!username || !email || !password) {
      throw new Error("Absent credentials");
    }
    const hashedPassword = await passwordHash(password);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName,
    });
    await user.save();
    const token = createJwtToken(user);
    return token;
  },
};

const login = {
  type: GraphQLString,
  description: "Login user",
  args: {
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email, password } = args;

    if (!email || !password) {
      throw new Error("Absent credentials");
    }
    const user = await User.findOne({ email }).select("+password");
    const isPasswordCorrect = await comparePasswords(password, user.password);

    if (!user || !isPasswordCorrect) {
      throw new Error("Invalid credentials");
    }

    let valid = false;
    if (!user.mfa) {
      valid = true;
    }

    const token = createJwtToken(user, valid);
    return token;
  },
};

const updatePassword = {
  type: GraphQLString,
  description: "Update user password",
  args: {
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    newPassword: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email, password, newPassword } = args;
    if (!email || !password || !newPassword) {
      throw new Error("Absent credentials");
    }
    const user = await User.findOne({ email }).select("+password");

    const isPasswordCorrect = await comparePasswords(password, user.password);

    if (!user || !isPasswordCorrect) {
      throw new Error("Invalid credentials");
    }

    const hashedPassword = await passwordHash(newPassword);

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    const response = "Updated";
    return response;
  },
};
const generateOtp = {
  type: GraphQLString,
  description: "Generate Otp",
  args: {
    email: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email } = args;
    if (!email) {
      throw new Error("Absent params");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    const buffer = crypto.randomBytes(15);
    const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);

    const totp = new OTPAuth.TOTP({
      issuer: "Test App",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: base32,
    });

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          otpBase32: base32,
        },
      }
    );

    return totp.toString();
  },
};

const enableOtp = {
  type: GraphQLString,
  description: "Enable Otp",
  args: {
    email: { type: GraphQLString },
    code: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email, code } = args;
    if (!email || !code) {
      throw new Error("Absent params");
    }
    const user = await User.findOne({ email });

    if (!user.otpBase32) {
      throw new Error("User has no otp");
    }

    if (user.mfa) {
      throw new Error("User has already otp");
    }

    const totp = new OTPAuth.TOTP({
      issuer: "Test App",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: user.otpBase32,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new Error("Invalid otp code");
    }
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          mfa: true,
        },
      }
    );
    const response = "MFA Enabled";
    return response;
  },
};
const disableOtp = {
  type: GraphQLString,
  description: "Disable Otp",
  args: {
    email: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email, code } = args;
    if (!email) {
      throw new Error("Absent params");
    }
    const user = await User.findOne({ email });

    if (!user.mfa) {
      throw new Error("User has no otp");
    }

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          mfa: false,
          otpBase32: "",
        },
      }
    );
    const response = "MFA Disabled";
    return response;
  },
};
const verifyOtp = {
  type: GraphQLString,
  description: "Enable Otp",
  args: {
    email: { type: GraphQLString },
    code: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { email, code } = args;
    if (!email || !code) {
      throw new Error("Absent params");
    }
    const user = await User.findOne({ email });

    if (!user.otpBase32) {
      throw new Error("User has no otp");
    }

    if (!user.mfa) {
      throw new Error("User has no otp");
    }

    const totp = new OTPAuth.TOTP({
      issuer: "Test App",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: user.otpBase32,
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      throw new Error("Invalid otp code");
    }

    const valid = true;

    const token = createJwtToken(user, valid);
    return token;
  },
};

module.exports = {
  register,
  login,
  updatePassword,
  generateOtp,
  enableOtp,
  disableOtp,
  verifyOtp,
};
