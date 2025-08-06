export const CardHeader = ({ children, className = "" }) => (
  <div
    className={`flex flex-col space-y-1.5 p-6 border-b border-gray-700 ${className}`}
  >
    {children}
  </div>
);
