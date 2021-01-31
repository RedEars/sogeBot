<template>
<v-list nav dense>
  <template v-if="isViewerLoaded && $store.state.loggedUser">
    <v-list-item style="height: 120px" transition="fade-transition">
      <div/>
      <v-container style="font-size: .8125rem;" class="ma-0 pa-0">
        <v-row>
          <v-col class="font-weight-medium text-center pa-1">
            {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.points) }}
            <div class="font-weight-thin">{{translate('points')}}</div>
          </v-col>
          <v-col class="font-weight-medium text-center pa-1">
            {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.messages) }}
            <div class="font-weight-thin">{{translate('messages')}}</div>
          </v-col>
          <v-col class="font-weight-medium text-center pa-1">
            {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.aggregatedBits) }}
            <div class="font-weight-thin">{{translate('bits')}}</div>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="font-weight-medium text-center pa-1">
            {{ Intl.NumberFormat($store.state.configuration.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(viewer.watchedTime / 1000 / 60 / 60) }} h
            <div class="font-weight-thin">{{translate('watched-time')}}</div>
          </v-col>
          <v-col class="font-weight-medium text-center pa-1">
            {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(viewer.aggregatedTips) }}
            <div class="font-weight-thin">{{translate('tips')}}</div>
          </v-col>
          <v-col class="font-weight-medium text-center pa-1"></v-col>
        </v-row>
      </v-container>
    </v-list-item>

    <v-list-item class="px-0" style="height: 72px">
      <v-list-item-avatar>
        <v-avatar>
          <v-img :src="$store.state.loggedUser.profile_image_url"></v-img>
        </v-avatar>
      </v-list-item-avatar>
      <v-list-item-content>
        <div class="font-weight-medium">{{$store.state.loggedUser.login}}</div>
        <div class="font-weight-thin" v-if="viewer.permission">{{viewer.permission.name}}</div>
        <v-list-item-subtitle>
          <v-chip v-for="k of viewerIs" :key="k" x-small pill color="orange"> {{k}} </v-chip>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-list-item v-if="!isPublicPage" href="/public/" class="mt-3">
      <v-list-item-icon>
        <v-icon>mdi-earth</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate('go-to-public') }}</v-list-item-title>
    </v-list-item>
    <v-list-item v-if="isPublicPage && viewer.permission.id === defaultPermissions.CASTERS" href="/" class="mt-3">
      <v-list-item-icon>
        <v-icon>mdi-account-cog</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate('go-to-admin') }}</v-list-item-title>
    </v-list-item>
    <v-list-item color="red" @click="logout">
      <v-list-item-icon>
        <v-icon class="red--text">mdi-logout</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate('logout') }}</v-list-item-title>
    </v-list-item>
  </template>
  <template v-else>
    <v-list-item @click="logout">
      <v-list-item-icon>
        <v-icon>mdi-login</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate('not-logged-in') }}</v-list-item-title>
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