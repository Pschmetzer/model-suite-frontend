import React from "react";

const Button = React.memo(
  ({ children, onClick, variant = "", type = "button" }) => {
    const base = "inline-flex items-center rounded-md font-medium transition";
    const styles = {
      default: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2",
      outline:
        "border border-gray-600 text-gray-200 hover:bg-gray-700 px-4 py-2",
    };
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${base} ${styles[variant] || styles.default}`}
      >
        {children}
      </button>
    );
  },
);

export default Button;
