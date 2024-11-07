"use strict";
const [MAIN, LEFT, RIGHT] = [0, 1, 2];
const [OUT, VAR, APP, DUP, ERA, LAM, SUP, NUL] = [0, 1, 2, 3, 4, 5, 6, 7];
const displaysvg = document.querySelector('svg#mySvg');
displaysvg.setAttribute('width', document.documentElement.clientWidth.toString());
displaysvg.setAttribute('height', document.documentElement.clientHeight.toString());
const codeeditor = document.querySelector('#codeblock');
const codecontent = codeeditor.querySelector('#codecontent');
const errormsg = document.querySelector('#errormsg');
let merge_stack = [];
let running = true;
function assert(val, msg, ...els) {
    if (!val) {
        els.forEach(el => el.color(true));
        display();
        running = false;
        throw new Error(msg);
    }
}
const edge_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const node_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
let nodes = [];
let edges = [];
class Vec2 {
    constructor(x, y) {
        assert(typeof x == 'number' && !isNaN(x), `x is not a number`);
        assert(typeof y == 'number' && !isNaN(y), `y is not a number`);
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    slen() { return this.x ** 2 + this.y ** 2; }
    len() { return Math.sqrt(this.slen()); }
    T() { return new Vec2(this.y, -this.x); }
    static lookat(angle) { return new Vec2(Math.cos(angle), Math.sin(angle)); }
    normalized() { return this.mul(1 / this.len()); }
}
const v0 = new Vec2(0, 0);
const center = new Vec2(displaysvg.clientWidth / 2, displaysvg.clientHeight / 2);
let cam_pos = new Vec2(0, 0);
class El {
    constructor() {
        this.removed = false;
        this.id = Math.random().toString().slice(2);
        this.element = this.create_element();
        this.element.setAttribute('id', this.id);
    }
    create_element() { return document.createElementNS('http://www.w3.org/2000/svg', 'g'); }
    remove() {
        this.element.remove();
        this.removed = true;
        nodes = nodes.filter(n => !n.removed);
        edges = edges.filter(e => !e.removed);
        merge_stack = merge_stack.filter(e => !e.removed);
    }
    color(active) {
        this.element.setAttribute('stroke', active ? 'red' : 'var(--color)');
    }
}
class Terminal extends El {
    constructor(type = OUT, pos = null) {
        super();
        this.pos = v0;
        this.vel = v0;
        this.connections = [null];
        this.port_pos = [v0];
        this.rotation = 0;
        this.repforce = 100.;
        this.grav = 0.01;
        this.type = type;
        this.pos = pos == null ? new Vec2(Math.random() * displaysvg.clientWidth, Math.random() * displaysvg.clientHeight) : pos;
        node_group.appendChild(this.element);
        nodes.push(this);
        this.color(false);
    }
    create_element() {
        let element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('r', '5');
        element.setAttribute('stroke', 'var(--color)');
        return element;
    }
    energy() {
        return nodes.map(n => n == this ? 0 : this.repforce / this.pos.sub(n.pos).len()).reduce((a, b) => a + b) + this.pos.len() * this.grav;
    }
    physics() {
        this.vel = this.vel.mul(0.97);
        nodes.forEach(n => {
            if (n == this)
                return;
            let sdist = this.pos.sub(n.pos).slen();
            this.vel = this.vel.add(this.pos.sub(n.pos).normalized().mul(1 / sdist).mul(this.repforce));
        });
        const maxvel = .7;
        if (this.vel.len() > maxvel)
            this.vel = this.vel.normalized().mul(maxvel);
        this.pos = this.pos.add(this.vel);
    }
    update() {
        if (this.removed) {
            nodes = nodes.filter(n => n != this);
            return;
        }
        ;
        assert(this.connections.map(e => e != null).reduce((a, b) => a && b), `not all connections are connected`, this);
        this.port_pos = [this.pos];
        let princ = this.get_principal();
        if (princ != null) {
            let goal = princ.other({ node: this, side: MAIN }).node.pos;
            this.rotation = Math.atan2(goal.y - this.pos.y, goal.x - this.pos.x);
        }
    }
    display() {
        this.element.setAttribute('cx', (this.pos.x - cam_pos.x).toString());
        this.element.setAttribute('cy', (this.pos.y - cam_pos.y).toString());
    }
    get_principal() { return this.connections[0]; }
    get_left() { return this.connections[1]; }
    get_right() { return this.connections[2]; }
    color(active) {
        this.element.setAttribute('fill', active ? 'red' : (this.type == OUT || this.type == DUP) ? 'white' : 'black');
        for (let e of this.connections) {
            if (e != null)
                e.color(active);
        }
    }
}
class Gate extends Terminal {
    constructor(type = DUP, pos = null) {
        super(type, pos);
        this.connections = [null, null, null];
    }
    create_element() {
        let element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        element.setAttribute('stroke', 'var(--color)');
        return element;
    }
    update() {
        super.update();
        this.port_pos = [new Vec2(10, 0), new Vec2(-5, -5), new Vec2(-5, 5)]
            .map(p => this.pos.add(p.T().mul(-Math.sin(this.rotation))).add(p.mul(Math.cos(this.rotation))));
    }
    display() {
        let points = [0, 1, 2].map(i => this.pos.add(new Vec2(10 * Math.cos(this.rotation + i * Math.PI / 3 * 2), 10 * Math.sin(this.rotation + i * Math.PI / 3 * 2)).sub(cam_pos))).map(p => `${p.x}, ${p.y}`).join(' ');
        this.element.setAttribute('points', points);
    }
}
class Edge extends El {
    constructor(start, end) {
        assert(start.node.connections[start.side] == null, `start preconnected`, start.node);
        assert(end.node.connections[end.side] == null, `end preconnected`, end.node);
        assert(start.node != end.node || start.side != end.side, `start and end are the same`, start.node, end.node);
        super();
        this.grav = 0.04;
        this.start = start;
        this.end = end;
        edge_group.appendChild(this.element);
        edges.push(this);
        this.start.node.connections[this.start.side] = this;
        this.end.node.connections[this.end.side] = this;
        if (start.side == MAIN && end.side == MAIN && start.node.type != OUT && end.node.type != OUT)
            merge_stack.push(this);
    }
    create_element() {
        let res = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        res.setAttribute('fill', 'none');
        res.setAttribute('stroke', 'var(--color)');
        return res;
    }
    other(p) {
        return this.start.node == p.node && this.start.side == p.side ? this.end : this.start;
    }
    update() { }
    color(active) {
        super.color(active);
        let idx = merge_stack.indexOf(this);
        if (idx == -1)
            return;
        merge_stack[idx] = merge_stack[0];
        merge_stack[0] = this;
    }
    display() {
        let start = this.start.node.port_pos[this.start.side];
        let end = this.end.node.port_pos[this.end.side];
        let start_dir = this.start.node.rotation + (this.start.side != MAIN ? Math.PI : 0);
        let end_dir = this.end.node.rotation + (this.end.side != MAIN ? Math.PI : 0);
        let smooth_weight = start.sub(end).len() / 2 + 5;
        let start_ = start.add(Vec2.lookat(start_dir).mul(smooth_weight)).sub(cam_pos);
        let end_ = end.add(Vec2.lookat(end_dir).mul(smooth_weight)).sub(cam_pos);
        start = start.sub(cam_pos);
        end = end.sub(cam_pos);
        let d = `M ${start.x} ${start.y} C ${start_.x} ${start_.y} ${end_.x} ${end_.y} ${end.x} ${end.y}`;
        this.element.setAttribute('d', d);
    }
    physics() {
        if (this.start.node == this.end.node)
            return;
        let force = this.start.node.pos.sub(this.end.node.pos).normalized();
        this.start.node.vel = this.start.node.vel.add(force.mul(-this.grav));
        this.end.node.vel = this.end.node.vel.add(force.mul(this.grav));
    }
    energy() { return this.start.node.pos.sub(this.end.node.pos).len() * this.grav; }
    remove() {
        super.remove();
        this.start.node.connections[this.start.side] = null;
        this.end.node.connections[this.end.side] = null;
    }
}
function parse_code(code) {
    displaysvg.innerHTML = '';
    mapall(n => n.remove());
    let lines = code.replace(/\n/g, '').split('&').filter(l => l.trim() != '');
    let main = lines[0];
    lines = lines.slice(1);
    let vartable = new Map();
    let t0 = build_tree(main.split('=')[1].trim(), vartable);
    new Edge(t0, { node: new Terminal(OUT), side: MAIN });
    lines.forEach((line, i) => {
        try {
            let parts = line.split('~').map(l => build_tree(l, vartable));
            new Edge(parts[0], parts[1]);
        }
        catch (error) {
            errormsg.textContent = `error in line: ${line}`;
            throw error;
        }
    });
    layout();
}
function build_tree(term, vartable) {
    term = term.trim();
    if (!['(', '{', '['].includes(term[0])) {
        if (vartable.has(term)) {
            let nd = vartable.get(term);
            let res = nd.connections[0].other({ node: nd, side: MAIN });
            nd.remove();
            nd.connections[MAIN].remove();
            return res;
        }
        else {
            let nd = new Terminal(VAR);
            vartable.set(term, nd);
            return { node: nd, side: MAIN };
        }
    }
    let nd = new Gate(term[0] == '(' ? DUP : SUP);
    term = term.slice(1, -1);
    let ctr = 0;
    let stack = '';
    for (let c of term) {
        stack += c;
        if (['(', '{', '['].includes(c))
            ctr += 1;
        if ([')', '}', ']'].includes(c))
            ctr -= 1;
        if (([')', '}', ']'].includes(c) || c == ' ') && ctr == 0)
            break;
    }
    let stackb = term.slice(stack.length);
    new Edge({ node: nd, side: LEFT }, build_tree(stack, vartable));
    new Edge({ node: nd, side: RIGHT }, build_tree(stackb, vartable));
    return { node: nd, side: MAIN };
}
let code = '@main = res\n  & {res a} ~ (b c)';
if (window.location.search) {
    code = decodeURIComponent(window.location.search.slice(1));
    code = code.replace(/&/g, '\n  &');
}
else if (localStorage['code'] != undefined) {
    code = localStorage['code'];
}
codecontent.textContent = code;
parse_code(code);
function mapall(fn) {
    edges.forEach(fn);
    nodes.forEach(fn);
}
function update() { mapall(n => n.update()); }
function physics() {
    if (merge_stack.length > 0) {
        let tomerge = merge_stack[0];
        assert(tomerge.removed == false, `tomerge is removed`);
        let a = tomerge.start.node;
        let b = tomerge.end.node;
        edges.forEach(e => {
            if (e != tomerge)
                e.physics();
            else {
                let diff = a.pos.sub(b.pos);
                a.pos = a.pos.add(diff.normalized().mul(-0.7));
                b.pos = b.pos.add(diff.normalized().mul(0.7));
                if (diff.len() < 20) {
                    tomerge.remove();
                    interact(a, b);
                }
            }
        });
        nodes.forEach((n) => { if (n != a && n != b)
            n.physics(); });
    }
    else
        mapall(e => e.physics());
}
function merge_ports(a, b) {
    let [ea, eb] = [a, b].map(n => {
        let e = n.node.connections[n.side];
        if (e)
            e.remove();
        return e;
    });
    if (ea && eb && ea != eb)
        new Edge(ea.other(a), eb.other(b));
}
function annihilate(a, b) {
    [LEFT, RIGHT].map(i => merge_ports({ node: a, side: i }, { node: b, side: i }));
}
function replaceport(newport, oldport) {
    let edge = oldport.node.connections[oldport.side];
    edge.remove();
    new Edge(newport, edge.other(oldport));
}
function commute(a, b) {
    let newgates = [0, 0, 1, 1].map((h) => new Gate([b, a][h].type, [a, b][h].pos));
    ([0, 0, 1, 1]).map((h, i) => {
        let m = i % 2;
        new Edge({ node: newgates[h], side: [LEFT, RIGHT][m] }, { node: newgates[2 + m], side: [LEFT, RIGHT][h] });
        replaceport({ node: newgates[i], side: MAIN }, { node: h ? b : a, side: m == 0 ? LEFT : RIGHT });
        return newgates[i];
    }).map(anneal);
}
function erase(node, term) {
    [LEFT, RIGHT].map(side => {
        let newnode = new Terminal(term.type, term.pos);
        replaceport({ node: newnode, side: MAIN }, { node, side });
        return newnode;
    }).map(anneal);
}
function interact(a, b) {
    let isgate = (n) => n instanceof Gate;
    a.remove();
    b.remove();
    if (isgate(a) && isgate(b)) {
        if (b.type != a.type)
            commute(a, b);
        else
            annihilate(a, b);
    }
    else if (!isgate(a) && !isgate(b)) {
    }
    else {
        if (isgate(a))
            [a, b] = [b, a];
        erase(b, a);
    }
}
function display() {
    mapall(n => n.display());
    displaysvg.innerHTML = edge_group.outerHTML + node_group.outerHTML;
}
function energy() {
    return nodes.concat(edges).map(n => n.energy()).reduce((a, b) => a + b);
}
let show_code = false;
function anneal(node, d = 100) {
    function geten(node) {
        return node.energy() + node.connections.map(e => { var _a; return (_a = e === null || e === void 0 ? void 0 : e.energy()) !== null && _a !== void 0 ? _a : 0; }).reduce((a, b) => a + b);
    }
    let starte = geten(node);
    let startpos = node.pos;
    for (let i = 0; i < 4; i++) {
        node.pos = node.pos.add(Vec2.lookat(Math.random() * Math.PI * 2).mul(d * Math.random()));
        if (geten(node) > starte)
            node.pos = startpos;
    }
}
function layout() {
    for (let i = 0; i < 40; i++)
        nodes.forEach(node => anneal(node));
    let avg_pos = nodes.map(n => n.pos).reduce((a, b) => a.add(b)).mul(1 / nodes.length);
    cam_pos = avg_pos.sub(center);
}
setInterval(() => {
    nodes = nodes.filter(n => !n.removed);
    edges = edges.filter(e => !e.removed);
    merge_stack = merge_stack.filter(e => !e.removed);
    if (!running || show_code)
        return;
    physics();
    update();
    display();
}, 1000 / 30);
let last_target = undefined;
let drag_target = undefined;
let drag_start = undefined;
displaysvg.addEventListener('mousedown', e => {
    if (last_target != null)
        last_target.color(false);
    if (e.target != displaysvg) {
        let tid = e.target.id;
        last_target = nodes.find(n => n.id == tid);
        if (last_target)
            last_target.color(true);
        drag_target = last_target;
    }
    else
        drag_start = new Vec2(e.offsetX, e.offsetY).add(cam_pos);
    display();
});
displaysvg.addEventListener('mousemove', e => {
    if (drag_target != undefined) {
        drag_target.pos = new Vec2(e.offsetX, e.offsetY).add(cam_pos);
        drag_target.vel = v0;
        update();
    }
    else if (drag_start != undefined)
        cam_pos = new Vec2(-e.offsetX, -e.offsetY).add(drag_start);
    display();
});
document.addEventListener('mouseup', () => drag_start = drag_target = undefined);
function toggle_code() {
    if (!show_code) {
        displaysvg.style.display = 'none';
        codeeditor.style.display = 'flex';
    }
    else {
        let code = codecontent.textContent;
        try {
            parse_code(code);
        }
        catch (error) {
            console.error(error);
            return;
        }
        localStorage['code'] = code;
        codeeditor.style.display = 'none';
        displaysvg.style.display = 'block';
    }
    show_code = !show_code;
}
const files = document.querySelector('#files');
[
    '@main=res&{res a}~(b c)',
    '@main=res&{res a}~(b c)&{a b}~(c d)',
    '@main=res&{res a}~(b c)&{a b}~(c d)&d~(e f)',
].map((example, i) => {
    const url = document.createElement('a');
    url.textContent = `example ${i + 1}`;
    url.href = `?${encodeURIComponent(example)}`;
    files.appendChild(url);
});
document.addEventListener('keydown', e => {
    if (e.code == 'Space') {
        if (!show_code) {
            e.preventDefault();
            running = !running;
        }
    }
    if (e.code == 'Enter' && e.metaKey)
        toggle_code();
});
//# sourceMappingURL=index.js.map