const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} = require("graphql");

const { User } = require("../models");

const UserType = new GraphQLObjectType({
  name: "User",
  description: "User type",
  fields: () => ({
    id: { type: GraphQLID },
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    displayName: { type: GraphQLString },
    mfa: { type: GraphQLBoolean },
  }),
});

module.exports = { UserType };
