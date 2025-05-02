import { useState, useEffect } from 'react';
import axiosInstance from "../../../../axiosConfig";// Asegúrate de que la ruta de importación sea correcta
import axios from 'axios'; // Importa axios para el manejo de errores

export interface ProductoAPI {
  id: number | string;
  title: string;
  order: number;
  available_quantity: number;
  warehouse_name: string;
  company_name: string;
  client_id: number | string;
  price: number;
}

export const useProductosPorEmpresa = (idEmpresa?: string | number | null) => {
  const [productos, setProductos] = useState<ProductoAPI[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState<boolean>(false);
  const [errorProductos, setErrorProductos] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (idEmpresa !== undefined && idEmpresa !== null) {
      const cargarProductos = async () => {
        setCargandoProductos(true);
        setErrorProductos(undefined);
        try {
          // Usa la URL relativa a la baseURL configurada
          const url = `products-by-company`; // Endpoint es solo 'products-by-company'
          // Pasa el ID de empresa como parámetro de consulta 'company_id'
          const response = await axiosInstance.get(url, {
              params: { company_id: idEmpresa }
          });

          // --- Verifica que la respuesta tenga el formato esperado: { message: ..., data: [...] } ---
          if (!response.data || !Array.isArray(response.data.data)) {
               console.error("Formato inesperado en respuesta de productos:", response.data);
               // Lanza un error si el formato no es el esperado
               throw new Error("Formato de respuesta de productos inesperado: La API no devolvió los datos esperados.");
          }
          const data: { message: string, data: ProductoAPI[] } = response.data;
          const productosRecibidos = data.data;
          // ------------------------------------------------------------------------------------------


          setProductos(productosRecibidos); // Actualiza con la lista de productos

        } catch (err: any) {
          console.error(`Error al cargar productos para empresa ${idEmpresa}:`, err);
           let errorMessage = `Error al cargar productos para empresa ${idEmpresa}.`;

          if (axios.isAxiosError(err)) {
              if (err.response) {
                   // Error de respuesta del servidor (ej: 401, 404, 500)
                  errorMessage = err.response.data?.message || `Error del servidor: ${err.response.status}`;
                   // Si el error es 401 o 403, el mensaje de 'Acceso no autorizado' es útil
                   if (err.response.status === 401 || err.response.status === 403) {
                       errorMessage = "Acceso no autorizado para cargar productos. Verifica tu token y la conexión seleccionada.";
                   }
              } else if (err.request) {
                   // La petición fue hecha pero no se recibió respuesta (error de red, CORS, etc.)
                   errorMessage = 'Error de red: No se recibió respuesta del servidor al cargar productos.';
              } else {
                   // Algo pasó al configurar la petición
                   errorMessage = err.message || 'Error al configurar la petición.';
              }
          } else {
               // Otros tipos de errores (como el que lanzamos si el formato es incorrecto)
               errorMessage = err.message || 'Error inesperado en la carga de productos.';
          }


          setErrorProductos(errorMessage);
          setProductos([]); // <--- Asegura que el estado siempre sea un array vacío en caso de error
        } finally {
          setCargandoProductos(false);
        }
      };

      cargarProductos();
    } else {
      setProductos([]); // Limpiar productos si no hay ID de empresa
      setErrorProductos(undefined); // Limpiar error si no hay ID de empresa
    }

  }, [idEmpresa]);

  return {
    productos,
    cargandoProductos,
    errorProductos,
  };
};

export default useProductosPorEmpresa;