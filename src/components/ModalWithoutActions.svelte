<script>

    export let showModal;
    let dialog;
    export let onClose


    $: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->



<dialog
    bind:this={dialog}
    on:close={() => {
        showModal = false 
        onClose()}}
    on:click|self={() => dialog.close()}
>
    <div on:click|stopPropagation>
        <slot name="header" />
        <hr />
        <slot />
       
    </div>
</dialog>

<style>
    dialog {
        max-width: 32em;
        border-radius: 5px;
        border: none;
        padding-left: 20px;
        padding-right: 20px;
        margin: auto;

        box-shadow: 4px 4px 0px black;
    }
    dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }

    dialog > div {
        padding: 1em;
    }
    dialog[open] {
        animation: zoom 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes zoom {
        from {
            transform: scale(0.95);
        }
        to {
            transition: scale(1);
        }
    }

    dialog[open]::backdrop {
        animation: fade 0.05s ease-out;
    }

    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    .actions{
        margin-top:10px;
        display: flex;
        justify-content: flex-end;
    }
</style>
