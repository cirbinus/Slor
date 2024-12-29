const { createApp, computed, ref, onMounted, watch } = Vue;
const { ElMessage } = ElementPlus;
const { Plus } = ElementPlusIconsVue;

const app = createApp({
  delimiters: ['[[', ']]'],
  setup() {
    // 配置图片上传窗口
    const fileInput = ref(null);
    const progress = ref(0);
    const uploading = ref(false);
    const uploadStatus = ref('success');
    const totalFiles = ref(0);
    // 服务器元数据
    const mediaList = ref([]);
    const error = ref(null);
    const mediaElements = ref('');
    // 删除变量
    const selectedImages = ref([]);
    const selectionMode = ref(false);

    // 以下为获取数据函数
    
    const fetchPhotosMetadata = async () => {
      try {
        const response = await fetch('/api/media-list'); // 替换为您的接口地址
        const data = await response.json();

        mediaList.value = data;

        let elements = '';
        mediaList.value.forEach(media => {
          elements += createMediaElement(media);
        });

        mediaElements.value = elements;

        console.log(mediaElements);

        console.log(mediaList);

      } catch (error) {
        console.error('Failed to fetch media data:', error);
      }
    };

    // 以下为批量删除照片和视频的函数
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
      const index = selectedImages.value.findIndex(item => item.src === media.src);
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
          src: image.src // 直接使用 src 字段
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
            !selectedImages.value.some(selected => item.src === selected.src)
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



    // 以下为上传函数
    const selectFiles = () => {
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

    // 以下为预览功能
    

    // 调用数据获取函数
    onMounted(fetchPhotosMetadata);
    
    watch(mediaElements, (newVal) => {
      if (newVal !== '') {
        lightGallery(document.getElementById("lightgallery"), {
          plugins: [lgZoom, lgThumbnail],
          speed: 500,
        });
        console.log(newVal);
        console.log("lightGallery loaded");
      }
    });

    return {
      // 暴露元数据
      mediaList, error,mediaElements,
      // 暴露上传
      fileInput,
      selectFiles,
      handleFileChange,
      progress,
      uploading,
      uploadStatus,
      totalFiles,
      isImage,
      // 暴露删除
      toggleSelectionMode,
      selectionMode,
      isAllSelected,
      deleteSelectedImages,
      selectedImages,
      toggleSelection,
      // 暴露预览
    };
  },
  components: {
    // 暴露图标
    Plus,
  }
});
app.use(ElementPlus);
app.mount("#app");