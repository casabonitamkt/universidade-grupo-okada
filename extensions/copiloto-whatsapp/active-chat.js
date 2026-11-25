// Reads identifiers from the active conversation, never message text.
function readActiveChat(){
  const main=document.querySelector('#main');
  const header=main?.querySelector('header');
  const title=header?.querySelector('[data-testid="conversation-info-header-chat-title"], span[title][dir="auto"]');
  const label=(title?.getAttribute('title')||title?.textContent||'').trim();
  if(!label)return {reason:'no-chat'};

  const selected=[...document.querySelectorAll('#pane-side [aria-selected="true"]')];
  const row=selected.length===1?selected[0]:null;
  const rowMatches=row&&[...row.querySelectorAll('[title]')].some(node=>node.getAttribute('title')===label);
  const rowIds=rowMatches?[row,...row.querySelectorAll('[data-id]')].map(node=>node.getAttribute('data-id')):[];
  const messages=[...main.querySelectorAll('[data-id^="true_"], [data-id^="false_"]')];
  const remoteIds=messages.map(node=>node.getAttribute('data-id')?.match(/^(?:true|false)_([^_]+)_/)?.[1]);
  const ids=[...new Set([...rowIds,...remoteIds].filter(id=>/^\d+(?:-\d+)?@(?:c\.us|s\.whatsapp\.net|lid|g\.us|broadcast|newsletter)$/.test(id||'')))];
  if(ids.some(id=>/@(?:g\.us|broadcast|newsletter)$/.test(id)))return {reason:'unsupported'};
  const phones=new Set(ids.map(id=>id.match(/^(\d{10,15})@(?:c\.us|s\.whatsapp\.net)$/)?.[1]).filter(Boolean));
  if(/^\+?[\d() -]{10,23}$/.test(label)){
    const digits=label.replace(/\D/g,'');
    if(digits.length>=10&&digits.length<=15)phones.add(digits);
  }
  const privateIds=ids.filter(id=>/^\d+@lid$/.test(id));
  if(phones.size===0&&privateIds.length===1)return {reason:'private-id',privateId:privateIds[0],label};
  if(phones.size!==1)return {reason:phones.size||privateIds.length?'ambiguous':'no-phone'};
  return {phone:[...phones][0]};
}

chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message?.type==='okada-active-chat'&&sender.id===chrome.runtime.id)reply(readActiveChat());
});
