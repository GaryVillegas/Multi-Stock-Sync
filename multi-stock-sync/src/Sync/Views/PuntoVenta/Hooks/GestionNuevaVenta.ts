import { useState, useCallback, useMemo } from 'react';
export interface ItemVenta {
  key: React.Key;
  idProducto: string | number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}
export interface NotaVentaActual {
  items: ItemVenta[];
  idCliente?: string | number | null;
  observaciones?: string;
}
interface ProductoParaAgregar {
    id: string | number;
    title: string;
    price?: number;
}
interface EstadoGuardadoNotaVenta {
    guardando: boolean;
}
interface ErrorGuardadoNotaVenta {
    guardando?: string;
}
export const useGestionNotaVentaActual = () => {
  const [notaVenta, setNotaVenta] = useState<NotaVentaActual>({
    items: [],
    observaciones: '',
  });
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardadoNotaVenta>({ guardando: false });
  const [errorGuardado, setErrorGuardado] = useState<ErrorGuardadoNotaVenta>({});
  const subtotal = useMemo(() => {
      return notaVenta.items.reduce((sum, item) => sum + item.total, 0);
  }, [notaVenta.items]);
    const total = useMemo(() => {
        return subtotal;
    }, [subtotal]);
    const agregarItem = useCallback((producto: ProductoParaAgregar) => {
        const indexItemExistente = notaVenta.items.findIndex(item => String(item.idProducto) === String(producto.id));
        if (indexItemExistente > -1) {
            const itemsActualizados = notaVenta.items.map((item, index) => {
                if (index === indexItemExistente) {
                    const nuevaCantidad = item.cantidad + 1;
                    const nuevoTotal = nuevaCantidad * item.precioUnitario;
                    return { ...item, cantidad: nuevaCantidad, total: nuevoTotal };
                }
                return item;
            });
            setNotaVenta(prev => ({ ...prev, items: itemsActualizados }));
        } else {
            if (producto.price === undefined || producto.price === null) {
                console.error("Error al agregar producto: Precio unitario no válido.", producto);
                return;
            }
            const nuevoItem: ItemVenta = {
                key: `${producto.id}-${Date.now()}`,
                idProducto: producto.id,
                nombre: producto.title,
                precioUnitario: producto.price,
                cantidad: 1,
                total: producto.price,
            };
            setNotaVenta(prev => ({
                ...prev,
                items: [...prev.items, nuevoItem],
            }));
        }
    }, [notaVenta.items]);
    const actualizarCantidadItem = useCallback((key: React.Key, cantidad: number | null) => {
        const nuevaCantidad = Math.max(0, cantidad || 0);
        const itemsActualizados = notaVenta.items.map(item => {
            if (item.key === key) {
                const nuevoTotal = nuevaCantidad * item.precioUnitario;
                return { ...item, cantidad: nuevaCantidad, total: nuevoTotal };
            }
            return item;
        }).filter(item => item.cantidad > 0);
        setNotaVenta(prev => ({ ...prev, items: itemsActualizados }));
    }, [notaVenta.items]);
    const eliminarItem = useCallback((key: React.Key) => {
        const nuevosItems = notaVenta.items.filter(item => item.key !== key);
        setNotaVenta(prev => ({ ...prev, items: nuevosItems }));
    }, [notaVenta.items]);
    const establecerIdCliente = useCallback((idCliente?: string | number | null) => {
        setNotaVenta(prev => ({
            ...prev,
            idCliente: (idCliente === null || idCliente === undefined) ? null : idCliente
        }));
    }, []);
    const establecerObservaciones = useCallback((observaciones: string) => {
        setNotaVenta(prev => ({ ...prev, observaciones }));
    }, []);
    const limpiarNotaVenta = useCallback(() => {
        setNotaVenta({ items: [], observaciones: '' });
    }, []);
    const guardarNotaVenta = useCallback(async (tipo: 'draft' | 'final') => {
        setEstadoGuardado({ guardando: true });
        setErrorGuardado({});
        if (notaVenta.items.length === 0) {
            alert('Debe agregar productos a la venta para guardarla.');
            setEstadoGuardado({ guardando: false });
            return;
        }
        const datosAGuardar = {
            items: notaVenta.items.map(item => ({
                idProducto: item.idProducto,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
            })),
            idCliente: notaVenta.idCliente || null,
            observaciones: notaVenta.observaciones || null,
            estado: tipo === 'draft' ? 'Borrador' : 'Finalizada',
            tipoDocumento: 'Nota de Venta',
            subtotal: subtotal,
            total: total,
        };
        console.log(`Intentando guardar como ${tipo}:`, datosAGuardar);
        try {
            // const response = await fetch('/api/sales-orders', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(datosAGuardar),
            // });
            // if (!response.ok) {
            //      const errorData = await response.json();
            //      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            // }
            // const resultado = await response.json();
            console.log(`Respuesta simulada de guardado (${tipo}): Éxito`);
            alert(`${tipo === 'draft' ? 'Borrador' : 'Nota de Venta'} guardada con éxito.`);
            if (tipo === 'final') {
                limpiarNotaVenta();
            }
        } catch (err: any) {
            console.error(`Error al guardar ${tipo}:`, err);
            setErrorGuardado({ guardando: err.message || `Error al guardar ${tipo}` });
            alert(`Hubo un error al guardar la ${tipo === 'draft' ? 'borrador' : 'nota de venta'}.`);
        } finally {
            setEstadoGuardado({ guardando: false });
        }
    }, [notaVenta, subtotal, total, limpiarNotaVenta]);
    return {
        notaVenta,
        subtotal,
        total,
        cargandoGuardado: estadoGuardado.guardando,
        errorGuardado: errorGuardado.guardando,
        agregarItem,
        actualizarCantidadItem,
        eliminarItem,
        establecerIdCliente,
        establecerObservaciones,
        guardarBorrador: () => guardarNotaVenta('draft'),
        generarNotaVentaFinal: () => guardarNotaVenta('final'),
        limpiarNotaVenta,
    };
};
export default useGestionNotaVentaActual;