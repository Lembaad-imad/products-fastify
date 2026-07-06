import Fastify from "fastify";
import openapiGlue from "fastify-openapi-glue";
import productController from "./controllers/product.controller.js";
import authController from './controllers/auth.controller.js'
import jwtPlugin from './plugin/jwt.plugin.js';

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
  if (request.routeOptions.url === '/api/ping') {
    reply.send({ message: 'pipeline work' });
  }
});
fastify.register(jwtPlugin);
const serviceHandlers = {
  ...productController,
  ...authController,
};


  fastify.register(openapiGlue, {
    specification: "./openapi.yaml",
    serviceHandlers: serviceHandlers,
    prefix: "/api", 
  });

  return fastify;
}

export default buildApp;