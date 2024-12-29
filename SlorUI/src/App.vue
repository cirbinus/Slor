<template>
  <el-header class="top-header" height="50px">
    <!-- 删除按钮 -->
    <el-button round type="danger" class="delete-button" @click="deleteSelectedImages"
      :disabled="!selectedImages.length" v-if="selectionMode">
      删除
    </el-button>
    <!-- 选择按钮 -->
    <el-button round class="select-button" @click="toggleSelectionMode">
      {{ selectionMode ? '取消选择' : '选择' }}
    </el-button>
  </el-header>
  <el-main class="main-content">
    <!-- 空容器 -->
    <div v-if="mediaList === null">
      <el-empty description="没有照片..."> </el-empty>
    </div>
    <!-- 画廊 -->
    <div v-if="dataLoaded">
      <lightgallery class="lightgallery" :settings="{ speed: 500, subHtmlSelectorRelative: true, thumbnail: true, plugins: plugins }" 
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
    </div>
    <!-- 上传按钮 -->
    <el-button round type="primary" class="add-button" @click="toAllowUpload">
      <el-icon>
        <Plus />
      </el-icon>
    </el-button>
    <!-- 隐藏的文件选择控件 -->
    <input type="file" ref="fileInput" accept="image/*,video/*" style="display: none" multiple
      @change="handleFileChange" />
    <!-- 居中悬浮的环形进度条 -->
    <div v-if="uploading" class="overlay">
      <el-progress :percentage="progress" type="circle" :stroke-width="8" :width="100"
        :status="uploadStatus"></el-progress>
    </div>
    <!-- 验证弹窗 -->
    <div id="loginBox">
      <input type="text" id="password" placeholder="请输入暗号">
      <button @click="submitLogin">确定</button>
      <button @click="closeLoginBox">取消</button>
    </div>
  </el-main>

</template>


<script setup>
import { onMounted, ref, onBeforeMount } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { Axios } from 'axios';
import Lightgallery from 'lightgallery/vue';
import lgZoom from 'lightgallery/plugins/zoom';
import lgVideo from 'lightgallery/plugins/video';
import lgThumbnail from "lightgallery/plugins/thumbnail";

// 样式文件
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-thumbnail.css';

// ***以下为变量***
// gallery插件列表
const plugins = [lgZoom, lgThumbnail, lgVideo]
// 用于上传图片
const fileInput = ref(null);
const progress = ref(0);
const uploading = ref(false);
const uploadStatus = ref('success');
const totalFiles = ref(0);
// 用于获取图片列表
const mediaList = ref([]);
const dataLoaded = ref(false);
// 用于控制登录组件
let actionCallback = ref(null);  // 用于保存用户操作的回调
// 用于选择
const selectionMode = ref(false);
const selectedImages = ref([]);
const test = ref('');

// ***登录代码***
// 显示登录弹窗
function showLoginBox() {
  document.getElementById('loginBox').style.display = 'block';
}
// 隐藏登录弹窗
function closeLoginBox() {
  document.getElementById('loginBox').style.display = 'none';
}
// 提交密码验证
async function submitLogin() {
  const password = document.getElementById('password').value;
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    });

    const result = await response.json();

    if (result.status === 'success') {
      // 保存登录状态
      localStorage.setItem('loggedIn', 'True');
      closeLoginBox();  // 隐藏登录框
      if (actionCallback) actionCallback();  // 执行原操作
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
// ***登录代码***

// ***上传代码***
const toAllowUpload = () => {
  // 仅在未登录时显示验证弹窗
  if (!localStorage.getItem('loggedIn')) {
    actionCallback = () => {
      // 在此处执行受保护操作的代码
      fileInput.value.click();
      actionCallback = null; // 清除回调
    };
    showLoginBox();
  } else {
    // 已登录，直接执行操作
    fileInput.value.click();
  };

};
const handleFileChange = async (event) => {
  const files = event.target.files;
  if (!files.length) return;
  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      ElMessage.error('上传的文件必须是图片或视频格式');
      continue;
    }
    await uploadFile(file);
  }
};
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;
  progress.value = 0;
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: new AbortController().signal // 用于设置超时
    });

    if (response.ok) {
      fetchPhotosMetadata();
      ElMessage.success('上传成功');
    } else {
      ElMessage.error('上传失败');
    }
  } catch (error) {
    ElMessage.error('上传失败');
  } finally {
    uploading.value = false;
  }
};
// ***上传代码***

// ***获取元数据代码***
const fetchPhotosMetadata = async () => {
  try {
    const response = await fetch('/api/media-list'); // 替换为您的接口地址
    const data = await response.json();
    mediaList.value = data;
    dataLoaded.value = true; // 数据加载完成
    console.log(mediaList.value);
  } catch (error) {
    console.error('Failed to fetch media data:', error);
  }
};
// ***获取元数据代码***


function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedImages.value = []; // 取消选择时清空选中的图片
  }
}
function selectImage(index) {
  if (selectedImages.value.includes(index)) {
    selectedImages.value = selectedImages.value.filter(i => i !== index);
  } else {
    selectedImages.value.push(index);
  }
}

// 以下为生命周期钩子
onMounted(async () => {
  fetchPhotosMetadata();
});
</script>

<style>
/* 主体部分 */
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

/* 登录弹窗 */
#loginBox {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 上传按钮 */
.add-button {
  position: fixed;
  right: 5vw;
  /* 距离右边 5vw */
  bottom: 5vh;
  /* 距离底部 5vh */
  width: 15vw;
  /* 使用相对单位保持按钮的宽度在各设备上相似 */
  height: 15vw;
  /* 使用相对单位保持按钮的高度与宽度相同 */
  max-width: 70px;
  /* 限制按钮最大宽度 */
  max-height: 70px;
  /* 限制按钮最大高度 */
  min-width: 50px;
  /* 限制按钮最小宽度 */
  min-height: 50px;
  /* 限制按钮最小高度 */
  background-color: white;
  color: black;
  border-radius: 50%;
  /* 保持按钮为圆形 */
  font-size: 2em;
  /* 根据按钮大小自动调整字体 */
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* 上传按钮动画 */
.add-button:hover {
  background-color: grey;
  /* 悬停时按钮颜色 */
}

/* 删除按钮在左侧 */
.delete-button {
  margin-right: auto;
}

/* 选择按钮在右侧 */
.select-button {
  margin-left: auto;
}
</style>
