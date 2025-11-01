import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Departments from "./pages/Departments";
import Scheduling from "./pages/Scheduling";
import Profile from "./pages/Profile";
import BonusManagement from "./pages/BonusManagement";
import RedemptionSuccess from "./pages/RedemptionSuccess";
import VerifyRedemption from "./pages/VerifyRedemption";
import AuthRedirect from "./pages/AuthRedirect";
import UserManagement from "./pages/UserManagement";
import ChangePassword from "./pages/ChangePassword";
import BadgeManagement from "./pages/BadgeManagement";
import EngagementManagement from "./pages/EngagementManagement";

import Shop from "./pages/Shop";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />

      <Route path={"/auth-redirect"} component={AuthRedirect} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/bonus"} component={BonusManagement} />
      <Route path={"/departments"} component={Departments} />
      <Route path={"/scheduling"} component={Scheduling} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/redemption/success/:code"} component={RedemptionSuccess} />
      <Route path={"/verify"} component={VerifyRedemption} />
      <Route path={"/change-password"} component={ChangePassword} />
      <Route path={"/badges"} component={BadgeManagement} />
      <Route path={"/engagements"} component={EngagementManagement} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
