import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'

const TreatmentRecordRoutes = new Hono()

type TreatmentRecord = {
    TreatmentID: number
    Date : string
    Notes : string
    Cost : number
    DoctorName : string
}

TreatmentRecordRoutes.get('/', async(c) => {
    let sql = 'SELECT TreatmentID, Date, Notes, Cost, DoctorName FROM TreatmentRecord'
    let stmt = db.prepare<[],TreatmentRecord>(sql)
    let TreatmentRecords :  TreatmentRecord[] = stmt.all()
    return c.json({ message : 'List of TreatmentRecords', data : TreatmentRecords})
})

TreatmentRecordRoutes.get('/:TreatmentID', (c) => {
    const { TreatmentID } = c.req.param()
    let sql = 'SELECT * FROM TreatmentRecord WHERE TreatmentID = @TreatmentID'
    let stmt = db.prepare<{TreatmentID:string},TreatmentRecord>(sql)
    let TreatmentRecords =  stmt.get({TreatmentID:TreatmentID})

    if (!TreatmentRecords){
        return c.json({message : `TreatmentRecord not Found`}, 404)
    }

    return c.json({
        message : `TreatmentRecord details for ID: ${TreatmentID}`,
        data : TreatmentRecords
    })
})

const createTreatmentRecordSchema = z.object({
    Date: z.string("Please enter Date"),
    Notes : z.string("Please enter Notes").optional(),
    Cost : z.number('Please enter Treatment Cost'),
    DoctorName : z.string('Please enter the Doctorname'),
})

TreatmentRecordRoutes.post('/',
    zValidator('json', createTreatmentRecordSchema, (result,c) =>{
        if (!result.success){
            return c.json({
                message: 'Validation Failed',
                errors : result.error.issues }, 400)
        }
    })
    , async (c) => {
        const body = await c.req.json<TreatmentRecord>()
        let sql = `INSERT INTO TreatmentRecord
                    (Date, Notes, Cost, DoctorName)
                    VALUES(@Date, @Notes, @Cost, @DoctorName);`
        
        let stmt = db.prepare<Omit<TreatmentRecord,"TreatmentID">>(sql)
        let result = stmt.run(body)

        if (result.changes === 0) {
            return c.json({ message: 'Falied to Create TreatmentRecord'},500)
        }

        let sql2 = `SELECT * FROM TreatmentRecord WHERE TreatmentID = ?`
        let stmt2 = db.prepare<[number],TreatmentRecord>(sql2)
        let newTreatmentRecord = stmt2.get((result.lastInsertRowid as number))

        return c.json({ message: 'TreatmentRecord created', data: newTreatmentRecord}, 201)
    }
)

TreatmentRecordRoutes.put('/:TreatmentID',
    zValidator('json', createTreatmentRecordSchema, (result,c) =>{
        if (!result.success){
            return c.json({
                message: 'Validation Failed',
                errors : result.error.issues }, 400)
        }
    })
    , async (c) => {
        const { TreatmentID } = c.req.param()
        const body = await c.req.json<TreatmentRecord>()
        
        let sql = `UPDATE TreatmentRecord
                    SET Date = @Date, Notes = @Notes, Cost = @Cost, DoctorName = @DoctorName
                    WHERE TreatmentID = @TreatmentID;`
        let stmt = db.prepare<Omit<TreatmentRecord,"TreatmentID"> & {TreatmentID:string}>(sql)
        let result = stmt.run({ ...body, TreatmentID })

        if (result.changes === 0) {
            return c.json({ message: 'Falied to Update TreatmentRecord'},500)
        }

        let sql2 = `SELECT * FROM TreatmentRecord WHERE TreatmentID = ?`
        let stmt2 = db.prepare<[string],TreatmentRecord>(sql2)
        let updatedTreatmentRecord = stmt2.get(TreatmentID)

        return c.json({ message: 'TreatmentRecord updated', data: updatedTreatmentRecord}, 200)
    }
)   

TreatmentRecordRoutes.delete('/:TreatmentID', async (c) => {
  const { TreatmentID } = c.req.param()
  if (!TreatmentID || !TreatmentID.trim()) {
    return c.json({ message: 'Treatment ID is required' }, 400)
  }

  const sql = `DELETE FROM TreatmentRecord WHERE TreatmentID = @TreatmentID;`
  const stmt = db.prepare(sql)

  try {
    const result = stmt.run({ TreatmentID })
    if (result.changes === 0) {
      return c.json({ message: 'Record not found' }, 404)
    }
    return c.json({ message: 'Record deleted' }, 200)
  } catch (err) {
    console.error('Delete error:', err)
    return c.json({ message: 'Failed to delete Record' }, 500)
  }
})



export default TreatmentRecordRoutes