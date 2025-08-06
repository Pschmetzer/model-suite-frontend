import React from "react";
import { Search } from "lucide-react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "",
  autoFocus = false,
  className = "",
  ...props
}) => (
  <div className={`relative w-full ${className}`}>
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      <Search className="h-5 w-5" />
    </span>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      {...props}
    />
  </div>
);

export default SearchInput;
