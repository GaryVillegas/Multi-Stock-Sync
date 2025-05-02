import { useState, useEffect } from "react";
import axiosInstance from "../../../../axiosConfig";

// Esto es cómo esperamos que se vean los detalles de un envío que pedimos.
export interface ShipmentDetails {
    // Información de la persona que recibe (su nombre, etc.).
    receptor?: {
        receiver_id?: number;
        receiver_name?: string;
    };
    // Un registro de cómo ha ido cambiando el estado del envío.
    status_history?: {
        date_shipped?: string; // Cuándo se envió.
        date_returned?: string | null; // Cuándo se devolvió (si pasó).
    };
    status?: string; // El estado actual del envío (como "entregado").
}

// Esto dice qué cosas te va a dar el hook.
interface UseObtenerDetallesEnvioResult {
    details: ShipmentDetails | null; // Los detalles si todo sale bien, o nada si no.
    loadingDetails: boolean; // Si está trabajando para conseguir los detalles se mostrara la carga.
    errorDetails: string | null; // Un mensaje si algo salió mal, o nada si no.
}

// Este hook sirve para conseguir los detalles específicos de un envío.
// Necesita que le digas el ID del envío que quieres buscar.
const useObtenerDetallesEnvio = (shipmentId: string | null): UseObtenerDetallesEnvioResult => {
    // Aquí guardamos la información: los detalles, si está cargando y si hay un error.
    const [details, setDetails] = useState<ShipmentDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null); // También guardamos el ID del cliente.

    // Primero, busca el ID del cliente guardado en la computadora (localStorage).
    useEffect(() => {
        try {
            const conexionSeleccionada = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}");
            setClientId(conexionSeleccionada?.client_id || null);
        } catch (e) {
            console.error("Error al parsear conexionSeleccionada de localStorage:", e);
            setClientId(null);
        }
    }, []); // Esto se hace solo una vez al principio.

    // Después, cuando ya sabe el ID del cliente y el ID del envío que le pediste...
    useEffect(() => {
        // Crea una función para ir a buscar esos detalles a la API.
        const fetchDetails = async (id: string, shipmentId: string) => {
            setLoadingDetails(true); // Esto dice que si ya empezó a buscar (está cargando).
            setErrorDetails(null); // Quita errores viejos.
            setDetails(null); // Quita detalles viejos.

            // Busca el permiso (token) para hablar con la API.
            const token = localStorage.getItem("token");

            // Si no hay permiso, no puede buscar. Marca un error y se detiene.
            if (!token) {
                setErrorDetails("Token de autenticación no disponible para detalles.");
                setLoadingDetails(false);
                return;
            }

            // Si no le dieron un ID de envío o no tiene el ID del cliente, no hace nada.
            if (!shipmentId || !id) {
                setLoadingDetails(false);
                return;
            }

            // Arma la dirección exacta para ir a pedirle los detalles a la API (Apartado del Endpoint).
            const endpointUrl = `${import.meta.env.VITE_API_URL}/mercadolibre/information-dispatch-delivered/${id}/${shipmentId}`;

            try {
                // Va y le pregunta a la API! Le muestra el permiso.
                const response = await axiosInstance.get(
                    endpointUrl,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                // Si la API respondió bien (status 'success') y le dio datos...
                if (response.data && response.data.status === "success" && response.data.data) {
                    // Guarda los detalles que la API le dio.
                    setDetails(response.data.data as ShipmentDetails);
                } else {
                    // Si la API respondió pero algo no salió bien, marca un error y te lo mostrara en pantalla.
                    setErrorDetails(response.data?.message || "Error al obtener detalles del envío (respuesta exitosa pero con status no 'success').");
                    setDetails(null);
                }

            } catch (err: any) {
                // Si hubo un problema al intentar hablar con la API (error de internet, etc.)...
                console.error(`Error fetching details for shipment ${shipmentId}:`, err);
                setErrorDetails(err.message || "Error de red o HTTP al obtener detalles del envío.");
                setDetails(null);
            } finally {
                // Termine bien o mal, ya no está cargando.
                setLoadingDetails(false);
            }
        };

        // Solo empieza a buscar si ya tiene el ID del cliente y el ID del envío.
        if (clientId && shipmentId) {
            fetchDetails(clientId, shipmentId);
        } else {
             // Si falta el ID del cliente o del envío, reinicia y no carga.
             setDetails(null);
             setLoadingDetails(false);
             setErrorDetails(null);
        }

    }, [clientId, shipmentId]); // Esto se repite si cambian el ID del cliente o el ID del envío que busca.

    // Le da a quien use este hook la información que tiene: los detalles, si está cargando y si hay un error.
    return { details, loadingDetails, errorDetails };
};

export default useObtenerDetallesEnvio;