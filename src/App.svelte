<script>
    import TheTime from './components/the-time.svelte';
</script>

<header>
    <h1>There and Here</h1>
</header>
<main>
    <TheTime offset={-5} place="Iowa"/>
    <TheTime offset={2} place="Germany"/>
</main>

<style>
    header, main {
        font-family: Arial, Helvetica, sans-serif;
        width: 95%;
        position: relative;
        display: block;
        margin: 1rem;
    }
    header h1 {
        font-weight: normal;
        align-content: center;
        font-size: 3rem;
    }
</style>