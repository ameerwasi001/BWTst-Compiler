"use strict";
const readline = require("readline")
const path = require('path')
const fs = require('fs')
const {run} = require("./bwtst")

if (process.argv.length == 4) {
  const file = __dirname + "\\" + process.argv[2]
  fs.readFile(file, (err, data) => {
    if (err){
      throw err;
    }
    const result = run(`${process.argv[2]}`, data.toString())
    if (result[1]){
      console.log(result[1].as_string())
    } else {
      const template = `from Extensions import Helper\nfrom Values import *\nhelper = Helper()\n\n############### Generated Code ####################\n`
      const final_res = template + "\n" + result[0]
      fs.writeFile(process.argv[3], final_res, (err) => err ? err : null)
    }
  })
} else {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  })
  const main = () => {
    rl.question('BWTst > ', (inp) => {
      const result = run("<module>", inp)
      console.log(result[1] ? result[1].as_string() : result[0])
      main()
    })
  }
  main()
}
