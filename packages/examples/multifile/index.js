//--web true
//--kind nodejs:default

const hello = require("./hello")

function main(args) { 
    return { 
        body: hello(args)
    }
}

module.exports = main