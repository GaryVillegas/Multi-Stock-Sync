import React, { useState,  } from 'react';
import { Button, Table, Card, Typography, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AgregarClienteDrawer from '../components/agregarClienteDrawer';
import { useListCliente } from '../Hooks/useListCliente';
import { ColumnsType } from 'antd/es/table';
import { client } from '../Types/clienteTypes';
import { LoadingDinamico } from '../../../../components/LoadingDinamico/LoadingDinamico';
//mostrar mensaje

const { Title } = Typography;

const ListaClientes: React.FC = () => {
  // Estado para controlar la visibilidad del drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  //estados para obtener los clientes, el load para las pantallas de cargas, errores y la funcion de volver a recargar los datos
  const { clientes, loadCliente,errorListCliente, errorCliente,success, refetch, clearError} = useListCliente();
  // Estados para mostrar notificaciones

  // Función para abrir el drawer
  const showDrawer = () => {
    setDrawerVisible(true);
  };

  // Función para mostrar notificaciones
  

  // Función para cerrar el drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  // Función que se ejecuta cuando se registra un cliente exitosamente
  const handleClienteRegistrado = () => {
    refetch();
    handleCloseDrawer(); // Cerrar el drawer después de registrar exitosamente
  };

  // Manejo de error en la carga de datos

  if (loadCliente) {
    return <LoadingDinamico variant="fullScreen" />;
  }

  // Columnas para la tabla de clientes
  const columns: ColumnsType<client> = [
    {
      title: "Nombre",
      dataIndex: "nombres",
      key: "nombres",
    },
    {
      title: "Tipo",
      key: "tipo_cliente_id",
      dataIndex: "tipo_cliente_id",
      render: (tipo: number) => (
        <span>{tipo === 2 ? "Persona Natural" : "Empresa"}</span>
      ),
    },
    {
      title: "RUT",
      dataIndex: "rut",
      key: "rut",
    },
    {
      title: "Razon social",
      dataIndex: "razon_social",
      key: "razon_social",
      render: (razonS: string, record: client) => (
        <span>
          {record.tipo_cliente_id === 2 ||
          razonS === null ||
          razonS === "" ||
          razonS === undefined
            ? "No aplica"
            : razonS}
        </span>
      ),
    },
    {
      title: "Giro",
      dataIndex: "giro",
      key: "giro",
      render: (giro: string, record: client) => (
        <span>
          {record.tipo_cliente_id === 2 ||
          giro === null ||
          giro === "" ||
          giro === undefined
            ? "No aplica"
            : giro}
        </span>
      ),
    },
  ];

  return (
    <Card>
      {/* Mostrar mensaje de éxito si existe */}
  {success && (
    <Alert
      message="Cliente registrado correctamente"
      type="success"
      showIcon
      closable
      onClose={clearError} // O una función específica para limpiar el éxito, si es necesario
      style={{ marginBottom: "20px" }}
    />
  )}

  {/* Mostrar mensaje de error si existe (errorCliente o errorListCliente) */}
  {(errorCliente || errorListCliente) && (
    <Alert
      message={errorCliente || (errorListCliente && errorListCliente.message)}
      type="error"
      showIcon
      closable
      onClose={clearError}
      action={
        // Para errores de servidor, ofrece botón de recarga
        (errorListCliente && errorListCliente.type === "server") && (
          <Button
            size="small"
            type="primary"
            onClick={() => window.location.reload()}
          >
            Recargar
          </Button>
        )
      }
      style={{ marginBottom: "20px" }}
    />
  )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4}>Lista de Clientes</Title>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showDrawer}
            disabled={loadCliente}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={clientes}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: "No hay clientes registrados",
        }}
      />

      <AgregarClienteDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        onSuccess={handleClienteRegistrado}
      />
    </Card>
  );
};

export default ListaClientes;