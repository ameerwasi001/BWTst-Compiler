class NumberNode{
    constructor(number, pos_start, pos_end){
        this.number = number
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `${this.number.toString()}`
    }
}

class BinOpNode{
    constructor(left, op_tok, right, pos_start, pos_end){
        this.left = left
        this.op_tok = op_tok
        this.right = right
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `(${this.left.toString()}, ${this.op_tok.toString()}, ${this.right.toString()})`
      }
}

class UnaryOpNode{
    constructor(op_tok, number, pos_start, pos_end){
        this.op_tok = op_tok
        this.number = number
        this.pos_start = pos_start
        this.pos_end = pos_end
    }

    toString(){
        return `${this.op_tok.type == TT_MINUS ? 'Negative' : 'Positive'} ${this.number.toString()}`
      }
}

class VarAssignNode{
    constructor(identifier, expr, pos_start, pos_end){
        this.identifier = identifier
        this.value = expr
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `${this.identifier.toString()} = ${this.value.toString()}`
      }

}

class VarAccessNode{
    constructor(identifier, pos_start, pos_end){
        this.identifier = identifier
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `${this.identifier.toString()} = ?`
      }
}

class IfNode{
    constructor(cases, else_case, pos_start, pos_end){
        this.cases = cases
        this.else_case = else_case
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `${this.cases.map(x => x.toString())} : ${this.else_case ? this.else_case.toString() : ""}`
      }

}

class ListNode{
    constructor(elements, pos_start, pos_end){
        this.elements = elements
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `[${(this.elements.map(x => x.toString())).join(', ')}]`
      }
}

class WhileNode{
    constructor(condition, body, pos_start, pos_end){
        this.condition = condition
        this.body = body
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `while (${this.condition.toString()}) { ${this.body.toString()} }`
      }
}

class RunNode{
    constructor(fn, pos_start, pos_end){
        this.fn = fn
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `run ${this.fn.toString()}`
      }
}

class StringNode{
    constructor(value, pos_start, pos_end){
        this.value = value
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `${this.value.toString()}`
      }

}

class CallNode{
    constructor(identifier, args, kwargs, pos_start, pos_end){
        this.identifier = identifier
        this.args = args
        this.kwargs = kwargs
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        let string_kwargs = ""
        for (const k in this.kwargs){
          string_kwargs += `${k} -> ${this.kwargs[k]}, `
        }
        return `${this.identifier.value} (${this.args.map(x => x.toString())}, ${string_kwargs})`
      }
}

class TryNode{
    constructor(try_block, except_block, may_return, pos_start, pos_end){
        this.try_block = try_block
        this.except_block = except_block
        this.may_return = may_return
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return `try {${this.try_block.toString()}} except {${this.except_block.toString()}}`
      }
}

class RestartNode{
    constructor(pos_start, pos_end){
        this.pos_start = pos_start
        this.pos_end = pos_end
      }

    toString(){
        return "restart"
      }
}

class StopNode{
    constructor(pos_start, pos_end){
        this.pos_start = pos_start
        this.pos_end = pos_end
     }

    toString(){
        return "stop"
      }
}

class EveryNode{
    constructor(times, body, may_return, pos_start, pos_end){
        this.times = times
        this.body = body
        this.may_return = may_return
        this.pos_start = pos_start
        this.pos_end = pos_end
    }

    toString(){
        return `every time in ${this.times.toString()} time; ${this.body.toString()}; end`
      }
}

module.exports = {
  NumberNode, BinOpNode, UnaryOpNode,
  VarAccessNode, VarAssignNode, IfNode,
  ListNode, WhileNode, RunNode,
  StringNode, CallNode, TryNode,
  RestartNode, StopNode, EveryNode
}
