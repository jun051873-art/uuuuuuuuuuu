(function(){
if(location.origin!=='https://jun051873-art.github.io'||!/^\/uuuuuuuuuuu\/(?:index.html)?$/.test(location.pathname))return;
const oldSettings=renderSettings;
renderSettings=function(){
 oldSettings();const list=document.querySelector('.settings-list');if(!list)return;
 const group=document.createElement('details');group.className='settings-category';
 const summary=document.createElement('summary');summary.textContent='常用工具';group.append(summary);
 for(const action of ['bio-settings','usage-guide','device-features']){const button=list.querySelector('[data-action="'+action+'"]');if(button){const parent=button.parentElement;group.append(button);if(parent!==list&&!parent.children.length)parent.remove();}}
 if(group.children.length>1)list.prepend(group);
};
})();