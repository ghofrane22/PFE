const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const isAuth = require("../middlewares/auth");
const User = require("../models/user");
require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const nodemailer = require("nodemailer");

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
});
// Multer configuration for file upload
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "/", // Specify the folder name in your Cloudinary account
    allowed_formats: ["jpg", "png", "gif", "webp"], // Specify the allowed image formats
    public_id: (req, file) => Math.random(), // Generate a unique public ID for each uploaded file
  },
});

const upload = multer({ storage: storage });

router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      city,
      town,
      diplome,
      cin,
      phoneNumber,
      address,
      role,
    } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      res.status(409).json({ status: false, message: "Email already Exist !" });
    } else {
      bcrypt.hash(password, 12, async (err, hash) => {
        if (err) {
          res.status(500).json({ status: false, message: err });
        } else if (hash) {
          const user = await User.create({
            firstName,
            lastName,
            email,
            password: hash,
            city,
            town,
            diplome,
            cin,
            phoneNumber,
            address,
            role,
          });
          res.status(201).json({
            status: true,
            message: `${role} created successfully`,
            data: user,
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, message: err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email: email });

    if (findUser) {
      if (findUser.authorized) {
        bcrypt.compare(password, findUser.password).then(function (result) {
          if (result == true) {
            jwt.sign(
              {
                username: findUser.username,
                email: findUser.email,
                role: findUser.role,
                _id: findUser._id,
              },
              process.env.SECRETKEY,
              {
                expiresIn: "7d",
              },
              (err, token) => {
                if (err) {
                  console.log(err);
                } else if (token) {
                  res
                    .status(200)
                    .json({ message: "Logged Successfully", data: token });
                }
              }
            );
          } else {
            res.status(404).json({ message: "password wrong ! " });
          }
        });
      } else {
        res
          .status(401)
          .json({
            message: "Your not Authorized To Sign in Please Contact Support",
          });
      }
    } else {
      res.status(404).json({ message: "Email not Found ! " });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/current", isAuth, (req, res) => {
  if (req.user) {
    res.send({ status: true, msg: "authorized", user: req.user });
  } else {
    res.send({ status: false, msg: "unauthorised" });
  }
});

module.exports = router;
