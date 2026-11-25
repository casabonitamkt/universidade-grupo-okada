// Inspect only the open conversation header and its matching selected row.
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if(message?.type!=='okada-active-chat'||sender.id!==chrome.runtime.id)return;
  const title=document.querySelector('#main > header [data-testid="conversation-info-header-chat-title"], #main > header span[title][dir="auto"]');
  const label=(title?.getAttribute('title')||title?.textContent||'').trim();
  const rows=[...document.querySelectorAll('#pane-side [aria-selected="true"]')];
  const row=rows.length===1?rows[0]:null;
  const rowLabel=row&&[...row.querySelectorAll('[title]')].some(node=>node.getAttribute('title')===label);
  const ids=rowLabel?[row,...row.querySelectorAll('[data-id]')].map(node=>node.getAttribute('data-id')):[];
  const phones=[...new Set(ids.map(id=>id?.match(/^(\d{10,15})@(?:c\.us|s\.whatsapp\.net)$/)?.[1]).filter(Boolean))];
  const direct=/^\+?[\d() -]{10,23}$/.test(label)?label.replace(/\D/g,''):'';
  reply({phone:phones.length===1?phones[0]:direct.length>=10&&direct.length<=15?direct:''});
});
