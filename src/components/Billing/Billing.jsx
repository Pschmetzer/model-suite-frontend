import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Settings,
  ChevronRight,
  FileText,
  Folder,
  ChevronDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Custom Button Component
const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500",
    ghost:
      "bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white focus:ring-gray-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

// Custom Select Component
const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-left text-white hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? "text-white" : "text-gray-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    viewed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    signed: "bg-green-500/20 text-green-400 border-green-500/30",
    default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Custom Card Components
const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

// Custom Tabs Component
const Tabs = ({ tabs, activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`flex space-x-8 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative pb-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-blue-400"
              : "text-gray-400 dark:text-white hover:text-[#1F2937]"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

// Custom Input Component
const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  required = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-gray-400 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Dashboard Component
const BillingDashboard = ({ modelInfo, role }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [template, setTemplate] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    templateId: "",
  });
  const [contractsData, setContractData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const user =
    role === "agency"
      ? JSON.parse(localStorage.getItem("auth"))?.user._id
      : modelInfo.agencyId;

  const tabs = [
    { id: "all", label: "All contracts" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
    { id: "expired", label: "Expired" },
  ];

  // ✅ Classification logic for contract type
  const classifyContract = (contract) => {
    const { status, createdAt } = contract;
    const ageInDays =
      (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    if (status === "signed") return "complete";
    if (["sent", "viewed", "draft"].includes(status) && ageInDays > 30)
      return "expired";
    return "pending";
  };

  const filteredContracts = contractsData.filter((c) => {
    const type = classifyContract(c);
    if (activeTab === "all") return true;
    if (activeTab === "pending") return type === "pending";
    if (activeTab === "completed") return type === "complete";
    if (activeTab === "expired") return type === "expired";
    return false;
  });

  const getTemplate = async () => {
    try {
      const res = await axios.get(`${baseUrl}/panda/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplate(res.data.results);
    } catch (error) {
      console.log(error);
    }
  };

  const createDocument = async () => {
    if (
      !formData.recipientName ||
      !formData.recipientEmail ||
      !formData.templateId
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${baseUrl}/panda/create-document`,
        {
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          templateId: formData.templateId,
          modelId: modelInfo._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setFormData({
        recipientName: "",
        recipientEmail: "",
        templateId: "",
      });
      setShowModal(false);
      getDocumentsByModel(); // Refresh contracts
    } catch (err) {
      console.error(
        "Error creating document:",
        err.response?.data || err.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentsByModel = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}/panda/model/${modelInfo._id}/${user}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setContractData(res.data.contracts);
      return res.data;
    } catch (err) {
      console.error(
        "Error fetching model documents:",
        err.response?.data || err.message,
      );
    }
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case "sent":
        return "sent";
      case "viewed":
        return "viewed";
      case "signed":
        return "signed";
      default:
        return "default";
    }
  };

  const templateOptions = template.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openModal = () => {
    setShowModal(true);
    if (modelInfo?.fullName) {
      setFormData((prev) => ({
        ...prev,
        recipientName: modelInfo.fullName,
        recipientEmail: modelInfo.email,
      }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      recipientName: "",
      recipientEmail: "",
      templateId: "",
    });
  };

  useEffect(() => {
    getTemplate();
    getDocumentsByModel();
  }, []);

  return (
    <div className="min-h-screen dark:bg-gray-900 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span className="dark:text-white text-[#1F2937]">Dashboard</span>
            <span className="dark:text-white text-[#1F2937]">/</span>
            <span className="dark:text-white text-[#1F2937]">Billing</span>
          </div>
          <div className="flex items-center space-x-3">
            {role === "agency" && (
              <>
                <Button onClick={openModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Contract
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <div className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6 dark:text-white text-[#1F2937]">
              Contracts
            </h1>

            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="mb-6"
            />
            {role === "agency" && (
              <Button onClick={openModal} className="mb-6">
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            )}

            {filteredContracts.length > 0 ? (
              <Card>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-sm text-gray-400 font-medium">
                    <div>MODEL</div>
                    <div>AGENCY</div>
                    <div>TEMPLATE</div>
                    <div>STATUS</div>
                  </div>

                  {filteredContracts.map((contract, index) => (
                    <motion.div
                      key={contract._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition-colors"
                    >
                      <div className="font-medium">
                        {contract.modelFullName}
                      </div>
                      <div className="text-gray-400">{contract.agencyName}</div>
                      <div className="text-gray-400">
                        {contract.templateName}
                      </div>
                      <div>
                        <Badge variant={getStatusVariant(contract.status)}>
                          {contract.status.charAt(0).toUpperCase() +
                            contract.status.slice(1)}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            ) : (
              <div className="text-gray-400 text-sm border border-gray-700 rounded-lg p-6 text-center">
                No {activeTab !== "all" ? activeTab : ""} contracts found.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar and Modal — unchanged */}
        {/* ...Keep the rest of your code below unchanged (billingData, documents, modal) */}
      </div>

      {/* New Contract Modal */}
      <Modal isOpen={showModal} onClose={closeModal}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Create New Contract</h2>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Recipient Name"
              value={formData.recipientName}
              onChange={(e) =>
                handleInputChange("recipientName", e.target.value)
              }
              placeholder="Enter recipient name"
              required
            />

            <Input
              label="Recipient Email"
              type="email"
              value={formData.recipientEmail}
              onChange={(e) =>
                handleInputChange("recipientEmail", e.target.value)
              }
              placeholder="Enter recipient email"
              required
            />

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Template <span className="text-red-400">*</span>
              </label>
              <Select
                options={templateOptions}
                value={formData.templateId}
                onChange={(value) => handleInputChange("templateId", value)}
                placeholder="Select template"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={createDocument}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Contract"}
              </Button>
              <Button
                variant="secondary"
                onClick={closeModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Modal>
    </div>
  );
};

export default BillingDashboard;
