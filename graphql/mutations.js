const { PostType, CommentType } = require("./types");

const { User } = require("../models");
const { GraphQLString } = require("graphql");

const {
  createJwtToken,
  passwordHash,
  comparePasswords,
} = require("../util/auth");

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
    try {
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
    } catch (error) {
      console.log("resolve  error:", error);
      throw new Error(error);
    }
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

    try {
      const user = await User.findOne({ email: args.email }).select(
        "+password"
      );
      const isPasswordCorrect = await comparePasswords(password, user.password);

      if (!user || !isPasswordCorrect) {
        throw new Error("Invalid credentials");
      }

      const token = createJwtToken(user);
      return token;
    } catch (error) {
      console.log("resolve  error:", error);
      throw new Error(error);
    }
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

    try {
      const user = await User.findOne({ email: args.email }).select(
        "+password"
      );

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
    } catch (error) {
      console.log("resolve  error:", error);
      throw new Error(error);
    }
  },
};

const enableMfa = {
  type: GraphQLString,
  description: "Login user",
  args: {
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const user = await User.findOne({ email: args.email }).select("+password");
    console.log(user);
    if (!user || args.password !== user.password) {
      throw new Error("Invalid credentials");
    }

    const response = "Updated";
    return response;
  },
};

module.exports = {
  register,
  login,
  updatePassword,
};
