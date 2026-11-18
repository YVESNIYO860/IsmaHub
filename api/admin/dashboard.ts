import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'../lib/auth'
import{ApiError,sendError}from'../lib/errors'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const c=await requirePermission(req,'dashboard.read')
  const{data,error}=await c.supabase.rpc('dashboard_summary')
  if(error)throw new ApiError(500,'Unable to load dashboard.')
  return res.status(200).json({dashboard:data})
 }catch(error){return sendError(res,error)}
}
