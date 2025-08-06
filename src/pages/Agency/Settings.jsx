import {
  Building2,
  Phone,
  Mail,
  Globe,
  Upload,
  Save,
  Instagram,
  Facebook,
  Twitter,
  Languages,
  Clock,
  DollarSign,
  ArrowLeft,
  X,
  Users,
  Award,
  Briefcase,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Agency/Card";
import { CardHeader } from "../../components/Agency/CardHeader";
import { CardTitle } from "../../components/Agency/CardTitle";
import { CardContent } from "../../components/Agency/CardContent";
import { Button } from "../../components/Agency/Button";
import { Input } from "../../components/Agency/Input";
import { TextArea } from "../../components/Agency/TextArea";
import { Select } from "../../components/Agency/Select";
import { Label } from "../../components/Agency/Label";
import { Alert } from "../../components/Agency/Alert";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaLinkedin, FaTiktok } from "react-icons/fa";
import { IoLogoYoutube } from "react-icons/io";
import ModelDebugPanel from "../../components/Notes/ModelDebugPanel";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/common/PermissionGuard";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState(
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center",
  );
  const [bannerImagePreview, setBannerImagePreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [trustBadgeFile, setTrustBadgeFile] = useState(null);
  const [trustBadgeImagePreview, setTrustBadgeImagePreview] = useState(null);
  const [teamMemberAvatarFiles, setTeamMemberAvatarFiles] = useState({});
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const { hasPermission, hasFullAccess } = usePermissions();

  const [formData, setFormData] = useState({
    // Agency Info (matching schema fields)
    agencyName: "",
    username: "",
    agencyEmail: "", // Changed from email
    agencyPhone: "", // Changed from phone
    description: "", // Changed from publicBio
    website: "",
    country: "",
    city: "",
    category: "",
    companySize: "",
    agencyType: "",
    trustBadge: "",

    // Social Media (matching socialLinks schema)
    socialLinks: {
      instagram: "",
      facebook: "",
      twitter: "",
      tiktok: "",
      youtube: "",
      linkedin: "",
    },

    // Additional fields
    specialties: [],
    whyUs: [],
    ctaButtons: [],
    team: [],

    // Regional Settings (these might need to be stored elsewhere or added to schema)
    language: "",
    timezone: "",
    currency: "",
  });

  // Load existing agency data
  useEffect(() => {
    const fetchAgencyData = async () => {
      try {
        const response = await axios.get(`${baseURL}/agency/getAgencyDetail`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          const agency = response.data.agency;
          setFormData({
            agencyName: agency.agencyName || "",
            username: agency.username || "",
            agencyEmail: agency.agencyEmail || "",
            agencyPhone: agency.agencyPhone || "",
            description: agency.description || "",
            website: agency.website || "",
            country: agency.country || "",
            city: agency.city || "",
            category: agency.category || "",
            companySize: agency.companySize || "",
            agencyType: agency.agencyType || "",
            socialLinks: {
              instagram: agency.socialLinks?.instagram || "",
              facebook: agency.socialLinks?.facebook || "",
              twitter: agency.socialLinks?.twitter || "",
              tiktok: agency.socialLinks?.tiktok || "",
              youtube: agency.socialLinks?.youtube || "",
              linkedin: agency.socialLinks?.linkedin || "",
            },
            specialties: agency.specialties || [],
            whyUs: agency.whyUs || [],
            ctaButtons: agency.ctaButtons || [],
            team: agency.team || [],
            // Regional settings - you might need to add these to schema
            language: agency.language || "en",
            timezone: agency.timezone || "America/New_York",
            currency: agency.currency || "USD",
          });

          // Set image previews if they exist
          if (agency.logo) setLogoPreview(agency.logo);
          if (agency.bannerImage) setBannerImagePreview(agency.bannerImage);
          if (agency.trustBadge) setTrustBadgeImagePreview(agency.trustBadge);
        }
      } catch (error) {
        console.error("Failed to fetch agency data:", error);
        toast.error("Failed to load agency data");
      }
    };

    if (token) {
      fetchAgencyData();
    }
  }, [token]);

  const handleInputChange = useCallback((field, value) => {
    if (field.startsWith("socialLinks.")) {
      const socialField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }, []);

  const handleLogoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setLogoFile(file);
    }
  }, []);

  const handleBannerImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setBannerImagePreview(URL.createObjectURL(file));
      setBannerImageFile(file);
    }
  }, []);

  const handleTeamMemberChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newTeamMembers = [...prev.team];
      if (!newTeamMembers[index]) {
        newTeamMembers[index] = {
          name: "",
          role: "",
          avatar: "",
          profileLink: "",
        };
      }
      newTeamMembers[index][field] = value;
      return {
        ...prev,
        team: newTeamMembers,
      };
    });
  }, []);

  const handleTeamMemberAvatarUpload = useCallback((index, event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);

      // Update the avatar preview in form data
      setFormData((prev) => {
        const newTeamMembers = [...prev.team];
        if (!newTeamMembers[index]) {
          newTeamMembers[index] = {
            name: "",
            role: "",
            avatar: "",
            profileLink: "",
          };
        }
        newTeamMembers[index].avatar = previewUrl;
        return {
          ...prev,
          team: newTeamMembers,
        };
      });

      // Store the file for upload
      setTeamMemberAvatarFiles((prev) => ({
        ...prev,
        [index]: file,
      }));
    }
  }, []);

  const addTeamMember = useCallback(() => {
    if (formData.team.length < 3) {
      setFormData((prev) => ({
        ...prev,
        team: [
          ...prev.team,
          { name: "", role: "", avatar: "", profileLink: "" },
        ],
      }));
    }
  }, [formData.team.length]);

  const handleCertificateUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setTrustBadgeImagePreview(URL.createObjectURL(file));
      setTrustBadgeFile(file);
    }
  }, []);

  const handleArrayChange = useCallback((field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      if (value === "") {
        newArray.splice(index, 1);
      } else {
        newArray[index] = value;
      }
      return {
        ...prev,
        [field]: newArray,
      };
    });
  }, []);

  const addArrayItem = useCallback((field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  }, []);

  const handleCTAChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newCTAs = [...prev.ctaButtons];
      if (!newCTAs[index]) {
        newCTAs[index] = { label: "", link: "" };
      }
      newCTAs[index][field] = value;
      return {
        ...prev,
        ctaButtons: newCTAs,
      };
    });
  }, []);

  const addCTAButton = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      ctaButtons: [...prev.ctaButtons, { label: "", link: "" }],
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    const data = new FormData();

    // Append image files if selected
    if (logoFile) data.append("logo", logoFile);
    if (bannerImageFile) data.append("bannerImage", bannerImageFile);
    if (trustBadgeFile) data.append("trustBadge", trustBadgeFile);

    // Append team member avatar files
    Object.keys(teamMemberAvatarFiles).forEach((key) => {
      data.append(`teamMemberAvatar${key}`, teamMemberAvatarFiles[key]);
    });

    // Append all form fields (matching schema)
    data.append("agencyName", formData.agencyName);
    data.append("username", formData.username);
    data.append("agencyEmail", formData.agencyEmail);
    data.append("agencyPhone", formData.agencyPhone);
    data.append("description", formData.description);
    data.append("website", formData.website);
    data.append("country", formData.country);
    data.append("city", formData.city);
    data.append("category", formData.category);
    data.append("companySize", formData.companySize);
    data.append("agencyType", formData.agencyType);

    // Social links as JSON string
    data.append("socialLinks", JSON.stringify(formData.socialLinks));

    // Arrays as JSON strings
    data.append(
      "specialties",
      JSON.stringify(formData.specialties.filter((s) => s.trim())),
    );
    data.append(
      "whyUs",
      JSON.stringify(formData.whyUs.filter((w) => w.trim())),
    );
    data.append(
      "ctaButtons",
      JSON.stringify(
        formData.ctaButtons.filter((cta) => cta.label && cta.link),
      ),
    );

    data.append(
      "teamMembers",
      JSON.stringify(
        formData.team.filter((member) => member.name && member.role),
      ),
    );
    // Regional settings (you might need to add these to your schema)
    data.append("language", formData.language);
    data.append("timezone", formData.timezone);
    data.append("currency", formData.currency);

    try {
      const res = await axios.patch(
        `${baseURL}/agency/update-agency-settings`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.status === 200) {
        toast.success("Settings updated!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        toast.error("Failed to update settings. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("An error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const languages = useMemo(
    () => [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
    ],
    [],
  );

  const timezones = useMemo(
    () => [
      { value: "America/New_York", label: "Eastern Time (ET)" },
      { value: "America/Chicago", label: "Central Time (CT)" },
      { value: "America/Denver", label: "Mountain Time (MT)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
      { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
      { value: "Europe/Paris", label: "Central European Time (CET)" },
      { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    ],
    [],
  );

  const currencies = useMemo(
    () => [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "JPY", name: "Japanese Yen", symbol: "¥" },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
      { code: "AUD", name: "Australian Dollar", symbol: "A$" },
      { code: "INR", name: "Indian Rupee", symbol: "₹" },
    ],
    [],
  );

  const agencyTypes = useMemo(
    () => [
      "Fashion",
      "Commercial",
      "Print",
      "Runway",
      "Plus Size",
      "Fitness",
      "Parts",
      "Children",
      "Talent",
      "Full Service",
    ],
    [],
  );

  const companySizes = useMemo(
    () => [
      "1-10 employees",
      "11-50 employees",
      "51-200 employees",
      "201-500 employees",
      "500+ employees",
    ],
    [],
  );

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-gray-800">
              <ArrowLeft onClick={() => navigate(-1)} size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold dark:text-white text-gray-600">
                Agency Settings
              </h1>
              <p className="dark:text-gray-400 text-gray-600">
                Manage your agency information and preferences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <PermissionGuard
              permission="settings.manage"
              fallback={hasFullAccess}
            >
              <Button
                variant="default"
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" className="mb-6">
            <div>
              <h4 className="font-semibold">Settings Updated Successfully!</h4>
              <p className="text-sm mt-1">
                Your agency settings have been saved.
              </p>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agency Information */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Building2 size={20} className="text-blue-400" />
                  Agency Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <Label className="dark:text-white text-gray-600">
                    Agency Logo
                  </Label>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg">
                      <img
                        src={logoPreview}
                        alt="Agency logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        className="border border-gray-600"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("logo-upload").click()
                        }
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                        Recommended: 200x200px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div>
                  <Label className="dark:text-white text-gray-600">
                    Banner Image
                  </Label>
                  <div className="space-y-4">
                    {bannerImagePreview && (
                      <div className="w-full h-[300px] rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
                        <img
                          src={bannerImagePreview}
                          alt="Banner image preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageUpload}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <Button
                        className="border border-gray-600"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("banner-image-upload").click()
                        }
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Banner Image
                      </Button>
                      <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                        Recommended: 1200x400px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agency Name & Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="agencyName"
                    >
                      Agency Name
                    </Label>
                    <Input
                      id="agencyName"
                      className="border border-gray-600"
                      value={formData.agencyName}
                      onChange={(e) =>
                        handleInputChange("agencyName", e.target.value)
                      }
                      placeholder="Enter agency name"
                    />
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="username"
                    >
                      Username
                    </Label>
                    <Input
                      id="username"
                      className="border border-gray-600"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label
                    className="dark:text-white text-gray-600"
                    htmlFor="description"
                  >
                    Description
                  </Label>
                  <TextArea
                    className="border border-gray-600"
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your agency..."
                    rows={4}
                  />
                  <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">
                    This will be displayed on your public profile
                  </p>
                </div>

                {/* Location & Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="country"
                    >
                      Country
                    </Label>
                    <Input
                      id="country"
                      className="border border-gray-600"
                      value={formData.country}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="city"
                    >
                      City
                    </Label>
                    <Input
                      id="city"
                      className="border border-gray-600"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="category"
                    >
                      Category
                    </Label>
                    <Input
                      id="category"
                      className="border border-gray-600"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      placeholder="Enter category"
                    />
                  </div>
                </div>

                {/* Agency Type & Company Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="agencyType"
                    >
                      Agency Type
                    </Label>
                    <Select
                      id="agencyType"
                      value={formData.agencyType}
                      onChange={(e) =>
                        handleInputChange("agencyType", e.target.value)
                      }
                      className="border border-gray-600"
                    >
                      <option value="">Select agency type</option>
                      {agencyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="companySize"
                    >
                      Company Size
                    </Label>
                    <Select
                      id="companySize"
                      value={formData.companySize}
                      onChange={(e) =>
                        handleInputChange("companySize", e.target.value)
                      }
                      className="border border-gray-600"
                    >
                      <option value="">Select company size</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Certificate Upload */}
                <div>
                  <Label className="dark:text-white text-gray-600">
                    Trust Badge
                  </Label>
                  {trustBadgeImagePreview && (
                    <div className="relative w-20 h-24 mb-4 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
                      <img
                        src={trustBadgeImagePreview}
                        alt="Trust Badge image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCertificateUpload}
                      className="hidden"
                      id="certificate-upload"
                    />
                    <Button
                      className="border border-gray-600"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("certificate-upload").click()
                      }
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Trust Badge
                    </Button>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                      Upload business certificate or license (PDF, JPG, PNG)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Phone
                    size={20}
                    className="dark:text-green-400 text-green-600"
                  />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="agencyEmail"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        id="agencyEmail"
                        type="email"
                        value={formData.agencyEmail}
                        onChange={(e) =>
                          handleInputChange("agencyEmail", e.target.value)
                        }
                        placeholder="contact@agency.com"
                        className="pl-10 border border-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="agencyPhone"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        id="agencyPhone"
                        type="tel"
                        value={formData.agencyPhone}
                        onChange={(e) =>
                          handleInputChange("agencyPhone", e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label
                    className="dark:text-white text-gray-600"
                    htmlFor="website"
                  >
                    Website
                  </Label>
                  <div className="relative">
                    <Globe
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      placeholder="www.agency.com"
                      className="border border-gray-600 pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Instagram
                    size={20}
                    className="dark:text-pink-400 text-pink-600"
                  />
                  Social Media Handles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="instagram"
                    >
                      Instagram
                    </Label>
                    <div className="relative">
                      <Instagram
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-pink-400 text-pink-600"
                      />
                      <Input
                        id="instagram"
                        value={formData.socialLinks.instagram}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.instagram",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="facebook"
                    >
                      Facebook
                    </Label>
                    <div className="relative">
                      <Facebook
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-blue-400 text-blue-600"
                      />
                      <Input
                        id="facebook"
                        value={formData.socialLinks.facebook}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.facebook",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="text-gray-600 dark:text-white"
                      htmlFor="twitter"
                    >
                      X (Twitter)
                    </Label>
                    <div className="relative">
                      <X
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-blue-300 text-blue-600"
                      />
                      <Input
                        id="twitter"
                        value={formData.socialLinks.twitter}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.twitter",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="tiktok"
                    >
                      TikTok
                    </Label>
                    <div className="relative">
                      <FaTiktok
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-blue-300 text-blue-600"
                      />
                      <Input
                        id="tiktok"
                        value={formData.socialLinks.tiktok}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.tiktok",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="youtube"
                    >
                      YouTube
                    </Label>
                    <div className="relative">
                      <IoLogoYoutube
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-red-500 text-blue-600"
                      />
                      <Input
                        id="youtube"
                        value={formData.socialLinks.youtube}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.youtube",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="dark:text-white text-gray-600"
                      htmlFor="linkedin"
                    >
                      LinkedIn
                    </Label>
                    <div className="relative">
                      <FaLinkedin
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-blue-500 text-blue-600"
                      />
                      <Input
                        id="linkedin"
                        value={formData?.socialLinks?.linkedin}
                        onChange={(e) =>
                          handleInputChange(
                            "socialLinks.linkedin",
                            e.target.value,
                          )
                        }
                        className="border border-gray-600 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Award size={20} className="text-yellow-400" />
                  Specialties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.specialties.map((specialty, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={specialty}
                      onChange={(e) =>
                        handleArrayChange("specialties", index, e.target.value)
                      }
                      placeholder={`Specialty ${index + 1}`}
                      className="border border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleArrayChange("specialties", index, "")
                      }
                      className="px-3"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  // disabled={!canAddNewSpecialty()}
                  onClick={() => addArrayItem("specialties")}
                  className="w-full"
                >
                  + Add Specialty
                </Button>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Users size={20} className="text-purple-400" />
                  Why Choose Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.whyUs.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={reason}
                      onChange={(e) =>
                        handleArrayChange("whyUs", index, e.target.value)
                      }
                      placeholder={`Reason ${index + 1}`}
                      className="border border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArrayChange("whyUs", index, "")}
                      className="px-3"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("whyUs")}
                  className="w-full"
                >
                  + Add Reason
                </Button>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Briefcase size={20} className="text-orange-400" />
                  Call-to-Action Buttons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.ctaButtons.map((cta, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <Label className="dark:text-white text-gray-600">
                        Button Label
                      </Label>
                      <Input
                        value={cta.label || ""}
                        onChange={(e) =>
                          handleCTAChange(index, "label", e.target.value)
                        }
                        placeholder="e.g., Apply Now"
                        className="border border-gray-600"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="dark:text-white text-gray-600">
                          Link URL
                        </Label>
                        <Input
                          value={cta.link || ""}
                          onChange={(e) =>
                            handleCTAChange(index, "link", e.target.value)
                          }
                          placeholder="https://..."
                          className="border border-gray-600"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            ctaButtons: prev.ctaButtons.filter(
                              (_, i) => i !== index,
                            ),
                          }));
                        }}
                        className="px-3 mb-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCTAButton}
                  className="w-full"
                >
                  + Add CTA Button
                </Button>
              </CardContent>
            </Card>

            {/*Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600 flex items-center gap-2">
                  <Users size={20} className="text-orange-400" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.team.map((member, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium dark:text-white text-gray-700">
                        Team Member {index + 1}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            team: prev.team.filter((_, i) => i !== index),
                          }));
                          // Clean up avatar file
                          setTeamMemberAvatarFiles((prev) => {
                            const newFiles = { ...prev };
                            delete newFiles[index];
                            return newFiles;
                          });
                        }}
                        className="px-3"
                      >
                        ×
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-white text-gray-600">
                          Name
                        </Label>
                        <Input
                          value={member.name || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., John Doe"
                          className="border border-gray-600"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-white text-gray-600">
                          Role
                        </Label>
                        <Input
                          value={member.role || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(
                              index,
                              "role",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., CEO, CTO, Designer"
                          className="border border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-white text-gray-600">
                          Profile/LinkedIn URL
                        </Label>
                        <Input
                          value={member.profileLink || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(
                              index,
                              "profileLink",
                              e.target.value,
                            )
                          }
                          placeholder="https://linkedin.com/in/..."
                          className="border border-gray-600"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-white text-gray-600">
                          Avatar
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleTeamMemberAvatarUpload(index, e)
                            }
                            className="border border-gray-600"
                          />
                          {member.avatar && (
                            <div className="flex-shrink-0">
                              <img
                                src={member.avatar}
                                alt={`${member.name || "Team member"} avatar`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.team.length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTeamMember}
                    className="w-full"
                  >
                    + Add Team Member ({formData.team.length}/3)
                  </Button>
                )}

                {formData.team.length >= 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Maximum of 3 team members reached
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Model Debug Panel */}
          <div>
            <ModelDebugPanel className="mb-8" />
          </div>

          {/* Regional Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white text-gray-600">
                  <Languages
                    size={20}
                    className="dark:text-purple-400 text-purple-600"
                  />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label
                    className="dark:text-white text-gray-600"
                    htmlFor="language"
                  >
                    Default Language
                  </Label>
                  <div className="relative">
                    <Languages
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 dark:text-gray-400"
                    />
                    <Select
                      id="language"
                      value={formData.language}
                      onChange={(e) =>
                        handleInputChange("language", e.target.value)
                      }
                      className="pl-10"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    className="dark:text-white text-gray-600"
                    htmlFor="timezone"
                  >
                    Time Zone
                  </Label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Select
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) =>
                        handleInputChange("timezone", e.target.value)
                      }
                      className="pl-10"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    className="dark:text-white text-gray-600"
                    htmlFor="currency"
                  >
                    Currency
                  </Label>
                  <div className="relative">
                    <DollarSign
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) =>
                        handleInputChange("currency", e.target.value)
                      }
                      className="pl-10"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.name} ({curr.symbol})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <Alert variant="info" className="mt-6">
                  <div>
                    <h4 className="font-semibold text-sm">Note</h4>
                    <p className="text-sm mt-1">
                      These settings will affect how dates, times, and
                      currencies are displayed throughout your dashboard.
                    </p>
                  </div>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
