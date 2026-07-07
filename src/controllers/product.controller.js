import * as productService from "../service/model.service.js";

export default {
  async listProducts(request, reply) {
    const nanostoreId = request.query.nanostoreId ?? null;
    const products = await productService.getAllProducts({ nanostoreId });
    return reply.code(200).send(products);
  },

  async getProduct(request, reply) {
    const product = await productService.getProductById(request.params.id);
    if (!product) {
      return reply.code(404).send({ error: "Produit introuvable" });
    }
    return reply.code(200).send(product);
  },

  async createProduct(request, reply) {
    const { productData, translations } = request.body;

    try {
      const product = await productService.createProduct({
        productData,
        translations,
        actor: {
          createdBy: request.user.id,
          createdByType: request.user.type ?? "admin", // à adapter selon ton modèle User
          changeSource: "manual",
        },
      });
      return reply.code(201).send(product);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  },

  async createProductsBulk(request, reply) {
    const items = request.body; // tableau de { productData, translations }

    try {
      const products = await productService.createProductsBulk(items, {
        createdBy: request.user.id,
        createdByType: request.user.type ?? "admin",
        changeSource: "bulk_import",
      });
      return reply.code(201).send(products);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  },
};