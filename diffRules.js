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
        `Табличная производная exp и домножение на аргумент`
    ],
    'ln': (args, meta) => [
        `(${args[0].toString()})' / (${args[0].toString()})`,
        `Табличная производная ln и домножение на аргумент`
    ],
    'sqrt': (args, meta) => [
        `(${args[0].toString()})' / 2 / sqrt(${args[0].toString()})`,
        `Табличная производная sqrt и домножение на аргумент`
    ],

    'sin': (args, meta) => [
        `cos(${args[0].toString()}) * (${args[0].toString()})'`,
        `Табличная производная sin и домножение на аргумент`
    ],
    'cos': (args, meta) => [
        `-sin(${args[0].toString()}) * (${args[0].toString()})'`,
        `Табличная производная cos и домножение на аргумент`
    ],
    'tg': (args, meta) => [
        `(${args[0].toString()})' / cos(${args[0].toString()})^2`,
        `Табличная производная tg и домножение на аргумент`
    ],
    'ctg': (args, meta) => [
        `-(${args[0].toString()})' / sin(${args[0].toString()})^2`,
        `Табличная производная ctg и домножение на аргумент`
    ],

    'arcsin': (args, meta) => [
        `(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Табличная производная arcsin и домножение на аргумент`
    ],
    'arccos': (args, meta) => [
        `-(${args[0].toString()})' / sqrt(1 - (${args[0].toString()})^2)`,
        `Табличная производная arccos и домножение на аргумент`
    ],
    'arctg': (args, meta) => [
        `(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Табличная производная arctg и домножение на аргумент`
    ],
    'arcctg': (args, meta) => [
        `-(${args[0].toString()})' / (1 + (${args[0].toString()})^2)`,
        `Табличная производная arcctg и домножение на аргумент`
    ],
}