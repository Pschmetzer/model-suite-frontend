import React, { Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Register from "./pages/Register";
import ModelDashboard from "./pages/Model/Dashboard";
// import Login from "./pages/Model/Login";
import ForgotPassword from "./pages/Model/ForgotPassword";
import ForgotPasswordAgency from "./pages/Agency/ForgotPasswordAgency";
// import AgencyRegister from "./pages/Agency/Register";
import AgencyDashboard from "./pages/Agency/Dashboard";
import AgencyLogin from "./pages/Agency/Login";
import Home from "./pages/Home/Home";
import CreatorInsightsDashboard from "./pages/Agency/ModelView";
import Questionnaires from "./pages/Agency/Questionnaires";
import AgencyLayout from "./layouts/AgencyLayout"; //  Layout that wraps Sidebar + Outlet
import ModelLayout from "./layouts/ModelLayout";
import ProtectedRoute from "./utils/ProtectedRoute";
import QuestionnaireForm from "./components/questionnaire/model/QuestionnaireForm";
import FAQ from "./components/Support/FAQ";
import AgencyBilling from "./pages/Agency/Billing";
import BoardView from "./components/task/board/BoardView";
import Email_support from "./components/Support/email";
import { useEffect } from "react";
import AgencyProfile from "./pages/Agency/AgencyProfile";
import MagicVerify from "./pages/MagicLink";
import ActivateAccount from "./pages/Employee/Activate";
import Settings from "./pages/Agency/Settings";
import AuthLayout from "./components/supportteam/Authlayout.jsx";
import Modelside from "./components/supportteam/Modelside.jsx";
import InvoiceDashboard from "./pages/Agency/InvoiceDashboard";
import { Toaster } from "react-hot-toast";
import Post from "./pages/Agency/Post";
import axios from "axios";
import Supportcontactmanagement from "./components/supportteam/agency/Supportcontactmanagement.jsx";
import AgencySettings from "./pages/Agency/AgencySettings/AgencySettings.jsx";
import VoiceScriptManagement from "./pages/Voice/Agency/VoiceScriptManagement.jsx";
import Success from "./components/Calendar/Success.jsx";
import AgencyCaptionGenerator from "./pages/Agency/CaptionGenerator";
import PersonaBuilder from "./pages/PersonaBuilder";
import Help_desk from "./components/Support/support_page.jsx";

function App() {
  const location = useLocation();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingAuth = () => {
      const authData = localStorage.getItem("auth");

      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData);
          const { user, token } = parsedAuth;

          if (user && token) {
            console.log("Found existing auth data for:", user.role);

            // ✅ Redirect based on user role if on public pages
            const publicRoutes = [
              "/",
              "/register",
              "/magic-verify",
              "/model/forgot-password",
              "/agency/forgot-password",
            ];
            const isOnPublicRoute = publicRoutes.includes(location.pathname);

            if (isOnPublicRoute) {
              console.log("Redirecting authenticated user from public page");

              // Redirect to appropriate dashboard
              if (user.role === "model") {
                navigate("/model/dashboard", { replace: true });
              } else if (user.role === "agency") {
                navigate("/agency/dashboard", { replace: true });
              } else if (user.role === "employee") {
                navigate("/agency/dashboard", { replace: true });
              }
            }
          }
        } catch (error) {
          console.error("Error parsing auth data:", error);
          // Clear corrupted auth data
          localStorage.removeItem("auth");
        }
      }
    };

    checkExistingAuth();
  }, []);

  useEffect(() => {
    const publicRoutes = [
      "/",
      "/register",
      "/magic-verify",
      "/model/forgot-password",
      "/calendar/success",
      "/agency/forgot-password",
      "/employee/activate",
      "/instagram/success",
      "/tiktok/success",
      "/support/faqs",
      "/support/email",
    ];

    const isPublicRoute = publicRoutes.some(
      (route) =>
        location.pathname === route || location.pathname.startsWith("/board/"),
    );
    // ✅ Only refresh token for protected routes
    if (isPublicRoute) {
      console.log(
        "Skipping token refresh for public route:",
        location.pathname,
      );
      return;
    }

    // ✅ Check if user is actually logged in before refreshing
    const authData = localStorage.getItem("auth");
    if (!authData) {
      console.log("No auth data found, skipping token refresh");
      return;
    }

    const refreshAccessTokens = async () => {
      try {
        const response = await axios.post(
          `${baseURL}/refresh-token`,
          {},
          {
            withCredentials: true,
          },
        );
        const sanitizedData = String(response.data).replace(/[\r\n]+/g, "");
        console.log("Token refreshed successfully:", sanitizedData);

        const { user, token } = response.data;

        if (user && token) {
          const authData = {
            user: user,
            token: token,
            lastRefresh: new Date().toISOString(),
          };

          // Save to localStorage
          localStorage.setItem("auth", JSON.stringify(authData));

          console.log("Token refreshed and saved successfully");
          console.log("User role:", user.role);
          console.log("Token saved:", !!token);
        } else {
          console.warn("Token refresh response missing user or token data");
        }
      } catch (error) {
        const sanitizedError = String(error).replace(/[\r\n]+/g, "");
        console.error("Token refresh failed:", sanitizedError);

        if (error.response?.status === 401) {
          // Clear any existing auth data on 401
          localStorage.removeItem("auth");
          localStorage.removeItem("token");
          localStorage.removeItem("tokenExpiry");
          navigate("/");
        }
      }
    };

    refreshAccessTokens();
  }, [location.pathname, navigate, baseURL]);
  return (
    <React.Fragment>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/model/login" element={<Login />} /> */}
        {/* <Route path="/model/register" element={<Register />} /> */}
        <Route path="/magic-verify" element={<MagicVerify />} />
        {/* <Route path="/model/login" element={<Login />} /> */}
        {/* <Route path="/model/register" element={<Register />} /> */}
        <Route path="/model/forgot-password" element={<ForgotPassword />} />
        <Route path="/agency/login" element={<AgencyLogin />} />
        <Route path="/calendar/success" element={<Success />} />
        {/* <Route path="/agency/register" element={<AgencyRegister />} /> */}
        <Route
          path="/agency/forgot-password"
          element={<ForgotPasswordAgency />}
        />
        <Route path="/employee/activate" element={<ActivateAccount />} />
        <Route path="/support/faqs" element={<FAQ />} />
        <Route
          path="/board/:boardId"
          element={
            <div className="h-screen bg-gray-900">
              <BoardView />
            </div>
          }
        />
        <Route path="/support/email" element={<Email_support />} />
        <Route path="/support/help_desk" element={<Help_desk />} />

        {/* Protected model routes */}
        <Route element={<ProtectedRoute allowedRole="model" />}>
          <Route element={<ModelLayout />}>
            <Route path="/model/dashboard" element={<ModelDashboard />} />
            <Route path="/model/questionnaires" element={<ModelDashboard />} />
            <Route path="/model/supportsystem" element={<Modelside />} />
            {/* Route for individual questionnaire form */}
            <Route
              path="/model/questionnaire/:assignmentId"
              element={<QuestionnaireForm />}
            />
          </Route>
        </Route>

        {/* Protected agency routes */}
        <Route element={<ProtectedRoute allowedRole="agency" />}>
          <Route element={<AgencyLayout />}>
            <Route
              path="/support-contact-manager"
              element={<Supportcontactmanagement />}
            />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route
              path="/agency/caption-generator"
              element={<AgencyCaptionGenerator />}
            />
            <Route
              path="/agency/lyra/persona-builder"
              element={<PersonaBuilder />}
            />
            <Route path="/agency/post" element={<Post />} />
            <Route
              path="/agency/employee/dashboard"
              element={<AgencyDashboard />}
            />
            <Route path="/agency/questionnaires" element={<Questionnaires />} />
            <Route
              path="/agency/questionnaires/templates"
              element={<Questionnaires />}
            />
            <Route
              path="/agency/questionnaires/assignments"
              element={<Questionnaires />}
            />
            <Route
              path="/agency/questionnaires/responses"
              element={<Questionnaires />}
            />
            <Route
              path="/agency/questionnaires/analytics"
              element={<Questionnaires />}
            />
            <Route
              path="/agency/dashboard/profile/:agencyName"
              element={<AgencyProfile />}
            />
            <Route
              path="/agency/dashboard/profile/settings"
              element={<AgencySettings />}
            />
            <Route
              path="/agency/dashboard/customize"
              element={
                <Suspense fallback={<div>Loading Settings...</div>}>
                  <Settings />
                </Suspense>
              }
            />
            <Route
              path="/agency/model-view/:id"
              element={<CreatorInsightsDashboard />}
            />
            <Route path="/invoices/sent" element={<AgencyBilling />} />
            <Route
              path="/invoices/received"
              element={
                <Suspense fallback={<div>Loading Settings...</div>}>
                  <InvoiceDashboard />
                </Suspense>
              }
            />
            <Route path="/agency/voice" element={<VoiceScriptManagement />} />
          </Route>
        </Route>

        {/* My support system (employee*/}
        <Route path="/supportsystem" element={<AuthLayout />} />
      </Routes>
      <Toaster />
    </React.Fragment>
  );
}

export default App;
