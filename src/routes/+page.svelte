<script>
    import "../app.css";

    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { sineInOut } from "svelte/easing";

    import Navigation from "../lib/components/Navigation.svelte";
    import { AppBar, AppShell, getDrawerStore } from "@skeletonlabs/skeleton";

    // Components & Utilities
    import { Modal, Drawer } from "@skeletonlabs/skeleton";
    import { page } from "$app/stores";
    import Chat from "$lib/components/Chat.svelte";
    import Display from "$lib/components/Display.svelte";
    import ModelComboBox from "$lib/components/ModelComboBox.svelte";

    let showSide = false;
    let title = "---";

    function toggleSide() {
        showSide = !showSide;
    }

    const drawerStore = getDrawerStore();

    function drawerOpen() {
        drawerStore.open({});
    }

    let services = {};
    let availableLlamas = [];

    onMount(() => {
        fetch($page.url.href + "api/my/mastrogpt/index")
            .then((x) => x.json())
            .then((data) => {
                for (const service of data["services"]) {
                    let name = "" + service.name;
                    services[name] = service.url;
                }
            })
            .catch((e) => {
                console.log(e);
                alert("ERROR: cannot load index");
            });

        fetch($page.url.href + "api/my/llama/ollama?command=list")
            .then((x)=> x.json())
            .then((data)=> {
                for(const model of data) {
                    availableLlamas.push(model.name);
                }
            })
    });

    let receiveMessage;
    let displayResponse;
    

    let sendMessage = (name) => {
        if (services[name] === "llama/ollama") {
            usingOllama = true;
        } else {
            usingOllama = false;
        }

        let url = $page.url.href + "api/my/" + services[name];
        title = services[name];
        receiveMessage(name, url);
    };

    let chosenLlama;
    let usingOllama = false;
</script>

<!-- Overlays -->
<Drawer><Navigation {services} {sendMessage} /></Drawer>
<Modal />

<!-- (AppShell) -->
<div class="flex h-full w-auto h-full flex-col justify-between">
    <AppShell
        slotSidebarLeft="bg-surface-500/5 w-0 lg:w-64"
        slotPageHeader="lg:hidden"
        regionPage={"scroll-smooth"}
    >
        <!-- (header) -->
        <svelte:fragment slot="sidebarLeft">
            <Navigation {services} {sendMessage} />
        </svelte:fragment>
        <!-- <svelte:fragment slot="sidebarRight">Sidebar Right</svelte:fragment> -->
        <svelte:fragment slot="pageHeader">
            <AppBar>
                <svelte:fragment slot="trail">
                    <div
                        class="flex flex-row-reverse items-center justify-between w-full"
                    >
                        <button
                            class="btn btn-sm md:mr-4"
                            on:click={drawerOpen}
                        >
                            <span>
                                <svg
                                    viewBox="0 0 100 80"
                                    class="fill-token h-4 w-4"
                                >
                                    <rect width="100" height="20" />
                                    <rect y="30" width="100" height="20" />
                                    <rect y="60" width="100" height="20" />
                                </svg>
                            </span>
                        </button>

                        <span
                            class="font-arista text-2xl font-bold text-surface-600 ml-2"
                        >
                            MastroGPT
                        </span>
                    </div>
                </svelte:fragment>

                <!-- <svelte:fragment slot="trail"><LightSwitch /></svelte:fragment> -->
            </AppBar>
        </svelte:fragment>

        <!-- Content -->
        <div
            class="relative flex flex-col h-full w-full max-h-full overflow-hidden"
        >
            <header
                class="flex justify-between items-center p-2 mt-1 mx-2 bg-surface-500 rounded-xl text-white shadow"
            >
                <div class="flex items-center gap-6">
                    <div class="tracking-wider text-2xl font-bold ml-2">
                        {title}
                    </div>
                    {#if title === "llama/ollama"}
                        <ModelComboBox bind:comboboxValue={chosenLlama} bind:models={availableLlamas} />
                    {/if}
                </div>
                <button
                    class="btn variant-filled-secondary btn-sm md:btn-md rounded-lg tracking-wider mr-1"
                    on:click={toggleSide}
                    >{showSide ? "Close Side View" : "Open Side View"}</button
                >
            </header>
            <div
                class="absolute inset-0 bottom-0 top-[9%] md:top-[10%] lg:top-[9.5%] flex max-w-[1/2] gap-0 overflow-x-clip overflow-y-auto"
            >
                <Chat
                    bind:receiveMessage
                    bind:sideOpened={showSide}
                    {usingOllama}
                    {chosenLlama}
                    sendDisplayData={displayResponse}
                />
                {#if showSide}
                    <div
                        class="h-full w-full"
                        transition:slide={{
                            delay: 0,
                            duration: 100,
                            easing: sineInOut,
                            axis: "x",
                        }}
                    >
                        <Display bind:displayResponse />
                    </div>
                {/if}
            </div>
        </div>
    </AppShell>
</div>

<!-- 
<link rel="stylesheet" href="/css/almond.min.css" />

<link rel="stylesheet" href="/css/index.css" /> -->

<!-- <div id="iframe-container">
    <iframe title="chat" id="chat" src="/chat"></iframe>
    <iframe title="display" id="display" src="/display"></iframe>
</div> -->
