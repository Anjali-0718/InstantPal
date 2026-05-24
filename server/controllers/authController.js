import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ The Bulletproof Render + Gmail Config
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Changed to 587
  secure: false, // MUST be false when using port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // ✅ Fail-safes: If Google doesn't answer in 10 seconds, throw an error instead of hanging forever
  connectionTimeout: 10000, 
  greetingTimeout: 10000,
  socketTimeout: 10000
});

export const registerUser = async (req, res) => {
  try {
    const { name, rollNumber, email, password, hostel, roomNumber } = req.body;
     
    const emailPrefix = email.split('@')[0]; 
    if (emailPrefix !== rollNumber) {
      return res.status(400).json({ 
        msg: 'Mismatch: Your Registration Number must match the beginning of your email.' 
      });
    }

    if (!/^[0-9]{4}[a-z]{4}[0-9]{3}@nitjsr\.ac\.in$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid college email format.' }); // changed 'error' to 'msg' for consistency
    }

const existingUser = await User.findOne({
      $or: [{ email }, { rollNumber }]
    });    
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ msg: 'User already exists. Please log in.' });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        existingUser.name = name;
        existingUser.rollNumber = rollNumber;
        existingUser.password = hashedPassword;
        existingUser.hostel = hostel;
        existingUser.roomNumber = roomNumber;
        existingUser.otp = generatedOtp;
        existingUser.otpExpires = otpExpiry;

        await existingUser.save();

        try {
          await transporter.sendMail({
            from: `"Instapal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your Instapal Account',
            html: `<h2>Welcome to Instapal!</h2>
                   <p>Your 6-digit verification code is: <strong style="font-size: 24px;">${generatedOtp}</strong></p>
                   <p>This code will expire in 10 minutes.</p>`
          });
          return res.status(200).json({ msg: 'Registration updated. Please check your email for the new OTP.' });
        } catch (emailErr) {
          console.error("Nodemailer Error:", emailErr);
          return res.status(500).json({ msg: "Email failed to send. Check backend terminal for Nodemailer errors." });
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({ 
      name, 
      rollNumber, 
      email, 
      password: hashedPassword, 
      hostel, 
      roomNumber,
      isVerified: false,
      otp: generatedOtp,
      otpExpires: otpExpiry
    });
    
    await newUser.save();

    try {
      await transporter.sendMail({
        from: `"Instapal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your Instapal Account',
        html: `<h2>Welcome to Instapal!</h2>
               <p>Your 6-digit verification code is: <strong style="font-size: 24px;">${generatedOtp}</strong></p>
               <p>This code will expire in 10 minutes.</p>`
      });
      res.status(201).json({ msg: 'Registration successful. Please check your email for the OTP.' });
    } catch (emailErr) {
      console.error("Nodemailer Error:", emailErr);
      res.status(500).json({ msg: "Email failed to send. Check backend terminal for Nodemailer errors." });
    }

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'OTP has expired. Please register again.' });
    }

    // Success! Verify user and clear the OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: 'Email and password required' });

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Security Check: Block login if email isn't verified
    if (!user.isVerified) {
      return res.status(403).json({ msg: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hostel: user.hostel,
        roomNumber: user.roomNumber
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  const user = req.user; 
  if (user) {
    res.json({
      name: user.name,
      email: user.email,
      hostel: user.hostel,
      rollNumber: user.rollNumber,
      roomNumber: user.roomNumber,
      id: user._id
    });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};