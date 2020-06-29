"use strict";

// Imports
const { LETTERS, DIGITS, whitespaces, TT_NUMBER,
   TT_IDENTIFIER, TT_KEYWORD, TT_PLUS, TT_MINUS,
   TT_MUL, TT_DIV, TT_RPAREN, TT_LPAREN,
   TT_EE, TT_NE, TT_GT, TT_LT,
   TT_GTE, TT_LTE, TT_EOF, TT_NOT,
   TT_AND, TT_OR, TT_STRING, TT_EQUALS,
   TT_SARROW, TT_DARROW, TT_COMMA, TT_NEWLINE,
   KEYWORDS, Token
} = require("./tokens.js");

const { RTError } = require("./errors");

const {
  NumberNode, BinOpNode, UnaryOpNode,
  VarAccessNode, VarAssignNode, IfNode,
  ListNode, WhileNode, RunNode,
  StringNode, CallNode, TryNode,
  RestartNode, StopNode, EveryNode
} = require("./nodes.js")

// RTResult
class RTResult {
    constructor(){
        this.reset()
      }

    reset(){
        this.value = null
        this.error = null
        this.func_return_value = null
        this.loop_should_continue = false
        this.loop_should_break = false
    }

    register(res){
        if (res.error) { this.error = res.error }
        this.loop_should_continue = res.loop_should_continue
        this.loop_should_break = res.loop_should_break
        return res.value
      }

    success(value){
        this.reset()
        this.value = value
        return this
      }

    success_continue(){
        this.reset()
        this.loop_should_continue = True
        return this
      }

    success_break(){
        this.reset()
        this.loop_should_break = True
        return this
      }

    failure(error){
        this.reset()
        this.error = error
        return this
      }

    should_return(){
        return (
            this.error ||
            this.loop_should_continue ||
            this.loop_should_break
        )
      }
}

// Symbol Table
class SymbolTable{
    constructor(parent=null){
        this.symbols = {}
        this.parent = parent
    }

    get(identifier){
        const value = this.symbols[identifier]
        if (value == null && this.parent){
            return this.parent.get(identifier)
        }
        return value
      }

    set(identifier, value){
        this.symbols[identifier] = value
        return value
      }

    delete(identifier){
        value = this.get(identifier)
        delete this.symbols[identifier]
        return value
      }
}

// Context

class Context{
    constructor(display_name, parent=null, parent_entry_pos=null){
        this.display_name = display_name
        this.parent = parent
        this.parent_entry_pos = parent_entry_pos
        this.symbol_table = null
      }
}

// Container Class

class PrePro{
  constructor(pre, pro) {
    this.pre = pre
    this.pro = pro
  }

  toString(){
    return `${this.pre}\n${this.pro}`
  }
}

// Compiler

class Compiler {

  compile(node, context, check){
      const method_name = `compile_${node.constructor.name}`
      if (!(method_name in this)){
        throw `undefined ${method_name}`
      }
      return this[method_name](node, context, check)
    }

    compile_NumberNode(node, context, check){
      return new RTResult().success(`BWTNumber(${node.number})`)
    }

    compile_StringNode(node, context, check){
      return new RTResult().success(`BWTString("${node.value}")`)
    }

    compile_StopNode(node, context, check){
      return new RTResult().success("break")
    }

    compile_RestartNode(node, context, check){
      return new RTResult().success("continue")
    }

    compile_UnaryOpNode(node, context, check){
      const res = new RTResult()
      const number = res.register(this.compile(node.number, context, check))
      if (res.should_return()) { return res }
      let result = `${number}`
      if (node.op_tok.type == TT_MINUS){
        result = `((${result}).multed_by(BWTNumber(-1)))`
      } else if (node.op_tok.type == TT_NOT) {
        result = `((${result}).notted())`
      }
      return res.success(result)
    }

    compile_BinOpNode(node, context, check){
      const res = new RTResult()
      const left = res.register(this.compile(node.left, context, check))
      if (res.should_return()){ return res }
      const right = res.register(this.compile(node.right, context, check))
      if (res.should_return()) { return res }
      const map = {
        PLUS: `((${left}).added_to(${right}))`,
        MINUS: `((${left}).subbed_by(${right}))`,
        MUL: `((${left}).multed_by(${right}))`,
        DIV: `((${left}).dived_by(${right}))`,
        GT: `((${left}).gt(${right}))`,
        GTE: `((${left}).gte(${right}))`,
        LT: `((${left}).lt(${right}))`,
        LTE: `((${left}).lte(${right}))`,
        EE: `((${left}).ee(${right}))`,
        NE: `((${left}).ne(${right}))`,
        OR: `((${left}).ored(${right}))`,
        AND: `((${left}).anded(${right}))`
      }
      const result = map[node.op_tok.type]
      return res.success(result)
    }

    compile_TryNode(node, context, check){
      const res = new RTResult()
      const try_block = res.register(this.compile(node.try_block, context, false))
      if (res.error) { return res }
      const except_block = res.register(this.compile(node.except_block, context, check))
      if (res.error) { return res }
      let to_return = ''
      if (node.may_return){
        const id = `try_${random()}`
        const try_except = `try: ${indentator('return ' + try_block)}\nexcept: ${indentator('return ' + except_block)}`
        const fun = `def ${id}():${indentator(try_except)}`
        to_return = new PrePro(`${fun}`, `${id}()`)
      } else {
        to_return = `try: ${indentator(try_block)}\nexcept: ${indentator(except_block)}`
      }
      return res.success(to_return)
    }

    compile_VarAssignNode(node, context, check){
      const res = new RTResult()
      const value = res.register(this.compile(node.value, context, check))
      let ret
      if (res.error) { return res }
      if (value.constructor.name == "PrePro"){
        ret = new PrePro(value.pre, `(${node.identifier.value} := ${value.pro})`)
      } else {
        ret = `(${node.identifier.value} := ${value})`
      }
      context.symbol_table.set(node.identifier.value, value)
      return res.success(ret)
    }

    compile_CallNode(node, context, check){
      const res = new RTResult()
      const identifier = node.identifier.value
      let args = []
      var pre = ""
      for (const arg of node.args) {
        const arg_value = res.register(this.compile(arg, context, check))
        if (res.error) { return res }
        if (arg_value.constructor.name == "PrePro"){
          pre += arg_value.pre + "\n"
          args.push(arg_value.pro)
        } else {
          args.push(arg_value)
        }
      }
      const string_args = args.join(", ")
      let kwargs = []
      for (const k in node.kwargs) {
        const identifier = k
        const value = res.register(this.compile(node.kwargs[k], context, check))
        if (res.error) { return res }
        if (value.constructor.name == "PrePro"){
          pre += value.pre + "\n"
          kwargs.push(`${identifier} = ${value.pro}`)
        } else {
          kwargs.push(`${identifier} = ${value}`)
        }
      }
      const string_kwargs = kwargs.join(", ")
      const final_call = new PrePro(pre, `getattr(helper, '${identifier}')(${string_args} ${(string_kwargs && string_args) ? ', ' + string_kwargs : string_kwargs})`)
      return res.success(final_call)
    }

    compile_IfNode(node, context, check){
      const res = new RTResult()
      let str = ''
      for (const ifcase of node.cases){
        const condition = res.register(this.compile(ifcase[0], context, check))
        if (res.error) { return res }
        const expression = res.register(this.compile(ifcase[1], context, check))
        if (res.error) { return res }
        str += `${expression} if ${condition} else `
      }
      if (node.else_case){
        const else_case = res.register(this.compile(node.else_case, context, check))
        str += `${else_case}`
      }
      if (str.endsWith('else ')){
        str += 'nill'
      }
      return res.success(str)
    }

    compile_WhileNode(node, context, check){
      const res = new RTResult()
      const condition = res.register(this.compile(node.condition, context, check))
      if (res.error) { return res }
      const body = res.register(this.compile(node.body, context, check))
      if (res.error) { return res }
      const loop = `while (${condition}): ${indentator(body)}`
      return res.success(loop)
    }

    compile_EveryNode(node, context, check){
      const res = new RTResult()
      const times = res.register(this.compile(node.times, context, check))
      if (res.error) { return res }
      const new_context = new Context("context_" + random(), context, node.pos_start)
      new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table)
      new_context.symbol_table.set("current", "BWTString('current')")
      const body = res.register(this.compile(node.body, new_context, check))
      if (res.error) { return res }
      let loop
      let func
      if (node.may_return){
        loop = `while ((current.copy()).lte(${times})).value: ${indentator(`current = (current.copy()).added_to(BWTNumber(1))\nto_ret = ${body}`)}`
        func = new PrePro(`def ${new_context.display_name}(): ${indentator(`current = BWTNumber(0)\nto_ret = BWTNumber(0)\n${loop}\nreturn to_ret.copy()`)}`, `${new_context.display_name}()`)
      } else {
        loop = `while ((current.copy()).lte(${times})).value: ${indentator(`${body}\ncurrent = (current.copy()).added_to(BWTNumber(1))`)}`
        func = new PrePro(`def ${new_context.display_name}(): ${indentator(`current = BWTNumber(0)\n${loop}\nreturn nil`)}`, `${new_context.display_name}()`)
      }
      return res.success(func)
    }

    compile_VarAccessNode(node, context, check){
      const res = new RTResult()
      const value = context.symbol_table.get(node.identifier.value)
      if ((!value) && (check)){
        return res.failure(new RTError(
          node.pos_start, node.pos_end,
          context,
          `Undefined variable ${node.identifier.value}`
        ))
      }
      return res.success(`${node.identifier.value}.copy()`)
    }

    compile_ListNode(node, context, check){
      const res = new RTResult()
      const elems = []
      for (const element of node.elements){
        const elem = res.register(this.compile(element, context, check))
        if (res.error) { return res }
        elems.push(elem)
      }
      return res.success(elems.join("\n"))
    }
}

//Utility
function indentator(string){
    string = "\n" + string + "\n"
    let indentlist = string.split("\n")
    let index = 0
    while (index < indentlist.length){
        indentlist[index] = "\t"+indentlist[index]
        index += 1
    }
    return indentlist.join("\n")
}

function random(){
  const number = () => Math.floor(Math.random() * 100) + 1
  const times = Math.floor(Math.random() * 60) + 1
  let final = ""
  for (let i = 0; i < times; i++) {
    final += number().toString()
  }
  return final

}

module.exports = {Context, SymbolTable, Compiler}
