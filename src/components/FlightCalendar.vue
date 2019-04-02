<template>
  <div>
    <div class="row">

      <div class="col-6">
        <select class="form-control" @change="onRouteChange" v-model="currentRoute">
          <option v-for="route in routeSelection"
            v-bind:key="route.label"
            :value="route">
              {{ route.label }}
          </option>
        </select>
      </div>

      <div class="col-6">
        <select class="form-control"  @change="onMonthChange($event)">
          <option v-for="select in monthsSelection"
            v-bind:key="select.add"
            :value="select.add">
              {{ select.month }}
          </option>
        </select>
      </div>

    </div>

    <table class="table table-bordered table-responsive">
      <thead>
        <tr>
          <th
            v-for="title in daysTitle"
            v-bind:key="title"
            :style="{'width':cellWidth}"
          >
            {{ title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(week, $weekIndex) in days"
          v-bind:key="'week-'+$weekIndex"
        >
          <calendar-day
            v-for="(day, $dayIndex) in week"
            v-bind:key="`day-${$dayIndex}-${$dayIndex}`"
            :day="day"
            @pollCompleted="onPollCompleted($event,$weekIndex, $dayIndex)"
          >
          </calendar-day>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import dateFns from 'date-fns';
import _ from 'lodash';
import FlightCalendarDay from './FlightCalendarDay.vue';
import flightService from '../helpers/flightService';

const DAYS_TITLE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FLIGHT_ROUTES = [
  {
    originPlace: 'SIN-sky',
    destinationPlace: 'KUL-sky',
    label: 'SIN - KUL',
  },
  {
    originPlace: 'KUL-sky',
    destinationPlace: 'SIN-sky',
    label: 'KUL - SIN',
  },
  {
    originPlace: 'KUL-sky',
    destinationPlace: 'SFO-sky',
    label: 'KUL - SFO',
  },
];

export default {
  data() {
    return {
      currentMonth: new Date(),
      daysTitle: DAYS_TITLE,
      monthsSelection: [],
      dayCache: {},
      currentRoute: FLIGHT_ROUTES[0],
      routeSelection: FLIGHT_ROUTES,
    };
  },
  created() {
    this.initMonthsSelection();
  },
  methods: {
    generateDays() {
      const now = this.currentMonth;
      const cacheKey = this.getCacheKey();

      if (this.dayCache[cacheKey]) {
        return this.dayCache[cacheKey];
      }

      const firstDayOfMonth = dateFns.startOfMonth(now);
      const lastDayOfMonth = dateFns.endOfMonth(now);

      let days = dateFns.eachDay(firstDayOfMonth, lastDayOfMonth).map(day => this.getDayObj(day));

      const diffDaysForLastWeek = dateFns.differenceInDays(
        dateFns.lastDayOfWeek(lastDayOfMonth),
        lastDayOfMonth,
      ) + 1;

      for (let i = 1; i <= diffDaysForLastWeek; i += 1) {
        const day = dateFns.addDays(lastDayOfMonth, i);
        days.push(this.getDayObj(day));
      }

      days = days.reverse();

      for (let i = 1; i <= dateFns.getDay(firstDayOfMonth); i += 1) {
        const day = dateFns.subDays(firstDayOfMonth, i);
        days.push(this.getDayObj(day));
      }

      days = days.reverse();

      this.dayCache[cacheKey] = days;

      return _.chunk(days, 7);
    },

    getDayObj(date) {
      const fullDate = dateFns.format(date, 'YYYY-MM-DD');
      return {
        date,
        fullDate,
        year: dateFns.format(date, 'YYYY'),
        month: dateFns.format(date, 'MM'),
        day: dateFns.format(date, 'DD'),
        isThisMonth: dateFns.isSameMonth(date, this.currentMonth),
        isToday: dateFns.isToday(date),
        isPast: dateFns.isBefore(date, this.currentMonth),
        isFuture: dateFns.isAfter(date, this.currentMonth)
          || dateFns.isSameDay(date, this.currentMonth),
        flightRoute: this.currentRoute,
        results: null,
      };
    },

    initMonthsSelection() {
      const now = new Date();
      const yearEnd = dateFns.endOfYear(now);

      this.monthsSelection = [];
      const diffMonths = dateFns.differenceInMonths(yearEnd, new Date());

      for (let i = 0; i < diffMonths; i += 1) {
        this.monthsSelection.push({
          add: i,
          month: dateFns.format(dateFns.addMonths(now, i), 'MMM'),
        });
      }
    },

    onMonthChange(e) {
      const newMonth = dateFns.addMonths(new Date(), e.target.value);
      const now = new Date();

      flightService.cancel();
      if (dateFns.isSameMonth(newMonth, now)) {
        this.currentMonth = now;
      } else {
        this.currentMonth = dateFns.startOfMonth(newMonth);
      }

      this.generateDays();
    },

    onRouteChange() {
      flightService.cancel();

      this.generateDays();
    },

    onPollCompleted({ results, day }, weekIndex, dayIndex) {
      const index = weekIndex * 7 + dayIndex;
      const cacheKey = this.getCacheKey(day.date);
      this.dayCache[cacheKey][index].results = results;
    },

    getCacheKey(month = null) {
      const monthToFormat = month || this.currentMonth;

      return `${dateFns.format(monthToFormat, 'YYYY-MM')}-${this.currentRoute.label}`;
    },
  },
  computed: {
    cellWidth() {
      const width = 100 / this.daysTitle.length;
      return `${width}%`;
    },

    days() {
      const cacheKey = this.getCacheKey();

      if (!this.dayCache[cacheKey]) {
        this.generateDays();
      }

      return _.chunk(this.dayCache[cacheKey], 7);
    },
  },
  components: {
    calendarDay: FlightCalendarDay,
  },
};
</script>
