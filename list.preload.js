const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

function getFileSize(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
	var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
    return fileSizeInMegabytes;
}

window.addEventListener('DOMContentLoaded', () => {
	
	if(window.location.pathname.split('/')[window.location.pathname.split('/').length - 1] == 'playlist.html'){
		$('header input.TrackSearch').focus();
		
		let id = window.location.hash.split('#')[1];
		let appFolder = ipcRenderer.sendSync('sana-radio-get-app-folder', null);
		let storageFolder = 'storage';
		fs.access(path.join(appFolder, storageFolder+'/playlists.json'), fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if(!err){
				let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
				let playlists = JSON.parse(rawdata);
				
				window.document.title = 'Плейлист "'+playlists[id].name+'" - SANA Radio';
				
				for(track in playlists[id].tracks){
					let music = playlists[id].tracks[track];
					if(music == null) continue;
					let mins = Math.floor(music.duration / 60);
					let secs = Math.floor(music.duration % 60);
					$('main table.TrackList tbody').append(`<tr>
	<td><img src="`+music.img+`" alt="Обложка песни" /></td>
	<td class="TrackName">`+music.title+`</td>
	<td class="text-normal">`+(mins < 10 ? '0' + mins : mins)+`:`+(secs < 10 ? '0' + secs : secs)+`</td>
	<td class="text-small">`+getFileSize(music.mp3).toFixed(2)+` MB</td>
	<td>
		<button title="Прослушать песню" class="TrackListen" data-id="`+track+`"><i class="fas fa-headphones"></i></button>
		<button title="Удалить песню" class="TrackDelete" data-id="`+track+`"><i class="fas fa-trash"></i></button>
	</td>
</tr>`);
				}
				
				$('main table.TrackList tbody tr td button.TrackListen').on('click', (e)=>{
					e.preventDefault()
					$(e.currentTarget)
						.attr('disabled', 'true')
						.html('<i class="fas fa-cog fa-spin"></i>');
					
					let track = playlists[id].tracks[$(e.currentTarget).data('id')];
					let data = {
						'title': track.title,
						'img': track.img,
						'mp3': track.mp3,
						'duration': track.duration,
						'url': track.url,
						'playlist': id,
						'trackNumber': $(e.currentTarget).data('id')
					}
					
					ipcRenderer.send('sana-radio-send-mp3-audio', data);
					window.close();
				});
				
				$('header input.TrackSearch').on('change input',(e)=>{
					let input = $('header input.TrackSearch');
					let filter = input.val().toUpperCase();
					let tr = $('main table.TrackList tbody tr');
					
					for (i = 0; i < tr.length; i++){
					let td = $('td', tr[i])[1];
						if (td){
							let txtValue = td.textContent || td.innerText;
							if (txtValue.toUpperCase().indexOf(filter) > -1){
								tr[i].style.display = "";
							} else {
								tr[i].style.display = "none";
							}
						}
					}
				});
				
				$('header button.TrackAdd').on('click', (e)=>{
					e.preventDefault();
					ipcRenderer.send('sana-radio-open-add-window', null);
					window.close();
				});
				
				$('header button.TrackBack').on('click', (e)=>{
					e.preventDefault();
					$(e.currentTarget)
						.attr('disabled', 'true')
						.html('<i class="fas fa-cog fa-spin"></i>');
					window.location.href="list.html";
				});
				
				$('main table.TrackList tbody tr td button.TrackDelete').on('click', (e)=>{
					e.preventDefault()
					
					if(confirm('Вы действительно хотите удалить песню (включая её файлы)?')){
						$(e.currentTarget)
							.attr('disabled', 'true')
							.html('<i class="fas fa-cog fa-spin"></i>');
						
						console.log(path);
						let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
						let playlists = JSON.parse(rawdata);
						let track = playlists[id].tracks[$(e.currentTarget).data('id')];
						delete playlists[id].tracks[$(e.currentTarget).data('id')];
						let trackName = track.mp3.split('\\')[track.mp3.split('\\').length - 1];
						let paths = track.mp3.replace(trackName, '');
						
						let data = JSON.stringify(playlists);
						fs.writeFileSync(path.join(appFolder, storageFolder+'/playlists.json'), data);
						
						fs.rmdirSync(paths, { recursive: true });
						
						$(e.currentTarget).parent().parent().remove();
					}
					
				});
				
			}
		});
		return false;
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	$('header input.PlaylistSearch').focus();
	
	let appFolder = ipcRenderer.sendSync('sana-radio-get-app-folder', null);
	let storageFolder = 'storage';
	fs.access(path.join(appFolder, storageFolder+'/playlists.json'), fs.constants.F_OK | fs.constants.W_OK, (err) => {
		if(!err){
			let rawdata = fs.readFileSync(path.join(appFolder, storageFolder+'/playlists.json'));
			let playlists = JSON.parse(rawdata);
			for(playlist in playlists){
				let name = playlists[playlist].name;
				let tracks = playlists[playlist].tracks;
				let duration = 0;
				let size = 0;
				
				for(track in tracks){
					if(tracks[track] == null) continue;
					
					duration += parseInt(tracks[track].duration);
					size += getFileSize(tracks[track].mp3);
				}
				
				let mins = Math.floor(duration / 60);
				let secs = Math.floor(duration % 60);
				$('table.Playlists tbody').append(`<tr title="Открыть плейлист" data-id="`+playlist+`">
	<td>`+name+`</td>
	<td>`+tracks.length+`</td>
	<td>`+(mins < 10 ? '0' + mins : mins)+`:`+(secs < 10 ? '0' + secs : secs)+`</td>
	<td>`+Math.floor(size, 2)+` MB</td>
</tr>`);
				
			}
			
			$('table.Playlists tbody tr').on('click', (e)=>{
				e.preventDefault();
				let id = $(e.currentTarget).data('id');
				window.location.href = "playlist.html#"+id;
			});
			
			$('header input.PlaylistSearch').on('change input',(e)=>{
				let input = $('header input.PlaylistSearch');
				let filter = input.val().toUpperCase();
				let tr = $('main table.Playlists tbody tr');
				
				for (i = 0; i < tr.length; i++){
				let td = $('td', tr[i])[0];
					if (td){
						let txtValue = td.textContent || td.innerText;
						if (txtValue.toUpperCase().indexOf(filter) > -1){
							tr[i].style.display = "";
						} else {
							tr[i].style.display = "none";
						}
					}
				}
			});
			
			
			
		}
	});
});