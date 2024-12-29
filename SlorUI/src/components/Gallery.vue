<template>
  <lightgallery class="lightgallery">
    :settings="{ speed: 500, subHtmlSelectorRelative: true, thumbnail: true, plugins: plugins }" 
    :onBeforeSlide="onBeforeSlide">
    <template v-for="(item, index) in mediaList" :key="index">
      <!-- 图片项 -->
      <a v-if="item.type === 'image'" class="gallery-item" :data-src="item.src">
        <!-- 复选框 -->
        <input type="checkbox" v-if="selectionMode" :value="item" class="checkbox" />
        <div class="checkoverlay" v-if="selectionMode" @click.stop="test()"></div>
        <img class="img-responsive" :src="item.thumbnail" :alt="item.alt"
          :class="{ selected: selectedImages.includes(index) }" />
      </a>

      <!-- 视频项 -->
      <a v-else-if="item.type === 'video'" class="gallery-item" :data-video="item.src" :data-poster="item.thumbnail">
        <!-- 复选框 -->
        <input type="checkbox" v-if="selectionMode" :value="item" class="checkbox" />
        <div class="checkoverlay" v-if="selectionMode" @click.stop="test()"></div>
        <img class="img-responsive" :src="item.thumbnail" :alt="item.alt"
          :class="{ selected: selectedImages.includes(index) }" />
      </a>
    </template>
  </lightgallery>
</template>

<script setup>
import Lightgallery from 'lightgallery/vue';
import lgZoom from 'lightgallery/plugins/zoom';
import lgVideo from 'lightgallery/plugins/video';
import lgThumbnail from "lightgallery/plugins/thumbnail";

// 样式文件
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-thumbnail.css';

const props = defineProps({
  selectedImages: {
    type: Array,
    required: true
  },
  selectionMode: {
    type: Boolean,
    required: true
  },
  mediaList: {
    type: Array,
    required: true
  }
})
// 插件列表
const plugins = [lgZoom, lgThumbnail, lgVideo]


</script>

<style lang="css">
.lightgallery {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  /* 确保图片从左对齐 */
  z-index: 1;
  gap: 5px;
  /* 设置图片之间的间隙 */
}

.gallery-item {
  aspect-ratio: 1 / 1;
  /* 强制保持正方形比例 */
  position: relative;
  margin: 0;
}

@media (min-width: 1201px) {
  .gallery-item {
    flex: 1 1 calc(20% - 4px);
    /* 大屏幕每行显示5张图片 */
    max-width: calc(20% - 4px);
  }
}

@media (max-width: 1200px) {
  .gallery-item {
    flex: 1 1 calc(25% - 4px);
    /* 中屏幕每行显示4张图片 */
    max-width: calc(25% - 4px);
  }
}

@media (max-width: 768px) {
  .gallery-item {
    flex: 1 1 calc(33.33% - 4px);
    /* 小屏幕每行显示3张图片 */
    max-width: calc(33.33% - 4px);
  }
}

.img-responsive {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 确保图片按比例填充 */
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.img-responsive:hover {
  transform: scale(1.05);
}

/* 复选框的定位样式 */
.checkbox {
  position: absolute;
  top: 5px;
  right: 5px;
  transform: scale(1.2);
  z-index: 2;
  /* 确保复选框在图片上方 */
}

/* 复选覆盖图层样式 */
.checkoverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0);
  /* 透明背景 */
  cursor: pointer;
  z-index: 999;
  /* 确保图层在图片和复选框上方 */
}
</style>