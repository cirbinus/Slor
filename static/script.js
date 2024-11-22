
const { createApp, computed, ref, onMounted, nextTick, watch } = Vue;
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
    // 删除变量
    const selectedImages = ref([]);
    const selectionMode = ref(false);
    // 预览变量
    const isMediaPlaying = ref(false);
    const currentMedia = ref({});
    const currentMediaType = computed(() => currentMedia.value.type);

    // 以下为获取数据函数
    const fetchPhotosMetadata = async () => {
      try {
        const response = await fetch('/api/media-list'); // 替换为您的接口地址
        const data = await response.json();

        // 按日期分组
        mediaList.value = groupMediaByDate(data);
        console.log(mediaList);

      } catch (error) {
        console.error('Failed to fetch media data:', error);
      }
    };

    /**
   * 按日期分组媒体数据
   */
    const groupMediaByDate = (mediaList) => {
      const grouped = {};

      mediaList.forEach((media) => {
        // 尝试解析日期
        const dateObj = new Date(media.capture_time);
        if (isNaN(dateObj)) {
          console.warn(`Invalid date format: ${media.capture_time}`);
          return; // 跳过无效日期项
        }

        // 提取 YYYY-MM-DD 格式
        const date = dateObj.toISOString().split('T')[0];

        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(media);
      });

      return Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a)) // 从新到旧排序
        .map((date) => ({
          date,
          media: grouped[date],
        }));
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

        const response = await axios.post('https://abya.top:11111/api/delete_photos', {
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

    const isImage = (file) => {
      return /\.(jpg|jpeg|png|gif|bmp|webp|heif)$/i.test(file); // 基于扩展名判断
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
        const response = await axios.post('https://abya.top:11111/upload', formData, {
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
    const allMedia = computed(() =>
      mediaList.value.flatMap((group) => group.media)
    );

    const currentIndex = computed(() =>
      allMedia.value.findIndex((media) => media.src === currentMedia.value?.src)
    );

    const openMedia = (media) => {
      currentMedia.value = media;
      isMediaPlaying.value = true;
    };

    const stopMedia = () => {
      isMediaPlaying.value = false;
    };

    const prevMedia = () => {
      const prevIndex =
        currentIndex.value > 0
          ? currentIndex.value - 1
          : allMedia.value.length - 1; // 循环到最后一张
      currentMedia.value = allMedia.value[prevIndex];
    };

    const nextMedia = () => {
      const nextIndex =
        currentIndex.value < allMedia.value.length - 1
          ? currentIndex.value + 1
          : 0; // 循环到第一张
      currentMedia.value = allMedia.value[nextIndex];
    };

    // 处理触摸事件
    const touchStartX = ref(0);
    const handleTouchStart = (event) => {
      touchStartX.value = event.touches[0].clientX;
    };

    const handleTouchEnd = (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.value;
      if (deltaX > 50) prevMedia();
      else if (deltaX < -50) nextMedia();
    };

    const getMediaClass = (index) => {
      if (index === this.currentIndex) {
        return this.prevIndex !== null && this.currentIndex > this.prevIndex
          ? 'active slide-in-right'
          : 'active slide-in-left';
      } else if (index === this.prevIndex) {
        return this.currentIndex > this.prevIndex
          ? 'slide-out-left'
          : 'slide-out-right';
      } else {
        return '';
      }
    };

    // 调用数据获取函数
    fetchPhotosMetadata();

    return {
      // 暴露元数据
      mediaList, error,
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
      isMediaPlaying,
      currentMedia,
      currentMediaType,
      openMedia,
      stopMedia,
      prevMedia,
      nextMedia,
      handleTouchStart,
      handleTouchEnd,
      getMediaClass,
    };
  },
  components: {
    // 暴露图标
    Plus,

  }
});
app.use(ElementPlus);
app.mount("#app");
