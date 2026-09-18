// Entry Point of the server used to verify credentials and interact with server database alongside local database.
import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log('WeighLabs server is Online 🚀')
});