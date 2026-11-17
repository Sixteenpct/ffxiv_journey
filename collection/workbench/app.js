'use strict';
const db=FF14_CATALOG,e=FF14Core.createEngine(db),S=FF14State,$=id=>document.getElementById(id);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h=escapeHtml,fmt=n=>Number(n||0).toLocaleString('zh-TW'),byId=id=>e.items.get(Number(id));
const craftingJobOrder=['木工','鍛造','甲冑','金工','皮革','裁縫','鍊金','烹調'];
const jobRank=job=>{const n=craftingJobOrder.indexOf(job);return n<0?99:n;};
const compareJobs=(a,b)=>jobRank(a)-jobRank(b)||String(a||'').localeCompare(String(b||''),'zh-Hant');
const compareRecipes=(a,b)=>compareJobs(a?.job,b?.job)||(a?.level||0)-(b?.level||0)||e.name(a?.item).localeCompare(e.name(b?.item),'zh-Hant',{numeric:true})||(a?.id||0)-(b?.id||0);
function compareRecipeTargets(a,b){return compareRecipes(e.recipes.get(a.recipe),e.recipes.get(b.recipe))||e.name(a.item).localeCompare(e.name(b.item),'zh-Hant',{numeric:true})||String(a.key||'').localeCompare(String(b.key||''));}
let state=S.empty(),plan=null,zero=null,branchPlan=null,tab='home',collectionPage=0,importPending=null,restorePending=null,historyPage=0;
let collectionQueried=false,targetPage=0;
let collectionFilter={q:'',kind:'all',only:false,columns:{}};
try{const stored=localStorage.getItem(S.KEY);if(stored)state=S.validate(JSON.parse(stored));else if(globalThis.FF14_BOOTSTRAP)state=S.validate(globalThis.FF14_BOOTSTRAP);}catch(err){$('notice').className='warning';$('notice').textContent='原備份讀取失敗，尚未覆蓋瀏覽器資料。請先匯出原資料或使用備份恢復：'+err.message;}
let storageBlocked=!!$('notice').textContent;
let toastTimer,toastHideTimer;
function showToast(message){if(typeof clearTimeout==='function'){clearTimeout(toastTimer);clearTimeout(toastHideTimer);}$('toast').textContent=message;$('toast').hidden=false;$('toast').classList.remove('fade-out');toastTimer=setTimeout(()=>{$('toast').classList.add('fade-out');toastHideTimer=setTimeout(()=>{$('toast').hidden=true;},200);},1300);}
function notify(message,error=false){if(message){showToast(message);return;}$('notice').textContent='';$('toast').hidden=true;}

function save(){if(storageBlocked)throw Error('原資料尚未恢復，禁止覆蓋');try{localStorage.setItem(S.KEY,JSON.stringify(state));$('save-status').innerHTML='已儲存於此瀏覽器<span class="save-time">'+h(new Date().toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit'}))+'</span>';}catch(err){notify('無法保存，請立即匯出備份：'+err.message,true);throw err;}}
function commit(next){const old=state;state=next;try{save();}catch(err){state=old;throw err;}}
function update(fn){const next=structuredClone(state);fn(next);commit(next);}
function safe(fn){try{return fn();}catch(err){notify(err.message,true);}}
function downloadBlob(name,blob){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function download(name,text,type='application/json'){downloadBlob(name,new Blob([text],{type}));}
function backup(){if(storageBlocked){download('ff14-original-recovery.json',localStorage.getItem(S.KEY)||'{}');return;}download('ff14-workbench-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2));}
const titles={home:['素材製作工坊','製作備料、素材用途與收藏進度。'],a:['指定成品，展開備料','加入這次要做的東西，素材製作工坊會一起計算庫存、批次與缺料。'],b:['從素材，找到收藏用途','先保留完整下游母清單，再把選定目標交給同一套備料計算。'],collection:['製作與登錄進度','管理製作筆記與永久登錄項目的完成狀態，掌握尚待完成的製作目標。'],history:['留下記錄，下次接著做','實際製作與工作備註，都留在這個素材製作工坊。'],data:['資料與備份','下載空白製作圖鑑、匯入進度，或備份整個工坊。']};
function showTab(key){tab=key;document.querySelector('.scroll-tools').hidden=key==='home'||key==='data';document.body.classList.toggle('route-a-open',key==='a');$('route-toc').hidden=key!=='a';$('tab-'+key).prepend($('notice'));if(!storageBlocked)notify('');else $('notice').hidden=key!=='data';$('toast').hidden=true;document.querySelectorAll('.page').forEach(x=>x.hidden=x.id!=='tab-'+key);document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===key));$('page-title').textContent=titles[key][0];$('crumb').textContent=key==='home'?'首頁':document.querySelector('nav button[data-tab="'+key+'"]').textContent.replace(/^\d+\s*/, '').trim();$('back-home').hidden=key==='home';$('page-description').textContent=titles[key][1];if(key==='collection')renderCollection();if(key==='history')renderHistory();if(key==='a')highlightToc();}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$('back-home').addEventListener('click',()=>showTab('home'));
document.querySelectorAll('[data-go-home]').forEach(b=>b.addEventListener('click',event=>{event.preventDefault();showTab('home');}));
if(window.matchMedia?.('(max-width:1100px)').matches)$('route-toc').open=false;
document.querySelectorAll('[data-home-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.homeTab)));
function itemMatches(id,q){const x=byId(id);return x&&(x.name.includes(q)||String(id)===q);}
function recipeLabel(r){return r.job+' · Lv.'+r.level+' · '+r.scope+' · 每批 '+r.yieldQty+' 個';}
function recipeSearch(){const q=$('target-search').value.trim();if(!q){$('target-results').innerHTML='<div class="empty">找不到符合的項目</div>';return;}const rs=db.recipes.filter(r=>itemMatches(r.item,q)).sort((a,b)=>compareJobs(a.job,b.job)||Number(b.tracked)-Number(a.tracked)||compareRecipes(a,b)).slice(0,35);$('target-results').innerHTML=rs.map(r=>`<div class="search-row"><div>${h(e.name(r.item))}<small>${h(recipeLabel(r))}${r.quest?' · 有任務条件':''}${r.expert?' · 專家配方':''}${r.specialist?' · 需專用條件':''}</small></div><label class="target-add-qty">數量<input type="number" min="1" max="999999" step="1" value="1" inputmode="numeric" data-add-qty="${r.id}" aria-label="${h(e.name(r.item))}加入數量"></label><button type="button" data-add="${r.id}">加入</button></div>`).join('')||'<div class="empty">找不到符合的項目</div>';}
function clearRouteA(){update(s=>{s.targets=[];s.routeInventory={};});targetPage=0;$('target-results').innerHTML='';$('route-issues').innerHTML='';plan=null;zero=null;branchPlan=null;renderTargets();renderPlan();notify('');}
function routeHasData(route){return route==='a'?(state.targets.length>0||!!$('target-results').querySelector('[data-add]')):!!state.mother;}
function queryRoute(route){if(route==='a'){recipeSearch();return;}const populated=routeHasData(route);if(populated&&!window.confirm('查詢將清空當前畫面資料，確定嗎？'))return;clearMother();$('material-feedback').textContent='';materialSearch();}
$('target-query').addEventListener('submit',event=>{event.preventDefault();safe(()=>queryRoute('a'));});
$('target-results').addEventListener('click',event=>safe(()=>{const b=event.target.closest('[data-add]');if(!b)return;const recipe=Number(b.dataset.add);const raw=b.parentElement.querySelector('[data-add-qty]')?.value.trim()||'';if(!/^\d+$/.test(raw))throw Error('加入數量請輸入 1～999999 的整數');const qty=FF14Core.integer(raw,'加入數量');if(qty<1||qty>999999)throw Error('加入數量請輸入 1～999999 的整數');update(s=>{const existing=s.targets.find(t=>t.mode==='craft'&&t.recipe===recipe);if((existing?.qty||0)+qty>999999)throw Error('累加後的目標數量不得超過 999999');s.targets.push({mode:'craft',recipe,qty});s.targets=e.normalize(s.targets);});renderTargets();calculate();notify('已加入本次目標。');}));

let routeBulkPending=null;
function routeBulkResetPreview(){
 routeBulkPending=null;
 $('route-bulk-preview').innerHTML='';
 $('route-bulk-apply').hidden=true;
}
$('route-bulk-input').addEventListener('input',()=>{routeBulkResetPreview();$('route-bulk-feedback').textContent='';});
$('route-bulk-mode').addEventListener('change',()=>{if(routeBulkPending)$('route-bulk-feedback').textContent='清單已檢查，可依目前選擇的匯入方式確認。';});
$('route-bulk-clear').addEventListener('click',()=>{$('route-bulk-input').value='';routeBulkResetPreview();$('route-bulk-feedback').textContent='';$('route-bulk-input').focus();});
$('route-bulk-check').addEventListener('click',()=>safe(()=>{
 routeBulkResetPreview();
 const parsed=FF14BulkTargets.parse($('route-bulk-input').value,e);
 if(parsed.errors.length){
  const shown=parsed.errors.slice(0,12);
  $('route-bulk-feedback').innerHTML='<div class="error"><strong>尚未匯入，請修正以下問題（共 '+parsed.errors.length+' 項）：</strong><ul>'+shown.map(msg=>'<li>'+h(msg)+'</li>').join('')+'</ul>'+(parsed.errors.length>shown.length?'<p>其餘 '+(parsed.errors.length-shown.length)+' 項錯誤未列出。</p>':'')+'</div>';
  return;
 }
 routeBulkPending=parsed;
 const ambiguous=parsed.rows.filter(row=>row.options.length);
 $('route-bulk-feedback').innerHTML='<div class="route-bulk-ok">✅ 已檢查 '+parsed.count+' 列，合併為 '+parsed.rows.length+' 種道具、需求 '+fmt(parsed.total)+' 個'+(parsed.duplicates?'（合併 '+parsed.duplicates+' 列重複道具）':'')+'。'+(ambiguous.length?'其中 '+ambiguous.length+' 種道具需要先選擇配方。':'請確認下方資料。')+'</div>';
 $('route-bulk-preview').innerHTML='<div class="route-bulk-table"><table><thead><tr><th>道具名稱</th><th>需求數量</th><th>製作配方</th></tr></thead><tbody>'+parsed.rows.map(row=>'<tr><td>'+h(row.name)+'</td><td class="num">'+fmt(row.qty)+'</td><td>'+(row.options.length?'<select data-bulk-recipe="'+row.item.id+'" aria-label="'+h(row.name)+'製作配方"><option value="">請選擇配方</option>'+row.options.slice().sort(compareRecipes).map(recipe=>'<option value="'+recipe.id+'">'+h(recipeLabel(recipe))+'</option>').join('')+'</select>':row.recipe?h(recipeLabel(row.recipe)):'待確認')+'</td></tr>').join('')+'</tbody></table></div>';
 $('route-bulk-apply').hidden=false;
}));
$('route-bulk-apply').addEventListener('click',()=>safe(()=>{
 const current=$('route-bulk-input').value.replace(/^\uFEFF/,'');
 if(!routeBulkPending||routeBulkPending.input!==current)throw Error('貼上內容已變動，請重新檢查清單。');
 const choices={};
 $('route-bulk-preview').querySelectorAll('[data-bulk-recipe]').forEach(select=>{if(select.value)choices[Number(select.dataset.bulkRecipe)]=Number(select.value);});
 const mode=$('route-bulk-mode').value;
 const targets=FF14BulkTargets.buildTargets(routeBulkPending,choices,state.targets,mode,e);
 if(mode==='replace'&&state.targets.length&&!window.confirm('確定以這批 '+routeBulkPending.rows.length+' 種道具取代現有的 '+state.targets.length+' 項目標？此操作會清空本次備料現貨，但不影響背包與完成進度。'))return;
 const amount=routeBulkPending.rows.length;
 update(s=>{s.targets=targets;if(mode==='replace')s.routeInventory={};});
 targetPage=0;
 $('target-results').innerHTML='';
 renderTargets();calculate();
 $('route-bulk-input').value='';
 routeBulkResetPreview();
 $('route-bulk-feedback').innerHTML='<div class="route-bulk-ok">✅ 已'+(mode==='replace'?'取代':'加入')+' '+amount+' 種道具，本次目標共 '+state.targets.length+' 項。請查看下方備料結果；若出現配方分歧提示，依提示選擇即可。</div>';
 notify('已匯入 '+amount+' 種道具。');
}));
function renderTargets(){const ts=state.targets.map((t,index)=>({t,index})).sort((a,b)=>compareRecipeTargets(a.t,b.t)),pages=Math.max(1,Math.ceil(ts.length/12));targetPage=Math.min(targetPage,pages-1);$('target-count').textContent=ts.length+' 項';$('targets').innerHTML=ts.length?`<div class="table-scroll"><table style="min-width:645px">${fixedColumns([280,90,110,90,75])}<thead><tr><th>成品</th><th>製作職業</th><th>目的</th><th>數量</th><th></th></tr></thead><tbody>${ts.slice(targetPage*12,(targetPage+1)*12).map(({t,index:i})=>{return `<tr><td>${h(e.name(t.item||e.recipes.get(t.recipe)?.item))}</td><td>${t.recipe?h(e.recipes.get(t.recipe).job):'—'}</td><td>${t.mode==='completion'?'製作筆記':t.mode==='unlock'?'永久收藏':'指定製作'}</td><td>${t.mode==='craft'?`<input type="number" min="1" max="999999" aria-label="${h(e.name(t.item))}需求量" value="${t.qty}" data-target-qty="${i}">`:'1'}</td><td><button class="secondary" data-remove="${i}" aria-label="移除${h(e.name(t.item))}">移除</button></td></tr>`;}).join('')}</tbody></table></div>${routePager('target',targetPage,ts.length,12)}`:'<div class="empty">從上方搜尋，加入第一個成品。</div>';}
$('targets').addEventListener('click',event=>safe(()=>{const jump=event.target.closest('[data-target-page]');if(jump){targetPage=Math.max(0,Math.min(Math.ceil(state.targets.length/12)-1,Number(jump.dataset.targetPage)));renderTargets();return;}const b=event.target.closest('[data-remove]');if(!b)return;update(s=>s.targets.splice(Number(b.dataset.remove),1));renderTargets();calculate();}));
$('targets').addEventListener('submit',event=>{if(event.target.id!=='target-jump')return;event.preventDefault();safe(()=>jumpRoutePage('target',12,state.targets.length,targetPage,n=>targetPage=n,renderTargets));});
$('targets').addEventListener('change',event=>safe(()=>{if(!event.target.matches('[data-target-qty]'))return;const qty=FF14Core.integer(event.target.value);if(!qty)throw Error('目標數量至少為 1');update(s=>s.targets[Number(event.target.dataset.targetQty)].qty=qty);calculate();}));
function calculate(){plan=null;zero=null;branchPlan=null;$('route-issues').innerHTML='';try{plan=e.solve(state.targets,state.routeInventory||{},state.preferences);zero=e.solve(state.targets,{},state.preferences);branchPlan=buildBranchPlan(plan);renderPlan();}catch(err){renderPlan();const d=err.detail||{};$('route-issues').innerHTML=`<div class="error">${h(err.message)}${d.choices?`<div class="route-choice">${[...d.choices].sort(compareRecipes).map(r=>`<button class="secondary" data-route-item="${d.item}" data-route="${r.id}">${h(recipeLabel(r))}<small> ${r.materials.filter(([id])=>byId(id)?.category!=='水晶').map(([id,q])=>h(e.name(id))+' ×'+q).join('、')}</small></button>`).join('')}</div>`:''}</div>`;}}
$('calculate').addEventListener('click',calculate);
$('route-issues').addEventListener('click',event=>safe(()=>{const b=event.target.closest('[data-route]');if(!b)return;update(s=>s.preferences[b.dataset.routeItem]=Number(b.dataset.route));calculate();}));
const categoryOrder=['鍊金原料','食材','木材','皮革','骨材','石材','金屬','布料','水產品','其他'];
function compareMaterials(a,b){const ai=byId(a.item),bi=byId(b.item),ac=ai?.category||'其他',bc=bi?.category||'其他',rank=c=>categoryOrder.includes(c)?categoryOrder.indexOf(c):99;return rank(ac)-rank(bc)||ac.localeCompare(bc,'zh-Hant')||e.name(a.item).localeCompare(e.name(b.item),'zh-Hant',{numeric:true})||a.item-b.item;}
function materialCells(item){const x=byId(item);return [h(x?.category||'其他'),h(x?.version||'未確認'),h(e.name(item))];}
function fixedColumns(widths){return '<colgroup>'+widths.map(w=>`<col style="width:${w}px">`).join('')+'</colgroup>';}
function table(headers,rows,columnWidths){const widths=columnWidths||(headers[0]==='納入'?[48,76,96,76,280,135,100,70]:headers[0]==='素材'?[260,84,110,100]:headers[0]==='製作物品'?[240,130,160,140]:[120,280,120]);return rows.length?`<div class="table-scroll"><table style="width:${widths.reduce((s,w)=>s+w,0)}px;min-width:${widths.reduce((s,w)=>s+w,0)}px">${fixedColumns(widths)}<thead><tr>${headers.map(x=>'<th>'+h(x)+'</th>').join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`:'<div class="empty">目前沒有項目。</div>';}
function buildBranchPlan(p){
 const roots=new Map(p.rows.filter(r=>!r.pureTarget&&r.direct>0).map(r=>[r.item,null])),incoming=new Map(),nodes=[];
 const make=(item,qty)=>{const n={item,qty,stock:0,sharedIn:0,sharedOut:0,batches:0,produced:0,surplus:0,children:[],plans:[]};nodes.push(n);return n;};
 for(const r of p.rows){
  if(r.pureTarget)continue;
  const list=roots.has(r.item)?[make(r.item,r.need)]:(incoming.get(r.item)||[]);
  if(roots.has(r.item))roots.set(r.item,list[0]);
  if(!list.length)continue;
  if(list.reduce((sum,n)=>sum+n.qty,0)!==r.need)throw Error('分支需求驗算失敗：'+e.name(r.item));
  let stock=r.usedStock;const batches=r.plans.map(([id,q])=>({recipe:e.recipes.get(id),left:q})),pool=[];
  const consume=(n,qty)=>{for(const chunk of pool){const take=Math.min(qty,chunk.qty);chunk.qty-=take;qty-=take;if(chunk.node!==n){chunk.node.sharedOut+=take;n.sharedIn+=take;}if(!qty)break;}return qty;};
  list.forEach((n,i)=>{
   n.stock=Math.min(n.qty,stock);stock-=n.stock;let gap=consume(n,n.qty-n.stock);
   for(const batch of batches){if(!batch.left)continue;const count=i===list.length-1?batch.left:Math.min(batch.left,Math.ceil(gap/batch.recipe.yieldQty));if(!count)continue;batch.left-=count;n.plans.push([batch.recipe.id,count]);n.batches+=count;n.produced+=count*batch.recipe.yieldQty;pool.push({node:n,qty:count*batch.recipe.yieldQty});gap=consume(n,gap);}
   if(gap&&p.chosen[r.item])throw Error('分支產出驗算失敗：'+e.name(r.item));
   for(const [id,count] of n.plans)for(const [item,perBatch] of e.recipes.get(id).materials){if(byId(item)?.category==='水晶')continue;const child=make(item,perBatch*count);child.recipe=id;child.reference=roots.has(item);n.children.push(child);if(!child.reference){if(!incoming.has(item))incoming.set(item,[]);incoming.get(item).push(child);}}
  });
  for(const chunk of pool)chunk.node.surplus+=chunk.qty;
 }
 return {roots,nodes};
}
function routePager(prefix,page,count,size){const pages=Math.max(1,Math.ceil(count/size)),active=count>0;return `<div class="pager list-pager"><button type="button" class="secondary" id="${prefix}-first" data-${prefix}-page="0" ${!active||page===0?'disabled':''}>第一頁</button><button type="button" class="secondary" id="${prefix}-prev" data-${prefix}-page="${page-1}" ${!active||page===0?'disabled':''}>上一頁</button><form class="page-jump" id="${prefix}-jump"><label>第 <input type="number" aria-label="${prefix==='target'?'目標':'下游母清單'}頁碼" id="${prefix}-page-number" min="1" max="${pages}" step="1" value="${page+1}" ${!active||pages===1?'disabled':''}> 頁</label><span>/ ${pages} 頁 · 全部 ${count} 項</span><button type="submit" class="secondary" ${!active||pages===1?'disabled':''}>跳頁</button></form><button type="button" class="secondary" id="${prefix}-next" data-${prefix}-page="${page+1}" ${!active||page+1>=pages?'disabled':''}>下一頁</button><button type="button" class="secondary" id="${prefix}-last" data-${prefix}-page="${pages-1}" ${!active||page+1>=pages?'disabled':''}>最後一頁</button></div>`;}
function jumpRoutePage(prefix,size,count,current,set,render){const raw=$(`${prefix}-page-number`).value.trim(),n=Number(raw),pages=Math.max(1,Math.ceil(count/size));if(!/^\d+$/.test(raw)||!Number.isSafeInteger(n)||n<1||n>pages){$(`${prefix}-page-number`).value=String(current+1);throw Error(`頁碼請輸入 1～${pages} 的整數`);}set(n-1);render();}
function renderPlan(){
 $('stats').innerHTML=plan?[['製作批數',plan.crafts.reduce((s,c)=>s+c.batches,0)],['底材缺料種類',plan.raw.filter(r=>r.shortage>0).length],['現貨已抵扣種類',plan.rows.filter(r=>r.usedStock>0).length],['目標數',plan.targets.length]].map(([label,n])=>`<div class="stat"><strong>${fmt(n)}</strong><span>${label}</span></div>`).join(''):'<div class="empty">加入目標後顯示計算結果。</div>';
 if(!plan){updateRouteToc();for(const id of ['tree','crafts','zero-raw'])$(id).innerHTML='<div class="empty">沒有可顯示的計算結果。</div>';return;}
 const rowMap=new Map(plan.rows.map(r=>[r.item,r]));
 function routeStockInput(item){return `<label class="route-stock-control stock-value">現貨 <input type="number" min="0" step="1" inputmode="numeric" aria-label="${h(e.name(item))}本次備料現貨" value="${(state.routeInventory||{})[item]||0}" data-stock="${item}"></label>`;}
 const rootRows=plan.rows.filter(r=>!r.pureTarget&&r.direct>0);const roots=new Set(rootRows.map(r=>r.item));
 function gate(n,depth=0){if(!n||!plan.chosen[n.item])return '';const recipe=e.recipes.get(plan.chosen[n.item]),sig=x=>JSON.stringify(x.materials.filter(([id])=>byId(id)?.category!=='水晶').slice().sort((a,b)=>a[0]-b[0])),eq=e.producers.get(n.item).filter(x=>x.yieldQty===recipe.yieldQty&&sig(x)===sig(recipe)),jobs=[...new Set(eq.map(x=>x.job))].sort(compareJobs).join('／');
  const supply=`此處需求 ×${fmt(n.qty)}；現貨抵扣 ×${fmt(n.stock)}${n.sharedIn?'；由合併製作產出供應 ×'+fmt(n.sharedIn):''}`;
  return `<div class="gate" data-gate-item="${n.item}" data-branch-need="${n.qty}"><b>若不足：【${h(jobs)}】</b><div>${supply}</div><div class="${n.batches?'gate-batch-line':n.sharedIn?'gate-shared-status':'gate-stock-covered'}">${n.batches?`製作 ${n.batches} 批 ｜ 產出 ×${fmt(n.produced)} ｜ 此處使用 ×${fmt(n.qty-n.stock-n.sharedIn)}${n.sharedOut?' ｜ 分配其他用途 ×'+fmt(n.sharedOut):''} ｜ 剩餘 ×${fmt(n.surplus)}`:n.sharedIn?'這份上游由合併製作供應，不另加製作批次。':'現貨足夠，這份上游已歸零。'}</div>${n.children.map(child=>{const cross=byId(child.item)?.category!==byId(n.item)?.category?'〔'+h(byId(child.item)?.category||'其他')+'〕':'';return `<div class="branch-material" data-branch-item="${child.item}" data-branch-qty="${child.qty}" style="margin-left:${Math.min(depth,6)*3}px"><span class="gate-material-line"><span class="gate-material-name">${h(e.name(child.item))}${cross} ×${fmt(child.qty)}${child.reference?' <span class="muted">（另有直接需求，詳見其主列。）</span>':''}</span>${routeStockInput(child.item)}</span>${!child.reference&&!plan.chosen[child.item]?`<span class="leaf-stock-summary">此處抵扣 ×${fmt(child.stock)}；仍缺 ×${fmt(Math.max(0,child.qty-child.stock))}</span>`:''}${child.reference?'':gate(child,depth+1)}</div>`;}).join('')}</div>`;
 }

 const categories=[...new Set(rootRows.map(r=>byId(r.item)?.category||'其他'))].sort((a,b)=>{const ai=categoryOrder.indexOf(a),bi=categoryOrder.indexOf(b);return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,'zh-TW');});
 $('tree').innerHTML=categories.map((cat,catIndex)=>`<div class="tree-category" id="a-category-${catIndex}"><h3>${h(cat)}</h3>${rootRows.filter(r=>(byId(r.item)?.category||'其他')===cat).map(r=>`<article class="tree-node ${state.review[r.item]?'reviewed':''}"><div class="node-body"><div class="node-context"><div class="node-head"><input type="checkbox" aria-label="已檢閱${h(e.name(r.item))}" data-review="${r.item}" ${state.review[r.item]?'checked':''}><strong>${h(e.name(r.item))}</strong></div><div class="use"><span class="demand-fixed">基本準備數量 ×${fmt(r.direct)}</span>${r.conditional?`<span class="demand-conditional">補製其他素材時另需 ×${fmt(r.conditional)}（依現貨調整）</span>`:''}</div><div class="demand-split">${r.reserve?`<span class="qty delivery-qty">直接交付 ×${fmt(r.reserve)}</span>`:''}${r.direct-r.reserve?`<span class="qty crafting-qty">用於製作 ×${fmt(r.direct-r.reserve)}</span>`:''}</div><div class="node-uses">${r.uses.filter(s=>s.direct).map(s=>`<div>→ ${h(e.name(s.parent))} ×${s.output}（本素材 ×${s.qty}）</div>`).join('')}</div></div><div class="node-stock">${routeStockInput(r.item)}</div><div class="node-gate">${gate(branchPlan.roots.get(r.item))}</div></div></article>`).join('')}</div>`).join('')||'<div class="empty">目前目標沒有直接素材列；請查看底層缺料及製作批次。</div>';

 $('crafts').innerHTML=table(['分類','版本','名稱','製作職業','批次／產量','加工分配'],[...plan.crafts].sort(compareMaterials).map(c=>{const r=rowMap.get(c.item);return [...materialCells(c.item),h(c.job),`${c.batches} 批<br>每批 ${c.yieldQty}<br>產出 ${c.produced}`,`保留 ×${r.reserve}<br>投入下游 ×${r.need-r.reserve}<br>批次剩餘 ×${r.surplus}`];}),[110,70,230,90,125,160]);
 updateRouteToc();
 $('zero-raw').innerHTML=table(['分類','版本','名稱','從零需求'],[...(zero?.raw||[])].sort(compareMaterials).map(r=>[...materialCells(r.item),fmt(r.need)]),[110,70,230,110]);
}
document.addEventListener('input',event=>{if(event.target.matches('[data-stock]'))event.target.dataset.stockEdited='true';});
document.addEventListener('focusout',event=>{if(event.target.matches('[data-stock]')&&event.target.dataset.stockEdited)event.target.dispatchEvent(new window.Event('change',{bubbles:true}));});
document.addEventListener('change',event=>safe(()=>{if(event.target.matches('[data-stock]')){delete event.target.dataset.stockEdited;const id=event.target.dataset.stock,n=FF14Core.integer(event.target.value,'庫存');update(s=>{s.routeInventory??={};s.routeInventory[id]=n;});calculate();}if(event.target.matches('[data-review]')){update(s=>s.review[event.target.dataset.review]=event.target.checked);renderPlan();}if(event.target.matches('[data-completion]')){update(s=>s.completion[event.target.dataset.completion]=event.target.checked);renderCollection();renderMother();}}));
function syncPager(prefix,page,count,enabled=true,size=40){const pages=Math.max(1,Math.ceil(count/size)),active=enabled&&count>0;$(`${prefix}-page`).textContent=enabled?`/ ${pages} 頁 · ${count} ${prefix==='history'?'筆':'項'}`:'尚未查詢';const input=$(`${prefix}-page-number`);input.value=String(page+1);input.max=String(pages);input.disabled=!active||pages===1;for(const end of ['first','prev'])$(`${prefix}-${end}`).disabled=!active||page===0;for(const end of ['next','last'])$(`${prefix}-${end}`).disabled=!active||page+1>=pages;$(`${prefix}-jump`).querySelector('button').disabled=!active||pages===1;}
function bindPager(prefix,getPage,setPage,getCount,render,size=40){for(const end of ['first','prev','next','last'])$(`${prefix}-${end}`).addEventListener('click',()=>{const count=getCount();if(!count)return;const last=Math.ceil(count/size)-1,current=getPage();setPage(end==='first'?0:end==='last'?last:Math.max(0,Math.min(last,current+(end==='next'?1:-1))));render();});$(`${prefix}-jump`).addEventListener('submit',event=>{event.preventDefault();safe(()=>{const count=getCount(),pages=Math.max(1,Math.ceil(count/size)),raw=$(`${prefix}-page-number`).value.trim(),n=Number(raw);if(!count||!/^\d+$/.test(raw)||!Number.isSafeInteger(n)||n<1||n>pages){$(`${prefix}-page-number`).value=String(getPage()+1);throw Error(`頁碼請輸入 1～${pages} 的整數`);}setPage(n-1);render();});});}
function clearMother(){update(s=>s.mother=null);renderMother();}
function materialSearch(){const q=$('material-search').value.trim(),exact=db.items.filter(x=>String(x.id)===q||x.name===q),matches=q?(exact.length?exact:db.items.filter(x=>x.name.includes(q))):[];if(matches.length!==1){clearMother();$('material-feedback').className=matches.length?'warning':'empty';$('material-feedback').textContent=matches.length?'符合多項道具，請輸入完整名稱。':'找不到符合的項目';return;}const item=matches[0];const mother=e.downstream(item.id,state.completion);if(!mother.targets.length){$('material-feedback').className='empty';$('material-feedback').textContent='找不到符合的項目';return;}const groups=new Map();for(const t of [...mother.targets].sort(compareRecipeTargets)){const r=e.recipes.get(t.recipe),label=r?r.job+' · '+Math.floor(r.level/10)*10+'–'+(Math.floor(r.level/10)*10+9)+' 級':'永久收藏';if(!groups.has(label))groups.set(label,[]);groups.get(label).push(t.key);}const batches=[];for(const [label,keys] of groups)for(let i=0;i<keys.length;i+=20)batches.push({id:batches.length+1,label,keys:keys.slice(i,i+20)});update(s=>s.mother={...mother,batches,issuedKeys:[],selected:mother.targets.filter(t=>!t.done).map(t=>t.key),createdAt:new Date().toISOString(),page:0});renderMother();notify('');}
$('material-query').addEventListener('submit',event=>{event.preventDefault();safe(()=>queryRoute('b'));});
function renderMother(){const m=state.mother;if(!m){$('mother').innerHTML='';return;}const current=m.targets.map(t=>({...t,done:state.completion[t.completionKey]===true})).sort(compareRecipeTargets);const selected=current.filter(t=>m.selected.includes(t.key)&&!t.done),page=m.page||0,pages=Math.max(1,Math.ceil(current.length/40));let quantityValue=null,globalValue=null;let quantityText='選定目標交給 Route A 後，全域計算保留量';try{const p=e.solve(selected,{},state.preferences);quantityValue=p.rows.find(r=>r.item===m.start)?.need||0;quantityText='選定目標從零需求：'+fmt(quantityValue)+' 個 '+e.name(m.start);}catch(err){quantityText='總需求尚待選擇製作路線：'+err.message;}
 let globalText;try{const all=e.solve(current.filter(t=>!t.done),{},state.preferences);globalValue=all.rows.find(r=>r.item===m.start)?.need||0;globalText='完整母清單未完成目標：'+fmt(globalValue)+' 個（從零，全域合併批次）';}catch(err){globalText='完整母清單總需求待核對路線：'+err.message;}
 const numberTag=value=>`<strong class="info-number">${fmt(value)}</strong>`;
 const globalInfo=globalValue===null?h(globalText):`完整母清單未完成目標：${numberTag(globalValue)} 個（從零，全域合併批次）`;
 const quantityInfo=quantityValue===null?h(quantityText):`選定目標從零需求：${numberTag(quantityValue)} 個 ${h(e.name(m.start))}`;
 const issued=new Set(m.issuedKeys||[]);const batchHtml=[...(m.batches||[])].sort((a,b)=>compareJobs(a.label.split(' · ')[0],b.label.split(' · ')[0])||a.id-b.id).map(batch=>{const ts=current.filter(t=>batch.keys.includes(t.key)&&!t.done);let need='待選路線';try{need=fmt(e.solve(ts,{},state.preferences).rows.find(r=>r.item===m.start)?.need||0);}catch{}return `<div class="search-row"><div>第 ${batch.id} 批 · ${h(batch.label)}<small>${batch.keys.length} 項 · 此批從零需要素材 ${need} 個 · 已交給素材製作工坊 ${batch.keys.filter(k=>issued.has(k)).length} 項</small></div><button class="secondary" data-batch="${batch.id}">選取此批</button></div>`;}).join('');
 $('mother').innerHTML=`<div class="card"><div class="section-head"><div><h2>下游母清單：${h(e.name(m.start))}</h2><p>找到 ${m.recipes.length} 條相關配方；有效收藏目標 ${current.length} 項，已完成 ${current.filter(t=>t.done).length} 項。選取 ${selected.length} 項。</p><button id="send-route-a" ${!selected.length?'disabled':''}>選定目標交給 Route A</button></div></div><div class="mother-info">${!state.sheetProgressImported&&!Object.keys(state.completion).length?'尚未匯入你的製作圖鑑進度，目前先以未完成列出。<br>':''}${globalInfo}<br>${quantityInfo}<br>配方圖涵蓋來源快照全部 Recipe；現行可用性／特殊流程仍需確認。${m.pending.length?' 有 '+numberTag(m.pending.length)+' 個收藏候選尚未納入。':''}</div>${batchHtml?`<details><summary>分批製作 · ${m.batches.length} 批 · 尚未交給素材製作工坊 ${current.filter(t=>!t.done&&!issued.has(t.key)).length} 項</summary><p>批次只方便分段操作；各批從零數量不可相加當成全案需求。素材製作工坊會合併已交入的目標，庫存與批次剩餘只計一次。</p>${batchHtml}</details>`:''}<div class="controls mother-selection-controls"><button class="secondary" id="select-unfinished">選取全部未完成</button><button class="secondary" id="clear-selection">清除選取</button></div>${table(['納入','版本','製作職業','等級','物品名稱','物品分類','完成種類','已完成'],current.slice(page*40,(page+1)*40).map(t=>{const meta={item:t.item,recipes:t.recipe?[e.recipes.get(t.recipe)]:(e.producers.get(t.item)||[])};return [`<input type="checkbox" aria-label="納入${h(e.name(t.item))}" data-mother-select="${h(t.key)}" ${m.selected.includes(t.key)&&!t.done?'checked':''} ${t.done?'disabled':''}>`,h(collectionValue(meta,'version')),h(collectionValue(meta,'job').join('／')||'—'),h(collectionValue(meta,'level').join('／')||'—'),h(e.name(t.item)),h(collectionValue(meta,'category')),t.mode==='completion'?'製作筆記':'永久收藏',`<input type="checkbox" aria-label="完成${h(e.name(t.item))}" data-completion="${h(t.completionKey)}" ${t.done?'checked':''}>`];}))}${routePager('mother',page,current.length,40)}</div>`;
}
$('mother').addEventListener('click',event=>safe(()=>{const id=event.target.id,button=event.target.closest('[data-batch]');const jump=event.target.closest('[data-mother-page]');if(!button&&!jump&&!['select-unfinished','clear-selection','send-route-a'].includes(id))return;if(jump)update(s=>s.mother.page=Math.max(0,Math.min(Math.ceil(s.mother.targets.length/40)-1,Number(jump.dataset.motherPage))));if(button){const batch=state.mother.batches.find(b=>b.id===Number(button.dataset.batch));update(s=>s.mother.selected=batch.keys.filter(k=>{const t=s.mother.targets.find(t=>t.key===k);return s.completion[t.completionKey]!==true;}));}if(id==='select-unfinished')update(s=>s.mother.selected=s.mother.targets.filter(t=>state.completion[t.completionKey]!==true).map(t=>t.key));if(id==='clear-selection')update(s=>s.mother.selected=[]);if(id==='send-route-a'){if(routeHasData('a')&&!window.confirm('Route A 已有資料，確定清除當前的 Route A 資料並帶入選定目標嗎？'))return;const ts=state.mother.targets.filter(t=>state.mother.selected.includes(t.key)&&state.completion[t.completionKey]!==true);update(s=>{s.targets=e.normalize(ts);s.routeInventory={};s.mother.issuedKeys=[...new Set([...(s.mother.issuedKeys||[]),...ts.map(t=>t.key)])];});targetPage=0;$('target-search').value='';$('target-results').innerHTML='';$('route-issues').innerHTML='';renderTargets();calculate();showTab('a');notify('');}renderMother();}));
$('mother').addEventListener('submit',event=>{if(event.target.id!=='mother-jump')return;event.preventDefault();safe(()=>jumpRoutePage('mother',40,state.mother.targets.length,state.mother.page||0,n=>update(s=>s.mother.page=n),renderMother));});
$('mother').addEventListener('change',event=>safe(()=>{if(!event.target.matches('[data-mother-select]'))return;const key=event.target.dataset.motherSelect;update(s=>{s.mother.selected=s.mother.selected.filter(k=>k!==key);if(event.target.checked)s.mother.selected.push(key);});renderMother();}));
const collectionRows={recipe:db.recipes.filter(r=>r.tracked).map(r=>({item:r.item,key:'recipe_completion:'+r.id,recipes:[r]})),unlock:db.unlocks.map(u=>({item:u.item,key:'permanent_unlock:'+u.item,recipes:e.producers.get(u.item)||[]}))};
const collectionScopeRank=scope=>scope==='一般配方'?0:scope==='住宅'?1:scope==='飾品一'||scope==='飾品二'?2:99;
const compareCollectionRecipes=(a,b)=>compareJobs(a?.job,b?.job)||collectionScopeRank(a?.scope)-collectionScopeRank(b?.scope)||(a?.level||0)-(b?.level||0)||(a?.id||0)-(b?.id||0);
function collectionEntries(t){return t.entries||[t];}
function collectionDone(t){return collectionEntries(t).every(x=>state.completion[x.key]===true);}
// Collection-facing display category only; item IDs and catalog source categories remain unchanged.
const collectionDisplayCategoryOverride=new Map([[7552,'陸行鳥裝甲'],[8570,'陸行鳥裝甲'],[9355,'陸行鳥裝甲'],[12081,'陸行鳥裝甲'],[12991,'陸行鳥裝甲'],[21052,'坐騎'],[26782,'坐騎']]);
const columnKeys=['done','version','job','level','name','category'];
function collectionValue(t,key){const item=byId(t.item);if(key==='done')return collectionDone(t)?'true':'false';if(key==='version')return item?.version||'未確認';if(key==='name')return e.name(t.item);if(key==='category')return collectionDisplayCategoryOverride.get(t.item)||item?.category||'其他';return [...new Set(t.recipes.map(r=>key==='job'?r.job:String(r.level)))].sort(key==='job'?compareJobs:(a,b)=>Number(a)-Number(b));}
const allCollectionRows=[...collectionRows.recipe,...collectionRows.unlock];
const collectionGroups=new Map();
for(const row of allCollectionRows){if(!collectionGroups.has(row.item))collectionGroups.set(row.item,{item:row.item,entries:[],recipes:[]});const group=collectionGroups.get(row.item);if(!group.entries.some(x=>x.key===row.key))group.entries.push(row);for(const recipe of row.recipes)if(!group.recipes.some(x=>x.id===recipe.id))group.recipes.push(recipe);}
collectionRows.all=[...collectionGroups.values()];
for(const group of collectionRows.all)group.entries.sort((a,b)=>compareCollectionRecipes(a.recipes[0],b.recipes[0])||a.key.localeCompare(b.key));
const collectionCategoryGroups=['鍊金原料','食材','木材','皮革','石材','金屬','布料','釣餌','藥品','頭','身','手','腿','腳','耳環','項環','手環','戒指','主手','副手','坐騎','陸行鳥裝甲','寵物','樂譜','家具','庭具','栽培','組件','雜貨'];
const categoryAliases={'食品':'食材','頭部防具':'頭','身體防具':'身','手部防具':'手','腿部防具':'腿','腳部防具':'腳','耳飾':'耳環','項鍊':'項環','手鐲':'手環','管弦樂琴樂譜':'樂譜','栽培用品':'栽培','其他':'雜貨','雜貨（季節活動）':'雜貨'};
const mainHandCategories=new Set(['二刀流武器','刺劍','單手劍','單手咒杖','單手幻杖','大斧','天球儀','弓','投擲武器','格鬥武器','槍刃','武士刀','火槍','筆','賢具','長槍','雙劍','雙手劍','雙手咒杖','雙手幻杖','雙手鐮刀','魔導書','魔導書（學者專用）']);
const indoorCategories=new Set(['傢俱','內牆','地板','地毯','壁掛','屋頂照明','桌上','桌台']);
const outdoorCategories=new Set(['外牆','外牆裝飾','房門','房頂','房頂裝飾','窗戶','門牌','院牆']);
function collectionCategoryGroup(c){if(categoryAliases[c])return categoryAliases[c];if(mainHandCategories.has(c)||c.endsWith('（主工具）'))return '主手';if(c==='盾'||c.endsWith('（副工具）'))return '副手';if(indoorCategories.has(c))return '家具';if(outdoorCategories.has(c))return '庭具';return collectionCategoryGroups.includes(c)?c:'其他類別';}
for(const key of columnKeys.filter(k=>k!=='name')){const options=key==='done'?['true','false']:[...new Set(allCollectionRows.flatMap(t=>collectionValue(t,key)))].sort(key==='job'?compareJobs:(a,b)=>a.localeCompare(b,'zh-Hant',{numeric:true}));const option=v=>`<option value="${h(v)}">${key==='done'?(v==='true'?'已完成':'未完成'):h(v)}</option>`;const html=key==='category'?[...collectionCategoryGroups,'其他類別'].map(g=>{const values=options.filter(c=>collectionCategoryGroup(c)===g);return values.map(option).join('');}).join(''):options.map(option).join('');$(`collection-filter-${key}`).innerHTML='<option value="">全部</option>'+html;}

function collectionMatches(){if(!collectionQueried)return [];const {q,kind,only,columns={}}=collectionFilter;return collectionRows[kind].filter(t=>{if(q&&!itemMatches(t.item,q)||only&&collectionDone(t))return false;for(const key of ['done','version','category'])if(columns[key]&&collectionValue(t,key)!==columns[key])return false;if(columns.name&&!e.name(t.item).includes(columns.name))return false;if((columns.job||columns.level)&&!t.recipes.some(r=>(!columns.job||r.job===columns.job)&&(!columns.level||String(r.level)===columns.level)))return false;return true;}).sort((a,b)=>{const ar=[...a.recipes].sort(compareCollectionRecipes)[0],br=[...b.recipes].sort(compareCollectionRecipes)[0];return compareCollectionRecipes(ar,br)||e.name(a.item).localeCompare(e.name(b.item),'zh-Hant',{numeric:true})||a.item-b.item;});}
function renderCollection(){if(!collectionQueried){$('collection-rows').innerHTML='<tr><td colspan="6" class="empty">設定條件後，按「查詢」或 Enter 載入製作與登錄進度。</td></tr>';syncPager('collection',0,0,false);return;}const list=collectionMatches(),pages=Math.max(1,Math.ceil(list.length/40));collectionPage=Math.min(collectionPage,pages-1);$('collection-rows').innerHTML=list.length?list.slice(collectionPage*40,(collectionPage+1)*40).map(t=>{const entries=collectionEntries(t),any=entries.some(x=>state.completion[x.key]===true),done=collectionDone(t);const checks=entries.map(x=>{const recipe=x.key.startsWith('recipe_completion:')?x.recipes[0]:null,label=recipe?recipe.job+'筆記'+(entries.filter(y=>y.recipes[0]?.job===recipe.job&&y.key.startsWith('recipe_completion:')).length>1?' Lv.'+recipe.level+' '+recipe.scope:''):'永久收藏';return `<label class="collection-completion"><input type="checkbox" aria-label="完成${h(e.name(t.item))}${entries.length>1?' · '+h(label):''}" data-completion="${h(x.key)}" ${state.completion[x.key]===true?'checked':''}>${entries.length>1?'<span>'+h(label)+'</span>':''}</label>`;}).join('');const cells=[checks+(entries.length>1&&any&&!done?'<small class="collection-partial">部分完成</small>':''),h(collectionValue(t,'version')),h(collectionValue(t,'job').join('／')||'—'),h(collectionValue(t,'level').join('／')||'—'),h(e.name(t.item)),h(collectionValue(t,'category'))];return `<tr class="${any?'reviewed':''}" data-collection-item="${t.item}">`+cells.map(x=>'<td>'+x+'</td>').join('')+'</tr>';}).join(''):'<tr><td colspan="6" class="empty">找不到符合的項目</td></tr>';syncPager('collection',collectionPage,list.length);}
$('collection-query').addEventListener('submit',event=>{event.preventDefault();collectionFilter={q:$('collection-search').value.trim(),kind:$('collection-kind').value,only:$('only-unfinished').checked,columns:Object.fromEntries(columnKeys.map(key=>[key,$(`collection-filter-${key}`).value.trim()]))};collectionQueried=true;collectionPage=0;renderCollection();});
$('collection-reset').addEventListener('click',()=>{if(!window.confirm('確定清除查詢條件，返回尚未查詢的初始畫面？'))return;$('collection-search').value='';for(const option of $('collection-kind').options)option.removeAttribute('selected');$('collection-kind').querySelector('option[value="all"]').selected=true;$('only-unfinished').checked=false;for(const key of columnKeys){const control=$(`collection-filter-${key}`);if(control.options){for(const option of control.options)option.removeAttribute('selected');control.querySelector('option[value=""]').selected=true;}else control.value='';}collectionFilter={q:'',kind:'all',only:false,columns:{}};collectionQueried=false;collectionPage=0;renderCollection();});
bindPager('collection',()=>collectionPage,n=>collectionPage=n,()=>collectionMatches().length,renderCollection);

function allUnlockExportRows(completion=state.completion){
 return collectionRows.unlock.map(t=>({
  item:t.item,completed:completion[t.key]===true,
  version:collectionValue(t,'version'),job:collectionValue(t,'job').join('／')||'—',
  level:collectionValue(t,'level').join('／')||'—',name:e.name(t.item),category:collectionValue(t,'category')
 }));
}
const ATLAS_TEMPLATE_URL='templates/FF14_製作圖鑑主控台_空白模板.xlsx?v=20261020-clean-template';
async function atlasWorkbook(completion){
 if(typeof window.FF14XlsxExport?.fromTemplate!=='function')throw Error('Excel 產生功能未載入，請重新整理頁面。');
 const response=await window.fetch(ATLAS_TEMPLATE_URL);
 if(!response.ok)throw Error('無法讀取製作圖鑑基底檔案（HTTP '+response.status+'）。');
 return window.FF14XlsxExport.fromTemplate(await response.arrayBuffer(),completion,allUnlockExportRows(completion));
}
$('template-download').addEventListener('click',async()=>{
 const button=$('template-download');if(button.disabled)return;button.disabled=true;
 try{
  const result=await atlasWorkbook({});
  downloadBlob('FF14_製作圖鑑主控台_空白模板.xlsx',result.blob);
  notify('已下載完整空白模板：'+fmt(result.recipeCount)+' 筆製作筆記、'+fmt(result.unlockCount)+' 筆永久收藏，全部未登錄。');
 }catch(err){notify('無法下載空白模板：'+err.message,true);}
 finally{button.disabled=false;}
});
$('collection-export').addEventListener('click',async()=>{
 const btn=$('collection-export');if(btn.disabled)return;btn.disabled=true;
 try{
  if(storageBlocked)throw Error('原始存檔讀取失敗，請先使用資料備份功能還原。');
  const result=await atlasWorkbook(state.completion);
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replace(/\D/g,'');
  downloadBlob('FF14_製作圖鑑主控台_進度匯出_'+date+'.xlsx',result.blob);
  notify('已匯出完整製作圖鑑 '+fmt(result.recipeCount)+' 筆、永久收藏 '+fmt(result.unlockCount)+' 筆。');
 }catch(err){notify('Excel 匯出失敗：'+err.message,true);}
 finally{btn.disabled=false;}
});

function resetRoute(route){if(routeHasData(route)&&!window.confirm('將會清空當前畫面資料，確定嗎？'))return;if(route==='a'){clearRouteA();$('target-search').value='';}else{clearMother();$('material-search').value='';$('material-feedback').textContent='';}notify('');}
$('target-reset').addEventListener('click',()=>safe(()=>resetRoute('a')));$('material-reset').addEventListener('click',()=>safe(()=>resetRoute('b')));
function historyStamp(at){const d=new Date(at);if(!Number.isFinite(d.getTime()))return '<span>日期未確認</span>';const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d),v=key=>parts.find(p=>p.type===key).value;return `<span class="journal-date">${v('year')}/${v('month')}/${v('day')}</span> <span class="journal-clock">${v('hour')}:${v('minute')}:${v('second')}</span>`;}
function renderHistory(){const pages=Math.max(1,Math.ceil(state.history.length/10));historyPage=Math.min(historyPage,pages-1);$('history-list').innerHTML=state.history.slice(historyPage*10,(historyPage+1)*10).map((x,i)=>`<article class="journal-item"><div class="journal-item-head"><time>${historyStamp(x.at)}</time><button type="button" class="journal-remove" data-delete-history="${historyPage*10+i}" aria-label="刪除此筆工作記錄">×</button></div><p>${h(String(x.text??'').replace(/紀錄/g,'記錄'))}</p></article>`).join('')||'<div class="history-empty">還沒有記錄。</div>';syncPager('history',historyPage,state.history.length,true,10);}
$('history-list').addEventListener('click',event=>safe(()=>{const b=event.target.closest('[data-delete-history]');if(!b)return;const index=Number(b.dataset.deleteHistory);if(!Number.isInteger(index)||index<0||index>=state.history.length)return;if(!window.confirm('確定刪除此筆工作記錄？'))return;update(s=>s.history.splice(index,1));renderHistory();}));
bindPager('history',()=>historyPage,n=>historyPage=n,()=>state.history.length,renderHistory,10);
$('note-form').addEventListener('submit',event=>{event.preventDefault();safe(()=>{const text=$('work-note').value.trim();if(!text)return;update(s=>s.history.unshift({at:new Date().toISOString(),kind:'note',text}));$('work-note').value='';historyPage=0;renderHistory();});});
$('backup').addEventListener('click',backup);
function csvText(rows){return '\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');}
$('export-plan')?.addEventListener('click',()=>{if(!plan)return;download('ff14-material-plan.csv',csvText([['item_id','物品','直接份額','條件份額','已啟用需求','現貨抵扣','還缺','批次','產出','剩餘'],...plan.rows.filter(r=>!r.pureTarget).map(r=>[r.item,e.name(r.item),r.direct,r.conditional,r.need,r.usedStock,r.shortage,r.batches,r.produced,r.surplus])]),'text/csv;charset=utf-8');});

function clearImportPreview(){importPending=null;$('import-preview').textContent='';}
$('import-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;clearImportPreview();
 try{
  if(!/\.(csv|xlsx)$/i.test(file.name))throw Error('請選擇 Excel（.xlsx）或 CSV 製作圖鑑檔案。');
  let changes;
  if(/\.xlsx$/i.test(file.name)){
   if(typeof window.FF14XlsxProgress?.parseAll!=='function')throw Error('Excel 讀取功能未載入，請重新整理網頁。');
   const data=await window.FF14XlsxProgress.parseAll(await file.arrayBuffer());
   const recipes=S.csvImport(data.recipes.map(row=>row.join(',')).join('\n'),e);
   const unlocks=data.unlocks.length?S.csvImport(data.unlocks.map(row=>row.join(',')).join('\n'),e):{inventory:{},completion:{}};
   changes={inventory:{},completion:{...recipes.completion,...unlocks.completion}};
  }else changes=S.csvImport(await file.text(),e);
  const entries=Object.entries(changes.completion);
  if(!entries.length)throw Error('找不到製作圖鑑的勾選資料。請檢查選擇的檔案。');
  const completed=entries.filter(([,checked])=>checked).length;
  const recipeCount=entries.filter(([k])=>k.startsWith('recipe_completion:')).length,unlockCount=entries.filter(([k])=>k.startsWith('permanent_unlock:')).length;
  importPending={type:'progress',changes};
  $('import-preview').innerHTML=
   '<div class="data-import-result"><strong>讀取 '+fmt(recipeCount)+' 筆配方、'+fmt(unlockCount)+' 筆永久收藏；已勾選 '+fmt(completed)+' 筆。</strong><p>預設只新增已完成項目；原有庫存、備料目標和其他勾選保留不動。</p></div>'+
   '<label class="data-sync-option"><input id="import-sync-unchecked" type="checkbox"> 以試算表為準，同步取消未勾選項目（進階選項）</label>'+
   '<button id="apply-import" class="import-confirm-progress" type="button">確定匯入勾選進度</button>';
 }catch(err){$('import-preview').textContent='尚未匯入：'+err.message;}
 event.target.value='';
});
$('import-preview').addEventListener('click',event=>safe(()=>{
 if(event.target.id!=='apply-import'||!importPending)return;
 const syncAll=!!$('import-sync-unchecked')?.checked;
 if(syncAll&&Object.values(importPending.changes.completion).some(done=>!done)&&!window.confirm('將依照匯入檔案取消未登錄的項目，可能清除目前已完成的勾選。只影響檔案內存在的項目。確定要同步取消嗎？'))return;
 const completed=Object.fromEntries(Object.entries(importPending.changes.completion).filter(([,checked])=>syncAll||checked));
 if(!Object.keys(completed).length){clearImportPreview();notify('這份圖鑑沒有已勾選項目，工坊資料沒有變動。');return;}
 const next=S.merge(state,{inventory:{},completion:completed});commit(next);
 clearImportPreview();renderTargets();calculate();renderMother();renderCollection();
 notify('製作圖鑑勾選進度已匯入，庫存與備料目標保持不變。');
}));
$('restore-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;restorePending=null;$('restore-preview').textContent='';
 try{
  if(!/\.json$/i.test(file.name))throw Error('請選擇工坊先前下載的 JSON 完整備份。');
  const next=S.validate(JSON.parse(await file.text()));e.normalize(next.targets);restorePending=next;
  $('restore-preview').innerHTML=
   '<div class="warning"><strong>這是整份還原，不是補上勾選！</strong>檔案包含 '+fmt(Object.keys(next.inventory).length)+' 種庫存、'+fmt(Object.keys(next.completion).length)+' 筆完成狀態、'+fmt(next.targets.length)+' 項備料目標及 '+fmt(next.history.length)+' 筆工作記錄。<strong>確定還原後會取代本機全部工坊資料。</strong></div>'+
   '<button id="apply-restore" class="import-confirm-progress" type="button">確認還原整個工坊</button>';
 }catch(err){$('restore-preview').textContent='尚未還原：'+err.message;}
 event.target.value='';
});
$('restore-preview').addEventListener('click',event=>safe(()=>{
 if(event.target.id!=='apply-restore'||!restorePending)return;
 if(!window.confirm('確定使用這份 JSON 備份取代目前工坊的全部資料嗎？'))return;
 const before=storageBlocked;storageBlocked=false;
 try{commit(restorePending);}catch(err){storageBlocked=before;throw err;}
 restorePending=null;$('restore-preview').textContent='';renderTargets();calculate();renderMother();renderCollection();
 notify('整個工坊備份已還原。');
}));
renderTargets();calculate();renderMother();


showTab('home');

function updateRouteToc(){const sections=[['a-targets','本次目標'],['a-summary','本次備料摘要'],['a-tree','庫存抵扣樹']];if(plan)for(const node of document.querySelectorAll('#tree .tree-category'))sections.push([node.id,node.querySelector('h3').textContent]);sections.push(['a-crafts','製作批次與分配'],['a-raw','原始素材總表']);$('route-toc-links').innerHTML=sections.map(([id,label])=>`<a href="#${id}" ${id.startsWith('a-category-')?'class="toc-category"':''}>${h(label)}</a>`).join('');highlightToc();}
function highlightToc(){if(tab!=='a')return;const links=[...document.querySelectorAll('#route-toc-links a')];let current=links[0];for(const link of links){const el=document.querySelector(link.getAttribute('href'));if(el&&typeof el.getBoundingClientRect==='function'&&el.getBoundingClientRect().top<=120)current=link;}for(const link of links){if(link===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}const menu=$('route-toc');if(menu.open&&current){const y=current.offsetTop;if(y<menu.scrollTop+32)menu.scrollTop=Math.max(0,y-32);else if(y+current.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=y+current.offsetHeight-menu.clientHeight;}}
$('route-toc-links').addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;event.preventDefault();const el=document.querySelector(link.getAttribute('href'));if(el?.tagName==='DETAILS')el.open=true;fastTocScroll(el);});
if(typeof window.addEventListener==='function')window.addEventListener('scroll',highlightToc,{passive:true});

let tocScrollFrame;
function fastTocScroll(el){if(!el||typeof el.getBoundingClientRect!=='function')return;if(tocScrollFrame)window.cancelAnimationFrame?.(tocScrollFrame);const start=window.scrollY,target=Math.max(0,Math.min(start+el.getBoundingClientRect().top-24,document.documentElement.scrollHeight-window.innerHeight));if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||typeof window.requestAnimationFrame!=='function'){window.scrollTo?.({top:target,behavior:'instant'});return;}let began;const step=now=>{began??=now;const progress=Math.min(1,(now-began)/180);window.scrollTo({top:start+(target-start)*(1-Math.pow(1-progress,3)),behavior:'instant'});if(progress<1)tocScrollFrame=window.requestAnimationFrame(step);else tocScrollFrame=null;};tocScrollFrame=window.requestAnimationFrame(step);}

