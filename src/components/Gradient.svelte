<script>
    export let positionValue = 0
</script>

<span
class="gradient"
style={`background-position: 100% ${positionValue}%;`}

></span>

<style>
        span.gradient {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0%;
        left: 0%;
        right: 0%;
        bottom: 0%;
        border-radius: 5px;
        background-image: linear-gradient(to top, #000, transparent 70%);
        background-size: 200% 200%;
        z-index: 3;
        transition: 0.1s;
    }

</style>