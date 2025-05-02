import React, { useEffect, useState } from "react";
import { Table, Spin, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";

interface Envio {
  id: string;
  title: string;
  quantity: number;
  size: string;
  sku: string;
  shipment_history: {
    status: string;
    date?: string;
  };
}

const EnviosTransito: React.FC = () => {
  const [data, setData] = useState<Envio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvios = async () => {
    setLoading(true);
    setError(null);

    const conexionSeleccionada = localStorage.getItem("conexionSeleccionada");
    const clientId = conexionSeleccionada ? JSON.parse(conexionSeleccionada).client_id : null;

    if (!clientId) {
      setError("No se encontró el client_id en la conexión seleccionada.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mercadolibre/products-to-dispatch/${clientId}`);
      const result = await res.json();

      if (result.status === "success") {
        const transito = result.data.filter((item: any) =>
          item.shipment_history?.status?.toLowerCase() === "enviado"
        );
        setData(transito);
      } else {
        setError(result.message || "Error desconocido al cargar los envíos.");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  const columns: ColumnsType<Envio> = [
    {
      title: "ID Producto",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Tamaño",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Estado de Envío",
      dataIndex: ["shipment_history", "status"],
      key: "estado",
    },
  ];

  return (
    <div>
      <h3>Envíos en Tránsito</h3>
      {loading ? (
        <Spin tip="Cargando envíos..." />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      )}
    </div>
  );
};

export default EnviosTransito;
