"use strict";

// imports
const {Lexer} = require("./lexer.js");
const {Parser} = require("./parser.js");
const {Context, SymbolTable, Compiler} = require("./compiler.js");

// Code
let context = new Context("<shell>")
let global_symbol_table = new SymbolTable()
global_symbol_table.set("false", "BWTBoolean(0)")
global_symbol_table.set("true", "BWTBoolean(1)")
global_symbol_table.set("nill", "BWTNill()")
context.symbol_table = global_symbol_table

function run(fn, text){
    const lexer = new Lexer(fn, text)
    const {tokens, error} = lexer.generate_tokens()
    if (error) {return [null, error]}
    const parser = new Parser(tokens)
    const ast = parser.parse()
    if (ast.error){ return [null, ast.error] }
    const compiler = new Compiler()
    context.symbol_table = global_symbol_table
    let result
    result = compiler.compile(ast.node, context, true)
    return [result.value, result.error]
}

module.exports = {run}
