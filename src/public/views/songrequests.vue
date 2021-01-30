<template>
  <v-container ref="songrequestsRef" style='min-height: 100vh'>
    <h2>{{ translate('song-requests') }}</h2>

    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>

    <v-data-table
      hide-default-header
      hide-default-footer
      :search="search"
      :loading="state.loading !== $state.success"
      :headers="headers"
      :items="requests"
      @click:row="linkTo($event)"
    >
      <template v-slot:[`item.thumbnail`]="{ item }">
        <v-img class="fitThumbnail" :src="generateThumbnail(item.videoId)"></v-img>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from '@vue/composition-api'
import VueScrollTo from 'vue-scrollto';

import { getSocket } from 'src/panel/helpers/socket';
import { SongRequestInterface } from 'src/bot/database/entity/song';
import { ButtonStates } from 'src/panel/helpers/buttonStates';
import translate from 'src/panel/helpers/translate';

const socket = getSocket('/systems/songs', true);

export default defineComponent({
  setup(props, ctx) {
    const requests = ref([] as SongRequestInterface[]);
    const search = ref('');

    const songrequestsRef = ref(null as Element | null);

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    });

    const headers = [
      { value: 'thumbnail', label: '', tdClass: 'fitThumbnail' },
      { value: 'title', label: '' },
      { value: 'username', label: '' },
    ];

    const moveTo = () => {
      VueScrollTo.scrollTo(songrequestsRef.value as Element, 500, {
        container: 'body',
        force: true,
        onDone: function() {
          const scrollPos = window.scrollY || document.getElementsByTagName("html")[0].scrollTop;
          if (scrollPos === 0) {
            setTimeout(() => moveTo(), 100);
          }
        }
      })
    }

    watch([search], () => refresh(), { deep: true });

    onMounted(() => {
      refresh();
      ctx.root.$nextTick(() => {
        moveTo();
      });
    });
    const refresh = () => {
      state.value.loading = ButtonStates.progress;
      setInterval(() => {
        socket.emit('songs::getAllRequests', {}, (err: string | null, items: SongRequestInterface[]) => {
          console.debug('Loaded', {requests: items})
          requests.value = items
          state.value.loading = ButtonStates.success;
        })
      }, 2000)
    };

    const generateThumbnail = (videoId: string) => {
      return `https://img.youtube.com/vi/${videoId}/1.jpg`
    }

    const linkTo = (item: SongRequestInterface) => {
      console.debug('Clicked', item.videoId);
      window.location.href = `http://youtu.be/${item.videoId}`;
    }

    return {
      search,
      generateThumbnail,
      linkTo,
      headers,
      requests,
      songrequestsRef,
      state,
      translate,
    }
  }
});
</script>

<style>
.fitThumbnail {
  width: 100px;
  margin: 2px;
}
</style>
