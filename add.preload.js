const http = require('https');
const fs = require('fs');
const path = require('path');
const { ipcRenderer, shell } = require('electron');
const ffmpeg = require('ffmpeg');
const ytdl = require('ytdl-core');

let CLIENT_ID = "709a0470b89a200205b2f7fda6d95d2e";

function initNewTrack(fullData){
	$('div.TrackPreview div.Track img.TrackImage').attr('src', fullData.img);
	$('div.TrackPreview div.Track img.TrackImage').on('click', (e)=>{
		shell.openExternal(fullData.url);
	});
	if(fullData.title.split('-').length != 2){
		let name = fullData.title;
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackPreview div.Track p.TrackName').html(name);
		$('div.TrackPreview div.Track p.TrackAuthor').text('Unknown');
	}else{
		let name = fullData.title.split('-')[1];
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackPreview div.Track p.TrackName').html(name);
		$('div.TrackPreview div.Track p.TrackAuthor').text(fullData.title.split('-')[0]);
	}
	
	let mins = Math.floor(fullData.duration / 60);
	let secs = Math.floor(fullData.duration % 60);
	$('div.TrackPreview div.Track p.TrackDuration span').text((mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs));
	$('div.TrackPreview').css('display', 'flex');
}

function initTrack(fullData, appFolder, storageFolder, trackTitle){
	file = fs.createWriteStream(path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.jpg'));
	http.get(fullData.img, function(response) {
		response.pipe(file)
			.on('finish', ()=>{
				console.log('got jpg');
				let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
				let playlists = JSON.parse(rawdata);
				
				if(!playlists['sana-history']){
					playlists['sana-history'] = {
						"name": "SANA История прослушиваний",
						"tracks": [
							{
								"title": fullData.title,
								"img": path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.jpg'),
								"mp3": path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.mp3'),
								"url": fullData.url,
								"duration": fullData.duration
							}
						]
					}
				}else{
					playlists['sana-history']['tracks'].push({
						"title": fullData.title,
						"img": path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.jpg'),
						"mp3": path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.mp3'),
						"url": fullData.url,
						"duration": fullData.duration
					});
				}
				
				fullData.playlist = 'sana-history';
				fullData.mp3 = path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.mp3');
				fullData.img = path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.jpg');
				
				console.log(fullData);
				
				let data = JSON.stringify(playlists);
				fs.writeFileSync(path.join(appFolder, storageFolder+'/playlists.json'), data);
				
				ipcRenderer.send('sana-radio-send-mp3-audio', fullData);
				window.close();
			});
	});
}








window.addEventListener('DOMContentLoaded', () => {
	let fullData = null;
	
	$('form').on('submit', (e)=>{
		e.preventDefault();
		
		$('div.TrackPreview button.TrackListen')
			.removeAttr('disabled')
			.html('<i class="fas fa-headphones"></i>');
		
		let url = $('form input').val();
		
		if(/^(?:https?:\/\/)?(?:[^.]+\.)?soundcloud\.com(\/.*)?$/.test(url)){
			
			const request = http.get('https://api.soundcloud.com/resolve?url='+url+'&format=json&client_id='+CLIENT_ID, function(res) {
				 res.setEncoding('utf8');
				let rawData = '';
				res.on('data', (chunk) => { rawData += chunk; });
				res.on('end', () => {	
					const parsed = JSON.parse(rawData);
					console.log(parsed);
					let num = parsed.location.split('tracks/')[1].split('.json')[0];
					
					if(parsed.title.split('-').length < 2){
						parsed.title = parsed.user.username + ' - ' + parsed.title;
					}
					
					fullData = {
						'img': parsed.artwork_url,
						'duration': (parsed.duration / 1000),
						'title': parsed.title,
						'url': parsed.permalink_url
					}
					
					let req = http.get('https://api.soundcloud.com/tracks/'+num+'/stream?client_id='+CLIENT_ID, (res)=>{
						res.setEncoding('utf8');
						let rawData = '';
						res.on('data', (chunk) => { rawData += chunk; });
						res.on('end', () => {	
							const parsedData2 = JSON.parse(rawData);
							let mp3url = parsedData2.location;
							fullData['mp3'] = mp3url;
							console.log(fullData);
							
							initNewTrack(fullData);
							
						});
					});
					
				});
			});
		
		
		
		}else if(/^(?:https?:\/\/)?(?:[^.]+\.)?youtube\.com(\/.*)?$/.test(url) || /^(?:https?:\/\/)?(?:[^.]+\.)?youtu\.be(\/.*)?$/.test(url)){
			
			if(!ytdl.validateURL(url)){
				alert('Ошибка! Видео недоступно для загрузки');
			}else{
			
				ytdl.getBasicInfo(url).then((data)=>{
					
					if(data.videoDetails.title.split('-').length < 2){
						data.videoDetails.title = data.videoDetails.author.name + ' - ' + data.videoDetails.title;
					}
					
					fullData = {
						'title': data.videoDetails.title,
						'img': data.videoDetails.thumbnails[0].url,
						'url': data.videoDetails.video_url,
						'duration': data.videoDetails.lengthSeconds,
						'ytdl-id': ytdl.getURLVideoID(url)
					}; 
					
					
					console.log(fullData);
					
					initNewTrack(fullData);
					
					
				});
			
			}
			
		}
		
		
	});
	
	$('div.TrackPreview button.TrackListen').on('click', (e)=>{
		e.preventDefault();
		if(fullData == null) return false;
		
		console.log('button clicked');
		
		$('div.TrackPreview button.TrackListen')
			.attr('disabled', 'true')
			.html('<i class="fas fa-cog fa-spin"></i>');
		
		let appFolder = ipcRenderer.sendSync('sana-radio-get-app-folder', null);
		let storageFolder = 'storage';
		let trackTitle = fullData.title.split(' ').join('');
		trackTitle = trackTitle.replace(/\/|\\|"|<|>|:|\*|\?|\||\'/gi, '_');
		console.log(trackTitle);
		
		fs.mkdirSync(path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle), { recursive: true });
		
		console.log('made dir');
		
		if(fullData['ytdl-id']){
			let stream = ytdl(fullData['ytdl-id'], {
				quality: 'highestaudio',
			}).pipe(fs.createWriteStream(path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.mp3'))).on('finish', ()=>{
				console.log('got mp3');
				initTrack(fullData, appFolder, storageFolder, trackTitle);
			});
		}else{
			let file = fs.createWriteStream(path.join(appFolder, storageFolder+'/playlists/sana-history/'+trackTitle+'/track.mp3'));
			http.get(fullData.mp3, function(response) {
				response.pipe(file)
					.on('finish',()=>{
						console.log('got mp3');
						initTrack(fullData, appFolder, storageFolder, trackTitle);
					});
				
				
			});
		}
		
		
		
	});
})