var exports = module.exports = {};
var ref = require('ref');
var ffi = require('ffi');
var Struct = require('ref-struct');

var enumWindowsArray = {};
var enumWindowsTimeout;
var enumWindowsCallback;

var voidPtr = ref.refType(ref.types.void);
var stringPtr = ref.refType(ref.types.CString);
var Rect = Struct({
    left: 'long',
    top: 'long',
    right: 'long',
    bottom: 'long'
});
var RectPtr = ref.refType(Rect);

var user32 = ffi.Library('user32.dll', {
  EnumWindows : ['bool', [voidPtr, 'int32']],
  FindWindowW : ['int', ['string', 'string']],
  ShowWindow : ['int', ['int', 'int']],
  CloseWindow  : ['long', ['long']],
  GetWindowTextA  : ['long', ['long', stringPtr, 'long']],
  GetWindowTextLengthA  : ['long', ['long']],
  IsWindowVisible  : ['bool', ['long']],
  GetWindowRect : ['bool', ['long', RectPtr]],
  PostMessageA : ['bool', ['long', 'uint', 'long', 'long']],
  SetForegroundWindow: ['bool', ['long']]
});

const WM_CLOSE = 0x0010;

function TEXT(text){
  return new Buffer(text, 'ucs2').toString('binary');
}

exports.visableWindows = function(callback){
  enumWindowsArray = {};
  enumWindowsCallback = callback;
  user32.EnumWindows(ffi.Callback('bool', ['long', 'int32'], function(hwnd, lParam) {
    clearTimeout(enumWindowsTimeout);
    //enumWindowsTimeout = setTimeout(enumWindowsCallback,50,enumWindowsArray); // 50ms after last run, assume ended
    enumWindowsTimeout = setTimeout(enumWindowsCallback,50,enumWindowsArray); // 50ms after last run, assume ended
    if (!user32.IsWindowVisible(hwnd)) return true;
    var length = user32.GetWindowTextLengthA(hwnd);
    if (length == 0) return true;

    var buf = new Buffer(length+1);
    user32.GetWindowTextA(hwnd, buf, length+1);
    var name = ref.readCString(buf, 0);

    enumWindowsArray[hwnd] = name;

    return true;
  }), 0);
};

exports.findWindow = function(name){
  for(i=0;i<50;i++){ //ensure accurate reading, sometimes returns 0 when window does exist
    handle = user32.FindWindowW(null, TEXT(name));
    if(handle!==0){break;}
  }
  return handle;
};

exports.hideWindow = function(handle){
  if(typeof handle === 'object'){
    handle.forEach(function(e){user32.CloseWindow(e);});
  }else if(typeof handle === 'number'){
    user32.CloseWindow(handle);
  }else{
    Error("Handle wasn't array/number")
  }
};

exports.showWindow = function(handle){
  if(typeof handle === 'object'){
    handle.forEach(function(e){user32.SetForegroundWindow(e);});
  }else if(typeof handle === 'number'){
    user32.SetForegroundWindow(handle);
  }else{
    Error("Handle wasn't array/number")
  }
};

exports.setWindow = function(handle, state){
  if(typeof handle === 'object'){
    handle.forEach(function(e){user32.ShowWindow(e, state);});
  }else if(typeof handle === 'number'){
    user32.ShowWindow(handle, state); //use values from https://msdn.microsoft.com/en-us/library/windows/desktop/ms633548.aspx
  }else{
    Error("Handle wasn't array/number")
  }
};

exports.getWindowPosition = function(handle) {
    if(typeof handle === 'number'){

        if (!user32.IsWindowVisible(handle)) {
           return false;
        }

        var rectObject = new Rect();
        user32.GetWindowRect(handle, rectObject.ref());

        return rectObject;
    }

    return false;
};

exports.closeWindow = function(handle){
  if(typeof handle === 'object'){
    handle.forEach(function(e){console.log(user32.PostMessageA(handle, WM_CLOSE, 0, 0))});
  }else if(typeof handle === 'number'){
      console.log(user32.PostMessageA(handle, WM_CLOSE, 0, 0));
  }else{
    Error("Handle wasn't array/number")
  }
};
