const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = express();
const cookieParser = require("cookie-parser");
const bcryptjs = require("bcryptjs");

const User = require("./models/user");
const jwt = require("jsonwebtoken");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());

const bcryptSalt = bcryptjs.genSaltSync(10);

const allowedOrigins = ["http://localhost:5173"]; // Add your client's origin(s)

app.use(
  cors({
    origin: function (origin, callback) {
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

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  //console.log("amreet reached here 1");
  if (token) {
    jwt.verify(token, jwtsecret, {}, (err, userData) => {
      if (err) {
        throw err;
      }
      //console.log("amreet reached here 2");
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

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

//gtpFzVsabbYumYiy
