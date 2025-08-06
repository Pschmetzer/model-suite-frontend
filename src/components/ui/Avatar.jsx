import React from "react";

const Avatar = ({
  src,
  alt,
  fallback,
  className = "",
  online = false,
  ...props
}) => (
  <div className={`relative inline-block ${className}`} {...props}>
    {src ? (
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full rounded-full border-2 border-gradient-to-br from-blue-600 to-purple-600 shadow-md"
      />
    ) : (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold rounded-full">
        {fallback}
      </div>
    )}
    {online && (
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
    )}
  </div>
);

export default Avatar;
