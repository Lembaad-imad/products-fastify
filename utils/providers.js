const BASE_URL = 'http://localhost:4000/api';
const ZONE = 'casablanca';

export const providers = Array.from({ length: 10 }, (_, i) => ({
  id: `s${i + 1}`,
  url: `${BASE_URL}/s${i + 1}/products?zone=${ZONE}`,
}));