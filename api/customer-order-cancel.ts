import type{VercelRequest,VercelResponse}from '@vercel/node'
import{requirePermission}from'./lib/auth'
import{ApiError,sendError}from'./lib/errors'
import{requireText}from'./lib/validation'
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 try{const c=await requirePermission(req,'order.manage');const b=req.body as Record<string,unknown>
 const{error}=await c.supabase.rpc('cancel_customer_order',{p_order_id:requireText(b?.order_id,'Order',36)})
 if(error)throw new ApiError(400,'Unable to cancel customer order.')
 return res.status(200).json({success:true})
 }catch(error){return sendError(res,error)}
}
