<template>
<v-list nav dense>
  <template v-if="isViewerLoaded && $store.state.loggedUser">
    <v-list-item class="px-0">
      <v-list-item-avatar>
        <v-avatar>
          <v-img :src="$store.state.loggedUser.profile_image_url"></v-img>
        </v-avatar>
      </v-list-item-avatar>

      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-width="200"
        offset-x
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            plain
          >
            {{$store.state.loggedUser.login}}
          </v-btn>
        </template>

        <v-card>
          <v-list>
            <v-list-item>
              <v-list-item-avatar>
                <v-avatar>
                  <v-img :src="$store.state.loggedUser.profile_image_url"></v-img>
                </v-avatar>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>{{$store.state.loggedUser.login}}</v-list-item-title>
                <v-list-item-subtitle v-if="viewer.permission">{{viewer.permission.name}}</v-list-item-subtitle>
                <v-list-item-subtitle>
                  <v-chip v-for="k of viewerIs" :key="k"> {{k}} </v-chip>
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <v-btn
                  class="red--text"
                  icon
                  @click="logout"
                >
                  <v-icon>mdi-logout</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-simple-table dense>
            <template v-slot:default>
              <tbody>
                <tr>
                  <td>{{translate('points')}}</td>
                  <td>{{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.points) }}</td>
                </tr>
                <tr>
                  <td>{{translate('messages')}}</td>
                  <td>{{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.messages) }}</td>
                </tr>
                <tr>
                  <td>{{translate('watched-time')}}</td>
                  <td>{{ Intl.NumberFormat($store.state.configuration.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(viewer.watchedTime / 1000 / 60 / 60) }} h</td>
                </tr>
                <tr>
                  <td>{{translate('bits')}}</td>
                  <td>{{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.aggregatedBits) }}</td>
                </tr>
                <tr>
                  <td>{{translate('tips')}}</td>
                  <td>{{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(viewer.aggregatedTips) }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn v-if="isPublicPage && viewer.permission.id === defaultPermissions.CASTERS" href="/">
              {{ translate('go-to-admin') }}
            </v-btn>
            <v-btn v-if="!isPublicPage" href="/public/">
              {{ translate('go-to-public') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-list-item>
  </template>
  <template v-else>
    <v-list-item  class="px-2">
      <v-list-item-icon>
        <v-icon>mdi-account-circle</v-icon>
      </v-list-item-icon>
      <v-list-item-title>
      <v-btn
        @click="login"
        plain
      >
        {{ translate('not-logged-in') }}
      </v-btn></v-list-item-title>
    </v-list-item>
  </template>
  </v-list>
</template>


<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed } from '@vue/composition-api'
import type { Ref } from '@vue/composition-api'

import { getSocket } from 'src/panel/helpers/socket';
import { defaultPermissions } from 'src/bot/helpers/permissions/defaultPermissions'
import { UserInterface } from '../../../bot/database/entity/user';
import { PermissionsInterface } from '../../../bot/database/entity/permissions';
import translate from 'src/panel/helpers/translate';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons'
library.add(faUserCircle);

const socket = getSocket('/core/users', true);
let interval = 0;

export default defineComponent({
  setup(props, context) {
    const menu = ref(false);
    const isViewerLoaded = ref(false);
    const viewer: Ref<(Required<UserInterface> & { aggregatedTips: number; aggregatedBits: number; permission: PermissionsInterface }) | null> = ref(null);
    const viewerIs = computed(() => {
      let status: string[] = [];
      const isArray = ['isFollower', 'isSubscriber', 'isVIP'] as const;
      isArray.forEach((item: typeof isArray[number]) => {
        if (viewer.value && viewer.value[item]) {
          status.push(item.replace('is', ''));
        }
      });
      return status;
    });
    const isPublicPage = computed(() => window.location.href.includes('public'));

    onMounted(() => {
      refreshViewer();
      interval = window.setInterval(() => {
        refreshViewer();
      }, 60000)
    })
    onUnmounted(() => clearInterval(interval));

    const logout = () => {
      socket.emit('logout', {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      });
      localStorage.setItem('code', '');
      localStorage.setItem('accessToken', '');
      localStorage.setItem('refreshToken', '');
      localStorage.setItem('userType', 'unauthorized');
      window.location.assign(window.location.origin + '/login#error=logged+out');
    }
    const login = () => window.location.assign(window.location.origin + '/login');
    const refreshViewer = () => {
      if (typeof context.root.$store.state.loggedUser === 'undefined'|| context.root.$store.state.loggedUser === null) {
        return;
      }
      socket.emit('viewers::findOne', context.root.$store.state.loggedUser.id, (err: string| number, recvViewer: Readonly<Required<UserInterface>> & { aggregatedTips: number; aggregatedBits: number; permission: PermissionsInterface }) => {
        if (err) {
          return console.error(err);
        }
        if (recvViewer) {
          console.log('Logged in as', recvViewer);
          viewer.value = recvViewer;
          isViewerLoaded.value = true;
        } else {
          console.error('Cannot find user data, try to write something in chat to load data')
        }
      })
    }
    return { menu, defaultPermissions, isViewerLoaded, viewer, viewerIs, isPublicPage, logout, login, translate };
  }
})
</script>