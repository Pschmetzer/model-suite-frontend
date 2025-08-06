import React, { useState } from "react";
import TechnicalSupportMessenger from "./TechnicalSupportMessenger.jsx";
import AccountManagerMessenger from "./AccountManagerMessenger.jsx";
import ContentStrategyMessenger from "./ContentStrategyMessenger.jsx";
import BrandingSpecialistMessenger from "./BrandingSpecialistMessenger.jsx";

const AuthLayout = () => {
  const [authenticatedRole, setAuthenticatedRole] = useState(null);
  const [passcode, setPasscode] = useState("");

  const handleLogin = () => {
    const code = passcode.trim().toUpperCase();
    switch (code) {
      case "TECH01":
        setAuthenticatedRole("technical");
        break;
      case "ACC123":
        setAuthenticatedRole("account");
        break;
      case "CONT99":
        setAuthenticatedRole("content");
        break;
      case "BRAND4":
        setAuthenticatedRole("branding");
        break;
      default:
        alert("Invalid passcode");
    }
    setPasscode("");
  };

  const renderMessenger = () => {
    switch (authenticatedRole) {
      case "technical":
        return <TechnicalSupportMessenger />;
      case "account":
        return <AccountManagerMessenger />;
      case "content":
        return <ContentStrategyMessenger />;
      case "branding":
        return <BrandingSpecialistMessenger />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 p-4 text-white flex items-center justify-center px-4">
      {authenticatedRole ? (
        <div className="w-full max-w-4xl bg-white text-black p-6 rounded-xl shadow-2xl">
          {renderMessenger()}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
            Enter Your Role Passcode
          </h2>
          <input
            type="text"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter 6-char passcode"
            className="w-full px-4 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-all"
          >
            Login
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Use one of the codes: TECH01, ACC123, CONT99, BRAND4
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthLayout;
