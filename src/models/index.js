import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import defineProduct from "./Product.js";

const db = {};

db.sequelize = sequelize;

db.Product = defineProduct(Sequelize, DataTypes);

export default db;