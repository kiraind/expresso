const parser = require('./parser.js')
const {
    OPERATORS,
} = require('./chars.js')
const diffRules = require('./diffRules.js')

const number_r = /^(\d)*(\.(\d)+)?$/
const variable_r = /^[A-Za-z]+$/

const TYPES = {
    ADD:        0,

    MULTIPLY:   1,

    POWER:      2,

    NEGATE:     3,
    FUNCTION:   4,

    CONSTANT:   5,
    VARIABLE:   6,

    DERIVATIVE: 7,
}

class Node {
    constructor(node, type='default', other=null) {
        if(node instanceof Node || node[0] && node[0] instanceof Node) {
            if(type === 'negate') {
                this.type = TYPES.NEGATE
                this.args = [ node ]
                this.meta = {}
            } else if(type === 'derivative') {
                this.type = TYPES.DERIVATIVE
                this.args = [ node ]
                this.meta = {}
            } else if(type === 'function') {
                this.type = TYPES.FUNCTION
                this.args = [ node ]
                this.meta = {
                    name: other,
                }
            } else if(type === 'power') {
                this.type = TYPES.POWER
                this.args = [ node, other ]
                this.meta = {}
            } else if(type === 'multiplication') {
                this.type = TYPES.MULTIPLY
                this.args = [...node]
                this.meta = {
                    powers: other,
                }
            } else if(type === 'addition') {
                this.type = TYPES.ADD
                this.args = [...node]
                this.meta = {
                    signs: other,
                }
            } else if(type === 'default') {
                this.type = node.type
                this.args = node.args
                this.meta = {
                    ...node.meta,
                }
            } else {
                console.log(type)
                throw new Error()
            }

            return
        }

        const tokens = parser(node)

        // If leaf
        if(tokens.length === 1) {
            const token = tokens[0]

            if( number_r.test(token) ) {
                this.type = TYPES.CONSTANT
                this.args = []
                this.meta = {
                    value: parseFloat(token)
                }
            } else if( variable_r.test(token) ) {
                this.type = TYPES.VARIABLE
                this.args = []
                this.meta = {
                    name: token
                }
            }

            return
        }

        // Resolve parenthesis

        const processed = []
        let currentNestingTokens = []
        let depth = 0

        for(let i = 0; i < tokens.length; i += 1) {
            const token = tokens[i]

            if(token === '(') {
                if(depth !== 0) {
                    currentNestingTokens.push('(')
                }

                depth += 1
            } else if(token === ')') {
                depth -= 1

                // if completely leaved nesting
                if(depth === 0) {
                    // console.log('call "' + currentNestingTokens.join(' ') + '"')

                    processed.push(
                        new Node( currentNestingTokens.join(' ') )
                    )

                    currentNestingTokens = []
                } else {
                    currentNestingTokens.push(')')
                }
            } else {
                if(depth === 0) {
                    processed.push( token )
                } else {
                    currentNestingTokens.push( token )
                }
            }
        }

        // console.log( 'processed' )
        // console.log( processed )

        if(depth !== 0) {
            throw new Error('mismatched parenthesis: ' + node)
        }

        // Find constants
        for(let i = 0; i < processed.length; i += 1) {
            if(typeof processed[i] === 'string' && number_r.test( processed[i] )) {
                processed[i] = new Node( processed[i] )
            }
        }

        // Find function calls and variables
        for(let i = 0; i < processed.length; i += 1) {
            if( variable_r.test(processed[i]) ) {
                if(processed[i + 1] instanceof Node) {
                    const fn = new Node(
                        processed[i + 1],
                        'function',
                        processed[i],
                    )
    
                    processed.splice( i, 2, fn )
                } else {
                    // make variable
                    processed[i] = new Node(processed[i])
                }
            }
        }

        // Find derivatives
        for(let i = 0; i < processed.length; i += 1) {
            if(processed[i] === "'") {
                if( processed[i - 1] instanceof Node ) {
                    processed.splice(
                        i - 1,
                        2,
                        new Node(processed[i - 1], type='derivative')
                    )

                    i -= 1
                } else {
                    throw new Error('no argument for derivative')
                }
            }
        }

        // Find unary minuses
        for(let i = 0; i < processed.length; i += 1) {
            if(
                processed[i] === '-' &&
                (
                    processed[i - 1] === undefined ||
                    processed[i - 1] in OPERATORS
                )
            ) {
                if(!processed[i + 1]) {
                    throw new Error('no argument for unary minus')
                }

                if(processed[i + 1] instanceof Node) {
                    processed.splice(
                        i,
                        2,
                        new Node(processed[i + 1], type='negate')
                    )
                } else if(typeof processed[i + 1] === 'string') {
                    processed.splice(
                        i,
                        2,
                        new Node(
                            new Node(processed[i + 1]),
                            type='negate'
                        )
                    )
                }
            }
        }

        // Find powers
        for(let i = processed.length - 2; i > 0; i -= 1) {
            if(processed[i] === '^') {
                if(processed[i - 1] instanceof Node && processed[i + 1] instanceof Node) {
                    processed.splice(
                        i - 1,
                        3,
                        new Node(
                            processed[i - 1],
                            type='power',
                            processed[i + 1],
                        )
                    )

                    i -= 1
                } else {
                    throw new Error('no argument for power')
                }
            }
        }

        // Find multiplication and division
        for(let i = 1; i < processed.length - 1; i += 1) {
            if(processed[i] === '*' || processed[i] === '/') {
                if(!(
                    processed[i - 1] instanceof Node &&
                    processed[i + 1] instanceof Node
                )) {
                    throw new Error('no argument for multiplication/division')
                }

                const begin = i - 1
                let length = 1

                const chain = [
                    processed[i - 1]
                ]
                const power = [
                    true
                ]
                
                for(; i < processed.length - 1; i += 2) {
                    if(
                        (
                            processed[i] === '*' ||
                            processed[i] === '/'
                        ) &&
                        processed[i + 1] instanceof Node
                    ) {
                        // console.log({
                        //     pr: processed[i]
                        // })

                        chain.push(
                            processed[i + 1]
                        )
                        power.push(
                            // if multiply then over line
                            processed[i] === '*'
                        )
                        length += 2
                    } else {
                        break
                    }
                }

                // console.log( 'chain')
                // console.log( chain.map(c => c.meta))

                const mul = new Node(
                    chain,
                    'multiplication',
                    power
                )

                processed.splice(
                    begin,
                    length,
                    mul,
                )

                i = begin
            }
        }

        // console.log(processed)

        // Find addition and subtraction
        for(let i = 1; i < processed.length - 1; i += 1) {
            if(processed[i] === '+' || processed[i] === '-') {
                if(!(
                    processed[i - 1] instanceof Node &&
                    processed[i + 1] instanceof Node
                )) {
                    throw new Error('no argument for addition/subtraction')
                }

                const begin = i - 1
                let length = 1

                const chain = [
                    processed[i - 1]
                ]
                const signs = [
                    true
                ]
                
                for(; i < processed.length - 1; i += 2) {
                    if(
                        (
                            processed[i] === '+' ||
                            processed[i] === '-'
                        ) &&
                        processed[i + 1] instanceof Node
                    ) {
                        chain.push(
                            processed[i + 1]
                        )
                        signs.push(
                            // if add then positive
                            processed[i] === '+'
                        )
                        length += 2
                    } else {
                        break
                    }
                }

                const add = new Node(
                    chain,
                    'addition',
                    signs
                )

                processed.splice(
                    begin,
                    length,
                    add,
                )

                i = begin
            }
        }

        if(processed.length === 1) {
            const node = processed[0]

            this.type = node.type
            this.args = node.args
            this.meta = node.meta
        } else {
            console.log('"' + node + '"')
            console.log( processed )
            throw new Error('Parsing error')
        }
    }

    get defined() {
        if(this.type === TYPES.VARIABLE) {
            return false
        } else if(this.type === TYPES.CONSTANT) {
            return true
        } else {
            return this.args.every( arg => arg.defined )
        }
    }

    normalizeStep() {
        let comment = null

        const search = node => {
            if(comment) {
                return
            }

            let newExpr

            if(
                node.type === TYPES.CONSTANT ||
                node.type === TYPES.VARIABLE
            ) {
                return
            } else if(node.type === TYPES.MULTIPLY || node.type === TYPES.ADD) {
                if(node.args.length === 1) {
                    if(node.type === TYPES.MULTIPLY && !node.meta.powers[0]) {
                        // skip
                    } else {
                        comment = 'Normalize'
                        newExpr = node.args[0].toString()
                    }
                } else {
                    // merge nested multiplications
                    if(
                        node.type === TYPES.MULTIPLY &&
                        node.args.some(arg => arg.type === TYPES.MULTIPLY)
                    ) {
                        const args   = []
                        const powers = []

                        for(let i = 0; i < node.args.length; i += 1) {
                            const arg   = node.args[i]
                            const power = node.meta.powers[i]
        
                            if(arg.type !== TYPES.MULTIPLY) {
                                args.push(arg)
                                powers.push(power)
                            } else {
                                arg.args.forEach( (nestedArg, i) => {
                                    const nestedArgPower = arg.meta.powers[i]

                                    args.push(nestedArg)
                                    powers.push(power ? nestedArgPower : !nestedArgPower)
                                })
                            }
                        }

                        node.args = args
                        node.meta.powers = powers

                        comment = 'Normalize: merge nested multiplications'
                        return
                    }
                }
            } else if(
                node.type === TYPES.NEGATE &&
                node.args[0].type === TYPES.CONSTANT
            ) {
                node.type = TYPES.CONSTANT
                node.meta = {
                    value: -node.args[0].meta.value
                }

                comment = 'Normalize: negate number'
                return
            }

            if(newExpr) {
                const newNode = new Node(newExpr)

                node.type = newNode.type
                node.args = newNode.args
                node.meta = newNode.meta
            } else {
                // go in depth
                for(let i = 0; i < node.args.length; i += 1) {
                    const arg = node.args[i]

                    search(arg)

                    if(comment) {
                        return
                    }
                }
            }
        }

        search(this)

        return comment
    }

    evaluateStep() {
        let comment = null

        const search = node => {
            if(comment) {
                return
            }

            let newExpr

            if(
                node.type === TYPES.CONSTANT ||
                node.type === TYPES.VARIABLE
            ) {
                return
            } else if(node.type === TYPES.MULTIPLY || node.type === TYPES.ADD) {
                if(
                    // count constants
                    node.args.reduce(
                        (cnt, arg) => cnt + (arg.type === TYPES.CONSTANT ? 1 : 0),
                        0
                    ) >= 2
                ) {
                    if(node.type === TYPES.ADD) {
                        let acc = 0
                        
                        const args  = []
                        const signs = []

                        for(let i = 0; i < node.args.length; i += 1) {
                            const arg = node.args[i]

                            if(arg.type === TYPES.CONSTANT) {
                                // if addition
                                if(node.meta.signs[i]) {
                                    acc += arg.meta.value
                                } else {
                                    acc -= arg.meta.value
                                }
                            } else {
                                args.push(arg)
                                signs.push(node.meta.signs[i])
                            }
                        }

                        args.push(
                            new Node( `${Math.abs(acc).toString()}` )
                        )

                        signs.push( acc > 0 )

                        node.args = args
                        node.meta.signs = signs                    
                        comment = 'Сложение / вычитание'
                        return
                    } else if(node.type === TYPES.MULTIPLY) {
                        let acc = 1
                        
                        const args   = []
                        const powers = []

                        for(let i = 0; i < node.args.length; i += 1) {
                            const arg = node.args[i]

                            if(arg.type === TYPES.CONSTANT) {
                                // if over
                                if(node.meta.powers[i]) {
                                    acc *= arg.meta.value
                                } else {
                                    acc /= arg.meta.value
                                }
                            } else {
                                args.push(arg)
                                powers.push(node.meta.powers[i])
                            }
                        }

                        args.push(
                            new Node( `${acc.toString()}` )
                        )

                        powers.push( true )

                        node.args = args
                        node.meta.powers = powers                    
                        comment = 'Умножение / деление'
                        return
                    }
                }
            }

            if(newExpr) {
                const newNode = new Node(newExpr)

                node.type = newNode.type
                node.args = newNode.args
                node.meta = newNode.meta
            } else {
                // go in depth
                for(let i = 0; i < node.args.length; i += 1) {
                    const arg = node.args[i]

                    search(arg)

                    if(comment) {
                        return
                    }
                }
            }
        }

        search(this)

        return comment
    }

    simplifyStep() {
        let comment = null

        const search = node => {
            if(comment) {
                return
            }

            let newExpr

            if(
                node.type === TYPES.CONSTANT ||
                node.type === TYPES.VARIABLE
            ) {
                return
            } else if(node.type === TYPES.MULTIPLY) {
                if(
                    // there are zeros
                    node.args.some( (arg, i) =>
                        node.meta.powers[i] && // over
                        arg.type === TYPES.CONSTANT &&
                        arg.meta.value === 0
                    )
                ) {
                    newExpr = '0'
                    comment = 'Если один из множителей равен нулю, то и прозиведение равно нулю'
                } else if(
                    // there are ones
                    node.args.some( arg =>
                        arg.type === TYPES.CONSTANT &&
                        arg.meta.value === 1
                    )
                ) {
                    const args = [] 
                    const powers = []

                    for(let i = 0; i < node.args.length; i += 1) {
                        const arg = node.args[i]
                        const power = node.meta.powers[i]

                        if(arg.type === TYPES.CONSTANT && arg.meta.value === 1) {
                            // skip
                        } else {
                            args.push(arg)
                            powers.push(power)
                        }
                    }

                    node.args = args
                    node.meta.powers = powers                    
                    comment = 'Умножение или деление на единицу можно опустить'
                    return
                }
            } else if(node.type === TYPES.ADD) {
                if(
                    // there are zeros
                    node.args.some( arg =>
                        arg.type === TYPES.CONSTANT &&
                        arg.meta.value === 0
                    )
                ) {
                    const args = [] 
                    const signs = []

                    for(let i = 0; i < node.args.length; i += 1) {
                        const arg = node.args[i]
                        const sign = node.meta.signs[i]

                        if(arg.type === TYPES.CONSTANT && arg.meta.value === 0) {
                            // skip
                        } else {
                            args.push(arg)
                            signs.push(sign)
                        }
                    }

                    node.args = args
                    node.meta.signs = signs                    
                    comment = 'Сложение с нулем можно опустить'
                    return
                } else if(node.args.some(arg => arg.type === TYPES.ADD)) {
                    // merge nested additions
                    const args   = []
                    const signs = []

                    for(let i = 0; i < node.args.length; i += 1) {
                        const arg   = node.args[i]
                        const sign  = node.meta.signs[i]
    
                        if(arg.type !== TYPES.ADD) {
                            args.push(arg)
                            signs.push(sign)
                        } else {
                            arg.args.forEach( (nestedArg, i) => {
                                const nestedArgSign = arg.meta.signs[i]

                                args.push(nestedArg)
                                signs.push(sign ? nestedArgSign : !nestedArgSign)
                            })
                        }
                    }

                    node.args = args
                    node.meta.signs = signs

                    comment = 'Раскрытие скобок'
                    return
                }
            } else if(node.type === TYPES.POWER) {
                // console.log(node.args)

                if(node.args[0].type === TYPES.CONSTANT) {
                    if(node.args[0].meta.value === 1) {
                        newExpr = '1'
                        comment = 'Единица в любой степени — единица'
                    } else if(node.args[0].meta.value === 0) {
                        newExpr = '0'
                        comment = 'Ноль в любой степени — ноль'
                    }
                } else if(node.args[1].type === TYPES.CONSTANT) {
                    if(node.args[1].meta.value === 1) {
                        comment = 'Единичную степень можно опустить'

                        const arg = node.args[0]

                        node.type = arg.type
                        node.args = arg.args
                        node.meta = arg.meta

                        return
                    } else if(node.args[1].meta.value === 0) {
                        newExpr = '1'
                        comment = 'Что угодно в нулевой степени — единица'
                    }
                }
            }

            if(newExpr) {
                const newNode = new Node(newExpr)

                node.type = newNode.type
                node.args = newNode.args
                node.meta = newNode.meta
            } else {
                // go in depth
                for(let i = 0; i < node.args.length; i += 1) {
                    const arg = node.args[i]

                    search(arg)

                    if(comment) {
                        return
                    }
                }
            }
        }

        search(this)

        return comment
    }

    differentiateStep() {
        let comment = null

        const search = node => {            
            if(comment) {
                return
            }

            if(node.type === TYPES.DERIVATIVE) {
                const fn = node.args[0]
                let newExpr

                if(fn.type === TYPES.CONSTANT) {
                    [newExpr, comment] = diffRules['const'](null, fn.meta)
                } else if(fn.type === TYPES.VARIABLE) {
                    [newExpr, comment] = diffRules['var'](null, fn.meta)
                } else if(fn.type === TYPES.ADD) {
                    [newExpr, comment] = diffRules['+'](fn.args, fn.meta)
                } else if(fn.type === TYPES.MULTIPLY) {
                    [newExpr, comment] = diffRules['*'](fn.args, fn.meta)
                } else if(fn.type === TYPES.POWER) {
                    [newExpr, comment] = diffRules['^'](fn.args, fn.meta)
                } else if(fn.type === TYPES.NEGATE) {
                    [newExpr, comment] = diffRules['neg'](fn.args, fn.meta)
                } else if(fn.type === TYPES.FUNCTION) {
                    if(!diffRules[fn.meta.name]) {
                        throw new Error(`function '${fn.meta.name}' is unknown`)
                    }

                    [newExpr, comment] = diffRules[fn.meta.name](fn.args, fn.meta)
                } else if(fn.type === TYPES.DERIVATIVE) {
                    search( fn )
                    return
                } else {
                    throw new Error()
                }

                const newNode = new Node(newExpr)

                node.type = newNode.type
                node.args = newNode.args
                node.meta = newNode.meta
            } else {
                // go in depth
                for(let i = 0; i < node.args.length; i += 1) {
                    const arg = node.args[i]

                    search(arg)

                    if(comment) {
                        return
                    }
                }
            }
        }

        search(this)

        return comment
    }

    toString() {
        if(this.type === TYPES.VARIABLE) {
            return this.meta.name
        } else if(this.type === TYPES.CONSTANT) {
            return (
                Math.round(this.meta.value * 1000) / 1000
            ).toString()
        } else if(this.type === TYPES.FUNCTION) {
            return `${this.meta.name}(${this.args[0].toString()})`
        } else if(this.type === TYPES.DERIVATIVE) {
            return `(${this.args[0].toString()})'`
        } else if(this.type === TYPES.NEGATE) {
            const arg = this.args[0]
            if( arg.type === TYPES.ADD ) {
                return `-(${arg.toString()})`
            } else {
                return `-${arg.toString()}`
            }
        } else if(this.type === TYPES.POWER) {
            const arg1 = this.args[0]
            const arg2 = this.args[1]

            const arg1s = arg1.type <= TYPES.POWER ? `(${arg1.toString()})` : arg1.toString()
            const arg2s = arg2.type <  TYPES.POWER ? `(${arg2.toString()})` : arg2.toString()

            return `${arg1s}^${arg2s}`
        } else if(this.type === TYPES.ADD) {
            let s = ''

            this.args.forEach( (arg, i) => {
                if( !this.meta.signs[i] ) {
                    // neg
                    s += '- '
                } else {
                    //  pos
                    if(i !== 0) {
                        s += '+ '
                    }
                }

                s += arg.type === TYPES.ADD ? `(${arg.toString()})` : arg.toString()

                if(i !== this.args.length - 1) {
                    s += ' '
                }
            })

            return s
        } else if(this.type === TYPES.MULTIPLY) {
            let s = ''

            this.args.forEach( (arg, i) => {
                if(
                    // all below
                    this.meta.powers.every(pwr => !pwr)
                ) {
                    s += '1 '
                }

                if( !this.meta.powers[i] ) {
                    // div
                    s += '/ '
                } else {
                    // mul
                    if(i !== 0) {
                        s += '* '
                    }
                }

                s += arg.type <= TYPES.MULTIPLY ? `(${arg.toString()})` : arg.toString()

                if(i !== this.args.length - 1) {
                    s += ' '
                }
            })

            return s
        } else {
            return '???'
        }
    }

    toKatex() {
        if(this.type === TYPES.VARIABLE) {
            return this.meta.name
        } else if(this.type === TYPES.CONSTANT) {
            return (
                Math.round(this.meta.value * 1000) / 1000
            ).toString()
        } else if(this.type === TYPES.FUNCTION) {
            if(this.meta.name === 'sqrt') {
                return `\\sqrt{${this.args[0].toKatex()}}`
            }

            return `${this.meta.name}(${this.args[0].toKatex()})`
        } else if(this.type === TYPES.DERIVATIVE) {
            return `(${this.args[0].toKatex()})'`
        } else if(this.type === TYPES.NEGATE) {
            const arg = this.args[0]
            if( arg.type === TYPES.ADD ) {
                return `-(${arg.toKatex()})`
            } else {
                return `-${arg.toKatex()}`
            }
        } else if(this.type === TYPES.POWER) {
            const arg1 = this.args[0]
            const arg2 = this.args[1]

            const arg1s = arg1.type <= TYPES.POWER ? `(${arg1.toKatex()})` : arg1.toKatex()
            const arg2s = arg2.type <  TYPES.POWER ? `(${arg2.toKatex()})` : arg2.toKatex()

            return `${arg1s}^{${arg2s}}`
        } else if(this.type === TYPES.ADD) {
            let s = ''

            this.args.forEach( (arg, i) => {
                if( !this.meta.signs[i] ) {
                    // neg
                    s += '- '
                } else {
                    //  pos
                    if(i !== 0) {
                        s += '+ '
                    }
                }

                s += arg.type === TYPES.ADD ? `(${arg.toKatex()})` : arg.toKatex()

                if(i !== this.args.length - 1) {
                    s += ' '
                }
            })

            return s
        } else if(this.type === TYPES.MULTIPLY) {
            const gs = this.args.filter(
                (_, i) =>  this.meta.powers[i]
            ).map(arg => arg.toKatex())

            const hs = this.args.filter(
                (_, i) => !this.meta.powers[i]
            ).map(arg => arg.toKatex())

            if(gs.length > 0 && hs.length > 0) {
                return `\\frac{${gs.join(' \\cdot ')}}{${hs.join(' \\cdot ')}}`
            } else if(gs.length > 0 && hs.length === 0) {
                return gs.join(' \\cdot ')
            } else {
                return `\\frac{1}{${hs.join(' \\cdot ')}}`
            }
        } else {
            return '???'
        }
    }
}

module.exports = Node