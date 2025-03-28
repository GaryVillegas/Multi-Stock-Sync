import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../../axiosConfig"; // Importa la configuración de Axios
import { Container, Row, Col, Pagination, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { LoadingDinamico } from "../../../../../components/LoadingDinamico/LoadingDinamico";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import SearchBar from "./SearchBar";
import ConnectionDropdown from "./ConnectionDropdown";

interface Connection {
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  nickname: string;
  email: string;
  profile_image: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  thumbnail: string;
  site_id: string;
  title: string;
  seller_id: number;
  category_id: string;
  user_product_id: string;
  price: number;
  base_price: number;
  available_quantity: number;
  permalink: string;
  status: string;
}

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  product: Product | null;
  modalContent: "main" | "stock" | "pause";
  onUpdateStock: (
    productId: string,
    newStock: number,
    pause?: boolean
  ) => Promise<void>;
  onUpdateStatus: (productId: string, newStatus: string) => Promise<void>;
  onStockChange: (productId: string, newStock: number) => void;
  stockEdit: { [key: string]: number };
  fetchProducts: () => void;
  setModalContent: React.Dispatch<
    React.SetStateAction<"main" | "stock" | "pause">
  >;
}

const statusDictionary: { [key: string]: string } = {
  active: "Activo",
  paused: "Pausado",
  closed: "Cerrado",
  under_review: "En revisión",
  inactive: "Inactivo",
  payment_required: "Pago requerido",
  not_yet_active: "Aún no activo",
  deleted: "Eliminado",
};

const MySwal = withReactContent(Swal);

/**
 * HomeProducto component is the main component for managing and displaying products.
 */
/**
 * HomeProducto component is responsible for displaying and managing products.
 * It allows users to fetch, search, filter, and update products from MercadoLibre.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered HomeProducto component.
 *
 * @example
 * <HomeProducto />
 *
 * @remarks
 * This component uses various hooks to manage state and side effects, including:
 * - `useState` for managing local state.
 * - `useEffect` for fetching data on component mount and handling side effects.
 *
 * @function
 * @name HomeProducto
 *
 * @description
 * The component fetches connections and products from an API, allows searching and filtering products,
 * and provides functionalities to update product stock and status. It also handles pagination and displays
 * a modal for detailed product actions.
 *
 * @hook
 * @name useNavigate
 * @description Hook from `react-router-dom` for navigation.
 *
 * @hook
 * @name useState
 * @description Hook for managing local state.
 *
 * @hook
 * @name useEffect
 * @description Hook for performing side effects.
 *
 * @typedef {Object} Connection
 * @property {string} client_id - The client ID of the connection.
 * @property {string} access_token - The access token for the connection.
 *
 * @typedef {Object} Product
 * @property {string} id - The product ID.
 * @property {string} title - The product title.
 * @property {number} price - The product price.
 * @property {string} category_id - The category ID of the product.
 *
 * @state {Connection[]} connections - List of connections.
 * @state {string} selectedConnection - The currently selected connection.
 * @state {boolean} loading - Loading state for fetching products.
 * @state {Product[]} allProductos - List of all fetched products.
 * @state {boolean} loadingConnections - Loading state for fetching connections.
 * @state {string | null} toastMessage - Message to be displayed in a toast notification.
 * @state {'success' | 'warning' | 'error'} toastType - Type of the toast notification.
 * @state {{ [key: string]: number }} stockEdit - Object mapping product IDs to their edited stock values.
 * @state {boolean} isUpdating - State indicating if a product update is in progress.
 * @state {boolean} modalIsOpen - State indicating if the modal is open.
 * @state {{ [key: string]: boolean }} isEditing - Object mapping product IDs to their editing state.
 * @state {Product | null} currentProduct - The currently selected product for detailed actions.
 * @state {'main' | 'stock' | 'pause'} modalContent - The content type to be displayed in the modal.
 * @state {string} searchQuery - The current search query.
 * @state {string} selectedCategory - The currently selected category.
 * @state {number} limit - The limit of products per page.
 * @state {number} offset - The current offset for pagination.
 * @state {number} totalProducts - The total number of products.
 * @state {{ [key: string]: string }} categories - Object mapping category IDs to their names.
 * @state {Product | null} selectedProduct - The currently selected product.
 *
 * @method
 * @name fetchConnections
 * @description Fetches connections from the API.
 *
 * @method
 * @name fetchProducts
 * @description Fetches products from the API based on the selected connection, search query, limit, offset, and category.
 *
 * @method
 * @name fetchCategories
 * @description Fetches category names for the given products.
 *
 * @method
 * @name handleConnectionChange
 * @description Handles the change of the selected connection.
 *
 * @method
 * @name handleSearch
 * @description Handles the search query change and fetches products based on the query.
 *
 * @method
 * @name handleCategoryChange
 * @description Handles the change of the selected category.
 *
 * @method
 * @name handlePageChange
 * @description Handles the change of the current page for pagination.
 *
 * @method
 * @name handleStockChange
 * @description Handles the change of the stock value for a product.
 *
 * @method
 * @name updateStock
 * @description Updates the stock of a product.
 *
 * @method
 * @name updateStatus
 * @description Updates the status of a product.
 *
 * @method
 * @name openModal
 * @description Opens the modal for detailed product actions.
 *
 * @method
 * @name closeModal
 * @description Closes the modal.
 *
 * @method
 * @name formatPriceCLP
 * @description Formats a price value to Chilean Peso (CLP) currency format.
 *
 * @method
 * @name translateStatus
 * @description Translates a product status to a human-readable format.
 *
 * @method
 * @name categorizeProducts
 * @description Categorizes products based on their category IDs.
 *
 * @method
 * @name filterResults
 * @description Filters products based on the selected category.
 *
 * @method
 * @name onSelectSuggestion
 * @description Handles the selection of a search suggestion.
 */
const HomeProducto = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [loading, setLoading] = useState(false);
  const [allProductos, setAllProductos] = useState<Product[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warning" | "error">(
    "error"
  );
  const [stockEdit, setStockEdit] = useState<{ [key: string]: number }>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [modalContent, setModalContent] = useState<"main" | "stock" | "pause">(
    "main"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limit] = useState(35); // Updated limit to 35
  const [offset, setOffset] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<{ [key: string]: string }>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Add selectedProduct state

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await axiosInstance.get(
          `${process.env.VITE_API_URL}/mercadolibre/credentials`
        );
        setConnections(response.data.data);
      } catch (error) {
        console.error("Error fetching connections:", error);
        setToastMessage(
          (error as any).response?.data?.message || "Error fetching connections"
        );
        setToastType("error");
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      MySwal.fire({
        icon: toastType,
        title: toastMessage,
        showConfirmButton: false,
        timer: 3000,
      }).then(() => setToastMessage(null));
    }
  }, [toastMessage]);

  const handleConnectionChange = async (clientId: string) => {
    setSelectedConnection(clientId);
    setAllProductos([]);
    setCategories({});
    setSearchQuery("");
    setSelectedCategory("");
    setOffset(0);

    if (clientId === "") {
      return;
    }

    fetchProducts(clientId);
  };

  const fetchProducts = async (
    clientId: string,
    query: string = "",
    limit: number = 35,
    offset: number = 0,
    category: string = ""
  ) => {
    setLoading(true);
    try {
      const url = query
        ? `${process.env.VITE_API_URL}/mercadolibre/products/search/${clientId}`
        : `${process.env.VITE_API_URL}/mercadolibre/products/${clientId}`;
      const response = await axiosInstance.get(url, {
        params: { q: query, limit, offset, category },
      });
      setAllProductos(response.data.data);
      setTotalProducts(response.data.pagination.total);
      fetchCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setToastMessage(
        (error as any).response?.data?.message || "Error fetching products"
      );
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (products: Product[]) => {
    const categoryIds = Array.from(
      new Set(products.map((product) => product.category_id))
    );
    try {
      const categoriesMap: { [key: string]: string } = {};
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          const response = await axiosInstance.get(
            `https://api.mercadolibre.com/categories/${categoryId}`
          );
          categoriesMap[categoryId] = response.data.name;
        })
      );
      setCategories(categoriesMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setOffset(0);
    fetchProducts(selectedConnection, query, limit, 0);
  };

  /*const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };*/

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    fetchProducts(selectedConnection, searchQuery, limit, newOffset);
  };

  const handleStockChange = (productId: string, newStock: number) => {
    setStockEdit((prevStock) => ({
      ...prevStock,
      [productId]: newStock,
    }));
  };

  const updateStock = async (
    productId: string,
    newStock: number,
    pause: boolean = false
  ) => {
    setIsUpdating(true);
    try {
      const selectedConnectionData = connections.find(
        (connection) => connection.client_id === selectedConnection
      );

      if (!selectedConnectionData) {
        setToastMessage("Conexión no encontrada");
        setToastType("error");
        return;
      }

      const ACCESS_TOKEN = selectedConnectionData.access_token;
      const ITEM_ID = productId;

      console.log("Updating stock for product:", productId);
      console.log("New stock:", newStock);
      console.log("Pause:", pause);

      const response = await axiosInstance.put(
        `https://api.mercadolibre.com/items/${ITEM_ID}`,
        pause ? { status: "paused" } : { available_quantity: newStock },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("API response:", response.data);

      const successMessage = pause
        ? "Publicación pausada exitosamente."
        : "Stock actualizado correctamente";
      setToastMessage(successMessage);
      setToastType("success");
    } catch (error) {
      console.error("Error updating stock:", error);
      setToastMessage("Error al actualizar el stock");
      setToastType("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateStatus = async (productId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const selectedConnectionData = connections.find(
        (connection) => connection.client_id === selectedConnection
      );

      if (!selectedConnectionData) {
        setToastMessage("Conexión no encontrada");
        setToastType("error");
        return;
      }

      const ACCESS_TOKEN = selectedConnectionData.access_token;
      const ITEM_ID = productId;

      const response = await axiosInstance.put(
        `https://api.mercadolibre.com/items/${ITEM_ID}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const successMessage =
        newStatus === "paused"
          ? "Publicación pausada exitosamente."
          : "Publicación reanudada exitosamente.";
      setToastMessage(successMessage);
      setToastType("success");
      console.log(response.data);
    } catch (error) {
      console.error("Error updating status:", error);
      setToastMessage("Error al actualizar el estado");
      setToastType("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (product: Product) => {
    setCurrentProduct(product);
    setModalContent("main");
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentProduct(null);
  };

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(price);
  };

  const translateStatus = (status: string) => {
    return statusDictionary[status] || status;
  };

  const categorizeProducts = (products: Product[]) => {
    const categories: { [key: string]: Product[] } = {};
    products.forEach((product) => {
      if (!categories[product.category_id]) {
        categories[product.category_id] = [];
      }
      categories[product.category_id].push(product);
    });
    return categories;
  };

  /*const filterResults = (category: string) => {
  setSelectedCategory(category);
  setOffset(0);
  fetchProducts(selectedConnection, searchQuery, limit, 0, category);
  };*/

  const onSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    fetchProducts(selectedConnection, suggestion, limit, 0);
  };

  const categorizedProducts = categorizeProducts(allProductos);

  const totalPages = Math.ceil(totalProducts / limit);
  const currentPage = Math.floor(offset / limit);
  const maxPageNumbersToShow = 5;
  const startPage = Math.max(
    0,
    currentPage - Math.floor(maxPageNumbersToShow / 2)
  );
  const endPage = Math.min(totalPages, startPage + maxPageNumbersToShow);

  return (
    <>
      {(loadingConnections || loading || isUpdating) && (
        <LoadingDinamico variant="container" />
      )}
      <Container>
        {!loadingConnections && !loading && !isUpdating && (
          <section>
            <Row className="mb-3 mt-3">
              <Col>
                <h1>Productos</h1>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={4}>
                <ConnectionDropdown
                  connections={connections}
                  selectedConnection={selectedConnection}
                  onChange={handleConnectionChange}
                />
                <br />
                <p>
                  Por favor, seleccione una conexión para ver los productos.
                </p>
              </Col>
              <Col md={4}>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearch={handleSearch}
                  suggestions={[]}
                  onSelectSuggestion={onSelectSuggestion}
                />
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="primary"
                  onClick={() => navigate("/sync/productos/crear")}
                >
                  Crear Producto
                </Button>
              </Col>
            </Row>
            {!selectedConnection && <Row className="mb-3"></Row>}
            {selectedConnection && (
              <ProductTable
                categorizedProducts={categorizedProducts}
                categories={categories}
                isEditing={isEditing}
                stockEdit={stockEdit}
                onStockChange={handleStockChange}
                onUpdateStock={updateStock}
                onOpenModal={openModal}
                formatPriceCLP={formatPriceCLP}
                translateStatus={translateStatus}
                onUpdateStatus={updateStatus}
                onSelectProduct={setSelectedProduct}
                onEditProduct={(product) =>
                  console.log("Edit product", product)
                } // Add onEditProduct handler
              />
            )}
            <Row className="mt-3">
              <Col>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(offset - limit)}
                  disabled={offset === 0}
                >
                  Anterior
                </Button>
              </Col>
              <Col className="text-center">
                <Pagination>
                  {Array.from({ length: endPage - startPage }, (_, index) => (
                    <Pagination.Item
                      key={startPage + index}
                      active={startPage + index === currentPage}
                      onClick={() =>
                        handlePageChange((startPage + index) * limit)
                      }
                    >
                      {startPage + index + 1}
                    </Pagination.Item>
                  ))}
                </Pagination>
              </Col>
              <Col className="text-end">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(offset + limit)}
                  disabled={offset + limit >= totalProducts}
                >
                  Siguiente
                </Button>
              </Col>
            </Row>
          </section>
        )}
      </Container>

      <ProductModal
        show={modalIsOpen}
        onHide={closeModal}
        product={currentProduct}
        modalContent={modalContent}
        onUpdateStock={updateStock}
        onUpdateStatus={updateStatus}
        onStockChange={handleStockChange}
        stockEdit={stockEdit}
        fetchProducts={() =>
          fetchProducts(selectedConnection, searchQuery, limit, offset)
        }
        setModalContent={setModalContent}
      />
    </>
  );
};

export default HomeProducto;
