import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Row, Col, Typography } from "antd";
import { ShoppingOutlined, ShopOutlined, CarOutlined, SettingOutlined } from "@ant-design/icons";

const { Title } = Typography;

const HomeSync: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const conexionSeleccionada = localStorage.getItem("conexionSeleccionada");
    if (!conexionSeleccionada) {
      navigate("/sync/seleccionar-conexion");
    }
  }, [navigate]);

  const modules = [
    {
      title: "Gestión de Productos",
      description: "Administra productos, stock y cargas masivas.",
      icon: <ShoppingOutlined style={{ fontSize: "40px" }} />,
      link: "/sync/productos",
    },
    {
      title: "Punto de Venta / Notas de Venta",
      description: "Genera notas de venta, facturas y administra clientes.",
      icon: <ShopOutlined style={{ fontSize: "40px" }} />,
      link: "/sync/punto-de-venta",
    },
    {
      title: "Gestión de Envíos",
      description: "Controla los pedidos, despachos y estados de envío.",
      icon: <CarOutlined style={{ fontSize: "40px" }} />,
      link: "/sync/envios",
    },
    {
      title: "Otros / Configuración",
      description: "Reportes, conexiones, ajustes del sistema y soporte.",
      icon: <SettingOutlined style={{ fontSize: "40px" }} />,
      link: "/sync/otros",
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: "2rem" }}>
        Panel de Sincronización
      </Title>

      <Row gutter={[24, 24]} justify="center">
        {modules.map((module, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Link to={module.link}>
              <Card
                hoverable
                style={{ textAlign: "center", height: "100%" }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  {module.icon}
                </div>
                <Title level={4}>{module.title}</Title>
                <p>{module.description}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeSync;
