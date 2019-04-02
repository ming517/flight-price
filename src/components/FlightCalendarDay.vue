<template>
    <td
      :class="{'disabled': !isShowPrice}"
    >
      <div :class="{'today': day.isToday}"> {{ day.day }} </div>

      <BallClipRotateLoader size="10px" color="#1533ab" v-if="!pollCompleted"/>

      <div class="price-wrapper" v-if="isShowPrice && pollCompleted">
        <div>
          {{ cheapestPrice }} {{ currency }}
        </div>
        <a :href="priceDetailsLink" target="_blank">
          {{ agentName }}
        </a>
      </div>

    </td>
</template>

<script>
import 'vue-loaders/dist/vue-loaders.css';
import { BallClipRotateLoader } from 'vue-loaders';
import _ from 'lodash';
import flightService from '../helpers/flightService';

export default {
  props: {
    day: {
      required: true,
    },
  },
  data() {
    return {
      results: null,
      pollCompleted: true,
    };
  },
  mounted() {
    if (this.isShowPrice) {
      // since we are using frontend to retrieve data, try to reduce the network overload
      // by reuse the retrieved results if have any
      if (this.day.results) {
        this.results = this.day.results;
        return;
      }
      this.getFlight();
    }
  },
  methods: {
    async getFlight() {
      this.pollCompleted = false;

      flightService.startPolling({
        outboundDate: `${this.day.year}-${this.day.month}-${this.day.day}`,
        originPlace: this.day.flightRoute.originPlace,
        destinationPlace: this.day.flightRoute.destinationPlace,
      }, (results) => {
        this.pollCompleted = true;
        this.results = results;
        this.$emit('pollCompleted', { results, day: this.day });
      });
    },
  },
  computed: {
    itinerary() {
      return this.results ? this.results.Itineraries[0] : null;
    },
    pricingOption() {
      if (!this.results) {
        return null;
      }

      return this.itinerary ? this.itinerary.PricingOptions[0] : null;
    },
    cheapestPrice() {
      return this.pricingOption ? this.pricingOption.Price : 0;
    },
    agentData() {
      if (!this.results) {
        return null;
      }
      const agents = this.results.Agents;
      const agentId = this.pricingOption.Agents[0];
      return _.find(agents, { Id: agentId });
    },
    agentName() {
      return this.agentData ? this.agentData.Name : null;
    },
    priceDetailsLink() {
      if (!this.pricingOption) {
        return null;
      }
      return this.pricingOption ? this.pricingOption.DeeplinkUrl : '#';
    },
    currency() {
      return this.results ? this.results.Query.Currency : null;
    },
    isShowPrice() {
      return (this.day.isToday && this.day.isThisMonth)
        || (this.day.isThisMonth && this.day.isFuture);
    },
  },
  watch: {
    day(newValue, oldValue) {
      this.pollCompleted = true; // reset
      if (!oldValue) {
        return false;
      }

      if (newValue.results) {
        this.results = newValue.results;
        return true;
      }

      if (this.isShowPrice) {
        this.getFlight();
      }

      return true;
    },
  },
  components: {
    BallClipRotateLoader,
  },
};
</script>

<style scoped>
.disabled{
  background-color: #f1f1f1;
  color: #a9a5a5;
}

.today{
  background-color: #28a745;
  color: white;
  font-weight: bold;
  border-radius: 50px;
}

.price-wrapper{
  font-size: 12px;
  color: #1533ab;
}
</style>
