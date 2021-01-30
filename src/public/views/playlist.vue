<template>
  <v-container fluid style="min-height: calc(100vh);" ref="playlistRef">
    <h2>{{ translate('menu.playlist') }}</h2>

    <v-pagination v-model="currentPage" :length="Math.ceil(count / perPage)"/>

    <v-simple-table>
      <template v-slot:default>
        <tbody>
          <tr
            @click="linkTo(item)"
            v-for="item in playlist"
            :key="item.videoId"
          >
            <td>
              <v-img class="fitThumbnail" :src="generateThumbnail(item.videoId)"></v-img>
            </td>
            <td>{{ item.title }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <v-pagination v-model="currentPage" :length="Math.ceil(count / perPage)"/>
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

    const currentPage = ref(1);
    const perPage = ref(25);
    const count = ref(0);

    const playlistRef = ref(null as Element | null);

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    })

    const fields = [
      { key: 'thumbnail', label: '', tdClass: 'fitThumbnail' },
      { key: 'title', label: '' },
      { key: 'buttons', label: '' },
    ];
    const refreshPlaylist = () => {
      state.value.loading = ButtonStates.progress;
      socket.emit('current.playlist.tag', (err1: string | null, tag: string) => {
        if (err1) {
          return console.error(err1);
        }
        socket.emit('find.playlist', { page: (currentPage.value - 1), tag }, (err: string | null, items: SongPlaylistInterface[], countOfItems: number) => {
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

    watch(currentPage, () => refreshPlaylist());

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
      fields,
      perPage,
      count,
      currentPage,
      playlistRef,
      state,
      translate,
      playlist,
    }
  }
});
  </script>

<style>
.table-p-0 td {
  padding: 0 !important;
}
.fitThumbnail {
  width: 100px;
}
</style>
