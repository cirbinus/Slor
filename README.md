# Slor

**其他语言版本: [English](README_EN.md).**

本项目名为Slor,主要用于展示家人的照片和视频，伴随时间轴的变化，照片和视频也随之展示。

### 预览

![Preview1](./previews/1.jpg)
![Preview2](./previews/2.jpg)

### 前端
    
前端为纯html代码，使用vue和element plus，以时间轴展示瀑布流照片和视频，具有预览、添加、批量删除功能。

### 后端

后端使用flask和uv包管理器。生成照片和视频的缩略图，并生成JSON数据结构。


### 部署
1. 更换app.py中`VALID_PASSWORD`
1. 安装uv
    ```
    # use administrator powershell
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    set Path=C:\Users\abin\.local\bin;%Path%
    或者
    pip install uv
    ```
1. 运行
    ```
    uv run app.py
    ```
1. 持久化运行
    ```
    uv tool install gunicorn
    uv run gunicorn -D -w 4 -b 127.0.0.1:5000 app:app
    ```