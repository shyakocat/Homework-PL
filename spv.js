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
  this.setVar = (v, dc, tp) => {
    let cur = this.getNext();
    this.vtable[v] = {
      id: cur,
      decorator: dc,
      type: tp,
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
    for (let x in st.ttable) pre.push(`OpName ${st.getType(x)} "${x}"`);
    for (let x of Object.values(st.ctable)) pre.push(x);
    for (let x in st.vtable) pre.push(`OpName ${st.getVar(x).id} "${x}"`);
    for (let x of Object.entries(st.ftable))
      pre.push(`OpName ${x[1].f_id} "${x[0]}"`);
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
    let tp = type.parse();
    let ptr = st.getNext();
    let cur = st.setVar(name.parse(), dc, tp);
    let code = [
      `${ptr} = OpTypePointer ${dc} ${st.getType(tp)}`,
      `${cur} = OpVariable ${ptr} ${dc}`,
    ];
    return code;
    // 变量的编号-1一定是指针的编号
  },
  Function(_f, name, _l, params, _r, _a, type, expr) {
    let fn = name.parse();
    let ps = params.parse();
    let tp =
      type.numChildren === 0 ? "void" : type.children[0].children[0].parse();
    let ftp = st.getNext();
    let fid = `%f_${fn}`;
    st.ftable[fn] = {
      params: ps,
      return_type: tp,
      f_id: fid,
    };
    let code = [
      `${ftp} = OpTypeFunction ${st.getType(tp)} ${ps
        .map((p) => st.getType(p[1]))
        .join(" ")}`,
      `${fid} = OpFunction ${st.getType(tp)} None ${ftp}`,
      `${st.getNext()} = OpLabel`,
    ];
    st.pushScope();
    expr_v = expr.parse();
    code.push(...expr_v.code);
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
    return expr.parse();
  },
  Expression_unaryOp1(op, expr) {
    let expr_v = expr.parse();
    switch (op.sourceString) {
      case "+":
        break;
      case "-":
        let cur = st.getNext();
        expr_v.code.push(`${cur} = OpFNegate ${expr_v.type} ${expr_v.value}`);
        expr_v.value = cur;
        break;
      default:
    }
    return expr_v;
  },
  Expression_binaryOp1(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let cur = st.getNext();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: cur,
      type: e1.type,
      isFloat: true,
    };
    let instr =
      op.sourceString === "*"
        ? "OpFMul"
        : op.sourceString === "/"
        ? "OpFDiv"
        : op.sourceString === "%"
        ? "OpFMod"
        : null;
    console.assert(instr !== null);
    expr_v.code.push(
      `${cur} = ${instr} ${expr_v.type} ${e1.value} ${e2.value}`
    );
    return expr_v;
  },
  Expression_binaryOp2(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let cur = st.getNext();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: cur,
      type: e1.type,
    };
    let instr =
      op.sourceString === "+"
        ? "OpFAdd"
        : op.sourceString === "-"
        ? "OpFSub"
        : null;
    console.assert(instr !== null);
    expr_v.code.push(
      `${cur} = ${instr} ${expr_v.type} ${e1.value} ${e2.value}`
    );
    return expr_v;
  },
  Expression_assign(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: e2.value,
      type: e1.type,
    };
    if (op.sourceString === "=") {
      // expr1中得是左值
      expr_v.code.push(...[`OpStore ${e1.lvalue} ${e2.value}`]);
    } else {
      throw "not implement";
    }
    return expr_v;
  },
  Expression_variableLiteral(name) {
    let cur = st.getNext();
    let v = st.getVar(name.sourceString);
    let expr_v = {
      code: [`${cur} = OpLoad ${st.getType(v.type)} ${v.id}`],
      value: cur,
      type: st.getType(v.type),
      lvalue:  v.id,
      isFloat: true, // 为了简化，我们只有浮点类型
    };
    return expr_v;
  },
  Expression_numberLiteral(num) {
    let cur = st.getNext();
    let tp = st.getType("float");
    let expr_v = {
      code: [`${cur} = OpConstant ${tp} ${num.sourceString}`],
      value: cur,
      type: tp,
    };
    return expr_v;
  },
  Expression_tupleState(_l, xs, _r) {
    let es = xs.asIteration().children.map((x) => x.parse());
    return es[0];
  },
  Expression_multiExpr(_l, xs, _r) {
    let es = xs.children.map((x) => x.parse());
    return es[0];
  },
  Expression_semiclon(_) {
    return {
      code: [],
      value: "",
      type: st.getType("void"),
    };
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
