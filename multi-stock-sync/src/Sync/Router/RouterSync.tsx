import { Navigate, Route, Routes } from "react-router-dom";
import LayoutSync from "../Layout/LayoutSync";
import RouterProductos from "../Views/Productos/Router/RouterProducto";
import RouterBodegas from "../Views/Bodegas/Router/RouterBodega";
import RouterConexiones from "../Views/Conexiones/Router/RouterConexiones";
import RouterReportes from "../Views/Reportes/Router/RouterReportes";
import RouterCompania from "../Views/Compania/Router/RouterCompania";
import Info from "../Views/Info/Info";
import HomeSync from "../Views/Home/HomeSync";
import About from "../Views/About/About";
import { Login } from "../../Auth/Pages";
import Register from "../../Auth/Pages/Register";
import Logout from "../../Auth/Pages/Logout";
import SeleccionConexion from "../Views/SeleccionConexion/SeleccionConexion";
import GestionEnvios from "../Views/GestionEnvios/GestionEnvios"; // ✅ Nuevo
import RouterGestionEnvio from "../Views/GestionEnvios/Router/RouterGestionEnvio";
import RouterPuntodeVenta from "../Views/PuntoVenta/Router/RouterPuntodeVenta"

function RouterSync() {
  return (
    <LayoutSync>
      <Routes>
        <Route path="/conexiones/*" element={<RouterConexiones />} />
        <Route path="/home" element={<HomeSync />} />
        <Route path="/productos/*" element={<RouterProductos />} />
        <Route path="/companias/*" element={<RouterCompania />} />
        <Route path="/bodegas/*" element={<RouterBodegas />} />
        <Route path="/reportes/*" element={<RouterReportes />} />
        <Route path="/info" element={<Info />} />

        {/* 👇 Nuevo módulo de envíos */}
        <Route path="/envios" element={<GestionEnvios />} />
        {/* 👇 Nuevo módulo de Punto de Venta */}
        <Route path="/punto-de-venta/*" element={<RouterPuntodeVenta />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/about" element={<About />} />
        <Route path="/seleccionar-conexion" element={<SeleccionConexion />} />
        <Route path="/envios/*" element={<RouterGestionEnvio />} />


        <Route path="/*" element={<Navigate to="/sync/home" />} />
      </Routes>
    </LayoutSync>
  );
}

export default RouterSync;
