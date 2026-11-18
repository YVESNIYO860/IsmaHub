import type{VercelRequest,VercelResponse}from'@vercel/node'
import{ApiError,sendError}from'./lib/errors'
import{createUserClient}from'./lib/supabase'
import{requireText}from'./lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const b=req.body as Record<string,unknown>
  const name=requireText(b?.customer_name,'Customer name',200)
  const phone=requireText(b?.phone,'Phone',30)
  const address=typeof b?.address==='string'?b.address.trim():''
  const key=requireText(b?.idempotency_key,'Idempotency key',200)
  if(!Array.isArray(b?.items)||b.items.length===0)throw new ApiError(400,'At least one checkout item is required.')
  const items=b.items.map((item:unknown)=>{
   if(!item||typeof item!=='object')throw new ApiError(400,'Invalid checkout item.')
   const candidate=item as Record<string,unknown>
   if(typeof candidate.quantity!=='number'||!Number.isInteger(candidate.quantity)||candidate.quantity<=0)throw new ApiError(400,'Quantity must be a positive whole number.')
   return{product_id:requireText(candidate.product_id,'Product',36),quantity:candidate.quantity}
  })
  const supabase=createUserClient()
  const{data,error}=await supabase.rpc('create_public_order',{
   p_customer_name:name,p_phone:phone,p_address:address,
   p_items:items,p_idempotency_key:key
  })
  if(error){
   const message=error.message.includes('stock')?'Insufficient available stock.':'Unable to create checkout order.'
   throw new ApiError(400,message)
  }
  const result=Array.isArray(data)?data[0]:null
  if(!result?.order_id||!result?.reference)throw new ApiError(500,'Unable to confirm checkout order.')
  return res.status(201).json({order:{id:result.order_id,reference:result.reference}})
 }catch(error){return sendError(res,error)}
}
