(() => {
'use strict';
const $=id=>document.getElementById(id);
const pages=[
 {date:'2026年11月7日',short:'11月7日',phase:0,rank:'初候',name:'水始冰',summary:'天冷了，平静的水边开始结起一层薄冰，旁边仍有水纹在轻轻流动。',observation:'先看薄冰的边缘，再看尚未冻住的水面。'},
 {date:'2026年11月12日',short:'11月12日',phase:1,rank:'二候',name:'地始冻',summary:'寒意从地表向下渗入，表层泥土先冻结，更深处仍保留着未冻的土层。',observation:'浅蓝的冻层在上，松软的泥土在下。'}
];
const hero=$('hero'),viewport=$('stageWindow'),art=$('art'),slot=$('artSlot'),copy=$('copy'),items=[...copy.querySelectorAll('[data-reveal]')],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const TIMING={slide:720,hold:1600,shrink:1200};
const easing='cubic-bezier(.22,1,.36,1)',slideEase='cubic-bezier(.65,0,.25,1)';
let current=0,sequence=0,active=[],running=false,lastSize=innerWidth,hold=null;
function animate(el,frames,opts){const a=el.animate(frames,{fill:'both',...opts});active.push(a);return a}
const finished=a=>a.finished.catch(()=>{});
function pause(ms){return new Promise(resolve=>{hold={resolve,timer:setTimeout(()=>{hold=null;resolve()},ms)}})}
function stop(){if(hold){clearTimeout(hold.timer);hold.resolve();hold=null}active.forEach(a=>a.cancel());active=[];viewport.querySelectorAll('.outgoing-page').forEach(el=>el.remove())}
function settle(){hero.style.transform='none';hero.style.opacity='1';hero.style.willChange='auto';art.style.transform='none';art.style.opacity='1';art.style.willChange='auto';items.forEach(el=>{el.style.opacity='1';el.style.transform='none';el.style.filter='none'});hero.dataset.state='ready';running=false;stop()}
function render(index){current=index;const p=pages[index];$('copyDate').textContent=p.date+' · '+p.rank;$('phaseName').textContent=p.name;$('summary').textContent=p.summary;$('observation').textContent=p.observation;$('controlDate').textContent=p.short+' · '+p.name;art.innerHTML=window.SeasonScenes.render(18,p.phase);$('previous').disabled=index===0;$('next').disabled=index===pages.length-1;$('pageDots').setAttribute('aria-label',`第${index+1}页，共${pages.length}页`);$('pageDots').innerHTML=pages.map((_,i)=>`<i class="${index===i?'active':''}"></i>`).join('');document.title=p.short+' · '+p.name+'｜时节动效试映';window.SeasonScenes.observe()}
function snapshot(){const ghost=hero.cloneNode(true);ghost.classList.add('outgoing-page');ghost.inert=true;ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));ghost.style.width=hero.offsetWidth+'px';ghost.style.height=hero.offsetHeight+'px';ghost.style.transform=getComputedStyle(hero).transform;const capturedArt=ghost.querySelector('.art');capturedArt.style.transform=getComputedStyle(art).transform;capturedArt.style.opacity='1';ghost.querySelectorAll('[data-reveal]').forEach((el,i)=>{el.style.opacity=getComputedStyle(items[i]).opacity;el.style.transform=getComputedStyle(items[i]).transform;el.style.filter=getComputedStyle(items[i]).filter});return ghost}
function enlargedTransform(){const region=viewport.getBoundingClientRect(),box=slot.getBoundingClientRect();const x=region.left+region.width/2-(box.left+box.width/2),y=region.top+region.height/2-(box.top+box.height/2);return `translate3d(${x}px,${y}px,0) scale(${innerWidth<=600?1.62:1.5})`}
async function present(index,initial=false){if(index<0||index>=pages.length)return;const oldIndex=current,changed=!initial&&index!==oldIndex,id=++sequence;const ghost=changed&&!reduce.matches?snapshot():null;stop();running=true;hero.style.transform='none';hero.style.opacity='1';items.forEach(el=>{el.style.opacity='0';el.style.transform='none';el.style.filter='none'});art.style.transform='none';art.style.opacity='1';render(index);
 if(reduce.matches){settle();$('announcement').textContent=pages[index].date+'，立冬'+pages[index].rank+'，'+pages[index].name+'。';return}
 const large=enlargedTransform();art.style.transform=large;art.style.willChange='transform';hero.dataset.state='focus';
 if(changed){const direction=index>oldIndex?1:-1,distance=Math.max(innerWidth,viewport.offsetWidth+120);viewport.append(ghost);hero.dataset.state='sliding';hero.style.willChange='transform';const incoming=animate(hero,[{transform:`translate3d(${direction*distance}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:TIMING.slide,easing:slideEase});const outgoing=animate(ghost,[{transform:ghost.style.transform==='none'?'translate3d(0,0,0)':ghost.style.transform},{transform:`translate3d(${-direction*distance}px,0,0)`}],{duration:TIMING.slide,easing:slideEase});await Promise.all([finished(incoming),finished(outgoing)]);if(id!==sequence)return;hero.style.transform='none';ghost.remove();hero.style.willChange='auto';hero.dataset.state='focus'}
 await pause(TIMING.hold);if(id!==sequence)return;
 hero.dataset.state='settling';
 const picture=animate(art,[{transform:large},{transform:'translate3d(0,0,0) scale(1)'}],{duration:TIMING.shrink,easing});
 const delay=innerWidth<=600?320:180;
 const text=items.map((el,i)=>animate(el,[{opacity:0,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:650,delay:delay+i*45,easing}));
 await Promise.all([finished(picture),...text.map(finished)]);if(id!==sequence)return;settle();$('announcement').textContent=pages[index].date+'，立冬'+pages[index].rank+'，'+pages[index].name+'。';
}
$('previous').onclick=()=>present(current-1);$('next').onclick=()=>present(current+1);$('replay').onclick=()=>present(current);
document.addEventListener('keydown',e=>{if(e.altKey||e.metaKey||e.ctrlKey)return;if(e.key==='ArrowLeft'){e.preventDefault();present(current-1)}if(e.key==='ArrowRight'){e.preventDefault();present(current+1)}});
let touch=null;hero.addEventListener('touchstart',e=>{touch=[e.changedTouches[0].clientX,e.changedTouches[0].clientY]},{passive:true});hero.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)present(current+(dx<0?1:-1));touch=null},{passive:true});
window.addEventListener('resize',()=>{if(Math.abs(innerWidth-lastSize)>30){lastSize=innerWidth;if(running){sequence++;settle()}}});reduce.addEventListener('change',()=>{if(reduce.matches&&running){sequence++;settle()}});
render(0);present(0,true);
})();
