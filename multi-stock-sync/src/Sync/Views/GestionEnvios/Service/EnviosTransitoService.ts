import axiosInstance from "../../../../axiosConfig";
import axios from "axios";
import {  EnviosTransitoResponse } from "../Types/EnviosProximos.Type";

/**
 * Servicio para gestionar operaciones relacionadas con envíos próximos
 */
export const enviosTransitoService = {
  /**
   * Obtiene los envíos próximos desde la API
   * clientId - ID del cliente para el cual se obtienen los envíos
   * @returns {Promise<EnviosResponse>} Respuesta con datos de envíos o mensaje de error
   */
  async fetchAviableReception(clientId: string): Promise<EnviosTransitoResponse> {
    try {
      const url = `${import.meta.env.VITE_API_URL}/mercadolibre/available-for-reception/${clientId}`;
      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      // Si la respuesta tiene datos, devolver la respuesta tal como está
      if (!response.data) {
        throw new Error("Error en la estructura de la respuesta.");
      }
      console.log("response.data:", response.data);
      // Si la respuesta está vacía o no tiene el formato esperado
      return response.data;
    } catch (error) {
      console.error("Error en fetchAviableReception:", error);

      // Manejo específico para errores de Axios
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        console.log(error.response?.status);
        // No hay envíos disponibles (esto no debería ser un error, sino un estado válido)
        // Errores comunes de HTTP
        if (status === 401) {
          throw new Error("401");
        }
        
        if (status === 403) {
          throw new Error("403");
        }
        
        if (status === 404) {
          throw new Error("404");
        }
        
        if (status === 500) {
          throw new Error("500");
        }
        
        // Otros errores con respuesta del servidor
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
      }

      // Error genérico (posiblemente de red)
      throw new Error("Error inesperado al obtener envíos próximos");
    }
  },
};