const { ipcRenderer, shell } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
	$('div.TrackInfo div.TrackControl button.TrackAdd').on('click', (e)=>{
		e.preventDefault();
		ipcRenderer.send('sana-radio-open-add-window', null);
	});
})

ipcRenderer.on('sana-radio-get-mp3-audio', (event, arg) => {
	
	console.log(arg);
	
	$('div.TrackInfo img.TrackImage').attr('src', arg.img);
	$('div.TrackInfo img.TrackImage').on('click', (e)=>{
		shell.openExternal(arg.url);
	});
	
	if(arg.title.split('-').length != 2){
		let name = arg.title;
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackInfo p.TrackName').html(name);
		$('div.TrackInfo p.TrackAuthor').text('Unknown');
	}else{
		let name = arg.title.split('-')[1];
		if(name.length > 35){
			name = '<marquee behavior="scroll" direction="left">'+name+'</marquee>';
		}
		$('div.TrackInfo p.TrackName').html(name);
		$('div.TrackInfo p.TrackAuthor').text(arg.title.split('-')[0]);
	} 
	
	let mins = Math.floor((arg.duration / 1000) / 60);
	let secs = Math.floor(arg.duration /1000) % 60;
	$('div.TrackPanel p.TrackDuration span.TrackFullDuration').text( (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) );
	$('div.TrackPanel p.TrackDuration span.TrackListened').text('00:00');
	
	//if($('audio.TrackMp3')[0] && !$('audio.TrackMp3')[0].paused) $('main div.TrackPanel button.TrackPlayPause').click();
	if($('audio.TrackMp3')[0]){
		$('audio.TrackMp3')[0].pause();
		$('main div.TrackPanel button.TrackPlayPause').html('<i class="fas fa-play"></i>');
		$('audio.TrackMp3').attr('src', arg.mp3);
		$('audio.TrackMp3')[0].paused = true;
		$('audio.TrackMp3')[0].currentTime = 0;
		
		$('main div.TrackPanel button.TrackPlayPause').off('click');
		$('main div.TrackPanel div.TrackVolume button.TrackMute').off('click');
		$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('change');
		$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').off('input');
		$('main div.TrackSlider input').off('change');
		$('main div.TrackSlider input').off('input');
	}else{
		$('body').append('<audio class="TrackMp3" loop hidden control style="display: none;" src="'+arg.mp3+'"></audio>') 
	}
	const audio = $('audio.TrackMp3')[0];
	
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
				},100);
			});
			$(e.currentTarget).html('<i class="fas fa-pause"></i>');
		}else{
			audio.pause()
			clearInterval(timer);
			$(e.currentTarget).html('<i class="fas fa-play"></i>');
		}
	});
	
	$('main div.TrackPanel div.TrackVolume button.TrackMute').on('click', ()=>{
		if($('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').css('right') == '0px'){
			$('main div.TrackPanel div.TrackVolume').animate({'margin-left': '230px'}, 350);
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').animate({'right': '-150px', 'opacity': '0'}, 350);
		}else{
			$('main div.TrackPanel div.TrackVolume').animate({'margin-left': '98px'}, 350);
			$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider').animate({'right': '0', 'opacity': '1'}, 350);
		}
	});
	
	$('main div.TrackPanel div.TrackVolume div.TrackVolumeSlider input').on('change input', (e)=>{
		audio.volume = e.currentTarget.value / 100;
	})
	
	$('main div.TrackSlider input').on('change input', (e)=>{
		audio.currentTime = (e.currentTarget.value * audio.duration) / 100;
	})
	
});