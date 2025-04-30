import React from "react";
import { Table, Spin, Alert, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import useObtenerEnviosHoy from "../Hooks/EnviosdeHoy";

interface TableShipmentData {
    id: string;
    title: string;
    quantity: number;
    receiver_name: string;
    direction: string;
    scheduled_date: string;
    order_id: string;
}


const EnviosDia: React.FC = () => {

  const {
    data: enviosHoy,
    loading,
    error,
  } = useObtenerEnviosHoy();


  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    console.log(
      `Intentando actualizar estado del ítem de envío ${itemId} a ${newStatus}`
    );
    alert(
      `Funcionalidad de actualizar estado no implementada en backend (o endpoint no proporcionado). Intentando actualizar ítem ${itemId} a "${newStatus}".`
    );
  };

  const columns: ColumnsType<TableShipmentData> = [
    { title: "ID Ítem", dataIndex: "id", key: "id" },
    { title: "Título Producto", dataIndex: "title", key: "title" },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity" },

    { title: "Receptor", dataIndex: "receiver_name", key: "receiver_name" },
    { title: "Dirección", dataIndex: "direction", key: "direction" },
    { title: "Order ID", dataIndex: "order_id", key: "order_id" },

    {
      title: "Fecha Límite Despacho",
      dataIndex: "scheduled_date",
      key: "scheduled_date",
      render: (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        const date = dayjs(dateString);
        return date.isValid()
          ? date.format("YYYY-MM-DD HH:mm")
          : "Fecha inválida";
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_text: any, record: TableShipmentData) => (
        <Select
           defaultValue="pendiente"
           style={{ width: 150 }}
           onChange={(value) => handleUpdateStatus(record.id, value)}
        >
           <Select.Option value="pendiente">Pendiente</Select.Option>{" "}
           <Select.Option value="ready_to_ship">Listo para enviar</Select.Option>{" "}
           <Select.Option value="shipped">Enviado</Select.Option>
           <Select.Option value="delivered">Entregado</Select.Option>
           <Select.Option value="cancelled">Cancelado</Select.Option>{" "}
        </Select>
      ),
    },
  ];

  const tableDataSource: TableShipmentData[] = enviosHoy.map(item => ({
      id: item.id,
      title: item.product,
      quantity: item.quantity,
      receiver_name: item.receiver_name,
      direction: item.direction,
      scheduled_date: item.estimated_handling_limit,
      order_id: item.order_id,
  }));


  return loading ? (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <Spin tip="Cargando envíos con límite de despacho para hoy..." size="large" />{" "}
    </div>
  ) : error ? (
    <div style={{ marginTop: "20px" }}>
      {" "}
      <Alert type="error" message={`Error al cargar envíos: ${error}`} />{" "}
    </div>
  ) : (
    <div>
      <h2>Envíos con Límite de Despacho Hoy ({dayjs().format("YYYY-MM-DD")})</h2>{" "}
      {tableDataSource.length === 0 ? (
        <Alert type="info" message="No hay envíos con límite de despacho programados para hoy." />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tableDataSource}
          pagination={false}
        />
      )}{" "}
    </div>
  );
};

export default EnviosDia;