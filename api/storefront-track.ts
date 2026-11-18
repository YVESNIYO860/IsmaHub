import type{VercelRequest,VercelResponse}from'@vercel/node'
import{createUserClient}from'./lib/supabase'
import{ApiError,sendError}from'./lib/errors'
import{requireText}from'./lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const b=req.body as Record<string,unknown>
  const supabase=createUserClient()
  const{data,error}=await supabase.rpc('track_public_order',{
   p_reference:requireText(b?.reference,'Order reference',30).toUpperCase(),
   p_phone:requireText(b?.phone,'Phone',30)
  })
  if(error)throw new ApiError(500,'Unable to track order.')
  const order=Array.isArray(data)?data[0]:null
  if(!order)return res.status(404).json({error:'Order not found.'})
  return res.status(200).json({order})
 }catch(error){return sendError(res,error)}
}
