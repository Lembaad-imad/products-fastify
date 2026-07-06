import { comparePassword } from "../../utils/hash.js";
import models from "../models/index.js";

const {User} = models;

export async function registerUser({name,email,password}){
    const existing = await User.findOne({where:{email}})
    if(existing){
        const error = new Error('un compte existe deja avec cet email')
        error.statusCode= 409;
        throw error
    }
    const user = await User.create({
        name,
        email,
        password
    });
    return user;
}

export async function loginUser({email,password}){
    const user = await User.scope('withPassword').findOne({
        where:{email},
    })

    if(!user){
        const error = new Error('email ou mot de passe incorrect')
        error.statusCode= 401;
        throw error
    }
    const isValid = await comparePassword(password,user.password);
    if(!isValid){
        const error = new Error('email ou mot de passe incorrect');
        error.statusCode = 401;
        throw error;
        
    }
    return user;
}