const {
    var_r,
    num_r,
    OPERATORS,
    WHITESPACES,
} = require('./chars.js')

const MODES = {
    DEFAULT:   0,
    IN_WORD:   1,
    IN_NUMBER: 2,
}

function parser(str) {
    const tokens = []

    let mode = MODES.DEFAULT
    let curr = ''

    for(let i = 0; i < str.length; i += 1) {
        const char = str[i]

        if(mode === MODES.DEFAULT) {
            if(char in OPERATORS) {
                tokens.push( char )
            } else if( var_r.test(char) ) {
                mode = MODES.IN_WORD

                // rerun iteration
                i -= 1
            } else if( num_r.test(char) ) {
                mode = MODES.IN_NUMBER

                i -= 1
            }
        } else if(mode === MODES.IN_WORD) {
            if( var_r.test(char) ) {
                curr += char
            } else {
                tokens.push(curr)
                curr = ''

                mode = MODES.DEFAULT

                i -= 1
            }
        } else if(mode === MODES.IN_NUMBER) {
            if( num_r.test(char) ) {
                curr += char
            } else {
                tokens.push(curr)
                curr = ''

                mode = MODES.DEFAULT

                i -= 1
            }
        }
    }

    if(curr) {
        tokens.push( curr )
    }

    return tokens
}

module.exports = parser