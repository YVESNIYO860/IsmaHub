import type { VercelRequest,VercelResponse } from '@vercel/node'
import { createUserClient } from './lib/supabase'
import { ApiError,sendError } from './lib/errors'

export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=300')
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'})}
 try{
  const supabase=createUserClient()
  const search=typeof req.query.search==='string'?req.query.search.trim():null
  let query=supabase
   .from('products')
   .select('id,name,slug,sku,short_description,description,sale_price,compare_at_price,currency,status,is_featured,product_categories(id,name,slug),product_brands(id,name,slug),product_specifications(name,value,sort_order),product_images(image_url,alt_text,sort_order,is_primary)')
   .eq('status','active')
  if(search)query=query.ilike('name',`%${search}%`)
  const{data,error}=await query
   .order('is_featured',{ascending:false})
   .order('name')
   .limit(200)
  if(error)throw new ApiError(500,'Unable to load storefront products.')
  return res.status(200).json({products:data??[]})
 }catch(error){return sendError(res,error)}
}
