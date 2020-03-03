const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')

const Node = require('./Node.js')

if(!process.argv[2]) {
    throw new Error('please specify port as argumnet')
}

const port = parseInt(process.argv[2], 10)

http.createServer(function (request, response) {
    const parsedUrl = url.parse(request.url, true)

    const uri = parsedUrl.pathname

    if(uri === '/steps') {
        if(!parsedUrl.query['e']) {
            return
        }

        console.log(parsedUrl.query)

        const expr = decodeURIComponent(parsedUrl.query['e'])

        try {
            const data = JSON.stringify( makeResponse(expr) )

            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(data)
            response.end()
        } catch(e) {
            console.log(e)

            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(`{
                "error": true
            }`)
            response.end()
        }
        
        

        return
    }

    let filename = path.join(process.cwd(), 'static', uri)

    const contentTypesByExtension = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    }

    fs.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, { 'Content-Type': 'text/plain' })
            response.write('404 Not Found\n')
            response.end()
            return
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html'

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'text/plain' })
                response.write(err + '\n')
                response.end()
                return
            }

            const headers = {}
            const contentType = contentTypesByExtension[path.extname(filename)]
            if (contentType) {
                headers['Content-Type'] = contentType
            }
            response.writeHead(200, headers)
            response.write(file, 'binary')
            response.end()
        })
    })
}).listen(port)

console.log('Static file server running at\n  => http://localhost:' + port)

function makeResponse(rawInput) {
    const expression = new Node( rawInput )

    const steps = []

    let step = 0
    let comment = 'Ввод'

    do {
        while(expression.normalizeStep());

        // console.log(expression)

        steps.push({
            comment,
            step,
            expression: expression.toKatex()
        })

        step += 1
    } while(
        comment = expression.simplifyStep() ||
                  expression.evaluateStep() ||
                  expression.differentiateStep()
    )

    return steps
} 