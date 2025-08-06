import React from "react";

const colorMap = {
  red: "bg-red-600 text-white",
  blue: "bg-blue-600 text-white",
  green: "bg-green-600 text-white",
  gray: "bg-gray-600 text-white",
  purple: "bg-purple-600 text-white",
};

const Badge = ({ children, color = "blue", className = "", ...props }) => (
  <span
    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${colorMap[color] || colorMap.blue} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
