const MAIN = 0
const LEFT = 1
const RIGHT = 2

const OUT = 0
const VAR = 1
const APP = 2
const DUP = 3
const ERA = 4
const LAM = 5
const SUP = 6
const NUL = 7

const displaysvg = document.querySelector('svg#mySvg') as SVGElement;
displaysvg.setAttribute('width', document.documentElement.clientWidth.toString())
displaysvg.setAttribute('height', document.documentElement.clientHeight.toString())
const codeblock = document.querySelector('pre#codeblock') as HTMLPreElement;

let merge_stack:Edge[] = []

let running = true;

function assert (val:boolean, msg:any, ...els:El[]){
  if (!val) {
    els.forEach(el=>el.color(true))
    display()
    running = false;
    throw new Error(msg)
  }
}

const edge_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const node_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');


let nodes:Terminal[] = [];
let edges:Edge[] = [];


class Vec2{
  x:number
  y:number
  constructor(x:number, y:number){
    assert (typeof x == 'number' && !isNaN(x), `x is not a number`)
    assert (typeof y == 'number' && !isNaN(y), `y is not a number`)
    this.x = x;
    this.y = y;
  }
  add(v:Vec2){return new Vec2(this.x + v.x, this.y + v.y)}
  sub(v:Vec2){return new Vec2(this.x - v.x, this.y - v.y)}
  mul(s:number){return new Vec2(this.x * s, this.y * s)}
  slen(){return this.x**2 + this.y**2}
  len(){return Math.sqrt(this.slen())}
  T(){return new Vec2(this.y, -this.x)}
  static lookat(angle:number){return new Vec2(Math.cos(angle), Math.sin(angle))}
  normalized(){return this.mul(1/this.len())}
  static randpos(){return new Vec2(Math.random() * displaysvg.clientWidth, Math.random() * displaysvg.clientHeight )}
}

const v0 = new Vec2(0, 0)
const center = new Vec2(displaysvg.clientWidth/2, displaysvg.clientHeight/2)
let cam_pos = new Vec2(0, 0)

class El{
  removed = false;
  id: string 
  element: SVGElement
  constructor(){
    this.element = this.create_element();
    this.id = Math.random().toString().slice(2);
  }
  create_element():SVGElement{return document.createElementNS('http://www.w3.org/2000/svg', 'g')}
  remove(){
    this.element.remove();
    this.removed = true;
    nodes = nodes.filter(n=>!n.removed)
    edges = edges.filter(e=>!e.removed)
    merge_stack = merge_stack.filter(e=>!e.removed)
  }

  color(active:boolean){
    this.element.setAttribute('stroke', active ? 'red':'var(--color)');
  }
}

class Terminal extends El{
  type: number
  pos = v0
  vel = v0
  connections: (Edge | null)[] = [null];
  port_pos: Vec2[] = [v0]
  rotation: number = 0;
  constructor(type=OUT, pos:Vec2|null=null){
    super();
    this.type = type
    this.pos = pos?? Vec2.randpos();
    node_group.appendChild(this.element)  ;
    nodes.push(this);
    this.color(false);
  }

  create_element():SVGElement{
    let element = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    element.setAttribute('r', '5')
    element.setAttribute('stroke', 'var(--color)')
    return element
  }
  
  repforce = 100.

  grav = 0.01
  energy(){
    return nodes.map(n=>n==this?0: this.repforce/this.pos.sub(n.pos).len()
    ).reduce((a,b)=>a+b) + this.pos.len() * this.grav
  }


  physics(){
    this.vel = this.vel.mul(0.98)
    nodes.forEach(n=>{
      if (n == this) return;
      let sdist = this.pos.sub(n.pos).slen();
      this.vel = this.vel.add(this.pos.sub(n.pos).normalized().mul(1/sdist).mul(this.repforce))
    })
    const maxvel = 1
    if (this.vel.len() > maxvel) this.vel = this.vel.normalized().mul(maxvel)
    this.pos = this.pos.add(this.vel)
    
  }

  update(){
    if (this.removed) {
      nodes = nodes.filter(n=>n!=this)
      return;
    };
    assert (this.connections.map(e=>e!=null).reduce((a,b)=>a && b), `not all connections are connected`, this)
    this.port_pos = [this.pos]
    let princ = this.get_principal();
    if (princ != null) {
      let goal = princ.other({node:this, side:MAIN}).node.pos
      this.rotation = Math.atan2(goal.y - this.pos.y, goal.x - this.pos.x);
    }
  }

  display(){
    this.element.setAttribute('cx', (this.pos.x -cam_pos.x).toString());
    this.element.setAttribute('cy', (this.pos.y -cam_pos.y).toString());
  }

  get_principal(){return this.connections[0]}
  get_left(){return this.connections[1]}
  get_right(){return this.connections[2]}

  color(active:boolean){
    this.element.setAttribute('fill', active ? 'red': (this.type == OUT || this.type == DUP)? 'white':'black');
    for (let e of this.connections){
      if (e != null) e.color(active);
    }
  }
}

class Gate extends Terminal {
  connections: [Edge | null, Edge | null, Edge | null]
  constructor(type = DUP, pos:null|Vec2=null){
    super(type, pos);
    this.connections = [null, null, null];
  }

  create_element():SVGElement{
    let element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    element.setAttribute('stroke', 'var(--color)');
    return element;
  }

  update(){
    super.update();

    this.port_pos = [new Vec2(10, 0), new Vec2(-5, -5), new Vec2(-5, 5)]
    .map(p=>this.pos.add(p.T().mul(-Math.sin(this.rotation))).add(p.mul(Math.cos(this.rotation))))
  }

  display(){
    let points = [0, 1, 2].map(i => this.pos.add(new Vec2(10 * Math.cos(this.rotation + i * Math.PI/3*2), 10 * Math.sin(this.rotation + i * Math.PI/3*2)).sub(cam_pos))
    ).map(p => `${p.x}, ${p.y}`).join(' ');
    this.element.setAttribute('points', points);
    this.element.setAttribute('cx', this.pos.toString());
    this.element.setAttribute('cy', this.pos.toString());
  }

  edges(){
    return this.connections.filter(e=>e!=null)
  }

}

type Port = {node:Terminal, side:number}

class Edge extends El{
  start:Port
  end:Port
  constructor(start:Port, end:Port){

    assert (start.node.connections[start.side]==null, `start preconnected`, start.node)
    assert (end.node.connections[end.side]==null, `end preconnected`, end.node)
    assert (start.node != end.node || start.side != end.side, `start and end are the same`, start.node, end.node)

    super();
    this.start = start;
    this.end = end;
    edge_group.appendChild(this.element);
    edges.push(this);
    this.start.node.connections[this.start.side] = this;
    this.end.node.connections[this.end.side] = this;
    if (start.side==MAIN && end.side==MAIN && start.node.type != OUT && end.node.type != OUT)merge_stack.push(this);
  }

  create_element(): SVGElement {
    let res = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    res.setAttribute('fill', 'none');
    res.setAttribute('stroke', 'var(--color)');
    return res
  }

  other(p:Port){
    return this.start.node==p.node && this.start.side==p.side ? this.end : this.start;
  }

  update(){}
  
  display(){
    let start = this.start.node.port_pos[this.start.side];
    let end = this.end.node.port_pos[this.end.side];
    let start_dir = this.start.node.rotation + (this.start.side!=MAIN ? Math.PI : 0);
    let end_dir = this.end.node.rotation + (this.end.side!=MAIN ? Math.PI : 0);
    let smooth_weight = start.sub(end).len()/2+5;
    let start_ = start.add(Vec2.lookat(start_dir).mul(smooth_weight)).sub(cam_pos)
    let end_ = end.add(Vec2.lookat(end_dir).mul(smooth_weight)).sub(cam_pos)
    start = start.sub(cam_pos)
    end = end.sub(cam_pos)
    let d = `M ${start.x} ${start.y} C ${start_.x} ${start_.y} ${end_.x} ${end_.y} ${end.x} ${end.y}`;
    this.element.setAttribute('d', d);
  }

  grav = 0.04
  physics(){
    if (this.start.node == this.end.node) return;
    let force = this.start.node.pos.sub(this.end.node.pos).normalized()
    this.start.node.vel = this.start.node.vel.add(force.mul(-this.grav))
    this.end.node.vel = this.end.node.vel.add(force.mul(this.grav))
  }

  energy(){return this.start.node.pos.sub(this.end.node.pos).len() * this.grav }
  remove(){
    super.remove();
    this.start.node.connections[this.start.side] = null;
    this.end.node.connections[this.end.side] = null;
  }
}

function parse_code(code:string){
  displaysvg.innerHTML= ''
  mapall(n=>n.remove())
  let lines = code.replace(/\n/g, '').split('&').filter(l=>l.trim() != '');
  let main = lines[0];
  lines = lines.slice(1);
  let vartable = new Map();
  let t0 = build_tree(main.split('=')[1].trim(), vartable);
  new Edge(t0, {node:new Terminal(OUT), side:MAIN});
  for (let line of lines){
    let parts = line.split('~').map(l=>l.trim());
    let tree1 = build_tree(parts[0], vartable);
    let tree2 = build_tree(parts[1], vartable);
    new Edge(tree1, tree2);
  }
  nodes = nodes.filter(n=>!n.removed)
  edges = edges.filter(e=>!e.removed)
  layout()
}

function build_tree(term:string, vartable:Map<string, Terminal>){
  term = term.trim();
  if (!['(', '{', '['].includes(term[0])){

    if (vartable.has(term)){

      let nd = vartable.get(term)!;
      
      let res = nd.connections[0]!.other({node:nd, side:MAIN});
      nd.remove();
      nd.connections[MAIN]!.remove();
      return res;
    }else{
      let nd = new Terminal(VAR);
      vartable.set(term, nd);
      return {node:nd, side:MAIN};
    }
  }

  let nd = new Gate(term[0] == '(' ? DUP : SUP);
  term = term.slice(1, -1);
  let ctr = 0;
  let stack = '';
  for (let c of term){
    stack += c;
    if (['(', '{', '['].includes(c)) ctr+=1;
    if ([')', '}', ']'].includes(c)) ctr-=1;
    if ([')', '}', ']'].includes(c) || c == ' '){
      if (ctr == 0) break;
    }
  }
  let stackb = term.slice(stack.length);
  new Edge({node:nd, side:LEFT}, build_tree(stack, vartable));
  new Edge({node:nd, side:RIGHT}, build_tree(stackb, vartable));
  return {node:nd, side:MAIN};
}

let code = '@main = res\n\n  & {res a} ~ (v1 v2)\n\n  & (x a) ~ {v1 v2}'
if (localStorage['code'] != undefined){
  code = localStorage['code']
  codeblock.textContent = code
}

parse_code(code)

function mapall(fn:(x:Edge|Terminal)=>void){
  edges.forEach(fn);
  nodes.forEach(fn);
}

function update(){mapall(n=>n.update())}
function physics(){
  
  if (merge_stack.length > 0){

    let tomerge = merge_stack[0]
    assert(tomerge.removed == false, `tomerge is removed`)
    let a = tomerge.start.node
    let b = tomerge.end.node;
    edges.forEach(e=>{
      if (e!=tomerge) e.physics()
      else{
        let diff = a.pos.sub(b.pos)
        a.pos = a.pos.add(diff.normalized().mul(-0.5))
        b.pos = b.pos.add(diff.normalized().mul(0.5))
        if (diff.len() < 20){
          tomerge.remove()
          interact(a,b)
        }
      }
    })
    nodes.forEach((n)=>{if (n!=a && n!=b) n.physics()})
  }else mapall(e=>e.physics())
}

function merge_ports(a:Port, b:Port){
  let ea = a.node.connections[a.side]!
  let eb = b.node.connections[b.side]!
  
  ea.remove()
  eb.remove()
  
  if (ea == eb) return;
  new Edge(ea.other(a), eb.other(b))
}

function annihilate(a:Gate, b:Gate){

  let al = {node:a, side:LEFT}
  let ar = {node:a, side:RIGHT}
  let bl = {node:b, side:LEFT}
  let br = {node:b, side:RIGHT}
  merge_ports(al, bl)
  merge_ports(ar, br)

}

function replaceport(newport:Port, oldport:Port){
  let edge = oldport.node.connections[oldport.side]!
  edge.remove()
  new Edge(newport, edge.other(oldport))
}

function commute(a:Gate, b:Gate){

  let al = {node:a, side:LEFT}
  let ar = {node:a, side:RIGHT}
  let bl = {node:b, side:LEFT}
  let br = {node:b, side:RIGHT}
  
  let AL = new Gate(b.type, a.pos.add(new Vec2(20, 0)))
  let AR = new Gate(b.type, a.pos.add(new Vec2(0, 20)))
  let BL = new Gate(a.type, b.pos.add(new Vec2(20, 0)))
  let BR = new Gate(a.type, b.pos.add(new Vec2(0, 20)))

  new Edge({node:AL, side:LEFT}, {node:BL, side:LEFT})
  new Edge({node:AL, side:RIGHT}, {node:BR, side:LEFT})
  new Edge({node:AR, side:LEFT}, {node:BL, side:RIGHT})
  new Edge({node:AR, side:RIGHT}, {node:BR, side:RIGHT})

  replaceport({node:AL, side:MAIN}, al)
  replaceport({node:AR, side:MAIN}, ar)
  replaceport({node:BL, side:MAIN}, bl)
  replaceport({node:BR, side:MAIN}, br)
}

function erase(node:Gate, term:Terminal){
  replaceport({node:new Terminal(term.type, term.pos.add(new Vec2(1,1))), side:MAIN}, {node:node, side:LEFT})
  replaceport({node:new Terminal(term.type, term.pos.add(new Vec2(0,0))), side:MAIN}, {node:node, side:RIGHT})
}

function interact(a:Terminal, b:Terminal){
  let isgate = (n:Terminal)=> n instanceof Gate
  a.remove()
  b.remove()
  if (isgate(a) && isgate(b)){
    if (b.type != a.type) commute(a,b)
    else annihilate(a,b)
  }else if (!isgate(a) && !isgate(b)){
  }else{
    if (isgate(a)) [a, b] = [b, a]
    erase(b as Gate, a)
  }
}

function display(){
  mapall(n=>n.display());
  displaysvg.innerHTML = edge_group.outerHTML + node_group.outerHTML;
}

function energy(){
  return (nodes as (Terminal|Edge)[]).concat(edges).map(n=>n.energy()).reduce((a,b)=>a+b)
}

let show_code = false;

function layout(){
  function geten(node:Terminal){
    return node.energy() + node.connections.map(e=>e?.energy()??0).reduce((a,b)=>a+b)
  }
  function anneal(node:Terminal, d:number){
    let starte = geten(node)
    let startpos = node.pos

    for (let i = 0; i < 4; i++){
      node.pos = node.pos.add(Vec2.lookat(Math.random() * Math.PI * 2).mul(d*Math.random()))
      if (geten(node) > starte) node.pos = startpos
    }
  }
  for (let i = 0; i < 40; i++) nodes.forEach(node=>anneal(node,100))
  let avg_pos = nodes.map(n=>n.pos).reduce((a,b)=>a.add(b)).mul(1/nodes.length)
  cam_pos = avg_pos.sub(center)
}

setInterval(() => {
  nodes = nodes.filter(n=>!n.removed)
  edges = edges.filter(e=>!e.removed)
  merge_stack = merge_stack.filter(e=>!e.removed)
  if (!running || show_code) return;
  physics();
  update();
  display();
}, 1000/30);


let last_target:Terminal|undefined = undefined;
let drag_target:Terminal|undefined = undefined;
let drag_start:Vec2|undefined = undefined;

displaysvg.addEventListener('mousedown', e=>{
  if (last_target != null) last_target.color(false);

  if (e.target != displaysvg){
    let tid = (e.target as SVGElement).id;
    last_target = nodes.find(n=>n.id == tid) as Terminal;
    if (last_target != null) last_target.color(true);
    drag_target = last_target;
  }else{
    drag_start = new Vec2(e.offsetX, e.offsetY).add(cam_pos);
  }
  display()
})

displaysvg.addEventListener('mousemove', e=>{
  if (drag_target != undefined){
    drag_target.pos = new Vec2(e.offsetX, e.offsetY).add(cam_pos);
    drag_target.vel = v0;
    update();
  }else if (drag_start != undefined)cam_pos = new Vec2(-e.offsetX, -e.offsetY).add(drag_start);
  display();
})

document.addEventListener('mouseup', e=>{
  drag_start = undefined;
  drag_target = undefined;
})

function toggle_code(){
  show_code = !show_code;
  if (show_code){
    displaysvg.style.display = 'none';
    codeblock.style.display = 'block';
  }else{
    displaysvg.style.display = 'block';
    codeblock.style.display = 'none';
    let code = codeblock.textContent
    localStorage['code'] = code
    parse_code(code!)
  }
}

document.addEventListener('keydown', e=>{
  if (e.code == 'Space'){
    running = !running;
  }
  if (e.code == 'Enter' && e.metaKey){
    toggle_code();
  }
})