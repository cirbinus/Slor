let actionCallback = null;  // 用于保存用户操作的回调

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