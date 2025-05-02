import { useState, useEffect } from "react";
import axiosInstance from "../../../../axiosConfig";
import axios from "axios";

// Esto es cómo se ve la información que nos da la API.
interface ShipmentToday {
    id: string; // digito para identificar el producto en el envío.
    estimated_handling_limit: string; // La hora máxima para despachar hoy.
    shipping_date: string; // Podría decir "aún no despachado" o la fecha.
    direction: string; // La calle y número de destino.
    receiver_name: string; // El nombre de la persona que recibe.
    order_id: string; // El número de la orden de Mercado Libre.
    product: string; // El nombre del producto.
    quantity: number; // Cuántas unidades son.
}

// Esto dice qué cosas nos va a entregar el hook.
interface UseObtenerEnviosHoyResult {
    data: ShipmentToday[]; // La lista de envíos de hoy, o una lista vacía si no hay o hay error xd.
    loading: boolean; // Si está trabajando para traer la lista aparecera la carga.
    error: string | null; // Un mensaje si algo salió mal, o nada si todo va bien.
}

// Este es el hook que busca los envíos que se deben despachar hoy para un cliente.
// No necesita que le des nada al usarlo, él se las arregla solito.
const useObtenerEnviosHoy = (): UseObtenerEnviosHoyResult => {
    // Lo que viene guardamos la lista de envíos, si está cargando y si hay un error.
    const [data, setData] = useState<ShipmentToday[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null); // También guarda el ID del cliente.

    // Primero, busca el ID del cliente guardado en la computadora.
    // Si lo encuentra, lo guarda. Si no, marca un error.
    useEffect(() => {
        try {
            const conexionSeleccionada = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}");
            if (conexionSeleccionada?.client_id) {
                 setClientId(conexionSeleccionada.client_id);
            } else {
                 setError("No se encontró un ID de cliente en la computadora.");
                 setLoading(false);
            }
        } catch (e) {
            console.error("Error al parsear conexionSeleccionada de localStorage:", e);
            setError("Error al leer la información del cliente.");
            setLoading(false);
        }
    }, []); // Esto se hace solo una vez al principio.

    // Después, cuando ya sabe el ID del cliente
    useEffect(() => {
        // Crea una función para ir a buscar la lista de envíos de hoy a la API.
        const fetchShipments = async (id: string) => {
            // Dice que ya empezó a buscar (está cargando = setloading).
            setLoading(true);
            setError(null); // Quita errores viejos.
            setData([]); // Quita datos viejos.

            // Busca el token necesario para hablar con la API.
            const token = localStorage.getItem("token");

            // Si no hay permiso, no puede buscar. Marca un error y se detiene.
            if (!token) {
                setError("No tienes permiso para ver esto. Inicia sesión de nuevo.");
                setLoading(false);
                return;
            }

            try {
                // ¡Va y le pregunta a la API por los envíos de hoy de ese cliente! Le muestra el permiso.
                const response = await axiosInstance.get(
                    `${import.meta.env.VITE_API_URL}/mercadolibre/dispatch-estimated-limit/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                // Si la API respondió bien (status 'success') y le dio datos...
                if (response.data && response.data.status === "success") {
                    // Guarda la lista de envíos que la API le dio.
                    setData(response.data.data || []);
                } else {
                    // Si la API respondió pero algo no fue 'success', marca un error.
                    setError(response.data?.message || "Error al obtener envíos de hoy.");
                    setData([]);
                }

            } catch (err: any) {
                // Si hubo un problema al intentar hablar con la API (error de internet, permiso negado, etc.)...
                console.error("Error en la obtención de envíos de hoy con axios:", err);

                if (axios.isAxiosError(err)) {
                    if (err.response) {
                        if (err.response.status === 401 || err.response.status === 403) {
                             setError(err.response.data?.message || "Acceso no autorizado. Inicia sesión de nuevo.");
                        } else if (err.response.status === 404) {
                             // Si dice 404, puede ser que no haya envíos para hoy, no es un error grave.
                             console.log("No hay envíos para despachar hoy.", err.response.data);
                             setData([]); // Lista vacía
                             setError(null); // No es un error rojo
                        }
                         else {
                            setError(err.response.data?.message || `Error de la API: ${err.response.status}`);
                        }
                    } else {
                        // Error antes de que la API responda (problema de internet).
                        setError(err.message || "Error de internet al obtener envíos de hoy.");
                    }
                } else {
                    // Otro error inesperado.
                    setError("Ocurrió un error inesperado al obtener los envíos.");
                }
                 // Si hubo un error (que no sea 404), se asegura de que la lista esté vacía.
                 if (!(axios.isAxiosError(err) && err.response && err.response.status === 404)) {
                    setData([]);
                 }
            } finally {
                // Termine bien o mal, ya no está cargando.
                setLoading(false);
            }
        };

        // Solo empieza a buscar si es que ya tiene el ID del cliente.
        if (clientId) {
            fetchShipments(clientId);
        }

    }, [clientId]); // Esto se repite si cambia el ID del cliente.

    // Le da a quien use este hoook la información que tiene: la lista de envíos, si está cargando y si hay un error.
    return { data, loading, error };
};

export default useObtenerEnviosHoy;