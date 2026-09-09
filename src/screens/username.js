import { t } from '../i18n.js';
import { G } from '../state.js';
import { isValidUsername, saveUsername } from '../storage.js';
import { view } from '../dom.js';

export function renderUsername({ onDone, onBack, initial='', title, submitLabel }={}){
  title = title ?? t('chooseUsername');
  submitLabel = submitLabel ?? t('continue');
  G.screen='username';
  view.innerHTML = `
    <div class="screen" id="screen-username">
      ${onBack?`<div class="topnav"><div class="navlink" id="pseudoBack">← ${t('back')}</div><div></div></div>`:''}
      <div class="pseudo-title label">${title}</div>
      <form id="pseudoForm" autocomplete="off">
        <input class="pseudo-input display" id="pseudoInput" type="text" inputmode="text" enterkeyhint="done" autocomplete="nickname" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="32" value="">
        <button class="pseudo-btn" id="pseudoSubmit" type="submit">${submitLabel}</button>
      </form>
    </div>`;
  const input=document.getElementById('pseudoInput');
  const form=document.getElementById('pseudoForm');
  input.value = initial;
  const trySave=()=>{
    if(!saveUsername(input.value)){
      input.classList.add('invalid');
      input.focus();
      return;
    }
    onDone&&onDone();
  };
  form.onsubmit=(e)=>{ e.preventDefault(); trySave(); };
  input.oninput=()=>{
    input.classList.remove('invalid');
    document.getElementById('pseudoSubmit').classList.toggle('off', !isValidUsername(input.value));
  };
  document.getElementById('pseudoSubmit').classList.toggle('off', !isValidUsername(input.value));
  if(onBack) document.getElementById('pseudoBack').onclick=onBack;
  requestAnimationFrame(()=>input.focus());
}