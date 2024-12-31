# Slor

**Other language versions: [Chinese](README.md).**

The project is named Slor and is mainly used to display photos and videos of family members. As the timeline changes, photos and videos are also displayed accordingly.

Compatible with browsers, supporting both PC and mobile devices.

### Preview

![Preview1](./previews/1.jpg)
![Preview2](./previews/2.jpg)
![Preview3](./previews/3.jpg)

### Front end
    
The front-end uses Vue3 and Element Plus to display waterfall photos and videos, with functions such as adding, batch deleting, and previewing.

### Backend

The backend uses Flask and UV package managers. Generate thumbnail images of photos and videos, and generate JSON data structures.



### Preparation in advance
1. Replace the `VALID_PASSWORD` in app.py`server_addr`
1. Replace`target` in `SlorUI/vite.config.ts`
    ```
    target=server_addr
    ```
1. Build a `dist` folder
    ```
    cd SlorUI
    npm run build
    ```
1. Move `SlorUI/dist/assets` to the`static`folder
1. Move `SlorUI/dist/favicon.ico` to the `static/assets` folder
1. Move `SlorUI/dist/index.html` to the `templates` folder and modify,the`<link>`tag in` index. html `

    ```
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
    ```
### Native deployment
1. Install UV
    ```
    # use administrator powershell
    powershell -c "irm  https://astral.sh/uv/install.ps1  | iex"
    set Path=C:\Users\abin\.local\bin;% Path%

    # linux
    curl -LsSf  https://astral.sh/uv/install.sh  | sh

    #Or
    pip install uv
    ```
1. Run the server
    ```
    uv run app.py
    ```
1. Persistently run the server
    ```
    uv tool install gunicorn
    uv run gunicorn -D -w 4 -b 127.0.0.1:5000 app:app
    ```
### Docker deployment
1. Packaging images
    ```
    sudo docker build -t slor .
    ```
1. Run the image
    ```
    sudo docker run -d -p 5000:5000 slor
    ```
