const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema
({
    email: 
    { type: String, 
      required: [true, "Please provide an email address"], 
      unique: true, 
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, "Please provide a valid email address"]
    },
    username: 
    { type: String, 
      required: [true, "Username is required"], 
      unique: true, 
      trim: true 
      //match: [/^[a-zA-Z0-9]+$/, "Username can only contain letters, numbers, and underscores"]
    },
    password: 
    { type: String, 
      required: [true, "Password is required"], 
      minlength: [6, "Password must be at least 6 characters long"],
      select: false // Exclude password from query results by default
    },
    createdAt: 
    { type: Date, 
      default: Date.now 
    }
})
