import { sequelize } from "../config/database.js";

export default function defineProduct(Sequelize,DataTypes){
    const Product = sequelize.define('Product',{
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false
        },
        description:{
            type:DataTypes.TEXT,
            allowNull:false
        },
          price: {
             type: DataTypes.DECIMAL(10, 2),
             allowNull: false,
        },
        quantity: {
              type: DataTypes.INTEGER,
              defaultValue: 0,
    },
    },{
        tableName: 'products'
    });
    Product.associate=(models)=>{
        Product.belongsTo(models.User,{foreignKey:'userId',onDelete:'CASCADE'})
    }
    return Product;
}