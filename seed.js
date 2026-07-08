import models from "./src/models/index.js";

const { Category, Brand, Media, Nanostore } = models;

async function seed() {
  const [category] = await Category.findOrCreate({
    where: { name: "Boissons" },
    defaults: { name: "Boissons" },
  });
  console.log("Catégorie :", category.id, category.name);

  const [brand] = await Brand.findOrCreate({
    where: { name: "Woliz Générique" },
    defaults: { name: "Woliz Générique" },
  });
  console.log("Marque :", brand.id, brand.name);

  const [media] = await Media.findOrCreate({
    where: { url: "https://placeholder.woliz.ma/default.png" },
    defaults: { url: "https://placeholder.woliz.ma/default.png" },
  });
  console.log("Media :", media.id, media.url);

  const [nanostore] = await Nanostore.findOrCreate({
    where: { name: "Nanostore Test" },
    defaults: { name: "Nanostore Test" },
  });
  console.log("Nanostore :", nanostore.id, nanostore.name);

  console.log("\nUtilise cet ID dans ton JSON :");
  console.log(`"categoryId": ${category.id}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Erreur seed :", err);
  process.exit(1);
});