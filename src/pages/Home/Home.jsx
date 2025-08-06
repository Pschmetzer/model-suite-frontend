import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, Mail } from "lucide-react";
import ButtonLoading from "../../resuable/loaders/ButtonLoader";
import logo from "/logo.webp";
import { startActivityTracking } from "../../utils/socket";
import {
  loginUser,
  verifyOTP,
  forcePermissionUpdate,
} from "../../globalstate/authSlice";

const Home = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [activeTab, setActiveTab] = useState("agency");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingData, setPendingData] = useState(null);

  // Magic Link states
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData({ identifier: "", password: "" });
    setError("");
    setSuccess("");
    setOtpSent(false);
    setOtp("");
    setPendingData(null);

    // Reset magic link states
    setShowMagicLink(false);
    setMagicLinkEmail("");
    setMagicLinkSent(false);
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      identifier: formData.identifier,
      password: formData.password,
    };

    if (payload.password.length < 8) {
      setError("Incorrect password.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "agency") {
        // Use Redux for agency login
        const result = await dispatch(
          loginUser({
            identifier: payload.identifier,
            password: payload.password,
            userType: "agency",
          }),
        ).unwrap();

        if (!result.token || !result.user) {
          // MFA flow
          setSuccess(result.message || "OTP sent");
          setOtpSent(true);
          setPendingData({ identifier: formData.identifier });
          return;
        }

        // ✅ Direct login success (either agency or employee)
        const role = result.user.role;
        setSuccess("Login successful");
        console.log("Home.jsx - Direct login success, user:", result.user);
        console.log("Home.jsx - User role:", role);
        console.log("Home.jsx - Full result:", result);

        // Force permission update and add delay to prevent race condition
        dispatch(forcePermissionUpdate());

        // Add more robust navigation with state verification
        setTimeout(() => {
          console.log("Home.jsx - About to navigate, checking Redux state...");
          const currentState = JSON.parse(localStorage.getItem("auth"));
          console.log("Home.jsx - Current localStorage auth:", currentState);

          if (role === "employee") {
            console.log(
              "Home.jsx - Navigating employee to /agency/employee/dashboard",
            );
            navigate("/agency/employee/dashboard");
          } else {
            console.log("Home.jsx - Navigating agency to /agency/dashboard");
            navigate("/agency/dashboard");
            startActivityTracking(); // optional: only for agency users
          }
        }, 300); // Increased delay to ensure state is fully updated
      } else {
        // Use Redux for model login (same as agency)
        const result = await dispatch(
          loginUser({
            identifier: payload.identifier,
            password: payload.password,
            userType: "model",
          }),
        ).unwrap();

        if (!result.token || !result.user) {
          // MFA flow
          setSuccess(result.message || "OTP sent");
          setOtpSent(true);
          setPendingData({ identifier: formData.identifier });
          return;
        }

        // ✅ Direct login success
        setSuccess("Login successful");
        console.log("Home.jsx - Model login success, user:", result.user);
        console.log("Home.jsx - Full result:", result);

        // Force permission update and add delay to prevent race condition
        dispatch(forcePermissionUpdate());

        // Add delay to ensure Redux state is fully updated
        setTimeout(() => {
          console.log("Home.jsx - About to navigate to model dashboard...");
          const currentState = JSON.parse(localStorage.getItem("auth"));
          console.log("Home.jsx - Current localStorage auth:", currentState);

          console.log("Home.jsx - Navigating to model dashboard");
          navigate("/model/dashboard");
        }, 300);
      }
    } catch (err) {
      console.error(err);
      if (activeTab === "agency") {
        // Redux error handling for agency login
        setError(err || "Login failed");
      } else {
        // Direct API error handling for model login
        setError(err.response?.data?.error || "Login failed");
      }
    } finally {
      setFormData({ identifier: "", password: "" });
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!pendingData || !pendingData.identifier) {
      setError("No pending data found. Please try logging in again.");
      setLoading(false);
      return;
    }

    if (!otp || otp.trim().length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "agency") {
        // Use Redux for agency OTP verification
        const result = await dispatch(
          verifyOTP({
            identifier: pendingData.identifier,
            otp,
            userType: "agency",
          }),
        ).unwrap();

        setSuccess(result.message || "Login successful");
        const role = result.user.role;
        console.log(
          "Home.jsx - Agency OTP verification success, user:",
          result.user,
        );
        console.log("Home.jsx - User role:", role);
        console.log("Home.jsx - Full OTP result:", result);

        // Force permission update and add delay to prevent race condition
        dispatch(forcePermissionUpdate());

        // Add more robust navigation with state verification
        setTimeout(() => {
          console.log(
            "Home.jsx - About to navigate after OTP, checking Redux state...",
          );
          const currentState = JSON.parse(localStorage.getItem("auth"));
          console.log(
            "Home.jsx - Current localStorage auth after OTP:",
            currentState,
          );

          if (role === "employee") {
            console.log(
              "Home.jsx - Navigating employee to /agency/employee/dashboard after OTP",
            );
            navigate("/agency/employee/dashboard");
          } else {
            console.log(
              "Home.jsx - Navigating agency to /agency/dashboard after OTP",
            );
            navigate("/agency/dashboard");
            startActivityTracking();
          }
        }, 300); // Increased delay to ensure state is fully updated
      } else {
        // Use Redux for model OTP verification
        const result = await dispatch(
          verifyOTP({
            identifier: pendingData.identifier,
            otp,
            userType: "model",
          }),
        ).unwrap();

        setSuccess(result.message || "Login successful");
        console.log(
          "Home.jsx - Model OTP verification success, user:",
          result.user,
        );
        console.log("Home.jsx - Full OTP result:", result);

        // Force permission update and add delay to prevent race condition
        dispatch(forcePermissionUpdate());

        // Add delay to ensure Redux state is fully updated
        setTimeout(() => {
          console.log(
            "Home.jsx - About to navigate to model dashboard after OTP...",
          );
          const currentState = JSON.parse(localStorage.getItem("auth"));
          console.log(
            "Home.jsx - Current localStorage auth after OTP:",
            currentState,
          );

          console.log("Home.jsx - Navigating to model dashboard after OTP");
          navigate("/model/dashboard");
        }, 300);
      }
    } catch (err) {
      console.error(err);
      if (activeTab === "agency") {
        // Redux error handling for agency OTP
        setError(err || "OTP verification failed");
      } else {
        // Direct API error handling for model OTP
        setError(err.response?.data?.error || "OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setMagicLinkLoading(true);

    if (!magicLinkEmail || !magicLinkEmail.trim()) {
      setError("Please enter a valid email address.");
      setMagicLinkLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${baseURL}/magic-login`, {
        email: magicLinkEmail,
        role: activeTab,
      });

      setSuccess("Magic link sent to your email!");
      setMagicLinkSent(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send magic link");
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const resetToLogin = () => {
    setOtpSent(false);
    setShowMagicLink(false);
    setMagicLinkSent(false);
    setOtp("");
    setMagicLinkEmail("");
    setPendingData(null);
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111827] text-white px-2 sm:px-0">
      <div className="shadow-lg border border-gray-500 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 w-full max-w-md bg-[#181F2A]">
        <div className="flex flex-col items-center gap-y-3 justify-center mb-2">
          <img
            src={logo}
            className="max-w-[60%] sm:max-w-[50%] mb-2"
            alt="Logo"
          />
          <h1 className="font-bold text-xl sm:text-2xl">WELCOME BACK</h1>
        </div>

        {/* Tabs below Welcome Back */}
        <div className="flex justify-center gap-2 mb-5 mt-5 sm:mb-6 sm:mt-6 flex-wrap">
          <button
            onClick={() => handleTabChange("agency")}
            className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors duration-200 ${
              activeTab === "agency"
                ? "bg-[#6917E0] text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Agency Login
          </button>
          <button
            onClick={() => handleTabChange("model")}
            className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors duration-200 ${
              activeTab === "model"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Model Login
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-sm text-center mb-2">{success}</p>
        )}

        {/* Main Content */}
        {!otpSent && !showMagicLink && !magicLinkSent ? (
          // Regular Login Form
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="flex flex-col">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Username / E-Mail
              </label>
              <input
                type="text"
                name="identifier"
                id="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Username or Email"
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col relative">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
              <div className="text-right mt-1">
                <Link
                  to={
                    activeTab === "agency"
                      ? "/agency/forgot-password"
                      : "/model/forgot-password"
                  }
                  className="text-sm text-primaryButtonColor hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              className={`w-full mt-2 ${
                activeTab === "agency"
                  ? "bg-[#6917E0] hover:bg-[#8f4ff0]"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200 text-white py-2 rounded-lg font-semibold flex items-center justify-center`}
              disabled={loading}
            >
              {loading ? <ButtonLoading /> : "Login"}
            </button>

            {/* Magic Link Section */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#181F2A] text-gray-400">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Login via Magic Link
            </button>
          </form>
        ) : otpSent ? (
          // OTP Form
          <form onSubmit={handleOtpSubmit} className="space-y-4 mt-2">
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
              className={`w-full mt-2 ${
                activeTab === "agency"
                  ? "bg-[#6917E0] hover:bg-[#8f4ff0]"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200 text-white py-2 rounded-lg font-semibold`}
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={resetToLogin}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Login
            </button>
          </form>
        ) : showMagicLink && !magicLinkSent ? (
          // Magic Link Email Form
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4 mt-2">
            <div className="flex flex-col">
              <label
                htmlFor="magicEmail"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="magicEmail"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
              disabled={magicLinkLoading}
            >
              {magicLinkLoading ? (
                <ButtonLoading />
              ) : (
                <>
                  <Mail size={18} />
                  Send Magic Link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetToLogin}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Login
            </button>
          </form>
        ) : (
          // Magic Link Sent Confirmation
          <div className="text-center space-y-4 mt-2">
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <Mail size={48} className="mx-auto text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Magic Link Sent!</h3>
              <p className="text-gray-300 text-sm">
                Check your email at{" "}
                <span className="text-purple-400">{magicLinkEmail}</span> and
                click the magic link to log in.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToLogin}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        )}

        <p className="text-sm text-center mt-4 text-gray-300">
          Don't have an account?{" "}
          <Link
            to={"/register"}
            className={`${
              activeTab === "agency" ? "text-[#6917E0]" : "text-blue-400"
            } hover:underline font-medium transition-colors`}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Home;
