import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../../../axiosConfig";
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Space,
  Typography,
  Select,
  Input,
  Row,
  Col,
  Spin,
  Empty,
  Tag,
  Tooltip,
  DatePicker,
  Descriptions,
  List,
  Alert
} from "antd";
import {
  InfoCircleOutlined,
  HistoryOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  BoxPlotOutlined
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import styles from "./HistorialStock.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Interfaces
interface SalesHistory {
  date: string;
  quantity: number;
}
interface Detail {
  name: string;
  value_name: string;
}
interface HistorialStock {
  id: string;
  title: string;
  available_quantity: number;
  stock_reload_date: string;
  purchase_sale_date: string;
  history: SalesHistory[];
  sku: string;
  details?: Detail[];
}
interface Connection {
  client_id: string;
  nickname: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ReporteHistorialStock: React.FC = () => {
  // Estados
  const [historialStock, setHistorialStock] = useState<HistorialStock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | undefined>(undefined);
  const [userData, setUserData] = useState<{ nickname: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<HistorialStock | null>(null);
  const [viewMode, setViewMode] = useState<"details" | "history">("details");
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [salesHistoryCache, setSalesHistoryCache] = useState<Map<string, SalesHistory[]>>(new Map());

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/mercadolibre/credentials`);
        console.log("Respuesta de /credentials:", response.data);

        if (!Array.isArray(response.data.data)) {
          console.error("La respuesta de la API no contiene un array en la propiedad 'data'.", response.data);
          setError("Error: formato de respuesta inesperado desde el servidor.");
          setConnections([]);
          return;
        }
        const allConnections = response.data.data;
        console.log("Todas las conexiones encontradas (sin filtrar):", allConnections);
        setConnections(allConnections);

        if (allConnections.length > 0) {
          setSelectedConnection(allConnections[0].client_id);
          setError(null);
        } else {
          setError("No se encontraron conexiones. Por favor, agrega una tienda en la configuración.");
        }
      } catch (err: any) {
        console.error("Error completo al cargar las conexiones:", err);
        setError(err.response?.data?.message || 'Error grave al cargar las conexiones desde el servidor.');
        setConnections([]);
      }
    };
    fetchConnections();
  }, []);

  // Funcion para procesar los datos
  const processStockData = useCallback((data: any[]): HistorialStock[] => {
    return data.map(item => ({
      id: item.id || `no-id-${Math.random()}`,
      title: item.title || "Sin título",
      available_quantity: item.available_quantity || 0,
      stock_reload_date: item.stock_reload_date || new Date().toISOString(),
      purchase_sale_date: item.purchase_sale_date || new Date().toISOString(),
      history: [],
      sku: item.sku || "Sin SKU",
      details: item.details || [],
    }));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedConnection) {
      setHistorialStock([]);
      setError("Por favor, selecciona una conexión para comenzar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [stockResponse, userResponse] = await Promise.all([
        axiosInstance.get(`${API_BASE_URL}/mercadolibre/stock/${selectedConnection}`),
        axiosInstance.get(`${API_BASE_URL}/mercadolibre/credentials/${selectedConnection}`),
      ]);

      const rawData = stockResponse.data.data;
      if (!Array.isArray(rawData) || rawData.length === 0) {
        setHistorialStock([]);
        setError("No se encontró historial de stock para esta conexión. Puede que no haya productos o ventas registradas.");
      } else {
        const stockData = processStockData(rawData);
        setHistorialStock(stockData);
      }

      setUserData(userResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar los datos de stock.");
      setHistorialStock([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConnection, processStockData]);

  useEffect(() => {
    if (selectedConnection) {
      fetchData();
    }
  }, [selectedConnection, fetchData]);

  const fetchSalesHistory = useCallback(async (clientId: string, productId: string) => {
    const cacheKey = `${clientId}-${productId}`;
    if (salesHistoryCache.has(cacheKey)) return salesHistoryCache.get(cacheKey)!;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/mercadolibre/stock-sales-history/${clientId}/${productId}`);
      const salesHistory = response.data.sales || [];
      setSalesHistoryCache(prev => new Map(prev).set(cacheKey, salesHistory));
      return salesHistory;
    } catch (err: any) {
      setHistoryError(err.response?.data?.message || "Error al cargar historial.");
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, [salesHistoryCache]);

  const handleViewDetails = async (product: HistorialStock, mode: "details" | "history") => {
    setSelectedProduct(product);
    setViewMode(mode);
    setIsModalVisible(true);
    if (mode === "history" && selectedConnection) {
      const history = await fetchSalesHistory(selectedConnection, product.id);
      setSelectedProduct(prev => prev ? { ...prev, history } : null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateRange(null);
  };

  // Filtro de busqueda
  const filteredData = useMemo(() => {
    return historialStock.filter(item => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(lowerSearchTerm) ||
        item.sku.toLowerCase().includes(lowerSearchTerm) ||
        item.id.toLowerCase().includes(lowerSearchTerm);

      const matchesDate = !dateRange || (
        new Date(item.purchase_sale_date) >= new Date(dateRange[0]) &&
        new Date(item.purchase_sale_date) <= new Date(dateRange[1])
      );

      return matchesSearch && matchesDate;
    });
  }, [historialStock, searchTerm, dateRange]);

  // Funcion de exportación a Excel
  const exportToExcel = () => {
    const dataToExport = filteredData.map(p => ({
      'SKU': p.sku,
      'Producto': p.title,
      'ID Publicación': p.id,
      'Cantidad Disponible': p.available_quantity,
      'Última Venta': new Date(p.purchase_sale_date).toLocaleDateString('es-CL'),
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HistorialStock");
    XLSX.writeFile(wb, `Historial_Stock_${userData?.nickname || 'usuario'}.xlsx`);
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Historial de Stock - ${userData?.nickname || 'usuario'}`, 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['SKU', 'Producto', 'Cantidad', 'Última Venta']],
      body: filteredData.map(p => [
        p.sku,
        p.title,
        p.available_quantity,
        new Date(p.purchase_sale_date).toLocaleDateString('es-CL')
      ]),
    });
    doc.save(`Historial_Stock_${userData?.nickname || 'usuario'}.pdf`);
  };

  // Lógica de la tabla
  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', sorter: (a: HistorialStock, b: HistorialStock) => a.sku.localeCompare(b.sku) },
    {
      title: 'Producto',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: HistorialStock, b: HistorialStock) => a.title.localeCompare(b.title),
      render: (text: string) => <Text style={{ fontWeight: 500 }}>{text}</Text>
    },
    {
      title: 'Cantidad',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      sorter: (a: HistorialStock, b: HistorialStock) => a.available_quantity - b.available_quantity,
      render: (qty: number) => <Tag color={qty > 10 ? 'green' : qty > 0 ? 'orange' : 'red'}>{qty}</Tag>
    },
    {
      title: 'Última Venta',
      dataIndex: 'purchase_sale_date',
      key: 'purchase_sale_date',
      render: (date: string) => new Date(date).toLocaleDateString('es-CL'),
      sorter: (a: HistorialStock, b: HistorialStock) => new Date(a.purchase_sale_date).getTime() - new Date(b.purchase_sale_date).getTime()
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: HistorialStock) => (
        <Space>
          <Tooltip title="Ver Detalles">
            <Button icon={<InfoCircleOutlined />} onClick={() => handleViewDetails(record, 'details')} />
          </Tooltip>
          <Tooltip title="Ver Historial de Ventas">
            <Button icon={<HistoryOutlined />} onClick={() => handleViewDetails(record, 'history')} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString("es-CL");

  return (
    <Content style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center">
                <BoxPlotOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                <Title level={2} style={{ margin: 0 }}>Historial de Stock</Title>
              </Space>
              <Text type="secondary">Usuario: <strong>{userData?.nickname || "..."}</strong></Text>
            </Col>
            <Col>
              <Space>
                <Link to="/sync/home">
                  <Button icon={<ArrowLeftOutlined />}>Volver a Inicio</Button>
                </Link>
                <Select
                  style={{ width: 250 }}
                  placeholder="Selecciona una conexión"
                  value={selectedConnection}
                  onChange={setSelectedConnection}
                  options={connections.map(c => ({ label: c.nickname, value: c.client_id }))}
                  loading={connections.length === 0 && !error}
                  disabled={connections.length === 0}
                />
                <Button icon={<SyncOutlined spin={loading} />} onClick={fetchData} disabled={!selectedConnection || loading}>
                  Refrescar
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
        <Card>
          <Row gutter={[16, 16]}>
            <Col flex="auto">
              <Input.Search
                placeholder="Buscar por SKU, nombre o ID..."
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                allowClear
              />
            </Col>
            <Col>
              <RangePicker onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])} />
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={exportToExcel}
                  disabled={filteredData.length === 0}
                  className={styles.exportButton}
                >
                  Exportar Excel
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={exportToPDF}
                  disabled={filteredData.length === 0}
                  className={styles.exportButton}
                >
                  Exportar PDF
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClearFilters} danger>Limpiar Filtros</Button>
              </Space>
            </Col>
          </Row>
        </Card>
        <Card>
          {error && !loading && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} productos`
            }}
            onChange={(pagination) => setPagination({ current: pagination.current!, pageSize: pagination.pageSize! })}
            locale={{ emptyText: <Empty description={!loading && !error ? "No hay productos para mostrar." : " "} /> }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Space>

      <Modal
        title={<Space> {viewMode === 'details' ? <InfoCircleOutlined /> : <HistoryOutlined />} {viewMode === 'details' ? 'Detalles del Producto' : 'Historial de Ventas'} </Space>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={<Button onClick={() => setIsModalVisible(false)}>Cerrar</Button>}
        width={700}
      >
        {selectedProduct && viewMode === 'details' && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{selectedProduct.id}</Descriptions.Item>
            <Descriptions.Item label="SKU">{selectedProduct.sku}</Descriptions.Item>
            <Descriptions.Item label="Producto">{selectedProduct.title}</Descriptions.Item>
            <Descriptions.Item label="Cantidad Disponible"><Tag color="blue">{selectedProduct.available_quantity}</Tag></Descriptions.Item>
            <Descriptions.Item label="Última Venta">{formatDate(selectedProduct.purchase_sale_date)}</Descriptions.Item>
            {selectedProduct.details?.map(d => (<Descriptions.Item key={d.name} label={d.name}>{d.value_name}</Descriptions.Item>))}
          </Descriptions>
        )}
        {selectedProduct && viewMode === 'history' && (
          <Spin spinning={historyLoading}>
            {historyError && <Alert message={historyError} type="error" showIcon />}
            {!historyError && (
              <List header={<Title level={5}>{selectedProduct.title}</Title>} bordered dataSource={selectedProduct.history}
                renderItem={item => (<List.Item> <Text>{formatDate(item.date)}</Text> <Tag color="purple">Cantidad vendida: {item.quantity}</Tag> </List.Item>)}
                locale={{ emptyText: "No hay historial de ventas para este producto." }} />
            )}
          </Spin>
        )}
      </Modal>
    </Content>
  );
};

export default ReporteHistorialStock;
// Este copmponente es para mostrar el Historial de stock que hay por cada tienda. Se utiliza react y Ant design para la UI. 
// El componente permite filtrar productos, exportar datos a Excel, PDF y ver el stock detallado de los productos.