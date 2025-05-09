
export interface Envio {
  order_id: string;
  shipping_id: string;
  id_producto:string;
  fecha_envio_programada: string;
  nombre_producto: string;
  cantidad: number;
  tamaño: string;
  sku: string;
  shipment_status: string;
  receptor:receptor;
}

export interface EnviosResponse {
  status: "success" | "error";
  data: Envio[];
  message?: string;
  total_envios?: number;
}
  

//envio en transito
export interface receptor{
  receiver_id: string;
  receiver_name: string;
  dirrection: string;
}


export interface EnviosTransitoResponse {
  status: "success" | "No hay envios en transito";
  data: Enviostransito[];
  message: Enviostransito[];
}
  
export interface Enviostransito {
  shipping_id: string;
  productId: string;
  order_id: string;
  title: string;
  quantity: number;
  size: string;
  shipment_history: ShipmentTransitoHistory;
  receptor: receptor; // receptor
  date_shipment: string;
  tracking_number: string;
  substatus:string;
}


export interface ShipmentTransitoHistory {
  substatus: string;
  date_created?: string;
}

