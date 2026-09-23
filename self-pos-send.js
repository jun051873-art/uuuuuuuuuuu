(function(){
if(location.origin!=='https://jun051873-art.github.io'||!/^\/uuuuuuuuuuu\/(?:index.html)?$/.test(location.pathname))return;
const B=window.AetherPosBridge,destination='https://jun051873-art.github.io/pos222222/?v=20260922b#booking-import';
async function packet(id){checkWritable();requireAdmin();const a=state.data.appointments[id],p=state.data.payments[id];if(!a||a._deleted||a.status!=='completed')throw Error('只有已完成的預約可以傳送');if(!p||(!a.serviceIds.length&&!(p.retailLines||[]).length))throw Error('請先填寫服務項目與金額');let source=cloud?(cloud.db?.app?.options?.projectId||'aether')+':'+cloud.salon:localStorage.getItem('aether-pos-local-source');if(!source){source='local:'+crypto.randomUUID();localStorage.setItem('aether-pos-local-source',source);}const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([source,id])));return B.validate({format:'aether-pos-transfer-1',id:'aether-'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''),source,version:2,customer:{id:a.clientId||'',name:state.data.clients[a.clientId]?.name||a.name,phone:state.data.clients[a.clientId]?.phone||a.phone||'',birthday:state.data.clients[a.clientId]?.birthday||'',gender:state.data.clients[a.clientId]?.sex||a.sex||''},products:Core.clone(p.retailLines||[]),serviceAmount:p.amount,sourceName:state.data.settings.main.name,appointmentId:id,date:a.date,time:a.time,name:a.name,people:a.people,stylist:{id:a.styId,name:nameOf('stylists',a.styId)},services:a.serviceIds.map(k=>({id:k,name:nameOf('services',k)})),methods:(p.methodIds||[]).map(k=>({id:k,name:nameOf('methods',k)})),amount:(B.money(p.amount)+(p.retailLines||[]).reduce((n,l)=>n+B.money(l.amount),0))/100,paid:(B.money(p.paid)+B.money(p.retailPaid||0))/100,sentAt:new Date().toISOString()});}
async function sendOne(id){const p=await packet(id);openDialog('傳送到美髮開單系統',`<p><b>${E(p.name)}</b> · ${E(p.date)} ${E(p.time)}<br>${E([...p.services.map(x=>x.name),...(p.products||[]).map(x=>x.name+' ×'+x.qty)].join('＋'))}<br>電話 ${E(p.customer?.phone||'未填')} · 生日 ${E(p.customer?.birthday||'未填')}<br>${E(p.stylist.name)} · 金額 $${F(p.amount)} · 已收 $${F(p.paid)}</p><p>傳到你自用的 pos222222「待核對預約」。核對項目與既有單據後才入帳，不會只因勾選完成就產生新單。</p><p class="hint">傳送成功後可關閉頁面。之後從原本的美髮開單網址登入本店，即可看到雲端待核對資料；確認入帳後仍請備份POS帳目。</p>`,async()=>{const fresh=await packet(id);if(B.comparable(fresh)!==B.comparable(p))throw Error('預約剛被修改，請重新開啟核對');const status=await window.AetherCloudInbox.send(fresh);setTimeout(()=>openDialog(status==='posted'?'此筆已入帳':status==='processing'?'此筆正在核對':'已存入雲端，等待核對',`<p>${status==='posted'?'不會重複建立單據。':'已存入本店雲端待核對區。可稍後自行打開原本的美髮開單系統核對，不需要從這裡跳轉。'}</p><a class="primary" href="${destination}" target="_blank" rel="noopener">打開美髮開單系統</a>`,null),0);},'確認傳送');}
actions['send-pos']=id=>sendOne(id).catch(e=>toast(e.message,true));
const oldQuick=quickCard;quickCard=function(a){const html=oldQuick(a);if(a.status!=='completed'||!isAdmin())return html;return html.replace('</article>',`<div class="booking-card-tools"><button type="button" data-action="send-pos" data-id="${E(a.id)}">傳送到美髮開單</button></div></article>`);};
const oldSettings=renderSettings;renderSettings=function(){oldSettings();const list=document.querySelector('.settings-list');if(list&&isAdmin())list.insertAdjacentHTML('afterbegin','<button class="set-drawer-trigger" data-action="pos-day"><span>傳送指定日期到美髮開單<small>一天一天傳送，方便核對人數與金額</small></span><b>›</b></button><button class="set-drawer-trigger" data-action="pos-month"><span>傳送已完成預約到美髮開單<small>按月份核對；存入雲端待核對區；不會自動入帳</small></span><b>›</b></button>');};
function transferRange(mode){
 const day=mode==='day',label=day?'指定日期':'月份',name=day?'transferDate':'transferMonth';
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date());
 openDialog(day?'傳送指定日期的已完成預約':'按月份傳送已完成預約',`${field(label,inp(name,day?today:today.slice(0,7),day?'date':'month','required'))}<p>先核對清單，再按確認傳送。資料會放進美髮開單的待核對區，不會直接入帳。</p>`,async fd=>{
 const value=fd.get(name);if(!(day?/^\d{4}-\d{2}-\d{2}$/:/^\d{4}-\d{2}$/).test(value))throw Error(label+'不正確');
 const ids=Core.rows(state.data,'appointments').filter(a=>a.status==='completed'&&(day?a.date===value:a.date.startsWith(value))).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(a=>a.id);
 if(!ids.length)throw Error('這'+(day?'一天':'個月份')+'沒有已完成預約；請先登入有實際資料的店家');
 const packets=[],failed=[];for(const id of ids){try{packets.push(await packet(id));}catch(e){failed.push(id+'：'+e.message);}}
 if(!packets.length)throw Error('沒有可傳送的完整資料，請先補齊服務與收款欄位');
 const total=packets.reduce((sum,p)=>sum+B.money(p.amount),0)/100;
 const target=day?destination.replace('#booking-import','&bookingDate='+encodeURIComponent(value)+'#booking-import'):destination;
 setTimeout(()=>openDialog('核對 '+value+' 傳送範圍',`<p>可傳送 ${packets.length} 筆，合計 $${F(total)}。</p><p>仍需在美髮開單核對，不會直接增加營收。</p>${packets.map(p=>`<p>${E(p.date)} ${E(p.time)} · ${E(p.name)} · $${F(p.amount)}</p>`).join('')}${failed.length?'<p>尚待處理：</p>'+failed.map(x=>'<p>'+E(x)+'</p>').join(''):''}`,async()=>{
 let sent=0,posted=0;const errors=[];
 for(const p of packets){try{const fresh=await packet(p.appointmentId);if(B.comparable(fresh)!==B.comparable(p))throw Error('內容已修改');const status=await window.AetherCloudInbox.send(fresh);if(status==='posted')posted++;else sent++;}catch(e){errors.push(p.name+'：'+e.message);}}
 setTimeout(()=>openDialog('傳送結果',`<p>${E(value)}：${sent} 筆送至待核對區；${posted} 筆先前已入帳。</p>${errors.map(x=>'<p>'+E(x)+'</p>').join('')}<p>也可以直接開啟原本的美髮開單網址，在「待核對預約」選擇相同日期。</p><a href="${target}" target="_blank" rel="noopener">${day?'核對 '+E(value)+' 的資料':'打開美髮開單，核對待入帳預約'}</a>`,null),0);
 },day?'確認傳送這一天':'確認傳送這個月份'),0);
 });
}
actions['pos-month']=()=>transferRange('month');
actions['pos-day']=()=>transferRange('day');
})();
