const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = express();
const cookieParser = require("cookie-parser");
const bcryptjs = require("bcryptjs");

const User = require("./models/user");
const Message = require("./models/message");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const ws = require("ws");

app.use(express.json());
app.use(cookieParser());

const bcryptSalt = bcryptjs.genSaltSync(10);

const allowedOrigins = ["http://localhost:5173", "http://localhost:5173/"]; // Add your client's origin(s)

app.use(
  cors({
    origin: function (origin, callback) {
      //console.log(origin);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials in the request
  })
);

dotenv.config();

try {
  mongoose.connect(process.env.DB);
  console.log("connected to database successfully");
} catch (error) {
  console.log(error);
  console.log("could not connect to database properly");
}

const jwtsecret = process.env.JWT_SECRET;

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    //console.log("amreet reached here 1");
    if (token) {
      jwt.verify(token, jwtsecret, {}, (err, userData) => {
        if (err) {
          throw err;
        }
        //console.log("amreet reached here 2");
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtsecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, bcryptSalt);
  const createdUser = await User.create({
    username: username,
    password: hashedPassword,
  });
  try {
    const token = await jwt.sign(
      { userId: createdUser._id, username },
      jwtsecret
    );
    //console.log("Token:", token);
    res.cookie("token", token).status(201).json({
      id: createdUser._id,
      username,
    });
  } catch (error) {
    console.error("Error signing token:", error);
    res.status(500).json({ error: "Registration failed" });
  }

  // res.cookie("token", token).status(201).json(ok);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });

  if (foundUser) {
    const passOk = bcryptjs.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtsecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json({
            id: foundUser._id,
          });
        }
      );
    } else {
      res.status(404).json({ message: "password does not match" });
    }
  }
});

app.post("/logout", async (req, res) => {
  res.cookie("token", "").json("ok");
});

// this is to get the message historyfor a particular user
app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  //console.log(userId, ourUserId);
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// this is to get the no of people who have logged in

app.get("/people", async (req, res) => {
  // these means we are finding all the user with an id and username
  //So, the overall meaning of this code is to retrieve all documents from the "User" collection,
  // but only include the "_id" and "username" fields in the result
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

const server = app.listen(4000, () => {
  console.log("Listening on port 4000");
});

//gtpFzVsabbYumYiy

const wss = new ws.WebSocketServer({ server });

//read username and id from cookie for this connection
wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      //console.log(client);
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((client) => {
            //console.log(client.username);
            return { userId: client.userId, username: client.username };
          }),
        })
      );
    });
  }

  connection.isAlive = true;
  // we are pinging and waiting for pong as we want the users whch have disconnected to be shown offline
  connection.timer = setInterval(() => {
    connection.ping();

    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      connection.terminate();
      clearInterval(connection.timer);
      // this func sends to all logged in users about the current online people
      notifyAboutOnlinePeople();
      //console.log("dead");
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  //console.log("websocket connected");
  const cookies = req.headers.cookie;

  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));

    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      jwt.verify(token, jwtsecret, {}, (err, userData) => {
        if (err) throw err;

        const { userId, username } = userData;
        connection.userId = userId;
        connection.username = username;
      });
    }
  }
  //receiving a text message from the client
  // we receive this from sendMessage from Chat.jsx
  connection.on("message", async (message) => {
    messageData = JSON.parse(message.toString());

    const { recipient, text } = messageData;

    if (recipient && text) {
      // filling the database

      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
      });
      //console.log(messageDoc);

      [...wss.clients]
        .filter((client) => client.userId == recipient)
        .forEach((client) =>
          client.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  //notify everyone about online people when someone connects

  notifyAboutOnlinePeople();
});
