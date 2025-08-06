import React from "react";
import { User, Lock, Image, Bell, Shield, CreditCard } from "lucide-react";

const tabs = [
  { id: "account", label: "Account Details", icon: User },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "branding", label: "Profile & Agency Branding", icon: Image },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Login Options", icon: Shield },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard },
];
const SettingSidebar = ({
  activeTab,
  onTabChange,
  isMobileOpen,
  onMobileClose,
}) => {
  return (
    <div>
      <>
        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-gray-800 
        transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      onMobileClose();
                    }}
                    className={`
                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
                    ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }
                  `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </>
    </div>
  );
};

export default SettingSidebar;
