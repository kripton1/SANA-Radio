const http = require('https');
const fs = require('fs');
const { ipcRenderer } = require('electron');

let CLIENT_ID = "709a0470b89a200205b2f7fda6d95d2e"; // !!!!!!!!!!!!!!!!!!!!!!!!!!!

window.addEventListener('DOMContentLoaded', () => {
	let fullData = null;
	
	$('form').on('submit', (e)=>{
		e.preventDefault();
		let url = $('form input').val();
		const request = http.get('https://api.soundcloud.com/resolve?url='+url+'&format=json&client_id='+CLIENT_ID, function(res) {
			 res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {	
				const parsedData = JSON.parse(rawData);
				console.log(rawData);
				let num = parsedData.location.split('tracks/')[1].split('.json')[0];
				
				
				let req = http.get('https://api.soundcloud.com/tracks/'+num+'?client_id='+CLIENT_ID, (res)=>{
					res.setEncoding('utf8');
					let rawData = '';
					res.on('data', (chunk) => { rawData += chunk; });
					res.on('end', () => {	
						const parsed = JSON.parse(rawData);
						fullData = {
							'img': parsed.artwork_url,
							'duration': parsed.duration,
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
								
								let mins = Math.floor((fullData.duration / 1000) / 60);
								let secs = Math.floor(fullData.duration /1000) % 60;
								$('div.TrackPreview div.Track p.TrackDuration span').text(mins + ':' + secs);
								$('div.TrackPreview').css('display', 'flex');
								
							});
						});
						
					});
				});
				
				
			});
		});
	});
	
	$('div.TrackPreview button.TrackListen').on('click', (e)=>{
		e.preventDefault();
		if(fullData == null) return false;
		ipcRenderer.send('sana-radio-send-mp3-audio', fullData);
		window.close();
	});
})