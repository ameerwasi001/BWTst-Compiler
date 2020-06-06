const { LETTERS, DIGITS, whitespaces, TT_NUMBER,
   TT_IDENTIFIER, TT_KEYWORD, TT_PLUS, TT_MINUS,
   TT_MUL, TT_DIV, TT_RPAREN, TT_LPAREN,
   TT_EE, TT_NE, TT_GT, TT_LT,
   TT_GTE, TT_LTE, TT_EOF, TT_NOT,
   TT_AND, TT_OR, TT_STRING, TT_EQUALS,
   TT_SARROW, TT_DARROW, TT_COMMA, TT_NEWLINE,
   KEYWORDS, Token
} = require("./tokens.js");

const {
  IllegalCharacterError,
  ExpectedCharError
} = require("./errors");

class Position {
    constructor (idx, ln, col, fn, ftxt){
        this.idx = idx
        this.ln = ln
        this.col = col
        this.fn = fn
        this.ftxt = ftxt
      }

    advance(current_char=null){
        this.idx += 1
        this.col += 1
        if(current_char == '\n'){
            this.ln += 1
            this.col = 0
          }
        return this
      }

    copy(){
        return new Position(this.idx, this.ln, this.col, this.fn, this.ftxt)
      }
}

//Lexer
class Lexer {
    constructor (fn, text){
        this.fn = fn
        this.text = text
        this.pos = new Position(-1, 0, -1, this.fn, this.text)
        this.current_char = null
        this.advance()
      }

    advance(){
        this.pos.advance(this.current_char)
        this.current_char = this.pos.idx < this.text.length ? this.text[this.pos.idx] : null
      }

    make_number(){
        let number_str = ""
        let pos_start = this.pos.copy()
        let e_count = 0
        let dot_count = 0
        let valid_chars = [...DIGITS, ...['e', '.']]
        while((this.current_char != null) && (valid_chars.includes(this.current_char))){
            if (this.current_char == ".") {dot_count+=1}
            if (this.current_char == "e") {e_count+=1}
            if (dot_count == 2) {break}
            if (e_count == 2) {break}
            if ((dot_count == 1) && (e_count == 1)) {break}
            number_str += this.current_char
            this.advance()
          }
        return new Token(TT_NUMBER, number_str, pos_start, this.pos.copy())
      }

    make_identifier(){
        let id_str = ""
        let pos_start = this.pos.copy()
        const valid_chars = [...DIGITS, '_', ...LETTERS]
        while ((this.current_char != null) && (valid_chars.includes(this.current_char))){
            id_str += this.current_char
            this.advance()
        }
        return new Token(KEYWORDS.includes(id_str) ? TT_KEYWORD : TT_IDENTIFIER, id_str, pos_start, this.pos.copy())
      }

    equals_or_ee_or_darrow(){
        let pos_start = this.pos.copy()
        let tok_type = TT_EQUALS
        this.advance()
        if (this.current_char == "="){
            tok_type = TT_EE
            this.advance()
        } else if (this.current_char == ">"){
            tok_type = TT_DARROW
            this.advance()
        }
        return new Token(tok_type, null, pos_start, this.pos.copy())
      }

    greater_or_ge(){
        let pos_start = this.pos.copy()
        let tok_type = TT_GT
        this.advance()
        if (this.current_char == "="){
            tok_type = TT_GTE
            this.advance()
        }
        return new Token(tok_type, null, pos_start, this.pos.copy())
      }

    lesser_or_le(){
        let pos_start = this.pos.copy()
        let tok_type = TT_LT
        this.advance()
        if (this.current_char == "="){
            tok_type = TT_LTE
            this.advance()
        }
        return new Token(tok_type, null, pos_start, this.pos.copy())
      }

    not_or_ne(){
        let pos_start = this.pos.copy()
        let tok_type = TT_NOT
        this.advance()
        if (this.current_char == "="){
            tok_type = TT_NE
            this.advance()
        }
        return new Token(tok_type, null, pos_start, this.pos.copy())
      }

    make_string(){
        let string = ""
        let escape_character = false
        const escape_characters = {
            't': '\t',
            'n': '\n'
        }
        const pos_start = this.pos.copy()
        this.advance()
        while (this.current_char != '"' || escape_character){
            if (escape_character) {
                string += escape_characters[this.current_char] ? escape_characters[this.current_char] : this.current_char
                escape_character = false
            } else {
                if (this.current_char == '\\'){
                    escape_character = true
                } else {
                    string += this.current_char
                }
            this.advance()
          }
        }
        this.advance()
        return new Token(TT_STRING, string, pos_start, this.pos.copy())
      }

    single_arrow_or_minus(){
        let tok_type = TT_MINUS
        let pos_start = this.pos.copy()
        this.advance()
        if (this.current_char == '>'){
            tok_type = TT_SARROW
            this.advance()
        }
        return new Token(tok_type, null, pos_start, this.pos.copy())
      }

    skip_comment(){
        this.advance()
        while (!(this.current_char == null || [';', '\n'].includes(this.current_char))){
            this.advance()
        }
        this.advance()
        return
      }

    generate_tokens(){
        let tokens = []
        while (this.current_char != null){
            if (whitespaces.includes(this.current_char)){
                this.advance()
            } else if (this.current_char == '$'){
                this.skip_comment()
            } else if (this.current_char == '+'){
                tokens.push(new Token(TT_PLUS, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '\r'){
                this.advance()
            } else if (this.current_char == '-'){
                tokens.push(this.single_arrow_or_minus())
            } else if (this.current_char == '*'){
                tokens.push(new Token(TT_MUL, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '/'){
                tokens.push(new Token(TT_DIV, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '('){
                tokens.push(new Token(TT_RPAREN, null, this.pos, null))
                this.advance()
            } else if (this.current_char == ')'){
                tokens.push(new Token(TT_LPAREN, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '='){
                tokens.push(this.equals_or_ee_or_darrow())
            } else if (this.current_char == '>'){
                tokens.push(this.greater_or_ge())
            } else if (this.current_char == '<'){
                tokens.push(this.lesser_or_le())
            } else if (this.current_char == '!'){
                tokens.push(this.not_or_ne())
            } else if (this.current_char == ','){
                tokens.push(new Token(TT_COMMA, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '|'){
                tokens.push(new Token(TT_OR, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '&'){
                tokens.push(new Token(TT_AND, null, this.pos, null))
                this.advance()
            } else if ([';', '\n'].includes(this.current_char)){
                tokens.push(new Token(TT_NEWLINE, null, this.pos, null))
                this.advance()
            } else if (this.current_char == '"'){
                tokens.push(this.make_string())
            } else if (LETTERS.includes(this.current_char)){
                tokens.push(this.make_identifier())
            } else if (DIGITS.includes(this.current_char)){
                tokens.push(this.make_number())
            } else {
                let pos_start = this.pos.copy()
                let char = this.current_char
                this.advance()
                let tokens = []
                let error = new IllegalCharacterError(pos_start, this.pos.copy(), `'${char}'`)
                return {tokens, error}
            }
      }
      tokens.push(new Token(TT_EOF, null, this.pos, null))
      let error = null
      return {tokens, error}
  }
}
 module.exports = {Lexer}
