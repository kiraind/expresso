// rules of differentiation
module.exports = {
    'const': (args, meta) => [`0`, `Производная константы равна нулю`],
    'var':   (args, meta) => [`1`, `Производная переменной равна единице`],
    'neg':   (args, meta) => [
        `-((${args[0].toString()})')`,
        `Производная минуса это минус производной`
    ],

    '^': (args, meta) => {
        const g = args[0].toString()
        const h = args[1].toString()

        return [
            `(${h})  *  ((${g})^(${h} - 1))  *  ((${g})')   +   ((${g})^(${h}))  *  ln( ${g} )  *  (${h})'`,
            `Формула производной возведения в степень`
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
            `Производная суммы равна сумме производных`
        ]
    },
    '*': (args, meta) => {
        const { powers } = meta

        if(args.length === 1 && !powers[0]) {
            // 1/f(x)
            const f = args.toString()

            return [
                `-( (${f})' / ((${f})^2) )`,
                `Производная обратного числа`
            ]
        }

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
                `Обобщенная формула правила произведения`
            ]
        } else if( powers.every(power => !power) ) {
            // all are divisors
            return [
                `1 / (${ productDerivative(args) })`,
                `Обобщенная формула правила произведения на делителе`
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
                `Формула производной дроби`
            ]
        }
    },

    // functions table
    'exp': (args, meta) => [
        `exp(${args[0].toString()}) * (${args[0].toString()})'`,
        `Табличная производная <i>exp</i> и домножение на производную аргумента`
    ],
    'ln': (args, meta) => [
        `(${args[0].toString()})' / (${args[0].toString()})`,
        `Табличная производная <i>ln</i> и домножение на производную аргумента`
    ],
    'sqrt': (args, meta) => [
        `(${args[0].toString()})' / 2 / sqrt(${args[0].toString()})`,
        `Табличная производная <i>sqrt</i> и домножение на производную аргумента`
    ],

    'sin': (args, meta) => [
        `cos(${args[0].toString()}) * (${args[0].toString()})'`,
        `Табличная производная <i>sin</i> и домножение на производную аргумента`
    ],
    'cos': (args, meta) => [
        `-sin(${args[0].toString()}) * (${args[0].toString()})'`,
        `Табличная производная <i>cos</i> и домножение на производную аргумента`
    ],
    'tg': (args, meta) => [
        `(${args[0].toString()})' / cos(${args[0].toString()})^2`,
        `Табличная производная <i>tg</i> и домножение на производную аргумента`
    ],
    'ctg': (args, meta) => [
        `-(${args[0].toString()})' / sin(${args[0].toString()})^2`,
        `Табличная производная <i>ctg</i> и домножение на производную аргумента`
    ],

    'arcsin': (args, meta) => [
        `(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Табличная производная <i>arcsin</i> и домножение на производную аргумента`
    ],
    'arccos': (args, meta) => [
        `-(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Табличная производная <i>arccos</i> и домножение на производную аргумента`
    ],
    'arctg': (args, meta) => [
        `(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Табличная производная <i>arctg</i> и домножение на производную аргумента`
    ],
    'arcctg': (args, meta) => [
        `-(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Табличная производная <i>arcctg</i> и домножение на производную аргумента`
    ],
}