import { useState, useEffect } from "react";
import styles from "./HomeBodega.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWarehouse,
  faMapPin,
  faCalendarPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import ToastComponent from "../../../../Components/ToastComponent/ToastComponent";
import { LoadingDinamico } from "../../../../../components/LoadingDinamico/LoadingDinamico";
import { Warehouse } from "../../Types/warehouse.type";
import { useWarehouseManagement } from "../../Hooks/useWarehouseManagement";
import DropdownFilter from "../../Components/dropdownFilter";

const HomeBodega = () => {
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("");
  const { fetchWarehouses, warehouses, loading, error } =
    useWarehouseManagement();

  useEffect(() => {
    //Traer todas las bodegas
    fetchWarehouses(); //Función que trae las bodegas desde useWarehouseManagement
  }, []);

  useEffect(() => {
    let filtered = warehouses || [];

    if (companyFilter) {
      filtered = filtered.filter(
        (warehouse) => warehouse.company?.name === companyFilter
      );
    }

    if (sortOrder === "asc") {
      filtered = filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOrder === "desc") {
      filtered = filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setFilteredWarehouses(filtered);
  }, [warehouses, companyFilter, sortOrder]);

  const companyOptions = [
    { value: "", label: "Todas" },
    ...Array.from(new Set(warehouses.map((w) => w.company?.name || "")))
      .filter((name) => name) // Filter out empty names
      .map((company) => ({
        value: company,
        label: company,
      })),
  ];

  const sortOptions = [
    { value: "", label: "Sin ordenar" },
    { value: "asc", label: "Ascendente" },
    { value: "desc", label: "Descendente" },
  ];

  useEffect(() => {
    if (error) {
      setShowToast(true);
    }
  }, [error]);

  if (loading) {
    return <LoadingDinamico variant="fullScreen" />;
  }

  return (
    <div className="container-fluid bg-body-tertiary h-100">
      <h1 className={styles.title}>Lista de bodegas</h1>
      <div className={styles.menu}>
        <DropdownFilter
          id="companyFilter"
          label="Filtrar por compañía:"
          value={companyFilter}
          options={companyOptions}
          onChange={(e) => setCompanyFilter(e.target.value)}
        />

        <DropdownFilter
          id="sortOrder"
          label="Ordenar por fecha de creación:"
          value={sortOrder}
          options={sortOptions}
          onChange={(e) => setSortOrder(e.target.value)}
        />

        <Link to="../crear" className={styles.create_button}>
          Crear Bodega
        </Link>
      </div>

      <div className={styles.format_container}>
        {filteredWarehouses.length > 0
          ? filteredWarehouses.map((warehouse) => (
              <div className={styles.bodegas_box} key={warehouse.id}>
                <div className={styles.bodega_item}>
                  <Link
                    to={`../DetalleBodega/${warehouse.id}`}
                    className={styles.bodega_item_link}
                  >
                    <div className={styles.bodega_item_bg}></div>
                    <div className={styles.bodega_item_title}>
                      <FontAwesomeIcon icon={faWarehouse} /> {warehouse.name}
                    </div>
                    <div className={styles.bodega_item_date_box}>
                      <FontAwesomeIcon icon={faCalendarPlus} /> Actualizado:{" "}
                      <span className={styles.bodega_item_date}>
                        {new Date(warehouse.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.bodega_item_date_box}>
                      <FontAwesomeIcon icon={faMapPin} /> Ubicación:{" "}
                      <span className={styles.bodega_item_date}>
                        {warehouse.location}
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            ))
          : "hello"}
      </div>
      {showToast && (
        <ToastComponent
          message={error ? `Error: ${error}` : "No hay almacenes disponibles"}
          type={error ? "danger" : "success"}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default HomeBodega;
