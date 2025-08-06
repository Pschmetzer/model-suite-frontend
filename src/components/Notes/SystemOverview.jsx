import React, { useState } from "react";
import {
  FileText,
  BarChart3,
  Search,
  Filter,
  Bell,
  Paperclip,
  Tag,
  Pin,
  Calendar,
  Download,
  Upload,
  Users,
  Settings,
  Database,
  Server,
  Globe,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Layers,
  Code,
  Smartphone,
  Monitor,
  Cloud,
  Lock,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";

/**
 * Comprehensive System Overview Component
 * Displays the complete Notes system architecture, features, and implementation status
 */
const SystemOverview = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("features");
  const [expandedPhases, setExpandedPhases] = useState(new Set(["phase1"]));

  const togglePhase = (phase) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  const systemFeatures = [
    {
      category: "Core Features",
      icon: FileText,
      color: "blue",
      features: [
        {
          name: "Create & Edit Notes",
          status: "completed",
          description: "Rich text editor with markdown support",
        },
        {
          name: "Model-Specific Notes",
          status: "completed",
          description: "Notes tied to specific AI models",
        },
        {
          name: "Categories & Tags",
          status: "completed",
          description: "Organize notes with custom categories and tags",
        },
        {
          name: "Priority Levels",
          status: "completed",
          description: "High, Medium, Low priority classification",
        },
        {
          name: "Pin Important Notes",
          status: "completed",
          description: "Pin frequently accessed notes to the top",
        },
      ],
    },
    {
      category: "Search & Filter",
      icon: Search,
      color: "green",
      features: [
        {
          name: "Full-Text Search",
          status: "completed",
          description: "Search across note titles and content",
        },
        {
          name: "Advanced Filters",
          status: "completed",
          description: "Filter by category, priority, date, and tags",
        },
        {
          name: "Smart Sorting",
          status: "completed",
          description: "Sort by date, title, priority, or relevance",
        },
        {
          name: "Real-time Search",
          status: "completed",
          description: "Instant search results as you type",
        },
      ],
    },
    {
      category: "Reminders & Notifications",
      icon: Bell,
      color: "yellow",
      features: [
        {
          name: "Custom Reminders",
          status: "completed",
          description: "Set reminders for specific notes",
        },
        {
          name: "Due Date Tracking",
          status: "completed",
          description: "Track and manage note deadlines",
        },
        {
          name: "Notification System",
          status: "in-progress",
          description: "Real-time notifications for reminders",
        },
        {
          name: "Email Alerts",
          status: "planned",
          description: "Email notifications for important reminders",
        },
      ],
    },
    {
      category: "File Management",
      icon: Paperclip,
      color: "purple",
      features: [
        {
          name: "File Attachments",
          status: "completed",
          description: "Attach files to notes (images, documents, etc.)",
        },
        {
          name: "Cloud Storage",
          status: "completed",
          description: "Secure cloud storage for attachments",
        },
        {
          name: "File Preview",
          status: "in-progress",
          description: "Preview attachments without downloading",
        },
        {
          name: "Version Control",
          status: "planned",
          description: "Track file versions and changes",
        },
      ],
    },
    {
      category: "Analytics & Insights",
      icon: BarChart3,
      color: "indigo",
      features: [
        {
          name: "Usage Analytics",
          status: "completed",
          description: "Comprehensive notes usage statistics",
        },
        {
          name: "Activity Timeline",
          status: "completed",
          description: "Visual timeline of note activities",
        },
        {
          name: "Performance Metrics",
          status: "completed",
          description: "Track productivity and engagement",
        },
        {
          name: "Export Reports",
          status: "completed",
          description: "Export analytics data in multiple formats",
        },
      ],
    },
    {
      category: "Collaboration",
      icon: Users,
      color: "pink",
      features: [
        {
          name: "Model Sharing",
          status: "completed",
          description: "Share notes with specific AI models",
        },
        {
          name: "Agency Management",
          status: "completed",
          description: "Agency-level note management",
        },
        {
          name: "Access Control",
          status: "in-progress",
          description: "Fine-grained permission system",
        },
        {
          name: "Real-time Collaboration",
          status: "planned",
          description: "Live collaborative editing",
        },
      ],
    },
  ];

  const implementationPhases = [
    {
      id: "phase1",
      title: "Phase 1: Core Foundation",
      status: "completed",
      description: "Basic note management functionality",
      features: [
        "Note CRUD operations",
        "Basic search and filtering",
        "Category management",
        "Model integration",
        "User authentication",
      ],
      techStack: ["React", "Node.js", "MongoDB", "Express.js"],
    },
    {
      id: "phase2",
      title: "Phase 2: Enhanced Features",
      status: "completed",
      description: "Advanced functionality and user experience",
      features: [
        "Rich text editor",
        "File attachments",
        "Reminder system",
        "Advanced search",
        "Responsive design",
      ],
      techStack: ["TinyMCE", "Multer", "Cloudinary", "Socket.io"],
    },
    {
      id: "phase3",
      title: "Phase 3: Analytics & Bulk Operations",
      status: "completed",
      description: "Data insights and productivity features",
      features: [
        "Comprehensive analytics dashboard",
        "Bulk operations (select, delete, pin)",
        "Export functionality (JSON, CSV)",
        "Usage statistics",
        "Performance metrics",
      ],
      techStack: ["Recharts", "D3.js", "CSV Parser", "Analytics API"],
    },
    {
      id: "phase4",
      title: "Phase 4: Dashboard Integration",
      status: "completed",
      description: "Full integration with main dashboard",
      features: [
        "Model selector component",
        "Dashboard statistics",
        "Quick access buttons",
        "Real-time updates",
        "Seamless navigation",
      ],
      techStack: ["Redux/Zustand", "React Router", "Axios", "WebSocket"],
    },
    {
      id: "phase5",
      title: "Phase 5: Advanced Features",
      status: "in-progress",
      description: "Next-generation capabilities",
      features: [
        "AI-powered note suggestions",
        "Smart categorization",
        "Voice notes",
        "Offline support",
        "Advanced collaboration",
      ],
      techStack: ["AI/ML APIs", "PWA", "IndexedDB", "WebRTC"],
    },
  ];

  const technicalArchitecture = {
    frontend: {
      title: "Frontend Architecture",
      icon: Monitor,
      technologies: [
        { name: "React 18", purpose: "UI Framework" },
        { name: "Vite", purpose: "Build Tool" },
        { name: "Tailwind CSS", purpose: "Styling" },
        { name: "Lucide React", purpose: "Icons" },
        { name: "Axios", purpose: "HTTP Client" },
        { name: "Recharts", purpose: "Data Visualization" },
        { name: "Sonner", purpose: "Toast Notifications" },
      ],
    },
    backend: {
      title: "Backend Architecture",
      icon: Server,
      technologies: [
        { name: "Node.js", purpose: "Runtime Environment" },
        { name: "Express.js", purpose: "Web Framework" },
        { name: "MongoDB", purpose: "Database" },
        { name: "Mongoose", purpose: "ODM" },
        { name: "JWT", purpose: "Authentication" },
        { name: "Multer", purpose: "File Upload" },
        { name: "Cloudinary", purpose: "File Storage" },
      ],
    },
    security: {
      title: "Security Features",
      icon: Shield,
      technologies: [
        { name: "JWT Tokens", purpose: "Secure Authentication" },
        { name: "CORS", purpose: "Cross-Origin Protection" },
        { name: "Input Validation", purpose: "Data Sanitization" },
        { name: "Rate Limiting", purpose: "API Protection" },
        { name: "HTTPS", purpose: "Encrypted Communication" },
        { name: "Role-based Access", purpose: "Permission Control" },
      ],
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "in-progress":
        return "text-yellow-400";
      case "planned":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in-progress":
        return Clock;
      case "planned":
        return AlertCircle;
      default:
        return Info;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full min-h-[92vh] my-4 flex flex-col">
        {/* Header - Sticky */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white sticky top-0 z-10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Layers size={32} />
                Notes SystemOverview
              </h2>
              <p className="text-blue-100 mt-2">
                Comprehensive documentation of the complete Notes management
                system
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 sticky top-[120px] z-10">
          <div className="flex space-x-1 p-1">
            {[
              { id: "features", label: "Features", icon: Zap },
              { id: "phases", label: "Implementation", icon: Layers },
              { id: "architecture", label: "Architecture", icon: Code },
              { id: "stats", label: "Statistics", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === id
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Flexible height */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSection === "features" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  System Features
                </h3>
                <p className="text-gray-400">
                  Complete feature set of the Notes management system
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemFeatures.map((category, categoryIndex) => {
                  const IconComponent = category.icon;
                  return (
                    <div
                      key={categoryIndex}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-2 rounded-lg bg-${category.color}-600/20`}
                        >
                          <IconComponent
                            className={`text-${category.color}-400`}
                            size={24}
                          />
                        </div>
                        <h4 className="text-xl font-semibold text-white">
                          {category.category}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {category.features.map((feature, featureIndex) => {
                          const StatusIcon = getStatusIcon(feature.status);
                          return (
                            <div
                              key={featureIndex}
                              className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg"
                            >
                              <StatusIcon
                                className={`${getStatusColor(
                                  feature.status,
                                )} mt-0.5`}
                                size={16}
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-white">
                                  {feature.name}
                                </h5>
                                <p className="text-sm text-gray-400 mt-1">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "phases" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Implementation Phases
                </h3>
                <p className="text-gray-400">
                  Development roadmap and current implementation status
                </p>
              </div>

              <div className="space-y-4">
                {implementationPhases.map((phase) => {
                  const StatusIcon = getStatusIcon(phase.status);
                  const isExpanded = expandedPhases.has(phase.id);

                  return (
                    <div
                      key={phase.id}
                      className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                    >
                      <button
                        onClick={() => togglePhase(phase.id)}
                        className="w-full p-6 text-left hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <StatusIcon
                              className={getStatusColor(phase.status)}
                              size={24}
                            />
                            <div>
                              <h4 className="text-xl font-semibold text-white">
                                {phase.title}
                              </h4>
                              <p className="text-gray-400 mt-1">
                                {phase.description}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                              <h5 className="font-semibold text-white mb-3">
                                Features
                              </h5>
                              <ul className="space-y-2">
                                {phase.features.map((feature, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-gray-300"
                                  >
                                    <CheckCircle
                                      className="text-green-400"
                                      size={16}
                                    />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-white mb-3">
                                Tech Stack
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {phase.techStack.map((tech, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "architecture" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Technical Architecture
                </h3>
                <p className="text-gray-400">
                  System architecture and technology stack overview
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(technicalArchitecture).map(([key, section]) => {
                  const IconComponent = section.icon;
                  return (
                    <div
                      key={key}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <IconComponent className="text-blue-400" size={24} />
                        </div>
                        <h4 className="text-xl font-semibold text-white">
                          {section.title}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {section.technologies.map((tech, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">
                                {tech.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {tech.purpose}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "stats" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  System Statistics
                </h3>
                <p className="text-gray-400">
                  Current system metrics and performance indicators
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Features",
                    value: "25+",
                    icon: Zap,
                    color: "blue",
                  },
                  {
                    label: "Implementation Phases",
                    value: "5",
                    icon: Layers,
                    color: "green",
                  },
                  {
                    label: "Technologies Used",
                    value: "20+",
                    icon: Code,
                    color: "purple",
                  },
                  {
                    label: "Completion Rate",
                    value: "80%",
                    icon: TrendingUp,
                    color: "yellow",
                  },
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center"
                    >
                      <div
                        className={`inline-flex p-3 rounded-lg bg-${stat.color}-600/20 mb-4`}
                      >
                        <IconComponent
                          className={`text-${stat.color}-400`}
                          size={24}
                        />
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">
                        {stat.value}
                      </div>
                      <div className="text-gray-400">{stat.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-xl font-semibold text-white mb-4">
                  Development Timeline
                </h4>
                <div className="space-y-4">
                  {implementationPhases.map((phase, index) => (
                    <div key={phase.id} className="flex items-center gap-4">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          phase.status === "completed"
                            ? "bg-green-400"
                            : phase.status === "in-progress"
                              ? "bg-yellow-400"
                              : "bg-gray-400"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {phase.title}
                          </span>
                          <span
                            className={`text-sm ${getStatusColor(
                              phase.status,
                            )} capitalize`}
                          >
                            {phase.status.replace("-", " ")}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              phase.status === "completed"
                                ? "bg-green-400 w-full"
                                : phase.status === "in-progress"
                                  ? "bg-yellow-400 w-3/4"
                                  : "bg-gray-400 w-1/4"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 sticky bottom-0 z-10 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={16} />
              <span>System fully operational and ready for use</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date().toLocaleDateString()}</span>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
