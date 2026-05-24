import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../utils/api';

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hostel, setHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState(""); 
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');

  const navigate = useNavigate();

  // 1. Handle the initial registration (Sends the email)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const name = `${firstName} ${lastName}`;

    if (!/^\d{4}$/.test(roomNumber)) {
      alert("Room number must be exactly 4 digits.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        hostel,
        roomNumber,
        rollNumber,
      });

      alert("Registration successful! Check your email for the OTP.");
      setShowOtpScreen(true); // Switch the UI to the OTP screen
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      alert("Email verified! You can now log in.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.msg || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // 3. Render the OTP Screen if registration succeeded
  if (showOtpScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-10 px-4 py-12">
        <div className="w-full max-w-md bg-yellow-50 shadow-xl rounded-xl p-8">
          <h2 className="text-3xl font-semibold text-center text-gray-900">Verify Email</h2>
          <br />
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-center text-gray-600 mb-4">
              We sent a 6-digit code to <br/><strong>{email}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm text-center tracking-widest text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition duration-300"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-10 px-4 py-12">
      <div className="w-full max-w-md bg-yellow-50 shadow-xl rounded-xl p-8">
        <h2 className="text-3xl font-semibold text-center text-gray-900">Sign up</h2>
        <br />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="First Name*"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-1/2 px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
              required
            />
            <input
              type="text"
              placeholder="Last Name*"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-1/2 px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Registration Number*"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="w-full px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
            required
          />

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Hostel*"
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-1/2 px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
              required
            />
            <input
              type="text"
              placeholder="Room No*"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              maxLength={4}
              className="w-1/2 px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
              required
            />
          </div>

          <input
            type="email"
            placeholder="Email*"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
            required
          />

          <input
            type="password"
            placeholder="Password*"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border-b-2 focus:outline-none focus:border-blue-500 placeholder:text-sm"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-black py-2 rounded-md transition duration-300"
          >
            {loading ? "Signing up..." : "Create Account"}
          </button>

          <div className="text-center mt-2 text-sm">
            <a href="/login" className="text-blue-600 hover:underline">
              Already have an account?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;