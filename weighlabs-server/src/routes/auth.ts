import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

export default function authPluginHandler<FastifyPluginAsync>(fastify: FastifyInstance) {
    fastify.get('/login', async(request: FastifyRequest, response: FastifyReply) => {}) 
    fastify.get('/create', async(request: FastifyRequest, response: FastifyReply) => {}) 
    fastify.get('/delete', async(request: FastifyRequest, response: FastifyReply) => {}) 
}