(function(root){
'use strict';
const MAX_QTY=999999;
const nameKey=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const isHeader=(a,b)=>['名稱','道具名稱','成品名稱','物品名稱','item','item name'].includes(a.toLowerCase())&&['數量','需求量','需求數量','合併需求總數','quantity','qty'].includes(b.toLowerCase());
const parseQty=value=>{
 const input=String(value??'').trim();
 if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(input))return null;
 const n=Number(input.replace(/,/g,''));
 return Number.isSafeInteger(n)&&n>=1&&n<=MAX_QTY?n:null;
};
function parse(input,engine){
 const raw=String(input??'').replace(/^\uFEFF/,'');
 const errors=[],groups=new Map();
 if(raw.length>200000)return {rows:[],errors:['貼上內容過長，請分批匯入。'],count:0,total:0,duplicates:0,input:raw};
 const lines=raw.split(/\r\n|\n|\r/);
 if(lines.length>3000)return {rows:[],errors:['資料超過 3000 列，請分批匯入。'],count:0,total:0,duplicates:0,input:raw};
 const names=new Map();
 for(const item of engine.items.values()){
  const key=nameKey(item.name);
  if(!key)continue;
  if(!names.has(key))names.set(key,[]);
  names.get(key).push(item);
 }
 let count=0,duplicates=0,first=true;
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;
  const line=lines[i].trim();
  // The final space-separated token is the quantity; spaces within item names are preserved.
  // A direct two-column paste from Google Sheets also works because tabs are whitespace.
  const match=line.match(/^(.*?)\s+(\S+)$/u);
  if(first){first=false;if(match&&isHeader(match[1].trim(),match[2].trim()))continue;}
  count++;
  if(!match){errors.push('第 '+(i+1)+' 列：請輸入「道具名稱 空白 數量」，例如：白鈦戰斧 4。');continue;}
  const name=match[1].trim(),rawQty=match[2].trim();
  const qty=parseQty(rawQty);
  if(!name){errors.push('第 '+(i+1)+' 列：道具名稱不可空白。');continue;}
  if(qty===null){errors.push('第 '+(i+1)+' 列「'+name+'」：數量需為 1～999999 的整數。');continue;}
  const matches=names.get(nameKey(name))||[];
  if(!matches.length){errors.push('第 '+(i+1)+' 列「'+name+'」：製作工坊的道具資料找不到完全一致的名稱。');continue;}
  if(matches.length!==1){errors.push('第 '+(i+1)+' 列「'+name+'」：有多筆同名物品，請改用單筆搜尋確認。');continue;}
  const item=matches[0],old=groups.get(item.id);
  if(old){
   if(old.qty+qty>MAX_QTY){errors.push('第 '+(i+1)+' 列「'+name+'」：合併後數量超過 999999。');continue;}
   old.qty+=qty;old.lines.push(i+1);duplicates++;
  }else groups.set(item.id,{item,name:item.name,qty,lines:[i+1],recipe:null,options:[]});
 }
 if(!count&&!errors.length)errors.push('請先貼上道具名稱及數量兩欄。');
 for(const row of groups.values()){
  const producers=engine.producers.get(row.item.id)||[];
  if(!producers.length){errors.push('「'+row.name+'」：沒有可用的製作配方。');continue;}
  try{row.recipe=engine.choose(row.item.id);}
  catch(err){
   if(err.detail?.choices?.length)row.options=err.detail.choices;
   else errors.push('「'+row.name+'」：'+err.message);
  }
 }
 const rows=[...groups.values()],total=rows.reduce((n,r)=>n+r.qty,0);
 return {rows,errors,count,total,duplicates,input:raw};
}
function buildTargets(parsed,choices,engine){
 if(!parsed||parsed.errors.length)throw Error('請先修正清單錯誤，再重新加入。');
 const incoming=[];
 for(const row of parsed.rows){
  const selected=choices?.[row.item.id],recipeId=selected?Number(selected):row.recipe?.id;
  const recipe=engine.recipes.get(recipeId);
  if(!recipe||recipe.item!==row.item.id||(row.options.length&&!row.options.some(r=>r.id===recipeId)))throw Error('「'+row.name+'」有多種配方，請先選擇要用的製作配方。');
  incoming.push({mode:'craft',recipe:recipe.id,qty:row.qty});
 }
 return engine.normalize(incoming);
}
const api={parse,buildTargets,parseQty,nameKey};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.FF14BulkTargets=api;
})(globalThis);
