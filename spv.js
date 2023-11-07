const ohm = require('ohm-js')
const fs = require('fs')

let actions = {
    Program(scripts) {

    },
    TypeDefine(_t, type, _e, _l, params, _r, _s) {

    },
    Type(name) {

    },
    Parameter(name, _c, type) {

    },
    Parameters(params) {

    },
    VarDefine(decorator, name, _c, type, _s) {

    },
    Function(_f, name, _l, params, _r, _a, type, expr) {

    },
    number(_1) {

    },
    name(_1, _2) {

    },
    Expression(expr) {

    },
}

let peg = fs.readFileSync('gram.ohm')
let spvGrammar = ohm.grammar(peg)
let spvSemantics = spvGrammar.createSemantics()
spvSemantics.addOperation('parse', actions)

exports.Parse = (str) => {
    let m = spvGrammar.match(str)
    if (m.succeeded())
        return spvSemantics(m).parse()
    else
        console.error(m.message)
}
