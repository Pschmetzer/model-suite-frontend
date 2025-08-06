import React from "react";
import AccountDetails from "./MenuTab/AccountDetails";
import ProfileBranding from "./MenuTab/ProfileBranding";
import Notifications from "./MenuTab/Notifications";
import Security from "./MenuTab/Security";
import ChangePassword from "./MenuTab/ChangePassword";
import Billing from "./MenuTab/Billing"; // Assuming you have a Billing component

const SettingContent = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountDetails />;
      case "password":
        return <ChangePassword />;
      case "branding":
        return <ProfileBranding />;
      case "notifications":
        return <Notifications />;
      case "security":
        return <Security />;
      case "billing":
        return <Billing />;
      default:
        return <AccountDetails />;
    }
  };
  return (
    <div>
      <div className="flex-1 p-6">{renderContent()}</div>
    </div>
  );
};

export default SettingContent;
