import React from "react";

const TeamSection = ({ team }) => {
  return (
    <section className="py-5">
      <h2 className="text-3xl font-bold text-white mb-6">Meet The Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
        {team.map((member) => (
          <a
            href={member.profileLink}
            target="_blank"
            key={member.name}
            className="bg-[#a28d5b] rounded-2xl overflow-hidden shadow-md w-full max-w-xs transition hover:scale-105 duration-300"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full h-56 object-cover"
            />
            <div className="p-4 text-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {member.name}
              </h3>
              <p className="text-sm text-gray-600">{member.role}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
