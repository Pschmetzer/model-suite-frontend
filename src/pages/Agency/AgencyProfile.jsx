import React, { useEffect, useState } from "react";
import { Globe, Mail, MapPinIcon, Phone } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import AgencySpecialites from "../../components/Agency/AgencySpecialites";
import { LuCircleCheckBig } from "react-icons/lu";
import TeamSection from "../../components/Agency/TeamSection";
import axios from "axios";
import { toast } from "react-hot-toast";

const AgencyProfile = () => {
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [data, setData] = useState({
    agencyName: "",
    username: "",
    agencyEmail: "",
    agencyPhone: "",
    isPhoneVerified: true,
    isEmailVerified: true,
    isMfaActive: false,
    loginRefreshToken: "",
    logo: "",
    profilePhoto: "",
    bannerImage: "",
    description: "",
    website: "",
    country: "",
    city: "",
    category: "",
    companySize: "",
    agencyType: "",
    certificate: "",
    trustBadge: "",
    socialLinks: {},
    ctaButtons: [],
    specialties: [],
    whyUs: [],
    team: [],
    lastOnline: new Date().toISOString(),
  });

  useEffect(() => {
    const getAgencyDetails = async () => {
      const response = await axios.get(`${baseURL}/agency/getAgencyDetail`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status !== 200 && response.statusText !== "OK") {
        toast.error("Failed to Load Data Pls Reload Page!!");
      } else {
        setData(response.data.agency);
      }
    };
    if (token) {
      getAgencyDetails();
    }
  }, [token]);

  const extractUsername = (url) => {
    try {
      const u = new URL(url);
      const path = u.pathname;

      // Handle YouTube and TikTok '@' usernames
      if (
        u.hostname.includes("youtube.com") ||
        u.hostname.includes("tiktok.com")
      ) {
        return path.startsWith("/@") ? path.slice(2) : path.split("/").pop();
      }

      // Facebook special case with profile.php?id=...
      if (u.hostname.includes("facebook.com") && u.searchParams?.get("id")) {
        return u.searchParams.get("id");
      }

      // Default fallback
      const segments = path.split("/").filter(Boolean);
      return segments.pop();
    } catch (err) {
      return "";
    }
  };

  return (
    <div className="bg-black text-white rounded-xl p-6 shadow-lg max-w-5xl mx-auto mt-10 font-sans">
      <div className="gap-8 flex-col flex p-4">
        {/* Header */}
        <div className="flex gap-6 justify-between">
          <div className="flex gap-5">
            {data.logo ? (
              <img
                className="object-cover w-12 h-20 mt-1 rounded"
                src={data.logo}
                alt="Agency Logo"
              />
            ) : (
              <div className="w-12 h-20 mt-1 rounded bg-gray-700 text-white flex items-center justify-center text-2xl font-bold">
                {data.agencyName?.charAt(0).toUpperCase() || "A"}
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-5xl uppercase font-medium tracking-wide font-sans mb-1">
                Elite Model <br />
                Management
              </h1>
              <p className="text-md text-gray-300 mb-4 font-semibold">
                Empowering talent. Elevating brands.
              </p>
            </div>
          </div>
          <div></div>
          <div className="flex gap-5">
            <img
              className="object-cover h-20 w-20"
              src={data?.trustBadge}
              alt="Trust Badge Image"
            />
          </div>
        </div>
        {/* Image Section */}
        <div className="overflow-hidden rounded-lg">
          <img
            src={data.bannerImage || "/DefaultCoverPage.webp"}
            alt="Model"
            className="w-[1200px] h-[400px] object-cover rounded-lg"
          />
        </div>
        {/* Content Section */}
        <div className="flex flex-col justify-between">
          <div className="px-4 pt-0">
            <div className="grid grid-cols-3">
              {/* Contact Info */}
              <div className="text-sm text-gray-400 space-y-1 mb-4 flex flex-col gap-2">
                <p className="flex gap-1 items-center text-white">
                  <MapPinIcon className="text-[#a28d5b]" /> New York, NY
                </p>
                <p className="flex gap-1 items-center text-white">
                  <span className="text-[#a28d5b]">
                    <Globe />
                  </span>{" "}
                  <a
                    href="https://www.elitemodels.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.elitemodels.com
                  </a>
                </p>
                <p className="flex gap-1 items-center text-white">
                  <Mail className="text-[#a28d5b]" /> contact@elitemodels.com
                </p>
                <p className="flex gap-1 items-center text-white">
                  <Phone className="text-[#a28d5b]" /> (555) 123-4567
                </p>
              </div>
              {/* necessary do not remove */}
              <div></div>
              <div className="flex flex-col gap-4 text-white mb-5">
                {data?.socialLinks?.instagram && (
                  <a
                    className="flex items-center gap-2"
                    target="_blank"
                    href={data?.socialLinks?.instagram}
                  >
                    <FaInstagram className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.instagram)}
                  </a>
                )}
                {data?.socialLinks?.facebook && (
                  <a
                    href={data?.socialLinks?.facebook}
                    className="flex items-center gap-2"
                    target="_blank"
                  >
                    <FaFacebook className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.facebook)}
                  </a>
                )}
                {data?.socialLinks?.twitter && (
                  <a
                    href={data?.socialLinks?.twitter}
                    className="flex ml-[-10] items-center gap-2"
                    target="_blank"
                  >
                    <FaXTwitter className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.twitter)}
                  </a>
                )}
                {data?.socialLinks?.linkedin && (
                  <a
                    href={data?.socialLinks?.linkedin}
                    target="_blank"
                    className="flex ml-[-10] items-center gap-2"
                  >
                    <FaLinkedin className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.linkedin)}
                  </a>
                )}
                {data?.socialLinks?.tiktok && (
                  <a
                    href={data?.socialLinks?.tiktok}
                    target="_blank"
                    className="flex ml-[-10] items-center gap-2"
                  >
                    <FaTiktok className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.tiktok)}
                  </a>
                )}
                {data?.socialLinks?.youtube && (
                  <a
                    href={data?.socialLinks?.youtube}
                    target="_blank"
                    className="flex ml-[-10] items-center gap-2"
                  >
                    <FaYoutube className="text-blue-400 cursor-pointer" />@
                    {extractUsername(data.socialLinks.youtube)}
                  </a>
                )}
              </div>
            </div>
            <hr className="border-1 border-gray-900" />
            {/* Specialties */}
            {data.specialties.length !== 0 && (
              <div className="my-5">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Our Specialities
                </h2>
                <div className="flex flex-wrap gap-3">
                  {data.specialties.map((tag) => (
                    <span key={tag}>
                      <AgencySpecialites tag={tag} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-1 border-gray-900" />
            {/* Why Work With Us */}
            {data.whyUs.length !== 0 && (
              <div className="my-5">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Why Work With Us
                </h2>
                <ul className="space-y-4">
                  {data?.whyUs.map((u, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <LuCircleCheckBig className="text-[#a28d5b] text-xl mt-1" />
                      <p className="text-gray-300 text-base leading-relaxed">
                        {u}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <hr className="border-1 border-gray-900" />
            {data?.team.length !== 0 && (
              <div className="w-full">
                <TeamSection team={data?.team} />
              </div>
            )}
          </div>

          {/* Call To Action */}
          {data?.ctaButtons.length !== 0 && (
            <div className="flex gap-4 mt-6 justify-end">
              {data?.ctaButtons.map((button, index) => (
                <a
                  target="_blank"
                  key={index}
                  href={button.link}
                  className="bg-[#a28d5b] text-black font-semibold px-4 py-2 rounded-md transition"
                >
                  {button.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyProfile;
