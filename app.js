const express = require("express");

const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { V4 } = require("uuid");

const { sequelize } = require("sequelize");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userDetails.db");

let db = null;

//The below block of code is a function to initialize a server
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeServer();

//The below block of code is a function to authenticate it act as a middleware function
const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcd", (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

//this below block of code is get method.it return single object
app.get("/details/:userId", async (request, response) => {
  const { userId } = request.params;
  const getQuery = `
    SELECT * FROM users WHERE 
    user_id = ${userId};`;
  const userDetail = await db.get(getQuery);
  response.send(userDetail);
});

//this block of code is put method and it return
app.put("/update"),
  authentication,
  async (request, response) => {
    const userDetails = request.body;
    const userId = V4();
    const now = new Date();
    const lastLoggedTime = now.toLocaleString();

    const {
      userName,
      userEmail,
      userPassword,
      userImage,
      totalOrders,
    } = userDetails;
    const updateQuery = `
    UPDATE users 
    SET user_id = "${userId}",user_name="${userName}", user_email="${userEmail}",user_password="${userPassword}", user_image="${userImage}", total_orders=${totalOrders}, created_at="${lastLoggedTime}", last_logged_in="${lastLoggedTime}"
    WHERE user_id = ${userId};`;

    const updateStatus = await db.run(updateQuery);

    response.send("updated Successfully");
  };

//this get method return user image where the condition met
app.get("/image/:userId", async (request, response) => {
  const { userId } = request.params;
  const getImageQuery = `
      SELECT user_image FROM users WHERE user_id = ${userId};`;

  const userImageUrl = await db.get(getImageQuery);
  response.send(userImageUrl);
});

//This post method use to insert new row in the table
app.post("/insert", authentication, async (request, response) => {
  const newUserDetail = request.body;
  const {
    userName,
    userEmail,
    userImage,
    userPassword,
    totalOrders,
    createdAt,
    lastLoggedTime,
  } = newUserDetail;
  const userId = V4();

  const insertQuery = `
      INSERT INTO users (userId,user_name, user_email, user_password, user_image, total_orders, created_at, last_logged_in)
      VALUES("${userId}", "${userName}", "${userEmail}", "${userPassword}", "${userImage}", "${totalOrders}", "${createdAt}", "${lastLoggedTime}"); `;

  const postStatus = await db.run(insertQuery);
  response.send("Inserted Successfully");
});

//this delete method delete the user details when the condition met
app.delete("/delete/:userId", async (request, response) => {
  const { userId } = request.params;
  const deleteQuery = `
    DELETE FROM users WHERE user_id = ${userId};`;

  await db.run(deleteQuery);
  response.send("Deleted Successfully");
});

module.exports = app;
