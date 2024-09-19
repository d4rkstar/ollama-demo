//--kind nodejs:20
//--web true
const { Ollama } = require('ollama');

async function main(args) {

    const username = 'nuvolaris';
    const password = '8qWZ3kaxaE50z2Y';
    const apihost = 'https://skg00018.k8sgpu.net';

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    function updateOptions(options) {
        const update = { ...options };
        update.headers = {
            ...update.headers,
            Authorization: `Basic ${credentials}`,
        };
        return update;
    }

    const fetcher = function (url, options) {
        return fetch(url, updateOptions(options));
    }

    const ollama = new Ollama({
        host: apihost,
        fetch: fetcher
    })

    let command = args.command || ""

    if (command) {
        switch(command) {
            case 'list':
                const response = await ollama.list();
                return { "body": response.models };
            default:
                return { "body": "No command with that name" };
        }        
    } else {

        let input = args.input || ""
        if (!input) {
            res = {
                "output": "Welcome to the Private LLM demo chat. Choose a model to chat with above.",
                "title": "Open Source LLM Chat",
                "message": "You can chat with an LLM using custom models."
            }
            return { "body": res };

        }

        if (!args.model) {
            return {
                body: {
                    output: "ERROR: missing model, Please choose one."
                }
            };
        }

        let messageInput = {
            model: args.model,
            messages: [{ role: 'user', content: input }],
        }
        
        if (args.images) {
            try {
                const b64Img = await urlToBase64(args.images);
                messageInput.messages[0].images = [ b64Img ];
            }
            catch(e) {
                console.log(e);
            }
        }

        const response = await ollama.chat(messageInput)
        res = extract(response.message.content);
        res['output'] = response.message.content;
        return { "body": res };
    }
}

async function urlToBase64(url) {
    try {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        const base64 = buffer.toString('base64');
        console.log(base64);
        
        return `${base64}`;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error.message);
        return null;
    }
}


function extract(text) {
    const res = {};
    // search for a chess position
    const chessPattern = /(([rnbqkpRNBQKP1-8]{1,8}\/){7}[rnbqkpRNBQKP1-8]{1,8} [bw] (-|K?Q?k?q?) (-|[a-h][36]) \d+ \d+)/g;
    const chessMatches = text.match(chessPattern);
    if (chessMatches && chessMatches.length > 0) {
        res['chess'] = chessMatches[0];
        return res;
    }

    // search for code
    const codePattern = /```(\w+)\n(.*?)```/gs;
    const codeMatches = [...text.matchAll(codePattern)];
    if (codeMatches && codeMatches.length > 0) {
        const match = codeMatches[0];
        if (match[1] === "html") {
            let html = match[2];
            // extract the body if any
            const bodyPattern = /<body.*?>(.*?)<\/body>/gs;
            const bodyMatch = html.match(bodyPattern);
            if (bodyMatch) {
                html = bodyMatch[0];
            }
            res['html'] = html;
            return res;
        }
        res['language'] = match[1];
        res['code'] = match[2];
        return res;
    }
    return res;
}

(async () => {
    try {
        const text = await main({
            command: "list"
        });
        console.log(text);
    } catch (e) {
        // Deal with the fact the chain failed
        console.log(e);
    }
    // `text` is not available here
})();
