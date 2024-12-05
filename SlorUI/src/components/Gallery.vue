<template>
    <lightgallery
      :settings="{ speed: 500,thumbnail: true, plugins: plugins }"
      :onInit="onInit"
      :onBeforeSlide="onBeforeSlide"
    >
      <template v-for="(item, index) in mediaList" :key="index">
        <!-- 图片项 -->
        <a
          v-if="item.type === 'image'"
          :data-lg-size="item.size"
          class="gallery-item"
          :data-src="item.src"
          :data-sub-html="item.subHtml"
        >
          <img
            class="img-responsive"
            :src="item.thumbnail"
            alt="Gallery item"
          />
        </a >
  
        <!-- 视频项 -->
        <a
          v-else-if="item.type === 'video'"
          class="gallery-item"
          :data-video="item.video"
          :data-poster="item.poster"
          :data-sub-html="item.subHtml"
        >
          <img
            class="img-responsive"
            :src="item.thumbnail"
            alt="Video thumbnail"
          />
        </a >
      </template>
    </lightgallery>
  </template>
  
  <script>
  import Lightgallery from 'lightgallery/vue';
  import lgZoom from 'lightgallery/plugins/zoom';
  import lgVideo from 'lightgallery/plugins/video';
  import lgThumbnail from "lightgallery/plugins/thumbnail";
  
  // 样式文件
  import 'lightgallery/css/lightgallery.css';
  import 'lightgallery/css/lg-zoom.css';
  import 'lightgallery/css/lg-video.css';
  import 'lightgallery/css/lg-thumbnail.css';

  export default {
    name: 'App',
    components: {
      Lightgallery,
    },
    data() {
      return {
        // 插件列表
        plugins: [lgZoom, lgThumbnail, lgVideo],
  
        // 媒体资源列表
        mediaList: [
          {
            type: 'image',
            size: '1406-1390',
            src: 'https://images.unsplash.com/photo-1581894158358-5ecd2c518883?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1406&q=80',
            thumbnail: 'https://images.unsplash.com/photo-1581894158358-5ecd2c518883?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=240&q=80',
            subHtml: `<h4>Photo by - Diego Guzmán</h4> <p>Location - Kyoto, Japan</p >`,
          },
          {
            type: 'image',
            size: '1400-1400',
            src: 'https://images.unsplash.com/photo-1544550285-f813152fb2fd?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            thumbnail: 'https://images.unsplash.com/photo-1544550285-f813152fb2fd?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=240&q=80',
            subHtml: `<h4>Photo by - </h4> <p>Location - Osaka, Japan</p >`,
          },
          {
            type: 'video',
            video: '{"source": [{"src":"https://www.lightgalleryjs.com/videos/video1.mp4", "type":"video/mp4"}], "attributes": {"preload": false, "controls": true}}',
            poster: 'https://www.lightgalleryjs.com/images/demo/html5-video-poster.jpg',
            thumbnail: 'https://www.lightgalleryjs.com/images/demo/html5-video-poster.jpg',
            subHtml: `<h4>Video Example</h4><p>HTML5 Video support with LightGallery.</p >`,
          },
        ],
      };
    },
    methods: {
      onInit() {
        console.log('lightGallery 已初始化');
      },
      onBeforeSlide() {
        console.log('即将切换幻灯片');
      },
    },
  };
  </script>
  
  <style lang="css">
  body {
    margin: 0;
  }
  
  .gallery-item {
    margin: 10px;
  }
  
  .img-responsive {
    width: 200px;
    height: auto;
    border-radius: 8px;
    transition: transform 0.2s ease;
  }
  
  .img-responsive:hover {
    transform: scale(1.05);
  }
  </style>