import React from "react";

const Tooltip = ({ text, children }) => (
  <div className="group relative inline-block">
    {children}
    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs px-2 py-1 rounded bg-gray-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
      {text}
    </span>
  </div>
);

export default Tooltip;
