<script>
import { onMount } from 'svelte';

    import clockService from '../services/clockService';

    export let offset = 0;
    export let place = '';
    let theClock = '';
    const tickspeed = 1000;

    onMount(() => {
        setInterval(function() {
            theClock = clockService(offset)
        }, tickspeed);
    });
</script>

<section>
    <span data-testid="clock">{theClock}</span>
    <span>{place}</span>
</section>

<style></style>