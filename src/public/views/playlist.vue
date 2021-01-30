<template>
  <v-container ref="playlistRef" style='min-height: 100vh'>
    <h2>{{ translate('menu.playlist') }}</h2>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>

    <v-data-table
      :server-items-length="count"
      hide-default-header
      :loading="state.loading !== $state.success"
      :headers="headers"
      :options.sync="options"
      :items="playlist"
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
import { SongPlaylistInterface } from 'src/bot/database/entity/song';
import { ButtonStates } from 'src/panel/helpers/buttonStates';
import translate from 'src/panel/helpers/translate';

const socket = getSocket('/systems/songs', true);

export default defineComponent({
  components: {
    loading: () => import('src/panel/components/loading.vue'),
  },
  setup(props, ctx) {
    const playlist = ref([] as SongPlaylistInterface[]);
    const search = ref('');

    const options = ref({} as { sortBy?: string, sortDesc?: string, page?: number, itemsPerPage?: number });
    const count = ref(0);

    const playlistRef = ref(null as Element | null);

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    })

    const headers = [
      { value: 'thumbnail', label: '', tdClass: 'fitThumbnail' },
      { value: 'title', label: '' },
    ];

    const refreshPlaylist = () => {
      state.value.loading = ButtonStates.progress;
      socket.emit('current.playlist.tag', (err1: string | null, tag: string) => {
        if (err1) {
          return console.error(err1);
        }
        socket.emit('find.playlist', {
          perPage: (options.value.itemsPerPage ?? 1),
          page: ((options.value.page ?? 1) - 1),
          tag,
          search: search.value,
        }, (err: string | null, items: SongPlaylistInterface[], countOfItems: number) => {
          if (err) {
            return console.error(err);
          }
          count.value = countOfItems;
          for (let item of items) {
            item.startTime = item.startTime ? item.startTime : 0
            item.endTime = item.endTime ? item.endTime : item.length
          }
          playlist.value = items
          state.value.loading = ButtonStates.success;
        })
      })
    }

    const moveTo = () => {
      VueScrollTo.scrollTo(playlistRef.value as Element, 500, {
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

    watch([options, search], () => refreshPlaylist(), { deep: true });

    onMounted(() => {
      refreshPlaylist();
      ctx.root.$nextTick(() => {
        moveTo();
      });
    });

    const generateThumbnail = (videoId: string) => {
      return `https://img.youtube.com/vi/${videoId}/1.jpg`
    }

    const linkTo = (item: SongPlaylistInterface) => {
      console.debug('Clicked', item.videoId);
      window.location.href = `http://youtu.be/${item.videoId}`;
    }

    return {
      linkTo,
      generateThumbnail,
      headers,
      count,
      playlistRef,
      state,
      translate,
      playlist,
      options,
      search,
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
