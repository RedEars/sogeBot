<template>
  <v-list nav dense>
    <v-list-item :key="item.name" v-for="item of menu" :href="'#/' + item.id.replace(/\./g, '/')">
      <v-list-item-icon>
        <v-icon>{{icons.get(item.name)}}</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{translate('menu.' + item.name)}}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api'

import { getSocket } from 'src/panel/helpers/socket';
import translate from 'src/panel/helpers/translate';
import type { menuPublic } from 'src/bot/helpers/panel';

const socket = getSocket('/');

const icons = new Map<string, string>([
  ['dashboard', 'mdi-view-dashboard'],
  ['playlist', 'mdi-playlist-music'],
  ['quotes', 'mdi-comment-quote'],
  ['songs', 'mdi-playlist-play'],
]);

export default defineComponent({
  setup() {
    const menu = ref([] as typeof menuPublic);

    onMounted(async () => {
      // Workaround for touch screens - https://github.com/mdbootstrap/perfect-scrollbar/issues/867
      if (typeof (window as any).DocumentTouch === 'undefined') {
        (window as any).DocumentTouch = HTMLDocument
      }

      socket.emit('menu::public', (err: string | null, data: typeof menuPublic) => {
        if (err) {
          return console.error(err);
        }
        console.groupCollapsed('menu::menu::public');
        console.log({data});
        console.groupEnd();
        for (const item of data.sort((a, b) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name))
        })) {
          menu.value.push(item);
        }
      });
    });
  return { menu, translate, icons }
  }
})
</script>
<style>
.ps__rail-x {
  height: 0;
  position: relative;
  top: 2px;
}
.ps__thumb-x {
  height: 4px;
}
.ps__rail-x:hover > .ps__thumb-x, .ps__rail-x:focus > .ps__thumb-x, .ps__rail-x.ps--clicking .ps__thumb-x {
  height: 6px;
}
</style>