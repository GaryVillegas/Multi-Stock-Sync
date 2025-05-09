import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Typography, Row, Col, Input, Button, Table, Space, Form, InputNumber, Select, Card, Divider, Spin, Alert, Grid } from 'antd';
import { SearchOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import useClientes, { ClienteAPI } from '../Hooks/ClientesVenta';
import useProductosPorEmpresa, { ProductoAPI } from '../Hooks/ProductosVenta';
import useGestionNotaVentaActual, { ItemVenta } from '../Hooks/GestionNuevaVenta';
import useBodegasPorEmpresa, { BodegaAPI } from '../Hooks/ListaBodega';
import AgregarClienteDrawer from '../components/agregarClienteDrawer';
import { client } from '../Types/clienteTypes';
import { VentaCliente } from '../Types/ventaTypes'

const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface NuevaVentaModalProps {
    clientId: string;
    venta: VentaCliente;
    visible: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
}

const NuevaVentaModal: React.FC<NuevaVentaModalProps> = ({
    clientId,
    venta,
    visible,
    onCancel,
    onSuccess
}) => {
    console.log(venta)
    const screens = useBreakpoint();
    const [drawerClienteVisible, setDrawerClienteVisible] = useState(false);
    const [textoBusquedaProducto, setTextoBusquedaProducto] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | number | null>(null);

    const { clientes, cargandoClientes, errorClientes, recargarClientes } = useClientes();
    const { bodegas, cargandoBodegas, errorBodegas } = useBodegasPorEmpresa(clientId);
    const { productos: productosDisponiblesAPI, cargandoProductos, errorProductos } = useProductosPorEmpresa(selectedWarehouseId);

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
            label: `${cliente.nombres || cliente.razon_social || 'Sin Nombre'} (${cliente.rut})`,
        })) : [];
    }, [clientes]);

    const opcionesBodegas = useMemo(() => {
        if (!bodegas) return [];
        return bodegas.map((bodega: BodegaAPI) => ({
            value: String(bodega.id),
            label: `${bodega.name} (${bodega.location || 'Sin Ubicación'})`,
        }));
    }, [bodegas]);

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
                title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', width: screens.sm ? 120 : 80,
                render: (_text: number, record: ItemVenta) => (
                    <InputNumber
                        min={1} value={record.cantidad}
                        onChange={value => actualizarCantidadItem(record.key, value)}
                    />
                ),
            },
            {
                title: 'P. Unitario', dataIndex: 'precioUnitario', key: 'precioUnitario',
                render: (text: number | null | undefined) => {
                    return `$${text?.toFixed(2) || '0.00'}`;
                }
            },
            { title: 'Total Línea', dataIndex: 'total', key: 'total', render: (text: number) => `$${text?.toFixed(2) || '0.00'}` },
            {
                title: 'Acción', key: 'accion', width: screens.sm ? 120 : 80,
                render: (_text: unknown, record: ItemVenta) => (
                    <Button icon={<DeleteOutlined />} danger onClick={() => eliminarItem(record.key)} size="small">
                        {screens.md && "Eliminar"}
                    </Button>
                ),
            },
        ];
    }, [actualizarCantidadItem, eliminarItem, screens]);

    const handleSeleccionarCliente = (valorIdCliente?: string | number | null) => {
        establecerIdCliente(valorIdCliente);
    };

    const handleSeleccionarBodega = (valorIdBodega?: string | number | null | undefined) => {
        const nuevoIdBodega = valorIdBodega === undefined ? null : valorIdBodega;
        setSelectedWarehouseId(nuevoIdBodega);
        setTextoBusquedaProducto('');
    };

    const handleClienteSuccess = (nuevoCliente: client) => {
        recargarClientes();
        if (nuevoCliente && nuevoCliente.id) {
            handleSeleccionarCliente(String(nuevoCliente.id));
        }
        setDrawerClienteVisible(false);
    };

    const handleGenerarNotaVenta = async () => {
        try {
            await generarNotaVentaFinal();
            if (onSuccess) onSuccess();
            limpiarNotaVenta();
            onCancel();
        } catch (error) {
            console.error('Error al generar nota de venta:', error);
        }
    };

    useEffect(() => {
        if (bodegas && bodegas.length === 1) {
            setSelectedWarehouseId(bodegas[0].id);
        } else if (bodegas && bodegas.length > 1) {
            if (selectedWarehouseId === null) {
                setSelectedWarehouseId(null);
            }
        } else if (bodegas && bodegas.length === 0) {
            setSelectedWarehouseId(null);
        }
    }, [bodegas, selectedWarehouseId]);

    return (
        <Modal
            title="Nueva Nota de Venta"
            visible={visible}
            onCancel={() => {
                limpiarNotaVenta();
                onCancel();
            }}
            width="90%"
            style={{ maxWidth: '1200px', top: 20 }}
            footer={null}
            destroyOnClose
        >
            {errorGuardado && (
                <Alert
                    message={`Error al guardar venta: ${errorGuardado}`}
                    type="error"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="Productos Disponibles">
                        <Title level={5}>Seleccionar Bodega</Title>
                        {cargandoBodegas ? (
                            <div style={{ textAlign: 'center' }}><Spin size="small" tip="Cargando bodegas..." /></div>
                        ) : errorBodegas ? (
                            <Typography.Text type="danger">{errorBodegas}</Typography.Text>
                        ) : !clientId ? (
                            <Typography.Text type="secondary">Selecciona una conexión para cargar bodegas.</Typography.Text>
                        ) : (
                            <Select
                                showSearch
                                placeholder="Selecciona una bodega"
                                optionFilterProp="children"
                                onChange={handleSeleccionarBodega}
                                value={selectedWarehouseId}
                                notFoundContent={'No encontrado'}
                                filterOption={(input, option) =>
                                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                                options={opcionesBodegas}
                                allowClear
                                style={{ width: '100%' }}
                                disabled={!clientId || (bodegas && bodegas.length === 0) || cargandoBodegas}
                            />
                        )}

                        <Title level={5}>Buscar y Añadir Productos</Title>
                        {errorProductos && <Typography.Text type="danger">{errorProductos}</Typography.Text>}
                        <Search
                            placeholder="Buscar producto por nombre o código"
                            onChange={(e) => setTextoBusquedaProducto(e.target.value)}
                            enterButton={<SearchOutlined />}
                            loading={cargandoProductos}
                            disabled={!selectedWarehouseId || cargandoProductos || !!errorProductos}
                        />

                        <div style={{ marginTop: '15px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '4px' }}>
                            {cargandoProductos ? (
                                <div style={{ textAlign: 'center' }}><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div>
                            ) : errorProductos ? (
                                <Typography.Text type="secondary">{errorProductos}</Typography.Text>
                            ) : !selectedWarehouseId ? (
                                <Typography.Text type="secondary">Selecciona una bodega para cargar productos.</Typography.Text>
                            ) : productosDisponiblesFiltrados.length > 0 ? (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {productosDisponiblesFiltrados.map((producto: ProductoAPI) => (
                                        <Button
                                            key={producto.id}
                                            type="text"
                                            onClick={() => agregarItem({ id: producto.id, title: producto.title, price: producto.price })}
                                            style={{ width: '100%', textAlign: 'left', padding: '5px 0' }}
                                            disabled={(producto.available_quantity || 0) <= 0 || (producto.price === undefined || producto.price === null)}
                                        >
                                            {producto.title} ({producto.available_quantity || 0} disp.) - **${parseFloat(String(producto.price))?.toFixed(2) || 'N/A'}**
                                        </Button>
                                    ))}
                                </Space>
                            ) : (
                                <Typography.Text type="secondary">No hay productos disponibles o que coincidan con la búsqueda para esta bodega.</Typography.Text>
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
                                            dropdownRender={(menu) => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '8px 0' }} />
                                                    <Button
                                                        type="text"
                                                        icon={<PlusOutlined />}
                                                        onClick={() => setDrawerClienteVisible(true)}
                                                        style={{ width: '100%', textAlign: 'left' }}
                                                    >
                                                        Crear nuevo cliente
                                                    </Button>
                                                </>
                                            )}
                                        />
                                    </Form.Item>
                                    {notaVenta.idCliente && clientes && clientes.length > 0 && (() => {
                                        const clienteSel = clientes.find((c: ClienteAPI) => String(c.id) === String(notaVenta.idCliente));
                                        return clienteSel ? (
                                            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                                                <Typography.Text strong>Cliente Seleccionado:</Typography.Text><br />
                                                <Typography.Text>{clienteSel.nombres || clienteSel.razon_social}</Typography.Text><br />
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
                                    <Typography.Text>Subtotal: ${subtotal.toFixed(2)}</Typography.Text>
                                    <Divider />
                                    <Title level={4}>Total: ${total.toFixed(2)}</Title>
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
                                        onClick={handleGenerarNotaVenta}
                                        style={{ width: '100%' }}
                                        loading={cargandoGuardado}
                                        disabled={notaVenta.items.length === 0 || cargandoGuardado}
                                    >
                                        Generar Nota de Venta
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <AgregarClienteDrawer
                visible={drawerClienteVisible}
                onClose={() => setDrawerClienteVisible(false)}
                onSuccess={handleClienteSuccess}
                //companyId={clienteId}
            />
        </Modal>
    );
};

export default NuevaVentaModal;