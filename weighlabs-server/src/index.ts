// Entry Point of the server used to verify credentials and interact with server database alongside local database.
import fastify from 'fastify'
import 'dotenv/config'

const app = fastify()
const PORT = parseInt(process.env.PORT!) || 3000

// route handlers
import serverStatusRoute from './routes/serverStatus.ts'

// plugins
import authPluginHandler from './routes/auth.ts'

// external route handling
app.get('/', serverStatusRoute)

// handle login/creation/deletion
app.register(authPluginHandler, { prefix: '/auth '})

app.listen({port: PORT}, () => {
    console.log('WeighLabs Server is Online 🚀')
});