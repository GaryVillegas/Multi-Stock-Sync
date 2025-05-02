import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GestionVenta from "../GestionVenta";

const RouterPuntodeVenta: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GestionVenta/>} />
      <Route path="*" element={<Navigate to="/sync/punto-de-venta" />} />
    </Routes>
  );
};

export default RouterPuntodeVenta;