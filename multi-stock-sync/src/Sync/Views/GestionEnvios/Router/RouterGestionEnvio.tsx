import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GestionEnvios from "../GestionEnvios";

const RouterGestionEnvio: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GestionEnvios />} />
      <Route path="*" element={<Navigate to="/sync/envios" />} />
    </Routes>
  );
};

export default RouterGestionEnvio;
