function rfind(text, find, start=0, end=0){
  text = text.split("")
  let res = -1
  end = end || text.length - 1
  for(let i = start; i<end; i++){
    if (text[i] == find){
      res = i
    }
  }
  return res
}

function find(text, find, start=0, end=0){
  text = text.split("")
  end = end || text.length - 1
  res = -1
  for(let i = start; i<end; i++){
    if (text[i] == find){
      return res
    }
  }
  return res
}

function max(a, b){
  if (a>b){
    return a
  } else {
    return b
  }
}

function strings_with_arrows(text, pos_start, pos_end){
    let result = ''

    // Calculate indices
    let idx_start = max(rfind(text, '\n', 0, pos_start.idx), 0)
    idx_start = idx_start < 0 ? idx_start + (text.length - 1) : idx_start
    let idx_end = find(text, '\n', idx_start + 1)
    if (idx_end < 0){ idx_end = text.length }

    // Generate each line
    let line_count = pos_end.ln - pos_start.ln + 1
    for (let i = 0; i<line_count; i++){
        // Calculate line columns
        let line = text.slice(idx_start, idx_end)
        let col_start = i == 0 ? pos_start.col : 0
        let col_end = (i == line_count - 1) ? pos_end.col : line.length - 1

        // Append to result
        result += line + '\n'
        result += ' '.repeat(col_start) + '^'.repeat(col_end - col_start)

        // Re-calculate indices
        idx_start = idx_end
        idx_end = find(text, '\n', idx_start + 1)
        if (idx_end < 0){idx_end = text.length}
    }

    return result.replace('\t', '')
}

module.exports = {strings_with_arrows}
