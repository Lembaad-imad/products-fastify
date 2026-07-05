import * as productService from "../service/model.service.js";

export default {
  async listProducts(request, reply) {
    const products = await productService.getAllProducts();
    return reply.code(200).send(products);
  },

  async createProduct(request, reply) {
    const product = await productService.createProduct(request.body);
    return reply.code(201).send(product);
  },

  async createProductsBulk(request, reply) {
    const products = await productService.createProductsBulk(request.body);
    return reply.code(201).send(products);
  },
};



















// import * as productService from "../service/model.service.js";

// async function listProducts(request, reply) {
//   try {
//     const products = await productService.getAllProducts();
//     return reply.code(200).send(products);
//   } catch (error) {
//     return reply.code(400).send({ error: error.message });
//   }
// }

// async function createProduct(request, reply) {
//   try {
//     const product = await productService.createProduct(request.body);
//     return reply.code(201).send(product);
//   } catch (error) {
//     return reply.code(400).send({ error: error.message });
//   }
// }

// async function createProductsBulk(request, reply) {
//   try {
//     const products = await productService.createProductsBulk(request.body);
//     return reply.code(201).send(products);
//   } catch (error) {
//     return reply.code(400).send({ error: error.message });
//   }
// }


// export default {
//   listProducts,
//   createProduct,
//   createProductsBulk
// };