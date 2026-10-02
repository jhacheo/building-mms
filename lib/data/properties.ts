import {db,check} from './db';
import type {Property} from './types';
export async function listProperties(){const {data,error}=await db().from('properties').select('*').order('name');check(error);return data as Property[];}
export async function saveProperty(id:string|null,values:Record<string,unknown>){const q=db().from('properties');const {error}=await(id?q.update(values).eq('id',id):q.insert(values));check(error);}
export async function deleteProperty(id:string){const {error}=await db().from('properties').delete().eq('id',id);check(error);}
