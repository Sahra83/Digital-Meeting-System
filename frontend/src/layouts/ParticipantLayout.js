// src/layouts/ParticipantLayout.js
// Wrapper for participant pages that re‑uses DashboardLayout.
// Using a .js extension ensures Vite resolves the module correctly.

import React from "react";
import DashboardLayout from "./DashboardLayout";

function ParticipantLayout({ children }) {
  // Using React.createElement to avoid JSX parsing in .js files
  return React.createElement(DashboardLayout, null, children);
}

export default ParticipantLayout;
