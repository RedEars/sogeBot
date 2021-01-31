<template>
  <v-navigation-drawer permanent expand-on-hover app>
    <vue-headful :title='name.toUpperCase() + " @ " + channelName'/>
    <navmenu/>
    <v-divider></v-divider>
    <theme/>

    <template v-slot:append>
      <user/>
    </template>
    </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api'
import Vue from 'vue';
import vueHeadful from 'vue-headful';
Vue.component('vue-headful', vueHeadful);

import { getSocket } from 'src/panel/helpers/socket';

const socket = getSocket('/', true);

export default defineComponent({
  components: {
    user: () => import('src/panel/components/navbar/user.vue'),
    navmenu: () => import('./menu.vue'),
    theme: () => import('src/panel/components/navbar/theme.vue'),
  },
  setup() {
    const name = ref('');
    const channelName = ref('');

    onMounted(() => {
      socket.emit('name', (recvName: string) => name.value = recvName );
      socket.emit('channelName', (recvName: string) => channelName.value = recvName );
    })

    return { name, channelName }
  }
});
</script>