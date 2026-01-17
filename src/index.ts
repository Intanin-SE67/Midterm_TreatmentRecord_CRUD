import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import TreatmentRecordRoutes from './TreatmentRecord/index.js'


//import database
import db from './db/index.js'

const app = new Hono()


app.route('/api/TreatmentRecords',TreatmentRecordRoutes)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
