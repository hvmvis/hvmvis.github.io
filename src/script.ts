const [MAIN, LEFT, RIGHT] = [0,1,2]
const displaysvg = document.querySelector('svg#mySvg') as SVGElement;
displaysvg.setAttribute('width', document.documentElement.clientWidth.toString())
displaysvg.setAttribute('height', document.documentElement.clientHeight.toString())
const codeeditor = document.querySelector('#codeblock') as HTMLElement;
const codecontent = codeeditor.querySelector('#codecontent') as HTMLTextAreaElement;
const errormsg = document.querySelector('#errormsg') as HTMLElement;

let merge_stack:Edge[] = []
let running = true;
 
function assert (val:boolean, msg:any, ...els:El[]){
  if (!val) {
    els.forEach(el=>el.color(true))
    try{
      display()
    }catch(error){
      console.error(error)
    }
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
}

const v0 = new Vec2(0, 0)
const center = new Vec2(displaysvg.clientWidth/2, displaysvg.clientHeight/2)
let cam_pos = new Vec2(0, 0)

export class El{
  removed = false;
  id: string 
  element: SVGElement
  constructor(){
    this.id = Math.random().toString().slice(2);
    this.element = this.create_element();
    this.element.setAttribute('id', this.id);
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



export class Terminal extends El{
  pos = v0
  vel = v0
  connections: (Edge | null)[] = [null];
  port_pos: Vec2[] = [v0]
  rotation: number = 0;
  dot:SVGElement
  tag:string = ''
  constructor(pos:Vec2|null=null){
    super();
    this.dot = this.create_dot()
    this.element.appendChild(this.dot)
    this.pos = pos == null ? new Vec2((Math.random()-0.5) * displaysvg.clientWidth, (Math.random()-0.5) * displaysvg.clientHeight): pos
    node_group.appendChild(this.element);
    nodes.push(this);
    this.color(false);
  }

  set_text(tag:string){
    this.tag= tag
    let text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', '10')
    text.setAttribute('y', '5')
    text.textContent = tag
    text.setAttribute('fill', 'var(--color)')
    this.element.appendChild(text)
  }

  create_dot():SVGElement{
    let dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('r', '5')
    dot.setAttribute('stroke', 'var(--color)')
    dot.id = this.id
    return dot
  }

  create_element():SVGElement{
    return document.createElementNS('http://www.w3.org/2000/svg', 'g')
  }
  
  repforce = 100.

  grav = 0.01
  energy(){
    return nodes.map(n=>n==this?0: this.repforce/this.pos.sub(n.pos).len()
    ).reduce((a,b)=>a+b) + this.pos.len() * this.grav
  }

  physics(){
    this.vel = this.vel.mul(0.97).add(this.pos.normalized().mul(-this.grav))
    nodes.forEach(n=>{
      if (n == this) return;
      let sdist = this.pos.sub(n.pos).slen();
      this.vel = this.vel.add(this.pos.sub(n.pos).normalized().mul(1/sdist).mul(this.repforce))
    })
    const maxvel = .7
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
    this.element?.setAttribute('transform', `translate(${this.pos.x - cam_pos.x}, ${this.pos.y - cam_pos.y}) `)
  }

  get_principal(){return this.connections[0]}
  get_left(){return this.connections[1]}
  get_right(){return this.connections[2]}

  color(active:boolean){
    this.element.setAttribute('fill', active ? 'red' : 'black');
    for (let e of this.connections){
      if (e != null) e.color(active);
    }
  }
}

export class Gate extends Terminal {
  connections: [Edge | null, Edge | null, Edge | null]
  constructor(pos:null|Vec2=null){
    super(pos);
    this.connections = [null, null, null];
  }

  create_dot(){
    let dot = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    dot.setAttribute('stroke', 'var(--color)');
    dot.id = this.id;
    return dot
  }

  create_element():SVGElement{
    let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    return group;
  }

  update(){
    super.update();
    this.port_pos = [new Vec2(10, 0), new Vec2(-5, -5), new Vec2(-5, 5)]
    .map(p=>this.pos.add(p.T().mul(-Math.sin(this.rotation))).add(p.mul(Math.cos(this.rotation))))
  }

  display(){
    super.display();
    let points = [0, 1, 2].map(i => new Vec2(10 * Math.cos(this.rotation + i * Math.PI/3*2), 10 * Math.sin(this.rotation + i * Math.PI/3*2)))
    .map(p => `${p.x}, ${p.y}`).join(' ');
    this.dot.setAttribute('points', points);
  }
}

type OP = "ADD" | "SUB" | "MUL" | "DIV"

class Erase extends Terminal{}

class Ref extends Terminal{}

class Out extends Terminal{
  color(active:boolean){
    super.color(active)
    this.dot.setAttribute('fill', active?'red':'white')
  }
}

class Num extends Terminal{
  operator : OP | null = null
  value : number
  constructor(value:number, operator:OP|null= null){
    super()
    this.value = value
    this.operator = operator
    this.set_text(`${operator ?? ''} ${value}`)
  }
}

class Duplicator extends Gate{
  color(active: boolean){
    super.color(active)
    this.dot.setAttribute('fill', active?'red':'white')
  }
}

class Switch extends Gate{
  constructor(){
    super()
    this.set_text('?')
  }
}

class Operator extends Gate{
  constructor(){
    super()
    this.set_text('$')
  }
}

type Port = {node:Terminal, side:number}

export class Edge extends El{
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
    if (this.start.side == MAIN && this.end.side == MAIN && !(this.start.node instanceof Out) && !(this.end.node instanceof Out)) merge_stack.push(this)
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

  color(active:boolean){
    super.color(active);
    let idx = merge_stack.indexOf(this);
    if (idx == -1) return;
    merge_stack[idx] = merge_stack[0]
    merge_stack[0] = this;
  }
  
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

const fn_definitons: Map<string, Terminal> = new Map();


function parse_code(code:string){

  console.log(code);
  

  mapall(n=>n.remove())
  fn_definitons.clear();
  let toks:string[] = code.match(/[@,a-z,0-9]+|\$\(|\?\(|\(|\)|\{|\}|\[|\]|=|&|\*|~/g) || [];  
  function get_token(){
    return toks.shift()
  }
  function peek_token() {return toks[0]}

  const vartable:Map<string, Terminal> = new Map();
  parse_book()

  function parse_book(){
    while (toks.length > 0){
      parse_net()
    }
  }

  function parse_net(){
    console.log('parse_net');
    
    vartable.clear()
    const fn_name = get_token()!
    assert(fn_name.startsWith('@'), `no @`)
    assert(get_token() == '=', `no =`)
    let head = new Out()
    head.set_text(fn_name.slice(1))
    fn_definitons.set(fn_name.slice(1), head)
    let a = parse_tree()
    new Edge({node:head, side:MAIN}, a)
    while (peek_token() == '&'){
      get_token()
      parse_redex()
    }
  }

  function parse_redex(){
    let a = parse_tree()
    assert (get_token() == '~', `no ~`)
    let b = parse_tree()
    new Edge(a, b)
  }
  
  function parse_tree():Port{
    let tok = peek_token();

    let brackets:Record<string,typeof Gate> = {
      "(": Gate,
      "{": Duplicator,
      "$(": Operator,
      "?(": Switch
    }

    if (!brackets[tok]) return parse_atom()
    get_token()
    let node = new brackets[tok]()
    let a = parse_tree()
    new Edge({node, side:LEFT}, a)
    let b = parse_tree()
    new Edge({node, side:RIGHT}, b)
    let end = get_token()
    assert(end == ")" || end == "}", `invalid end token ${end}`)
    return {node, side:MAIN}
  }

  function parse_atom(){
    let token = get_token()!
    let t:typeof Terminal = Erase
    let tag = ''
    if (token == '*'){t = Erase
    }else if (token.startsWith('@')) {
      t = Ref
      tag = token.slice(1)
    } else {
      if (vartable.has(token)){
        let nd = vartable.get(token)!
        nd.remove()
        let res = nd.connections[MAIN]!.other({node:nd, side:MAIN})
        nd.connections[MAIN]!.remove()
        return res
      }
      let nd = new Terminal()
      vartable.set(token, nd)
      return {node:nd, side:MAIN}
    }
    let node = new t()

    node.set_text(tag)
    return {node:node, side:MAIN}
  }
  layout()

}

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
        a.pos = a.pos.add(diff.normalized().mul(-0.7))
        b.pos = b.pos.add(diff.normalized().mul(0.7))
        if (diff.len() < 20){
          tomerge.remove()
          interact(a,b)
        }
      }
    })
    nodes.forEach((n)=>{if (n!=a && n!=b) n.physics()})
  }else mapall(e=>e.physics())
}

function copy_graph(graph:Terminal, map:Map<Terminal, Terminal>):Terminal{

  if (map.has(graph)) return map.get(graph)!;
  let new_node = new (graph.constructor as typeof Terminal)();
  new_node.set_text(graph.tag)
  map.set(graph, new_node);

  graph.connections.map(e=>{
    let [start,end] = [e!.start, e!.end].map(p=>({node:copy_graph(p.node, map), side:p.side}))
    if (start.node.connections[start.side] == null) new Edge(start,end)
  })
  return new_node
}

function merge_ports(a:Port, b:Port){
  let [ea,eb] = [a,b].map(n=>{
    let e = n.node.connections[n.side]!
    if (e) e.remove()
    return e
  })
  if (ea && eb && ea != eb) new Edge(ea.other(a), eb.other(b))
}

function annihilate(a:Gate, b:Gate){
  console.log('annihilate', a, b);
  
  [LEFT,RIGHT].map(i=>merge_ports({node:a, side:i}, {node:b, side:i}))
}

function replaceport(newport:Port, oldport:Port){
  let edge = oldport.node.connections[oldport.side]!
  edge.remove()
  new Edge(newport, edge.other(oldport))
}

function commute(a:Gate, b:Gate){
  let newgates:Gate[] = [0,0,1,1].map((h)=>new ((h==0?b:a).constructor as typeof Gate)((h==0?a:b).pos));  
  ([0,0,1,1]).map((h,i)=>{
    let m = i%2
    new Edge({node:newgates[h], side:[LEFT, RIGHT][m]}, {node:newgates[2+m], side:[LEFT, RIGHT][h]})
    replaceport({node:newgates[i], side:MAIN}, {node:h?b:a, side:m==0?LEFT:RIGHT})
  })
  newgates.map(anneal)
}

function erase(node:Gate, term:Terminal){
  [LEFT,RIGHT].map(side=>{
    let newnode = new (term.constructor as typeof Terminal)(term.pos)
    replaceport({node:newnode, side:MAIN}, {node, side})
    return newnode
  }).map(anneal)
}

function call(fn_name:string, gate:Terminal){

  let fn = fn_definitons.get(fn_name)
  let mp = new Map()

  let head = copy_graph(fn!, mp)
  replaceport({node:gate, side:MAIN}, {node:head, side:MAIN})
  head.remove()
  
  for (let n of mp.values()){
    n.pos = n.pos.add(gate.pos).sub(fn!.pos)
  }
  for (let i=0; i<20; i++){
    for (let n of mp.values()){
      anneal(n)
    }
  }
}

function interact(a:Terminal, b:Terminal){
  
  if (a instanceof Gate) [a,b] = [b,a]
  a.remove()
  if (a instanceof Ref) return call(a.tag, b)
  b.remove()
  let [consa, consb] = [a,b].map(n=>n.constructor.name)
  if (a instanceof Gate && b instanceof Gate){
    if (consa != consb) commute(a,b)
    else annihilate(a,b)
  }else if (a instanceof Erase){
    if (b instanceof Gate) erase(b, a)
    else{}// void
  }else if (a instanceof Ref){
    call(a.tag, b)
  }else{
    throw new Error('invalid interaction')
  }

}

function display(){
  assert(!edges.map(e=>e.removed).reduce((a,b)=>a||b), `edges are removed`)
  assert(!nodes.map(n=>n.removed).reduce((a,b)=>a||b), `nodes are removed`)
  
  mapall(n=>n.display());
  displaysvg.innerHTML = edges.map(e=>e.element.outerHTML).join('') + nodes.map(n=>n.element.outerHTML).join('')
}

let show_code = false;

function anneal(node:Terminal, d:number = 100){
  function geten(node:Terminal){
    return node.energy() + node.connections.map(e=>e?.energy()??0).reduce((a,b)=>a+b)
  }
  let starte = geten(node)
  let startpos = node.pos

  for (let i = 0; i < 4; i++){
    node.pos = node.pos.add(Vec2.lookat(Math.random() * Math.PI * 2).mul(d*Math.random()))
    if (geten(node) > starte) node.pos = startpos
  }
}
function layout(){
  for (let i = 0; i < 40; i++) nodes.forEach(node=>anneal(node))
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
    if (last_target) last_target.color(true);
    drag_target = last_target;
    console.log(last_target);
    
  }else drag_start = new Vec2(e.offsetX, e.offsetY).add(cam_pos);
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

document.addEventListener('mouseup', ()=> drag_start = drag_target = undefined)

{
  let code = '@main = res\n  & {res a} ~ (b c)'
  if (localStorage['code'] != undefined) code = localStorage['code']
  if (window.location.search){
    code = window.location.search.slice(1).replace(/,/g, ' ')
    window.history.pushState({}, document.title, window.location.pathname);
  }
  set_code(code)
}

function set_code(code:string){
  code = decodeURIComponent(code)
  code = ("\n"+code).replace(/ +/g, ' ')
  code = code.replace(/\n ?@/g, '@@').replace(/\s+/g, ' ')
  code = code.replace(/@@/g, '\n\n@').replace(/&/g, '\n  &')
  codecontent.value = code
  parse_code(code)
  localStorage['code'] = code
}

function toggle_code(){
  if (!show_code){
    displaysvg.style.display = 'none';
    codeeditor.style.display = 'flex';
    codecontent.focus();
  }else{
    let code = codecontent.value!     
    set_code(code)
    codeeditor.style.display = 'none';
    displaysvg.style.display = 'block';
  }
  show_code = !show_code;
}
import example_nets from './example_nets'
{
  const files = document.querySelector('#files') as HTMLElement;
  let p = document.createElement('p');
  files.appendChild(p);

  p.textContent = 'Examples:';
  example_nets.map(([name,code])=>{
    const url = document.createElement('a');
    url.textContent = `${name}`;
    url.href = `?${encodeURIComponent(code)}`;
    files.appendChild(url);
  })
  files.appendChild(document.createElement('br'))
  let a = document.createElement('a');
  a.textContent = 'readme';
  a.href = '/readme';
  files.appendChild(a);
}

document.addEventListener('keydown', e=>{
  if (e.code == 'Space'){
    if (!show_code){
      e.preventDefault();
      running = !running;
    }
  }
  if (e.code == 'Enter' && e.metaKey) toggle_code();
})