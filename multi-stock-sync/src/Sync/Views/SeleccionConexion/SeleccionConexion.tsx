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
    async function fetchConexiones() {
      try {
        const token = localStorage.getItem("token");
        console.log("🧪 TOKEN ENCONTRADO:", token);

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/mercadolibre/conexionToken`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const conexionesCrudas = response.data;

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

              if (refreshResponse.data.status === "success") {
                return {
                  ...conexion,
                  tokenVigente: true,
                };
              } else {
                return {
                  ...conexion,
                  tokenVigente: false,
                };
              }
            } catch (e) {
              console.warn(`⚠️ Falló la conexión para ${conexion.nickname}`);
              return {
                ...conexion,
                tokenVigente: false,
              };
            }
          })
        );

        setConexiones(conexionesActualizadas);
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
                  Seleccionar
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
