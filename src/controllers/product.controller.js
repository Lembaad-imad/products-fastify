import * as productService from "../service/model.service.js";
import { enqueueBulkImport } from "../queues/productQueue.js";
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
    const { translations, initialVariant, ...productData } = request.body;

    try {
      const product = await productService.createProduct({
        productData,
        translations,
        actor: {
          createdBy: request.user.id,
          createdByType: request.user?.type ?? "admin",
          changeSource: "manual",
        },
      });
      return reply.code(201).send(product);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  },

async createProductsBulk(request, reply) {
  const items = request.body;

  if (!Array.isArray(items) || items.length === 0) {
    return reply.code(400).send({ error: "Le body doit être un tableau non vide" });
  }

  try {
    const { batchId, totalItems, totalChunks } = await enqueueBulkImport(items, {
      createdBy: request.user.id,
      createdByType: request.user?.type ?? "admin",
      changeSource: "bulk_import",
    });

    return reply.code(202).send({
      message: "Import accepté, traitement en cours",
      batchId,
      totalItems,
      totalChunks,
    });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
},
};