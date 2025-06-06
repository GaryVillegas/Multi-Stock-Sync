import React, { useMemo } from "react";
import { Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import NuevaVenta from "./Views/NuevaVenta";
import ListaVentas from "./Views/ListaVentas";
import ListaBorradores from "./Views/borradores"; 
import ListaClientes from "./Views/ListaClientes";
import EmitirDocumento from "./Views/EmitirDocumento";
import ListaDocumentosEmitidos from "./Views/ListaDocumentosEmitidos"
const { Title } = Typography;

const GestionVenta: React.FC = () => {
  const selectedCompanyId = useMemo(() => {
    try {
      const conexionData = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}");
      const id = conexionData?.client_id;
      return (typeof id === "number" || typeof id === "string") && String(id).length > 0 ? id : null;
    } catch (e) {
      console.error("Error al parsear conexionSeleccionada de localStorage", e);
      return null;
    }
  }, []);

  const items: TabsProps["items"] = [
    {
      key: "nueva-venta",
      label: "Nueva Venta",
      children: <NuevaVenta companyId={selectedCompanyId} />,
    },
    {
      key: "emitir-documento",
      label: "Emitir Documento",
      children: <EmitirDocumento companyId={selectedCompanyId} />,
    },
    {
        key: "documentos-emitidos", 
        label: "Documentos Emitidos", 
        children: <ListaDocumentosEmitidos companyId={selectedCompanyId} />, 
    },
    
    {
      key: "historial-ventas",
      label: "Historial de Ventas",
      children: <ListaVentas />,
    },
    {
      key: "borradores",
      label: "Borradores",
      children: <ListaBorradores />, 
    },
    {
      key: "clientes",
      label: "Clientes",
      children: <ListaClientes />,
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2} style={{ marginBottom: "20px" }}>Punto de Venta</Title>
      <Tabs defaultActiveKey="nueva-venta" items={items} />
    </div>
  );
};

export default GestionVenta;
