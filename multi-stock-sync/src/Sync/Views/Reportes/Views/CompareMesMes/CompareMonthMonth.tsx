import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../../axiosConfig';
import styles from './CompareMonthMonth.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Modal } from 'react-bootstrap';
import { LoadingDinamico } from '../../../../../components/LoadingDinamico/LoadingDinamico';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFilePdf } from '@fortawesome/free-solid-svg-icons';

const months: { [key: string]: string } = {
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

const orderedMonths = Object.entries(months).sort(([a], [b]) => parseInt(a) - parseInt(b));

const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const CompareMonthMonth: React.FC = () => {
    const { client_id } = useParams<{ client_id: string }>();
    const [year1, setYear1] = useState('');
    const [month1, setMonth1] = useState('');
    const [year2, setYear2] = useState('');
    const [month2, setMonth2] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [nickname, setNickname] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchNickname = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/mercadolibre/credentials/${client_id}`);
                console.log('Nickname response:', response.data);
                setNickname(response.data.data.nickname);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchNickname();
    }, [client_id]);

    const handleDropdownChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        setter(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/mercadolibre/compare-sales-data/${client_id}`, {
                params: { year1, month1, year2, month2 }
            });
            setResult(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(0, 121, 191);
        doc.rect(0, 0, 210, 30, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text("Reporte de Comparación de Ventas", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Cliente: ${nickname}`, 14, 40);

        if (result) {
            const { month1, month2, difference, percentage_change } = result.data;

            doc.text(`Comparación entre ${months[month1.month]} ${month1.year} y ${months[month2.month]} ${month2.year}`, 14, 50);

            doc.setFontSize(14);
            doc.text(`${months[month1.month]} ${month1.year}`, 105, 70, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Total Ventas: ${formatCurrency(month1.total_sales)}`, 105, 80, { align: 'center' });

            autoTable(doc, {
                head: [["Producto", "Cantidad", "Precio"]],
                body: month1.sold_products.map((product: any) => [
                    product.title,
                    product.quantity,
                    formatCurrency(product.price),
                ]),
                startY: 90,
                theme: 'grid',
                margin: { bottom: 10 }
            });

            doc.setFontSize(14);
            doc.text(`${months[month2.month]} ${month2.year}`, 105, (doc as any).lastAutoTable.finalY + 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Total Ventas: ${formatCurrency(month2.total_sales)}`, 105, (doc as any).lastAutoTable.finalY + 30, { align: 'center' });

            autoTable(doc, {
                head: [["Producto", "Cantidad", "Precio"]],
                body: month2.sold_products.map((product: any) => [
                    product.title,
                    product.quantity,
                    formatCurrency(product.price),
                ]),
                startY: (doc as any).lastAutoTable.finalY + 40,
                theme: 'grid',
                margin: { bottom: 10 }
            });

            doc.text(`Diferencia: ${formatCurrency(difference)}`, 14, (doc as any).lastAutoTable.finalY + 30);
            doc.setTextColor(percentage_change > 0 ? 'green' : 'red');
            doc.text(`Cambio Porcentual: ${percentage_change}%`, 14, (doc as any).lastAutoTable.finalY + 40);
        }

        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("----------Multi Stock Sync----------", 105, pageHeight - 10, { align: "center" });

        const pdfData = doc.output("datauristring");
        setPdfDataUrl(pdfData);
        setShowModal(true);
    };

    return (
        <>
            {loading && <LoadingDinamico variant="container" />}
            <div className={styles.container} style={{ display: loading ? 'none' : 'block' }}>
                {!loading && (
                    <>
                        <h1>Comparar Ventas entre Meses</h1>
                        <p>USUARIO: {nickname}</p>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Año 1</label>
                                <select className="form-control" value={year1} onChange={handleDropdownChange(setYear1)} required>
                                    <option value="">Seleccione un año</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mes 1</label>
                                <select className="form-control" value={month1} onChange={handleDropdownChange(setMonth1)} required>
                                    <option value="">Seleccione un mes</option>
                                    {orderedMonths.map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Año 2</label>
                                <select className="form-control" value={year2} onChange={handleDropdownChange(setYear2)} required>
                                    <option value="">Seleccione un año</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mes 2</label>
                                <select className="form-control" value={month2} onChange={handleDropdownChange(setMonth2)} required>
                                    <option value="">Seleccione un mes</option>
                                    {orderedMonths.map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.buttonContainer}>
                                <button type="submit" className="btn btn-primary" style={{ marginRight: '20px' }}>
                                    <FontAwesomeIcon icon={faFilePdf} /> Comparar
                                </button>
                                <button onClick={() => window.history.back()} className="btn btn-secondary mr-2">
                                    <FontAwesomeIcon icon={faArrowLeft} /> VOLVER
                                </button>
                            </div>
                        </form>
                        {result && (
                            <div>
                                <h1>Resultado de la Comparación</h1>
                                <div className={styles.tableContainer}>
                                    <h3>{months[result.data.month1.month]} {result.data.month1.year}</h3>
                                    <p>Total Ventas: <strong>{formatCurrency(result.data.month1.total_sales)}</strong></p>
                                    <div className={styles.tableContainer}>
                                        <table className={`table table-striped ${styles.table}`}>
                                            <thead>
                                                <tr>
                                                    <th className='table_header'>Producto</th>
                                                    <th className='table_header'>Cantidad</th>
                                                    <th className='table_header'>Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.data.month1.sold_products.map((product: any) => (
                                                    <tr key={product.order_id}>
                                                        <td>{product.title}</td>
                                                        <td>{product.quantity}</td>
                                                        <td>{formatCurrency(product.price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className={styles.tableContainer}>
                                    <h3>{months[result.data.month2.month]} {result.data.month2.year}</h3>
                                    <p>Total Ventas: <strong>{formatCurrency(result.data.month2.total_sales)}</strong></p>
                                    <div className={styles.tableContainer}>
                                        <table className={`table table-striped ${styles.table}`}>
                                            <thead>
                                                <tr>
                                                    <th className='table_header'>Producto</th>
                                                    <th className='table_header'>Cantidad</th>
                                                    <th className='table_header'>Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.data.month2.sold_products.map((product: any) => (
                                                    <tr key={product.order_id}>
                                                        <td>{product.title}</td>
                                                        <td>{product.quantity}</td>
                                                        <td>{formatCurrency(product.price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <p>Diferencia: <strong>{formatCurrency(result.data.difference)}</strong></p>
                                <p style={{ color: result.data.percentage_change > 0 ? 'green' : 'red' }}>
                                    Cambio Porcentual: <strong>{result.data.percentage_change}%</strong>
                                </p>
                                <button onClick={generatePDF} className="btn btn-secondary mr-2">
                                    <FontAwesomeIcon icon={faFilePdf} /> Generar PDF
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Reporte de Comparación de Ventas</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {pdfDataUrl && <iframe src={pdfDataUrl} width="100%" height="500px" />}
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cerrar</button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CompareMonthMonth;
