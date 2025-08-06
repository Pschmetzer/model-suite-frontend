import axios from "axios";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
  Edit3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border bg-white text-gray-900 shadow-lg 
      dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 dark:text-white ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div
    className={`flex flex-col space-y-1.5 p-6 
      bg-gray-100 border-b border-gray-200 
      dark:bg-gray-900 text-card-foreground shadow-md ${className}`}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-xl font-bold leading-tight tracking-tight flex items-center gap-2 ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 sm:p-8 bg-white dark:bg-transparent ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default:
      "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600",
    success:
      "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600",
    purple:
      "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

export default function AgencyInfoCard(props) {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const [data, setData] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getAgencyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseURL}/agency/getAgencyDetail/${props._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setData(response.data);
      } catch (error) {
        console.error("Failed to load agency data", error);
      } finally {
        setLoading(false);
      }
    };
    // getAgencyData();
  }, []);

  const agencyData = {
    name: "Elite Model Management",
    tagline: "Connecting Dreams with Opportunities",
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center",
    founded: "2018",
    location: "New York, NY",
    address: "123 Fashion Ave, Suite 500, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "contact@elitemodels.com",
    website: "www.elitemodels.com",
    description:
      "A premier modeling agency specializing in fashion, commercial, and lifestyle modeling. We represent top talent and connect them with leading brands worldwide.",
    socialMedia: {
      instagram: "@elitemodels",
      facebook: "EliteModelManagement",
      twitter: "@elitemodels",
    },
    specialties: ["Fashion", "Commercial", "Lifestyle", "Editorial", "Runway"],
    certifications: [
      "BBB Accredited",
      "SAG-AFTRA Franchised",
      "Licensed Agency",
    ],
  };

  return loading ? (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 dark:text-gray-400 animate-pulse">
        Loading agency details...
      </p>
    </div>
  ) : (
    <div className="w-full px-4 py-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-lg mx-auto sm:mx-0">
                  <img
                    src={agencyData.logo}
                    alt={`${agencyData.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-2xl mb-2">
                    <Building2
                      size={24}
                      className="text-blue-500 dark:text-blue-400"
                    />
                    {agencyData.name}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-3">
                    {agencyData.tagline}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {agencyData.certifications.map((cert, index) => (
                      <Badge key={index} variant="success">
                        <Star size={10} className="mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {/* Optional edit button */}
              {/* <button
                onClick={() => navigate("settings")}
                className="hidden sm:inline-block text-gray-400 hover:text-white transition"
                title="Edit"
              >
                <Edit3 size={20} />
              </button> */}
            </div>
          </CardHeader>

          <CardContent>
            {/* About */}
            <section className="mb-8">
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-blue-300">
                About Our Agency
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {agencyData.description}
              </p>
            </section>

            {/* Grid layout for contact + social */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-300">
                  Contact Information
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="text-gray-500 dark:text-gray-400 mt-1"
                      size={16}
                    />
                    <div>
                      <p className="font-medium">{agencyData.location}</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {agencyData.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone
                      className="text-gray-500 dark:text-gray-400"
                      size={16}
                    />
                    <span>{agencyData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail
                      className="text-gray-500 dark:text-gray-400"
                      size={16}
                    />
                    <span>{agencyData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe
                      className="text-gray-500 dark:text-gray-400"
                      size={16}
                    />
                    <a
                      href={`https://${agencyData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      {agencyData.website}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-300">
                  Social Media
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Instagram size={16} className="text-pink-500" />
                    <span>{agencyData.socialMedia.instagram}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Facebook size={16} className="text-blue-600" />
                    <span>{agencyData.socialMedia.facebook}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Twitter size={16} className="text-blue-500" />
                    <span>{agencyData.socialMedia.twitter}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            <section className="mb-8">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-300">
                Our Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {agencyData.specialties.map((specialty, index) => (
                  <Badge key={index} variant="purple">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
