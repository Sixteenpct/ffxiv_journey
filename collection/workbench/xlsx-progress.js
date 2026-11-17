/* Read only the named crafting atlas worksheet locally, without external services. */
(function(root){
'use strict';
const FILE_LIMIT=20*1024*1024,XML_LIMIT=24*1024*1024;
const utf8=new TextDecoder('utf-8',{fatal:true});
function fail(s){throw Error('Excel 匯入失敗：'+s);}
function attr(s,name){const m=String(s).match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\'])(.*?)\\1','i'));return m?m[2]:null;}
function unxml(s){return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,e)=>{if(e[0]==='#'){const n=e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[e.toLowerCase()];});}
function all(xml,tag){const out=[],re=new RegExp('<(?:[\\w.-]+:)?'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'\\s*>','g');let m;while((m=re.exec(xml))!==null)out.push(m[1]);return out;}
function val(xml,tag){return unxml(all(xml,tag).join(''));}
function unzip(bytes){
 if(bytes.byteLength>FILE_LIMIT)fail('檔案超過 20 MB。');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),len=bytes.length;
 let end=-1;for(let i=len-22;i>=Math.max(0,len-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)fail('這不是有效的 Excel 活頁簿（.xlsx）。');
 const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true),directorySize=view.getUint32(end+12,true);
 if(count>2048||count===65535||offset===0xffffffff||offset+directorySize>len)fail('不支援這個 Excel 檔案的壓縮結構。');
 let p=offset;const files=new Map();
 for(let i=0;i<count;i++){
  if(p+46>len||view.getUint32(p,true)!==0x02014b50)fail('Excel 壓縮目錄損壞。');
  const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),size=view.getUint32(p+20,true),plain=view.getUint32(p+24,true),nameLength=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),local=view.getUint32(p+42,true);
  const next=p+46+nameLength+extra+comment;if(next>len)fail('壓縮項目不完整。');
  const name=utf8.decode(bytes.subarray(p+46,p+46+nameLength));
  if(files.has(name))fail('檔案內有重複項目。');
  files.set(name,{flags,method,size,plain,local});p=next;
 }
 return async function read(name,optional=false){
  const f=files.get(name);if(!f){if(optional)return null;fail('缺少必要的 Excel 工作表資料。');}
  if(f.flags&1||![0,8].includes(f.method))fail('不支援加密的 Excel 或其他壓縮格式。');
  if(f.size>FILE_LIMIT||f.plain>XML_LIMIT)fail('Excel 工作表資料過大。');
  if(f.local+30>len||view.getUint32(f.local,true)!==0x04034b50)fail('Excel 壓縮內容損壞。');
  const at=f.local+30+view.getUint16(f.local+26,true)+view.getUint16(f.local+28,true);
  if(at+f.size>len)fail('Excel 資料長度不正確。');
  const zipped=bytes.subarray(at,at+f.size);
  if(f.method===0){if(zipped.length!==f.plain)fail('Excel 資料長度不一致。');return utf8.decode(zipped);}
  if(typeof DecompressionStream!=='function')fail('瀏覽器不支援直接讀取 Excel，請更新瀏覽器或改用 CSV。');
  let reader;try{reader=new Blob([zipped]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();}catch(_){fail('瀏覽器無法解壓 Excel，請改用 CSV。');}
  const chunks=[];let length=0;
  try{while(true){const x=await reader.read();if(x.done)break;length+=x.value.length;if(length>XML_LIMIT){await reader.cancel();fail('Excel 解壓資料超過安全大小。');}chunks.push(x.value);}}
  catch(e){if(e.message?.startsWith('Excel 匯入失敗：'))throw e;fail('Excel 檔案解壓失敗，請重新下載檔案。');}
  if(length!==f.plain)fail('Excel 資料長度不一致。');
  const result=new Uint8Array(length);let j=0;for(const c of chunks){result.set(c,j);j+=c.length;}
  return utf8.decode(result);
 };
}
function sheetId(xml,name){const re=/<(?:[\w.-]+:)?sheet\b([^>]*?)\/?\s*>/g;let m;while((m=re.exec(xml))!==null)if(unxml(attr(m[1],'name')||'')===name)return attr(m[1],'r:id');return null;}
function sheetTarget(xml,id){const re=/<(?:[\w.-]+:)?Relationship\b([^>]*?)\/?\s*>/g;let m;while((m=re.exec(xml))!==null)if(attr(m[1],'Id')===id&&/\/worksheet$/.test(attr(m[1],'Type')||''))return unxml(attr(m[1],'Target')||'');return null;}
function pathOf(target){const p=target.startsWith('/xl/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target;if(!/^xl\/worksheets\/[\w.-]+\.xml$/.test(p))fail('Excel 工作表路徑不正確。');return p;}
function strings(xml){if(!xml)return [];const out=[],re=/<(?:[\w.-]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?si\s*>/g;let m;while((m=re.exec(xml))!==null)out.push(val(m[1],'t'));return out;}
function cell(xml,at,sst){const type=attr(at,'t')||'',v=val(xml,'v');if(type==='s'){const i=Number(v);if(!Number.isSafeInteger(i)||i<0||i>=sst.length)fail('文字索引錯誤。');return sst[i];}if(type==='inlineStr')return val(xml,'t');if(type==='b')return v==='1'?'TRUE':v==='0'?'FALSE':v;if(type==='e')fail('製作圖鑑有錯誤儲存格。');return v;}
function rowsOf(xml,sst){
 const rows=[],rs=/<(?:[\w.-]+:)?row\b([^>]*?)>([\s\S]*?)<\/(?:[\w.-]+:)?row\s*>/g;let m;
 while((m=rs.exec(xml))!==null){
  const row=Number(attr(m[1],'r'));if(!Number.isSafeInteger(row)||row<1)fail('工作表列號無效。');
  let done='',recipe='';const cs=/<(?:[\w.-]+:)?c\b([^>]*?)>([\s\S]*?)<\/(?:[\w.-]+:)?c\s*>/g;let c;
  while((c=cs.exec(m[2]))!==null){const addr=attr(c[1],'r');if(addr==='A'+row)done=cell(c[2],c[1],sst);else if(addr==='I'+row)recipe=cell(c[2],c[1],sst);}
  if(row===1){if(done.trim()!=='已登錄'||recipe.trim()!=='recipe_id')fail('請使用含「製作圖鑑」及配方 ID 欄位的模板。');rows.push(['已登錄','recipe_id']);}
  else if(done!==''||recipe!=='')rows.push([done,recipe]);
 }
 if(rows[0]?.[0]!=='已登錄')fail('找不到「製作圖鑑」的必要欄位。');
 return rows;
}
function unlockRowsOf(xml,sst){
 const rows=[['已登錄','completion_type','completion_id']];
 const re=/<(?:[\w.-]+:)?row\b([^>]*?)>([\s\S]*?)<\/(?:[\w.-]+:)?row\s*>/g;
 let match;const seen=new Set();let headersOk=false;
 while((match=re.exec(xml))!==null){
  const num=Number(attr(match[1],'r'));
  if(!Number.isSafeInteger(num)||num<1)fail('永久收藏列號無效。');
  const cells=new Map(),cs=/<(?:[\w.-]+:)?c\b([^>]*?)>([\s\S]*?)<\/(?:[\w.-]+:)?c\s*>/g;let m;
  while((m=cs.exec(match[2]))!==null){
   const address=attr(m[1],'r');
   if(['A','H','J'].some(c=>address===c+num))cells.set(address[0],cell(m[2],m[1],sst));
  }
  if(num===1){
   if(cells.get('A')!=='已登錄'||cells.get('H')!=='item_id'||cells.get('J')!=='registration_status')fail('永久收藏欄位與模板不符。');
   headersOk=true;continue;
  }
  if(!cells.size)continue;
  const done=String(cells.get('A')??'').trim(),id=String(cells.get('H')??'').trim(),kind=String(cells.get('J')??'').trim();
  const item=Number(id);
  if(kind!=='unlock'||!Number.isSafeInteger(item)||item<=0||!['TRUE','FALSE','1','0'].includes(done.toUpperCase()))fail('永久收藏第 '+num+' 列的完成值或 ID 不正確。');
  if(seen.has(item))fail('永久收藏有重複的 item_id：'+item);
  seen.add(item);rows.push([done,'permanent_unlock',String(item)]);
 }
 if(!headersOk||rows.length<2)fail('永久收藏工作表是空白或缺少必要欄位。');
 return rows;
}
async function parseAll(buffer){
 const read=unzip(buffer instanceof Uint8Array?buffer:new Uint8Array(buffer));
 const workbook=await read('xl/workbook.xml'),rels=await read('xl/_rels/workbook.xml.rels');
 const id=sheetId(workbook,'製作圖鑑');if(!id)fail('找不到「製作圖鑑」工作表。');
 const target=sheetTarget(rels,id);if(!target)fail('找不到製作圖鑑工作表內容。');
 const sst=strings(await read('xl/sharedStrings.xml',true));
 const recipes=rowsOf(await read(pathOf(target)),sst);
 const permanentId=sheetId(workbook,'永久收藏');
 let unlocks=[];
 if(permanentId){
  const permanentTarget=sheetTarget(rels,permanentId);if(!permanentTarget)fail('找不到「永久收藏」工作表內容。');
  unlocks=unlockRowsOf(await read(pathOf(permanentTarget)),sst);
 }
 return{recipes,unlocks};
}
async function parse(buffer){return (await parseAll(buffer)).recipes;}
const api={parse,parseAll};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FF14XlsxProgress=api;
})(typeof window!=='undefined'?window:globalThis);
