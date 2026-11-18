import type {VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'./lib/auth'
import{ApiError,sendError}from'./lib/errors'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method==='GET'){
   const c=await requirePermission(req,'finance.read')
   const{data,error}=await c.supabase.from('vat_configuration').select('*').eq('id',1).single()
   if(error)throw new ApiError(500,'Unable to load VAT configuration.')
   return res.status(200).json({vat:data})
  }
  if(req.method!=='PUT'&&req.method!=='PATCH'){res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'Method not allowed.'})}
  const c=await requirePermission(req,'finance.manage')
  const b=req.body as Record<string,unknown>
  if(typeof b?.rate!=='number'||!Number.isFinite(b.rate)||b.rate<0||b.rate>100)throw new ApiError(400,'VAT rate must be between 0 and 100.')
  const effectiveFrom=typeof b?.effective_from==='string'?b.effective_from:new Date().toISOString()
  const{data,error}=await c.supabase.from('vat_configuration').update({
   rate:b.rate,effective_from:effectiveFrom,configured_by:c.user.id
  }).eq('id',1).select().single()
  if(error)throw new ApiError(400,'Unable to update VAT configuration.')
  return res.status(200).json({vat:data})
 }catch(error){return sendError(res,error)}
}
