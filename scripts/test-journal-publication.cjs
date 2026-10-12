const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'journal-gate-'));fs.mkdirSync(path.join(base,'scripts'));fs.mkdirSync(path.join(base,'pve/journal/articles/example'),{recursive:true});
fs.copyFileSync(path.join(__dirname,'build-journal.mjs'),path.join(base,'scripts/build-journal.mjs'));fs.copyFileSync(path.join(__dirname,'../pve/journal/index.html'),path.join(base,'pve/journal/index.html'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const content='<article>Fictional validation fixture</article>';fs.writeFileSync(path.join(base,'pve/journal/articles/example/index.html'),content);
const metadata={id:'J001',date:'2026-10-12',track:'職業養成',course:'R005',title:'Fictional fixture',href:'articles/example/index.html'};
const good={...metadata,approval:{owner:'LiouLiou',status:'approved',publication:'public',approvedAt:'2026-10-12T11:00:00Z',contentSha256:hash(content),indexSha256:hash(JSON.stringify(metadata))}};
function run(entry,pass){fs.writeFileSync(path.join(base,'pve/journal/entries.json'),JSON.stringify({schemaVersion:1,domain:'ff14',entries:[entry]}));const r=cp.spawnSync('node',[path.join(base,'scripts/build-journal.mjs'),'--write'],{encoding:'utf8'});assert.equal(r.status===0,pass,r.stderr);}
run(good,true);
run({...good,approval:{...good.approval,status:'pending'}},false);
run({...good,approval:{...good.approval,publication:'private'}},false);
run({...good,title:'Changed after approval'},false);
run({...good,approval:{...good.approval,contentSha256:'0'.repeat(64)}},false);
run({...good,href:'../private.html'},false);
run({...good,track:'工作技術'},false);
fs.writeFileSync(path.join(base,'pve/journal/draft.txt'),'Fictional unpublished draft');run(good,false);
fs.rmSync(base,{recursive:true});console.log('PASS: 1 valid fictional export and 7 rejected consent, changed-content, path, domain and draft cases.');
