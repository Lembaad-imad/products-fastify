import { sequelize } from "../config/database.js"
import bcrypt from 'bcrypt'
export default function defineUser(Sequelize,DataTypes){
    const User = sequelize.define("User",{
       id:{
        type:DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey : true,
       },
       name:{
            type:DataTypes.STRING,
            allowNull:false,
       },
        email:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true,
            validate:{
                isEmail:true,
            },
        },
        password:{
            type:DataTypes.STRING,
            allowNull:false,
        }
    },{
        tableName:'user',
        defaultScope:{
            attributes:{exclude :['password']}
        },
        scopes:{
            withPassword:{attributes:{}}
        },
        hooks:{
            beforeCreate : async(user) =>{
                user.password = await bcrypt.hash(user.password,10)
            },
            beforeUpdate : async (user)=>{
                if(user.changed('password')){
                    user.password = await bcrypt.hash(user.password,10)
                }
            }
        }
    });
      User.associate = (models)=>{
        User.hasMany(models.Product, {foreignKey:'userId', onDelete:'CASCADE'})
      }
    return User
}