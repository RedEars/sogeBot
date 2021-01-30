<template>
  <v-container fluid fill-height style='padding: 0; max-height: 100vh;'>
    <v-row no-gutters style="height: 100%">
      <v-col cols="12" md="9" lg="9" xl="10">
        <v-alert
          color="red"
          type="error"
          v-if="!isHttps"
        > You need to run this page on HTTPS with valid certificate for this embed to be working. Ask your streamer to run on HTTPS.</v-alert>
        <iframe
          v-else
          :src="videoUrl"
          height="100%"
          width="100%"
          frameborder="0"
          scrolling="no"
          allowfullscreen="true">
        </iframe>
      </v-col>
      <v-col cols="0" md="3" lg="3" xl="2">
        <iframe frameborder="0"
          scrolling="no"
          :src="chatUrl"
          height="100%"
          width="100%">
        </iframe>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from '@vue/composition-api'
import { getSocket } from 'src/panel/helpers/socket';
import { get } from 'lodash-es';

const socket = getSocket('/widgets/chat', true);

export default defineComponent({
  setup(props, ctx) {
    const room = ref('');
    const theme = ref('light');

    onMounted(() => {
      socket.emit('room', (err: string | null, _room: string) => {
        room.value = _room;
      })

      setInterval(() => {
        theme.value = (localStorage.getItem('theme') || get(ctx.root.$store.state, 'configuration.core.ui.theme', 'light'));
      }, 100)
    });

    const isHttps = computed(() => {
      return window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    })

    const videoUrl = computed(() => {
      return `${window.location.protocol}//player.twitch.tv/?channel=${room.value}&autoplay=true&parent=${window.location.hostname}`
    })

    const chatUrl = computed(() => {
      return window.location.protocol
        + '//twitch.tv/embed/'
        + room.value
        + '/chat'
        + (theme.value === 'dark' ? '?darkpopout' : '')
        + (theme.value === 'dark' ? '&parent=' + window.location.hostname : '?parent=' + window.location.hostname)
    });

    return {
      isHttps, videoUrl, chatUrl,
    }
  }
});
</script>