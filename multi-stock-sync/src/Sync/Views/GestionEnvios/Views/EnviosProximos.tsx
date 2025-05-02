import React, { useEffect, useState } from "react";
import { Table, Spin, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Envio {
  id: string;
  title: string;
  quantity: number;
  size: string;
  sku: string;
  shipment_history: {
    status: string;
    date_created?: string;
  };
}

const EnviosProximos: React.FC = () => {
  const [data, setData] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvios = async () => {
    setLoading(true);
    setError(null);
    const clientId = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}")?.client_id;

    if (!clientId) {
      setError("No hay conexión seleccionada.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mercadolibre/products-to-dispatch/${clientId}`);
      const result = await res.json();

      if (result.status === "success") {
        const today = dayjs();
        const proximos = result.data.filter((item: any) => {
          const fecha = dayjs(item.shipment_history?.date_created);
          return fecha.isAfter(today, "day");
        });

        setData(proximos);
      } else {
        setError(result.message || "Error desconocido.");
      }
    } catch (err: any) {
      setError(err.message || "Error de red.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  const columns: ColumnsType<Envio> = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Título", dataIndex: "title", key: "title" },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Tamaño", dataIndex: "size", key: "size" },
    {
      title: "Estado",
      dataIndex: ["shipment_history", "status"],
      key: "estado",
    },
  ];

  return loading ? (
    <Spin tip="Cargando..." />
  ) : error ? (
    <Alert type="error" message={error} />
  ) : (
    <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
  );
};

export default EnviosProximos;
