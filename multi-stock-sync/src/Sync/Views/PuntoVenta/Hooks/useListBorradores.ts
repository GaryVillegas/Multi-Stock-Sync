import { useState, useEffect } from 'react';

import { ListVentaService, } from '../Services/listVentaService';
import { VentaResponse,FiltrosBackend } from '../Types/ventaTypes';
import { ItemVenta } from './GestionNuevaVenta';
//datos a los que travez se va a filtrar


export const useListVentas = () => {
  const [allData, setAllData] = useState<VentaResponse[]>([]);
  const [data, setData] = useState<VentaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [clientId, setClientId] = useState<string>("");

  // funcion para traer los datos desde el service y setear el loading y el error
  const listBorradores = async (filtros: FiltrosBackend = {}) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log(allData)
      setClientId(JSON.parse(localStorage.getItem("conexionSeleccionada") || "{}")?.client_id);

      if (!clientId) {
        throw new Error("No hay conexión seleccionada");
      }
      console.log("filtros en hook:", filtros);
      const response = await ListVentaService.getListVenta(clientId,filtros);
      // Ensure we're working with an array
      const ventasData = Array.isArray(response) ? response : [];

      setAllData(ventasData);
      setData(ventasData);


      // datos hardcode cargados de la constante mockData en service

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido al cargar las ventas'));
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoading(false);
    }
  };




  const resetSuccess = () => {
    setSuccess(false);
  };
  // Cargar datos al iniciar
  useEffect(() => {
    listBorradores();
  }, []);

  return {
    data,
    loading,
    error,
    success,
    clientId,
    resetSuccess,
    refetch: listBorradores,
  };
};
