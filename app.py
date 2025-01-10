from flask import Flask, render_template,  request, jsonify, session,send_from_directory
from flask_session import Session
import os,json,uuid
from werkzeug.utils import secure_filename
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime,timedelta
from moviepy.editor import VideoFileClip  # 用于处理视频

app = Flask(__name__,static_folder='static/assets', template_folder='templates')

# 服务器地址
server_addr = 'http://127.0.0.1:5000'
# 设置基本参数

app.secret_key = '2bEZsfMdqWcw/BYQCHsbOojKH/62UDnAgFMJ3VYqtmg'
UPLOAD_FOLDER = os.path.join(app.static_folder, 'data/medias')
THUMBNAIL_FOLDER = os.path.join(app.static_folder, 'data/thumbnails')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'mp4', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['THUMBNAIL_FOLDER'] = THUMBNAIL_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 设置最大上传大小为 500MB
app.config['JSON_FILE'] = os.path.join(app.static_folder, 'data/media_list.json')

# 创建缩略图文件夹（如果不存在）
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(THUMBNAIL_FOLDER, exist_ok=True)


# 配置 Flask-Session，用于会话管理
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
Session(app)
# 模拟用户密码
VALID_PASSWORD = 'PassWord'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_image_thumbnail(image_path, thumbnail_path, size=(200, 200)):
    try:
        with Image.open(image_path) as img:
            img.thumbnail(size)
            img.save(thumbnail_path)
    except Exception as e:
        print(f"Error creating image thumbnail: {e}")

def create_video_thumbnail(video_path, thumbnail_path, size=(200, 200)):
    try:
        with VideoFileClip(video_path) as clip:
            # 从视频的 1 秒位置截取缩略图
            frame = clip.get_frame(1)
            img = Image.fromarray(frame)
            img.thumbnail(size)
            img.save(thumbnail_path)
    except Exception as e:
        print(f"Error creating video thumbnail: {e}")

def get_image_capture_time(filepath):
    try:
        image = Image.open(filepath)
        exif_data = image._getexif()
        if exif_data:
            for tag, value in exif_data.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "DateTimeOriginal":
                    return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
    except Exception as e:
        print(f"Error reading EXIF data: {e}")
    
    # 如果没有 EXIF 信息则使用文件的创建时间
    creation_time = os.path.getctime(filepath)
    return datetime.fromtimestamp(creation_time)

def get_video_capture_time(filepath):
    return datetime.fromtimestamp(os.path.getctime(filepath))

def save_media_list(media_list, json_path=app.config['JSON_FILE']):
    with open(json_path, 'w') as f:
        json.dump(media_list, f, default=str)

def load_media_list(json_path=app.config['JSON_FILE']):
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            return json.load(f)
    return []


@app.route('/')
def gallery():
    return render_template('index.html')

@app.route('/test')
def test():
    return render_template('test.html')

# 处理登录请求
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')
    if password == VALID_PASSWORD:
        session['loggedIn'] = True
        session.permanent = True
        return jsonify({"message": "登录成功", "status": "success"})
    else:
        return jsonify({"message": "暗号错误！！", "status": "error"}), 401

# 处理文件上传请求
@app.route('/api/upload', methods=['POST'])
def upload_files():

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    files = request.files.getlist('file')
    
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No selected files"}), 400
    
    uploaded_files_info = []
    
    for file in files:
        if file and file.filename != '' and allowed_file(file.filename):
            # Generate a UUID name for the file
            file_extension = secure_filename(file.filename).split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_extension}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Save the file
            file.save(filepath)

            # 确定文件类型并生成缩略图
            media_type = 'image' if filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'} else 'video'
            thumbnail_filename = f"thumbnail_{filename}.jpg"
            thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], thumbnail_filename)
            
            if media_type == 'image':
                create_image_thumbnail(filepath, thumbnail_path)
                capture_time = get_image_capture_time(filepath)
                filepath = server_addr + "/static/assets/data/medias/" + filename
                thumbnail_path = server_addr + "/static/assets/data/thumbnails/" + thumbnail_filename
            else:
                create_video_thumbnail(filepath, thumbnail_path)
                capture_time = get_video_capture_time(filepath)
                filepath = '{"source": [{"src":"'+server_addr + "/static/assets/data/medias/" + filename+'", "type":"video/mp4"}], "attributes": {"preload": false, "controls": true}}'
                thumbnail_path = server_addr + "/static/assets/data/thumbnails/" + thumbnail_filename
            
            capture_time = str(capture_time.strftime('%Y-%m-%d'))
            # 添加到 mediaList 
            media_item = {
                "src": str(filepath),
                "thumbnail": thumbnail_path,
                "alt": filename,
                "type": media_type,
                "capture_time": capture_time or datetime.now()
            }

            # 加载并更新 mediaList 数据
            media_list = load_media_list()
            media_list.append(media_item)
            
            # 按拍摄时间排序
            media_list = sorted(media_list, key=lambda x: x['capture_time'], reverse=True)

            # 保存更新后的 mediaList
            save_media_list(media_list)

            return jsonify({"message": "File uploaded successfully", "media_item": media_item}), 200
    
    return jsonify(uploaded_files_info), 200

# 处理前端数据请求
@app.route('/api/media-list', methods=['GET'])
def get_photos_metadata():
    try:
        media_list = load_media_list()
        return jsonify(media_list)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

# 处理前端删除请求
# 删除照片并更新 JSON 文件的 API
@app.route('/api/delete_photos', methods=['POST'])
def delete_photos():
    try:
        data = request.json
        images_to_delete = data.get('images', [])

        # 读取当前的 JSON 数据
        with open(app.config['JSON_FILE'], 'r') as f:
            photos_metadata = json.load(f)

        # 遍历需要删除的图片
        for item in images_to_delete:
            alt = item.get('alt')

            # 查找并删除对应的媒体文件及其缩略图
            media_to_delete = next((media for media in photos_metadata if media['alt'] == alt), None)
            if media_to_delete:
                media_to_delete_path = './static/assets/data/medias/{}'.format(media_to_delete['alt'])
                thumbnail_to_delete_path = './static/assets/data/thumbnails/thumbnail_{}.jpg'.format(media_to_delete['alt'])
                # 删除媒体文件
                if os.path.exists(media_to_delete_path):
                    os.remove(media_to_delete_path)
                # 删除缩略图
                if os.path.exists(thumbnail_to_delete_path):
                    os.remove(thumbnail_to_delete_path)

                # 从 JSON 数据中移除该条记录
                photos_metadata.remove(media_to_delete)

        # 更新 JSON 文件
        with open(app.config['JSON_FILE'], 'w') as f:
            json.dump(photos_metadata, f, indent=4)

        return jsonify({"success": True, "message": "删除成功"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"照片删除失败: {str(e)}"}), 500


@app.route('/static/assets/data/medias/<filename>')
def get_medias_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/static/assets/data/thumbnails/<filename>')
def get_thumbnails_file(filename):
    return send_from_directory(app.config['THUMBNAIL_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True,host="0.0.0.0",port=5000)
