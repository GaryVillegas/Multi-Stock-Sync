import { useState, useEffect } from "react";
import { enviosTransitoService } from "../Service/EnviosTransitoService";
import { Enviostransito } from "../Types/EnviosProximos.Type";

/**
 * Tipo de error para el hook useEnviosTransito
 */
export type EnviosError = {
  message: string;
  type: 'network' | 'server' | 'auth' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high';
};

/**
 * Hook para gestionar la obtención y estado de los envíos próximos
 */
export const useEnviosTransito = () => {
  const [data, setData] = useState<Enviostransito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EnviosError | null>(null);

  /**
   * Clasifica un error en una estructura EnviosError para mejor manejo en la UI
   */
  const classifyError = (error: Error): EnviosError => {
    const message = error.message.toLowerCase();
    
    if (message.includes("500")) {
      return {
        message: "Error en el servidor. Por favor contacte al soporte técnico.",
        type: 'server',
        severity: 'high'
      };
    }
    
    if (message.includes("403")) {
      return {
        message: "Seleccione una conexión válida",
        type: 'validation',
        severity: 'medium'
      };
    }
    if(message.includes("404")){
      return{
        message: "Error, ruta no enctrada",
        type: 'auth',
        severity: 'high'
      }
    }
    
    if (message.includes("401")) {
      return {
        message: "No tiene permisos para acceder a esta información",
        type: 'auth',
        severity: 'high'
      };
    }
    
    return {
      message: error.message,
      type: 'unknown',
      severity: 'medium'
    };
  };

  /**
   * Obtiene los envíos próximos desde el servidor
   */
  const fetchEnvios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtiene el client_id de la conexión seleccionada
      const clientId = JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}")?.client_id;

      if (!clientId) {
        throw new Error("No hay conexión seleccionada");
      }

      const response = await enviosTransitoService.fetchAviableReception(clientId);
      
      if (response.status === "success") {
        setData(response.data);
      }else if(response.status === "No hay envios en transito"){
        setData([])
      } else {
        throw new Error("Error al procesar los envíos");
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Error desconocido");
      setError(classifyError(errorObj));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  return { 
    data, 
    loading, 
    error,
    refetch: fetchEnvios,
    clearError: () => setError(null) 
  };
};