import React from "react";

const PasswordStrengthIndicator = ({ password = "" }) => {
  // Calculate password strength
  const calculateStrength = (password) => {
    if (!password) return { score: 0, color: "" };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;

    // Number check
    if (/\d/.test(password)) score += 1;

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    // Determine strength
    let strength = { score: 0, color: "" };

    if (score === 0) {
      strength = { score: 0, color: "" };
    } else if (score <= 2) {
      strength = { score: 20, color: "#ef4444" };
    } else if (score <= 3) {
      strength = { score: 50, color: "#f59e0b" };
    } else if (score <= 4) {
      strength = { score: 75, color: "#3b82f6" };
    } else {
      strength = { score: 100, color: "#10b981" };
    }

    return strength;
  };

  const { score, color } = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
