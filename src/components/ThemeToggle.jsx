import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log("ThemeToggle clicked, current theme:", theme);
    toggleTheme();
    console.log("ThemeToggle after toggle call");
  };

  return (
    <button onClick={handleToggle}>
      {theme === "dark" ? (
        <Moon className="h-6 w-6 text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer" />
      ) : (
        <Sun className="h-6 w-6 text-yellow-400 hover:text-orange-400 transition-colors duration-200 cursor-pointer" />
      )}
    </button>
  );
}
