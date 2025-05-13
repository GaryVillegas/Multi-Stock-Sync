import React, { useEffect, useState } from "react";
import { Card, Button, List, message, Typography, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

const SeleccionConexion: React.FC = () => {
  const navigate = useNavigate();
  const [conexiones, setConexiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🧪 TOKEN ENCONTRADO:", token);

    if (!token) {
      navigate("/login");
      return;
    }

    const conexionSeleccionada = localStorage.getItem("conexionSeleccionada");

try {
  const parsed = JSON.parse(conexionSeleccionada || "null");

  // Siempre limpiar para forzar selección manual después de login
  if (parsed && parsed.client_id) {
    console.log("ℹ️ Limpieza de conexión previa para forzar nueva selección");
    localStorage.removeItem("conexionSeleccionada");
  }
} catch {
  localStorage.removeItem("conexionSeleccionada");
}
    if (!conexionSeleccionada) {
      message.warning("⚠️ Debes seleccionar una conexión antes de continuar.");
    }


    async function fetchConexiones() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/mercadolibre/conexionToken`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const conexionesCrudas = response.data;
        let algunaConValida = false;

        const conexionesActualizadas = await Promise.all(
          conexionesCrudas.map(async (conexion: any) => {
            try {
              const refreshResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/mercadolibre/test-connection/${conexion.client_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              const esValida = refreshResponse.data.status === "success";

              if (refreshResponse.data.message?.includes("refrescar")) {
                message.info(`🔄 Token actualizado para ${conexion.nickname}`);
              }

              if (esValida) algunaConValida = true;

              return {
                ...conexion,
                tokenVigente: esValida,
              };
            } catch (e) {
              console.warn(`⚠️ Falló la conexión para ${conexion.nickname}`);
              return { ...conexion, tokenVigente: false };
            }
          })
        );

        setConexiones(conexionesActualizadas);

        if (!algunaConValida) {
          message.warning("⚠️ Todas las conexiones tienen el token vencido. Debes volver a iniciar sesión en Mercado Libre.");
        }
      } catch (error) {
        console.error("❌ Error al cargar conexiones:", error);
        message.error("Error al cargar las conexiones.");
      } finally {
        setLoading(false);
      }
    }

    fetchConexiones();
  }, []);

  const handleSeleccion = (conexion: any) => {
    if (conexion.tokenVigente) {
      localStorage.setItem("conexionSeleccionada", JSON.stringify(conexion));
      message.success(`Conexión seleccionada: ${conexion.nickname}`);
      navigate("/sync/home");
    } else {
      message.error("No puedes seleccionar una conexión con el token vencido.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Title level={2} style={{ textAlign: "center" }}>
        Selecciona la tienda para trabajar
      </Title>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={conexiones}
        renderItem={(conexion) => (
          <List.Item>
            <Card
              title={conexion.nickname}
              bordered
              actions={[
                <Button
                  type="primary"
                  disabled={!conexion.tokenVigente}
                  onClick={() => handleSeleccion(conexion)}
                >
                  {conexion.tokenVigente ? "Seleccionar" : "Token vencido"}
                </Button>,
              ]}
            >
              <p>
                <Text strong>Email:</Text> {conexion.email}
              </p>
              <p>
                <Text strong>Estado del Token:</Text>{" "}
                <Text type={conexion.tokenVigente ? "success" : "danger"}>
                  {conexion.tokenVigente ? "Vigente" : "Vencido"}
                </Text>
              </p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default SeleccionConexion;
