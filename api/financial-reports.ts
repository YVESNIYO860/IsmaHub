import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'./lib/auth'
import{ApiError,sendError}from'./lib/errors'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const c=await requirePermission(req,'profit.read')
  const from=typeof req.query.from==='string'?req.query.from:null
  const to=typeof req.query.to==='string'?req.query.to:null
  const[gross,net]=await Promise.all([
   c.supabase.rpc('gross_profit_report',{p_from:from,p_to:to}),
   c.supabase.rpc('net_profit_report',{p_from:from,p_to:to})
  ])
  if(gross.error||net.error)throw new ApiError(500,'Unable to generate financial reports.')
  return res.status(200).json({gross:gross.data?.[0]??null,net:net.data?.[0]??null})
 }catch(error){return sendError(res,error)}
}
