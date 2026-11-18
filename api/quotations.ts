import type { VercelRequest,VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError,sendError } from './lib/errors'
import { parseMoney,requireText } from './lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
  const c=await requirePermission(req,'quotation.manage')
  const b=req.body as Record<string,unknown>
  const key=requireText(b?.idempotency_key,'Idempotency key',200)
  if(!Array.isArray(b?.items)||b.items.length===0)throw new ApiError(400,'At least one quotation item is required.')
  let subtotal=0
  const items=b.items.map((item:unknown)=>{
   if(!item||typeof item!=='object')throw new ApiError(400,'Invalid quotation item.')
   const x=item as Record<string,unknown>
   const productId=requireText(x.product_id,'Product',36)
   if(typeof x.quantity!=='number'||!Number.isInteger(x.quantity)||x.quantity<=0)throw new ApiError(400,'Quantity must be a positive whole number.')
   const unitPrice=parseMoney(x.unit_price,'Unit price')
   const lineTotal=parseMoney(unitPrice*x.quantity,'Line total')
   subtotal=parseMoney(subtotal+lineTotal,'Subtotal')
   return {product_id:productId,quantity:x.quantity,unit_price:unitPrice,line_total:lineTotal}
  })
  const tax=parseMoney(b?.tax_amount??0,'Tax amount')
  const total=parseMoney(subtotal+tax,'Total amount')
  const existing=await c.supabase.from('quotations').select('id').eq('idempotency_key',key).maybeSingle()
  if(existing.error)throw new ApiError(400,'Unable to validate quotation.')
  if(existing.data)return res.status(200).json({quotation_id:existing.data.id})
  const seq=await c.supabase.from('quotations').select('reference').order('created_at',{ascending:false}).limit(1)
  let next=1
  if(!seq.error&&seq.data?.[0]?.reference){const n=Number(seq.data[0].reference.replace('QUO-',''));if(Number.isFinite(n))next=n+1}
  const q=await c.supabase.from('quotations').insert({
   reference:`QUO-${String(next).padStart(6,'0')}`,
   customer_id:typeof b?.customer_id==='string'?b.customer_id:null,
   status:'sent',valid_until:typeof b?.valid_until==='string'?b.valid_until:new Date(Date.now()+7*864e5).toISOString(),
   currency:'RWF',subtotal,tax_amount:tax,total_amount:total,
   notes:typeof b?.notes==='string'?b.notes.trim()||null:null,idempotency_key:key
  }).select().single()
  if(q.error||!q.data)throw new ApiError(400,'Unable to create quotation.')
  const rows=items.map((item)=>({...item,quotation_id:q.data.id}))
  const qi=await c.supabase.from('quotation_items').insert(rows)
  if(qi.error)throw new ApiError(400,'Unable to create quotation items.')
  return res.status(201).json({quotation:q.data})
 }catch(error){return sendError(res,error)}
}
