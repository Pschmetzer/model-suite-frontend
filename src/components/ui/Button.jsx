import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const base =
    "transition-colors duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const variants = {
    default:
      "bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
    ghost: "bg-transparent text-white hover:bg-gray-800",
    outline:
      "border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50 hover:text-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };
  return (
    <button
      className={`${base} ${variants[variant] || ""} ${sizes[size] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
