"use strict";
const {strings_with_arrows} = require("./strings_with_arrows")

class Error {
    constructor(pos_start, pos_end, error_name, details){
        this.pos_start = pos_start
        this.pos_end = pos_end
        this.error_name = error_name
        this.details = details
      }

    as_string(){
        let result = `${this.error_name}: ${this.details}, File ${this.pos_start.fn} in line number ${this.pos_start.ln + 1}`
        result += '\n' + strings_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end)
        return result
      }
}

class IllegalCharacterError extends Error{
    constructor (pos_start, pos_end, details){
        super(pos_start, pos_end, 'Illegal Character:', details)
      }
}

class InvalidSyntaxError extends Error{
    constructor(pos_start, pos_end, details=''){
        super(pos_start, pos_end, 'Syntax Error:', details)
      }
}

class ExpectedCharError extends Error{
    constructor(pos_start, pos_end, details=''){
        super(pos_start, pos_end, 'Expected Character:', details)
      }
}

class RTError extends Error {
    constructor(pos_start, pos_end, context, details=''){
        super(pos_start, pos_end, 'Runtime Error', details)
        this.context = context
      }

    as_string(){
        let result = this.generate_traceback()
        result += `${this.error_name}: ${this.details}`
        result += '\n' + strings_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end)
        return result
      }

    generate_traceback(){
        let result = ''
        let pos = this.pos_start
        let ctx = this.context
        while (ctx){
            result = `File: ${pos.fn}, line: ${(pos.ln+1).toString()} ${ctx.display_name} main\n` + result
            pos = ctx.parent_entry_pos
            ctx = ctx.parent
        }
        return "Error Traceback, (Most recent call last):\n" + result
      }
}

module.exports = {
  Error,
  IllegalCharacterError,
  InvalidSyntaxError,
  ExpectedCharError,
  RTError
}
