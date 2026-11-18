import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'./lib/auth'
import{ApiError,sendError}from'./lib/errors'
import{requireText}from'./lib/validation'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const c=await requirePermission(req,'pos.manage')
  const b=req.body as Record<string,unknown>
  if(!Array.isArray(b?.items)||b.items.length===0)throw new ApiError(400,'At least one POS item is required.')
  const items=b.items.map((item:unknown)=>{
   if(!item||typeof item!=='object')throw new ApiError(400,'Invalid POS item.')
   const x=item as Record<string,unknown>
   if(typeof x.quantity!=='number'||!Number.isInteger(x.quantity)||x.quantity<=0)throw new ApiError(400,'Quantity must be a positive whole number.')
   return{product_id:requireText(x.product_id,'Product',36),quantity:x.quantity}
  })
  const{data,error}=await c.supabase.rpc('create_pos_sale',{
   p_location_id:requireText(b?.location_id,'Location',36),
   p_customer_id:typeof b?.customer_id==='string'?b.customer_id:null,
   p_items:items,p_idempotency_key:requireText(b?.idempotency_key,'Idempotency key',200),
   p_payment_method:requireText(b?.payment_method,'Payment method',50),
   p_payment_reference:typeof b?.payment_reference==='string'?b.payment_reference.trim()||null:null
  })
  if(error)throw new ApiError(400,error.message.includes('stock')?'Insufficient available stock.':'Unable to create POS sale.')
  return res.status(201).json({sale_id:data})
 }catch(error){return sendError(res,error)}
}
