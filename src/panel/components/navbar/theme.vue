<template>
  <v-list nav dense>
    <v-list-item @click="toggleTheme">
      <v-list-item-icon>
        <v-icon style="color: rgb(253, 177, 0)" v-if="theme === 'light'">mdi-weather-sunny</v-icon>
        <v-icon style="color: #d0d5d2" v-else>mdi-moon-waxing-crescent</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{theme}}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api'
import { get } from 'lodash-es';

import { getSocket } from 'src/panel/helpers/socket';
import { isUserLoggedIn } from 'src/panel/helpers/isUserLoggedIn';

const socket = getSocket('/core/users', true);

export default defineComponent({
  setup(props, context) {
    const theme = ref('light');

    const toggleTheme = () => {
      const _theme = localStorage.getItem('theme');
      if (_theme === null || _theme === 'light') {
        localStorage.setItem('theme', 'dark')
      }
      if (_theme === 'dark') {
        localStorage.setItem('theme', 'light');
      }
      loadTheme(localStorage.getItem('theme') || 'dark');
    }

    const loadTheme = async (themeArg: string) => {
      if (!['light', 'dark'].includes(themeArg)) {
        console.error(`Unknown theme ${themeArg}, setting light theme`);
        themeArg = 'light';
      }

      context.root.$vuetify.theme.dark = themeArg === 'dark';
      theme.value = themeArg;

      // we need to save users preferred theme
      const user = await isUserLoggedIn(false, false);
      if (user) {
        socket.emit('theme::set', { theme: themeArg, userId: user.id}, () => {});
      }
      localStorage.setItem('theme', themeArg);
    }

    onMounted(async () => {
      const user = await isUserLoggedIn(false, false);
      if (user) {
        socket.emit('theme::get', { userId: user.id }, (err: string | null, themeArg: string | null) => {
          loadTheme(themeArg || get(context.root.$store.state.configuration, 'core.ui.theme', 'light'))
        });
      } else {
        loadTheme(localStorage.getItem('theme') || get(context.root.$store.state.configuration, 'core.ui.theme', 'light'));
      }
    })
    return { theme, toggleTheme };
  }
});
</script>