<template lang="pug">
  div.navbar.navbar-light.bg-light.fixed-top
    vue-headful(:title='name.toUpperCase() + " @ " + channelName')
    header.w-100
      div.container-fluid
        div.text-left
          a(href="#/" style="line-height: 36px;").blog-header-logo.text-dark
            img(src="/dist/sogebot_large.png")

          small.text-uppercase.channel-name
            | | &nbsp;&nbsp;&nbsp;{{ channelName }}
        div.d-flex.justify-content-end.align-items-center
          theme
          checklist
          user

          b-dropdown(variant="light" toggle-class="text-decoration-none" no-caret)
            template(v-slot:button-content)
              fa(icon="bars")
            b-dropdown-item(@click="joinBot()" variant="success")
              fa(icon="sign-in-alt").mr-2
              | {{ translate('join-channel') }}
            b-dropdown-item(@click="leaveBot()" variant="danger")
              fa(icon="sign-out-alt").mr-2
              | {{ translate('leave-channel') }}
    navmenu
</template>

<script lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBars, faSignInAlt, faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import Vue from 'vue';
import vueHeadful from 'vue-headful';

import { getSocket } from 'src/panel/helpers/socket';
import translate from 'src/panel/helpers/translate';

Vue.component('VueHeadful', vueHeadful);
library.add(faBars, faSignInAlt, faSignOutAlt);

const socket = getSocket('/');

export default defineComponent({
  components: {
    checklist: () => import('./checklist.vue'),
    user:      () => import('./user.vue'),
    navmenu:   () => import('./menu.vue'),
    theme:     () => import('./theme.vue'),
  },
  setup() {
    const name = ref('');
    const channelName = ref('');

    onMounted(() => {
      socket.emit('name', (recvName: string) => name.value = recvName );
      socket.emit('channelName', (recvName: string) => channelName.value = recvName );
    });

    const joinBot = () => socket.emit('joinBot');
    const leaveBot = () => socket.emit('leaveBot');

    return {
      name, channelName, joinBot, leaveBot, translate,
    };
  },
});
</script>