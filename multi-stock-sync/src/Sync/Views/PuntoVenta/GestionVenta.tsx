import React, { useMemo } from "react";
import { Tabs, Typography, Card } from "antd";
import type { TabsProps } from "antd";
import NuevaVenta from "./Views/NuevaVenta"; // Asegúrate que la ruta sea correcta
import HistorialVentas from "./Views/HistorialVentas";
import BorradoresVenta from "./Views/BorradoresVenta";
const { Title } = Typography;
const GestionVenta: React.FC = () => {
    // Recuperar selectedCompanyId de localStorage
    const selectedCompanyId = useMemo(() => {
        try {
            const conexionData = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}");
            const id = conexionData?.client_id; // Asumiendo que 'client_id' contiene el ID de la empresa
            return (typeof id === 'number' || typeof id === 'string') && String(id).length > 0 ? id : null;
        } catch (e) {
            console.error("Error al parsear conexionSeleccionada de localStorage", e);
            return null;
        }
    }, []); // Ejecutar una vez al montar
    const items: TabsProps["items"] = [
        {
            key: "nueva-venta",
            label: "Nueva Venta",
            // Pasa selectedCompanyId como prop a NuevaVenta
            children: <NuevaVenta companyId={selectedCompanyId} />, // Pasar la prop
        },
        {
            key: "historial-ventas",
            label: "Historial de Ventas",
            children: <HistorialVentas /* Considera pasar companyId aquí también */ />,
        },
        {
            key: "borradores",
            label: "Borradores",
            children: <BorradoresVenta /* Considera pasar companyId aquí también */ />,
        },
    ];
    return (
        <div style={{ padding: "20px" }}>
            <Title level={2} style={{ marginBottom: "20px" }}>Punto de Venta</Title>
            <Card>
                <Tabs
                    defaultActiveKey="nueva-venta"
                    items={items}
                    size="large"
                />
            </Card>
        </div>
    );
};
export default GestionVenta;