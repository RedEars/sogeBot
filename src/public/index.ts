import { library } from '@fortawesome/fontawesome-svg-core';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueCompositionAPI from '@vue/composition-api';
import Vue from 'vue';
import VueRouter from 'vue-router';

import { setLocale } from 'src/bot/helpers/dayjs';
import { ButtonStates } from 'src/panel/helpers/buttonStates';
import { isBotStarted } from 'src/panel/helpers/isBotStarted';
import { isUserLoggedIn } from 'src/panel/helpers/isUserLoggedIn';
import { getConfiguration, getTranslations } from 'src/panel/helpers/socket';
import { store } from 'src/panel/helpers/store';

import vuetify from './vuetify'; // path to vuetify export

Vue.component('fa', FontAwesomeIcon);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(VueCompositionAPI);

/* import widely used components */
Vue.component('panel', () => import('src/panel/components/panel.vue'));
Vue.component('button-with-icon', () => import('src/panel/components/button.vue'));

library.add(faCaretLeft);

export interface Global {
  configuration: any;
}

Vue.use(VueRouter);

const main = async () => {
  Vue.prototype.$state = ButtonStates;
  const router = new VueRouter({
    mode:   'hash',
    base:   __dirname,
    routes: [
      {
        path: '/', name: 'Dashboard', component: () => import('./views/dashboard.vue'), 
      },
      {
        path: '/playlist', name: 'Playlist', component: () => import('./views/playlist.vue'), 
      },
      {
        path: '/songrequests', name: 'SongRequests', component: () => import('./views/songrequests.vue'), 
      },
      {
        path: '/quotes', name: 'Quotes', component: () => import('./views/quotes.vue'), 
      },
    ],
  });

  const VueApp = new Vue({
    store,
    router,
    vuetify,
    components: {
      navbar: () => import('./components/navbar/navbar.vue'),
      twitch: () => import('./components/twitch.vue'),
    },
    template: `
      <v-app id="app">
        <template v-if="$store.state.isUILoaded">
          <navbar/>
          <v-main>
            <twitch/>
            <router-view></router-view>
          </v-main>
        </template>
        <v-overlay :value="!$store.state.isUILoaded" :dark="$vuetify.theme.dark">
          <v-row>
            <v-col class="text-center">
              <v-progress-circular indeterminate size="48"></v-progress-circular>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="font-weight-light">
              {{ $store.state.loadingMsg }}
            </v-col>
          </v-row>
        </v-overlay>
      </v-app>
    `,
  }).$mount('#app');

  VueApp.$vuetify.theme.dark = (localStorage.getItem('theme') || 'dark') === 'dark';

  await isBotStarted();
  await getTranslations();
  store.commit('setLoggedUser', await isUserLoggedIn(false, false));

  const configuration = await getConfiguration();
  store.commit('setConfiguration', configuration);
  setLocale(configuration.lang as string);
  store.commit('setUILoaded');
};

main();
