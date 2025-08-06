import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
// import { startActivityTracking } from '../../utils/socket';

const MagicVerify = () => {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (!token) {
      setStatus("error");
      setMessage("Invalid magic link - no token provided");
      return;
    }

    if (!role || !["model", "agency"].includes(role)) {
      setStatus("error");
      setMessage("Invalid magic link - invalid role");
      return;
    }

    verifyMagicLink(token, role);
  }, [searchParams]);

  const verifyMagicLink = async (token, role) => {
    try {
      const res = await axios.get(
        `${baseURL}/magic-verify?token=${token}&role=${role}`,
        {
          withCredentials: true,
        },
      );

      if (res.data.token && res.data.user) {
        // Store auth data
        localStorage.setItem(
          "auth",
          JSON.stringify({ user: res.data.user, token: res.data.token }),
        );

        setStatus("success");
        setMessage("Login successful! Redirecting...");

        if (role === "agency") {
          navigate("/agency/dashboard");
        } else if (role === "model") {
          navigate("/model/dashboard");
        }
      }
    } catch (error) {
      console.error("Magic link verification error:", error);
      setStatus("error");
      setMessage(
        error.response?.data?.message || "Magic link verification failed",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] text-white">
      <div className="bg-[#181F2A] border border-gray-500 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Magic Link Verification</h2>

        {status === "verifying" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Verifying your magic link...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <p className="text-green-400">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-red-400 text-5xl mb-4">✗</div>
            <p className="text-red-400 mb-4">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicVerify;
