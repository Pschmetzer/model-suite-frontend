export const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full px-4 py-3 bg-white text-black dark:bg-gray-800 border dark:border-gray-600 rounded-lg dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${className}`}
    {...props}
  />
);
