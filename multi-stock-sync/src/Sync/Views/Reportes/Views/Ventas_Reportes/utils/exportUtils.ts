import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

interface DetalleVenta {
  key: string;
  mes: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

// 🟧 PDF: Ventas por Mes
export const generarPDFPorMes = (
  ventas: any[],
  year: number,
  month: number,
  userName: string,
  totalVentas: number,
  formatCLP: (value: number) => string
): string => {
  const doc = new jsPDF();
  const fecha = `${month.toString().padStart(2, "0")}-${year}`;

  doc.setFontSize(16);
  doc.text(`Reporte de Ventas por Mes - ${fecha}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Usuario: ${userName}`, 10, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Fecha", "Producto", "Cantidad", "Total"]],
    body: ventas.map((v) => [
      v.date || "Sin Fecha",
      v.title,
      v.quantity,
      formatCLP(v.total_amount || 0),
    ]),
    foot: [
      [
        { content: "Total del Mes", colSpan: 3 },
        formatCLP(totalVentas),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    theme: "striped",
  });

  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);

};

// 🟧 PDF: Guardar directo Mes
export const guardarPDFPorMes = (
  ventas: any[],
  year: number,
  month: number,
  userName: string,
  totalVentas: number,
  formatCLP: (value: number) => string
): void => {
  const doc = new jsPDF();
  const fecha = `${month.toString().padStart(2, "0")}-${year}`;

  doc.setFontSize(16);
  doc.text(`Reporte de Ventas por Mes - ${fecha}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Usuario: ${userName}`, 10, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Fecha", "Producto", "Cantidad", "Total"]],
    body: ventas.map((v) => [
      v.date || "Sin Fecha",
      v.title,
      v.quantity,
      formatCLP(v.total_amount || 0),
    ]),
    foot: [
      [
        { content: "Total del Mes", colSpan: 3 },
        formatCLP(totalVentas),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    theme: "striped",
  });

  doc.save(`Ventas_Mes_${userName}_${fecha}.pdf`);
};

// 🟧 Excel: Ventas por Mes
export const exportarExcelPorMes = (
  ventas: any[],
  year: number,
  month: number,
  userName: string,
  formatCLP: (value: number) => string
): void => {
  const worksheetData = [
    ["Fecha", "Producto", "Cantidad", "Total"],
    ...ventas.map((venta) => [
      venta.date || "Sin Fecha",
      venta.title,
      venta.quantity,
      formatCLP(venta.total_amount),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "VentasPorMes");

  const fileName = `VentasMes_${userName}_${month
    .toString()
    .padStart(2, "0")}_${year}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

// 🟨 PDF: Ventas por Día
export const generarPDFPorDiaBlobURL = (
  fecha: string,
  ventas: any[],
  total: number,
  userData: { nickname: string; profile_image: string },
  formatCLP: (value: number) => string
): string => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Reporte de Ventas por Día - ${fecha}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Usuario: ${userData.nickname}`, 10, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Producto", "Cantidad", "Total"]],
    body: ventas.map((v) => [
      v.title,
      v.quantity,
      formatCLP(v.total_amount || 0),
    ]),
    foot: [[{ content: "Total del Día", colSpan: 2 }, formatCLP(total)]],
    styles: { fontSize: 9, cellPadding: 2 },
    theme: "striped",
  });

  const pdfBlob = doc.output("blob"); // Genera el PDF como Blob
  return URL.createObjectURL(pdfBlob);
};

// 🟦 PDF: Ventas por Año
export const generarPDFPorYear = (
  data: any[],
  year: string,
  userName: string
): string => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Reporte Anual de Ventas - ${year}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Usuario: ${userName}`, 10, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Mes", "Ventas Totales"]],
    body: data.map((d) => [
      d.month,
      `$${d.total_sales.toLocaleString("es-CL")}`,
    ]),
    styles: { fontSize: 9 },
    theme: "striped",
  });

  return doc.output("datauristring");
};

// 🟦 PDF Guardar: Año
export const guardarPDFPorYear = (
  data: any[],
  year: string,
  userName: string
): void => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Reporte Anual de Ventas - ${year}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Usuario: ${userName}`, 10, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Mes", "Ventas Totales"]],
    body: data.map((d) => [
      d.month,
      `$${d.total_sales.toLocaleString("es-CL")}`,
    ]),
    styles: { fontSize: 9 },
    theme: "striped",
  });

  doc.save(`Ventas_Anuales_${year}.pdf`);
};

// 🟦 Excel: Año
export const exportarExcelPorYear = (
  salesData: Mes[],
  detalleVentas: DetalleVenta[],
  year: string,
  userName: string
): void => {
  // Hoja de Resumen Mensual 
  const resumenData = salesData.map(mes => ({
    "Mes": mes.month,
    "Ventas Totales (CLP)": mes.total_sales
  }));
  const totalSales = salesData.reduce((acc, mes) => acc + mes.total_sales, 0);
  resumenData.push({ "Mes": "Total Año", "Ventas Totales (CLP)": totalSales });
  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 25 }];

  // Hoja de Detalle de Productos Vendidos
  const detalleDataForSheet = detalleVentas.map(item => ({
    "Mes": item.mes,
    "Producto": item.producto,
    "Cantidad": item.cantidad,
    "Precio Unitario (CLP)": item.precioUnitario,
  }));
  const wsDetalle = XLSX.utils.json_to_sheet(detalleDataForSheet);
  wsDetalle['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por Mes");
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle de Ventas");

  // Exportar el archivo
  XLSX.writeFile(wb, `Reporte_Ventas_Detallado_${userName}_${year}.xlsx`);
};
