const ohm = require("ohm-js");
const fs = require("fs");

var TypeDict = {
  int: "OpTypeInt 32 1",
  uint: "OpTypeInt 32 0",
  float: "OpTypeFloat 32",
  void: "OpTypeVoid",
};

var DecoratorDict = {
  var: "Private",
  in: "Input",
  out: "Output",
  uniform: "Uniform",
};

function State() {
  this.counter = 0;
  this.ctable = {};
  this.ttable = {};
  this.vtable = {};
  this.ftable = {};
  this.getConst = (cvalue) => {
    let cname = "%c_" + cvalue.replace(".", "_");
    let tp = cvalue.search(/[e.]/i) === -1 ? "int" : "float";
    this.ctable[cname] = `${cname} = OpConstant ${this.getType(tp)} ${cvalue}`;
    return cname;
  };
  this.getType = (tp) => {
    let tname = "%t_" + tp;
    if (TypeDict[tp] !== undefined)
      this.ctable[tname] = `${tname} = ${TypeDict[tp]}`;
    return tname;
  };
  this.getNext = () => {
    this.counter += 1;
    return `%${this.counter}`;
  };
  this.getVar = (v) => {
    let vname = undefined;
    for (let tb = this.vtable; tb && !vname; tb = tb.__father__) vname = tb[v];
    if (!vname) throw `variable ${v} not found`;
    return vname;
  };
  this.setVar = (v, dc) => {
    let cur = this.getNext();
    this.vtable[v] = {
      id: cur,
      decorator: dc,
    };
    return cur;
  };
  this.pushScope = () => {
    this.vtable = { __father__: this.vtable };
  };
  this.popScope = () => {
    this.vtable = this.vtable.__father__;
  };
}
var st;

let actions = {
  Program(scripts) {
    st = new State();
    let code = ["OpCapability Shader", "OpMemoryModel Logical GLSL450"];
    let body = [];
    for (let x of scripts.children) body.push(...x.parse());
    let pre = [];
    let main = st.ftable.main;
    if (main === undefined) throw "cannot find main function";
    pre.push(
      `OpEntryPoint Vertex ${main.f_id} "main" ${Object.values(st.vtable)
        .filter((x) => x.decorator === "in" || x.decorator === "out")
        .map((x) => x.id)}`
    );
    for (let x in st.ttable) pre.push(`OpName ${st.getType(x)} "${x}"`)
    for (let x of Object.values(st.ctable)) pre.push(x);
    for (let x in st.vtable) pre.push(`OpName ${st.getVar(x).id} "${x}"`)
    return [...code, ...pre, ...body];
  },
  TypeDefine(_t, type, _e, _l, params, _r, _s) {
    let tp = type.parse();
    let ps = params.parse();
    if (st.ttable[tp] !== undefined) throw `type ${tp} already defined.`;
    st.ttable[tp] = {
      params: ps,
    };
    let tname = st.getType(tp);
    let code = [];
    for (let i = 0; i < ps.length; ++i) {
      code.push(`OpMemberName ${tname} ${i} "${ps[i][0]}"`);
    }
    code.push(
      `${tname} = OpTypeStruct ${ps.map((p) => st.getType(p[1])).join(" ")}`
    );
    return code;
  },
  Type(name) {
    return name.parse();
  },
  Parameter(name, _c, type) {
    return [name.parse(), type.parse()];
  },
  Parameters(params) {
    return params.asIteration().children.map((p) => p.parse());
  },
  VarDefine(decorator, name, _c, type, _s) {
    let dc = DecoratorDict[decorator.sourceString];
    let ptr = st.getNext();
    let cur = st.setVar(name.parse());
    let code = [
      `${ptr} = OpTypePointer ${dc} ${st.getType(type.parse())}`,
      `${cur} = OpVariable ${ptr} ${dc}`,
    ];
    return code;
    // 变量的编号-1一定是指针的编号
  },
  Function(_f, name, _l, params, _r, _a, type, expr) {
    let fn = name.parse();
    let ps = params.parse();
    let tp = type.numChildren === 0 ? "void" : type.children[0].children[0].parse()
    let ftp = st.getNext();
    let fid = st.getNext();
    st.ftable[fn] = {
      params: ps,
      return_type: tp,
      f_id: fid,
    };
    let code = [
      `${ftp} = OpTypeFunction ${st.getType(tp)}`,
      `${fid} = OpFunction ${st.getType(tp)} None ${ftp}`,
      `${st.getNext()} = OpLabel`,
    ];
    st.pushScope();
    code.push(...expr.parse());
    st.popScope();
    code.push(...["OpReturn", "OpFunctionEnd"]);
    return code;
  },
  number(_1) {
    return this.sourceString;
  },
  name(_1, _2) {
    return this.sourceString;
  },
  Expression(expr) {
    return [];
  },
};

let peg = fs.readFileSync("gram.ohm");
let spvGrammar = ohm.grammar(peg);
let spvSemantics = spvGrammar.createSemantics();
spvSemantics.addOperation("parse", actions);

exports.Parse = (str) => {
  let m = spvGrammar.match(str);
  if (m.succeeded()) return spvSemantics(m).parse();
  else console.error(m.message);
};

exports.Formatter = (xs) => {
  return xs
    .map((x) => {
      let y = x.replace("= ", "= \t");
      return x === y ? "\t\t\t" + x : "\t\t" + y;
    })
    .join("\n");
};
