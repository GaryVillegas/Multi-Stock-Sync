import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../../axiosConfig";
import {
  Button,
  Table,
  Form,
  Container,
  Modal,
  Spinner,
  Badge,
} from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import styles from "./Despacho.module.css";
import { 
  FilePdfOutlined, 
  FileExcelOutlined,
  BoxPlotOutlined 
} from "@ant-design/icons";

const ProductosDespachar: React.FC = () => {
  const { client_id } = useParams();

  const [productos, setProductos] = useState<any[]>([]);
  const [productosOriginal, setProductosOriginal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `${import.meta.env.VITE_API_URL}/mercadolibre/products-to-dispatch/${client_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        if (response.data.status === "success" && response.data.data.length > 0) {
          setProductos(response.data.data);
          setProductosOriginal(response.data.data);
          setError(null);
        } else {
          setProductos([]);
          setProductosOriginal([]);
        }
      } catch {
        setError("Error al conectar con la API. Intente de nuevo más tarde.");
        setProductos([]);
        setProductosOriginal([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [client_id]);

  // Filtrado en tiempo real al escribir
  useEffect(() => {
    const filtrados = productosOriginal.filter(
      (p) =>
        p.sku.toString().toLowerCase().includes(filtro.toLowerCase()) ||
        p.title.toLowerCase().includes(filtro.toLowerCase())
    );
    setProductos(filtrados);
    setCurrentPage(1);
  }, [filtro, productosOriginal]);

  // Funciones de exportación
  const exportToExcel = () => {
    const datos = productos.map((p) => ({
      SKU: p.sku,
      Producto: p.title,
      Talla: p.size,
      Cantidad: p.quantity,
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Despacho");
    XLSX.writeFile(wb, "productos_despachar.xlsx");
  };
  // Funcion para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Productos Listos para Despacho", 14, 10);
    doc.autoTable({
      head: [["SKU", "Producto", "Talla", "Cantidad"]],
      body: productos.map((p) => [p.sku, p.title, p.size, p.quantity]),
    });
    const blob = doc.output("blob");
    setPdfUrl(URL.createObjectURL(blob));
    setShowModal(true);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Productos Listos para Despacho", 14, 10);
    doc.autoTable({
      head: [["SKU", "Producto", "Talla", "Cantidad"]],
      body: productos.map((p) => [p.sku, p.title, p.size, p.quantity]),
    });
    doc.save("productos_despachar.pdf");
    setShowModal(false);
  };

  // Función de traducción
  const traducirCampo = (campo: string): string => {
    const map: Record<string, string> = {
      date_created: "Creación",
      date_handling: "Procesamiento",
      date_ready_to_ship: "Listo para envío",
      date_first_printed: "Etiqueta impresa",
      date_shipped: "Enviado",
      date_delivered: "Entregado",
      date_not_delivered: "No entregado",
      date_returned: "Devuelto",
      date_cancelled: "Cancelado",
    };
    return map[campo] || campo;
  };

  // Lógica de paginación
  const totalPages = Math.ceil(productos.length / itemsPerPage);
  const currentData = productos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startItem = productos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, productos.length);

  if (error && !loading) return <p className="text-danger text-center mt-4">{error}</p>;

  return (
    <Container>
      <div className={styles.mainContainer}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <BoxPlotOutlined className={styles.headerIcon} />
            <h2 className={styles.headerTitle}>Productos para Despacho</h2>
            <Badge pill bg="danger">
              {productos.length}
            </Badge>
          </div>
          <Form onSubmit={(e) => e.preventDefault()} style={{ minWidth: '300px' }}>
            <Form.Control
              type="text"
              placeholder="Buscar por SKU o nombre..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </Form>
        </div>

        <div className={styles.paginationInfo}>
          <span>
            Mostrando {startItem}-{endItem} de {productos.length} productos
          </span>
          <div className={styles.paginationControls}>
            <Button className={styles.btnRojoOutline} onClick={exportToExcel} size="sm">
              <FileExcelOutlined /> Exportar Excel
            </Button>
            <Button className={styles.btnRojoOutline} onClick={exportToPDF} size="sm">
              <FilePdfOutlined /> Exportar PDF
            </Button>
          </div>
        </div>
        <br />
        <Table responsive bordered hover>
          <thead className="table-light text-center">
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Talla</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.tableInfoCell}>
                  <Spinner animation="border" variant="danger" />
                  <span className="ms-2">Cargando productos...</span>
                </td>
              </tr>
            ) : currentData.length > 0 ? (
              currentData.map((p, i) => (
                <tr key={`${p.sku}-${i}`}>
                  <td>{p.sku}</td>
                  <td>{p.title}</td>
                  <td>{p.size}</td>
                  <td>{p.quantity}</td>
                  <td>{p.shipment_history?.status || "Desconocido"}</td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      className={styles.btnRojoOutline}
                      onClick={() => setSelectedProduct(p)}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.tableInfoCell}>
                  {filtro
                    ? `No se encontraron resultados para "${filtro}"`
                    : "No hay productos listos para despacho."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {productos.length > 0 && !loading && (
          <div className={styles.paginationInfo}>
            <span>
              Mostrando {startItem}-{endItem} de {productos.length} productos
            </span>
            <div className={styles.paginationControls}>
              <Button
                className={styles.btnRojo}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                size="sm"
              >
                Anterior
              </Button>
              <span className="text-muted">Página {currentPage} de {totalPages}</span>
              <Button
                className={styles.btnRojo}
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vista previa PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pdfUrl && <iframe src={pdfUrl} width="100%" height="500px" title="PDF" />}
        </Modal.Body>
        <Modal.Footer>
          <Button className={styles.btnRojo} onClick={handleDownloadPDF}>
            <FilePdfOutlined /> Descargar PDF
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!selectedProduct} onHide={() => setSelectedProduct(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Historial de Envío</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct?.shipment_history?.date_history ? (
            <ul>
              {Object.entries(selectedProduct.shipment_history.date_history).map(
                ([key, value], i) => (
                  <li key={i}>
                    <strong>{traducirCampo(key)}:</strong>{" "}
                    {String(value) || "No disponible"}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>No hay historial disponible.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductosDespachar;
//este componente es para mostrar los productos que están listos para ser despachados a un cliente específico. Se utiliza React y Bootstrap para la interfaz de usuario, y se hace uso de axios para realizar peticiones a una API. El componente permite filtrar productos, exportar datos a Excel y PDF, y ver el historial de envíos de cada producto.
// El componente también maneja la paginación de los productos mostrados en la tabla.