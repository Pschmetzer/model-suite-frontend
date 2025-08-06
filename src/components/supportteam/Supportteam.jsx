// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const user=JSON.parse(localStorage.getItem("auth"))?.user
// const token=JSON.parse(localStorage.getItem("auth"))?.token
// console.log('====================================');
// console.log(user,token);
// console.log('====================================');
// const SupportTeamMember = ({ member }) => {
//   return (
//     <div className="bg-gray-900 rounded-lg p-6 flex flex-col justify-between shadow-lg text-white">
//       <div>
//         <div className="flex items-center mb-4">
//           <img
//             src={member.profile_image}
//             alt={member.name}
//             className="w-16 h-16 rounded-full mr-4 object-cover"
//           />
//           <div>
//             <h2 className="text-xl font-bold">{member.name}</h2>
//             <p className="text-gray-400">{member.title}</p>
//           </div>
//         </div>
//         <p className="text-gray-300 mb-6">{member.bio}</p>
//       </div>
//       <div className="flex justify-between items-center">
//         <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-3 p-2 rounded-full">
//           {member.support_areas?.[0] || "General"}
//         </span>
//         <button
//           onClick={() => (window.location.href = `/model/supportsystem`)}
//           className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:-translate-y-1"
//         >
//           Message ➤
//         </button>
//       </div>
//     </div>
//   );
// };

// const Supportteam = () => {
//   const [supportTeamData, setSupportTeamData] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedRole, setSelectedRole] = useState("All Roles");

//   const [allRoles, setAllRoles] = useState([
//     "All Roles",
//     "Account Management",
//     "Technical Support",
//     "Content Strategy",
//     "Branding",
//   ]);

//   const handleRoleSelect = (role) => {
//     setSelectedRole(role);
//     setIsOpen(false);
//   };

//   const filteredTeam =
//     selectedRole === "All Roles"
//       ? supportTeamData
//       : supportTeamData.filter((member) =>
//           member.support_areas.includes(selectedRole),
//         );

//   // 🔥 Fetch data from backend
//   useEffect(() => {
//     const fetchSupportStaff = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_API_BASE_URL}/supportsystem/`,
//         );
//         setSupportTeamData(response.data.staff || []);
//       } catch (error) {
//         console.error("Failed to fetch support staff:", error.message);
//       }
//     };

//     const fetchSupportRoles = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_API_BASE_URL}/supportsystem/allroles`,
//         );
//         const roles = response.data.primarySupportAreas || [];
//         setAllRoles(["All Roles", ...new Set(roles)]);
//       } catch (err) {
//         console.error("Failed to fetch roles:", err.message);
//       }
//     };

//     fetchSupportStaff();
//     fetchSupportRoles();
//   }, []);

//   return (
//     <div className="bg-black p-8 min-h-screen">
//       <h1 className="text-4xl font-bold text-white mb-6">My Support Team</h1>

//       <div className="relative inline-block text-left mb-8">
//         <div>
//           <button
//             type="button"
//             className="inline-flex justify-center w-full rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none"
//             onClick={() => setIsOpen(!isOpen)}
//           >
//             {selectedRole}
//             <svg
//               className="-mr-1 ml-2 h-5 w-5"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </button>
//         </div>

//         {isOpen && (
//           <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
//             <div
//               className="py-1"
//               role="menu"
//               aria-orientation="vertical"
//               aria-labelledby="options-menu"
//             >
//               {allRoles.map((role) => (
//                 <a
//                   href="#"
//                   key={role}
//                   className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
//                   onClick={() => handleRoleSelect(role)}
//                 >
//                   {role}
//                 </a>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {filteredTeam.map((member) => (
//           <SupportTeamMember key={member._id} member={member} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Supportteam;
import React, { useEffect, useState } from "react";
import axios from "axios";

const user = JSON.parse(localStorage.getItem("auth"))?.user;
const token = JSON.parse(localStorage.getItem("auth"))?.token;

const SupportTeamMember = ({ member }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-6 flex flex-col justify-between shadow-lg text-white">
      <div>
        <div className="flex items-center mb-4">
          <img
            src={member.profile_image}
            alt={member.supportContact?.name || "Support Member"}
            className="w-16 h-16 rounded-full mr-4 object-cover"
          />
          <div>
            <h2 className="text-xl font-bold">{member.title}</h2>
            <p className="text-gray-400">
              {member.supportContact?.name || "Support Member"}
            </p>
          </div>
        </div>
        <p className="text-gray-300 mb-4">{member.bio}</p>

        {/* Additional member info */}
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-400">
            <span className="font-medium">Department:</span>{" "}
            {member.internalDept}
          </div>
          <div className="text-sm text-gray-400">
            <span className="font-medium">Languages:</span>{" "}
            {member.languages?.join(", ")}
          </div>
          <div className="text-sm text-gray-400">
            <span className="font-medium">Channel:</span> {member.commChannel}
          </div>
          <div className="text-sm text-gray-400">
            <span className="font-medium">Timezone:</span> {member.timezone}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {member.supportareas?.slice(0, 2).map((area, index) => (
            <span
              key={index}
              className="text-xs font-semibold bg-gray-800 text-gray-300 px-3 py-1 rounded-full"
            >
              {area}
            </span>
          ))}
        </div>
        <button
          onClick={() => (window.location.href = `/model/supportsystem`)}
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:-translate-y-1"
        >
          Message ➤
        </button>
      </div>
    </div>
  );
};

const Supportteam = () => {
  const [supportTeamData, setSupportTeamData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allRoles, setAllRoles] = useState(["All Roles"]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsOpen(false);
  };

  const filteredTeam =
    selectedRole === "All Roles"
      ? supportTeamData
      : supportTeamData.filter((member) =>
          member.supportareas?.includes(selectedRole),
        );

  // Extract unique roles from support team data
  const extractRoles = (teamData) => {
    const roles = teamData.reduce((acc, member) => {
      if (member.supportareas) {
        return [...acc, ...member.supportareas];
      }
      return acc;
    }, []);
    return ["All Roles", ...new Set(roles)];
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchSupportStaff = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          headers: {},
        };

        // Add authorization header if token exists
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/supportsystem/${user._id}`,
          config,
        );

        if (response.data.success) {
          const staffData = response.data.staff || [];
          setSupportTeamData(staffData);
          console.log("====================================");
          console.log(staffData);
          console.log("====================================");
          // Extract and set roles from the fetched data
          const roles = extractRoles(staffData);
          setAllRoles(roles);
        } else {
          setError("Failed to fetch support staff data");
        }
      } catch (error) {
        console.error("Failed to fetch support staff:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch support staff",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSupportStaff();
  }, [user._id, token]);

  if (loading) {
    return (
      <div className="bg-black p-8 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">Loading support team...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black p-8 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black p-8 min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-6">My Support Team</h1>

      {/* Role Filter Dropdown */}
      <div className="relative inline-block text-left mb-8">
        <div>
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedRole}
            <svg
              className="-mr-1 ml-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5 z-10">
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              {allRoles.map((role) => (
                <button
                  key={role}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => handleRoleSelect(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Support Team Grid */}
      {filteredTeam.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeam.map((member) => (
            <SupportTeamMember key={member._id} member={member} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-xl">
            No support team members found for the selected role.
          </p>
        </div>
      )}
    </div>
  );
};

export default Supportteam;
