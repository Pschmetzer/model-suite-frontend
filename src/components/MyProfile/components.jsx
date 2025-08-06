import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Camera, User, Briefcase, MapPin, Info, Clock } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import Navbar from "../Navbar";
import Gallery from "./Gallery";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../common/PermissionGuard";
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  setEditMode,
  updateProfileField,
  clearError,
} from "../../globalstate/profileSlice.jsx";

export default function ProfileForm() {
  const dispatch = useDispatch();
  const { hasFullAccess } = usePermissions();

  // Redux state
  const {
    data: profileData,
    loading,
    error,
    isEditing,
  } = useSelector((state) => state.profile);

  // Refs
  const fileInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const formRef = useRef(null);

  // Job title options
  const jobTitleOptions = [
    "",
    "Model",
    "Fashion Model",
    "Commercial Model",
    "Runway Model",
    "Fitness Model",
    "Promotional Model",
    "Influencer",
    "Actor",
    "Other",
  ];

  // Fetch profile on mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested social_links properties
    if (name.startsWith("social_links.")) {
      const socialPlatform = name.split(".")[1];
      dispatch(
        updateProfileField({
          field: "social_links",
          value: {
            ...profileData.social_links,
            [socialPlatform]: value,
          },
        }),
      );
    } else {
      dispatch(updateProfileField({ field: name, value }));
    }
  };

  // Handle array field changes (interests, goals, languages)
  const handleArrayFieldChange = (field, value) => {
    const arrayValue = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    dispatch(updateProfileField({ field, value: arrayValue }));
  };

  // Handle image uploads
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      dispatch(uploadAvatar(file));
    }
  };

  // Handle portfolio uploads
  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Please select only image files");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Each file size should be less than 5MB");
        return;
      }
    }

    try {
      // Upload each file to the backend
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("image", file);

        const authData = JSON.parse(localStorage.getItem("auth"));
        const token = authData?.token;

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/profile/portfolio-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await response.json();
        return {
          url: data.url,
          order: (profileData.portfolio?.length || 0) + index,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const currentPortfolio = profileData.portfolio || [];

      dispatch(
        updateProfileField({
          field: "portfolio",
          value: [...currentPortfolio, ...uploadedImages],
        }),
      );
    } catch (error) {
      console.error("Portfolio upload error:", error);
      alert("Failed to upload one or more images. Please try again.");
    }
  };

  // Remove portfolio image
  const removePortfolioImage = (indexToRemove) => {
    const currentPortfolio = profileData.portfolio || [];
    const updatedPortfolio = currentPortfolio.filter(
      (_, index) => index !== indexToRemove,
    );
    // Reorder the remaining items
    const reorderedPortfolio = updatedPortfolio.map((item, index) => ({
      ...item,
      order: index,
    }));
    dispatch(
      updateProfileField({ field: "portfolio", value: reorderedPortfolio }),
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateProfile(profileData));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    dispatch(setEditMode(!isEditing));
  };

  // Clear error
  const handleClearError = () => {
    dispatch(clearError());
  };

  // Calculate profile completion
  const getProfileCompletion = () => {
    const items = [
      { label: "Add a profile picture", completed: !!profileData.avatar_url },
      { label: "Add your name", completed: !!profileData.display_name },
      { label: "Add a short bio", completed: !!profileData.bio },
      {
        label: "Link at least one social media account",
        completed: !!(
          profileData.social_links?.instagram ||
          profileData.social_links?.tiktok ||
          profileData.social_links?.youtube
        ),
      },
      {
        label: "Add at least one portfolio image",
        completed: profileData.portfolio?.length > 0,
      },
    ];
    const percent = Math.round(
      (items.filter((item) => item.completed).length / items.length) * 100,
    );
    return { percent, items };
  };

  const { percent, items } = getProfileCompletion();
  const missingItems = items.filter((item) => !item.completed);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  // View Mode
  if (!isEditing) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full pt-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section with Profile */}
            <div className="relative bg-gradient-to-br from-blue-600 via-teal-600 to-green-500 rounded-3xl overflow-hidden shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>

              <div className="relative px-8 py-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Profile Photo */}
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl bg-white flex items-center justify-center overflow-hidden">
                      {profileData.avatar_url ? (
                        <img
                          src={
                            profileData.avatar_url.startsWith("http")
                              ? profileData.avatar_url
                              : `${
                                  import.meta.env.VITE_API_BASE_URL
                                }/${profileData.avatar_url.replace(/^\/+/, "")}`
                          }
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-20 h-20 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                      {profileData.display_name || "Your Name"}
                    </h1>
                    <div className="text-xl font-medium mb-4 opacity-90">
                      {profileData.job_title || "Model"}
                      {profileData.city && profileData.country && (
                        <span className="text-lg ml-2">
                          • {profileData.city}, {profileData.country}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {profileData.status && (
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            profileData.status === "Available"
                              ? "bg-green-400"
                              : profileData.status === "Unavailable"
                                ? "bg-red-400"
                                : profileData.status === "Limited"
                                  ? "bg-yellow-400"
                                  : "bg-gray-400"
                          }`}
                        ></span>
                        <span className="font-medium">
                          {profileData.status} now
                        </span>
                      </div>
                    )}

                    {/* Social Icons */}
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                      {profileData.social_links?.instagram && (
                        <a
                          href={profileData.social_links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
                        >
                          <FaInstagram className="text-xl" />
                        </a>
                      )}
                      {profileData.social_links?.tiktok && (
                        <a
                          href={profileData.social_links.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
                        >
                          <FaTiktok className="text-xl" />
                        </a>
                      )}
                      {profileData.social_links?.youtube && (
                        <a
                          href={profileData.social_links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110"
                        >
                          <FaYoutube className="text-xl" />
                        </a>
                      )}
                    </div>

                    {/* Edit Profile Button */}
                    <PermissionGuard
                      permission="profile.edit"
                      fallback={hasFullAccess}
                    >
                      <button
                        className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:scale-105 shadow-lg"
                        onClick={toggleEditMode}
                      >
                        Edit Profile
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="px-8 py-8 space-y-8">
              {/* Profile Completion & Bio */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Profile {percent}% complete
                    </h3>
                    <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2">
                      Add a bio
                      <span className="text-gray-400">⌄</span>
                    </button>
                  </div>
                </div>

                {profileData.bio && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {profileData.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Portfolio
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profileData.portfolio?.slice(0, 7).map((item, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <img
                        src={typeof item === "string" ? item : item.url}
                        alt={`Portfolio ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                  <div className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        Upload
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* More About Me Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  More About Me
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passionate about */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Passionate about
                      </h4>
                    </div>
                    <p className="text-gray-700">
                      {profileData.passions || "No information provided."}
                    </p>
                  </div>

                  {/* Languages */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Languages</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.languages?.length > 0 ? (
                        profileData.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-white px-3 py-1 rounded-lg text-sm font-medium text-gray-700 shadow-sm"
                          >
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">
                          No information provided.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fun Fact */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Fun Fact</h4>
                    </div>
                    <p className="text-gray-700">
                      {profileData.fun_fact || "No information provided."}
                    </p>
                  </div>

                  {/* Best way to reach me */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Best way to reach me
                      </h4>
                    </div>
                    <p className="text-gray-700">
                      {profileData.communication_style ||
                        "No information provided."}
                    </p>
                  </div>
                </div>

                {/* Profile Enhancement Section */}
                {(profileData.interests?.length > 0 ||
                  profileData.goals?.length > 0 ||
                  profileData.demographics ||
                  profileData.archetype ||
                  profileData.tone ||
                  profileData.audience) && (
                  <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Profile Enhancement
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.interests?.length > 0 && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Interests
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profileData.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profileData.goals?.length > 0 && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Goals
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profileData.goals.map((goal, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profileData.demographics && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Target Demographics
                          </div>
                          <div className="text-gray-600 text-sm">
                            {profileData.demographics}
                          </div>
                        </div>
                      )}

                      {profileData.archetype && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Brand Archetype
                          </div>
                          <div className="text-gray-600 text-sm">
                            {profileData.archetype}
                          </div>
                        </div>
                      )}

                      {profileData.tone && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Content Tone
                          </div>
                          <div className="text-gray-600 text-sm">
                            {profileData.tone}
                          </div>
                        </div>
                      )}

                      {profileData.audience && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm mb-2">
                            Target Audience
                          </div>
                          <div className="text-gray-600 text-sm">
                            {profileData.audience}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Edit Mode
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Photo */}
              <div
                className="relative flex-shrink-0 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-lg group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
              >
                {profileData.avatar_url ? (
                  <img
                    src={
                      profileData.avatar_url.startsWith("http")
                        ? profileData.avatar_url
                        : `${
                            import.meta.env.VITE_API_BASE_URL
                          }/${profileData.avatar_url.replace(/^\/+/, "")}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {/* Camera Icon Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Heading */}
              <div className="flex flex-col justify-center md:items-start items-center flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Editing {profileData.display_name || "Your"}'s Profile
                </h1>
                <p className="text-lg text-gray-600">
                  {profileData.job_title || "Model"} at ModelSuite
                </p>
              </div>

              {/* Save Button */}
              <PermissionGuard
                permission="profile.edit"
                fallback={hasFullAccess}
              >
                <button
                  type="button"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 hover:scale-105 transform transition-all duration-200"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </PermissionGuard>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Profile {percent}% complete
                </span>
                <span className="text-sm text-gray-500">{percent}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Missing Items */}
              {missingItems.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">
                    Complete your profile:
                  </h4>
                  <ul className="text-sm space-y-1">
                    {missingItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-amber-700"
                      >
                        <span className="text-amber-500">•</span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={handleClearError}
                className="ml-4 text-red-900 hover:text-red-700 font-bold text-lg"
              >
                ×
              </button>
            </div>
          )}

          {/* Form Sections */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={profileData.display_name || ""}
                    onChange={handleInputChange}
                    placeholder="Your display name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email || ""}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone || ""}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={profileData.country || ""}
                    onChange={handleInputChange}
                    placeholder="Your country"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city || ""}
                    onChange={handleInputChange}
                    placeholder="Your city"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                Job Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio || ""}
                    onChange={handleInputChange}
                    placeholder="Briefly introduce yourself or describe what you do"
                    maxLength={300}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Job Title
                    </label>
                    <select
                      name="job_title"
                      value={profileData.job_title || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {jobTitleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || "Select job title"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Role Description
                    </label>
                    <input
                      type="text"
                      name="role_description"
                      value={profileData.role_description || ""}
                      onChange={handleInputChange}
                      placeholder="Describe your role"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={profileData.status || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select status</option>
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Limited">Limited</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Availability Text
                    </label>
                    <input
                      type="text"
                      name="availability_text"
                      value={profileData.availability_text || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Monday to Friday 9am - 5pm"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Best Time to Reach Me
                    </label>
                    <input
                      type="text"
                      name="reachability"
                      value={profileData.reachability || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Best reached via email for business inquiries"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <FaInstagram className="w-5 h-5 text-pink-600" />
                </div>
                Social Media
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
                    <FaInstagram className="text-pink-500" /> Instagram
                  </label>
                  <input
                    type="url"
                    name="social_links.instagram"
                    value={profileData.social_links?.instagram || ""}
                    onChange={handleInputChange}
                    placeholder="Instagram profile URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
                    <FaTiktok className="text-black" /> TikTok
                  </label>
                  <input
                    type="url"
                    name="social_links.tiktok"
                    value={profileData.social_links?.tiktok || ""}
                    onChange={handleInputChange}
                    placeholder="TikTok profile URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-semibold mb-2">
                    <FaYoutube className="text-red-500" /> YouTube
                  </label>
                  <input
                    type="url"
                    name="social_links.youtube"
                    value={profileData.social_links?.youtube || ""}
                    onChange={handleInputChange}
                    placeholder="YouTube channel URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* More About Me */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-purple-600" />
                </div>
                More About Me
              </h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 text-base font-semibold mb-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    What I'm passionate about
                  </label>
                  <input
                    type="text"
                    name="passions"
                    value={profileData.passions || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. I love storytelling through photography, helping new talent grow"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 text-base font-semibold mb-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    How I like to communicate
                  </label>
                  <input
                    type="text"
                    name="communication_style"
                    value={profileData.communication_style || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. Best via email for official topics, quick things on Slack"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 text-base font-semibold mb-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Languages I speak
                  </label>
                  <input
                    type="text"
                    name="languages"
                    value={profileData.languages?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayFieldChange("languages", e.target.value)
                    }
                    placeholder="e.g. English, Spanish, German"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-700 text-base font-semibold mb-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Fun Fact
                  </label>
                  <input
                    type="text"
                    name="fun_fact"
                    value={profileData.fun_fact || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. I used to be a touring musician. I'm obsessed with organizing Notion boards."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Portfolio Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-600" />
                </div>
                Portfolio Images
              </h2>

              {/* Current Portfolio Images */}
              {profileData.portfolio?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Current Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profileData.portfolio.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                          <img
                            src={typeof item === "string" ? item : item.url}
                            alt={`Portfolio ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePortfolioImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors duration-200">
                <input
                  type="file"
                  ref={portfolioInputRef}
                  onChange={handlePortfolioUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Portfolio Images
                </h3>
                <p className="text-gray-500 mb-4">
                  Select multiple images to showcase your work
                </p>
                <button
                  type="button"
                  onClick={() => portfolioInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Camera className="w-5 h-5" />
                  Choose Images
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Maximum 5MB per image • JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Profile Enhancement Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 border border-purple-200">
              <h2 className="text-xl font-semibold text-purple-700 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-700" />
                </div>
                Profile Enhancement (For AI Persona)
              </h2>
              <p className="text-sm text-purple-600 mb-6 bg-white/50 p-3 rounded-lg">
                These fields help generate better AI personas and improve
                content recommendations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={profileData.interests?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayFieldChange("interests", e.target.value)
                    }
                    placeholder="e.g. fitness, yoga, nutrition, wellness"
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Goals (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="goals"
                    value={profileData.goals?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayFieldChange("goals", e.target.value)
                    }
                    placeholder="e.g. inspire healthy living, grow community"
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Target Demographics
                  </label>
                  <input
                    type="text"
                    name="demographics"
                    value={profileData.demographics || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. Women aged 20-40 interested in fitness"
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Brand Archetype
                  </label>
                  <select
                    name="archetype"
                    value={profileData.archetype || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select an archetype</option>
                    <option value="The Motivator">The Motivator</option>
                    <option value="The Expert">The Expert</option>
                    <option value="The Friend">The Friend</option>
                    <option value="The Creator">The Creator</option>
                    <option value="The Explorer">The Explorer</option>
                    <option value="The Entertainer">The Entertainer</option>
                    <option value="The Caregiver">The Caregiver</option>
                    <option value="The Leader">The Leader</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Content Tone
                  </label>
                  <input
                    type="text"
                    name="tone"
                    value={profileData.tone || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. encouraging, positive, authentic"
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="audience"
                    value={profileData.audience || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. fitness beginners looking for motivation"
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
