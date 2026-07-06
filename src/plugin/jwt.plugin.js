import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin' ; 
import {env} from '../config/env.js'

async function jwtPlugin(app){
    app.register(fastifyJwt,{
        secret :env.JWT_SECRET
    })

    app.decorate('authenticate', async function (request,reply) {
        try {
            await request.jwtVerify();
        } catch (error) {
            reply.code(401).send({erro:"Non autorise"})
            
        }
    })
}
export default fp(jwtPlugin)