import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { startActivityTracking } from "../../utils/socket";
import {
  loginUser,
  verifyOTP,
  clearError,
  forcePermissionUpdate,
} from "../../globalstate/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, otpRequired, pendingData } = useSelector(
    (state) => state.auth,
  );

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setSuccess("");

    try {
      const result = await dispatch(
        loginUser({
          identifier: formData.identifier,
          password: formData.password,
          userType: "agency",
        }),
      ).unwrap();

      // Check if OTP is required
      if (!result.token || !result.user) {
        setSuccess(result.message || "OTP sent");
        return;
      }

      // Direct login success
      const role = result.user.role;
      setSuccess("Login successful");
      console.log(
        "Login successful, user role:",
        role,
        "navigating to dashboard",
      );

      // Force permission update and navigate after state is updated
      setTimeout(() => {
        dispatch(forcePermissionUpdate());
        console.log("Permission update dispatched");

        // Navigate after a small delay to ensure Redux state is updated
        setTimeout(() => {
          console.log("About to navigate to dashboard");
          if (role === "employee") {
            navigate("/agency/employee/dashboard");
          } else {
            navigate("/agency/dashboard");
            startActivityTracking();
          }
        }, 50);
      }, 100);
    } catch (err) {
      console.error(err);
      // Error is handled by Redux
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setSuccess("");

    try {
      const result = await dispatch(
        verifyOTP({
          identifier: pendingData.identifier,
          otp,
          userType: "agency",
        }),
      ).unwrap();

      setSuccess("Login successful");
      const role = result.user.role;
      console.log(
        "OTP verification successful, user role:",
        role,
        "navigating to dashboard",
      );

      // Force permission update and navigate after state is updated
      setTimeout(() => {
        dispatch(forcePermissionUpdate());
        console.log("Permission update dispatched after OTP");

        // Navigate after a small delay to ensure Redux state is updated
        setTimeout(() => {
          console.log("About to navigate to dashboard after OTP");
          if (role === "employee") {
            navigate("/agency/employee/dashboard");
          } else {
            navigate("/agency/dashboard");
            startActivityTracking();
          }
        }, 50);
      }, 100);
    } catch (err) {
      console.error(err);
      // Error is handled by Redux
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md border-t-4 border-[#6917E0]">
          <h2 className="text-3xl font-extrabold text-center text-white mb-6 drop-shadow-sm">
            Agency Login
          </h2>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center mb-4">{success}</p>
          )}

          {!otpRequired ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Email or Username"
                className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="text-right">
                <Link
                  to="/agency/forgot-password"
                  className="text-sm text-blue-400 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6917E0] text-white py-2 rounded-lg hover:bg-[#8f4ff0] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          <p className="text-sm text-center mt-4 text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/agency/register"
              className="text-[#6917E0] hover:underline font-medium"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>

      <footer className="mt-auto py-6 text-center text-gray-500 text-sm border-t border-gray-800 bg-gray-900">
        &copy; {new Date().getFullYear()} ModelSuite. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
