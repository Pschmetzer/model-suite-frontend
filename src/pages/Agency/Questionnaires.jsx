import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TemplateList from "../../components/questionnaire/agency/TemplateList";
import TemplateForm from "../../components/questionnaire/agency/TemplateForm";
import TemplateView from "../../components/questionnaire/agency/TemplateView";
import AssignmentManager from "../../components/questionnaire/agency/AssignmentManager";
import AssignmentTracker from "../../components/questionnaire/agency/AssignmentTracker";
import ResponseViewer from "../../components/questionnaire/agency/ResponseViewer";
import ResponseAnalytics from "../../components/questionnaire/agency/ResponseAnalytics";
import Button from "../../components/ui/Button";

const Questionnaires = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Update view based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/templates")) {
      setCurrentView("templates");
    } else if (path.includes("/assignments")) {
      setCurrentView("assignment-tracker");
    } else if (path.includes("/responses")) {
      setCurrentView("response-viewer");
    } else if (path.includes("/analytics")) {
      setCurrentView("response-analytics");
    } else {
      setCurrentView("templates"); // Default view
    }
  }, [location.pathname]);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setCurrentView("template-form");
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentView("template-form");
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentView("template-view");
  };

  const handleAssignTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentView("assignment-manager");
  };

  const handleAnalytics = (template) => {
    setSelectedTemplate(template);
    setCurrentView("response-analytics");
  };

  const handleViewResponses = (assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView("response-viewer");
  };

  const handleTemplateSaved = () => {
    setCurrentView("templates");
    setSelectedTemplate(null);
  };

  const handleAssignmentComplete = () => {
    setCurrentView("assignment-tracker");
    setSelectedTemplate(null);
  };

  const handleBackToTemplates = () => {
    setCurrentView("templates");
    setSelectedTemplate(null);
    setSelectedAssignment(null);
  };

  const handleBackToAssignments = () => {
    setCurrentView("assignment-tracker");
    setSelectedAssignment(null);
  };

  const renderNavigation = () => (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600 mb-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentView === "templates" ? "default" : "ghost"}
          onClick={() => navigate("/agency/questionnaires/templates")}
        >
          Templates
        </Button>
        <Button
          variant={currentView === "assignment-tracker" ? "default" : "ghost"}
          onClick={() => navigate("/agency/questionnaires/assignments")}
        >
          Assignments
        </Button>
        <Button
          variant={currentView === "response-viewer" ? "default" : "ghost"}
          onClick={() => navigate("/agency/questionnaires/responses")}
        >
          Responses
        </Button>
        <Button
          variant={currentView === "response-analytics" ? "default" : "ghost"}
          onClick={() => navigate("/agency/questionnaires/analytics")}
        >
          Analytics
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case "templates":
        return (
          <TemplateList
            onEdit={handleEditTemplate}
            onView={handleViewTemplate}
            onAssign={handleAssignTemplate}
            onAnalytics={handleAnalytics}
            onCreate={handleCreateTemplate}
          />
        );

      case "template-form":
        return (
          <TemplateForm
            template={selectedTemplate}
            onSave={handleTemplateSaved}
            onCancel={handleBackToTemplates}
          />
        );

      case "template-view":
        return (
          <TemplateView
            template={selectedTemplate}
            onEdit={handleEditTemplate}
            onAssign={handleAssignTemplate}
            onBack={handleBackToTemplates}
          />
        );

      case "assignment-manager":
        return (
          <AssignmentManager
            selectedTemplate={selectedTemplate}
            onClose={handleBackToTemplates}
            onAssignmentComplete={handleAssignmentComplete}
          />
        );

      case "assignment-tracker":
        return (
          <AssignmentTracker
            onViewResponses={handleViewResponses}
            onReassign={handleAssignTemplate}
          />
        );

      case "response-viewer":
        return (
          <ResponseViewer
            templateId={
              selectedAssignment
                ? selectedAssignment.templateId?._id ||
                  selectedAssignment.templateId
                : null
            }
            onBack={handleBackToAssignments}
          />
        );

      case "response-analytics":
        return (
          <ResponseAnalytics
            templateId={selectedTemplate?._id}
            template={selectedTemplate}
            onBack={handleBackToTemplates}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">
              Select a view from the navigation above
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Questionnaire Management
          </h1>
          <p className="text-gray-400">
            Create, assign, and analyze questionnaires for your models
          </p>
        </div>

        {/* Navigation */}
        {!["template-form", "template-view", "assignment-manager"].includes(
          currentView,
        ) && renderNavigation()}

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Questionnaires;
