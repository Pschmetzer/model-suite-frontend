import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export const AuthDropdown = () => {
  const [openDropdown, setOpenDropdown] = useState(null); // 'model' or 'agency'

  const toggleDropdown = (type) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  return (
    <div className="flex flex-col md:flex-row md:space-x-6 items-start md:items-center text-sm font-semibold mr-5">
      {/* Model Dropdown */}
      <div className="relative group">
        <button
          className="flex items-center text-xl text-blue-400 hover:text-blue-200 transition md:cursor-pointer"
          onClick={() => toggleDropdown("model")}
        >
          Model <ChevronDown size={16} className="ml-1" />
        </button>
        <div
          className={`${
            openDropdown === "model" ? "block" : "hidden"
          } md:group-hover:block absolute z-10 bg-[#111827] rounded shadow-md mt-2 w-24`}
        >
          <Link
            to="/model/login"
            className="block px-4 py-2 text-blue-400 hover:text-blue-200 transition"
            onClick={() => setOpenDropdown(null)}
          >
            Login
          </Link>
          <hr className="border border-gray-700" />
          <Link
            to="/model/register"
            className="block px-4 py-2 text-blue-400 hover:text-blue-200 transition"
            onClick={() => setOpenDropdown(null)}
          >
            Register
          </Link>
        </div>
      </div>

      {/* Agency Dropdown */}
      <div className="relative group mt-2 md:mt-0">
        <button
          className="flex items-center text-xl text-[#6917E0] hover:text-[#8f4ff0] transition md:cursor-pointer"
          onClick={() => toggleDropdown("agency")}
        >
          Agency <ChevronDown size={16} className="ml-1" />
        </button>
        <div
          className={`${
            openDropdown === "agency" ? "block" : "hidden"
          } md:group-hover:block absolute z-10 bg-[#111827]  rounded shadow-md mt-2 w-24`}
        >
          <Link
            to="/agency/login"
            className="block px-4 py-2 text-[#6917E0] hover:text-[#8f4ff0] transition"
            onClick={() => setOpenDropdown(null)}
          >
            Login
          </Link>
          <hr className="border border-gray-700" />
          <Link
            to="/agency/register"
            className="block px-4 py-2 text-[#6917E0] hover:text-[#8f4ff0] transition"
            onClick={() => setOpenDropdown(null)}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
