import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Spinner, Alert } from 'react-bootstrap';
import styles from './OpinionesClients.module.css';

interface Client {
  client_id: string;
  nickname: string;
}

interface Review {
  id: number;
  comment: string;
  rate: number | null;
  user_name?: string;
}

interface ProductReview {
  productTitle: string;
  review: Review;
}

const OpinionesClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.VITE_API_URL}/mercadolibre/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data.data);
    } catch {
      setError('Error al cargar los clientes.');
    }
  };

  const fetchProductsWithReviews = async (clientId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.VITE_API_URL}/reviews/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawData = response.data.data || {};
      const parsedReviews: ProductReview[] = [];

      Object.values(rawData).forEach((data: any) => {
        const title = data.product?.name ?? 'Producto sin nombre';
        const reviews = data.reviews || [];

        reviews.forEach((review: any) => {
          const rate = review?.rate ?? review.full_review?.rate ?? null;

          if (rate !== null) {
            parsedReviews.push({
              productTitle: title,
              review: {
                id: review.id,
                comment: review.comment,
                rate,
                user_name: review.user_name ?? 'Anónimo'
              }
            });
          }
        });
      });

      setReviewsList(parsedReviews);
    } catch (err) {
      console.error(err);
      setError('Error al cargar opiniones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchProductsWithReviews(selectedClient);
    }
  }, [selectedClient]);

  return (
    <Container className={styles.container}>
      <h2 className={styles.title}>Opiniones de Clientes</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className={styles.selectWrapper}>
        <Form.Label>Selecciona una tienda:</Form.Label>
        <Form.Select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Selecciona --</option>
          {clients.map((client) => (
            <option key={client.client_id} value={client.client_id}>
              {client.nickname}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <div className={styles.grid}>
          {reviewsList.map((entry, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.header}>
                <span className={styles.client}>{entry.review.user_name}</span>
                <span className={styles.product}>{entry.productTitle}</span>
              </div>
              <div className={styles.comment}>
                {entry.review.comment || 'Sin comentario'}
              </div>
              <div className={styles.rating}>
                {entry.review.rate !== null ? `${entry.review.rate} / 5` : 'No disponible'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default OpinionesClients;
