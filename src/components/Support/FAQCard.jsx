import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQCard({ question, answer }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-300 ${
        open
          ? "bg-[#1e293b] border-blue-500 shadow-md"
          : "bg-[#1e293b] border-[#334155]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left text-white text-lg font-semibold"
      >
        <span className="text-base sm:text-lg">{question}</span>
        <motion.span
          initial={false}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 text-gray-300 text-sm leading-relaxed overflow-hidden"
          >
            <p>{answer}</p>

            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Was this helpful?</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFeedback("yes")}
                  className={`text-sm px-3 py-1 rounded-md ${
                    feedback === "yes"
                      ? "bg-green-600 text-white"
                      : "bg-[#334155] text-gray-200 hover:bg-green-700"
                  }`}
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setFeedback("no")}
                  className={`text-sm px-3 py-1 rounded-md ${
                    feedback === "no"
                      ? "bg-red-600 text-white"
                      : "bg-[#334155] text-gray-200 hover:bg-red-700"
                  }`}
                >
                  👎 No
                </button>
              </div>

              {/* Feedback message */}
              {feedback && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-green-400 text-xs"
                >
                  {feedback === "yes"
                    ? "✅ Thanks for your feedback!"
                    : "❌ Sorry to hear that. We'll improve!"}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}