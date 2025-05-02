import React, { useState, useMemo } from 'react';
import {Typography,Row,Col,Input,Button,Table,Space,Form,InputNumber,Select, Card,Divider,Spin,Alert,Grid} from 'antd';
import { SearchOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import useClientes, { ClienteAPI } from '../Hooks/ClientesVenta'; 
import useProductosPorEmpresa, { ProductoAPI } from '../Hooks/ProductosVenta'; 
import useGestionNotaVentaActual, { ItemVenta } from '../Hooks/GestionNuevaVenta';
const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;
interface NuevaVentaProps {
  companyId: string | number | null; // Prop para recibir el ID de la empresa
}
const NuevaVenta: React.FC<NuevaVentaProps> = ({ companyId }) => {
  const screens = useBreakpoint();
  const [textoBusquedaProducto, setTextoBusquedaProducto] = useState('');
  const { clientes, cargandoClientes, errorClientes } = useClientes(); // Llamada sin parámetro
  const { productos: productosDisponiblesAPI, cargandoProductos, errorProductos } = useProductosPorEmpresa(companyId); // Pasar companyId aquí
  const {
    notaVenta,
    subtotal,
    total,
    cargandoGuardado,
    errorGuardado,
    agregarItem,
    actualizarCantidadItem,
    eliminarItem,
    establecerIdCliente,
    establecerObservaciones,
    guardarBorrador,
    generarNotaVentaFinal,
    limpiarNotaVenta,
  } = useGestionNotaVentaActual();
  const opcionesClientes = useMemo(() => {
    return clientes ? clientes.map((cliente: ClienteAPI) => ({
      value: String(cliente.id),
      label: `${cliente.nombre || cliente.razon_social || 'Sin Nombre'} (${cliente.rut})`,
    })) : [];
  }, [clientes]);
  const productosDisponiblesFiltrados = useMemo(() => {
    if (!productosDisponiblesAPI) return [];
    return productosDisponiblesAPI.filter((producto: ProductoAPI) =>
      producto.title.toLowerCase().includes(textoBusquedaProducto.toLowerCase())
    );
  }, [productosDisponiblesAPI, textoBusquedaProducto]);
  const columnasItems = useMemo(() => {
    return [
      { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
      {
        title: 'Cantidad',
        dataIndex: 'cantidad',
        key: 'cantidad',
        width: screens.sm ? 120 : 80,
        render: (_text: number, record: ItemVenta) => (
          <InputNumber
            min={1}
            value={record.cantidad}
            onChange={value => actualizarCantidadItem(record.key, value)}
          />
        ),
      },
      { title: 'P. Unitario', dataIndex: 'precioUnitario', key: 'precioUnitario', render: (text: number) => `$${text.toFixed(2)}` },
      { title: 'Total Línea', dataIndex: 'total', key: 'total', render: (text: number) => `$${text.toFixed(2)}` },
      {
        title: 'Acción',
        key: 'accion',
        width: screens.sm ? 120 : 80,
        render: (_text: any, record: ItemVenta) => (
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => eliminarItem(record.key)}
            size="small"
          >
            {screens.md && "Eliminar"}
          </Button>
        ),
      },
    ];
  }, [actualizarCantidadItem, eliminarItem, screens]);
  const handleSeleccionarCliente = (valorIdCliente?: string | number | null) => {
    establecerIdCliente(valorIdCliente);
  };
  return (
    <div style={{ padding: "20px" }}>
      <Title level={3}>Generar Nueva Nota de Venta</Title>
      {errorGuardado && <Alert message={`Error al guardar venta: ${errorGuardado}`} type="error" showIcon style={{ marginBottom: '20px' }} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Productos de la Empresa">
            <Title level={5}>Buscar y Añadir Productos</Title>
            {errorProductos && <Typography.Text type="danger">{errorProductos}</Typography.Text>}
            <Search
              placeholder="Buscar producto por nombre o código"
              onChange={(e) => setTextoBusquedaProducto(e.target.value)}
              enterButton={<SearchOutlined />}
              loading={cargandoProductos}
              disabled={!companyId || cargandoProductos || !!errorProductos}
            />
            <div style={{ marginTop: '15px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '4px' }}>
              {cargandoProductos ? (
                <div style={{ textAlign: 'center' }}><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div>
              ) : errorProductos ? (
                 <Typography.Text type="secondary">{errorProductos}</Typography.Text>
              ) : !companyId ? (
                 <Typography.Text type="secondary">La empresa no ha sido seleccionada correctamente. No se pueden cargar productos.</Typography.Text>
              ) : productosDisponiblesFiltrados.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {productosDisponiblesFiltrados.map((producto: ProductoAPI) => (
                    <Button
                      key={producto.id}
                      type="text"
                      onClick={() => agregarItem({ id: producto.id, title: producto.title, price: producto.price || 0 })}
                      style={{ width: '100%', textAlign: 'left', padding: '5px 0' }}
                      disabled={(producto.available_quantity || 0) <= 0 || (producto.price === undefined || producto.price === null)}
                    >
                      {producto.title} ({producto.available_quantity || 0} disp.) - **${producto.price?.toFixed(2) || 'N/A'}**
                    </Button>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">No hay productos disponibles o que coincidan con la búsqueda para esta empresa.</Typography.Text>
              )}
            </div>
            <Divider />
            <Title level={5}>Acceso Rápido</Title>
            <Space wrap>
              <Button icon={<PlusOutlined />} onClick={() => console.log("TODO: Agregar producto rápido")}>Prod Rápido 1</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Ítems de la Venta">
            <Table
              dataSource={notaVenta.items}
              columns={columnasItems}
              pagination={false}
              locale={{ emptyText: 'Agrega productos a la venta' }}
              rowKey="key"
              size="small"
            />
          </Card>
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} lg={12}>
              <Card title="Cliente y Observaciones">
                {errorClientes && <Typography.Text type="danger">{errorClientes}</Typography.Text>}
                <Form layout="vertical">
                  <Form.Item label="Cliente">
                    <Select
                      showSearch
                      placeholder="Selecciona o busca un cliente"
                      optionFilterProp="children"
                      onSearch={(texto) => console.log("Buscar cliente (si API soporta):", texto)}
                      onChange={handleSeleccionarCliente}
                      value={notaVenta.idCliente}
                      notFoundContent={cargandoClientes ? <Spin size="small" /> : errorClientes ? errorClientes : 'No encontrado'}
                      filterOption={(input, option) =>
                        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                      options={opcionesClientes}
                      allowClear
                      style={{ width: '100%' }}
                       disabled={cargandoClientes || !!errorClientes}
                    >
                    </Select>
                  </Form.Item>
                  {notaVenta.idCliente && clientes && clientes.length > 0 && (() => {
                    const clienteSel = clientes.find((c: ClienteAPI) => String(c.id) === String(notaVenta.idCliente));
                    return clienteSel ? (
                      <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                        <Typography.Text strong>Cliente Seleccionado:</Typography.Text><br/>
                        <Typography.Text>{clienteSel.nombre || clienteSel.razon_social}</Typography.Text><br/>
                        <Typography.Text>RUT: {clienteSel.rut}</Typography.Text>
                      </div>
                    ) : null;
                  })()}
                  <Form.Item label="Observaciones" style={{ marginTop: '15px' }}>
                    <Input.TextArea
                      rows={4}
                      value={notaVenta.observaciones}
                      onChange={(e) => establecerObservaciones(e.target.value)}
                      placeholder="Añadir observaciones sobre la venta"
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Resumen de Venta">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text>Subtotal: **${subtotal.toFixed(2)}**</Typography.Text>
                  <Divider />
                  <Title level={4}>Total: **${total.toFixed(2)}**</Title>
                  <Divider />
                  <Button
                    type="default"
                    size="large"
                    onClick={guardarBorrador}
                    style={{ width: '100%' }}
                    loading={cargandoGuardado}
                    disabled={notaVenta.items.length === 0 || cargandoGuardado}
                  >
                    Guardar Borrador
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={generarNotaVentaFinal}
                    style={{ width: '100%' }}
                    loading={cargandoGuardado}
                    disabled={notaVenta.items.length === 0 || cargandoGuardado}
                  >
                    Generar Nota de Venta
                  </Button>
                  <Button
                    type="text"
                    danger
                    size="large"
                    onClick={limpiarNotaVenta}
                    style={{ width: '100%' }}
                    disabled={notaVenta.items.length === 0 && !notaVenta.idCliente && !notaVenta.observaciones}
                  >
                    Cancelar Venta
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};
export default NuevaVenta;