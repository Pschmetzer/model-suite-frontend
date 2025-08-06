import { AlertCircle, Check, Info } from "lucide-react";

export const Alert = ({ children, variant = "info", className = "" }) => {
  const variants = {
    info: "dark:bg-blue-900/20 border-blue-700 text-blue-600",
    success: "bg-green-900/20 border-green-700 text-green-300",
    warning: "bg-yellow-900/20 border-yellow-700 text-yellow-300",
    error: "bg-red-900/20 border-red-700 text-red-300",
  };

  const icons = {
    info: <Info size={16} />,
    success: <Check size={16} />,
    warning: <AlertCircle size={16} />,
    error: <AlertCircle size={16} />,
  };

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 ${variants[variant]} ${className}`}
    >
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  );
};
