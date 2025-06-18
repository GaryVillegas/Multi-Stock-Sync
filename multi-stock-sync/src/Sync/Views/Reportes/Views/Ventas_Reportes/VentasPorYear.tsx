import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Layout,
  Card,
  Typography,
  Select,
  Button,
  Table,
  Space,
  Row,
  Col,
  Modal,
  Spin,
  Empty,
} from "antd";
import { FilePdfOutlined, FileExcelOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import axiosInstance from "../../../../../axiosConfig";
import GraficoPorYear from "./components/GraficoPorYear";
import {
  generarPDFPorYear,
  guardarPDFPorYear,
  exportarExcelPorYear,
} from "./utils/exportUtils";

interface ProductoVendido {
  order_id: number;
  title: string;
  quantity: number;
  price: number;
}

interface Mes {
  month: string;
  total_sales: number;
  sold_products: ProductoVendido[];
}

const { Content } = Layout;
const { Title, Text } = Typography;

const VentasPorYear: React.FC = () => {
  const { client_id } = useParams<{ client_id: string }>();

  const [salesData, setSalesData] = useState<Mes[]>([]);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [showDetailTable, setShowDetailTable] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!client_id) return;
      setLoading(true);
      try {
        const [salesResponse, userResponse] = await Promise.all([
          axiosInstance.get(
            `${import.meta.env.VITE_API_URL}/mercadolibre/annual-sales/${client_id}?year=${selectedYear}`
          ),
          axiosInstance.get(
            `${import.meta.env.VITE_API_URL}/mercadolibre/credentials/${client_id}`
          ),
        ]);

        const rawData = salesResponse.data.data;
        const parsed = Object.keys(rawData).map((month) => ({
          month,
          total_sales: rawData[month].total_amount,
          sold_products: rawData[month].orders.flatMap(
            (order: { sold_products: ProductoVendido[] }) => order.sold_products
          ),
        }));
        setSalesData(parsed);
        setUserName(userResponse.data.data.nickname);

      } catch (err) {
        console.error("Error cargando datos:", err);
        setSalesData([]);
        setUserName("");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client_id, selectedYear]);

  const totalSales = useMemo(() =>
    salesData.reduce((acc, mes) => acc + mes.total_sales, 0),
    [salesData]
  );

  // Crea la lista aplanada de productos.
  const detalleDataSource = useMemo(() =>
    salesData.flatMap((mes) =>
      mes.sold_products.map((prod, prodIndex) => ({
        key: `${mes.month}-${prod.order_id}-${prodIndex}`,
        mes: mes.month,
        producto: prod.title,
        cantidad: prod.quantity,
        precioUnitario: prod.price,
      }))
    ), [salesData]
  );

  // Handlers de Exportación
  const handlePreviewPDF = () => {
    const pdfBase64 = generarPDFPorYear(salesData, selectedYear, userName);
    const blob = new Blob(
      [Uint8Array.from(atob(pdfBase64.split(',')[1]), c => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    setPdfData(url);
    setIsPdfModalVisible(true);
  };

  const handleSavePDF = () => {
    guardarPDFPorYear(salesData, selectedYear, userName);
    setIsPdfModalVisible(false);
  };

  const handleGenerateExcel = () => {
    exportarExcelPorYear(salesData, detalleDataSource, selectedYear, userName);
  };

  // Columnas para AntD 
  const yearOptions = Array.from({ length: 4 }, (_, i) => ({
    value: (2025 - i).toString(),
    label: (2025 - i).toString(),
  }));

  const detailTableColumns = [
    { title: 'Mes', dataIndex: 'mes', key: 'mes', sorter: (a: { mes: string; }, b: { mes: any; }) => a.mes.localeCompare(b.mes) },
    { title: 'Producto', dataIndex: 'producto', key: 'producto', sorter: (a: { producto: string; }, b: { producto: any; }) => a.producto.localeCompare(b.producto) },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', sorter: (a: { cantidad: number; }, b: { cantidad: number; }) => a.cantidad - b.cantidad },
    {
      title: 'Precio Unitario',
      dataIndex: 'precioUnitario',
      key: 'precioUnitario',
      render: (price: number) => `$${price.toLocaleString("es-CL")} CLP`,
      sorter: (a: { precioUnitario: number; }, b: { precioUnitario: number; }) => a.precioUnitario - b.precioUnitario
    },
  ];

  // Render con Ant Design
  return (
    <Content style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>Ventas por Año</Title>
              <Text type="secondary">Usuario: <strong>{userName || "Cargando..."}</strong></Text>
            </Col>
            <Col>
              <Space>
                <Text>Selecciona Año:</Text>
                <Select
                  value={selectedYear}
                  style={{ width: 120 }}
                  onChange={(value) => setSelectedYear(value)}
                  options={yearOptions}
                  loading={loading}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading} tip="Cargando datos...">
          {salesData.length > 0 ? (
            <>
              <Card>
                <GraficoPorYear
                  chartData={{
                    labels: salesData.map((m) => m.month),
                    datasets: [
                      {
                        label: "Ventas Totales",
                        data: salesData.map((m) => m.total_sales),
                        backgroundColor: "rgba(24, 144, 255, 0.6)",
                        borderColor: "rgba(24, 144, 255, 1)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  totalVentas={totalSales}
                  year={selectedYear}
                />
              </Card>

              <Card>
                <Space>
                  <Button type="primary" icon={<FilePdfOutlined />} onClick={handlePreviewPDF}>
                    Exportar a PDF
                  </Button>
                  <Button type="primary" ghost icon={<FileExcelOutlined />} onClick={handleGenerateExcel}>
                    Exportar a Excel
                  </Button>
                  <Button
                    icon={showDetailTable ? <UpOutlined /> : <DownOutlined />}
                    onClick={() => setShowDetailTable(!showDetailTable)}
                  >
                    {showDetailTable ? "Ocultar Detalle" : "Ver Detalle"}
                  </Button>
                </Space>
              </Card>

              {showDetailTable && (
                <Card title="Detalle de Ventas por Año">
                  <Table
                    columns={detailTableColumns}
                    dataSource={detalleDataSource}
                    pagination={{ pageSize: 10 }}
                    summary={() => (
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>Total Vendido Año</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} >
                          <Text strong>${totalSales.toLocaleString("es-CL")} CLP</Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  />
                </Card>
              )}
            </>
          ) : (
            !loading && <Card><Empty description={`No se encontraron ventas para el año ${selectedYear}`} /></Card>
          )}
        </Spin>
      </Space>
      
      <Modal
        title="Vista Previa del PDF"
        open={isPdfModalVisible}
        onCancel={() => setIsPdfModalVisible(false)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setIsPdfModalVisible(false)}>
            Cerrar
          </Button>,
          <Button key="save" type="primary" onClick={handleSavePDF}>
            Guardar PDF
          </Button>,
        ]}
      >
        {pdfData && (
          <iframe
            src={`${pdfData}#zoom=100`}
            style={{ width: '100%', height: '75vh', border: 'none' }}
            title="Vista Previa PDF"
          />
        )}
      </Modal>
    </Content>
  );
};

export default VentasPorYear;
//este componente es para mostrar las ventas por año, se puede exportar a pdf y excel, y tiene un gráfico de ventas anuales. Se utiliza axios para hacer peticiones a la API y react-bootstrap para los modales y botones. El estado se maneja con useState y useEffect para cargar los datos al inicio o al cambiar el año seleccionado. Se utiliza un tipado básico para los productos vendidos y los meses con sus totales de ventas.
// Se utiliza CSS para el estilo del componente y se hace uso de un componente hijo para el gráfico. El componente es responsivo y permite ver el detalle de las ventas por mes.