import buildApp from "./src/app.js";
import db from "./src/models/index.js";

const fastify = buildApp();

const start = async () => {
  try {
    await db.sequelize.authenticate();
    fastify.log.info("Database connection established.");

    await db.sequelize.sync();
    fastify.log.info("Database synced.");

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info("Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();