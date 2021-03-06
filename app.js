var express = require('express'),
    currentAmpere = require('./routes/currentAmpere'),
    http = require('http'),
    path = require('path');

var app = express();
 
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
 
app.get('/', currentAmpere.index);
app.get('/currentAmpere', currentAmpere.findLast);
app.get('/currentNatureRemo', currentAmpere.findLastNatureRemo);
app.get('/lastNAmpere', currentAmpere.findLastN);
app.get('/update', currentAmpere.update);
app.get('/updateNatureRemo', currentAmpere.updateNatureRemo);

app.listen(app.get('port'));
console.log('Listening on port 3000...');
