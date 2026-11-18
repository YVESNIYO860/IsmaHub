import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'../lib/auth'
import{ApiError,sendError}from'../lib/errors'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const c=await requirePermission(req,'audit.read')
  let q=c.supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(500)
  if(typeof req.query.action==='string')q=q.ilike('action',`%${req.query.action}%`)
  const{data,error}=await q
  if(error)throw new ApiError(500,'Unable to load audit logs.')
  return res.status(200).json({audit:data??[]})
 }catch(error){return sendError(res,error)}
}
