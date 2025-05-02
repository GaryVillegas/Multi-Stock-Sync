import { useState, useEffect } from "react";
import axiosInstance from "../../../../axiosConfig";
import axios from "axios";

// Esto es cómo se ve la información detallada de un envío que buscamos (un "Envio").
interface Envio {
    id: string; // Un número para identificar este envío.
    order_id: string; // El número de la orden a la que pertenece.
    title: string; // El nombre del producto en el envío.
    quantity: number; // Cuántos productos hay.
    size: string; // El tamaño del paquete.
    sku: string; // El código único del producto.
    // El historial de cómo ha cambiado el estado del envío.
    shipment_history: {
        status: string; // El estado actual (ej: 'pendiente', 'enviado').
        date_created?: string; // Cuándo se creó este registro de estado.
    };
    // Información extra (puede que no siempre esté).
    clientName?: string;
    address?: string; // La dirección.
    receiver_name?: string; // Quién recibe.
    date_delivered?: string; // Cuándo se entregó.
}

// Esto dice qué cosas te va a dar el hook.
interface UseObtenerEnviosResult {
    data: Envio[]; // La lista de envíos encontrados.
    loading: boolean; // Si está trabajando para traer la lista.
    error: string | null; // Un mensaje si algo salió mal, o nada si todo bien.
    totalItems: number; // La cantidad total de envíos que existen (no solo los de esta página si no todos).
}

// Esta es la parte del hook que busca una lista de envíos para un cliente,
// pidiendo una "página" específica y cuántos quiere por "página".
// También puede buscar por año y mes el filtro se añadira mas adelante despues de la revisión.
const useObtenerEnviosPorCliente = (page: number, perPage: number, year?: number | null, month?: number | null): UseObtenerEnviosResult => {
    // Aquí guardamos la lista de envíos, si está cargando, si hay un error y cuántos envíos hay en total.
    const [data, setData] = useState<Envio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null); // También guarda el ID del cliente.
    const [totalItems, setTotalItems] = useState(10000); // Empieza con un número grande por si acaso.

    // Primero, busca el ID del cliente guardado en la computadora (localStorage).
    useEffect(() => {
        try {
            const conexionSeleccionada = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}");
            setClientId(conexionSeleccionada?.client_id || null);
        } catch (e) {
            console.error("Error al parsear conexionSeleccionada de localStorage:", e);
            setClientId(null);
        }
    }, []); // Esto se hace solo una vez al principio como lo vimos anteriormente en los otros hooks.

    // Después, cuando ya sabe el ID del cliente y si cambian la página, cuántos por página, el año o el mes...
    useEffect(() => {
        // Crea una función para ir a buscar la lista de envíos a la API.
        const fetchShipments = async (id: string, page: number, perPage: number, year?: number | null, month?: number | null) => {
            // Dice que ya empezó a buscar (está cargando).
            setLoading(true);
            setError(null); // Quita errores viejos.

            // Busca el permiso (token) para hablar con la API.
            const token = localStorage.getItem("token");

            // Si no hay permiso, no puede buscar. Marca un error y se detiene.
            if (!token) {
                setError("No tienes permiso para ver esto. Inicia sesión de nuevo.");
                setLoading(false);
                setTotalItems(0);
                return;
            }

            // Prepara la información de la página, cuántos por página, año y mes para enviarla a la API.
            const params: any = {
                page: page,
                perPage: perPage
            };

            if (year != null) {
                params.year = year;
            }
            if (month != null) {
                params.month = month;
            }

            try {
                // Esto Va y le pregunta a la API por los envíos de ese cliente y esa página y/o fecha Le muestra el permiso y la info de la página.
                const response = await axiosInstance.get(
                    `${import.meta.env.VITE_API_URL}/mercadolibre/products-to-dispatch/${id}`,
                    {
                        params: params,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                // Si la API respondió bien (status 'success')...
                if (response.data && response.data.status === "success") {
                    // Adapta los datos (cambia 'shipping_id' a 'order_id') y guarda la lista.
                    const itemsWithOrderId = response.data.data.map((item: any) => ({
                        ...item,
                        order_id: item.shipping_id
                    }));
                    setData(itemsWithOrderId || []);

                    // Guarda la cantidad total de envíos que la API le dijo que hay.
                    setTotalItems(response.data.paging?.total || 10000);

                } else {
                    // Si la API respondió pero algo no fue 'success', marca un error y limpia los datos.
                    setError(response.data?.message || "Error desconocido al obtener datos de envíos.");
                    setData([]);
                    setTotalItems(0);
                }

            } catch (err: any) {
                // Si hubo un problema al intentar hablar con la API (error de internet, permiso negado, etc.)
                console.error("Error en la obtención de envíos con axios:", err);

                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 401 || err.response.status === 403) {
                        setError(err.response.data?.message || "Acceso no autorizado. Inicia sesión de nuevo.");
                    } else {
                        setError(err.response.data?.message || `Error de la API: ${err.response.status}`);
                    }
                } else {
                    setError(err.message || "Error de internet al obtener datos de envíos.");
                }
                // Limpia los datos y el total si hay error.
                setData([]);
                setTotalItems(0);
            } finally {
                // Termine bien o mal, ya no está cargando.
                setLoading(false);
            }
        };

        // Solo empieza a buscar si tiene el ID del cliente y le han dado números de página válidos.
        if (clientId && page >= 1 && perPage >= 1) {
            fetchShipments(clientId, page, perPage, year, month);
        } else if (localStorage.getItem("conexionSeleccionada") === null) {
             // Si no encontró la conexión del cliente, marca un error.
             setError("No hay conexión seleccionada para obtener envíos.");
             setLoading(false);
             setTotalItems(0);
        } else {
             // Si no tiene el ID del cliente (pero sí había algo en storage), limpia y espera.
             if (!clientId) {
                    setLoading(true);
                    setError(null);
                    setData([]);
                    setTotalItems(0);
             }
        }

    }, [clientId, page, perPage, year, month]); // Esto se repite si cambia el ID del cliente o la info de la página/fecha.

    // Le da a quien use este hook la lista de envíos, si está cargando, si hay error y el total.
    return { data, loading, error, totalItems };
};

export default useObtenerEnviosPorCliente;