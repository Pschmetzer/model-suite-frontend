/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
};

/*This styles was unitentionaly effecting model side chat styles os commented for now*/

// /** @type {import('tailwindcss').Config} */
// export default {
//   darkMode: "class",
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         "deep-blue": "#0A192F", // The main background for agency side per model view
//         "light-slate": "#ccd6f6",
//         slate: "#8892b0",
//       },
//       ringOffsetColor: {
//         "deep-blue": "#0A192F",
//       },
//     },
//   },
//   plugins: [
//     require("@tailwindcss/forms"),
//     require("tailwind-scrollbar")({ nocompatible: true }),
//   ],
// };
