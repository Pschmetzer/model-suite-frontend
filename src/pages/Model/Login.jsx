// import { useState } from "react";
// import axios from "axios";
// import { useNavigate, Link } from "react-router-dom";
// import { Eye, EyeOff } from "lucide-react";

// const Login = () => {
//   const [formData, setFormData] = useState({
//     identifier: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [pendingData, setPendingData] = useState(null);

//   const baseURL = import.meta.env.VITE_API_BASE_URL;
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     const payload = {
//       identifier: formData.identifier,
//       password: formData.password,
//     };

//     try {
//       const res = await axios.post(`${baseURL}/model/login`, payload, {
//         withCredentials: true, // Important for sending/receiving cookies
//       });

//       if (
//         res.data.message &&
//         (res.data.message.toLowerCase().includes("otp sent") ||
//           res.data.message.toLowerCase().includes("otp has been sent"))
//       ) {
//         setSuccess(res.data.message);
//         setOtpSent(true);
//         setPendingData(payload);
//       } else if (res.data.user) {
//         setSuccess("Login successful");
//         localStorage.setItem(
//           "auth",
//           JSON.stringify({ user: res.data.user, token: res.data.token })
//         );
//         navigate("/model/dashboard");
//       } else {
//         setError("Unexpected response from server.");
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Login failed");
//     }
//   };

//   const handleOtpSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     if (!pendingData || !pendingData.identifier) {
//       setError("No pending data found. Please try logging in again.");
//       return;
//     }

//     if (!otp || otp.trim() === "") {
//       setError("Please enter a valid OTP.");
//       return;
//     }

//     try {
//       const verifyPayload = {
//         otp,
//         identifier: pendingData.identifier, // Backend expects this
//       };

//       const res = await axios.post(
//         `${baseURL}/model/login/verify-otp`,
//         verifyPayload,
//         {
//           withCredentials: true,
//         }
//       );

//       if (res.data.user && res.data.token) {
//         setSuccess(res.data.message || "Login successful");
//         localStorage.setItem(
//           "auth",
//           JSON.stringify({ user: res.data.user, token: res.data.token })
//         );
//         navigate("/model/dashboard");
//       } else {
//         setError("Unexpected response from server.");
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "OTP verification failed");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-[#111827] text-white">
//       <nav className="bg-[#0A101D]/30 shadow-md py-2 px-8 border-b z-40 border-gray-700 flex justify-between items-center">
//         <img src="/logo.webp" className="object-cover h-16"></img>
//         <div className="flex gap-4">
//           <div className="w-[7vw] rounded-lg h-10 bg-[#293342]"></div>
//           <div className="w-[10vw] rounded-lg h-10 bg-[#293342]"></div>
//         </div>
//       </nav>
//       {/* SideBar */}
//       <div
//         className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden lg:block
//     transition-transform duration-700 ease-in-out
//     translate-x-0 md:-translate-x-full lg:translate-x-0
// "
//       >
//         <div className="xl:w-[350px] lg:w-[350px] md:h-full md:mt-20 bg-[#0A101D] relative flex flex-col gap-1 items-center justify-start p-4 border-gray-700 border-t">
//           <div className="left-4 xl:top-28 xl:w-[315px] lg:w-[315px] h-14 bg-slate-700/50 rounded-lg mb-4"></div>
//           {/* Left column - vertical cards */}
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           {/* First Five */}
//           <hr className="left-4 xl:w-[315px] lg:w-[315px] border-slate-700/50 my-1" />
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           {/* Second three */}
//           <hr className="left-4 xl:w-[315px] lg:w-[315px] border-slate-700/50 my-1" />
//           {/* Last Four */}
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>{" "}
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//           <div className="left-4 xl:w-[315px] lg:w-[315px] h-10 bg-slate-700/50 rounded-lg"></div>
//         </div>
//       </div>
//       <div className="relative lg:pl-[400px] pl-[30px] pt-[20px] pr-[30px] w-full overflow-hidden">
//         <div className="flex flex-col mix-blend-screen gap-4">
//           {/* Top decorative element */}
//           <div className="w-full bg-gray-700/40 h-12 rounded-lg flex-shrink-0"></div>

//           {/* Middle decorative element */}
//           <div className="flex gap-4 flex-1">
//             <div className="w-full bg-gray-700/40 h-[44vh] rounded-xl flex-1"></div>
//             <div className="w-full bg-gray-700/40 h-[44vh] rounded-xl flex-1"></div>
//           </div>

//           {/* Bottom decorative element */}
//           <div className="flex gap-4 flex-1">
//             <div className="w-[60%] bg-gray-700/40 h-[35vh] rounded-xl"></div>
//             <div className="flex-1 bg-gray-700/40 h-[35vh] rounded-xl"></div>
//           </div>
//         </div>
//       </div>
//       <div className="absolute inset-0 bg-gray-700/40 flex justify-center items-center z-30">
//         <div className="bg-[#111827] rounded-2xl shadow-lg p-8 w-full max-w-xl border-t-4 border-blue-500">
//           <span className="w-full flex flex-col items-center justify-center gap-2">
//             <img
//               src="/AgencyDashboardLogo.webp"
//               className="object-cover w-[300px]"
//             />

//             <h2 className="text-3xl font-extrabold text-center text-white drop-shadow-sm">
//               Model Login
//             </h2>

//             {/* <p className="mb-4 text-gray-400">
//               Enter your details below to log in your account
//             </p> */}
//           </span>

//           {error && (
//             <p className="text-red-400 text-sm text-center mb-4">{error}</p>
//           )}
//           {success && (
//             <p className="text-green-400 text-sm text-center mb-4">{success}</p>
//           )}
//           {!otpSent ? (
//             <form
//               onSubmit={handleSubmit}
//               className="space-y-6 bg-gray-900 p-2 rounded-xl shadow-md max-w-lg mx-auto"
//             >
//               {/* Identifier Input */}
//               <div className="flex flex-col space-y-2">
//                 <label
//                   htmlFor="identifier"
//                   className="text-sm font-medium text-gray-300"
//                 >
//                   Username / E-Mail
//                 </label>
//                 <input
//                   type="text"
//                   name="identifier"
//                   id="identifier"
//                   value={formData.identifier}
//                   onChange={handleChange}
//                   placeholder="Username or Email"
//                   className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               {/* Password Input */}
//               <div className="flex flex-col space-y-2 relative">
//                 <label
//                   htmlFor="password"
//                   className="text-sm font-medium text-gray-300"
//                 >
//                   Password
//                 </label>

//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   id="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Password"
//                   className="px-4 py-2 pr-12 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />

//                 {/* Eye Toggle */}
//                 <span
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   className="absolute right-3 top-[32px] cursor-pointer text-gray-400 hover:text-gray-400"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </span>

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                   <Link
//                     to="/model/forgot-password"
//                     className="text-sm text-blue-400 hover:underline cursor-pointer font-medium"
//                   >
//                     Forgot Password?
//                   </Link>
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white py-2 rounded-lg font-semibold"
//               >
//                 Login
//               </button>
//             </form>
//           ) : (
//             <form onSubmit={handleOtpSubmit} className="space-y-4">
//               <input
//                 type="text"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 placeholder="Enter OTP"
//                 className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
//               />
//               <button
//                 type="submit"
//                 className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white py-2 rounded-lg font-semibold"
//               >
//                 Login
//               </button>
//             </form>
//           )}

//           <p className="text-sm text-center mt-4 text-gray-300">
//             Don't have an account?{" "}
//             <Link
//               to="/model/register"
//               className="text-blue-400 hover:underline font-medium"
//             >
//               Register here
//             </Link>
//           </p>
//         </div>
//       </div>
//       {/* <footer className="mt-auto py-6 text-center text-gray-500 text-sm border-t border-gray-800 bg-gray-900">
//         &copy; {new Date().getFullYear()} ModelSuite. All rights reserved.
//       </footer> */}
//     </div>
//   );
// };

// export default Login;
