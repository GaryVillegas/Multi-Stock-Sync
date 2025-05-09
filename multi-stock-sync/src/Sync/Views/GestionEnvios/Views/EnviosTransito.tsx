import React from "react";
import { Table, Alert,Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Enviostransito } from "../Types/EnviosProximos.Type";
import { useEnviosTransito } from "../Hooks/useEnviosTransito";
import { LoadingDinamico } from "../../../../components/LoadingDinamico/LoadingDinamico";




/**
 * devuelve la severidad del error a la de alerta de Antd
 */
const getAlertType = (severity: string) => {
  switch(severity) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    default: return 'info';
  }
};


const EnviosProximos: React.FC = () => {
  
  // Utilizamos el hook personalizado para obtener los datos y estado
  const { data, loading, error, clearError } = useEnviosTransito();
  

  if (loading) {
    return <LoadingDinamico variant="fullScreen" />;
  }
  const columns: ColumnsType<Enviostransito> = [
    { 
      title: "Id envio", 
      dataIndex: "shipping_id", 
      key: "id",
      sorter: (a, b) => a.shipping_id.localeCompare(b.shipping_id)
    },
    { 
      title: "Id producto", 
      dataIndex: "productId", 
      key: "id",
      sorter: (a, b) => a.productId.localeCompare(b.productId)
    },
    { 
      title: "Título", 
      dataIndex: "title", 
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title)
    },
    { 
      title: "Cantidad", 
      dataIndex: "quantity", 
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity
    },
    { 
      title: "Tamaño", 
      dataIndex: "size", 
      key: "size",
      sorter: (a, b) => {
        // Handle empty values
        if (!a.size && !b.size) return 0;
        if (!a.size) return -1;
        if (!b.size) return 1;
        return a.size.localeCompare(b.size);
      }
    },
    {
      title: "Dirección",
      dataIndex: ["receptor", "dirrection"],
      key: "direccion",
      sorter: (a, b) => {
        // Check if receptor exists
        if (!a.receptor && !b.receptor) return 0;
        if (!a.receptor) return -1;
        if (!b.receptor) return 1;
        
        // Compare direction
        return a.receptor.dirrection.localeCompare(b.receptor.dirrection);
      }
    },
    {
      title: "N° Seguimiento",
      dataIndex: "tracking_number",
      key: "tracking_number",
      sorter: (a, b) => {
        // Handle empty tracking numbers
        if (!a.tracking_number && !b.tracking_number) return 0;
        if (!a.tracking_number) return -1;
        if (!b.tracking_number) return 1;
        return a.tracking_number.localeCompare(b.tracking_number);
      }
    },
    {
      title: "Estado",
      dataIndex: "substatus",
      key: "status",
      sorter: (a, b) => {
        // Handle null values
        if (!a.substatus && !b.substatus) return 0;
        if (!a.substatus) return -1;
        if (!b.substatus) return 1;
        return a.substatus.localeCompare(b.substatus);
      },
      render: (substatus: string) => {
        // Convertir "out of delivery" a "Enviado"
        const displayText = substatus === "out_for_delivery" ? "Enviado" : "Por enviar hoy";
        
        // Opcional: agregar colores según el estado
        let tagColor = '';
        if (substatus === "out_for_delivery") tagColor = 'blue';
        if (substatus === null || substatus === "soon_deliver") tagColor = 'red';
        
        return tagColor ? (
          <Tag color={tagColor}>{displayText}</Tag>
        ) : (
          <span>{displayText}</span>
        );
      }
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Muestra alerta de error si existe */}
      {error && (
        <Alert
          message={error.message}
          type={getAlertType(error.severity)}
          showIcon
          closable
          onClose={clearError}
          action={
            // Para errores de servidor, ofrece botón de recarga de página
            error.type === 'server' && (
              <Button size="small" type="primary" onClick={() => window.location.reload()}>
                Recargar
              </Button>
            )
          }
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Tabla de envíos próximos */}
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: error ? 'No se pudieron cargar los datos' : 'No hay envíos en transito'
        }}
      />
      
     
    </div>
  );
  
};

export default EnviosProximos;