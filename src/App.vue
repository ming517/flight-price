<template>
  <div id="app" class="container">
    <FlightCalendar />
  </div>
</template>

<script>
import FlightCalendar from './components/FlightCalendar.vue';

export default {
  name: 'app',
  components: {
    FlightCalendar,
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
