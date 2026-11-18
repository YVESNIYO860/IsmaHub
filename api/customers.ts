import type { VercelRequest,VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError,sendError } from './lib/errors'
import { optionalText,requireText } from './lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method==='GET'){
   const c=await requirePermission(req,'customer.manage')
   const {data,error}=await c.supabase.from('customers').select('*').order('full_name')
   if(error) throw new ApiError(500,'Unable to load customers.')
   return res.status(200).json({customers:data??[]})
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'})}
  const c=await requirePermission(req,'customer.manage')
  const b=req.body as Record<string,unknown>
  const {data,error}=await c.supabase.from('customers').insert({
   full_name:requireText(b?.full_name,'Full name'),
   email:optionalText(b?.email,'Email',254),
   phone:optionalText(b?.phone,'Phone',30),
   address:optionalText(b?.address,'Address',500),
   tax_number:optionalText(b?.tax_number,'Tax number',100)
  }).select().single()
  if(error) throw new ApiError(400,'Unable to create customer.')
  return res.status(201).json({customer:data})
 }catch(error){return sendError(res,error)}
}
