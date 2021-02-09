const { ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function initTrack(track, createAudio = true, centralFunction = false, arrTracks = false, arrNumTrack = false){
	$('div.TrackInfo img.TrackImage').attr('src', track.img);
	$('div.TrackInfo img.TrackImage').on('click', (e)=>{
		shell.openExternal(track.url);
	});
	
	if(track.title.split('-').length != 2){
		let name = track.title;
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackInfo p.TrackName').html(name);
		$('div.TrackInfo p.TrackAuthor').text('Unknown');
	}else{
		let name = track.title.split('-')[1];
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackInfo p.TrackName').html(name);
		$('div.TrackInfo p.TrackAuthor').text(track.title.split('-')[0]);
	} 
	
	let mins = Math.floor((track.duration / 1000) / 60);
	let secs = Math.floor(track.duration /1000) % 60;
	$('div.TrackPanel p.TrackDuration span.TrackFullDuration').text( (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) );
	$('div.TrackPanel p.TrackDuration span.TrackListened').text('00:00');
	
	
	if(createAudio) $('body').append('<audio class="TrackMp3" loop hidden control style="display: none;" src="'+track.mp3+'"></audio>') 
	
	const audio = $('audio.TrackMp3')[0];
	if(centralFunction) centralFunction(audio, track);
	
	let timer;
	$('main div.TrackPanel button.TrackPlayPause').on('click', (e)=>{
		e.preventDefault();
		if(audio.paused){
			audio.play().then(()=>{
				timer = setInterval(()=>{
					let mins = Math.floor(audio.currentTime / 60);
					let secs = Math.floor(audio.currentTime % 60);
					$('div.TrackPanel p.TrackDuration span.TrackListened').text( (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) );
					
					let num = (100 * audio.currentTime) / audio.duration;
					$('main div.TrackSlider input').val( num )
					
					if(!audio.loop && audio.ended){
						
						if(arrTracks && arrNumTrack){
							$('main div.TrackPanel button.TrackNext').click();
						}else{
							clearInterval(timer);
							$(e.currentTarget).html('<i class="fas fa-play"></i>');
						}
					}
					
				},100);
			});
			$(e.currentTarget).html('<i class="fas fa-pause"></i>');
		}else{
			audio.pause()
			clearInterval(timer);
			$(e.currentTarget).html('<i class="fas fa-play"></i>');
		}
	});
	
	if(audio.loop) $('main div.TrackPanel button.TrackRepeat').css('color','var(--red-orange-color)');
	
	$('main div.TrackPanel button.TrackRepeat').on('click', ()=>{
		if(audio.loop){
			$('main div.TrackPanel button.TrackRepeat').css('color','var(--text-color)');
			audio.loop = false;
		}else{
			$('main div.TrackPanel button.TrackRepeat').css('color','var(--red-orange-color)');
			audio.loop = true;
		}
	});
	
	$('main div.TrackPanel div.TrackVolume button.TrackMute').on('click', ()=>{
		if($('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').css('right') == '0px'){
			$('main div.TrackPanel div.TrackVolume').animate({'margin-left': '150px'}, 350);
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').animate({'right': '-150px', 'opacity': '0'}, 350);
		}else{
			$('main div.TrackPanel div.TrackVolume').animate({'margin-left': '15px'}, 350);
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').animate({'right': '0', 'opacity': '1'}, 350);
		}
	});
	
	$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').on('change input', (e)=>{
		audio.volume = e.currentTarget.value / 100;
	})
	
	$('main div.TrackSlider input').on('change input', (e)=>{
		audio.currentTime = (e.currentTarget.value * audio.duration) / 100;
	})
	
	if(arrTracks && arrNumTrack){
		$('main div.TrackPanel button.TrackBack').on('click', (e)=>{
			e.preventDefault();
			if(arrNumTrack-1 < 1){
				arrNumTrack = arrTracks.length;
			}else{
				arrNumTrack -= 1;
			}
			
			initTrack(arrTracks[arrNumTrack-1], false, (audio, arg)=>{
				audio.pause();
				$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-play"></i>');
				$('audio.TrackMp3').attr('src', arg.mp3);
				audio.paused = true;
				audio.currentTime = 0;
				
				$('main div.TrackPanel button.TrackPlayPause').off('click');
				$('main div.TrackPanel div.TrackVolume button.TrackMute').off('click');
				$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('change');
				$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('input');
				$('main div.TrackSlider input').off('change');
				$('main div.TrackSlider input').off('input');
				$('main div.TrackPanel button.TrackRepeat').off('click');
				$('main div.TrackPanel button.TrackBack').off('click');
				$('main div.TrackPanel button.TrackNext').off('click');
				
				audio.play();
				$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-pause"></i>');
			}, arrTracks, arrNumTrack);
		});
		
		
		$('main div.TrackPanel button.TrackNext').on('click', (e)=>{
			e.preventDefault();
			if(arrNumTrack >= arrTracks.length){
				arrNumTrack = 1;
			}else{
				arrNumTrack += 1;
			}
			
			initTrack(arrTracks[arrNumTrack-1], false, (audio, arg)=>{
				audio.pause();
				$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-play"></i>');
				$('audio.TrackMp3').attr('src', arg.mp3);
				audio.paused = true;
				audio.currentTime = 0;
				
				$('main div.TrackPanel button.TrackPlayPause').off('click');
				$('main div.TrackPanel div.TrackVolume button.TrackMute').off('click');
				$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('change');
				$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('input');
				$('main div.TrackSlider input').off('change');
				$('main div.TrackSlider input').off('input');
				$('main div.TrackPanel button.TrackRepeat').off('click');
				$('main div.TrackPanel button.TrackBack').off('click');
				$('main div.TrackPanel button.TrackNext').off('click');
				
				audio.play();
				$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-pause"></i>');
			}, arrTracks, arrNumTrack);
		});
		
	}
	
}

window.addEventListener('DOMContentLoaded', () => {
	$('div.TrackInfo div.TrackControl button.TrackAdd').on('click', (e)=>{
		e.preventDefault();
		ipcRenderer.send('sana-radio-open-add-window', null);
	});
	
	$('div.TrackInfo div.TrackControl button.TrackPlayList').on('click', (e)=>{
		e.preventDefault();
		ipcRenderer.send('sana-radio-open-list-window', null);
	});
	
	let appFolder = ipcRenderer.sendSync('sana-radio-get-app-folder', null);
	let storageFolder = 'storage';
	fs.access(path.join(appFolder, storageFolder+'/playlists.json'), fs.constants.F_OK | fs.constants.W_OK, (err) => {
		if(!err){
			let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
			let playlists = JSON.parse(rawdata);
			if(playlists['sana-history'] && playlists['sana-history']['tracks'].length > 0){
				const track = playlists['sana-history']['tracks'][playlists['sana-history']['tracks'].length - 1];
				
				initTrack(track, true, false, playlists['sana-history']['tracks'], playlists['sana-history']['tracks'].length);
				
			}
		}else{
			$('body').append('<audio class="TrackMp3" loop hidden control style="display: none;" src=""></audio>') 
		}
	});
	
	
})

ipcRenderer.on('sana-radio-get-mp3-audio', (event, arg) => {
	
	console.log(arg);
	
	if(arg.playlist && arg.trackNumber){
		let appFolder = ipcRenderer.sendSync('sana-radio-get-app-folder', null);
		let storageFolder = 'storage';
		fs.access(path.join(appFolder, storageFolder+'/playlists.json'), fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if(!err){
				let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
				let playlists = JSON.parse(rawdata);
				if(playlists[arg.playlist] && playlists[arg.playlist]['tracks'].length > 0){
					
					arrTracks = playlists[arg.playlist]['tracks'];
					arrNumTrack = arg.trackNumber+1;
					
					initThisTrack(arg, arrTracks, arrNumTrack);
				}
			}
		});
	}else{
		initThisTrack(arg);
	}
	
	function initThisTrack(arg, arrTracks = false, arrNumTrack = false){
		initTrack(arg, false, (audio, arg)=>{
			audio.pause();
			$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-play"></i>');
			$('audio.TrackMp3').attr('src', arg.mp3);
			audio.paused = true;
			audio.currentTime = 0;
			
			$('main div.TrackPanel button.TrackPlayPause').off('click');
			$('main div.TrackPanel div.TrackVolume button.TrackMute').off('click');
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('change');
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('input');
			$('main div.TrackSlider input').off('change');
			$('main div.TrackSlider input').off('input');
			$('main div.TrackPanel button.TrackRepeat').off('click');
			$('main div.TrackPanel button.TrackBack').off('click');
			$('main div.TrackPanel button.TrackNext').off('click');
			
			audio.play();
			$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-pause"></i>');
		}, arrTracks, arrNumTrack)
	}
});