if(process.platform=='win32'){

var hide = require('./main.js');

var handle = hide.findWindow('Untitled - Notepad')

hide.hideWindow(handle);
setTimeout(function(){hide.showWindow(handle);},500);

}