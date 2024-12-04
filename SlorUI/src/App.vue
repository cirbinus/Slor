<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
import Login from './components/Login.vue';
import Gallery from './components/Gallery.vue'
import { ref } from 'vue';
// 必要判断
const islogined = ref(false)

</script>

<template>
  <Gallery />
  <Login v-if="islogined" />
</template>

<style scoped>
</style>
