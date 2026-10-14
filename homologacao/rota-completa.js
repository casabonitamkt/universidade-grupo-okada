const app=document.getElementById('app');
const title=document.createElement('h2');title.textContent='CRM de teste';app.replaceChildren(title);
const input=document.createElement('input');input.placeholder='Responsável';app.append(input);
const button=document.createElement('button');button.textContent='Registrar';app.append(button);
button.onclick=()=>{const p=document.createElement('p');p.textContent=input.value;app.append(p)};
