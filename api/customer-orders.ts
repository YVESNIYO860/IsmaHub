import type { VercelRequest,VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError,sendError } from './lib/errors'
import { requireText } from './lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method==='GET'){
   const c=await requirePermission(req,'order.read')
   const {data,error}=await c.supabase.from('customer_orders').select('*,order_items(*)').order('created_at',{ascending:false}).limit(500)
   if(error) throw new ApiError(500,'Unable to load orders.')
   return res.status(200).json({orders:data??[]})
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'})}
  const c=await requirePermission(req,'order.manage')
  const b=req.body as Record<string,unknown>
  const locationId=requireText(b?.location_id,'Location',36)
  const customerId=typeof b?.customer_id==='string'?b.customer_id:null
  const key=requireText(b?.idempotency_key,'Idempotency key',200)
  if(!Array.isArray(b?.items)||b.items.length===0)throw new ApiError(400,'At least one order item is required.')
  const items=b.items.map((item:unknown)=>{
   if(!item||typeof item!=='object')throw new ApiError(400,'Invalid order item.')
   const x=item as Record<string,unknown>
   const productId=requireText(x.product_id,'Product',36)
   if(typeof x.quantity!=='number'||!Number.isInteger(x.quantity)||x.quantity<=0)throw new ApiError(400,'Quantity must be a positive whole number.')
   return {product_id:productId,quantity:x.quantity}
  })
  const {data,error}=await c.supabase.rpc('create_customer_order',{
   p_customer_id:customerId,p_location_id:locationId,p_items:items,
   p_idempotency_key:key,p_quotation_id:null
  })
  if(error)throw new ApiError(400,error.message.includes('insufficient')?'Insufficient available stock.':'Unable to create customer order.')
  return res.status(201).json({order_id:data})
 }catch(error){return sendError(res,error)}
}
