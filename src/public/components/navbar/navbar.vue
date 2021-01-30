<template>
  <v-navigation-drawer permanent expand-on-hover app>
    <user/>
    <v-divider></v-divider>
    <navmenu/>
    <v-divider></v-divider>
    <theme/>
    </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

import Vue from 'vue';
import vueHeadful from 'vue-headful';
Vue.component('vue-headful', vueHeadful);

import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
library.add(faBars, faSignInAlt, faSignOutAlt);

export default defineComponent({
  components: {
    user: () => import('src/panel/components/navbar/user.vue'),
    navmenu: () => import('./menu.vue'),
    theme: () => import('src/panel/components/navbar/theme.vue'),
  }
});
</script>