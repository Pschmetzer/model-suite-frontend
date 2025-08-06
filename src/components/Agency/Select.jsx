export const Select = ({ children, className = "", ...props }) => (
  <select
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-600 rounded-lg text-black dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${className}`}
    {...props}
  >
    {children}
  </select>
);
