import models from "../models/index.js";
const { Product, User } = models;

export async function getAllProducts() {
  return Product.findAll({
    include: [
      {
        model: User,
        attributes: ["id", "name", "email"], 
      },
    ],
  });
}

export async function createProduct(data, userId) {
  return Product.create({
    ...data,
    quantity: data.quantity ?? 0,
    user_id: userId,
  });
}

export async function createProductsBulk(dataArray, userId) {
  const cleanDataArray = dataArray.map((data) => ({
    ...data,
    quantity: data.quantity ?? 0,
    user_id: userId,
  }));

  return Product.bulkCreate(cleanDataArray, { validate: true });
}