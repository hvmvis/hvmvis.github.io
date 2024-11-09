class HVMParser {
  constructor(input) {
    this.tokens = this.tokenize(input);
    console.log(this.tokens);
    
    this.current = 0;
  }

  tokenize(input) {
    const regex = /(\*\b|@\w+|\d+|\(|\)|\{|\}|\$|\?|\~|\&|\S+)/g;
    return input.match(regex) || [];
  }

  nextToken() {
    return this.tokens[this.current++] || null;
  }

  peekToken() {
    return this.tokens[this.current] || null;
  }

  parseNet() {
    const rootTree = this.parseTree();
    const redexes = [];

    while (this.peekToken() === "&") {
      this.nextToken();  // Consume '&'
      redexes.push(this.parseRedex());
    }

    return { type: "Net", root: rootTree, redexes };
  }

  parseRedex() {
    const leftTree = this.parseTree();
    this.nextToken(); // Consume '~'
    const rightTree = this.parseTree();
    return { type: "Redex", left: leftTree, right: rightTree };
  }

  parseTree() {
    const token = this.peekToken();
    if (/[a-zA-Z0-9_.-]+/.test(token)) return this.parseVar();
    return this.parseNode();
  }

  parseVar() {
    const name = this.nextToken();
    return { type: "VAR", name };
  }

  parseNode() {
    const token = this.nextToken();
    
    if (token === "*") return { type: "ERA" };
    if (token.startsWith("@")) return { type: "REF", value: token.slice(1) };
    if (/^\d+$/.test(token)) return { type: "NUM", value: Number(token) };

    const leftTree = this.parseTree();
    const rightTree = this.parseTree();
    
    if (token === "(") return { type: "CON", left: leftTree, right: rightTree };
    if (token === "{") return { type: "DUP", left: leftTree, right: rightTree };
    if (token === "$") return { type: "OPE", left: leftTree, right: rightTree };
    if (token === "?") return { type: "SWI", left: leftTree, right: rightTree };

    throw new SyntaxError("Unexpected token: " + token);
  }
}

const hvmCode = "@ref~123 & $(? (a) (b)) ~ (c) (d)";
console.log(hvmCode);

const parser = new HVMParser(hvmCode);
const parsedObject = parser.parseNet();
console.log(JSON.stringify(parsedObject, null, 2));