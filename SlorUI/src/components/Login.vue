<template>
    <el-form :model="form" ref="formRef" label-width="100px" @submit.native.prevent="handleSubmit">
        <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]">
            <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
            <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="handleSubmit">登录</el-button>
            <el-button @click="resetForm">重置</el-button>
        </el-form-item>
    </el-form>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios'; // 确保你已安装 axios

export default {
    setup() {
        const form = ref({
            username: '',
            password: ''
        });

        const formRef = ref(null);

        const handleSubmit = () => {
            formRef.value.validate(async (valid) => {
                if (valid) {
                    // 处理登录逻辑
                    try {
                        const response = await axios.post('/api/login', form.value);
                        console.log('登录成功', response.data);
                        // 处理成功后的逻辑，比如保存 token 或者跳转页面
                    } catch (error) {
                        console.error('登录失败', error.response.data);
                        // 处理错误，比如显示错误提示
                    }
                } else {
                    console.error('验证失败');
                    return false;
                }
            });
        };

        const resetForm = () => {
            formRef.value.resetFields();
        };

        return {
            form,
            formRef,
            handleSubmit,
            resetForm
        };
    }
};
</script>

<style scoped>
/* 添加样式 */
</style>