const { ApolloServer, gql } = require("apollo-server");

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello(name: String!): String
    #  to return a list of users
    users: [User]
    student(email: String!, id: ID): Student
    faculty(email: String!, id: ID): Faculty
  }

  # Role = an enumeration of valid user roles
  enum Role {
    Admin
    Student
    Faculty
  }

  # Add a Mutation section to the schema, to say exactly which subset of user attributes you want to retrieve.
  # It will take an object with three fields (name, email, role), create a new User object, push it onto the users list, and return the new user object.
  # Just like in RESTAPI, dont use GET request to modefiy data, in GraphQL, any operations that cause writes should be sent explicitly via a mutation
  type Mutation {
    createUser(name: String!, email: String!, role: Role!): User
  }
  # User type which includes the role as one of it's fields
  # Interfaces are useful when you want to return an object or set of objects, but those might be of several different types.
  interface User {
    id: ID!
    name: String!
    email: String!
    role: Role!
  }
  type Student implements User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    #    courses: [Course]
    gpa: Float!
  }

  type Faculty implements User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    #    courses: [Course]
  }

  type Admin implements User {
    id: ID!
    name: String!
    email: String!
    role: Role!
  }

  type Course {
    id: ID!
    name: String!
    professor: Faculty
    students: [Student]
    assignments: [Assignment]
  }

  type Assignment {
    id: ID!
    name: String!
    course: Course!
    grades: [AssignmentGrade]
  }

  type AssignmentGrade {
    id: ID!
    assignment: Assignment
    student: User
    grade: String!
  }
`;

// this.users is similar to self.users in python class variable
class Users {
  // declare class variables
  constructor() {
    this.nextID = 2;
    this.users = [
      { id: 0, name: "zero", email: "zero@example.com", role: "Admin" },
      { id: 1, name: "one", email: "one@example.com", role: "Student" },
      { id: 2, name: "prof", email: "admin@example.com", role: "Faculty" }
    ];
  }
  // class function which returns class variables
  getUsers() {
    return this.users;
  }
}

// To create a new users object
const users = new Users();

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: (root, args, context) => `Hello ${args.name}!`,
    users: (root, args, context) => users.getUsers(),
    // student: (root, args, context) => {
    //   const id = parseInt(args.id, 10);
    //   return users.getUsers().find((u) => u.id === id);
    // }
    student: (root, args, context) => {
      const email = args.email;
      // If the string begins with any other value, the radix is 10 (decimal)
      const id = parseInt(args.id, 10);
      // if email is null or blank, search through id and only return if role is student
      if (email === null || email === "") {
        let student = users
          .getUsers()
          .find((u) => u.id === id && u.role === "Student");
        if (student) {
          return student;
        } else {
          throw new Error("ID " + id + " is not Found in Student Database");
        }
      }
      // if email is not null or blank, search through email and only return if role is student
      else if (email !== null || email !== "") {
        let student = users
          .getUsers()
          .find((u) => u.email === email && u.role === "Student");
        if (student) {
          return student;
        } else {
          throw new Error(email + " is not Found in Student Database");
        }
      }
    },
    faculty: (root, args, context) => {
      const email = args.email;
      // If the string begins with any other value, the radix is 10 (decimal)
      const id = parseInt(args.id, 10);
      // if email is null or blank, search through id and only return if role is student
      if (email === null || email === "") {
        let Faculty = users
          .getUsers()
          .find((u) => u.id === id && u.role === "Faculty");
        if (Faculty) {
          return Faculty;
        } else {
          throw new Error("ID " + id + " is not Found in Faculty Database");
        }
      }
      // if email is not null or blank, search through email and only return if role is student
      else if (email !== null || email !== "") {
        let Faculty = users
          .getUsers()
          .find((u) => u.email === email && u.role === "Faculty");
        if (Faculty) {
          return Faculty;
        } else {
          throw new Error(email + " is not Found in Faculty Database");
        }
      }
    }
  },
  Mutation: {
    createUser: (_, { user }, context) => users.create(user)
  },
  // the resolver needs help in determining how to distinguish between the three concrete types at runtime.
  User: {
    __resolveType: (user, context, info) => user.role
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
