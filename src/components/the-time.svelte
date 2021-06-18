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
    <span class="place">{place}</span>
    <span data-testid="clock" class="clock">{theClock}</span>
</section>

<style>
    section {
        display:block;
        position:relative;
        margin-bottom: 2rem;
    }
    .place {
        font-size: 2rem;
    }
    .clock {
        font-size: 6rem;
        width: max-content;
        display: block;
    }
</style>