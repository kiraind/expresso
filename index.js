const readline = require('readline-promise').default

const rlp = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
})

const Node = require('./Node.js')

async function main() {
    const rawInput = await rlp.questionAsync('        f(x) = ')
    rlp.close()
    console.log()

    const expression = new Node( rawInput )

    let step = 0
    let comment = 'Input'

    do {
        console.log(
            comment + ':'
        )
        console.log(
            step + '.\tf(x) = ' + expression.toString()
        )
        console.log()

        step += 1
    } while( comment = expression.differentiateStep() )
}

main().catch(console.log)