const ohm = require("ohm-js");
const fs = require("fs");

var BaseTypeDict = {
  int: "OpTypeInt 32 1",
  uint: "OpTypeInt 32 0",
  float: "OpTypeFloat 32",
  void: "OpTypeVoid",
  bool: "OpTypeBool",
};

var PluralTypeDict = {
  vec2: ["OpTypeVector", "float", 2],
  vec3: ["OpTypeVector", "float", 3],
  vec4: ["OpTypeVector", "float", 4],
  ivec2: ["OpTypeVector", "int", 2],
  ivec3: ["OpTypeVector", "int", 3],
  ivec4: ["OpTypeVector", "int", 4],
  mat3: ["OpTypeMatrix", "vec3", 3],
  mat4: ["OpTypeMatrix", "vec4", 4],
};

var DecoratorDict = {
  var: "Private",
  in: "Input",
  out: "Output",
  uniform: "Uniform",
  func: "Function",
};

function State() {
  this.counter = 0;
  this.dtable = {};
  this.dlist = [];
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
    if (this.dtable[tname] === undefined) {
      if (BaseTypeDict[tp] !== undefined) {
        let code = `${tname} = ${BaseTypeDict[tp]}`;
        this.dtable[tname] = code;
        this.dlist.push(code);
      } else if (PluralTypeDict[tp] !== undefined) {
        let [ptype, btype, vnum] = PluralTypeDict[tp];
        let code = `${tname} = ${ptype} ${this.getType(btype)} ${vnum}`;
        this.dtable[tname] = code;
        this.dlist.push(code);
      }
    }
    return tname;
  };
  this.getNext = () => {
    this.counter += 1;
    return `%${this.counter}`;
  };
  this.getVar = (v, nullable = false) => {
    let vname = undefined;
    for (let tb = this.vtable; tb && !vname; tb = tb.__father__) vname = tb[v];
    if (!vname) {
      if (nullable) return null;
      throw `variable ${v} not found`;
    }
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

function SolveCallFunction(func, params) {
  if (func.search(/vec[234]/) !== -1) {
    if (params.every((p) => p.isLiteral)) {
      let cur = st.getNext();
      let tp = st.getType(func);
      let expr_v = {
        code: [
          `${cur} = OpConstantComposite ${tp} ${params
            .map((p) => p.value)
            .join(" ")}`,
        ],
        typeName: func,
        type: tp,
        value: cur,
      };
      return expr_v;
    }
  }

  const extTable = {
    sin: ["Sin", "float"],
    round: ["Round", "float"],
    trunc: ["Trunc", "float"],
    abs: ["FAbs", "float"],
    floor: ["Floor", "float"],
    ceil: ["Ceil", "float"],
    cos: ["Cos", "float"],
    tan: ["Tan", "float"],
    sinh: ["Sinh", "float"],
    cosh: ["Cosh", "float"],
    tanh: ["Tanh", "float"],
    pow: ["Pow", "float"],
    exp: ["Exp", "float"],
    log: ["Log", "float"],
    sqrt: ["Sqrt", "float"],
    min: ["FMin", "float"],
    max: ["FMax", "float"],
    clamp: ["FClamp", "float"],
    mix: ["FMix", "float"],
    step: ["Step", "float"],
    length: ["Length", "float"],
    normalize: ["Normalize", "float"],
  };
  let f = extTable[func];
  if (f !== undefined) {
    let cur = st.getNext();
    let expr_v = {
      code: params.map((p) => p.code).flat(),
      typeName: f[1],
      type: st.getType(f[1]),
      value: cur,
    };
    expr_v.code.push(
      `${cur} = OpExtInst ${expr_v.type} %ext ${f[0]} ${params
        .map((p) => p.value)
        .join(" ")}`
    );
    return expr_v;
  }

  f = st.ftable[func];
  if (f !== undefined) {
    let val = st.getNext();
    let tpName = f.return_type;
    let tp = st.getType(tpName);
    let expr_v = {
      code: [
        ...params.map((p) => p.code).flat(),
        `${val} = OpFunctionCall ${tp} ${f.f_id} ${params
          .map((p) => p.value)
          .join(" ")}`,
      ],
      type: tp,
      typeName: tpName,
      value: val,
    };
    return expr_v;
  }

  throw `invalid call function ${func}`;
}

let actions = {
  Program(scripts) {
    st = new State();
    let code = ["OpCapability Shader", "OpMemoryModel Logical GLSL450"];
    code.push(`%ext = OpExtInstImport "GLSL.std.450"`);
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
    for (let x of st.dlist) pre.push(x);
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
    st.pushScope();
    let code = [
      `${ftp} = OpTypeFunction ${st.getType(tp)} ${ps
        .map((p) => st.getType(p[1]))
        .join(" ")}`,
      `${fid} = OpFunction ${st.getType(tp)} None ${ftp}`,
    ];
    for (let p of ps) {
      let ptr = st.getNext();
      let param = st.setVar(p[0], "func", p[1]);
      code.push(
        `${ptr} = OpTypePointer Function ${st.getType(p[1])}`,
        `${param} = OpFunctionParameter ${ptr}`
      );
    }
    code.push(`${st.getNext()} = OpLabel`);
    expr_v = expr.parse();
    code.push(...expr_v.code);
    st.popScope();
    if (tp === "void") code.push("OpReturn");
    code.push("OpFunctionEnd");
    return code;
  },
  intNumber(_1) {
    return this.sourceString;
  },
  floatNumber(_1) {
    return this.sourceString;
  },
  generalNumber(_1) {
    return this.sourceString;
  },
  number(num) {
    return num.parse();
  },
  name(_1, _2) {
    return this.sourceString;
  },

  Statement(e) {
    return e.parse();
  },
  PrimaryExpression(e) {
    return e.parse();
  },
  Expression(e) {
    e = e.parse();
    return e;
  },
  Expression_derive(e) {
    return e.parse();
  },
  PropertyExpression(e) {
    return e.parse();
  },
  PropertyExpression_derive(e) {
    return e.parse();
  },
  UnaryExpression(e) {
    return e.parse();
  },
  UnaryExpression_derive(e) {
    return e.parse();
  },
  MultiplicativeBinaryExpression(e) {
    return e.parse();
  },
  MultiplicativeBinaryExpression_derive(e) {
    return e.parse();
  },
  AdditiveBinaryExpression(e) {
    return e.parse();
  },
  AdditiveBinaryExpression_derive(e) {
    return e.parse();
  },
  BitBinaryExpression(e) {
    return e.parse();
  },
  BitBinaryExpression_derive(e) {
    return e.parse();
  },
  CompareBinaryExpression(e) {
    return e.parse();
  },
  CompareBinaryExpression_derive(e) {
    return e.parse();
  },
  LogicBinaryExpression(e) {
    return e.parse();
  },
  LogicBinaryExpression_derive(e) {
    return e.parse();
  },
  TernaryExpression(e) {
    return e.parse();
  },
  TernaryExpression_derive(e) {
    return e.parse();
  },
  AssignExpression(e) {
    return e.parse();
  },
  AssignExpression_derive(e) {
    return e.parse();
  },

  number_double(_) {
    return {
      typeName: "double",
      value: this.sourceString,
    };
  },
  number_int(_) {
    return {
      typeName: "int",
      value: this.sourceString,
    };
  },
  number_float(_, _f) {
    return {
      typeName: "float",
      value: this.sourceString.slice(0, -1),
    };
  },

  Statement_semiclon(_) {
    return {
      code: [],
      value: "",
      type: st.getType("void"),
    };
  },
  Statement_ifState(_if, _l, cond, _r, expr1, _else, expr2) {
    let c = cond.parse();
    console.assert(
      c.typeName === "bool",
      `condition should be bool but got ${c.typeName}`
    );
    let expr_v = {
      code: c.code,
    };
    let e1 = expr1.parse();
    let branch1 = st.getNext();
    let branchEnd = st.getNext();
    if (_else.numChildren === 0) {
      // 无else，返回void
      expr_v.type = st.getType("void");
      expr_v.typeName = "void";
      expr_v.value = st.getType("void");
      expr_v.code.push(
        `OpSelectionMerge ${branchEnd} None`,
        `OpBranchConditional ${c.value} ${branch1} ${branchEnd}`,
        `${branch1} = OpLabel`,
        ...e1.code,
        `OpBranch ${branchEnd}`,
        `${branchEnd} = OpLabel`
      );
    } else {
      // 有else分支，若类型一致返回该类型，否则返回void
      let e2 = expr2.child(0)?.parse();
      let branch2 = st.getNext();
      if (e1.typeName === e2.typeName) {
        let cur = st.getNext();
        expr_v.typeName = e1.typeName;
        expr_v.type = e1.type;
        expr_v.value = cur;
        expr_v.code.push(
          `OpSelectionMerge ${branchEnd} None`,
          `OpBranchConditional ${c.value} ${branch1} ${branch2}`,
          `${branch1} = OpLabel`,
          ...e1.code,
          `OpBranch ${branchEnd}`,
          `${branch2} = OpLabel`,
          ...e2.code,
          `OpBranch ${branchEnd}`,
          `${branchEnd} = OpLabel`,
          `${cur} = OpPhi ${expr_v.type} ${e1.value} ${branch1} ${e2.value} ${branch2}`
        );
      } else {
        expr_v.type = st.getType("void");
        expr_v.typeName = "void";
        expr_v.value = st.getType("void");
        expr_v.code.push(
          `OpSelectionMerge ${branchEnd} None`,
          `OpBranchConditional ${c.value} ${branch1} ${branch2}`,
          `${branch1} = OpLabel`,
          ...e1.code,
          `OpBranch ${branchEnd}`,
          `${branch2} = OpLabel`,
          ...e2.code,
          `OpBranch ${branchEnd}`,
          `${branchEnd} = OpLabel`
        );
      }
    }
    return expr_v;
  },
  Statement_forState(_f, _l, init, _1, cond, _2, cont, _r, body) {
    st.pushScope();
    let begin_l = st.getNext();
    let cond_l = st.getNext();
    let body_l = st.getNext();
    let cont_l = st.getNext();
    let end_l = st.getNext();
    st.vtable["for"] = {
      begin: begin_l,
      cond: cond_l,
      body: body_l,
      cont: cont_l,
      end: end_l,
    };
    init = init.parse();
    cond = cond.parse();
    cont = cont.parse();
    body = body.parse();
    expr_v = {
      code: [],
      value: st.getType("void"),
      type: st.getType("void"),
      typeName: "void",
    };
    expr_v.code.push(
      ...init.code,
      `OpBranch ${begin_l}`,
      `${begin_l} = OpLabel`,
      `OpLoopMerge ${end_l} ${cont_l} None`,
      `OpBranch ${cond_l}`,
      `${cond_l} = OpLabel`,
      ...cond.code,
      `OpBranchConditional ${cond.value} ${body_l} ${end_l}`,
      `${body_l} = OpLabel`,
      ...body.code,
      `OpBranch ${cont_l}`,
      `${cont_l} = OpLabel`,
      ...cont.code,
      `OpBranch ${begin_l}`,
      `${end_l} = OpLabel`
    );
    st.popScope();
    return expr_v;
  },
  Statement_returnState(_r, expr) {
    expr_v = expr.parse();
    if (expr.sourceString === ";") {
      expr_v = {
        code: [`OpReturn`],
        typeName: "void",
        type: st.getType("void"),
        value: "void",
      };
    } else {
      expr_v.code.push(`OpReturnValue ${expr_v.value}`);
      expr_v.typeName = "void";
      expr_v.type = st.getType(expr_v.typeName);
      expr_v.value = "%void";
    }
    return expr_v;
  },
  Statement_breakState(_b) {
    let labels = st.getVar("for", true);
    if (labels === null) throw "got break but no loop found";
    let expr_v = {
      code: [`OpBranch ${labels.end}`, `${st.getNext()} = OpLabel`],
      typeName: "void",
      type: st.getType("void"),
      value: "%void",
    };
    return expr_v;
  },
  Statement_continueState(_c) {
    let labels = st.getVar("for", true);
    if (labels === null) throw "got continue but no loop found";
    let expr_v = {
      code: [`OpBranch ${labels.cont}`, `${st.getNext()} = OpLabel`],
      typeName: "void",
      type: st.getType("void"),
      value: "%void",
    };
    return expr_v;
  },

  PrimaryExpression_variableLiteral(name) {
    let cur = st.getNext();
    let v = st.getVar(name.sourceString);
    let expr_v = {
      code: [`${cur} = OpLoad ${st.getType(v.type)} ${v.id}`],
      value: cur,
      type: st.getType(v.type),
      typeName: v.type,
      lvalue: v.id,
    };
    return expr_v;
  },
  PrimaryExpression_numberLiteral(num) {
    let cnum = num.parse();
    let cur = st.getConst(cnum.value);
    let tp = st.getType(cnum.typeName);
    let expr_v = {
      code: [],
      value: cur,
      type: tp,
      typeName: cnum.typeName,
      isLiteral: true,
    };
    return expr_v;
  },
  PrimaryExpression_tupleState(_l, xs, _r) {
    let es = xs.asIteration().children.map((x) => x.parse());
    return es[es.length - 1];
  },
  PrimaryExpression_multiExpr(_l, xs, _r) {
    st.pushScope();
    let es = xs.children.map((x) => x.parse());
    let code = [];
    for (let e of es) code.push(...e.code);
    let expr_v = {
      code: code,
      value: es[es.length - 1].value,
      type: es[es.length - 1].type,
      typeName: es[es.length - 1].typeName,
    };
    st.popScope();
    return expr_v;
  },
  PrimaryExpression_statement(s) {
    return s.parse();
  },

  PropertyExpression_getMember(e, _dot, m) {
    let expr_v = e.parse();
    let member = m.parse();
    if (expr_v.typeName.search(/vec[234]/) !== -1) {
      if (
        member.length >= 1 &&
        member.length <= 4 &&
        [...member].every((c) => "xyzwrgba".includes(c))
      ) {
        expr_v.typeName = member.length === 1 ? "float" : `vec${member.length}`;
        expr_v.type = st.getType(expr_v.typeName);
        let cur = st.getNext();
        let v = expr_v.value;
        const idmap = { x: 0, y: 1, z: 2, w: 3, r: 0, g: 1, b: 2, a: 3 };
        let ids = [...member].map((c) => idmap[c]);
        expr_v.code.push(
          `${cur} = OpVectorShuffle ${expr_v.type} ${v} ${v} ${ids.join(" ")}`
        );
        expr_v.value = cur;
        if (expr_v.lvalue) expr_v.lvalue = cur;
        return expr_v;
      }
    }
    return SolveCallFunction(member, [expr_v]);
    throw `invalid get member ${member}`;
  },
  PropertyExpression_callFunc(func, _l, params, _r) {
    func = func.parse();
    params = params.asIteration().children.map((p) => p.parse());
    return SolveCallFunction(func, params);
  },
  PropertyExpression_ufcs(phead, _d, func, _l, ptail, _r) {
    func = func.parse();
    params = [phead.parse()];
    if (ptail.numChildren > 0)
      params.push(
        ...ptail
          .child(0)
          ?.asIteration()
          .children.map((p) => p.parse())
      );
    return SolveCallFunction(func, params);
  },
  PropertyExpression_getAddress(v, _l, addr, _r) {
    v = v.parse();
    addr = addr.parse();
    expr_v = {
      code: [...v.code, ...addr.code],
      typeName: null,
      type: null,
      value: null,
    };
    if (v.typeName.search(/vec[234]/) !== -1) {
      console.assert(
        ["int", "uint"].includes(addr.typeName),
        `address type expected int got ${addr.typeName}`
      );
      expr_v.typeName = "float";
      expr_v.type = st.getType(expr_v.typeName);
      let ptr = st.getNext();
      let id = st.getNext();
      let cur = st.getNext();
      expr_v.code.push(
        `${ptr} = OpTypePointer Function ${expr_v.type}`,
        `${id} = OpAccessChain ${ptr} ${v.value} ${addr.value}`,
        `${cur} = OpLoad ${expr_v.type} ${id}`
      );
      expr_v.value = cur;
      if (v.lvalue) {
        expr_v.lvalue = id;
      }
      return expr_v;
    }
    throw `invalid get address ${addr.typeName} of ${v.typeName}`;
  },

  UnaryExpression_compose(op, expr) {
    let expr_v = expr.parse();
    let cur;
    let instr;
    switch (op.sourceString) {
      case "+":
        break;
      case "-":
        cur = st.getNext();
        expr_v.code.push(`${cur} = OpFNegate ${expr_v.type} ${expr_v.value}`);
        expr_v.value = cur;
        break;
      case "++":
      case "--":
        console.assert(expr_v.lvalue, `"${expr_v.sourceString}" not a l-value`);
        cur = st.getNext();
        instr = op.sourceString === "++" ? "OpIAdd" : "OpISub";
        expr_v.code.push(
          `${cur} = ${instr} ${expr_v.type} ${expr_v.value} ${st.getConst(
            "1"
          )}`,
          `OpStore ${expr_v.lvalue} ${cur}`
        );
        expr_v.value = cur;
        break;
      default:
    }
    return expr_v;
  },
  MultiplicativeBinaryExpression_compose(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let cur = st.getNext();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: cur,
      type: e1.type,
      typeName: e1.typeName,
    };
    op = op.sourceString;
    let instr =
      op === "*"
        ? "OpFMul"
        : op === "/"
        ? "OpFDiv"
        : op === "%"
        ? "OpFMod"
        : null;
    if (op === "*" && e1.typeName === "vec3" && e2.typeName === "mat3") {
      instr = "OpVectorTimesMatrix";
      expr_v.typeName = "vec3";
      expr_v.type = st.getType(expr_v.typeName);
    }
    console.assert(instr !== null, `unknown op ${op}`);
    expr_v.code.push(
      `${cur} = ${instr} ${expr_v.type} ${e1.value} ${e2.value}`
    );
    return expr_v;
  },
  AdditiveBinaryExpression_compose(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let cur = st.getNext();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: cur,
      type: e1.type,
      typeName: e1.typeName,
    };
    op = op.sourceString;
    let instr = op === "+" ? "OpFAdd" : op === "-" ? "OpFSub" : null;
    console.assert(instr !== null, `unknown op ${op}`);
    expr_v.code.push(
      `${cur} = ${instr} ${expr_v.type} ${e1.value} ${e2.value}`
    );
    return expr_v;
  },
  CompareBinaryExpression_compose(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    let cur = st.getNext();
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: cur,
      type: st.getType("bool"),
      typeName: "bool",
    };
    op = op.sourceString;
    let instr =
      op === "=="
        ? "OpFOrdEqual"
        : op === "!="
        ? "OpFOrdNotEqual"
        : op === "<"
        ? "OpFOrdLessThan"
        : op === ">"
        ? "OpFOrdGreaterThan"
        : op === "<="
        ? "OpFOrdLessThanEqual"
        : op === ">="
        ? "OpFOrdGreaterThanEqual"
        : null;
    console.assert(instr !== null, `unknown op ${op}`);
    expr_v.code.push(
      `${cur} = ${instr} ${expr_v.type} ${e1.value} ${e2.value}`
    );
    return expr_v;
  },

  AssignExpression_assign(expr1, op, expr2) {
    let e1 = expr1.parse();
    let e2 = expr2.parse();
    console.assert(
      e1.typeName === e2.typeName,
      `assign expected ${e1.typeName} got ${e2.typeName}`
    );
    let expr_v = {
      code: [...e1.code, ...e2.code],
      value: e2.value,
      type: e1.type,
      typeName: e1.typeName,
    };
    if (op.sourceString === "=") {
      // expr1中得是左值
      console.assert(e1.lvalue, `"${expr1.sourceString}" not a l-value`);
      expr_v.code.push(...[`OpStore ${e1.lvalue} ${e2.value}`]);
    } else {
      throw "not implement";
    }
    return expr_v;
  },
  AssignExpression_assignHint(_dc, name, _s, type, _e, expr) {
    let v = name.parse();
    let tp = type.parse();
    let expr_v = expr.parse();
    if (st.getVar(v, true) !== null) {
      throw `redefine variable ${v}`;
    }
    if (expr_v.typeName !== tp) {
      throw `assign not valid, got ${expr_v.typeName}, expected ${tp}`;
    }
    let ptr = st.getNext();
    let cur = st.setVar(v, "func", tp);
    expr_v.code.push(
      `${ptr} = OpTypePointer Function ${st.getType(tp)}`,
      `${cur} = OpVariable ${ptr} Function`,
      `OpStore ${cur} ${expr_v.value}`
    );
    expr_v.value = cur;
    return expr_v;
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
