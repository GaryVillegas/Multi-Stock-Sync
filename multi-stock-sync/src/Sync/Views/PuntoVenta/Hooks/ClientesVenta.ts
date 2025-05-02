import { useState, useEffect, useCallback } from 'react';
import axiosInstance from "../../../../axiosConfig"; 
import axios from 'axios'; 

export interface ClienteAPI {
  id: number | string;
  tipo_clientes_id: number;
  extranjero: number;
  rut: string;
  razon_social: string | null;
  giro: string | null;
  comuna: string | null;
  direccion: string | null;
  apellicos: string | null;
  nombre: string | null;
  region: string | null;
  ciudad: string | null;
  created_at: string;
  updated_at: string;
}

export const useClientes = () => {
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState<boolean>(false);
  const [errorClientes, setErrorClientes] = useState<string | undefined>(undefined);

  const cargarClientes = useCallback(async () => {
    setCargandoClientes(true);
    setErrorClientes(undefined);
    try {
      const response = await axiosInstance.get(`clients-all`); 
      if (!Array.isArray(response.data)) {
           console.error("Formato inesperado en respuesta de clientes:", response.data);
          throw new Error("Formato de respuesta de clientes inesperado: La API no devolvió una lista de clientes.");
      }
      const data: ClienteAPI[] = response.data;
      // ---------------------------------------------------

      setClientes(data); // Si todo va bien, actualiza con la lista de clientes

    } catch (err: any) {
      console.error("Error al cargar clientes:", err);
      let errorMessage = 'Error desconocido al cargar clientes.';

      if (axios.isAxiosError(err)) {
          if (err.response) {
              // Error de respuesta del servidor (ej: 401, 404, 500)
              errorMessage = err.response.data?.message || `Error del servidor: ${err.response.status}`;
              // Si el error es 401 o 403, el mensaje de 'Acceso no autorizado' es útil
              if (err.response.status === 401 || err.response.status === 403) {
                  errorMessage = "Acceso no autorizado para cargar clientes. Verifica tu token.";
              }
          } else if (err.request) {
              // La petición fue hecha pero no se recibió respuesta (error de red, CORS, etc.)
              errorMessage = 'Error de red: No se recibió respuesta del servidor al cargar clientes.';
          } else {
              // Algo pasó al configurar la petición
              errorMessage = err.message || 'Error al configurar la petición.';
          }
      } else {
           // Otros tipos de errores (como el que lanzamos si el formato es incorrecto)
           errorMessage = err.message || 'Error inesperado en la carga de clientes.';
      }

      setErrorClientes(errorMessage);
      setClientes([]); // <--- Asegura que el estado siempre sea un array vacío en caso de error
    } finally {
      setCargandoClientes(false);
    }
  }, [setClientes, setCargandoClientes, setErrorClientes]);

  useEffect(() => {
       cargarClientes();
  }, [cargarClientes]);

  return {
    clientes,
    cargandoClientes,
    errorClientes,
    recargarClientes: cargarClientes
  };
};

export default useClientes;