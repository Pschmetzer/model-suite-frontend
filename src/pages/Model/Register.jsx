// import { useState } from "react";
// import axios from "axios";
// import { useNavigate, Link } from "react-router-dom";
// import { Eye, EyeOff } from "lucide-react";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     username: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [pendingData, setPendingData] = useState(null);

//   const [showPassword, setShowPassword] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
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
//       ...formData,
//       email: formData.email ? formData.email : undefined,
//     };

//     try {
//       const res = await axios.post(
//         `${baseURL}/model/register/send-otp`,
//         payload,
//         {
//           withCredentials: true,
//         }
//       );
//       setSuccess(res.data.message);
//       setOtpSent(true);
//       setPendingData(payload); // Save for OTP step
//     } catch (err) {
//       setError(err.response?.data?.error || "Something went wrong");
//     }
//   };

//   const handleOtpSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     try {
//       const verifyPayload = {
//         otp,
//         email: pendingData.email,
//       };
//       const res = await axios.post(
//         `${baseURL}/model/register/verify-otp`,
//         verifyPayload,
//         {
//           withCredentials: true,
//         }
//       );
//       setSuccess(res.data.message);
//       localStorage.setItem(
//         "auth",
//         JSON.stringify({ user: res.data.user, token: res.data.token })
//       );
//       navigate("/model/login");
//     } catch (err) {
//       setError(err.response?.data?.error || "OTP verification failed");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 to-gray-900 text-white">
//       <div className="flex-grow flex items-center justify-center px-4">
//         <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-xl border-t-4 border-blue-500">
//           <h2 className="text-3xl font-extrabold text-center text-white mb-6 drop-shadow-sm">
//             Model Registration
//           </h2>

//           {error && (
//             <p className="text-red-400 text-sm text-center mb-4">{error}</p>
//           )}
//           {success && (
//             <p className="text-green-400 text-sm text-center mb-4">{success}</p>
//           )}
//           {!otpSent ? (
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <input
//                 type="text"
//                 name="fullName"
//                 onChange={handleChange}
//                 value={formData.fullName}
//                 placeholder="Full Name"
//                 className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
//               />

//               <input
//                 type="email"
//                 name="email"
//                 onChange={handleChange}
//                 value={formData.email}
//                 placeholder="Email"
//                 className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400 "
//               />
//               <input
//                 type="text"
//                 name="username"
//                 onChange={handleChange}
//                 value={formData.username}
//                 placeholder="Username"
//                 className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400 "
//               />
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Password"
//                   className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-full pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   placeholder="Confirm Password"
//                   className="input bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-full pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
//               >
//                 Register
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
//                 className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
//               >
//                 Verify OTP & Register
//               </button>
//             </form>
//           )}

//           <p className="text-sm text-center mt-4 text-gray-300">
//             Already have an account?{" "}
//             <Link
//               to="/model/login"
//               className="text-blue-400 hover:underline font-medium"
//             >
//               Login here
//             </Link>
//           </p>
//         </div>
//       </div>

//       <footer className="mt-auto py-6 text-center text-gray-500 text-sm border-t border-gray-800 bg-gray-900">
//         &copy; {new Date().getFullYear()} ModelSuite. All rights reserved.
//       </footer>
//     </div>
//   );
// };

// export default Register;
