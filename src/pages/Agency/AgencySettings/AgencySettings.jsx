import React, { useState } from "react";
import SettingSidebar from "./SettingSidebar";
import SettingContent from "./SettingContent";

const AgencySettings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  return (
    <div className="flex">
      <SettingSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <SettingContent activeTab={activeTab} />
    </div>
  );
};

export default AgencySettings;
