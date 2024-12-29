<template>
    <!-- 验证弹窗 -->
    <div id="loginBox">
        <input type="text" id="password" placeholder="请输入暗号">
        <button onclick="submitLogin()">确定</button>
        <button onclick="closeLoginBox()">取消</button>
    </div>
</template>

<script setup>
import { ref, defineModel } from 'vue';
import axios from 'axios'; // 确保你已安装 axios
const actionCallback = defineModel();  // 用于保存用户操作的回调
// 是否显示登录弹窗
 const toggleLoginBox = (show) => {
  islogined.value = !show;
};

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
            toggleLoginBox();  // 隐藏登录框
            if (actionCallback) actionCallback();  // 执行原操作
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
</script>

<style >
/* 添加样式 */
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
</style>