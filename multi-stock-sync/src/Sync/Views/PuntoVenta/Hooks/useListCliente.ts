import { useState, useEffect } from "react";
import { ClientFormData, ClientType, client } from "../Types/clienteTypes";
import { ListClienteService } from "../Services/listClienteService";
import { registrarClienteService } from "../Services/agregarClienteService";
/**
 * Tipo de error para el hook useEnviosTransito
 */
export type ClientesError = {
  message: string;
  type: 'network' | 'server' | 'auth' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high';
};

/**
 * Hook para gestionar la obtención y estado de los Clientes 
 */
export const useListCliente = () => {
  const [data, setData] = useState<client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ClientesError |  null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorCliente,setErrorCliente] = useState<string | null>(null)

  /**
   * Clasifica un error en una estructura ClientesError para mejor manejo en la UI
   */
  const classifyError = (error: Error): ClientesError => {
    const message = error.message.toLowerCase();

    if (message.includes("404")) {
      return {
        message: "Error en el servidor. Por favor contacte al soporte técnico.",
        type: "server",
        severity: "high",
      };
    }

    if (message.includes("301")) {
      return {
        message: "Seleccione una conexión válida",
        type: "validation",
        severity: "medium",
      };
    }

    if (message.includes("acceso denegado")) {
      return {
        message: "No tiene permisos para acceder a esta información",
        type: "auth",
        severity: "high",
      };
    }

    return {
      message: error.message,
      type: "unknown",
      severity: "medium",
    };
  };

  /**
   * Obtiene los Clientes desde el servidor
   */
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);

    try {
      //llamamos a la la funcion del service para obtener los datos
      const response = await ListClienteService.getListCliente();
     
      setData(response);
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error("Error desconocido");
      setError(classifyError(errorObj));
    } finally {
      setLoading(false);
    }
  };

  const registerNewClient = async (clientData: ClientFormData, clienteType: ClientType) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // registrar cliente con el servicio registrarClienteService que llama a a la api
      const registeredClient = await registrarClienteService.registerClient(
        clientData,
        clienteType
      );

      setSuccess(true);
      return registeredClient;
    } catch (err) {
        console.log("Error en useAgregarCliente:", err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setErrorCliente(errorMessage);

        throw err;
    } finally {
        setIsLoading(false);
    }
};
  //aqui se llama a la funcion para cargar los datos
  useEffect(() => {
    fetchClientes();
  }, []);
  //retorna los datos
  return {
    clientes: data,
    loadCliente: loading,
    errorListCliente: error,
    errorCliente,
    isLoading,
    success,
    registerNewClient,
    refetch: fetchClientes,
    clearError: () => setError(null),
  };
};