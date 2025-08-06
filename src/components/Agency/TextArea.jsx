export const TextArea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg dark:text-white text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none ${className}`}
    {...props}
  />
);
