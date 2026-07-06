import Fastify from "fastify";
import openapiGlue from "fastify-openapi-glue";
import productController from "./controllers/product.controller.js";

function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        strict: false,
        removeAdditional: true,
      },
    },
    ...opts,
  });
fastify.addHook('onRequest', async (request, reply) => {
  if (request.routeOptions.url === '/products') {
  }
});


  fastify.register(openapiGlue, {
    specification: "./openapi.yaml",
    serviceHandlers: productController,
    prefix: "/api", 
  });

  return fastify;
}

export default buildApp;