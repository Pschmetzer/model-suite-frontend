export const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-xl font-bold leading-tight tracking-tight flex items-center gap-2 ${className}`}
  >
    {children}
  </h3>
);
