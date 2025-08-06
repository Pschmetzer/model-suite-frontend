import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import ButtonLoading from "../../resuable/loaders/ButtonLoader";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const handleSendOtp = async (e) => {
    setLoading(true);
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!identifier || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(`${baseURL}/model/forgot-password`, {
        identifier,
        newPassword,
        confirmPassword,
      });
      setSuccess(res.data.message || "OTP sent successfully.");
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    setOtpLoading(true);
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    if (otp.length < 6) {
      setError("Invalid OTP.");
      return;
    }

    try {
      const res = await axios.post(
        `${baseURL}/model/forgot-password/verify-otp`,
        {
          identifier,
          otp,
        },
      );
      setSuccess(res.data.message || "Password reset successful.");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  const logo = "/logo.webp";
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111827] text-white px-2 sm:px-0">
      <div className="shadow-lg border border-gray-500 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 w-full max-w-md bg-[#181F2A]">
        <div className="flex flex-col items-center gap-y-3 justify-center mb-4">
          {/* <img src={logo} className="max-w-[60%] sm:max-w-[50%] mb-2" alt="Logo" /> */}
          <h1 className="font-bold text-xl sm:text-2xl text-center text-blue-600">
            {otpSent ? "Verify OTP" : "Forgot Password"}
          </h1>
        </div>
        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-sm text-center mb-2">{success}</p>
        )}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4 mt-2">
            <div className="flex flex-col">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Model Email / Username / Phone
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email / username / phone"
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col relative">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                New Password
              </label>
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            <div className="flex flex-col relative">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            <button
              type="submit"
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white py-2 rounded-lg font-semibold flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <ButtonLoading /> : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-2">
            <div className="flex flex-col">
              <label
                htmlFor="otp"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white py-2 rounded-lg font-semibold flex items-center justify-center"
              disabled={otpLoading}
            >
              {otpLoading ? <ButtonLoading /> : "Verify OTP & Reset Password"}
            </button>
          </form>
        )}
        <p className="text-sm text-center mt-4 text-gray-300">
          Back to{" "}
          <Link
            to="/"
            className="text-blue-400 hover:underline font-medium transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
