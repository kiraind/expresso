const functionResolvers = {
    exp:    Math.exp,
    ln:     Math.log,
    sqrt:   Math.sqrt,
    sin:    Math.sin,
    cos:    Math.cos,
    tg:     Math.tan,
    ctg:    x => 1 / Math.tan(x),
    arcsin: Math.asin,
    arccos: Math.acos,
    arctg:  Math.atan,
    arcctg: x => Math.PI/2 - Math.atan(x),
}

module.exports = functionResolvers