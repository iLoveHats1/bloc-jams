var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;


var setSong = function(songNumber) {
  if (currentSoundFile) {
    currentSoundFile.stop();
  }

  currentlyPlayingSongNumber = parseInt(songNumber);
  currentSongFromAlbum = currentAlbum.songs[songNumber -1];
  currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
    
    formats: [ 'mp3' ],
    preload: true
  });

  setVolume(currentVolume);
};

var seek = function(time) {
  if (currentSoundFile) {
    currentSoundFile.setTime(time);
  }
}
 

var setVolume = function(volume) {
  if (currentSoundFile) {
    currentSoundFile.setVolume(volume);
  }

};

var getSongNumberCell = function(number) {
  return $('song-item-number [data-song-number="' + number + ' "]');
};


var createSongRow = function(songNumber, songName, songLength) {
  var template =
    '<tr class="album-view-song-item">'
    + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    + '  <td class="song-item-title">' + songName + '</td>'
    + '  <td class="song-item-duration">' + (filterTimeCode(songLength)) + '</td>'
    + '</tr>';
 
  var $row = $(template);

  var clickHandler = function() {

    var songNumber = parseInt ($(this).attr('data-song-number'));
    
    if (currentlyPlayingSongNumber !== null) {
      var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
      currentlyPlayingCell.html(currentlyPlayingSongNumber);
    }

    if (currentlyPlayingSongNumber !== songNumber) {
      setSong(songNumber);
      currentSoundFile.play();
      $(this).html (pauseButtonTemplate);
          
      currentSongFromAlbum = currentAlbum.songs [songNumber -1];

      var $volumeFill = $('.volume .fill');
      var $volumeThumb = $('.volume .thumb');
      $volumeFill.width(currentVolume + '%');
      $volumeThumb.css({left: currentVolume + '%'});

      updatePlayerBarSong();
    } else if (currentlyPlayingSongNumber === songNumber) {

      if (currentSoundFile.isPaused()) {
        $(this).html(pauseButtonTemplate);
        $('.main-controls .play-pause').html(playerBarPauseButton);
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();
      } else {
        $(this).html(playButtonTemplate);
        $('main-controls .play-pause').html(playerBarPlayButton);
        currentSoundFile.pause();
      }
    }
 };

  var onHover = function(event) {
    var songNumberCell = $(this).find('song-item-number');
    var songNumber =  parseInt(songNumberCell.attr('data-song-number'));

      if(songNumber !== currentlyPlayingSongNumber) {
        songNumberCell.html (playButtonTemplate);
      }
  };

  var offHover = function(event) {
    var songNumberCell = $(this).find('song-item-number');
    var songNumber = parseInt(songNumberCell.attr('data-song-number'));

      if(songNumber !== currentlyPlayingSongNumber) {
        songNumberCell.html (songNumber);
      }     
  };

  $row.find('.song-item-number').click(clickHandler);
     
  $row.hover(onHover, offHover);
    
  return $row;    
};
    
var $albumTitle = $('.album-view-title');
var $albumArtist = $('.album-view-artist');
var $albumReleaseInfo = $('.album-view-release-info');
var $albumImage = $('.album-cover-art');
var $albumSongList = $('.album-view-song-list');

var setCurrentAlbum = function(album) {
  currentAlbum = album;

  $albumTitle.text(album.title);
  $albumArtist.text(album.artist);
  $albumReleaseInfo.text(album.year + ' ' + album.label);
  $albumImage.attr('src', album.albumArtUrl);
     // #3
  $albumSongList.empty();
 
  for (var i = 0; i < album.songs.length; i++) {
    var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
      $albumSongList.append($newRow);
  }
};

var updateSeekBarWhileSongPlays = function() {
  if (currentSoundFile) {
         // #10
    currentSoundFile.bind('timeupdate', function(event) {
             // #11
      var seekBarFillRatio = this.getTime() / this.getDuration();
      var $seekBar = $('.seek-control .seek-bar');
 
      updateSeekPercentage($seekBar, seekBarFillRatio);
      setCurrentTimeInPlayerBar();
    });
  }
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    //*** multiple ratio by 100 to get percent ***//
    var offsetXPercent = seekBarFillRatio * 100;
    //*** Make sure percent is 0< and >=100 ***//
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
 
    //*** convert percentage to a string. ***//
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

var setupSeekBars = function() {
  //*** find all elements with a class of seek-bar within the class of player-bar ***//
  var $seekBars = $('.player-bar .seek-bar');
 
  $seekBars.click(function(event) {
    //*** seekbar is clicked, seekbar position determined ***//
    var offsetX = event.pageX - $(this).offset().left;
    var barWidth = $(this).width();
    var seekBarFillRatio = offsetX / barWidth;

      if ($(this).parent().attr('class') == 'seek-control') {
        seek(seekBarFillRatio * currentSoundFile.getDuration());
      } else {
        setVolume(seekBarFillRatio * 100);   
      }
 
      updateSeekPercentage($(this), seekBarFillRatio);
  });

  $seekBars.find('.thumb').mousedown(function(event) {
    var $seekBar = $(this).parent();
 
         // #9
    $(document).bind('mousemove.thumb', function(event){
      var offsetX = event.pageX - $seekBar.offset().left;
      var barWidth = $seekBar.width();
      var seekBarFillRatio = offsetX / barWidth;

        if ($seekBar.parent().attr('class') == 'seek-control') {
          seek(seekBarFillRatio * currentSoundFile.getDuration());   
        } else {
          setVolume(seekBarFillRatio);
        }
        updateSeekPercentage($seekBar, seekBarFillRatio);
  });
 
         // #10
         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
};

var setCurrentTimeInPlayerBar = function(currentTime) {
  //*** set the text of .current-time class to current time in the song ***//
  var $currentTime = $('.current-time');
  $currentTime.text(currentTime);
};

var setTotalTimeInPlayerBar = function(totalTime){
  //*** set text of .total-time class to the length of the song
  var $totalTime = $('.total-time');
  $totalTime.text(totalTime);

};

var filterTimeCode = function (timeInSeconds) {
  var wholeSecs = parseFloat(timeInSeconds);
  var wholeMins = Math.floor(wholeSecs/60);
  var remainder = Math.floor(wholeSecs%60);

  return wholeMins + ":" + remainder;
  
};

var trackIndex = function(album, song) {
  return album.songs.indexOf(song);
};

var nextSong = function() {
    
    var getLastSongNumber = function(index) {
        return index == 0 ? currentAlbum.songs.length : index;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _incrementing_ the song here
    currentSongIndex++;
    
    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }
    
    // Set a new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    updatePlayerBarSong();

    
    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var previousSong = function() {
    
    var getLastSongNumber = function(index) {
        return index == (currentAlbum.songs.length - 1) ? 1 : index + 2;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex--;
    
    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }
    
    // Set a new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    updatePlayerBarSong();
    
    
    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $previousSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var updatePlayerBarSong = function() {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    setTotalTimeInPlayerBar();
 };

var togglePlayFromPlayerBar = function() {
  var $currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);   

  if (currentSoundFile.isPaused()) {
    
    $currentlyPlayingCell.html(pauseButtonTemplate);
    $(this).html(playerBarPauseButton);
    
    currentSoundFile.play();
    
  } else if(currentSoundFile) {
    
    $currentlyPlayingCell.html(playButtonTemplate);
    $(this).html(playerBarPlayButton);
    
    currentSoundFile.pause();

  }

};
 
 

 // Album button templates
 var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
 var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
 var playerBarPlayButton = '<span class="ion-play"></span>';
 var playerBarPauseButton = '<span class="ion-pause"></span>';


 // Store state of playing songs

var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null; 

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $mainControls = $('.main-controls .play-pause')

var albums = [albumPicasso, albumMarconi, albumJohnson];
var index = 1;
var albumImage = $('.album-cover-art');

albumImage.on("click", function(event){
    setCurrentAlbum(albums[index]);
    index ++;
    if (index == albums.length) {
        index = 0;
    };
});
$(document).ready(function() {
  setCurrentAlbum(albumPicasso);
  setupSeekBars();

  $previousButton.click(previousSong);
  $nextButton.click(nextSong);
  $mainControls.click(togglePlayFromPlayerBar);
});
