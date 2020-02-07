// rules of differentiation
module.exports = {
    'const': (args, meta) => [`0`, `Derivative of a constant is 0`],
    'var':   (args, meta) => [`1`, `Derivative of a variable is 1`],
    'neg':   (args, meta) => [
        `-((${args[0].toString()})')`,
        `Converting derivative of negation to negation of derivative`
    ],

    '^': (args, meta) => {
        const g = args[0].toString()
        const h = args[1].toString()

        return [
            `(${h})  *  ((${g})^(${h} - 1))  *  ((${g})')   +   ((${g})^(${h}))  *  ln( ${g} )  *  (${h})'`,
            `Using derivative of power formula`
        ]
    },
    '+': (args, meta) => {
        let str = ''

        args.forEach( (arg, i) => {
            if( !meta.signs[i] ) {
                // neg
                str += '- '
            } else {
                //  pos
                if(i !== 0) {
                    str += '+ '
                }
            }

            str += `(${ arg.toString() })'`

            if(i !== args.length - 1) {
                str += ' '
            }
        })

        return [
            str,
            `Converting derivative of a sum to the sum of the derivatives`
        ]
    },
    '*': (args, meta) => {
        const { powers } = meta

        let str = ''

        const productDerivative = factors => {
            const addendsStrings = []
            
            for(let i = 0; i < factors.length; i += 1) {
                // for each addend
                const factorsStrings = []

                factorsStrings.push( `((${ factors[i].toString() })')` )

                for(let j = 0; j < factors.length; j += 1) {
                    if(j !== i) {
                        factorsStrings.push( `(${ factors[j].toString() })` )
                    }
                }

                addendsStrings.push(`(${
                    factorsStrings.join(' * ')
                })`)
            }
            
            return addendsStrings.join(' + ')
        }

        if( powers.every(power => power) ) {
            // all are multiplications
            return [
                productDerivative(args),
                `Using generalized power rule`
            ]
        } else if( powers.every(power => !power) ) {
            // all are divisors
            return [
                `1 / (${ productDerivative(args) })`,
                `Using generalized power rule on divisors`
            ]
        } else {
            // mixed
            
            // g(x) / h(x) -- separation
            const g = args.filter(
                (_, i) =>  powers[i]
            ).map(
                factor => `(${factor.toString()})`
            ).join(' * ')

            const h = args.filter(
                (_, i) => !powers[i]
            ).map(
                factor => `(${factor.toString()})`
            ).join(' * ')

            // quotient rule
            return [
                `( (${g})' * ${h} - ${g} * (${h})' ) / ( (${h})^2 )`,
                `Using quotient rule`
            ]
        }
    },

    // functions table
    'exp': (args, meta) => [
        `exp(${args[0].toString()}) * (${args[0].toString()})'`,
        `Using table derivative (exp) and chain rule`
    ],
    'ln': (args, meta) => [
        `(${args[0].toString()})' / (${args[0].toString()})`,
        `Using table derivative (ln) and chain rule`
    ],
    'sqrt': (args, meta) => [
        `(${args[0].toString()})' / 2 / sqrt(${args[0].toString()})`,
        `Using table derivative (sqrt) and chain rule`
    ],

    'sin': (args, meta) => [
        `cos(${args[0].toString()}) * (${args[0].toString()})'`,
        `Using table derivative (sin) and chain rule`
    ],
    'cos': (args, meta) => [
        `-sin(${args[0].toString()}) * (${args[0].toString()})'`,
        `Using table derivative (cos) and chain rule`
    ],
    'tg': (args, meta) => [
        `(${args[0].toString()})' / cos(${args[0].toString()})^2`,
        `Using table derivative (tg) and chain rule`
    ],
    'ctg': (args, meta) => [
        `-(${args[0].toString()})' / sin(${args[0].toString()})^2`,
        `Using table derivative (ctg) and chain rule`
    ],

    'arcsin': (args, meta) => [
        `(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Using table derivative (arcsin) and chain rule`
    ],
    'arccos': (args, meta) => [
        `-(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Using table derivative (arccos) and chain rule`
    ],
    'arctg': (args, meta) => [
        `(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Using table derivative (arctg) and chain rule`
    ],
    'arcctg': (args, meta) => [
        `-(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Using table derivative (arcctg) and chain rule`
    ],
}