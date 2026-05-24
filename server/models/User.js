import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^[0-9]{4}[a-z]{4}[0-9]{3}@nitjsr\.ac\.in$/,
      'Email must be like 2023ugec128@nitjsr.ac.in'
    ]
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  hostel: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
    } ,
    isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  } 
}, { timestamps: true });

export default mongoose.model('User', userSchema);