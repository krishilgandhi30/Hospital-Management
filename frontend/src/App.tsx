/**
 * Main App Component
 * Entry point for the React application
 */

import React from "react";
import "./globals.css";
import { AppRoutes } from "./routes/AppRoutes";

const App: React.FC = () => {
  return <AppRoutes />;
};

export default App;
