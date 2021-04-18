const { ApolloServer, gql } = require("apollo-server");
const { parse } = require("graphql");

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello(name: String!): String
    #  to return a list of users
    users: [User]
    student(email: String!, id: ID): Student
    faculty(email: String!, id: ID): Faculty
    #  to retrieve a list of courses
    courses: [Course]
    #  to retrieve a list of assignments
    assignments: [Assignment]
    # Set a grade for a student by specifying the student ID and grade
    createAssignmentGrade(
      assignmentID: ID!
      studentID: ID!
      grade: Float!
    ): AssignmentGrade
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
    createCourse(name: String!, faculty_id: ID!): Course
    deleteCourse(courseID: ID!): Course
    addCourseStudent(name: String!, studentID: ID!): Course
    deleteCourseStudent(name: String!, studentID: ID!): Course
    createAssignment(courseID: ID!, name: String!): Assignment
    deleteAssignment(assignmentID: ID!): Assignment
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
    courses: [Course]
    gpa: Float!
  }

  type Faculty implements User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    courses: [Course]
  }

  type Admin implements User {
    id: ID!
    name: String!
    email: String!
    role: Role!
  }

  type Course {
    id: ID!
    name: String
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

// create a course_professoer database
let Course_Professor = [
  { id: 0, faculty_id: 2, name: "Course1" },
  { id: 1, faculty_id: 2, name: "Course2" },
  { id: 2, faculty_id: 2, name: "Course3" }
];

// create a course_professoer database, you can use the course_id to join the id from course_professor database,
// assuming each professor teaches 1 course
let Course_Student = [
  { id: 0, student_id: 1, name: "Course1" },
  { id: 1, student_id: 1, name: "Course2" },
  { id: 2, student_id: 1, name: "Course3" }
];

// Create an assignment database
let Assignments = [
  { id: 0, course_id: 0, name: "Assignment1" },
  { id: 1, course_id: 0, name: "Assignment2" },
  { id: 2, course_id: 1, name: "Assignment1" }
];

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
    courses: (root, args, context) => Course_Professor,
    assignments: (root, args, context) => Assignments,
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
    createUser: (_, { user }, context) => users.create(user),
    // Course needs course name, id, and use facultyID to link to faculty database
    createCourse: (_, { name, faculty_id }, context) => {
      let fID = parseInt(faculty_id, 10);
      const newCourse = {
        id: Course_Professor.length + 1,
        faculty_id: fID,
        name: name
      };
      Course_Professor.push(newCourse);
      return newCourse;
    },
    // Filter the course database by course ID, and delete that the ID is list item
    deleteCourse: (_, { courseID }, context) => {
      let cID = parseInt(courseID, 10);
      // find where Course ID match the desired id in the professor database
      const found = Course_Professor.find((c) => c.id === cID);
      // adding a conditon to check before seeting reduced_Course to Course
      if (found) {
        // ++++++++++ Delete the Course from Professor database
        Course_Professor = Course_Professor.filter((c) => c.id !== cID);

        return found;
      } else {
        throw new Error("Course ID: " + courseID + " is Not Found");
      }
    },
    // Add a student to a course. Do nothing if the student is already enrolled
    addCourseStudent: (_, { name, studentID }, context) => {
      let sID = parseInt(studentID, 10);
      const newStudentToCourse = {
        id: Course_Student.length + 1,
        student_id: sID,
        name: name
      };
      // add a condition to check if the student is already enrolled
      let Found = Course_Student.find(
        (s) => s.student_id === sID && s.name === name
      );

      // if Not Found then add the student to the list, else, alert that the student has been added
      if (!Found) {
        Course_Student.push(newStudentToCourse);
        return newStudentToCourse;
      } else {
        throw new Error("Student ID " + studentID + " had already been added");
      }
    },
    // Remove a student from a course
    // not working somehow, will detele all course for the student
    deleteCourseStudent: (_, { name, studentID }, context) => {
      let sID = parseInt(studentID, 10);
      // checking if the student_id and course_name are found
      const found = Course_Student.find(
        (c) => c.student_id === sID && c.name === name
      );
      // if found then delete the student and the course. If not, alert a message
      if (found) {
        Course_Student = Course_Student.filter(
          (c) => !(c.student_id === sID && c.name === name)
        );
        return found;
      } else {
        throw new Error(
          "Student ID " +
            studentID +
            " and Course name " +
            name +
            " is Not Found"
        );
      }
    },
    // Create an assignment for a given assignment name and course id
    createAssignment: (_, { courseID, name }, context) => {
      let cID = parseInt(courseID, 10);
      const newAssignment = {
        id: Assignments.length + 1,
        course_id: cID,
        name: name
      };
      // push the new assignment to the assignment
      Assignments.push(newAssignment);
      return newAssignment;
    },
    // Delete an assignment by ID
    deleteAssignment: (_, { assignmentID }, context) => {
      let assId = parseInt(assignmentID, 10);
      let found = Assignments.find((a) => a.id === assId);
      if (found) {
        Assignments = Assignments.filter((a) => a.id !== assId);
      }
      return found;
    }
  },
  // the resolver needs help in determining how to distinguish between the three concrete types at runtime.
  User: {
    __resolveType: (user, context, info) => user.role
  },

  // if It's courses if called under Faculty, retrieve the courses through id and place it to the courses variable of Faculty
  Faculty: {
    courses: (course) => {
      return Course_Professor.filter((c) => c.faculty_id === course.id);
    }
  },
  // if It's courses if called under Student, retrieve the courses through id and place it to the courses variable of Student
  Student: {
    courses: (course) => {
      return Course_Student.filter((c) => c.student_id === course.id);
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
