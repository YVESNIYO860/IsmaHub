import type { VercelRequest,VercelResponse } from '@vercel/node'
import {requirePermission}from'./lib/auth'
import {ApiError,sendError}from'./lib/errors'
import {parseMoney,requireText}from'./lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method==='GET'){
   const c=await requirePermission(req,'finance.read')
   const {data,error}=await c.supabase.from('business_expenses').select('*').order('expense_date',{ascending:false}).limit(1000)
   if(error)throw new ApiError(500,'Unable to load expenses.')
   return res.status(200).json({expenses:data??[]})
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'})}
  const c=await requirePermission(req,'expense.manage')
  const b=req.body as Record<string,unknown>
  const key=requireText(b?.idempotency_key,'Idempotency key',200)
  const existing=await c.supabase.from('business_expenses').select('id').eq('idempotency_key',key).maybeSingle()
  if(existing.error)throw new ApiError(400,'Unable to validate expense.')
  if(existing.data)return res.status(200).json({expense_id:existing.data.id})
  const ref=await c.supabase.rpc('next_expense_reference')
  if(ref.error||typeof ref.data!=='string')throw new ApiError(500,'Unable to generate expense reference.')
  const amount=parseMoney(b?.amount,'Amount')
  if(amount<=0)throw new ApiError(400,'Expense amount must be positive.')
  const{data,error}=await c.supabase.from('business_expenses').insert({
   reference:ref.data,
   category_id:requireText(b?.category_id,'Category',36),
   description:requireText(b?.description,'Description',1000),
   amount,currency:'RWF',
   expense_date:typeof b?.expense_date==='string'?b.expense_date:new Date().toISOString().slice(0,10),
   payment_method:typeof b?.payment_method==='string'?b.payment_method.trim()||null:null,
   supplier_name:typeof b?.supplier_name==='string'?b.supplier_name.trim()||null:null,
   receipt_reference:typeof b?.receipt_reference==='string'?b.receipt_reference.trim()||null:null,
   status:typeof b?.status==='string'&&b.status==='draft'? 'draft':'approved',
   idempotency_key:key,recorded_by:c.user.id
  }).select().single()
  if(error)throw new ApiError(400,'Unable to create expense.')
  return res.status(201).json({expense:data})
 }catch(error){return sendError(res,error)}
}
