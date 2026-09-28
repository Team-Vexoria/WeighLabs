// provides server status
import { FastifyInstance, FastifyReply, FastifyRequest} from 'fastify'

// import interface
import { genericResponse } from '../types/genericReponse'

export default async function serverStatusHandler(request: FastifyRequest, response: FastifyReply) {
    let responseJson: genericResponse = {
        response: {
            code: 200,
            ok: true
        },
        data: {
            message: "🟢 WeighLabs server is Online."
        }
    }
    response.status(200).send(responseJson)
}
