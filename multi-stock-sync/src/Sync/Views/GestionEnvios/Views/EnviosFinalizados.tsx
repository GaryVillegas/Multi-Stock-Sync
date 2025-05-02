import React, { useState } from "react";
import { Table, Spin, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import 'dayjs/locale/es';
dayjs.locale('es');

import useObtenerEnviosPorCliente from "../Hooks/EnviosporCliente";
import useObtenerDetallesEnvio, { ShipmentDetails } from "../Hooks/DetallesEnvio";


interface Envio {
    id: string;
    order_id: string; 
    title: string;
    quantity: number;
    size: string;
    sku: string;
    shipment_history: {
        status: string; 
        date_created?: string;
    };

}


const ShipmentSpecificDetailsLoader: React.FC<{ orderId: string }> = ({ orderId }) => {
    // details ahora usa la nueva interfaz
    const { details, loadingDetails, errorDetails }: { details: ShipmentDetails | null, loadingDetails: boolean, errorDetails: string | null } = useObtenerDetallesEnvio(orderId);

    if (loadingDetails) {
        return <Spin size="small" />;
    }
    if (errorDetails) {
        return <span style={{ color: 'red' }}>Error: {errorDetails}</span>;
    }

    if (!details || !details.receptor || !details.receptor.receiver_name || !details.status_history || !details.status_history.date_shipped) {
         return <span>Datos incompletos</span>;
    }
    const receiver = details.receptor.receiver_name;

    const rawDate = details.status_history.date_shipped;
    // Formatear la fecha obtenida
    const formattedDate = rawDate ? (dayjs(rawDate).isValid() ? dayjs(rawDate).format('YYYY-MM-DD HH:mm') : 'Fecha inválida') : 'N/A';

    return (
        <div>
             Fecha: {formattedDate}<br/>
             Recibido: {receiver}
        </div>
    );
};


const EnviosFinalizados: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const { data: allShipments, loading, error, totalItems } = useObtenerEnviosPorCliente(currentPage, pageSize);

    const enviosFinalizados = allShipments.filter((item: Envio) =>
        item.shipment_history?.status?.toLowerCase() === "entregado"
    );

    const columns: ColumnsType<Envio> = [
        { title: "ID Producto", dataIndex: "id", key: "id" },
        { title: "Título", dataIndex: "title", key: "title" },
        { title: "SKU", dataIndex: "sku", key: "sku" },
        { title: "Cantidad", dataIndex: "quantity", key: "quantity" },
        { title: "Tamaño", dataIndex: "size", key: "size" },
        {
            title: "Estado de Envío",
            dataIndex: ["shipment_history", "status"],
            key: "estado",
        },
         {
             title: "Detalles Entrega",
             key: "detallesEntrega",
             render: (_text: any, record: Envio) => {
                 if (record.shipment_history?.status?.toLowerCase() === "entregado") {
                    // order_id ahora viene del shipping_id
                    if (record.order_id) {
                         return <ShipmentSpecificDetailsLoader orderId={record.order_id} />;
                    } else {
                         // Esto solo debería ocurrir si el primer endpoint no retornó shipping_id
                         return 'ID de envío no disponible';
                    }
                 }
                 return 'No aplica';
             }
         },
    ];

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
    };

    return (
        <div>
            <h3>Pedidos Finalizados</h3>
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Spin tip="Cargando envíos finalizados..." size="large" />
                </div>
            ) : error ? (
                <div style={{ marginTop: '20px' }}>
                    <Alert type="error" message={`Error al cargar envíos: ${error}`} />
                </div>
            ) : (
                <>
                    {enviosFinalizados.length === 0 ? (
                        <Alert type="info" message="No hay envíos finalizados para mostrar." />
                    ) : (
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={enviosFinalizados}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalItems,
                                showSizeChanger: false,
                                showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} de ${total} ítems`,
                            }}
                            onChange={handleTableChange}
                        />
                    )}
                    {enviosFinalizados.length === 0 && totalItems > 0 && !loading && !error && (
                         <Alert type="warning" message="No hay envíos 'entregado' en esta página." />
                    )}
                </>
            )}
        </div>
    );
};

export default EnviosFinalizados;