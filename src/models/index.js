import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import defineProduct from "./Product.js";
import defineUser from "./User.js";


const Product = defineProduct(sequelize,DataTypes);
const User = defineUser(sequelize,DataTypes)

const models = {User , Product, sequelize};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;