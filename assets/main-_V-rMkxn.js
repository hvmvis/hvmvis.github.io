/* empty css              */(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();const Q=[["erase","@main=r&(r *)~*"],["annihilate","@main=r&(r *)~(* *)"],["commute","@main=r&(r *)~{* *}"],["call",`@main=r&(r *)~@fn
    @fn={(a a) *}
    `]],[c,M,S]=[0,1,2],p=document.querySelector("svg#mySvg");p.setAttribute("width",document.documentElement.clientWidth.toString());p.setAttribute("height",document.documentElement.clientHeight.toString());const q=document.querySelector("#codeblock"),H=q.querySelector("#codecontent");document.querySelector("#errormsg");let m=[],L=!0;function h(t,e,...n){if(!t){n.forEach(s=>s.color(!0));try{z()}catch(s){console.error(s)}throw L=!1,new Error(e)}}const Z=document.createElementNS("http://www.w3.org/2000/svg","g"),V=document.createElementNS("http://www.w3.org/2000/svg","g");let a=[],w=[];class i{constructor(e,n){h(typeof e=="number"&&!isNaN(e),"x is not a number"),h(typeof n=="number"&&!isNaN(n),"y is not a number"),this.x=e,this.y=n}add(e){return new i(this.x+e.x,this.y+e.y)}sub(e){return new i(this.x-e.x,this.y-e.y)}mul(e){return new i(this.x*e,this.y*e)}slen(){return this.x**2+this.y**2}len(){return Math.sqrt(this.slen())}T(){return new i(this.y,-this.x)}static lookat(e){return new i(Math.cos(e),Math.sin(e))}normalized(){return this.mul(1/this.len())}}const C=new i(0,0),ee=new i(p.clientWidth/2,p.clientHeight/2);let f=new i(0,0);class F{constructor(){this.removed=!1,this.id=Math.random().toString().slice(2),this.element=this.create_element(),this.element.setAttribute("id",this.id)}create_element(){return document.createElementNS("http://www.w3.org/2000/svg","g")}remove(){this.element.remove(),this.removed=!0,a=a.filter(e=>!e.removed),w=w.filter(e=>!e.removed),m=m.filter(e=>!e.removed)}color(e){this.element.setAttribute("stroke",e?"red":"var(--color)")}}class O extends F{constructor(e=null){super(),this.pos=C,this.vel=C,this.connections=[null],this.port_pos=[C],this.rotation=0,this.tag="",this.repforce=100,this.grav=.01,this.dot=this.create_dot(),this.element.appendChild(this.dot),this.pos=e==null?new i((Math.random()-.5)*p.clientWidth,(Math.random()-.5)*p.clientHeight):e,V.appendChild(this.element),a.push(this),this.color(!1)}set_text(e){this.tag=e;let n=document.createElementNS("http://www.w3.org/2000/svg","text");n.setAttribute("x","10"),n.setAttribute("y","5"),n.textContent=e,n.setAttribute("fill","var(--color)"),this.element.appendChild(n)}create_dot(){let e=document.createElementNS("http://www.w3.org/2000/svg","circle");return e.setAttribute("r","5"),e.setAttribute("stroke","var(--color)"),e.id=this.id,e}create_element(){return document.createElementNS("http://www.w3.org/2000/svg","g")}energy(){return a.map(e=>e==this?0:this.repforce/this.pos.sub(e.pos).len()).reduce((e,n)=>e+n)+this.pos.len()*this.grav}physics(){this.vel=this.vel.mul(.97).add(this.pos.normalized().mul(-this.grav)),a.forEach(n=>{if(n==this)return;let s=this.pos.sub(n.pos).slen();this.vel=this.vel.add(this.pos.sub(n.pos).normalized().mul(1/s).mul(this.repforce))});const e=.7;this.vel.len()>e&&(this.vel=this.vel.normalized().mul(e)),this.pos=this.pos.add(this.vel)}update(){if(this.removed){a=a.filter(n=>n!=this);return}h(this.connections.map(n=>n!=null).reduce((n,s)=>n&&s),"not all connections are connected",this),this.port_pos=[this.pos];let e=this.get_principal();if(e!=null){let n=e.other({node:this,side:c}).node.pos;this.rotation=Math.atan2(n.y-this.pos.y,n.x-this.pos.x)}}display(){var e;(e=this.element)==null||e.setAttribute("transform",`translate(${this.pos.x-f.x}, ${this.pos.y-f.y}) `)}get_principal(){return this.connections[0]}get_left(){return this.connections[1]}get_right(){return this.connections[2]}color(e){this.element.setAttribute("fill",e?"red":"black");for(let n of this.connections)n!=null&&n.color(e)}}class _ extends O{constructor(e=null){super(e),this.connections=[null,null,null]}create_dot(){let e=document.createElementNS("http://www.w3.org/2000/svg","polygon");return e.setAttribute("stroke","var(--color)"),e.id=this.id,e}create_element(){return document.createElementNS("http://www.w3.org/2000/svg","g")}update(){super.update(),this.port_pos=[new i(10,0),new i(-5,-5),new i(-5,5)].map(e=>this.pos.add(e.T().mul(-Math.sin(this.rotation))).add(e.mul(Math.cos(this.rotation))))}display(){super.display();let e=[0,1,2].map(n=>new i(10*Math.cos(this.rotation+n*Math.PI/3*2),10*Math.sin(this.rotation+n*Math.PI/3*2))).map(n=>`${n.x}, ${n.y}`).join(" ");this.dot.setAttribute("points",e)}}class W extends O{}class j extends O{}class R extends O{color(e){super.color(e),this.dot.setAttribute("fill",e?"red":"white")}}class te extends _{color(e){super.color(e),this.dot.setAttribute("fill",e?"red":"white")}}class ne extends _{constructor(){super(),this.set_text("?")}}class se extends _{constructor(){super(),this.set_text("$")}}class x extends F{constructor(e,n){h(e.node.connections[e.side]==null,"start preconnected",e.node),h(n.node.connections[n.side]==null,"end preconnected",n.node),h(e.node!=n.node||e.side!=n.side,"start and end are the same",e.node,n.node),super(),this.grav=.04,this.start=e,this.end=n,Z.appendChild(this.element),w.push(this),this.start.node.connections[this.start.side]=this,this.end.node.connections[this.end.side]=this,this.start.side==c&&this.end.side==c&&!(this.start.node instanceof R)&&!(this.end.node instanceof R)&&m.push(this)}create_element(){let e=document.createElementNS("http://www.w3.org/2000/svg","path");return e.setAttribute("fill","none"),e.setAttribute("stroke","var(--color)"),e}other(e){return this.start.node==e.node&&this.start.side==e.side?this.end:this.start}update(){}color(e){super.color(e);let n=m.indexOf(this);n!=-1&&(m[n]=m[0],m[0]=this)}display(){let e=this.start.node.port_pos[this.start.side],n=this.end.node.port_pos[this.end.side],s=this.start.node.rotation+(this.start.side!=c?Math.PI:0),o=this.end.node.rotation+(this.end.side!=c?Math.PI:0),r=e.sub(n).len()/2+5,l=e.add(i.lookat(s).mul(r)).sub(f),g=n.add(i.lookat(o).mul(r)).sub(f);e=e.sub(f),n=n.sub(f);let b=`M ${e.x} ${e.y} C ${l.x} ${l.y} ${g.x} ${g.y} ${n.x} ${n.y}`;this.element.setAttribute("d",b)}physics(){if(this.start.node==this.end.node)return;let e=this.start.node.pos.sub(this.end.node.pos).normalized();this.start.node.vel=this.start.node.vel.add(e.mul(-this.grav)),this.end.node.vel=this.end.node.vel.add(e.mul(this.grav))}energy(){return this.start.node.pos.sub(this.end.node.pos).len()*this.grav}remove(){super.remove(),this.start.node.connections[this.start.side]=null,this.end.node.connections[this.end.side]=null}}const X=new Map;function oe(t){console.log(t),P(d=>d.remove()),X.clear();let e=t.match(/[@,a-z,0-9]+|\$\(|\?\(|\(|\)|\{|\}|\[|\]|=|&|\*|~/g)||[];function n(){return e.shift()}function s(){return e[0]}const o=new Map;r();function r(){for(;e.length>0;)l()}function l(){console.log("parse_net"),o.clear();const d=n();h(d.startsWith("@"),"no @"),h(n()=="=","no =");let u=new R;u.set_text(d.slice(1)),X.set(d.slice(1),u);let v=b();for(new x({node:u,side:c},v);s()=="&";)n(),g()}function g(){let d=b();h(n()=="~","no ~");let u=b();new x(d,u)}function b(){let d=s(),u={"(":_,"{":te,"$(":se,"?(":ne};if(!u[d])return B();n();let v=new u[d],k=b();new x({node:v,side:M},k);let N=b();new x({node:v,side:S},N);let y=n();return h(y==")"||y=="}",`invalid end token ${y}`),{node:v,side:c}}function B(){let d=n(),u=W,v="";if(d=="*")u=W;else if(d.startsWith("@"))u=j,v=d.slice(1);else{if(o.has(d)){let y=o.get(d);y.remove();let J=y.connections[c].other({node:y,side:c});return y.connections[c].remove(),J}let N=new u;return o.set(d,N),{node:N,side:c}}let k=new u;return k.set_text(v),{node:k,side:c}}ue()}function P(t){w.forEach(t),a.forEach(t)}function G(){P(t=>t.update())}function re(){if(m.length>0){let t=m[0];h(t.removed==!1,"tomerge is removed");let e=t.start.node,n=t.end.node;w.forEach(s=>{if(s!=t)s.physics();else{let o=e.pos.sub(n.pos);e.pos=e.pos.add(o.normalized().mul(-.7)),n.pos=n.pos.add(o.normalized().mul(.7)),o.len()<20&&(t.remove(),ce(e,n))}}),a.forEach(s=>{s!=e&&s!=n&&s.physics()})}else P(t=>t.physics())}function K(t,e){if(e.has(t))return e.get(t);let n=new t.constructor;return n.set_text(t.tag),e.set(t,n),t.connections.map(s=>{let[o,r]=[s.start,s.end].map(l=>({node:K(l.node,e),side:l.side}));o.node.connections[o.side]==null&&new x(o,r)}),n}function ie(t,e){let[n,s]=[t,e].map(o=>{let r=o.node.connections[o.side];return r&&r.remove(),r});n&&s&&n!=s&&new x(n.other(t),s.other(e))}function le(t,e){console.log("annihilate",t,e),[M,S].map(n=>ie({node:t,side:n},{node:e,side:n}))}function Y(t,e){let n=e.node.connections[e.side];n.remove(),new x(t,n.other(e))}function de(t,e){let n=[0,0,1,1].map(s=>new(s==0?e:t).constructor((s==0?t:e).pos));[0,0,1,1].map((s,o)=>{let r=o%2;new x({node:n[s],side:[M,S][r]},{node:n[2+r],side:[M,S][s]}),Y({node:n[o],side:c},{node:s?e:t,side:r==0?M:S})}),n.map(T)}function ae(t,e){[M,S].map(n=>{let s=new e.constructor(e.pos);return Y({node:s,side:c},{node:t,side:n}),s}).map(T)}function D(t,e){let n=X.get(t),s=new Map,o=K(n,s);Y({node:e,side:c},{node:o,side:c}),o.remove();for(let r of s.values())r.pos=r.pos.add(e.pos).sub(n.pos);for(let r=0;r<20;r++)for(let l of s.values())T(l)}function ce(t,e){if(t instanceof _&&([t,e]=[e,t]),t.remove(),t instanceof j)return D(t.tag,e);e.remove();let[n,s]=[t,e].map(o=>o.constructor.name);if(t instanceof _&&e instanceof _)n!=s?de(t,e):le(t,e);else if(t instanceof W)e instanceof _&&ae(e,t);else if(t instanceof j)D(t.tag,e);else throw console.log(t,e),new Error("invalid interaction")}function z(){h(!w.map(t=>t.removed).reduce((t,e)=>t||e),"edges are removed"),h(!a.map(t=>t.removed).reduce((t,e)=>t||e),"nodes are removed"),P(t=>t.display()),p.innerHTML=w.map(t=>t.element.outerHTML).join("")+a.map(t=>t.element.outerHTML).join("")}let A=!1;function T(t,e=100){function n(r){return r.energy()+r.connections.map(l=>{var g;return(g=l==null?void 0:l.energy())!=null?g:0}).reduce((l,g)=>l+g)}let s=n(t),o=t.pos;for(let r=0;r<4;r++)t.pos=t.pos.add(i.lookat(Math.random()*Math.PI*2).mul(e*Math.random())),n(t)>s&&(t.pos=o)}function ue(){for(let e=0;e<40;e++)a.forEach(n=>T(n));f=a.map(e=>e.pos).reduce((e,n)=>e.add(n)).mul(1/a.length).sub(ee)}setInterval(()=>{a=a.filter(t=>!t.removed),w=w.filter(t=>!t.removed),m=m.filter(t=>!t.removed),!(!L||A)&&(re(),G(),z())},1e3/30);let E,$,I;p.addEventListener("mousedown",t=>{if(E!=null&&E.color(!1),t.target!=p){let e=t.target.id;E=a.find(n=>n.id==e),E&&E.color(!0),$=E,console.log(E)}else I=new i(t.offsetX,t.offsetY).add(f);z()});p.addEventListener("mousemove",t=>{$!=null?($.pos=new i(t.offsetX,t.offsetY).add(f),$.vel=C,G()):I!=null&&(f=new i(-t.offsetX,-t.offsetY).add(I)),z()});document.addEventListener("mouseup",()=>I=$=void 0);{let t=`@main = res
  & {res a} ~ (b c)`;localStorage.code!=null&&(t=localStorage.code),window.location.search&&(t=window.location.search.slice(1).replace(/,/g," "),window.history.pushState({},document.title,window.location.pathname)),U(t)}function U(t){t=decodeURIComponent(t),t=(`
`+t).replace(/ +/g," "),t=t.replace(/\n ?@/g,"@@").replace(/\s+/g," "),t=t.replace(/@@/g,`

@`).replace(/&/g,`
  &`),H.value=t,oe(t),localStorage.code=t}function he(){if(!A)p.style.display="none",q.style.display="flex",H.focus();else{let t=H.value;U(t),q.style.display="none",p.style.display="block"}A=!A}{const t=document.querySelector("#files");let e=document.createElement("p");t.appendChild(e),e.textContent="Examples:",Q.map(([s,o])=>{const r=document.createElement("a");r.textContent=`${s}`,r.href=`?${o}`,t.appendChild(r)}),t.appendChild(document.createElement("br"));let n=document.createElement("a");n.textContent="readme",n.href="/readme.html",t.appendChild(n)}document.addEventListener("keydown",t=>{t.code=="Space"&&(A||(t.preventDefault(),L=!L)),t.code=="Enter"&&t.metaKey&&he()});
