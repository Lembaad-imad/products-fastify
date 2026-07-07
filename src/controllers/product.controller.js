import * as productService from "../service/model.service.js";

export default {
  async listProducts(request, reply) {
    const products = await productService.getAllProducts();
    return reply.code(200).send(products);
  },

  async createProduct(request, reply) {
    const product = await productService.createProduct(request.body, request.user.id);
    return reply.code(201).send(product);
  },

  async createProductsBulk(request, reply) {
    const products = await productService.createProductsBulk(request.body, request.user.id);
    return reply.code(201).send(products);
  },
};