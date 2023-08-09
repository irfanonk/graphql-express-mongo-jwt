// Import required stuff from graphql
const { GraphQLSchema, GraphQLObjectType } = require("graphql");

// Import queries
const { users, user } = require("./queries");

// Import mutations
const {
  register,
  login,
  updatePassword,
  generateOtp,
  enableOtp,
  disableOtp,
} = require("./mutations");

// Define QueryType
const QueryType = new GraphQLObjectType({
  name: "QueryType",
  description: "Queries",
  fields: { users, user },
});

// Define MutationType
const MutationType = new GraphQLObjectType({
  name: "MutationType",
  description: "Mutations",
  fields: {
    register,
    login,
    updatePassword,
    generateOtp,
    enableOtp,
    disableOtp,
  },
});

module.exports = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
