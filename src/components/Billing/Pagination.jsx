import React from "react";

const Pagination = ({ page, totalPages, onPrev, onNext }) => {
  return (
    <div className="flex items-center justify-center mt-8">
      <div className="flex items-center gap-4 px-6 py-3 dark:bg-gray-800 rounded-2xl shadow-md border border-gray-700">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 
            ${
              page === 1
                ? "dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                : "dark:bg-gray-700 hover:bg-gray-600 dark:text-white"
            }`}
        >
          ← Previous
        </button>

        <span className="text-sm font-semibold dark:text-gray-300">
          Page <span className="dark:text-white">{page}</span> of{" "}
          <span className="dark:text-white">{totalPages}</span>
        </span>

        <button
          onClick={onNext}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 
            ${
              page === totalPages
                ? "dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                : "dark:bg-gray-700 hover:bg-gray-600 dark:text-white"
            }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
