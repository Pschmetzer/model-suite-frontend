import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import ButtonLoading from "../resuable/loaders/ButtonLoader";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";

const Register = () => {
  // Form data states for both agency and model registration
  const [agencyFormData, setAgencyFormData] = useState({
    agencyName: "",
    agencyEmail: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [modelFormData, setModelFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState("agency");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingData, setPendingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false); // <-- Add this line

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const handleAgencyChange = (e) => {
    const { name, value } = e.target;
    setAgencyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModelChange = (e) => {
    const { name, value } = e.target;
    setModelFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    setOtpSent(false);
    setOtp("");
    setPendingData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    let payload;
    let endpoint;

    if (activeTab === "agency") {
      const { agencyName, agencyEmail, username, password, confirmPassword } =
        agencyFormData;

      if (
        !agencyName ||
        !agencyEmail ||
        !username ||
        !password ||
        !confirmPassword
      ) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Passwords must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      payload = {
        agencyName,
        agencyEmail,
        username,
        password,
        confirmPassword,
      };
      endpoint = `${baseURL}/agency/register/send-otp`;
    } else {
      const { fullName, email, username, password, confirmPassword } =
        modelFormData;

      if (!fullName || !email || !username || !password || !confirmPassword) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Passwords must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      payload = { fullName, email, username, password, confirmPassword };
      endpoint = `${baseURL}/model/register/send-otp`;
    }

    try {
      const res = await axios.post(endpoint, payload, {
        withCredentials: true,
      });

      setSuccess(res.data.message);
      setOtpSent(true);
      setPendingData(payload);

      // Clear form only on success
      if (activeTab === "agency") {
        setAgencyFormData({
          agencyName: "",
          agencyEmail: "",
          username: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setModelFormData({
          fullName: "",
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setOtpLoading(true);

    try {
      let verifyPayload;
      let verifyEndpoint;
      let successRoute = "/";

      if (activeTab === "agency") {
        verifyPayload = {
          otp,
          agencyEmail: pendingData.agencyEmail,
        };
        if (verifyPayload.otp.length < 6) {
          setError("Invalid Otp.");
          return;
        }
        verifyEndpoint = `${baseURL}/agency/register/verify-otp`;
        successRoute = "/agency/dashboard";
      } else {
        verifyPayload = {
          otp,
          email: pendingData.email,
        };
        if (verifyPayload.otp.length < 6) {
          setError("Invalid Otp.");
          return;
        }
        verifyEndpoint = `${baseURL}/model/register/verify-otp`;
        successRoute = "/model/dashboard";
      }

      const res = await axios.post(verifyEndpoint, verifyPayload, {
        withCredentials: true,
      });
      if (res.data.token && res.data.user) {
        localStorage.setItem(
          "auth",
          JSON.stringify({ user: res.data.user, token: res.data.token }),
        );
        navigate(successRoute);
      } else {
        setError("Something went wrong while registering.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    }
  };

  // const renderRegistrationForm = () => {
  //   if (activeTab === "agency") {
  //     return (
  //       <div className="space-y-4">
  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="agencyName"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Agency Name
  //           </label>
  //           <input
  //             type="text"
  //             name="agencyName"
  //             id="agencyName"
  //             value={agencyFormData.agencyName}
  //             onChange={handleAgencyChange}
  //             placeholder="Agency Name"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="agencyEmail"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Agency Email
  //           </label>
  //           <input
  //             type="email"
  //             name="agencyEmail"
  //             id="agencyEmail"
  //             value={agencyFormData.agencyEmail}
  //             onChange={handleAgencyChange}
  //             placeholder="Agency Email"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="username"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Username
  //           </label>
  //           <input
  //             type="text"
  //             name="username"
  //             id="username"
  //             value={agencyFormData.username}
  //             onChange={handleAgencyChange}
  //             placeholder="Username"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2 relative">
  //           <label
  //             htmlFor="password"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Password
  //           </label>
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             name="password"
  //             id="password"
  //             value={agencyFormData.password}
  //             onChange={handleAgencyChange}
  //             placeholder="Password"
  //             className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //           />
  //           <span
  //             onClick={() => setShowPassword((prev) => !prev)}
  //             className="absolute right-3 top-[32px] cursor-pointer text-gray-400 hover:text-gray-200"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </span>
  //         </div>

  //         <div className="flex flex-col space-y-2 relative">
  //           <label
  //             htmlFor="confirmPassword"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Confirm Password
  //           </label>
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             name="confirmPassword"
  //             id="confirmPassword"
  //             value={agencyFormData.confirmPassword}
  //             onChange={handleAgencyChange}
  //             placeholder="Confirm Password"
  //             className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
  //           />
  //           <span
  //             onClick={() => setShowPassword((prev) => !prev)}
  //             className="absolute right-3 top-[32px] cursor-pointer text-gray-400 hover:text-gray-200"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </span>
  //         </div>
  //       </div>
  //     );
  //   } else {
  //     return (
  //       <div className="space-y-4">
  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="fullName"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Full Name
  //           </label>
  //           <input
  //             type="text"
  //             name="fullName"
  //             id="fullName"
  //             value={modelFormData.fullName}
  //             onChange={handleModelChange}
  //             placeholder="Full Name"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="email"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Email
  //           </label>
  //           <input
  //             type="email"
  //             name="email"
  //             id="email"
  //             value={modelFormData.email}
  //             onChange={handleModelChange}
  //             placeholder="Email"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2">
  //           <label
  //             htmlFor="modelUsername"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Username
  //           </label>
  //           <input
  //             type="text"
  //             name="username"
  //             id="modelUsername"
  //             value={modelFormData.username}
  //             onChange={handleModelChange}
  //             placeholder="Username"
  //             className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  //           />
  //         </div>

  //         <div className="flex flex-col space-y-2 relative">
  //           <label
  //             htmlFor="modelPassword"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Password
  //           </label>
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             name="password"
  //             id="modelPassword"
  //             value={modelFormData.password}
  //             onChange={handleModelChange}
  //             placeholder="Password"
  //             className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  //           />
  //           <span
  //             onClick={() => setShowPassword((prev) => !prev)}
  //             className="absolute right-3 top-[32px] cursor-pointer text-gray-400 hover:text-gray-200"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </span>
  //         </div>

  //         <div className="flex flex-col space-y-2 relative">
  //           <label
  //             htmlFor="modelConfirmPassword"
  //             className="text-sm font-medium text-gray-300"
  //           >
  //             Confirm Password
  //           </label>
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             name="confirmPassword"
  //             id="modelConfirmPassword"
  //             value={modelFormData.confirmPassword}
  //             onChange={handleModelChange}
  //             placeholder="Confirm Password"
  //             className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  //           />
  //           <span
  //             onClick={() => setShowPassword((prev) => !prev)}
  //             className="absolute right-3 top-[32px] cursor-pointer text-gray-400 hover:text-gray-200"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </span>
  //         </div>
  //       </div>
  //     );
  //   }
  // };

  // --- Centered card layout below ---
  const logo = "/logo.webp";
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111827] text-white px-2 sm:px-0">
      <div className="shadow-lg border border-gray-500 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 w-full max-w-md bg-[#181F2A]">
        <div className="flex flex-col items-center gap-y-3 justify-center mb-2">
          <img
            src={logo}
            className="max-w-[60%] sm:max-w-[50%] mb-2"
            alt="Logo"
          />
          <h1 className="font-bold text-xl sm:text-2xl">
            {activeTab === "agency"
              ? "Agency Registration"
              : "Model Registration"}
          </h1>
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
            Agency Register
          </button>
          <button
            onClick={() => handleTabChange("model")}
            className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors duration-200 ${
              activeTab === "model"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Model Register
          </button>
        </div>
        {/* Error/Success Messages */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-sm text-center mb-2">{success}</p>
        )}
        {/* Registration or OTP Form */}
        {!otpSent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Custom grouped layout for Agency and Model */}
            {activeTab === "agency" ? (
              <>
                {/* Row 1: Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:col-span-2">
                    <label
                      htmlFor="agencyEmail"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Agency Email
                    </label>
                    <input
                      type="email"
                      name="agencyEmail"
                      id="agencyEmail"
                      value={agencyFormData.agencyEmail}
                      onChange={handleAgencyChange}
                      placeholder="Agency Email"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                {/* Row 2: Agency Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label
                      htmlFor="agencyName"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Agency Name
                    </label>
                    <input
                      type="text"
                      name="agencyName"
                      id="agencyName"
                      value={agencyFormData.agencyName}
                      onChange={handleAgencyChange}
                      placeholder="Agency Name"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="username"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={agencyFormData.username}
                      onChange={handleAgencyChange}
                      placeholder="Username"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                {/* Row 3: Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={agencyFormData.password}
                      onChange={handleAgencyChange}
                      placeholder="Password"
                      className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <PasswordStrengthIndicator
                      password={agencyFormData.password}
                    />

                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={agencyFormData.confirmPassword}
                      onChange={handleAgencyChange}
                      placeholder="Confirm Password"
                      className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Row 1: Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:col-span-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={modelFormData.email}
                      onChange={handleModelChange}
                      placeholder="Email"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Row 2: Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={modelFormData.fullName}
                      onChange={handleModelChange}
                      placeholder="Full Name"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="modelUsername"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="modelUsername"
                      value={modelFormData.username}
                      onChange={handleModelChange}
                      placeholder="Username"
                      className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Row 3: Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col relative">
                    <label
                      htmlFor="modelPassword"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="modelPassword"
                      value={modelFormData.password}
                      onChange={handleModelChange}
                      placeholder="Password"
                      className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <PasswordStrengthIndicator
                      password={modelFormData.password}
                    />
                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                  </div>
                  <div className="flex flex-col relative">
                    <label
                      htmlFor="modelConfirmPassword"
                      className="text-sm font-medium text-gray-300 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="modelConfirmPassword"
                      value={modelFormData.confirmPassword}
                      onChange={handleModelChange}
                      placeholder="Confirm Password"
                      className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-[38px] cursor-pointer text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                  </div>
                </div>
              </>
            )}
            <button
              type="submit"
              className={`w-full mt-2 ${
                activeTab === "agency"
                  ? "bg-[#6917E0] hover:bg-[#8f4ff0]"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200 text-white py-2 rounded-lg font-semibold flex items-center justify-center`}
              disabled={loading}
            >
              {loading ? <ButtonLoading /> : "Register"}
            </button>
          </form>
        ) : (
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
                onChange={(e) =>
                  setOtp(
                    activeTab === "agency"
                      ? e.target.value.trim()
                      : e.target.value,
                  )
                }
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
              } transition-colors duration-200 text-white py-2 rounded-lg font-semibold flex items-center justify-center`}
              disabled={otpLoading}
            >
              {otpLoading ? <ButtonLoading /> : "Verify OTP & Register"}
            </button>
          </form>
        )}
        <p className="text-sm text-center mt-4 text-gray-300">
          Already have an account?{" "}
          <Link
            to={"/"}
            className={`$${
              activeTab === "agency" ? "text-[#6917E0]" : "text-blue-400"
            } hover:underline font-medium transition-colors`}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
