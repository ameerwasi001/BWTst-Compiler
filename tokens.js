"use strict";

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split("")
const DIGITS = "0123456789".split("")
const whitespaces = ['\t', ' ']

//Tokens
const TT_NUMBER = "NUMBER"
const TT_IDENTIFIER = "IDENTIFIER"
const TT_KEYWORD = "KEYWORD"
const TT_PLUS = "PLUS"
const TT_MINUS = "MINUS"
const TT_MUL = "MUL"
const TT_DIV = "DIV"
const TT_RPAREN = "RPAREN"
const TT_LPAREN = "LPAREN"
const TT_EE = "EE"
const TT_NE = "NE"
const TT_GT = "GT"
const TT_LT = "LT"
const TT_GTE = "GTE"
const TT_LTE = "LTE"
const TT_EOF = "EOF"
const TT_NOT = "NOT"
const TT_AND = "AND"
const TT_OR = "OR"
const TT_STRING = "STRING"
const TT_EQUALS = "EQUALS"
const TT_SARROW = "SARROW"
const TT_DARROW = "DARROW"
const TT_COMMA = "COMMA"
const TT_NEWLINE = "NEWLINE"

const KEYWORDS = [
"IF",
"THEN",
"ELSEIF",
"ELSE",
"while",
"end",
"run",
"every",
"time",
"in",
"times",
"restart",
"stop",
"try",
"except"
]

class Token {
    constructor(type_, value=null, pos_start=null, pos_end=null){
        this.type = type_
        this.value = value
        if (pos_start){
            this.pos_start = pos_start.copy()
            this.pos_end = pos_start.copy()
            this.pos_end.advance()
        }
        if (pos_end){
            this.pos_end = pos_end
          }
    }

    matches(name, value){
        return ((this.type == name) && (this.value == value))
      }

    toString(){
        if (this.value) {return `[${this.type}:${this.value}]`}
        return this.type
      }
}

module.exports = { LETTERS, DIGITS, whitespaces, TT_NUMBER,
   TT_IDENTIFIER, TT_KEYWORD, TT_PLUS, TT_MINUS,
   TT_MUL, TT_DIV, TT_RPAREN, TT_LPAREN,
   TT_EE, TT_NE, TT_GT, TT_LT,
   TT_GTE, TT_LTE, TT_EOF, TT_NOT,
   TT_AND, TT_OR, TT_STRING, TT_EQUALS,
   TT_SARROW, TT_DARROW, TT_COMMA, TT_NEWLINE,
   KEYWORDS, Token
}
