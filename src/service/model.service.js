import models from "../models/index.js";
const { Product } = models;

export async function getAllProducts() {
  return Product.findAll();
}

export async function createProduct(data) {
  return Product.create({
    ...data,
    quantity: data.quantity ?? 0,
  });
}

export async function createProductsBulk(dataArray) {
  const cleanDataArray = dataArray.map((data) => ({
    ...data,
    quantity: data.quantity ?? 0,
  }));

  return Product.bulkCreate(cleanDataArray, { validate: true });
}


































// import db from "../models/index.js";

// const { Product } = db;


// function filterValidFields(data, model, exclude = ["id", "createdAt", "updatedAt"]) {
//   const validFields = Object.keys(model.rawAttributes).filter(
//     (key) => !exclude.includes(key)
//   );

//   return Object.fromEntries(
//     Object.entries(data).filter(([key]) => validFields.includes(key))
//   );
// }

// export async function getAllProducts() {
//   return Product.findAll();
// }

// export async function createProduct(data) {
//   const cleanData = filterValidFields(data, Product);

//   return Product.create({
//     ...cleanData,
//     quantity: cleanData.quantity ?? 0,
//   });

  
// }
// export async function createProductsBulk(dataArray) {
//   if (!Array.isArray(dataArray) || dataArray.length === 0) {
//     throw new Error("Bulk creation requires a non-empty array of products");
//   }

//   const cleanDataArray = dataArray.map((data) => {
//     const cleanData = filterValidFields(data, Product);
//     return {
//       ...cleanData,
//       quantity: cleanData.quantity ?? 0,
//     };
//   });

//   return Product.bulkCreate(cleanDataArray, { validate: true });
// }