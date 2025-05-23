import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Mapa de meses para representar numéricos como texto
export const months: { [key: string]: string } = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre"
};

// Arreglo de meses ordenados por número
export const orderedMonths = Object.entries(months).sort(([a], [b]) => parseInt(a) - parseInt(b));

// Devuelve un array de los últimos 10 años como strings
export const getYears = (): string[] => {
  return Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
};

// Formatea un número a moneda chilena
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
};

// Genera un PDF de comparación de ventas basado en meses o años
export const generatePDF = (mode: 'month' | 'year', nickname: string, result: any): string => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(0, 121, 191);
  doc.rect(0, 0, 210, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Reporte de Comparación de Ventas", 14, 20);

  // Cliente
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Cliente: ${nickname}`, 14, 40);

  // Obtener los datos de comparación
  const data1 = mode === 'month' ? result.data?.month1 : result.data?.year1;
  const data2 = mode === 'month' ? result.data?.month2 : result.data?.year2;

  // Crear etiquetas de los períodos
  const label1 = mode === 'month'
    ? `${months[data1.month]} ${data1.year}`
    : `${data1.year}`;
  const label2 = mode === 'month'
    ? `${months[data2.month]} ${data2.year}`
    : `${data2.year}`;

  const total1 = data1?.total_sales || 0;
  const total2 = data2?.total_sales || 0;

  const year1 = parseInt(data1?.year);
  const year2 = parseInt(data2?.year);
  const recentIs2 = year2 > year1;

  // Cálculo de diferencias
  const recentLabel = recentIs2 ? label2 : label1;
  const previousLabel = recentIs2 ? label1 : label2;
  const recent = recentIs2 ? total2 : total1;
  const previous = recentIs2 ? total1 : total2;
  const difference = recent - previous;
  const percentage = previous === 0 ? 0 : ((difference / previous) * 100).toFixed(2);

  // Interpretación textual de los resultados
  let interpretacion = '';
  if (previous === 0) {
    interpretacion = `En ${recentLabel} se registraron ventas por ${formatCurrency(recent)}, mientras que en ${previousLabel} no hubo ventas registradas. Esto indica el inicio de actividad comercial o una apertura significativa en el período actual.`;
  } else if (difference === 0) {
    interpretacion = `No hubo variación en las ventas entre ${previousLabel} y ${recentLabel}.`;
  } else {
    const cambio = difference > 0 ? 'aumentaron' : 'disminuyeron';
    const resultado = difference > 0 ? 'una mejora significativa' : 'una baja considerable';
    interpretacion = `Las ventas ${cambio} un ${Math.abs(Number(percentage))}% en ${recentLabel} con respecto a ${previousLabel}, reflejando ${resultado} en el rendimiento.`;
  }

  // Mostrar totales
  doc.setFont("helvetica", "bold");
  doc.text("Totales Comparados:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`${label1}: ${formatCurrency(total1)}`, 14, 63);
  doc.text(`${label2}: ${formatCurrency(total2)}`, 14, 71);
  doc.text(`Diferencia: ${formatCurrency(difference)}`, 14, 79);
  doc.text(`Cambio porcentual: ${percentage}%`, 14, 87);

  // Mostrar interpretación
  doc.setFont("helvetica", "bold");
  doc.text("Interpretación:", 14, 97);
  doc.setFont("helvetica", "normal");
  const splitText = doc.splitTextToSize(interpretacion, 180);
  doc.text(splitText, 14, 105);

  // Tabla de productos vendidos
  const labelProd1 = `Productos vendidos en ${label1}`;
  const labelProd2 = `Productos vendidos en ${label2}`;
  const startY1 = 105 + splitText.length * 7 + 10;

  doc.setFont("helvetica", "bold");
  doc.text(labelProd1, 14, startY1);

  autoTable(doc, {
    startY: startY1 + 5,
    head: [["Producto", "Cantidad", "Precio"]],
    body: data1.sold_products.map((p: any) => [p.title, p.quantity, formatCurrency(p.price)]),
    theme: 'striped',
  });

  const startY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.text(labelProd2, 14, startY2);

  autoTable(doc, {
    startY: startY2 + 5,
    head: [["Producto", "Cantidad", "Precio"]],
    body: data2.sold_products.map((p: any) => [p.title, p.quantity, formatCurrency(p.price)]),
    theme: 'striped',
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("---------- Multi Stock Sync ----------", 105, pageHeight - 10, { align: "center" });

  return doc.output("datauristring");
};

// Exporta los resultados de comparación a un archivo Excel (.xlsx)
export const exportToExcel = (mode: 'month' | 'year', result: any) => {
  if (!result) return;

  const workbook = XLSX.utils.book_new();

  const createSheet = (data: any) => {
    const sheetData = data.sold_products.map((product: any) => ({
      Producto: product.title,
      Cantidad: product.quantity,
      Precio: formatCurrency(product.price),
    }));

    sheetData.unshift({
      Producto: `Total Ventas: ${formatCurrency(data.total_sales)}`,
      Cantidad: '',
      Precio: ''
    });

    return XLSX.utils.json_to_sheet(sheetData, { skipHeader: false });
  };

  const data1 = mode === 'month' ? result.data.month1 : result.data.year1;
  const data2 = mode === 'month' ? result.data.month2 : result.data.year2;

  const label1 = mode === 'month' ? `${months[data1.month]} ${data1.year}` : data1.year;
  const label2 = mode === 'month' ? `${months[data2.month]} ${data2.year}` : data2.year;

  // Crear hojas por cada período
  XLSX.utils.book_append_sheet(workbook, createSheet(data1), `Ventas ${label1}`);
  XLSX.utils.book_append_sheet(workbook, createSheet(data2), `Ventas ${label2}`);

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, `Comparacion_Ventas_${label1}_vs_${label2}.xlsx`);
};
