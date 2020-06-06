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

const { InvalidSyntaxError } = require("./errors");

const {
  NumberNode, BinOpNode, UnaryOpNode,
  VarAccessNode, VarAssignNode, IfNode,
  ListNode, WhileNode, RunNode,
  StringNode, CallNode, TryNode,
  RestartNode, StopNode, EveryNode
} = require("./nodes.js")

// Parser Result
class ParseResult {
    constructor(){
        this.error = null
        this.node = null
        this.advance_count = 0
      }

    register_advancement(){
        this.advance_count += 1
      }

    register(res){
        this.last_registered_advance_count = res.advance_count
        this.advance_count += res.advance_count
        if (res.error) { this.error = res.error }
        return res.node
      }

    try_register(res){
        if (res.error) {
            this.to_reverse_count = res.advance_count
            return null
          }
        return this.register(res)
      }

    success(node){
        this.node = node
        return this
      }

    failure(error){
        if (!this.error || this.advance_count == 0){
            this.error = error
        }
        return this
      }
}

// Parser

class Parser {
  constructor(tokens){
      this.tokens = tokens
      this.tok_idx = -1
      this.next_tok_idx = 0
      this.third_tok_idx = 1
      this.advance()
    }

  update_current_tok(){
      if (this.tok_idx >= 0 && this.tok_idx<this.tokens.length){
          this.current_tok = this.tokens[this.tok_idx]
      }
      if (this.next_tok_idx >= 0 && this.next_tok_idx<this.tokens.length){
          this.next_tok = this.tokens[this.next_tok_idx]
      }
      if (this.third_tok_idx >= 0 && this.third_tok_idx<this.tokens.length){
          this.third_tok = this.tokens[this.third_tok_idx]
      }
    }

  advance(){
      this.tok_idx += 1
      this.next_tok_idx += 1
      this.third_tok_idx += 1
      this.update_current_tok()
    }

  reverse(amount=1){
      this.tok_idx -= amount
      this.update_current_tok()
      return this.current_tok
    }

  parse(){
      if (this.current_tok.type == TT_EOF){
        return new VarAccessNode('nil')
      }
      const res = this.statements()
      if (res.error || this.current_tok.type != TT_EOF){
          return res.failure(new InvalidSyntaxError(
              this.current_tok.pos_start, this.current_tok.pos_end,
              "Expected '+', '-', '*', and '/'"
          ))
        }
      return res
    }

    bin_op(func_a, ops, func_b){
        const res = new ParseResult()
        let left = res.register(func_a())
        if (res.error){ return res }
        const pos_start = this.current_tok.pos_start.copy()
        if (res.error){ return res }
        while (ops.includes(this.current_tok.type)){
            const op_tok = this.current_tok
            res.register_advancement()
            this.advance()
            const right = res.register(func_b())
            if (res.error){ return res }
            left = new BinOpNode(left, op_tok, right, pos_start, this.current_tok.pos_end)
        }
        return res.success(left)
      }

      statements(){
          const res = new ParseResult()
          let statements = []
          const pos_start = this.current_tok.pos_start.copy()
          let more_statements = true
          while (this.current_tok.type == TT_NEWLINE){
              res.register_advancement()
              this.advance()
          }
          let statement = res.register(this.statement())
          if (res.error){ return res }
          statements.push(statement)
          while (true){
              let newline_count = 0
              while (this.current_tok.type == TT_NEWLINE){
                  res.register_advancement()
                  this.advance()
                  newline_count += 1
              }
              if (newline_count == 0){
                  more_statements = false
              }
              if (!more_statements){ break }
              statement = res.try_register(this.statement())
              if (!statement){
                  this.reverse(res.to_reverse_count)
                  more_statements = false
                  continue
              }
              statements.push(statement)
          }
          let end =  new ListNode(statements, pos_start, this.current_tok.pos_end.copy())
          return res.success(end)
      }

      statement(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start.copy()
          if (this.current_tok.matches(TT_KEYWORD, "restart")){
              this.advance()
              return res.success(new RestartNode(pos_start, this.current_tok.pos_end.copy()))
          }
          if (this.current_tok.matches(TT_KEYWORD, "stop")){
              this.advance()
              return res.success(new StopNode(pos_start, this.current_tok.pos_end.copy()))
          }
          const expr = res.register(this.expr())
          if (res.error){ return res }
          return res.success(expr)
      }

      expr(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start
          if ((this.current_tok.type == TT_IDENTIFIER) && (this.next_tok.type == TT_EQUALS)){
              const identifier = this.current_tok
              res.register_advancement()
              this.advance()
              res.register_advancement()
              this.advance()
              const expr = res.register(this.expr())
              const pos_end = this.current_tok.pos_end
              return res.success(new VarAssignNode(identifier, expr, pos_start, pos_end))
          } else {
              return this.bin_op((...args) => this.comp_expr(...args), [TT_OR, TT_AND], (...args) => this.comp_expr(...args))
          }
      }

      comp_expr(){
          const res = new ParseResult()
          if (this.current_tok.type == TT_NOT){
              const pos_start = this.current_tok.pos_start.copy()
              const unaryOp = this.current_tok
              res.register_advancement()
              this.advance()
              const comp = res.register(this.comp_expr())
              if (res.error) { return res }
              return res.success(new UnaryOpNode(unaryOp, comp, pos_start, this.current_tok.pos_end.copy()))
          }
          const node = res.register(this.bin_op((...args) => this.arith_expr(...args), [TT_EE, TT_NE, TT_LT, TT_LTE, TT_GT, TT_GTE], (...args) => this.arith_expr(...args)))
          if (res.error) { return res }
          return res.success(node)
      }

      arith_expr(){
          return this.bin_op((...args) => this.term(...args), [TT_PLUS, TT_MINUS], (...args) => this.term(...args))
      }

      term(){
          return this.bin_op((...args) => this.factor(...args), [TT_MUL, TT_DIV], (...args) => this.factor(...args))
      }

      call(){
          const res = new ParseResult()
          const args = []
          const kwargs = {}
          const name = this.current_tok
          res.register_advancement()
          this.advance()
          const pos_start = this.current_tok.pos_start
          if (this.current_tok.type != TT_DARROW){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected '=>'"
              ))
          }
          res.register_advancement()
          this.advance()
          if (this.current_tok.type != TT_RPAREN){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected '('"
              ))
          }
          res.register_advancement()
          this.advance()
          if (this.current_tok.type != TT_LPAREN){
              if (this.next_tok.type != TT_SARROW){
                  let expr = res.register(this.expr())
                  if (res.error){ return res }
                  args.push(expr)
              } else {
                  let identifier = this.current_tok.value
                  res.register_advancement()
                  this.advance()
                  if (this.current_tok.type != TT_SARROW){
                      return res.failure(new InvalidSyntaxError(
                          this.current_tok.pos_start, this.current_tok.pos_end,
                          "Expected '->'"
                          ))
                  }
                  res.register_advancement()
                  this.advance()
                  let expr = res.register(this.expr())
                  if (res.error){ return res }
                  kwargs[identifier] = expr
                }
              }
              while (this.current_tok.type == TT_COMMA){
                  res.register_advancement()
                  this.advance()
                  let identifier = null
                  if (this.next_tok.type == TT_SARROW){
                      identifier = this.current_tok.value
                      res.register_advancement()
                      this.advance()
                      if (this.current_tok.type != TT_SARROW){
                          return res.failure(new InvalidSyntaxError(
                              this.current_tok.pos_start, this.current_tok.pos_end,
                              "Expected '->'"
                              ))
                      }
                      res.register_advancement()
                      this.advance()
                      let expr = res.register(this.expr())
                      if (res.error){ return res }
                      kwargs[identifier] = expr
                  } else {
                      let expr = res.register(this.expr())
                      if (res.error){ return res }
                      args.push(expr)
                  }
              }
          if (this.current_tok.type != TT_LPAREN){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected ')'"
              ))
          }
          res.register_advancement()
          this.advance()
          return res.success(new CallNode(name, args, kwargs, pos_start, this.current_tok.pos_end))

        }

      factor(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start.copy()
          if ([TT_PLUS, TT_MINUS].includes(this.current_tok.type)){
              const unaryOp = this.current_tok
              res.register_advancement()
              this.advance()
              const factor = res.register(this.factor())
              if (res.error){ return res }
              return res.success(new UnaryOpNode(unaryOp, factor, pos_start, this.current_tok.pos_end))
          }
          if (this.current_tok.type == TT_IDENTIFIER){
              const pos_end = this.current_tok.pos_end.copy()
              if (this.next_tok.type == TT_DARROW){
                  return this.call()
              }
              const identifier = this.current_tok
              res.register_advancement()
              this.advance()
              return res.success(new VarAccessNode(identifier, pos_start, pos_end))
          }
          if (this.current_tok.type == TT_NUMBER){
              const pos_end = this.current_tok.pos_end.copy()
              const value = this.current_tok.value
              res.register_advancement()
              this.advance()
              return res.success(new NumberNode(value, pos_start, pos_end))
          } else if (this.current_tok.type == TT_STRING){
              const pos_end = this.current_tok.pos_end.copy()
              const value = this.current_tok.value
              res.register_advancement()
              this.advance()
              return res.success(new StringNode(value, pos_start, pos_end))
          } else if (this.current_tok.type == TT_RPAREN){
              res.register_advancement()
              this.advance()
              const expr = res.register(this.expr())
              if (res.error){ return res }
              if (this.current_tok.type != TT_LPAREN){
                  return res.failure(new InvalidSyntaxError(
                      pos_start, this.current_tok.pos_end,
                      "Expected ')'"
                  ))
              }
              res.register_advancement()
              this.advance()
              return res.success(expr)
          } else if (this.current_tok.matches(TT_KEYWORD, 'IF')){
              const expr = res.register(this.if_expr())
              if (res.error){ return res }
              return res.success(expr)
          } else if (this.current_tok.matches(TT_KEYWORD, 'while')){
              const expr = res.register(this.while_expr())
              if (res.error){ return res }
              return res.success(expr)
          } else if (this.current_tok.matches(TT_KEYWORD, 'run')){
              const expr = res.register(this.run_expr())
              if (res.error){ return res }
              return res.success(expr)
          } else if (this.current_tok.matches(TT_KEYWORD, 'every')){
              const expr = res.register(this.every_expr())
              if (res.error){ return res }
              return res.success(expr)
          } else if (this.current_tok.matches(TT_KEYWORD, 'try')){
              const expr = res.register(this.try_expr())
              if (res.error){ return res }
              return res.success(expr)
          }
          return res.failure(new InvalidSyntaxError(
              pos_start, this.current_tok.pos_end,
              "Expected NUMBER, IDENTIFIER, or '('"
          ))
        }

      try_expr(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start.copy()
          let try_block = null
          let except_block = null
          if (!this.current_tok.matches(TT_KEYWORD, "try")){
              return res.failure(new InvalidSyntaxError(
                  pos_start, this.current_tok.pos_end,
                  "Expected NUMBER, 'try'"
              ))
          }
          res.register_advancement()
          this.advance()
          if (this.current_tok.type == TT_NEWLINE){
              try_block = res.register(this.statements())
              if (res.error){ return res }
              if (!this.current_tok.matches(TT_KEYWORD, "except")){
                  return res.failure(new InvalidSyntaxError(
                      pos_start, this.current_tok.pos_end,
                      "Expected 'except'"
                  ))
              }
              res.register_advancement()
              this.advance()
              except_block = res.register(this.statements())
              if (res.error){ return res }
              if (!this.current_tok.matches(TT_KEYWORD, "end")){
                  return res.failure(new InvalidSyntaxError(
                      pos_start, this.current_tok.pos_end,
                      "Expected 'end'"
                  ))
              }
              res.register_advancement()
              this.advance()
              return res.success(new TryNode(try_block, except_block, false, pos_start, this.current_tok.pos_end))
          }
          try_block = res.register(this.expr())
          if (res.error){ return res }
          if (!this.current_tok.matches(TT_KEYWORD, "except")){
              return res.failure(new InvalidSyntaxError(
                  pos_start, this.current_tok.pos_end,
                  "Expected 'except'"
              ))
          }
          res.register_advancement()
          this.advance()
          except_block = res.register(this.expr())
          if (res.error){ return res }
          return res.success(new TryNode(try_block, except_block, true, pos_start, this.current_tok.pos_end))
        }

      every_expr(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start.copy()
          let may_return = true
          let times = null
          let body = null
          if (!this.current_tok.matches(TT_KEYWORD, 'every')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'every'"
              ))
          }
          res.register_advancement()
          this.advance()
          if (!this.current_tok.matches(TT_KEYWORD, 'time')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'time'"
              ))
          }
          res.register_advancement()
          this.advance()
          if (!this.current_tok.matches(TT_KEYWORD, 'in')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'in'"
              ))
          }
          res.register_advancement()
          this.advance()
          times = res.register(this.expr())
          if (res.error){ return res }
          if (!this.current_tok.matches(TT_KEYWORD, 'times')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'times'"
              ))
          }
          res.register_advancement()
          this.advance()
          if (this.current_tok.type == TT_NEWLINE){
              may_return = false
              body = res.register(this.statements())
              if (res.error){ return res }
              if (!this.current_tok.matches(TT_KEYWORD, 'end')){
                  return res.failure(new InvalidSyntaxError(
                      this.current_tok.pos_start, this.current_tok.pos_end,
                      "Expected 'end'"
                  ))
              }
              res.register_advancement()
              this.advance()
          } else {
              body = res.register(this.expr())
              if (res.error){ return res }
          }
          return res.success(new EveryNode(times, body, may_return, pos_start, this.current_tok.pos_end.copy()))
      }


      run_expr(){
          const res = new ParseResult()
          const pos_start = this.current_tok.pos_start.copy()
          let fn = null
          if (!this.current_tok.matches(TT_KEYWORD, 'run')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'run'"
              ))
          }
          res.register_advancement()
          this.advance()
          fn = res.register(this.expr())
          if (res.error){ return res }
          return res.success(new RunNode(fn, pos_start, this.current_tok.pos_end.copy()))
        }

      if_expr(){
          const res = new ParseResult()
          const cases = []
          let else_case = null
          const pos_start = this.current_tok.pos_start.copy()
          if (!this.current_tok.matches(TT_KEYWORD, 'IF')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'IF'"
              ))
          }
          res.register_advancement()
          this.advance()
          let condition = res.register(this.expr())
          if (res.error){ return res }
          if (!this.current_tok.matches(TT_KEYWORD, 'THEN')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'THEN'"
              ))
          }
          res.register_advancement()
          this.advance()
          let expr = res.register(this.statement())
          if (res.error){ return res }
          cases.push([condition, expr])
          while (this.current_tok.matches(TT_KEYWORD, 'ELSEIF')){
              res.register_advancement()
              this.advance()
              let condition = res.register(this.expr())
              if (res.error){ return res }
              if (!this.current_tok.matches(TT_KEYWORD, 'THEN')){
                  return res.failure(new InvalidSyntaxError(
                      this.current_tok.pos_start, this.current_tok.pos_end,
                      "Expected 'THEN'"
                  ))
              }
              res.register_advancement()
              this.advance()
              let expr = res.register(this.statement())
              if (res.error) { return res }
              cases.push([condition, expr])
            }
          if (this.current_tok.matches(TT_KEYWORD, 'ELSE')){
              res.register_advancement()
              this.advance()
              else_case = res.register(this.statement())
          }
          return res.success(new IfNode(cases, else_case, pos_start, this.current_tok.pos_end.copy()))
        }

      while_expr(){
          const res = new ParseResult()
          let condition = null
          let body = null
          const pos_start = this.current_tok.pos_start.copy()
          if (!this.current_tok.matches(TT_KEYWORD, 'while')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'while'"
              ))
          }
          res.register_advancement()
          this.advance()
          condition = res.register(this.expr())
          if (res.error){ return res }
          body = res.register(this.statements())
          if (res.error){ return res }
          if (!this.current_tok.matches(TT_KEYWORD, 'end')){
              return res.failure(new InvalidSyntaxError(
                  this.current_tok.pos_start, this.current_tok.pos_end,
                  "Expected 'end'"
              ))
          }
          res.register_advancement()
          this.advance()
          return res.success(new WhileNode(condition, body, pos_start, this.current_tok.pos_end.copy()))
        }


}

module.exports = {Parser}
