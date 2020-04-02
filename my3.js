var user_fir = "";                      // загруженный пользователем импульс
var gPack = 2;							// номер пака оконечников
var gFirPack = 0;						// номер пака импульсов

var firName = "";						// имя импульса, для солянки при сохранении
var ampName = "";						// имя ампа, для солянки при сохранении

/* ---------------------------------------------------------- */
/*                    приватные функции                       */
/* ---------------------------------------------------------- */


// переводит 4 битное число в аски код.
function bit4(c){
	return String.fromCharCode( (c < 10) ? (48+c) : (65+c-10) )
}

// перевод бинарного в аски хекс строку
function bin2hex(b){
	var h = "" , ascii;
	for (let i = 0; i < b.length; i ++) {
	//console.log(b[i]);
		ascii = b[i].charCodeAt(0);
		h += bit4(ascii >> 4);
		h += bit4(ascii & 15);
	}
return h;
}


// парсинг вавки в формат little endian в big , 24 bit -> 28(32)bit
// на входе - вавка 24 бит хекс строкой. на выходе вавка 32бит биг хекс строкой
function wav2adau(w){
	var c0, c1, c2, c3, b="" , i=0 , x , z;
	w =  w.substring(88);				// отрезание шапки wav , 44 x2
	for(x = 0; x < w.length/6; x++) {		// TODO ловить если длина не кратна 6
		c0 = w[i++] + w[i++];
		c1 = w[i++] + w[i++];
		c2 = w[i++] + w[i++];
		z = c2.charCodeAt(0);

		if ( z >= 56 ) c3 = "ff";			// 56 ="8" >= "8x" , utf16
		else c3 = "00";
		b += c3 + c2 + c1 + c0;				// Big
	 }
	return b;
}


// перевод хекс стринга в адау хекс
function patch2hex(data) {
	var o = "" , x = 0;
	for (let i = 0; i < data.length; i += 2) {
		o += "0x" + data[i] + data[i+1] + " ,";
		if ( (++x % 8) == 0) o += "\r\n";									// 8 колонок
		else o += " ";
	}
	return o;
}


// склеивает одиночный патч по селекторам, обрезает лишнее, возвращает склеенное
// вход - ничего , выход - хекс строка
function make_patch(){
	var fir , o;

	let jselfir = document.getElementById('list_fir');
	let jselamp = document.getElementById('list_amp');
	let fir_index = jselfir.selectedIndex;
	let amp_index = jselamp.selectedIndex;

	//console.log(fir_index , amp_index );
	if (user_fir == "")  {
		fir = wbody[gFirPack][fir_index];
		firName = wname[gFirPack][fir_index];								// имя импульса
	}
	else fir = user_fir;

	ampName = AMP[gPack][amp_index][0];
	//console.log(user_fir.length , user_fir);
	o = AMP[gPack][amp_index][1] + wav2adau(fir); 		// первый кусок
	//console.log(o.length , o);
	o = o.substr(0,  2*AMP[gPack][amp_index][3] ) 	+ AMP[gPack][amp_index][2] ;	// (X + FIR) + Y
	//console.log(o.length , o);
	return o;
}


// склеивает патч. Импульс - селектор , амп - параметром
// вход - номер ампа , выход - хекс строка
function make_patch_i(amp_index){
	var fir , o;

	let jselfir = document.getElementById('list_fir');
	let jselamp = document.getElementById('list_amp');
	let fir_index = jselfir.selectedIndex;

	if (user_fir == "")  fir = wbody[gFirPack][fir_index];
	else fir = user_fir;
	o = AMP[gPack][amp_index][1] + wav2adau(fir); 		// первый кусок
	o = o.substr(0,  2*AMP[gPack][amp_index][3] ) 	+ AMP[gPack][amp_index][2] ;	// (X + FIR) + Y
	return o;
}



// заполнение списка оконечников при старте страницы, или смене пака.
// вход берется с глобальной gPack
// выход - выпадающий список
function fillAmpList() {
 var jsel = document.getElementById('list_amp');
 for(var i = 0; i < AMP[gPack].length; i++) {
    var opt = document.createElement('option');
    opt.innerHTML = 	AMP[gPack][i][0];
    opt.value = 	AMP[gPack][i][0];
    jsel.appendChild(opt);
  }
}



// сохранятель файла
// на входе данные и имя файла
function jSaver(o , name, ext) {

	name = name.replace(/[^a-zA-Z0-9]/g,'_');				// чистка имени от мусора

	var saveByteArray = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, name) {
			var blob = new Blob(data, {type: "octet/stream"}),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = name;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}());
	saveByteArray([o], name + "." + ext);
}




/* ---------------------------------------------------------- */
/*                     Публичные функции                      */
/* ---------------------------------------------------------- */

// Чтение Wav пользователя
function readSingleFile(e) {
	var file = e.target.files[0];
	if (!file) { return;  }
	var reader = new FileReader();
	reader.onload = function(e) {
		user_fir = bin2hex(e.target.result);
		//firName = e.
	};
	reader.readAsBinaryString(file);
	firName = file.name.split('.').slice(0, -1).join('.')
//	console.log(firName);
}



// *** после загрузки страницы ***
function start() {
 // fir
 var jsel = document.getElementById('list_fir');
 for(var i = 0; i < wname[0].length; i++) {
    var opt = document.createElement('option');
    opt.innerHTML = wname[gFirPack][i];
    opt.value = wname[gFirPack][i];
    jsel.appendChild(opt);
  }
  fillAmpList();

// list_apack amp pack
 jsel = document.getElementById('list_apack');

    var opt = document.createElement('option');
    opt.innerHTML = "Alpha version (demo)";
    opt.value = 	"Alpha version (demo)";
    jsel.appendChild(opt);

    opt = document.createElement('option');
    opt.innerHTML = "Alpha High Gain (demo)";
    opt.value = 	"Alpha High Gain (demo)";
    jsel.appendChild(opt);

    opt = document.createElement('option');
    opt.innerHTML = "Version 1.0";
    opt.value = 	"Version 1.0";
    opt.selected = true ;
    jsel.appendChild(opt);
    document.getElementById('list_apack').addEventListener('change', ampPackChange, false);
    document.getElementById('file-input').addEventListener('change', readSingleFile, false);
}



// если сменили номер пака оконечников
function ampPackChange(){
	var psel = document.getElementById('list_amp');

	let l = psel.options.length;				// чистка списка
	console.log(l);
	for (i = l-1; i >= 0; i--) {
	  psel.options[i] = null;
	}
	gPack = document.getElementById('list_apack').selectedIndex;
	fillAmpList();						// загрузка нового
}



// сохранение бинарника по клику кнопки. Для отладки
function save_file_bin() {
	var i,  data = make_patch() ;
	var o = new Uint8Array(data.length/2);

	for (i = 0; i < 2*o.length; i += 2) {
	        o[i/2] = parseInt( data[i] + data[i+1] , 16);
	}

	jSaver(o, ampName.substr(0,8) + "_" + firName.substr(0,8) + "_bin", "txt");
}


// сохранение адаухекса по клику кнопки
function save_file_hex() {
	var o = patch2hex( make_patch() );
	jSaver(o, ampName.substr(0,8) + "__" + firName.substr(0,8) , "hex");
}



// Запись пака (кнопка)
function save_file_pack(){
	var zip = new JSZip();
	for(var i = 1; i <= AMP[gPack].length; i++) {
		let name = AMP[gPack][i-1][0].substr(0,8);
	    name = name.replace(/[^a-zA-Z0-9]/g,'_') + ".hex";
		//	console.log(name);
		zip.folder("AFX_HEX/"+i).file(name, patch2hex( make_patch_i(i-1) ) );
	}
	var o = zip.generate({type:"blob"});
	jSaver(o, "cabzone", "zip");
}
