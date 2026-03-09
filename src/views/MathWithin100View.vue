<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';

const iframeStyle = ref({});
let originalFooterStyle = {};

const updateLayout = () => {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const headerHeight = header ? header.offsetHeight : 64;
  const footerHeight = footer ? footer.offsetHeight : 200;
  
  iframeStyle.value = {
    position: 'fixed',
    top: `${headerHeight}px`,
    height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
    left: 0,
    right: 0,
  };
  
  if (footer) {
    footer.style.position = 'fixed';
    footer.style.bottom = '0';
    footer.style.left = '0';
    footer.style.right = '0';
    footer.style.zIndex = '40';
  }
};

const restoreLayout = () => {
  const footer = document.querySelector('footer');
  if (footer) {
    footer.style.position = '';
    footer.style.bottom = '';
    footer.style.left = '';
    footer.style.right = '';
    footer.style.zIndex = '';
  }
};

onMounted(async () => {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  await nextTick();
  updateLayout();
  window.addEventListener('resize', updateLayout);
});

onUnmounted(() => {
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  restoreLayout();
  window.removeEventListener('resize', updateLayout);
});
</script>

<template>
  <iframe 
    src="100.html" 
    class="w-full border-0"
    :style="iframeStyle"
    title="百以内加减题目生成器"
  ></iframe>
</template>

<style scoped>
</style>