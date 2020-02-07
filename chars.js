const var_r = /^[A-Za-z]$/
const num_r = /^[\d\.]$/

const OPERATORS = {
    '+': 0,
    '-': 1,
    '*': 2,
    '/': 3,
    '^': 4,
    '(': 5,
    ')': 6,
    "'": 7,
}

const WHITESPACES = {
    ' ':  0,
    '\t': 1,
    '\n': 2,
}

module.exports = {
    var_r,
    num_r,
    OPERATORS,
    WHITESPACES,
}