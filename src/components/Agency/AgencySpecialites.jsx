import { CiCamera } from "react-icons/ci";
import React from "react";
import { GiSleevelessJacket } from "react-icons/gi";
import { IoSparklesOutline } from "react-icons/io5";
import { GiHighHeel } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import { SlScreenDesktop } from "react-icons/sl";

const AgencySpecialites = ({ tag }) => {
  return (
    <div className="w-24 h-24 border border-[#a28d5b] rounded-xl flex flex-col items-center justify-center gap-2">
      <p>
        {tag == ("Fashion" || "fashion") ? (
          <GiSleevelessJacket className="text-[#a28d5b] text-4xl" />
        ) : tag == ("Commercial" || "commercial") ? (
          <SlScreenDesktop className="text-[#a28d5b] text-4xl" />
        ) : tag == ("Lifestyle" || "lifestyle") ? (
          <IoSparklesOutline className="text-[#a28d5b] text-4xl" />
        ) : tag == ("Editorial" || "editorial") ? (
          <CiCamera className="text-[#a28d5b] text-4xl" />
        ) : tag == ("Runway" || "runway") ? (
          <GiHighHeel className="text-[#a28d5b] text-4xl" />
        ) : (
          <BiCategory className="text-[#a28d5b] text-4xl" />
        )}
      </p>
      {tag}
    </div>
  );
};

export default AgencySpecialites;
