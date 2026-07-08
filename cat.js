import models from "./src/models/index.js";
const { Category } = models;

await Category.create({ name: "Boissons" });
console.log("Catégorie créée");
process.exit(0);