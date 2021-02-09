const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs');


let appFolder = app.getPath('userData');
let storageFolder = 'storage';
let originalWindowIcon;

const userOS = process.platform;
if(userOS === 'win32'){
	originalWindowIcon = path.resolve(__dirname, 'assets/img/favicon.ico');
}else if(userOS === 'linux'){
	originalWindowIcon = path.resolve(__dirname, 'assets/img/favicon.png');
}else{
	originalWindowIcon = path.resolve(__dirname, 'assets/img/favicon.png');
}

function createWindow () {
	const mainWindow = new BrowserWindow({
		width: 600,
		height: 200,
		minWidth: 600,
		minHeight: 200,
		maxWidth: 600,
		maxHeight: 200,
		show: false,
		autoHideMenuBar: false,
		titleBarStyle: 'hidden',
		icon: originalWindowIcon,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			contextIsolation: false,
			nativeWindowOpen: true
		}
	});
	
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});
	
	//mainWindow.webContents.openDevTools();
	mainWindow.removeMenu();
	
	mainWindow.loadFile('index.html');
	
	
	
	ipcMain.on('sana-radio-open-add-window', (event, arg)=>{
		const addWindow = new BrowserWindow({
			parent: mainWindow,
			modal: true,
			width: 600,
			height: 400,
			minWidth: 600,
			minHeight: 400,
			maxWidth: 600,
			maxHeight: 400,
			autoHideMenuBar: false,
			titleBarStyle: 'hidden',
			icon: originalWindowIcon,
			webPreferences: {
				preload: path.join(__dirname, 'add.preload.js'),
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				contextIsolation: false,
				nativeWindowOpen: true
			}
		});
		
		addWindow.removeMenu();
		//addWindow.webContents.openDevTools();
		addWindow.loadFile('add.html');
	});
	
	ipcMain.on('sana-radio-open-list-window', (event, arg)=>{
		const listWindow = new BrowserWindow({
			parent: mainWindow,
			modal: true,
			width: 600,
			height: 420,
			minWidth: 600,
			minHeight: 420,
			maxWidth: 600,
			maxHeight: 420,
			autoHideMenuBar: false,
			titleBarStyle: 'hidden',
			icon: originalWindowIcon,
			webPreferences: {
				preload: path.join(__dirname, 'list.preload.js'),
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				contextIsolation: false,
				nativeWindowOpen: true
			}
		});
		
		listWindow.removeMenu();
		//listWindow.webContents.openDevTools();
		listWindow.loadFile('list.html');
	});
	
	ipcMain.on('sana-radio-send-mp3-audio', (event, arg) => {
        mainWindow.webContents.send('sana-radio-get-mp3-audio', arg);
    });
	
	
	ipcMain.on('sana-radio-get-app-folder', (event, arg)=>{
		event.returnValue = appFolder;
	});
	
}

app.whenReady().then(() => {
	createWindow()
  
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

//app.getPath('userData')  -> C:\Users\trewo\AppData\Roaming\SANA-Radio

fs.access(path.join(appFolder, storageFolder), fs.constants.F_OK | fs.constants.W_OK, (err) => {
	if(err){
		fs.mkdirSync(path.join(appFolder, storageFolder+'/playlists/sana-playlist/SEAMS-seams'), { recursive: true });
		
		console.log('Creating file: ' + path.join(appFolder+'/'+storageFolder, 'playlists.json'));
		const playlists = fs.createWriteStream(path.join(appFolder+'/'+storageFolder, 'playlists.json'));
		playlists.end(`{
	"sana-playlist":{
		"name": "SANA Radio Playlist",
		"tracks": [
			{
				"title": "SEAMS - seams",
				"img": "",
				"mp3": "",
				"url": "https://",
				"duration": 36361
			}
		]
	}
}`);
	}
	//app.quit();
});
