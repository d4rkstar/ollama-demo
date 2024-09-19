<script>
    import { marked } from "marked";
    import { afterUpdate } from "svelte";

    export let sideOpened;
    export let sendDisplayData;

    export let chosenLlama = "";
    export let usingOllama;

    let noChoiceYet = true;
    let isThinking = false;
    let counter = 0;

    export const receiveMessage = async (name, url) => {
        // let url = $page.url.href + "api/my/" + services[name];
        noChoiceYet = false;

        //console.log("selected", name, url);
        invoker = new Invoker(name, url);
        messages = [];
        let { answer } = await invoker.invoke("");
        //console.log("starter", starter);
        bot(answer);
    };

    // Globals
    let chatArea;
    let invoker = undefined;
    let messages = [];

    // const displayWindow =
    //     window.parent.document.getElementById("display").contentWindow;

    // Constants
    const BOT_IMG = "/img/robot-mini.png";
    const PERSON_IMG = "/img/human-mini.png";
    const BOT_NAME = "BOT";
    const PERSON_NAME = "YOU";

    // Classes
    class Invoker {
        constructor(name, url) {
            this.name = name;
            this.url = url;
        }

        async invoke(msg, img) {
            // welcome message no input
            if (msg == null) {
                return "Welcome, you have selected " + this.name;
            }
            // no url
            if (this.url == null)
                return "Welcome, please select the chat application you want to use by clicking a  button on top.";
            // prepare a request
            let json = {
                input: msg,
            };

            json["state"] = counter++;

            if (usingOllama) {
                json["model"] = chosenLlama;
            }

            if (img) {
                json["images"] = img;
            }

            // send the request
            return fetch(this.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(json),
            })
                .then((r) => r.json())
                .then((r) => {
                    // got answer from the backend
                    this.state = r.state;
                    let data = r;
                    let output = data.output;
                    delete data["output"];
                    delete data["state"];
                    // displayWindow.postMessage(data);
                    return { answer: output, data };
                })
                .catch((e) => {
                    console.error(e);
                    return `ERROR interacting with ${this.url}`;
                });
        }
    }

    function appendMessage(name, img, side, text) {
        if (text) {
            let html = marked.parse(text);
            messages = [...messages, [side, img, name, html]];
        } else {
            messages = [
                ...messages,
                [side, img, name, "Didn't get a response from the server..."],
            ];
        }
    }

    afterUpdate(() => {
        if (chatArea) {
            chatArea.scroll({ top: chatArea.scrollHeight, behavior: "smooth" });
        }
    });

    function bot(msg) {
        appendMessage(BOT_NAME, BOT_IMG, "left", msg);
    }

    function human(msg) {
        appendMessage(PERSON_NAME, PERSON_IMG, "right", msg, "");        
        input = "";
    }

    function cleanUrl(url) {
    // Strip trailing characters after image extension (if needed)
        return url.replace(/[\s"'<>\{\}\|\^`]+$/, '');
    }

    function parseMessageForImages(input) {
        console.log(`In parseMessageForImages Input is: ${input}`)
        const imageRegex = /https?:\/\/[^\s"'<>\{\}\|\^`]+?\.(jpg|jpeg|png|gif|bmp|webp)(?=[\s"'<>\{\}\|\^`]|$)/gi;
        let imgUrl = undefined;
        // Extract image URLs
        const imageUrls = input.match(imageRegex);
        if (!imageUrls) return;
        const cleanedImageUrls = imageUrls.map(cleanUrl);
        if (cleanedImageUrls.length>0) {
            imgUrl = imageUrls[0];            
        }
        return imgUrl
    }

    function formatDate(date) {
        const h = "0" + date.getHours();
        const m = "0" + date.getMinutes();
        return `${h.slice(-2)}:${m.slice(-2)}`;
    }

    let input = "";

    async function submitForm(event) {
        event.preventDefault();

        if (!input) return;

        let question = input;
        human(input);

        const img = parseMessageForImages(question);
        console.log(`Image is ${img}`);
        if (img) {
            let htmlImg =`<img src="${img}" width="140" />`;
            appendMessage(PERSON_NAME, PERSON_IMG, "right", htmlImg, "");
        }

        if (invoker) {
            isThinking = true;

            console.log("question ", question);
            let { answer, data } = await invoker.invoke(question, img);
            console.log("answer", answer);
            isThinking = false;

            if (answer) {
                bot(answer);
                await display(data);
            } else {
                bot("Didn't get a response from the server...");
            }
        } else {
            bot("Please select a chat from the side menu.");
        }
    }

    async function display(data) {
        const body = await fetch("/api/my/mastrogpt/display", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
            .then((r) => r.text())
            .then((t) => {
                return t;
            })
            .catch((e) => {
                console.log(e);
                return "<h1>Error!</h1><p>Check logs for details.</p>";
            });

        if (body) {
            if (sideOpened) {
                sendDisplayData(body);
            } else {
                bot(body);
            }
        }
    }
</script>

<!-- <svelte:window on:message={handleMessage} /> -->

<!-- <link rel="stylesheet" href="/css/chat.css" /> -->
<div class="relative w-full h-full max-h-full">
    <section
        class="max-h-full h-full flex flex-col border-4 border-bg-black shadow-lg bg-white rounded-xl overflow-x-hidden overflow-y-scroll"
    >
        <main
            id="chat-area"
            bind:this={chatArea}
            class="msger-chat p-8 overflow-x-hidden overflow-y-auto max-h-full h-full scroll-smooth"
        >
            {#if noChoiceYet}
                <div class="msg left-msg">
                    <div class="msg-bubble">
                        <div class="msg-info">
                            <div class="msg-info-name">
                                <div
                                    class="msg-img"
                                    style="background-image: url({BOT_IMG})"
                                ></div>
                                <span>{name}</span>
                            </div>
                            <div class="msg-info-time">
                                {formatDate(new Date())}
                            </div>
                        </div>
                        <div class="msg-text">
                            <h1>Welcome to MastroGPT</h1>
                            <p>
                                Please select the chat you want to use on menu.
                            </p>
                        </div>
                    </div>
                </div>
            {:else}
                {#each messages as [side, img, name, html]}
                    <div class="msg {side}-msg">
                        <div class="msg-bubble">
                            <div class="msg-info">
                                <div class="msg-info-name">
                                    <div
                                        class="msg-img"
                                        style="background-image: url({img})"
                                    ></div>
                                    <span>{name}</span>
                                </div>
                                <div class="msg-info-time">
                                    {formatDate(new Date())}
                                </div>
                            </div>
                            <div class="msg-text">{@html html}</div>
                        </div>
                    </div>
                {/each}
                {#if isThinking}
                    <div class="msg left-msg">
                        <div
                            class="msg-bubble
                            bg-gray-100
                            animate-pulse
                            animate-pulse-slow
                        "
                        >
                            <div class="msg-info">
                                <div class="msg-info-name">
                                    <div
                                        class="msg-img"
                                        style="background-image: url({BOT_IMG})"
                                    ></div>
                                    <span>{BOT_NAME}</span>
                                </div>
                                <div class="msg-info-time">
                                    {formatDate(new Date())}
                                </div>
                            </div>
                            <div class="msg-text">&#8230;</div>
                        </div>
                    </div>
                {/if}
            {/if}
        </main>
        <form class="msger-inputarea" on:submit|preventDefault={submitForm}>
            <input
                bind:value={input}
                type="text"
                class="input bg-gray-100"
                placeholder="Enter your message..."
            />
            <button class="msger-send-btn" on:click={submitForm}>Send</button>
        </form>
    </section>
</div>

<style>
    pre,
    code {
        padding: 30px;
        box-sizing: border-box;
        --moz-box-sizing: border-box;
        --webkit-box-sizing: border-box;
        display: block;
        white-space: pre-wrap;
        white-space: -moz-pre-wrap;
        white-space: -pre-wrap;
        white-space: -o-pre-wrap;
        word-wrap: break-word;
        width: 100%;
        overflow-x: auto;
        max-width: 350px;
    }
    .msger-chat {
        padding: 10px;
        background-color: #fcfcfe;
    }
    .msger-chat::-webkit-scrollbar {
        width: 6px;
    }

    .msger-chat::-webkit-scrollbar-track {
        background: #ddd;
    }

    .msger-chat::-webkit-scrollbar-thumb {
        background: #bdbdbd;
    }

    .msger-inputarea {
        display: flex;
        padding: 10px;
        border-top: var(--border);
        background: #eee;
    }

    .msger-inputarea * {
        padding: 10px;
        border: none;
        border-radius: 3px;
        font-size: 1em;
    }

    .msger-input {
        flex: 1;
        background: #ddd;
    }

    .msger-send-btn {
        margin-left: 10px;
        background: #326699;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.23s;
    }

    .msger-send-btn:hover {
        background: #327799;
    }

    .msger-chat {
        background-color: #fcfcfe;
    }

    .msg-text {
        overflow: auto;
        max-width: 400px;
    }

    .msg {
        display: flex;
        align-items: flex-end;
        margin-bottom: 10px;
    }

    .msg:last-of-type {
        margin: 0;
    }

    .msg-img {
        width: 50px;
        height: 50px;
        margin-right: 10px;
        margin-left: 10px;
        background: #ddd;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-radius: 50%;
    }

    .msg-bubble {
        max-width: 98%;
        padding: 15px;
        border-radius: 15px;
        background: var(--left-msg-bg);
    }

    .msg-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .msg-info-name {
        margin-right: 20px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .msg-info-time {
        font-size: 0.85em;
    }

    .left-msg .msg-bubble {
        border-bottom-left-radius: 0;
    }

    .right-msg {
        flex-direction: row-reverse;
    }

    .right-msg .msg-bubble {
        background: var(--right-msg-bg);
        border-bottom-right-radius: 0;
    }

    :root {
        --body-bg: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        --msger-bg: #fff;
        --border: 2px solid #ddd;
        --left-msg-bg: #ececec;
        --right-msg-bg: #579ffb;
    }

    .msger {
        display: flex;
        flex-flow: column wrap;
        justify-content: space-between;
        width: 100%;
        max-width: 867px;
        margin: 25px 10px;
        height: calc(100% - 50px);
        border: var(--border);
        border-radius: 5px;
        background: var(--msger-bg);
        box-shadow: 0 15px 15px -5px rgba(0, 0, 0, 0.2);
    }

    .msger-header {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-bottom: var(--border);
        background: #eee;
        color: #666;
    }

    .msger-inputarea {
        display: flex;
        padding: 10px;
        border-top: var(--border);
        background: #eee;
    }

    .msger-inputarea * {
        padding: 10px;
        border: none;
        border-radius: 3px;
        font-size: 1em;
    }

    .msger-send-btn {
        margin-left: 10px;
        background: #326699;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.23s;
    }

    .msger-send-btn:hover {
        background: #327799;
    }
</style>
