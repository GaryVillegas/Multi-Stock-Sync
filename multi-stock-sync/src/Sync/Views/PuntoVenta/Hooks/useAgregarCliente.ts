import { useState } from 'react';
import { registrarClienteService } from '../Services/agregarClienteService';
import { ClientFormData, ClientType } from '../Types/clienteTypes';

//hook par agregar cliente
export const UseAgregarCliente = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

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
            setError(errorMessage);

            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { 
        registerNewClient, 
        isLoading, 
        error,
        success,
        clearError: () => setError(null),
        clearSuccess: () => setSuccess(false)
    };
};