import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'../lib/auth'
import{ApiError,sendError}from'../lib/errors'
import{requireText}from'../lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='POST'&&req.method!=='DELETE'){res.setHeader('Allow','POST, DELETE');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const context=await requirePermission(req,'role.manage')
  const b=req.body as Record<string,unknown>
  const userId=requireText(b?.user_id,'User',36)
  const roleName=requireText(b?.role,'Role',40).toLowerCase()
  const allowed=['owner','administrator','manager','inventory_manager','sales_staff','cashier','purchasing_staff','accountant']
  if(!allowed.includes(roleName))throw new ApiError(400,'Invalid role.')
  const{error}=req.method==='DELETE'
   ?await context.supabase.rpc('remove_staff_role',{p_user_id:userId,p_role_name:roleName})
   :await context.supabase.rpc('assign_staff_role',{p_user_id:userId,p_role_name:roleName,p_assigned_by:context.user.id})
  if(error)throw new ApiError(400,error.message.includes('own owner')?'An owner cannot remove their own owner role.':'Unable to update staff role.')
  return res.status(200).json({success:true})
 }catch(error){return sendError(res,error)}
}
