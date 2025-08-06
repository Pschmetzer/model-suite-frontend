export const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border text-gray-400 border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 text-card-foreground shadow-lg ${className}`}
  >
    {children}
  </div>
);
