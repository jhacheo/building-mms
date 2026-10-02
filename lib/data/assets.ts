import {db,check} from './db';
import type {Asset} from './types';
export async function listAssets(){const {data,error}=await db().from('assets').select('*').order('name');check(error);return data as Asset[];}
export async function saveAsset(id:string|null,values:Record<string,unknown>){const q=db().from('assets');const {error}=await(id?q.update(values).eq('id',id):q.insert(values));check(error);}
export async function deleteAsset(id:string){const {error}=await db().from('assets').delete().eq('id',id);check(error);}
