import axios from 'axios';
import axiosInstance from '../../../../axiosConfig';
import { ClientFormData, ClientType, client } from '../Types/clienteTypes';


// funcion que registra un cliente en la API
export const registrarClienteService = {
  async registerClient(
    clientData: ClientFormData,
    clienteType: ClientType
  ): Promise<client> {
    try {
      console.log("clientData: ", clientData);
      //se le agrega el tipo de cliente al cliente a regitrar quue esta en clentData
      clientData.tipo_cliente_id = clienteType;
      const url = `${import.meta.env.VITE_API_URL}/create-new-client`;
      const response = await axiosInstance.post(url, clientData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      //se devuelve para ser usado en el hook
      return response.data;
    } catch (error) {
      console.error("Error detallado al registrar cliente:", error);

      if (axios.isAxiosError(error)) {
        // Capturar información detallada del error
        const status = error.response?.status;
        const responseData = error.response?.data;

        console.error(`Error HTTP ${status}:`, responseData);

        // Error detallado según el código de estado
        if (status === 401 || status === 403) {
          throw new Error("Error de autenticación: Verifique sus credenciales");
        } else if (status === 422) {
          // Error de validación
          const validationMessage =
            responseData?.message ||
            "Error de validación en los datos del cliente";
          throw new Error(validationMessage);
        } else if (status === 500) {
          throw new Error(
            "Error interno del servidor: Contacte al administrador"
          );
        } else {
          throw new Error(
            responseData?.message || "Error al registrar cliente"
          );
        }
      }

      throw new Error("Error desconocido al registrar cliente");
    }
  },
};
