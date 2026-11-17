/* Export the full crafting atlas by preserving the official in-site XLSX template. */
(function(root){
'use strict';
const MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const crcTable=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function xml(s){return String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').slice(0,32767).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function parseZip(buffer){
 const data=new Uint8Array(buffer),v=new DataView(data.buffer,data.byteOffset,data.byteLength);
 let end=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Excel 模板壓縮結構無效。');
 const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),start=v.getUint32(end+16,true);
 if(!count||count>2000||start+size>data.length)throw Error('Excel 模板壓縮目錄異常。');
 let p=start;const out=new Map();
 for(let i=0;i<count;i++){
  if(p+46>data.length||v.getUint32(p,true)!==0x02014b50)throw Error('Excel 模板目錄損壞。');
  const method=v.getUint16(p+10,true),flags=v.getUint16(p+8,true),sum=v.getUint32(p+16,true);
  const packedSize=v.getUint32(p+20,true),plainSize=v.getUint32(p+24,true);
  const nameSize=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);
  if((flags&1)||![0,8].includes(method)||plainSize>100*1024*1024||packedSize>20*1024*1024)throw Error('Excel 模板含不支援的壓縮內容。');
  const name=decoder.decode(data.subarray(p+46,p+46+nameSize)),local=offset;
  if(out.has(name)||local+30>data.length||v.getUint32(local,true)!==0x04034b50)throw Error('Excel 模板項目異常。');
  const at=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);
  if(at+packedSize>data.length)throw Error('Excel 模板資料不完整。');
  out.set(name,{name,method,sum,plainSize,packed:data.subarray(at,at+packedSize)});
  p+=46+nameSize+extra+comment;
 }
 return out;
}
async function readEntry(entry){
 if(!entry)throw Error('Excel 模板缺少必要工作表。');
 if(entry.method===0)return decoder.decode(entry.packed);
 if(typeof DecompressionStream!=='function')throw Error('此瀏覽器無法解壓 Excel 模板，請更新瀏覽器。');
 const stream=new Blob([entry.packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const reader=stream.getReader(),chunks=[];let size=0;
 try{
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>100*1024*1024)throw Error('Excel 模板解壓資料過大。');chunks.push(r.value);}
 }finally{reader.releaseLock();}
 if(size!==entry.plainSize)throw Error('Excel 模板資料長度不一致。');
 const out=new Uint8Array(size);let p=0;for(const c of chunks){out.set(c,p);p+=c.length;}
 return decoder.decode(out);
}
function stored(name,content){const packed=encoder.encode(content);return{name,method:0,packed,plainSize:packed.length,sum:crc32(packed)};}
function buildZip(entries){
 const local=[],central=[];let offset=0,centralSize=0;
 for(const e of entries){
  const name=encoder.encode(e.name),l=new Uint8Array(30),lv=new DataView(l.buffer);
  if(name.length>65535||e.packed.length>0xffffffff)throw Error('Excel 輸出檔過大。');
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(8,e.method,true);lv.setUint16(10,0,true);
  lv.setUint32(14,e.sum,true);lv.setUint32(18,e.packed.length,true);lv.setUint32(22,e.plainSize,true);lv.setUint16(26,name.length,true);
  local.push(l,name,e.packed);
  const c=new Uint8Array(46),cv=new DataView(c.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,e.method,true);
  cv.setUint32(16,e.sum,true);cv.setUint32(20,e.packed.length,true);cv.setUint32(24,e.plainSize,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);
  central.push(c,name);offset+=l.length+name.length+e.packed.length;centralSize+=c.length+name.length;
 }
 const footer=new Uint8Array(22),fv=new DataView(footer.buffer);fv.setUint32(0,0x06054b50,true);fv.setUint16(8,entries.length,true);fv.setUint16(10,entries.length,true);fv.setUint32(12,centralSize,true);fv.setUint32(16,offset,true);
 return new Blob([...local,...central,footer],{type:MIME});
}
function patchAtlas(sheet,completion){
 if(!sheet.includes('<x:c r="A1"')||!sheet.includes('<x:c r="I1"'))throw Error('Excel 模板製作圖鑑欄位已變更。');
 let rowCount=0,doneCount=0;
 const replaced=sheet.replace(/(<x:row\b[^>]*\br="(\d+)"[^>]*>)([\s\S]*?)(<\/x:row>)/g,(all,open,line,inside,close)=>{
  const no=Number(line);if(no===1)return all;
  const id=inside.match(new RegExp('<x:c r="I'+no+'"[^>]*><x:v>(\\d+)(?:\\.0)?</x:v></x:c>'));
  if(!id)return all; // Leave formatting-only or non-recipe rows untouched.
  const flag=completion['recipe_completion:'+Number(id[1])]===true?'1':'0';
  const cell=new RegExp('(<x:c r="A'+no+'"[^>]*t="b"[^>]*><x:v>)[01](</x:v></x:c>)');
  if(!cell.test(inside))throw Error('Excel 模板第 '+no+' 列缺少登錄欄。');
  rowCount++;if(flag==='1')doneCount++;
  return open+inside.replace(cell,(_,a,b)=>a+flag+b)+close;
 });
 if(rowCount!==6093)throw Error('Excel 模板配方數量不符（'+rowCount+' / 6093），停止匯出。');
 // TRUE/FALSE list works in older Excel versions without checkbox controls.
 const validation='<x:dataValidations count="1"><x:dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="無效完成值" error="請選擇 TRUE 或 FALSE" sqref="A2:A6094"><x:formula1>"TRUE,FALSE"</x:formula1></x:dataValidation></x:dataValidations>';
 // OOXML requires dataValidations after autoFilter/conditionalFormatting, before pageMargins and extLst.
 const tailTags=['<x:hyperlinks','<x:printOptions','<x:pageMargins','<x:headerFooter','<x:rowBreaks','<x:colBreaks','<x:customProperties','<x:cellWatches','<x:ignoredErrors','<x:smartTags','<x:drawing','<x:legacyDrawing','<x:controls','<x:webPublishItems','<x:tableParts','<x:extLst','</x:worksheet>'];
 const offsets=tailTags.map(tag=>replaced.indexOf(tag)).filter(n=>n>=0);
 const offset=Math.min(...offsets);
 if(!Number.isFinite(offset))throw Error('Excel 模板工作表結構已變更。');
 const validXml=replaced.includes('<x:dataValidations')?replaced:replaced.slice(0,offset)+validation+replaced.slice(offset);
 return{xml:validXml,rows:rowCount,done:doneCount};
}
function newUnlockSheet(rows){
 const fields=['已登錄','版本','製作職業','等級','物品名稱','物品分類','配方範圍','item_id','recipe_id','registration_status','result_yield'];
 const row=(cells,i)=>'<x:row r="'+i+'">'+cells.map((v,j)=>{
  const ref=String.fromCharCode(65+j)+i,head=i===1,boolean=j===0&&!head,number=j===7&&!head;
  if(boolean)return'<x:c r="'+ref+'" s="7" t="b"><x:v>'+(v?'1':'0')+'</x:v></x:c>';
  if(number)return'<x:c r="'+ref+'" s="5"><x:v>'+Number(v)+'</x:v></x:c>';
  return'<x:c r="'+ref+'" s="'+(head?'1':'5')+'" t="inlineStr"><x:is><x:t>'+xml(v)+'</x:t></x:is></x:c>';
 }).join('')+'</x:row>';
 const all=[row(fields,1),...rows.map((r,i)=>row([r.completed,r.version,r.job,r.level,r.name,r.category,'永久收藏',r.item,'','unlock',1],i+2))].join('');
 return'<?xml version="1.0" encoding="utf-8"?>'
  +'<x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +'<x:sheetViews><x:sheetView workbookViewId="0"><x:pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></x:sheetView></x:sheetViews>'
  +'<x:sheetFormatPr defaultColWidth="12.63" defaultRowHeight="15.75"/>'
  +'<x:cols><x:col min="1" max="1" width="8.5" customWidth="1"/><x:col min="2" max="2" width="7" customWidth="1"/><x:col min="3" max="3" width="18" customWidth="1"/><x:col min="4" max="4" width="8" customWidth="1"/><x:col min="5" max="5" width="34" customWidth="1"/><x:col min="6" max="7" width="16" customWidth="1"/><x:col min="8" max="11" hidden="1"/></x:cols>'
  +'<x:sheetData>'+all+'</x:sheetData><x:autoFilter ref="A1:G'+(rows.length+1)+'"/>'
  +'<x:dataValidations count="1"><x:dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="無效完成值" error="請選擇 TRUE 或 FALSE" sqref="A2:A'+(rows.length+1)+'"><x:formula1>"TRUE,FALSE"</x:formula1></x:dataValidation></x:dataValidations></x:worksheet>';
}
function addUnlockSheet(entries,rows){
 const wb='xl/workbook.xml',rels='xl/_rels/workbook.xml.rels',types='[Content_Types].xml',name='xl/worksheets/sheet4.xml',relId='RFF14CollectionUnlock';
 return Promise.all([readEntry(entries.get(wb)),readEntry(entries.get(rels)),readEntry(entries.get(types))]).then(([w,r,t])=>{
  if(!w.includes('</x:sheets>')||!r.includes('</Relationships>')||!t.includes('</Types>'))throw Error('Excel 模板工作表結構無法辨識。');
  const xmlW=w.replace('</x:sheets>','<x:sheet name="永久收藏" sheetId="6" r:id="'+relId+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></x:sheets>');
  const xmlR=r.replace('</Relationships>','<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet4.xml" Id="'+relId+'"/></Relationships>');
  const xmlT=t.replace('</Types>','<Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  entries.set(wb,stored(wb,xmlW));entries.set(rels,stored(rels,xmlR));entries.set(types,stored(types,xmlT));entries.set(name,stored(name,newUnlockSheet(rows)));
 });
}
async function fromTemplate(buffer,completion,unlocks=[]){
 const entries=parseZip(buffer),atlas='xl/worksheets/sheet1.xml';
 const result=patchAtlas(await readEntry(entries.get(atlas)),completion||{});
 entries.set(atlas,stored(atlas,result.xml));
 await addUnlockSheet(entries,unlocks);
 return{blob:buildZip([...entries.values()]),recipeCount:result.rows,recipeCompleted:result.done,unlockCount:unlocks.length};
}
const api={fromTemplate,MIME};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FF14XlsxExport=api;
})(typeof window!=='undefined'?window:globalThis);
