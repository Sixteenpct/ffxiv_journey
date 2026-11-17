/* Create a standalone Excel workbook locally without external services. */
(function(root){
'use strict';
const MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const encoder=new TextEncoder();
function xml(v){
 return String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').slice(0,32767)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function column(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
function worksheet(rows,widths){
 const count=rows[0].length, end=column(count)+rows.length;
 const cols=Array.from({length:count},(_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(Number(widths[i])||18)+'" customWidth="1"/>').join('');
 const data=rows.map((row,i)=>{
  if(!Array.isArray(row)||row.length!==count)throw Error('Excel 匯出資料欄位不一致。');
  const cells=row.map((v,j)=>'<c r="'+column(j+1)+(i+1)+'" t="inlineStr"'+(i===0?' s="1"':'')+'><is><t xml:space="preserve">'+xml(v)+'</t></is></c>').join('');
  return '<row r="'+(i+1)+'"'+(i===0?' ht="27" customHeight="1"':'')+'>'+cells+'</row>';
 }).join('');
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +'<dimension ref="A1:'+end+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
  +'<sheetFormatPr defaultRowHeight="19"/><cols>'+cols+'</cols><sheetData>'+data+'</sheetData>'
  +'<autoFilter ref="A1:'+end+'"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'
  +'</worksheet>';
}
const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 +'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
 +'<fonts count="2"><font><sz val="11"/><name val="Microsoft JhengHei"/></font><font><b/><sz val="11"/><color rgb="FF284E69"/><name val="Microsoft JhengHei"/></font></fonts>'
 +'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC8E6F7"/><bgColor indexed="64"/></patternFill></fill></fills>'
 +'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
 +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
 +'<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>'
 +'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
 +'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
 +'<Default Extension="xml" ContentType="application/xml"/>'
 +'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
 +'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
 +'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
const relationships='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
const workbookRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
 +'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(entries){
 const locals=[],centrals=[];let offset=0,centralSize=0;
 for(const [name,content] of entries){
  const nameBytes=encoder.encode(name),bytes=encoder.encode(content),sum=crc(bytes);
  const local=new Uint8Array(30),lv=new DataView(local.buffer);
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(10,0,true);lv.setUint16(12,33,true);
  lv.setUint32(14,sum,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,nameBytes.length,true);
  locals.push(local,nameBytes,bytes);
  const central=new Uint8Array(46),cv=new DataView(central.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(14,33,true);
  cv.setUint32(16,sum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,nameBytes.length,true);cv.setUint32(42,offset,true);
  centrals.push(central,nameBytes);
  offset+=local.length+nameBytes.length+bytes.length;centralSize+=central.length+nameBytes.length;
 }
 const footer=new Uint8Array(22),fv=new DataView(footer.buffer);
 fv.setUint32(0,0x06054b50,true);fv.setUint16(8,entries.length,true);fv.setUint16(10,entries.length,true);
 fv.setUint32(12,centralSize,true);fv.setUint32(16,offset,true);
 return new Blob([...locals,...centrals,footer],{type:MIME});
}
function build(rows,options={}){
 if(!Array.isArray(rows)||!rows.length||!Array.isArray(rows[0])||!rows[0].length)throw Error('沒有可以匯出的 Excel 資料。');
 if(rows[0].length>40||rows.length>100000)throw Error('Excel 匯出資料量超過支援範圍。');
 const name=String(options.sheetName||'製作與登錄進度').replace(/[\[\]:*?\/\\]/g,'').slice(0,31)||'進度';
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
  +'<sheets><sheet name="'+xml(name)+'" sheetId="1" r:id="rId1"/></sheets></workbook>';
 return zip([
  ['[Content_Types].xml',contentTypes],
  ['_rels/.rels',relationships],
  ['xl/workbook.xml',workbook],
  ['xl/_rels/workbook.xml.rels',workbookRels],
  ['xl/worksheets/sheet1.xml',worksheet(rows,options.widths||[])],
  ['xl/styles.xml',styles]
 ]);
}
const api={build,MIME};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FF14XlsxExport=api;
})(typeof window!=='undefined'?window:globalThis);
