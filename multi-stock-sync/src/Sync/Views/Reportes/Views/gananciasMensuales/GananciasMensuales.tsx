import { useEffect, useState, useCallback, useRef } from "react";
import {
  Select,
  Card,
  Alert,
  Row,
  Col,
  Spin,
  Typography,
  Modal,
  Divider,
} from "antd";
import { Line } from "react-chartjs-2";
import axiosInstance from "../../../../../axiosConfig";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { Text, Title: AntTitle } = Typography;

interface CompanySalesData {
  total_sales: number;
  total_products: number;
  company_name: string;
}

interface ApiResponse {
  status: string;
  message: string;
  sales_by_company: CompanySalesData[][];
  total_sales: number;
  date_range: {
    from: string;
    to: string;
  };
}

interface CurrentMonthAggregatedData {
  total_sales: number;
  companies_data: CompanySalesData[];
}

const GananciasMensuales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthAggregatedData, setCurrentMonthAggregatedData] =
    useState<CurrentMonthAggregatedData | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentFullYear = new Date().getFullYear();
    const currentMonthNum = (new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0");
    return `${currentFullYear}-${currentMonthNum}`;
  });
  const [chartData, setChartData] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  }, []);

  const getCurrentMonthData = useCallback(
    () => currentMonthAggregatedData,
    [currentMonthAggregatedData]
  );

  const populateAvailableYears = useCallback(() => {
    const currentFullYear = new Date().getFullYear();
    const years = [];
    for (let i = currentFullYear; i >= currentFullYear - 4; i--) {
      years.push(i.toString());
    }
    setAvailableYears(years.sort((a, b) => b.localeCompare(a)));
  }, []);

  const fetchSalesData = useCallback(
    async (year: string, month: string) => {
      if (!year || !month) {
        setCurrentMonthAggregatedData(null);
        setChartData(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<ApiResponse>(
          `${import.meta.env.VITE_API_URL}/mercadolibre/get-total-sales-all-companies`,
          { params: { year, month: month.split("-")[1] } }
        );

        const data = response.data;

        if (!data || data.status !== "success") {
          throw new Error(
            data.message || "La API no devolvió una respuesta exitosa."
          );
        }

        if (data.sales_by_company && data.sales_by_company.length > 0) {
          setCurrentMonthAggregatedData({
            total_sales: data.total_sales,
            companies_data: data.sales_by_company[0] 
          });
        } else {
          setCurrentMonthAggregatedData(null);
          setChartData(null);
        }
      } catch (err) {
        console.error("Error al cargar datos de ventas:", err);
        setError(err instanceof Error ? err.message : "Error al cargar datos.");
        setCurrentMonthAggregatedData(null);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateChart = useCallback((companiesData: CompanySalesData[]) => {
    if (!companiesData || companiesData.length === 0) {
      setChartData(null);
      return;
    }

    // Como no tenemos datos diarios, crearemos un gráfico simple de comparación por empresa
    const accountColors = {
      "COMERCIALIZADORAABIZICL": "#1890ff",
      "CRAZYFAMILY": "#52c41a",
      "OFERTASIMPERDIBLESCHILE": "#faad14",
      "LENCERIAONLINE": "#f5222d",
      "Cuenta desconocida": "#722ed1",
    };

    const datasets = [{
      label: "Ventas por Empresa ($)",
      data: companiesData.map(company => company.total_sales),
      backgroundColor: companiesData.map(company => 
        accountColors[company.company_name as keyof typeof accountColors] || "#1890ff"
      ),
      borderColor: companiesData.map(company => 
        accountColors[company.company_name as keyof typeof accountColors] || "#1890ff"
      ),
      borderWidth: 1
    }];

    setChartData({
      labels: companiesData.map(company => company.company_name),
      datasets,
    });
  }, []);

  const getAvailableMonths = useCallback(() => {
    return monthNames.map((name, index) => {
      const monthNum = (index + 1).toString().padStart(2, "0");
      const monthKey = `${selectedYear}-${monthNum}`;
      return {
        value: monthKey,
        label: name,
      };
    });
  }, [selectedYear, monthNames]);

  const generatePDF = useCallback(async () => {
    try {
      const monthData = getCurrentMonthData();
      if (!monthData) return;

      const pdf = new jsPDF();

      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text(
        `Reporte de Ganancias Consolidadas - ${
          monthNames[parseInt(selectedMonth.split("-")[1]) - 1]
        } ${selectedYear}`,
        105,
        15,
        { align: "center" }
      );

      pdf.setFontSize(12);
      pdf.text(`Ganancias totales de todas las cuentas`, 105, 25, {
        align: "center",
      });

      const summaryColumns = ["Cuenta", "Total Ventas", "Total Productos"];
      const summaryRows = monthData.companies_data.map((companyData) => [
        companyData.company_name,
        formatCurrency(companyData.total_sales),
        companyData.total_products.toString()
      ]);

      summaryRows.push([
        "TOTAL GENERAL",
        formatCurrency(monthData.total_sales),
        monthData.companies_data.reduce((sum, company) => sum + company.total_products, 0).toString()
      ]);

      autoTable(pdf, {
        head: [summaryColumns],
        body: summaryRows,
        startY: 35,
        theme: "grid",
        headStyles: {
          fillColor: [106, 48, 147],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: 5, right: 5 },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            data.cell.styles.fontStyle = 'bold';
          }
        },
        willDrawCell: (data) => {
          if (data.row.index === summaryRows.length - 1) {
            data.cell.styles.fillColor = [106, 48, 147];
            data.cell.styles.textColor = 255;
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text(
        `Total General del Mes: ${formatCurrency(monthData.total_sales)}`,
        105,
        (pdf as any).lastAutoTable.finalY + 10,
        { align: "center" }
      );

      const pdfBlob = pdf.output("blob");
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Error al generar el PDF.");
    }
  }, [selectedMonth, selectedYear, formatCurrency, getCurrentMonthData, monthNames]);

  const generateExcel = useCallback(() => {
    try {
      const monthData = getCurrentMonthData();
      if (!monthData || monthData.companies_data.length === 0) {
        console.warn("No data to generate Excel.");
        return;
      }

      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // 1. Hoja de Resumen (formato de tabla)
      const summaryData = [
        ["Cuenta", "Total Ventas", "Formateado", "Total Productos"],
        ...monthData.companies_data.map((companyData) => [
          companyData.company_name,
          companyData.total_sales,
          formatCurrency(companyData.total_sales),
          companyData.total_products
        ]),
        [
          "TOTAL GENERAL",
          monthData.total_sales,
          formatCurrency(monthData.total_sales),
          monthData.companies_data.reduce((sum, company) => sum + company.total_products, 0)
        ]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Añadir estilo a la hoja de resumen
      if (summarySheet["!ref"]) {
        const range = XLSX.utils.decode_range(summarySheet["!ref"]);
        
        // Estilo para encabezados
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerCell = XLSX.utils.encode_cell({r: range.s.r, c: C});
          if (!summarySheet[headerCell]) continue;
          summarySheet[headerCell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "6A3093" } },
            alignment: { horizontal: "center" }
          };
        }

        // Estilo para total general
        const totalRow = range.e.r;
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const totalCell = XLSX.utils.encode_cell({r: totalRow, c: C});
          if (!summarySheet[totalCell]) continue;
          summarySheet[totalCell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "6A3093" } }
          };
        }

        // Formato numérico para columna de montos
        for (let R = range.s.r + 1; R < range.e.r; ++R) {
          const amountCell = XLSX.utils.encode_cell({r: R, c: 1});
          if (summarySheet[amountCell]) {
            summarySheet[amountCell].z = '"$"#,##0.00;[Red]\-"$"#,##0.00';
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        bookSST: true
      });
      
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      saveAs(blob, `Ganancias_Consolidadas_${selectedMonth}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel:", err);
      setError("Error al generar el archivo Excel.");
    }
  }, [getCurrentMonthData, selectedMonth, formatCurrency]);

  useEffect(() => {
    populateAvailableYears();
  }, [populateAvailableYears]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      fetchSalesData(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, fetchSalesData]);

  useEffect(() => {
    if (currentMonthAggregatedData) {
      generateChart(currentMonthAggregatedData.companies_data);
    } else {
      setChartData(null);
    }
  }, [currentMonthAggregatedData, generateChart]);

  return (
    <div style={{ padding: 24 }}>
      <AntTitle level={3}>Reporte de Ganancias Mensuales Consolidadas</AntTitle>
      <Divider />

      {loading && (
        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <Spin tip="Cargando datos de ventas..." size="large" />
        </div>
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Select
            placeholder="Seleccione un año"
            style={{ width: "100%" }}
            onChange={(value) => {
              setSelectedYear(value);
              const monthPart = selectedMonth
                ? selectedMonth.split("-")[1]
                : (new Date().getMonth() + 1).toString().padStart(2, "0");
              setSelectedMonth(`${value}-${monthPart}`);
            }}
            value={selectedYear || undefined}
            loading={loading}
          >
            {availableYears.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12}>
          <Select
            placeholder="Seleccione un mes"
            style={{ width: "100%" }}
            onChange={(value) => {
              setSelectedMonth(value);
            }}
            value={selectedMonth || undefined}
            disabled={!selectedYear || getAvailableMonths().length === 0}
            options={getAvailableMonths()}
          />
        </Col>
      </Row>

      {chartData && selectedMonth && currentMonthAggregatedData ? (
        <Card
          title={`Ganancias Mensuales Consolidadas - ${
            monthNames[parseInt(selectedMonth.split("-")[1]) - 1]
          } ${selectedYear}`}
          extra={
            <Text strong>
              Total Consolidado:{" "}
              {formatCurrency(currentMonthAggregatedData.total_sales || 0)}
            </Text>
          }
        >
          <div ref={chartRef} style={{ height: 400 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      callback: (value: number | string) => {
                        if (typeof value === "number") {
                          return formatCurrency(value);
                        }
                        return value;
                      },
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        return ` ${
                          context.dataset.label
                        }: ${formatCurrency(context.raw as number)}`;
                      },
                    },
                  },
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 12,
                      padding: 20,
                    },
                  },
                },
              }}
            />
          </div>

          {currentMonthAggregatedData.companies_data && (
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col span={24}>
                <Divider orientation="left">Resumen por Cuenta</Divider>
                <Row gutter={[16, 16]}>
                  {currentMonthAggregatedData.companies_data.map(
                    (companyData, index) => (
                      <Col xs={24} sm={12} md={6} key={index}>
                        <Card
                          size="small"
                          title={companyData.company_name}
                          headStyle={{ backgroundColor: "#f0f0f0" }}
                        >
                          <Text strong style={{ fontSize: 16 }}>
                            {formatCurrency(companyData.total_sales)}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Productos: {companyData.total_products}</Text>
                          </div>
                        </Card>
                      </Col>
                    )
                  )}
                </Row>
              </Col>
            </Row>
          )}

          <Row gutter={[12, 12]} style={{ marginTop: 24 }} justify="center">
            <Col xs={24} sm={8} lg={6}>
              <button
                type="button"
                onClick={generatePDF}
                className="btn w-100 py-2 fw-medium rounded-pill shadow-sm position-relative overflow-hidden mb-3 export-button"
                style={{
                  backgroundColor: "white",
                  color: "#6a3093",
                  border: "2px solid #ba68c8",
                  transition: "all 0.3s",
                  zIndex: 1,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "#6a3093";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "100%";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#6a3093";
                  e.currentTarget.style.borderColor = "#ba68c8";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "0%";
                }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  <i className="fas fa-file-pdf me-2"></i> Descargar PDF
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "0%",
                    height: "100%",
                    backgroundColor: "#6a3093",
                    transition: "all 0.3s ease",
                    zIndex: 0,
                  }}
                ></span>
              </button>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <button
                type="button"
                onClick={async () => {
                  await generatePDF();
                  setIsModalVisible(true);
                }}
                className="btn w-100 py-2 fw-medium rounded-pill shadow-sm position-relative overflow-hidden mb-3 export-button"
                style={{
                  backgroundColor: "white",
                  color: "#6a3093",
                  border: "2px solid #ba68c8",
                  transition: "all 0.3s",
                  zIndex: 1,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "#6a3093";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "100%";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#6a3093";
                  e.currentTarget.style.borderColor = "#ba68c8";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "0%";
                }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  <i className="fas fa-eye me-2"></i> Visualizar PDF
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "0%",
                    height: "100%",
                    backgroundColor: "#6a3093",
                    transition: "all 0.3s ease",
                    zIndex: 0,
                  }}
                ></span>
              </button>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <button
                type="button"
                onClick={generateExcel}
                className="btn w-100 py-2 fw-medium rounded-pill shadow-sm position-relative overflow-hidden mb-3 export-button"
                style={{
                  backgroundColor: "white",
                  color: "#6a3093",
                  border: "2px solid #ba68c8",
                  transition: "all 0.3s",
                  zIndex: 1,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "#6a3093";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "100%";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#6a3093";
                  e.currentTarget.style.borderColor = "#ba68c8";
                  (e.currentTarget.children[1] as HTMLElement).style.width =
                    "0%";
                }}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  <i className="fas fa-file-excel me-2"></i> Descargar Excel
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "0%",
                    height: "100%",
                    backgroundColor: "#6a3093",
                    transition: "all 0.3s ease",
                    zIndex: 0,
                  }}
                ></span>
              </button>
            </Col>
          </Row>
        </Card>
      ) : !loading && !error && (
        <Alert
          message="Información"
          description="No hay datos de ventas disponibles para el mes seleccionado."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Modal
        title={`Vista previa del PDF - Ganancias Consolidadas ${
          monthNames[parseInt(selectedMonth?.split("-")[1]) - 1]
        } ${selectedYear}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: "none" }}
            title="Vista previa PDF"
          />
        ) : (
          <Alert
            message="Error"
            description="No se pudo cargar la vista previa del PDF."
            type="error"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default GananciasMensuales;