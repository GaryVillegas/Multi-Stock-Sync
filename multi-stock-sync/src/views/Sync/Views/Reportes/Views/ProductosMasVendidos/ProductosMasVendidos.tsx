import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap'; // Para el dropdown del gráfico
import { Bar } from 'react-chartjs-2'; // Asegúrate de tener instalado chart.js y react-chartjs-2
import style from "./ProductoMasVendido.module.css";

const Productos: React.FC = () => {
    const { client_id } = useParams<{ client_id: string }>();
    const [productos, setProductos] = useState<any[]>([]); // Para almacenar los productos
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('2024-10'); // Fecha por defecto (2024-10)
    const [currentPage, setCurrentPage] = useState<number>(1); // Página actual
    const [itemsPerPage] = useState<number>(10); // Número de elementos por página
    const [itemsPerGraph, setItemsPerGraph] = useState<number>(10); // Número de elementos para el gráfico

    // Maneja el cambio en el input de tipo month
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMonth(e.target.value); // Actualiza el estado con el nuevo valor de mes
    };

    // Fetch de los productos
    useEffect(() => {
        const fetchProductos = async () => {
        try {
            const [year, month] = selectedMonth.split('-'); // Separa el valor de la fecha en año y mes
            const response = await fetch(
            `${import.meta.env.VITE_API_URL}/mercadolibre/top-selling-products/${client_id}?year=${year}&month=${month}`
            );
            const data = await response.json();
            if (data.status === 'success') {
            setProductos(data.data); // Almacenar los productos obtenidos
            } else {
            setError('No se pudieron obtener los productos');
            }
        } catch (error) {
            setError('Error al hacer la solicitud');
        } finally {
            setLoading(false);
        }
        };

        fetchProductos();
    }, [client_id, selectedMonth]); // Dependencia para que vuelva a llamar la API cuando se cambia el mes

    // Calcular los productos a mostrar en la página actual
    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = productos.slice(indexOfFirstProduct, indexOfLastProduct);

    // Cambiar la página
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Cambiar la cantidad de productos que se muestran en el gráfico
    const handleGraphItemsChange = (value: number) => {
        setItemsPerGraph(value);
    };

    // Configuración para el gráfico de barras
    const chartData = {
        labels: productos.slice(0, itemsPerGraph).map((producto) => producto.title),
        datasets: [
        {
            label: 'Precio Total',
            data: productos.slice(0, itemsPerGraph).map((producto) => producto.total_amount),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        },
        ],
    };

    const chartOptions = {
        scales: {
        y: {
            beginAtZero: true,
        },
        },
    };

    // Función para obtener el producto más vendido y el menos vendido
    const getMostAndLeastSoldProduct = () => {
        if (productos.length === 0) return { mostSold: null, leastSold: null };

        const sortedByTotal = [...productos].sort((a, b) => b.total_amount - a.total_amount);
        const mostSold = sortedByTotal[0];  // Producto más vendido
        const leastSold = sortedByTotal[sortedByTotal.length - 1]; // Producto menos vendido

        return { mostSold, leastSold };
    };

    const { mostSold, leastSold } = getMostAndLeastSoldProduct();

    return (
    <div className={style.container__HomeProducto}>
        <h1 className="text-center">Productos</h1>
        
        {/* Tarjetas de Producto Más Vendido y Menos Vendido */}
        <div className="d-flex justify-content-around mb-4">
        {['Producto Más Vendido', 'Producto Menos Vendido'].map((title, index) => {
        const product = index === 0 ? mostSold : leastSold;
        return (
            <div className="card shadow-sm" style={{ width: '18rem' }} key={index}>
                <div className="card-body">
                <h5 className="card-title">{title}</h5>
                {product ? (
                    <>
                    <h6 className="card-subtitle mb-2 text-muted">{product.title}</h6>
                    <p className="card-text">Cantidad: {product.quantity}</p>
                    <p className="card-text">Total: ${product.total_amount}</p>
                    </>
                ) : (
                <p className="card-text">No hay datos disponibles.</p>
                )}
                </div>
            </div>
            );
        })}
    </div>

    {/* Selector de mes y año */}
    <div className="text-center mb-4">
    <label htmlFor="monthSelector" className="form-label">
        Selecciona el mes y año:
    </label>
        <input
            type="month"
            id="monthSelector"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="form-control w-auto mx-auto"
        />
        </div>

    {/* Mensajes de estado */}
    {loading && <p className="text-center text-primary">Cargando productos...</p>}
    {error && <p className="text-center text-danger">{error}</p>}
    
    {/* Tabla de productos */}
    <div className={style.table__container}>
    <table className="table table-striped table-bordered">
        <thead>
            <tr>
                <th>Título</th>
                <th>Cantidad</th>
                <th>Total</th>
            </tr>
        </thead>
            <tbody>
            {currentProducts.map((producto, index) => (
                <tr key={index}>
                    <td>{producto.title}</td>
                    <td>{producto.quantity}</td>
                    <td>${producto.total_amount}</td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>

    {/* Paginación */}
    <div className="pagination__container">
        <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-primary"
        >
            Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastProduct >= productos.length}
            className="btn btn-primary"
        >
            Siguiente
        </button>
        </div>

    {/* Dropdown para el gráfico */}
    <div className="text-center my-4">
        <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdownMenuButton">
            Seleccionar cantidad de datos para el gráfico
            </Dropdown.Toggle>
            <Dropdown.Menu>
            {[10, 25, 50, 100, 1000].map((option) => (
                <Dropdown.Item
                    key={option}
                    onClick={() => handleGraphItemsChange(option)}
                >
                    Mostrar {option} productos
                </Dropdown.Item>
            ))}
            </Dropdown.Menu>
        </Dropdown>
    </div>

    {/* Gráfico de barras */}
    {productos.length > 0 && (
        <div className="mt-5">
            <h3 className="text-center">Gráfico de Barra: Precio Total de Productos</h3>
            <div className="chart__container">
            <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
        )}
    </div>
    );
};

export default Productos;
