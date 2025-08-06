import React from "react";
import { Search as SearchIcon } from "lucide-react";
import { motion } from "framer-motion";

const SearchBar = React.memo(({ searchQuery, setSearchQuery }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="mb-6"
  >
    <div className="relative max-w-md">
      <SearchIcon className="absolute left-3 top-3 w-5 h-5 dark:text-gray-400" />
      <input
        type="text"
        placeholder="Search by client...,Username...,Status..."
        className="w-full pl-10 pr-4 py-3 dark:bg-gray-800 border border-gray-700 rounded-lg dark:text-white text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  </motion.div>
));

export default SearchBar;
