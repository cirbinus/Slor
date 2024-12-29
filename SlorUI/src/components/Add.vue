<template>
    <el-button round type="primary" class="add-button" @click="selectFiles">
        <el-icon>
            <Plus />
        </el-icon>
    </el-button>
    <!-- 隐藏的文件选择控件 -->
    <input type="file" ref="fileInput" accept="image/*,video/*" style="display: none" multiple
        @change="handleFileChange" />
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {toggleLoginBox} from '../components/Login.vue';

const selectFiles = () => {
      // 仅在未登录时显示验证弹窗
      if (!localStorage.getItem('loggedIn')) {
        toggleLoginBox();
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
        const response = await axios.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 600000, // 设置超时时间为 120 秒
          onUploadProgress: (event) => {
            if (event.lengthComputable) {
              progress.value = Math.round((event.loaded * 100) / event.total);
            }
          }
        });
        if (response.status === 200) {
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

</script>

<style scoped>
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
</style>