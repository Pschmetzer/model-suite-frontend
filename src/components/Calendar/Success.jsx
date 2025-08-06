import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelId = searchParams.get("modelId");

  useEffect(() => {
    // ✅ Optional: fetch insights directly or show a success UI
    console.log("Google Calendar connected for model:", modelId);

    // Navigate after delay or show confirmation
    setTimeout(() => {
      navigate("/model/dashboard"); // Or wherever
    }, 2000);
  }, []);

  return (
    <div className="flex justify-center text-white items-center h-screen text-xl font-semibold">
      Calendar successfully connected 🎉 Redirecting...
    </div>
  );
};

export default Success;
