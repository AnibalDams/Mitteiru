<script>
    import {languages} from '$lib/languagesDic'
    import {language} from '$lib/store'
    export let p 
    export let w
</script>

{@html languages[p][w][$language]}