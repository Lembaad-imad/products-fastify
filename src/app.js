import Fastify from "fastify";
import cors from "@fastify/cors";
import openapiGlue from "fastify-openapi-glue";
import productController from "./controllers/product.controller.js";
import authController from './controllers/auth.controller.js';
import jwtPlugin from './plugin/jwt.plugin.js';
import logsRoutes from './routes/logs.routes.js';
import productChangeLogRoutes from './routes/productChangeLog.routes.js';
import partenaireController from './controllers/partenaire.controller.js'; 
import zoneController from './controllers/zone.controller.js'; 
import villeController from './controllers/ville.controller.js'; 

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

  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  fastify.register(logsRoutes, { prefix: '/api' });
  fastify.register(productChangeLogRoutes, { prefix: '/api' });
  fastify.register(jwtPlugin);

  const serviceHandlers = {
    ...productController,
    ...authController,
    ...partenaireController,
    ...zoneController,
    ...villeController
    
  };

  fastify.register(openapiGlue, {
    specification: "./openapi.yaml",
    serviceHandlers: serviceHandlers,
    securityHandlers: {
      bearerAuth: async (req, reply, params) => {
        await req.server.authenticate(req, reply)
      }
    },
    prefix: "/api",
  });

  return fastify;
}

export default buildApp;