<script lang="ts">
    import {
        ListBox,
        ListBoxItem,
        popup,
        type PopupSettings,
    } from "@skeletonlabs/skeleton";

    export let comboboxValue: string = "mistral";
    export let models: string[] = [
        "codellama",
        "falcon",
        "llama2-uncensored",
        "llama3",
        "magicoder",
        "medllama2",
        "mistral",
        "vicuna",
    ];

    const popupCombobox: PopupSettings = {
        event: "click",
        target: "popupCombobox",
        placement: "bottom",
        closeQuery: ".listbox-item",
    };
</script>

<button
    class="btn variant-filled-tertiary w-48 justify-between h-8"
    use:popup={popupCombobox}
>
    <span class="capitalize">{comboboxValue ?? "Trigger"}</span>
    <span>↓</span>
</button>

<div
    class="card w-48 shadow-xl py-2 z-50 bg-surface-400"
    data-popup="popupCombobox"
>
    <ListBox rounded="rounded-none">
        {#each models as model}
            <ListBoxItem bind:group={comboboxValue} name="model" value={model}>
                {model}
            </ListBoxItem>
        {/each}
    </ListBox>
    <div class="arrow bg-surface-100-800-token" />
</div>
