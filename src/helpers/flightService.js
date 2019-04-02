import axios, { CancelToken } from 'axios';

let source = CancelToken.source();

const HOST = 'https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices';
const encodeForm = data => Object.keys(data)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
  .join('&');


const headers = {
  'X-RapidAPI-Key': process.env.VUE_APP_RAPID_API_KEY,
};

const DEFAULT_FLIGHT_DATA = {
  country: 'US',
  currency: 'USD',
  locale: 'en-US',
  adults: 1,
  outboundDate: '',
  originPlace: '',
  destinationPlace: '',
};

export default {
  async getSession(flightData) {
    const data = Object.assign(DEFAULT_FLIGHT_DATA, flightData);
    const results = await axios.post(`${HOST}/pricing/v1.0`,
      encodeForm(data), {
        headers,
        cancelToken: source.token,
      });
    if (results.status !== 201) {
      console.log('status error');
      return null;
    }
    return results.headers.location.split('/').reverse()[0];
  },

  async getResults(session) {
    const results = await axios.get(`${HOST}/pricing/uk2/v1.0/${session}`, {
      params: {
        sortType: 'price',
        pageSize: 1,
        pageIndex: 0,
        sortOrder: 'asc',
      },
      headers,
      cancelToken: source.token,
    });
    if (results.status !== 200) {
      return null;
    }

    return results.data;
  },

  async startPolling(flightData, callback) {
    const session = await this.getSession(flightData);
    this.pollPrice(session, callback);
  },

  async pollPrice(session, callback) {
    const results = await this.getResults(session);
    if (results.Status === 'UpdatesPending') {
      // poll the result after 1.5 second
      setTimeout(() => this.pollPrice(session, callback), 1500);
    } else if (callback) {
      callback(results);
    }
  },
  cancel() {
    source.cancel('cancel request');
    source = CancelToken.source();
  },
};
