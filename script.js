/* =====================================================
   QUÉ PODÉS CAMBIAR SIN RIESGO (solo cambiá valores, no nombres)
   - WA .............. número de WhatsApp
   - U (lista) ....... aparts: nombre, capacidad, precio base, descripción
   - CLEAN ........... costo de limpieza
   - función price ... multiplicadores de temporada y recargo de fin de semana
   - variable pct .... descuentos por cantidad de noches (dentro de quote)
   - Math.min(6 ...) . máximo de personas (cerca del final del archivo)
   Los colores y tamaños NO se tocan acá: están en styles.css.

   REGLAS PARA NO ROMPER NADA
   1. Cada línea de la lista U termina con coma, menos la última.
   2. Los textos van entre comillas simples '...'. Si el texto lleva un apóstrofo, escribilo con comillas dobles "...".
   3. No cambies los nombres de funciones (price, busy, render...) ni de variables (S, U, WA...).
   4. Guardá una copia del archivo antes de hacer cambios grandes.
   ===================================================== */

/* =====================================================
   GUÍA RÁPIDA DE ESTE ARCHIVO
   1) CONFIGURACIÓN: número de WhatsApp, tipos de apart y precios.
   2) FUNCIONES DE FECHAS Y PRECIOS: calculan disponibilidad y tarifas.
   3) FUNCIONES DE PANTALLA: dibujan calendario, aparts y cotización.
   4) El estado de lo que eligió el usuario está en la variable S.
   Cada vez que el usuario toca algo, se actualiza S y se llama a render().
   ===================================================== */

// ---------- 1) CONFIGURACIÓN ----------
// Motor de reservas de Octorate. CODIGO = código de la propiedad Oasis (sale del enlace del motor)
const OCTO='https://book.octorate.com/octobook/site/reservation/result.xhtml';
const CODIGO='38618436';
// Número de WhatsApp (código de país + área + número, sin signos ni espacios)
const WA='5492255000000';
// Tipos de apart: n = nombre, cap = capacidad máxima, base = precio base por noche (en pesos), d = descripción
// (el color de cada tarjeta se asigna solo, según el orden, desde styles.css)
const U=[
 {n:'Monoambiente Apart',cap:2,base:68000,d:'1 ambiente · cama doble · balcón'},
 {n:'2 ambientes Apart',cap:4,base:92000,d:'Dormitorio + sofá cama · cocina completa'},
 {n:'3 ambientes apart',cap:6,base:128000,d:'2 dormitorios · 2 baños · parrilla'},
 {n:'Suite Apart',cap:2,base:150000,d:'Jacuzzi privado · cama doble'},
 ];
// CLEAN = costo de limpieza final. fm() muestra un número como precio (ej: $92.000)
const CLEAN=18000,fm=n=>'$'+Math.round(n).toLocaleString('es-AR');

// ---------- 2) FECHAS Y PRECIOS ----------
// Helpers de fechas: add(d,n) suma n días a una fecha; same(a,b) dice si son el mismo día
const day0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const T=day0(new Date()),dk=d=>Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
const add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const same=(a,b)=>a&&b&&dk(a)===dk(b);
// busy(fecha, apart): ¿esa noche está ocupada? Hoy es SIMULADO (reemplazar por tu disponibilidad real)
const busy=(d,u)=>(Math.imul(dk(d)^(u*7919),2654435761)>>>0)%100<24;
// price(fecha, apart): precio de esa noche = precio base x temporada x recargo de fin de semana (vie y sáb +15%)
// Temporada: enero x1,8 · diciembre y febrero x1,5 · julio x1,2 · marzo x1,1 · resto del año x1
// PARA CAMBIAR PRECIOS: 1.8 / 1.5 / 1.2 / 1.1 son los multiplicadores (m==0 enero, m==11 diciembre, m==1 febrero, m==6 julio, m==2 marzo).
// 1.15 es el recargo de viernes y sábado (w==5||w==6). Para no cobrar recargo, poné 1.
const price=(d,u)=>{const m=d.getMonth(),w=d.getDay(),s=m==0?1.8:(m==11||m==1)?1.5:m==6?1.2:m==2?1.1:1;return Math.round(U[u].base*s*(w==5||w==6?1.15:1)/500)*500};
// iso(fecha): convierte una fecha a formato AAAA-MM-DD, que es el que pide Octorate
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
// octoLink(): arma el enlace al motor de Octorate con las fechas y personas ya cargadas
const octoLink=()=>`${OCTO}?checkin=${iso(S.a)}&checkout=${iso(S.b)}&pax=${S.g}&children=0&childrenAges=&codice=${CODIGO}&lang=ES`;
// S = estado: u = apart elegido, a = llegada, b = salida, g = personas, m = primer mes visible en el calendario
let S={u:1,a:null,b:null,g:2,m:new Date(T.getFullYear(),T.getMonth(),1)};
const $=id=>document.getElementById(id);
const fd=d=>d?d.toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'}):null;
// free(llegada, salida, apart): true si NINGUNA noche del rango está ocupada
// fits(apart): true si entran las personas elegidas · nights(): cantidad de noches elegidas
const free=(a,b,u)=>{for(let d=a;d<b;d=add(d,1))if(busy(d,u))return false;return true};
const fits=u=>S.g<=U[u].cap;
const nights=()=>S.a&&S.b?dk(S.b)-dk(S.a):0;

// ---------- 3) PANTALLA ----------
// toast(texto): muestra un aviso corto abajo
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2600)}
// pick(fecha): se ejecuta al tocar un día. 1er toque = llegada, 2do toque = salida (si el rango está libre)
function pick(d){
 if(S.a&&!S.b&&d>S.a){ if(free(S.a,d,S.u)){S.b=d}else{toast('Hay noches ocupadas en ese rango. Probá otras fechas.');S.a=busy(d,S.u)?null:d}}
 else{ if(busy(d,S.u)){toast('Esa noche está ocupada en este apart.');return} S.a=d;S.b=null}
 render();
}
// month(mes): arma el HTML de un mes del calendario (días, precios, ocupados y selección)
function month(m,second){
 const y=m.getFullYear(),mo=m.getMonth(),first=new Date(y,mo,1),off=(first.getDay()+6)%7,len=new Date(y,mo+1,0).getDate();
 let h=`<div class="cm${second?' second':''}"><div class="hd">${second?'<span></span>':`<button id="prev" aria-label="Mes anterior" ${m<=new Date(T.getFullYear(),T.getMonth(),1)?'disabled':''}>‹</button>`}<span>${m.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</span>${second?'<button id="next" aria-label="Mes siguiente">›</button>':'<span></span>'}</div><div class="days">`;
 'LMMJVSD'.split('').forEach(x=>h+=`<div class="dow">${x}</div>`);
 for(let i=0;i<off;i++)h+='<div></div>';
 for(let i=1;i<=len;i++){
  const d=new Date(y,mo,i),past=d<T,bz=busy(d,S.u),sel=same(d,S.a)||same(d,S.b),rg=S.a&&S.b&&d>S.a&&d<S.b;
  const co=S.a&&!S.b&&d>S.a&&free(S.a,d,S.u);
  const dis=past||(bz&&!co)||false;
  h+=`<button class="d${bz&&!sel?' busy':''}${sel?' sel':''}${rg?' rng':''}" data-t="${d.getTime()}" ${dis?'disabled':''} aria-label="${d.toLocaleDateString('es-AR',{dateStyle:'full'})}${bz?', ocupado':''}">${i}${!bz&&!past?`<i>${Math.round(price(d,S.u)/1000)}k</i>`:''}</button>`;
 }
 return h+'</div></div>';
}
// calendar(): dibuja los dos meses y conecta las flechas y los clicks de cada día
function calendar(){
 const m2=new Date(S.m.getFullYear(),S.m.getMonth()+1,1);
 $('cal').innerHTML=month(S.m,false)+month(m2,true);
 $('prev').onclick=()=>{S.m=new Date(S.m.getFullYear(),S.m.getMonth()-1,1);calendar()};
 $('next').onclick=()=>{S.m=new Date(S.m.getFullYear(),S.m.getMonth()+1,1);calendar()};
 document.querySelectorAll('.d').forEach(b=>b.onclick=()=>pick(new Date(+b.dataset.t)));
}
// units(): dibuja las tarjetas de aparts con su disponibilidad y precio promedio para las fechas elegidas
function units(){
 const n=nights();
 $('usub').textContent=n?`Disponibilidad para ${n} ${n>1?'noches':'noche'} y ${S.g} ${S.g>1?'personas':'persona'}.`:'Elegí fechas para ver cuáles están libres.';
 $('units').innerHTML=U.map((u,i)=>{
  const ok=fits(i)&&(!n||free(S.a,S.b,i)),tot=n?[...Array(n)].reduce((s,_,k)=>s+price(add(S.a,k),i),0):0;
  const tag=!fits(i)?`<span class="tag no">Capacidad máx. ${u.cap}</span>`:n?(ok?'<span class="tag">Disponible</span>':'<span class="tag no">No disponible en esas fechas</span>'):'';
  return `<button class="u${ok?'':' na'}" data-i="${i}" aria-pressed="${i===S.u}" ${fits(i)?'':'disabled'}><div class="t tono-${i%5+1}"></div><div><h3>${u.n}</h3><p>${u.d} · hasta ${u.cap}</p>${tag}</div><div class="pr">${n?`<b>${fm(tot/n)}</b>promedio / noche`:`desde<b>${fm(price(add(T,30),i))}</b>por noche`}</div></button>`}).join('');
 document.querySelectorAll('.u').forEach(b=>b.onclick=()=>{S.u=+b.dataset.i;if(S.a&&S.b&&!free(S.a,S.b,S.u))toast('Ese apart está ocupado en parte de tus fechas.');render()});
}
// quote(): arma la cotización: alojamiento, descuento (5% desde 4 noches, 10% desde 7), limpieza, total y seña del 30%
// También arma el link de WhatsApp con el mensaje de reserva
function quote(){
 const n=nights(),q=$('quote');
 if(!n){q.innerHTML=`<h3>Tu cotización</h3><p class="empty">Elegí llegada y salida en el calendario y vas a ver el precio final acá, con todo incluido.</p><a class="cta alt" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola! Quiero consultar disponibilidad.')}">Consultar por WhatsApp</a>`;$('bs').textContent='Elegí tus fechas';$('bt').textContent='—';$('bcta').textContent='Ver precio';return}
 const ok=free(S.a,S.b,S.u)&&fits(S.u);
 // PARA CAMBIAR DESCUENTOS: pct=n>=7?.1:n>=4?.05:0 significa 10% desde 7 noches, 5% desde 4 noches, 0% si son menos.
 // Ej: 15% desde 10 noches y 5% desde 4 => pct=n>=10?.15:n>=4?.05:0
 const sub=[...Array(n)].reduce((s,_,k)=>s+price(add(S.a,k),S.u),0),pct=n>=7?.1:n>=4?.05:0,dsc=sub*pct,tot=sub-dsc+CLEAN,dep=tot*.3;
 const msg=`Hola! Quiero reservar ${U[S.u].n} del ${fd(S.a)} al ${fd(S.b)} (${n} noches, ${S.g} personas). Total: ${fm(tot)}.`;
 q.innerHTML=`<h3>${U[S.u].n}</h3><div class="row"><span>${fd(S.a)} → ${fd(S.b)}</span><span>${n} ${n>1?'noches':'noche'}</span></div>
 <div class="row"><span>Alojamiento</span><span>${fm(sub)}</span></div>
 ${pct?`<div class="row dis"><span>Descuento ${n>=7?'7+':'4+'} noches (${pct*100}%)</span><span>−${fm(dsc)}</span></div>`:n<4?`<div class="row hint"><span>Con 4 noches o más tenés 5% de descuento</span></div>`:''}
 <div class="row"><span>Limpieza final</span><span>${fm(CLEAN)}</span></div>
 <div class="row tot"><span>Total</span><span>${fm(tot)}</span></div>
 <p class="note">${fm(tot/S.g/n)} por persona y por noche. Al continuar vas a ver la disponibilidad y el precio final confirmados en nuestro motor de reservas.</p>
 ${ok?`<a class="cta" target="_blank" rel="noopener" href="${octoLink()}">Ver disponibilidad y reservar</a><a class="cta alt" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola! Tengo una duda sobre: '+msg)}">Tengo una consulta</a>`:`<button class="cta" disabled>No disponible en esas fechas</button>`}`;
 $('bs').textContent=`${n} noches · total`;$('bt').textContent=fm(tot);$('bcta').textContent=ok?'Reservar':'Cambiar';
 $('bcta').dataset.link=ok?octoLink():'';
}
// render(): vuelve a dibujar todo. Se llama después de cada cambio del usuario
function render(){
 $('fin').className='f'+(!S.a?' on':'');$('fout').className='f'+(S.a&&!S.b?' on':'');
 $('fin').querySelector('b').textContent=fd(S.a)||'Elegí fecha';$('fout').querySelector('b').textContent=fd(S.b)||'Elegí fecha';
 $('gn').textContent=S.g;
 if(!fits(S.u))S.u=U.findIndex((_,i)=>fits(i));
 calendar();units();quote();
}
// Botones − y + de personas. El 1 es el mínimo y el 6 el máximo (cambialo si agregás aparts más grandes).
$('gm').onclick=()=>{S.g=Math.max(1,S.g-1);render()};
$('gp').onclick=()=>{S.g=Math.min(6,S.g+1);render()};
// Video: al tocar el recuadro se carga YouTube y se abre la ventana. Al cerrar se descarga, así deja de sonar.
$('vbtn').onclick=()=>{$('yt').src=$('yt').dataset.src;$('dlg').showModal()};
$('dclose').onclick=()=>$('dlg').close();
$('dlg').addEventListener('close',()=>{$('yt').src=''});
// Botón de la barra fija del celular: abre el motor de reservas o, si no hay fechas, lleva a la cotización.
$('bcta').onclick=e=>{const l=e.target.dataset.link;if(l)window.open(l,'_blank','noopener');else document.querySelector('.q').scrollIntoView({behavior:'smooth'})};
render();
