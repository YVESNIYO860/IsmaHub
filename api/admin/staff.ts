import type{VercelRequest,VercelResponse}from'@vercel/node'
import{requirePermission}from'../lib/auth'
import{ApiError,sendError}from'../lib/errors'
import{createPrivilegedClient}from'../lib/supabase'
import{parseLoginInput,requireText}from'../lib/validation'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store')
 try{
  if(req.method==='GET'){
   const c=await requirePermission(req,'staff.read')
   const{data,error}=await c.supabase
    .from('staff_profiles')
    .select('id,full_name,phone,is_active,created_at,updated_at,staff_roles(role_id,roles(name))')
    .order('created_at',{ascending:false})
   if(error)throw new ApiError(500,'Unable to load staff.')
   return res.status(200).json({staff:data??[]})
  }
  if(req.method==='POST'){
   const context=await requirePermission(req,'staff.manage')
   const b=req.body as Record<string,unknown>
   const input=parseLoginInput(b)
   const role=requireText(b?.role,'Role',40).toLowerCase()
   const allowed=['owner','administrator','manager','inventory_manager','sales_staff','cashier','purchasing_staff','accountant']
   if(!allowed.includes(role))throw new ApiError(400,'Invalid role.')
   if(role==='owner'){
    const{data:ownerCheck,error:ownerError}=await context.supabase.rpc('is_owner')
    if(ownerError||ownerCheck!==true)throw new ApiError(403,'Only the owner can assign the owner role.')
   }
   const privileged=createPrivilegedClient()
   if(!privileged)throw new ApiError(503,'Server secret key is required to create staff accounts.')
   const created=await privileged.auth.admin.createUser({
    email:input.email,password:input.password,email_confirm:true,
    user_metadata:{full_name:typeof b?.full_name==='string'?b.full_name.trim():null},
    app_metadata:{account_type:'staff'}
   })
   if(created.error||!created.data.user)throw new ApiError(400,'Unable to create staff account.')
   const profile=await privileged
    .from('staff_profiles')
    .update({full_name:typeof b?.full_name==='string'?b.full_name.trim()||null:null,phone:typeof b?.phone==='string'?b.phone.trim()||null:null})
    .eq('id',created.data.user.id)
   if(profile.error)throw new ApiError(500,'Account created but profile setup failed.')
   const assigned=await context.supabase.rpc('assign_staff_role',{
    p_user_id:created.data.user.id,p_role_name:role,p_assigned_by:context.user.id
   })
   if(assigned.error)throw new ApiError(500,'Account created but role assignment failed.')
   await privileged.from('audit_logs').insert({
    actor_id:context.user.id,action:'staff.account_created',entity_type:'staff_profile',
    entity_id:created.data.user.id,metadata:{role,email:input.email}
   })
   return res.status(201).json({staff:{id:created.data.user.id,email:input.email,role}})
  }
  if(req.method==='PATCH'){
   const context=await requirePermission(req,'staff.manage')
   const b=req.body as Record<string,unknown>
   const userId=requireText(b?.user_id,'User',36)
   const updates:Record<string,unknown>={}
   if('full_name' in b)updates.full_name=typeof b.full_name==='string'?b.full_name.trim()||null:null
   if('phone' in b)updates.phone=typeof b.phone==='string'?b.phone.trim()||null:null
   if('is_active' in b){
    if(typeof b.is_active!=='boolean')throw new ApiError(400,'is_active must be true or false.')
    updates.is_active=b.is_active
   }
   if(Object.keys(updates).length===0)throw new ApiError(400,'No supported fields were provided.')
   const{data,error}=await context.supabase
    .from('staff_profiles')
    .update(updates)
    .eq('id',userId)
    .select()
    .single()
   if(error)throw new ApiError(400,'Unable to update staff profile.')
   return res.status(200).json({staff:data})
  }
  res.setHeader('Allow','GET, POST, PATCH')
  return res.status(405).json({error:'Method not allowed.'})
 }catch(error){return sendError(res,error)}
}
