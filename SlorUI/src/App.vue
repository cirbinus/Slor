<template>
  <el-header v-if="mediaList.length" class="top-header" height="50px">
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
    <div v-if="mediaList.length === 0">
      <el-empty description="没有照片..."> </el-empty>
    </div>
    <!-- 画廊 -->
    <div v-else-if="mediaList.length">
      <lightgallery :key="lightGalleryRef" class="lightgallery"
        :settings="{ speed: 500, thumbnail: true, plugins: plugins }">
        <template v-for="(item, index) in mediaList" :key="index">
          <!-- 图片项 -->
          <a v-if="item.type === 'image'" class="gallery-item" :data-src="item.src">
            <!-- 复选框 -->
            <input type="checkbox" v-if="selectionMode" v-model="selectedImages" :value="item" class="checkbox" />
            <div class="checkoverlay" v-if="selectionMode" @click.stop="toggleSelection(item)"></div>
            <img class="img-responsive" :src="item.thumbnail" :alt="item.alt"/>
          </a>

          <!-- 视频项 -->
          <a v-else-if="item.type === 'video'" class="gallery-item" :data-video="item.src"
            :data-poster="item.thumbnail">
            <!-- 复选框 -->
            <input type="checkbox" v-if="selectionMode" v-model="selectedImages" :value="item" class="checkbox" />
            <div class="checkoverlay" v-if="selectionMode" @click.stop="toggleSelection(item)"></div>
            <img class="img-responsive" :src="item.thumbnail" :alt="item.alt" />
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
import { onMounted, ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios, { Axios } from 'axios';
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
const lightGalleryRef = ref(0);
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
      ElMessage.success(result.message);
      if (actionCallback) actionCallback();  // 执行原操作
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error('Error:', error);
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
  console.log(files);
  if (!files.length) return;
  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      ElMessage.error('上传的文件必须是图片或视频格式');
      continue;
    }
    await uploadFile(file);
  };
  // 重置文件输入控件的值
  fileInput.value.value = '';
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
      ElMessage.success('上传成功');
      await fetchPhotosMetadata();
    } else {
      ElMessage.error('上传失败');
    }
  } catch (error) {
    ElMessage.error('上传失败');
  } finally {
    uploading.value = false;
    console.log('上传后', mediaList.value);
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
    // 刷新lightGallery组件
    lightGalleryRef.value += 1;
  } catch (error) {
    console.error('Failed to fetch media data:', error);
  }
};
// ***获取元数据代码***

// ***删除代码***
//切换选择模式
const isAllSelected = computed(() => selectedImages.value.length === mediaList.value.length);
const toggleSelectionMode = () => {
  // 仅在未登录时显示验证弹窗
  if (!localStorage.getItem('loggedIn')) {
    actionCallback = () => {
      // 在此处执行受保护操作的代码
      selectionMode.value = !selectionMode.value;
      if (!selectionMode.value) {
        selectedImages.value = []; // 退出选择模式时清空选择
      };
      actionCallback = null; // 清除回调
    };
    showLoginBox();
  } else {
    // 已登录，直接执行操作
    selectionMode.value = !selectionMode.value;
    if (!selectionMode.value) {
      selectedImages.value = []; // 退出选择模式时清空选择
    }
  };

};
// 切换单个照片的选中状态
const toggleSelection = (media) => {
  const index = selectedImages.value.findIndex(item => item.alt === media.alt);
  if (index > -1) {
    // 如果已选中，取消选中
    selectedImages.value.splice(index, 1);
  } else {
    // 如果未选中，添加到选中数组
    selectedImages.value.push(media);
  }
};
// 批量删除方法
const deleteSelectedImages = async () => {
  try {
    const imagesToDelete = selectedImages.value.map(image => ({
      alt: image.alt // 直接使用 alt 字段
    }));

    const response = await axios.post('/api/delete_photos', {
      images: imagesToDelete
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      ElMessage.success('删除成功');

      // 从媒体列表中移除已删除的图片
      mediaList.value = mediaList.value.filter(item =>
        !selectedImages.value.some(selected => item.alt === selected.alt)
      );

      // 清空选择
      selectedImages.value = [];
      selectionMode.value = false;

      // 重新获取元数据
      fetchPhotosMetadata();
    } else {
      ElMessage.error(`删除失败: ${response.data.message}`);
    }
  } catch (error) {
    console.error('删除时发生错误:', error);
    ElMessage.error('删除时发生错误');
  }
};
// ***删除代码***

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
