import type {VercelRequest,VercelResponse} from '@vercel/node'
import {requirePermission} from './lib/auth'
import {ApiError,sendError} from './lib/errors'
import {requireText} from './lib/validation'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const c=await requirePermission(req,'quotation.manage')
  const b=req.body as Record<string,unknown>
  const {data,error}=await c.supabase.rpc('accept_quotation',{
   p_quotation_id:requireText(b?.quotation_id,'Quotation',36),
   p_location_id:requireText(b?.location_id,'Location',36),
   p_idempotency_key:requireText(b?.idempotency_key,'Idempotency key',200)
  })
  if(error)throw new ApiError(400,error.message.includes('stock')?'Insufficient available stock.':'Unable to accept quotation.')
  return res.status(201).json({order_id:data})
 }catch(error){return sendError(res,error)}
}
