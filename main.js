const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')

let originalWindowIcon; // Иконка приложение в зависимости от ОС
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
	
	mainWindow.webContents.openDevTools();
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
		addWindow.webContents.openDevTools();
		addWindow.loadFile('add.html');
	});
	
	ipcMain.on('sana-radio-send-mp3-audio', (event, arg) => {
        mainWindow.webContents.send('sana-radio-get-mp3-audio', arg);
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